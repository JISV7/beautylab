"""Invoice service for billing operations."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invoice import Invoice, InvoiceAdjustment, InvoiceLine
from app.models.product import Product
from app.schemas.invoice import InvoiceAdjustmentCreate, InvoiceCreate, InvoiceLineCreate


class InvoiceNotFoundError(ValueError):
    """Raised when an invoice is not found."""

    pass


class InvoiceValidationError(ValueError):
    """Raised when invoice validation fails."""

    pass


class InvoiceService:
    """Service for invoice generation and management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_invoice_for_course_purchase(
        self,
        user_id: UUID,
        course_id: UUID,
        product_id: UUID,
        user_email: str,
        user_rif: str | None = None,
        user_business_name: str | None = None,
    ) -> Invoice:
        """
        Create an invoice for a course purchase.

        Args:
            user_id: Purchasing user ID
            course_id: Course being purchased
            product_id: Product associated with the course
            user_email: User's email for notifications
            user_rif: User's RIF (optional)
            user_business_name: User's business name (optional)

        Returns:
            Created invoice
        """
        # Get product details
        product = await self._get_product_by_id(product_id)
        if not product:
            raise InvoiceNotFoundError(f"Product {product_id} not found")

        # Create invoice data
        invoice_data = InvoiceCreate(
            client_id=user_id,
            client_rif=user_rif,
            client_business_name=user_business_name,
            client_document_type=None,
            client_document_number=None,
            client_fiscal_address=None,
            notes=f"Course purchase - Course ID: {course_id}",
            lines=[
                InvoiceLineCreate(
                    product_id=product_id,
                    description=f"Course Enrollment - {product.name}",
                    quantity=Decimal("1"),
                    unit_price=product.price,
                    tax_rate=product.tax_rate,
                    is_exempt=product.tax_exempt,
                )
            ],
            adjustments=[],
        )

        # Create the invoice
        invoice = await self.create_invoice(invoice_data)

        return invoice

    async def get_invoice_by_id(self, invoice_id: UUID) -> Invoice | None:
        """Get invoice by ID."""
        result = await self.db.execute(select(Invoice).where(Invoice.id == invoice_id))
        return result.scalar_one_or_none()

    async def get_invoice_by_number(self, invoice_number: str) -> Invoice | None:
        """Get invoice by invoice number."""
        result = await self.db.execute(
            select(Invoice).where(Invoice.invoice_number == invoice_number)
        )
        return result.scalar_one_or_none()

    async def create_invoice(
        self,
        invoice_data: InvoiceCreate,
    ) -> Invoice:
        """
        Create a new invoice with line items.

        Args:
            invoice_data: Invoice creation data with lines and adjustments

        Returns:
            Created invoice
        """
        # Calculate totals
        totals = await self._calculate_invoice_totals(invoice_data.lines)

        # Get next invoice number and control number
        # For now, using simple generation - in production would use DB sequences
        invoice_number = await self._generate_invoice_number()
        control_number = await self._generate_control_number()

        # Create invoice
        invoice = Invoice(
            invoice_number=invoice_number,
            control_number=control_number,
            control_number_range_id=1,  # Default range - would be dynamic in production
            point_of_sale_id=1,  # Default POS - would be dynamic in production
            issue_date=date.today(),
            issue_time=datetime.now().time(),
            client_id=invoice_data.client_id,
            client_rif=invoice_data.client_rif,
            client_business_name=invoice_data.client_business_name,
            client_document_type=invoice_data.client_document_type,
            client_document_number=invoice_data.client_document_number,
            client_fiscal_address=invoice_data.client_fiscal_address,
            subtotal=totals["subtotal"],
            discount_total=totals["discount_total"],
            tax_total=totals["tax_total"],
            total=totals["total"],
            status="issued",
            notes=invoice_data.notes,
        )

        self.db.add(invoice)
        await self.db.flush()  # Get invoice ID

        # Create line items
        for line_data in invoice_data.lines:
            line = await self._create_invoice_line(invoice.id, line_data)
            self.db.add(line)

        # Create adjustments
        for adj_data in invoice_data.adjustments:
            adj = await self._create_invoice_adjustment(invoice.id, adj_data)
            self.db.add(adj)

        await self.db.commit()
        await self.db.refresh(invoice)

        return invoice

    async def _create_invoice_line(
        self,
        invoice_id: UUID,
        line_data: InvoiceLineCreate,
    ) -> InvoiceLine:
        """Create an invoice line item."""
        # Calculate line totals
        quantity = line_data.quantity
        unit_price = line_data.unit_price
        tax_rate = line_data.tax_rate / Decimal("100")

        subtotal = quantity * unit_price
        tax_amount = subtotal * tax_rate if not line_data.is_exempt else Decimal("0.00")
        line_total = subtotal + tax_amount

        # Get product description if product_id provided
        description = line_data.description
        if line_data.product_id:
            product = await self._get_product_by_id(line_data.product_id)
            if product:
                description = f"{product.name} - {line_data.description}"

        line = InvoiceLine(
            invoice_id=invoice_id,
            product_id=line_data.product_id,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            tax_rate=line_data.tax_rate,
            tax_amount=tax_amount,
            line_total=line_total,
            is_exempt=line_data.is_exempt,
        )

        return line

    async def _create_invoice_adjustment(
        self,
        invoice_id: UUID,
        adj_data: InvoiceAdjustmentCreate,
    ) -> InvoiceAdjustment:
        """Create an invoice adjustment."""
        adjustment = InvoiceAdjustment(
            invoice_id=invoice_id,
            adjustment_type=adj_data.adjustment_type,
            description=adj_data.description,
            amount=adj_data.amount,
            is_percentage=adj_data.is_percentage,
        )
        return adjustment

    async def _calculate_invoice_totals(
        self,
        lines: list[InvoiceLineCreate],
    ) -> dict:
        """
        Calculate invoice totals from line items.

        Returns:
            dict with subtotal, discount_total, tax_total, total
        """
        subtotal = Decimal("0.00")
        tax_total = Decimal("0.00")

        for line in lines:
            line_subtotal = line.quantity * line.unit_price
            subtotal += line_subtotal

            if not line.is_exempt:
                tax_amount = line_subtotal * (line.tax_rate / Decimal("100"))
                tax_total += tax_amount

        discount_total = Decimal("0.00")  # Would calculate from adjustments
        total = subtotal + tax_total - discount_total

        return {
            "subtotal": subtotal,
            "discount_total": discount_total,
            "tax_total": tax_total,
            "total": total,
        }

    async def _generate_invoice_number(self) -> str:
        """Generate next invoice number."""
        # Get last invoice number
        result = await self.db.execute(
            select(Invoice.invoice_number).order_by(Invoice.created_at.desc()).limit(1)
        )
        last_number = result.scalar_one_or_none()

        if last_number:
            # Extract numeric part and increment
            try:
                # Assuming format like "A-00000001"
                parts = last_number.split("-")
                if len(parts) == 2:
                    prefix = parts[0]
                    num = int(parts[1]) + 1
                    return f"{prefix}-{num:08d}"
            except (ValueError, IndexError):
                pass

        # Default starting number
        return "A-00000001"

    async def _generate_control_number(self) -> str:
        """Generate control number."""
        # Simplified generation - in production would use official numbering
        result = await self.db.execute(
            select(Invoice.control_number).order_by(Invoice.created_at.desc()).limit(1)
        )
        last_control = result.scalar_one_or_none()

        if last_control:
            try:
                num = int(last_control) + 1
                return f"{num:012d}"
            except ValueError:
                pass

        return "000000000001"

    async def _get_product_by_id(self, product_id: UUID) -> Product | None:
        """Get product by ID."""
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        return result.scalar_one_or_none()

    async def get_user_invoices(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Invoice], int]:
        """Get all invoices for a user."""
        query = select(Invoice).where(Invoice.client_id == user_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Invoice.created_at.desc())

        result = await self.db.execute(query)
        invoices = list(result.scalars().all())

        return invoices, total

    async def get_invoice_with_details(
        self,
        invoice_id: UUID,
    ) -> Invoice | None:
        """Get invoice with line items and adjustments."""
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Invoice)
            .options(
                selectinload(Invoice.lines),
                selectinload(Invoice.adjustments),
            )
            .where(Invoice.id == invoice_id)
        )
        return result.scalar_one_or_none()

    async def get_invoice_receipt_data(
        self,
        invoice_id: UUID,
    ) -> dict | None:
        """
        Get invoice data formatted for receipt email.

        Returns:
            Dictionary with invoice data for email template
        """
        invoice = await self.get_invoice_with_details(invoice_id)
        if not invoice:
            return None

        # Get user email if available
        user_email = None
        if invoice.client_id:
            from app.models.user import User

            user_result = await self.db.execute(
                select(User.email).where(User.id == invoice.client_id)
            )
            user_email = user_result.scalar_one_or_none()

        # Format line items
        items = []
        for line in invoice.lines:
            items.append(
                {
                    "description": line.description,
                    "quantity": str(line.quantity),
                    "unit_price": str(line.unit_price),
                    "line_total": str(line.line_total),
                }
            )

        return {
            "invoice_number": invoice.invoice_number,
            "total": str(invoice.total),
            "issue_date": invoice.issue_date.isoformat(),
            "items": items,
            "user_email": user_email,
            "subtotal": str(invoice.subtotal),
            "tax_total": str(invoice.tax_total),
        }
