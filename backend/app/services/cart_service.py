"""Shopping cart service."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cart_item import CartItem
from app.models.product import Product


class CartItemNotFoundError(ValueError):
    """Raised when a cart item is not found."""

    pass


class ProductNotFoundError(ValueError):
    """Raised when a product is not found."""

    pass


class CartService:
    """Service for shopping cart operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_cart_items(
        self,
        user_id: UUID,
    ) -> list[CartItem]:
        """Get all cart items for a user."""
        result = await self.db.execute(select(CartItem).where(CartItem.user_id == user_id))
        return list(result.scalars().all())

    async def get_cart_item_by_id(
        self,
        cart_item_id: UUID,
    ) -> CartItem | None:
        """Get cart item by ID."""
        result = await self.db.execute(select(CartItem).where(CartItem.id == cart_item_id))
        return result.scalar_one_or_none()

    async def get_cart_item_by_product(
        self,
        user_id: UUID,
        product_id: UUID,
    ) -> CartItem | None:
        """Get cart item for a specific product."""
        result = await self.db.execute(
            select(CartItem)
            .where(CartItem.user_id == user_id)
            .where(CartItem.product_id == product_id)
        )
        return result.scalar_one_or_none()

    async def add_to_cart(
        self,
        user_id: UUID,
        product_id: UUID,
        quantity: int = 1,
    ) -> CartItem:
        """
        Add item to cart or update quantity if exists.

        Args:
            user_id: User adding to cart
            product_id: Product to add
            quantity: Quantity to add

        Returns:
            Cart item (created or updated)
        """
        # Verify product exists
        product = await self._get_product_by_id(product_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")

        # Check if item already in cart
        existing_item = await self.get_cart_item_by_product(user_id, product_id)

        if existing_item:
            # Update quantity
            existing_item.quantity += quantity
            await self.db.commit()
            await self.db.refresh(existing_item)
            return existing_item
        else:
            # Create new cart item
            cart_item = CartItem(
                user_id=user_id,
                product_id=product_id,
                quantity=quantity,
            )
            self.db.add(cart_item)
            await self.db.commit()
            await self.db.refresh(cart_item)
            return cart_item

    async def update_cart_item_quantity(
        self,
        cart_item_id: UUID,
        quantity: int,
    ) -> CartItem:
        """
        Update cart item quantity.

        Args:
            cart_item_id: Cart item to update
            quantity: New quantity

        Returns:
            Updated cart item
        """
        cart_item = await self.get_cart_item_by_id(cart_item_id)
        if not cart_item:
            raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")

        cart_item.quantity = quantity
        await self.db.commit()
        await self.db.refresh(cart_item)
        return cart_item

    async def remove_from_cart(
        self,
        cart_item_id: UUID,
    ) -> bool:
        """Remove item from cart."""
        cart_item = await self.get_cart_item_by_id(cart_item_id)
        if not cart_item:
            raise CartItemNotFoundError(f"Cart item {cart_item_id} not found")

        await self.db.delete(cart_item)
        await self.db.commit()
        return True

    async def clear_cart(
        self,
        user_id: UUID,
    ) -> int:
        """
        Clear all items from user's cart.

        Returns:
            Number of items removed
        """
        items = await self.get_cart_items(user_id)
        for item in items:
            await self.db.delete(item)
        await self.db.commit()
        return len(items)

    async def get_cart_summary(
        self,
        user_id: UUID,
    ) -> dict:
        """
        Get cart summary with totals.

        Returns:
            dict with items, total_items, subtotal, tax_total, total
        """
        # Single query with JOIN — no N+1
        result = await self.db.execute(
            select(CartItem, Product)
            .outerjoin(Product, CartItem.product_id == Product.id)
            .where(CartItem.user_id == user_id)
        )
        rows = result.all()

        total_items = 0
        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")
        enriched_items = []

        for item, product in rows:
            if product:
                total_items += item.quantity
                line_subtotal = product.price * item.quantity
                subtotal += line_subtotal

                if product.tax_type != "exento":
                    tax_amount = line_subtotal * (product.tax_rate / Decimal("100"))
                    tax_total += tax_amount

                enriched_items.append(
                    {
                        "id": item.id,
                        "user_id": item.user_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "created_at": item.created_at,
                        "updated_at": item.updated_at,
                        "product_name": product.name,
                        "product_price": product.price,
                        "product_sku": product.sku,
                    }
                )
            else:
                # Product deleted but cart item still exists
                enriched_items.append(
                    {
                        "id": item.id,
                        "user_id": item.user_id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "created_at": item.created_at,
                        "updated_at": item.updated_at,
                        "product_name": None,
                        "product_price": None,
                        "product_sku": None,
                    }
                )

        total = subtotal + tax_total

        return {
            "items": enriched_items,
            "total_items": total_items,
            "subtotal": subtotal,
            "tax_total": tax_total,
            "total": total,
        }

    async def _get_product_by_id(self, product_id: UUID) -> Product | None:
        """Get product by ID."""
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()
