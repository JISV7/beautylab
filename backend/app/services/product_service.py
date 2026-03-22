"""Product service for business logic operations."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductNotFoundError(ValueError):
    """Raised when a product is not found."""

    pass


class ProductDuplicateSKUError(ValueError):
    """Raised when attempting to create a product with a duplicate SKU."""

    pass


class ProductInUseError(ValueError):
    """Raised when attempting to delete a product that is in use."""

    pass


class ProductService:
    """Service for product management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_product_by_id(self, product_id: UUID) -> Product | None:
        """Get product by ID."""
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def get_product_by_sku(self, sku: str) -> Product | None:
        """Get product by SKU."""
        result = await self.db.execute(select(Product).where(Product.sku == sku))
        return result.scalar_one_or_none()

    async def get_all_products(
        self,
        page: int = 1,
        page_size: int = 10,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[Product], int]:
        """
        Get all products with pagination and filters.

        Args:
            page: Page number (1-indexed)
            page_size: Number of items per page
            is_active: Filter by active status
            search: Search in name and description

        Returns:
            Tuple of (products list, total count)
        """
        # Build base query
        query = select(Product)

        # Apply filters
        if is_active is not None:
            query = query.where(Product.is_active == is_active)

        if search:
            search_filter = f"%{search}%"
            query = query.where(
                (Product.name.ilike(search_filter))
                | (Product.description.ilike(search_filter))
                | (Product.sku.ilike(search_filter))
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Product.name)

        result = await self.db.execute(query)
        products = list(result.scalars().all())

        return products, total

    async def create_product(self, product_data: ProductCreate) -> Product:
        """Create a new product."""
        # Check for duplicate SKU
        existing = await self.get_product_by_sku(product_data.sku)
        if existing:
            raise ProductDuplicateSKUError(f"Product with SKU '{product_data.sku}' already exists")

        product = Product(
            name=product_data.name,
            description=product_data.description,
            sku=product_data.sku,
            price=product_data.price,
            tax_rate=product_data.tax_rate,
            tax_type=product_data.tax_type,
            is_active=product_data.is_active,
        )

        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def update_product(
        self,
        product_id: UUID,
        product_data: ProductUpdate,
    ) -> Product:
        """Update an existing product."""
        product = await self.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"Product with ID {product_id} not found")

        # Check for duplicate SKU if updating SKU
        if product_data.sku is not None and product_data.sku != product.sku:
            existing = await self.get_product_by_sku(product_data.sku)
            if existing:
                raise ProductDuplicateSKUError(
                    f"Product with SKU '{product_data.sku}' already exists"
                )
            product.sku = product_data.sku

        # Update fields
        if product_data.name is not None:
            product.name = product_data.name
        if product_data.description is not None:
            product.description = product_data.description
        if product_data.price is not None:
            product.price = product_data.price
        if product_data.tax_rate is not None:
            product.tax_rate = product_data.tax_rate
        if product_data.tax_type is not None:
            product.tax_type = product_data.tax_type
        if product_data.is_active is not None:
            product.is_active = product_data.is_active

        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product_id: UUID) -> bool:
        """Delete a product (only if not in use)."""
        product = await self.get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"Product with ID {product_id} not found")

        # Check if product is in use by a course
        if product.course is not None:
            raise ProductInUseError(
                f"Cannot delete product - it is linked to course '{product.course.title}'"
            )

        # Check if product is in use by a learning path
        if product.learning_path is not None:
            raise ProductInUseError(
                f"Cannot delete product - it is linked to learning path "
                f"'{product.learning_path.title}'"
            )

        await self.db.delete(product)
        await self.db.commit()
        return True

    async def can_delete_product(self, product_id: UUID) -> tuple[bool, str]:
        """Check if a product can be safely deleted."""
        product = await self.get_product_by_id(product_id)
        if not product:
            return False, f"Product with ID {product_id} not found"

        if product.course is not None:
            return (
                False,
                f"Product is linked to course '{product.course.title}'",
            )

        if product.learning_path is not None:
            return (
                False,
                f"Product is linked to learning path '{product.learning_path.title}'",
            )

        return True, "Product can be safely deleted"

    async def get_product_statistics(self) -> dict:
        """Get product statistics."""
        # Total products
        total_result = await self.db.execute(select(func.count()).select_from(Product))
        total_products = total_result.scalar() or 0

        # Active products
        active_result = await self.db.execute(
            select(func.count()).select_from(Product).where(Product.is_active)
        )
        active_products = active_result.scalar() or 0

        # Total value
        value_result = await self.db.execute(select(func.sum(Product.price)).select_from(Product))
        total_value = value_result.scalar() or Decimal("0.00")

        return {
            "total_products": total_products,
            "active_products": active_products,
            "inactive_products": total_products - active_products,
            "total_value": total_value,
        }

    @staticmethod
    def calculate_badge(product: Product) -> str | None:
        """
        Calculate product badge based on creation date.

        Badges:
        - "new": Created within last 7 days
        - "hot": Created within last 30 days
        - None: Older than 30 days

        This is a frontend-only calculation - no database changes needed.
        """
        now = datetime.now(timezone.utc)
        created_at = product.created_at

        if not created_at:
            return None

        # Make created_at timezone aware if it isn't
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        age = now - created_at

        if age < timedelta(days=7):
            return "new"
        elif age < timedelta(days=30):
            return "hot"

        return None
