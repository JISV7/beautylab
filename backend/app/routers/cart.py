"""Shopping cart router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.schemas.cart_item import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
    CheckoutRequest,
    CheckoutResponse,
)
from app.schemas.invoice import InvoiceCreate, InvoiceLineCreate
from app.schemas.license import LicensePurchaseItem, LicensePurchaseRequest
from app.services.cart_service import CartItemNotFoundError, CartService, ProductNotFoundError
from app.services.invoice_service import InvoiceService
from app.services.license_service import LicenseService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=CartResponse)
async def get_cart(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CartResponse:
    """Get current user's shopping cart with totals."""
    cart_service = CartService(db)

    summary = await cart_service.get_cart_summary(user_id=current_user.id)

    return CartResponse(
        items=[CartItemResponse.model_validate(item) for item in summary["items"]],
        total_items=summary["total_items"],
        subtotal=summary["subtotal"],
        tax_total=summary["tax_total"],
        total=summary["total"],
    )


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CartItemResponse:
    """
    Add item to cart.

    Supports quantity > 1 for bulk purchases (gifts, corporate licenses).
    If item already exists, quantity is added to existing quantity.

    **Body:**
    ```json
    {
        "product_id": "uuid",
        "quantity": 2
    }
    ```
    """
    cart_service = CartService(db)

    try:
        cart_item = await cart_service.add_to_cart(
            user_id=current_user.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
        )
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return CartItemResponse.model_validate(cart_item)


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: UUID,
    item_data: CartItemUpdate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CartItemResponse:
    """
    Update cart item quantity.

    **Body:**
    ```json
    {
        "quantity": 5
    }
    ```
    """
    cart_service = CartService(db)

    try:
        cart_item = await cart_service.update_cart_item_quantity(
            cart_item_id=item_id,
            quantity=item_data.quantity,
        )
    except CartItemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e

    return CartItemResponse.model_validate(cart_item)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: UUID,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove item from cart."""
    cart_service = CartService(db)

    try:
        await cart_service.remove_from_cart(cart_item_id=item_id)
    except CartItemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Clear all items from cart."""
    cart_service = CartService(db)
    await cart_service.clear_cart(user_id=current_user.id)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    request: CheckoutRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """
    Process cart checkout.

    Creates:
    1. Invoice with all cart items
    2. Licenses for each unit purchased
    3. Clears the cart

    **Body:**
    ```json
    {
        "license_type": "gift",
        "payment_method": "split",
        "coupon_code": "WELCOME10"  // Optional
    }
    ```

    Returns invoice and generated license codes.
    Note: Payment is processed separately via /payments/split endpoint.
    """
    from decimal import Decimal

    cart_service = CartService(db)
    invoice_service = InvoiceService(db)
    license_service = LicenseService(db)
    coupon_service = None
    discount_amount = Decimal("0.00")

    # Get cart items
    summary = await cart_service.get_cart_summary(user_id=current_user.id)
    cart_items = summary["items"]

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # Validate and apply coupon if provided
    if request.coupon_code:
        from app.services.coupon_service import CouponService

        coupon_service = CouponService(db)
        from app.schemas.coupon import CouponValidateRequest

        try:
            result = await coupon_service.validate_coupon(
                request=CouponValidateRequest(
                    code=request.coupon_code,
                    cart_total=summary["total"],
                ),
                user_id=current_user.id,
            )
            discount_amount = result["discount_amount"]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Coupon error: {str(e)}",
            ) from e

    # Create invoice lines from cart items
    lines = []
    for item in cart_items:
        # Get product details
        from app.services.product_service import ProductService

        product_service = ProductService(db)
        product = await product_service.get_product_by_id(item.product_id)

        if product:
            line = InvoiceLineCreate(
                product_id=product.id,
                description=f"{product.name} ({product.sku})",
                quantity=item.quantity,
                unit_price=product.price,
                tax_rate=product.tax_rate,
                is_exempt=(product.tax_type == "exento"),
            )
            lines.append(line)

    # Create invoice with discount adjustment if coupon was used
    adjustments = []
    if discount_amount > 0 and coupon_service:
        from app.schemas.invoice import InvoiceAdjustmentCreate

        adjustments.append(
            InvoiceAdjustmentCreate(
                adjustment_type="discount",
                description=f"Coupon: {request.coupon_code}",
                amount=discount_amount,
                is_percentage=False,
            )
        )

    # Create invoice
    invoice_data = InvoiceCreate(
        client_id=current_user.id,
        lines=lines,
        adjustments=adjustments,
    )
    invoice = await invoice_service.create_invoice(invoice_data=invoice_data)

    # Apply coupon usage if coupon was used
    if discount_amount > 0 and coupon_service and request.coupon_code:
        coupon = await coupon_service.get_coupon_by_code(request.coupon_code)
        if coupon:
            await coupon_service.apply_coupon(
                coupon_id=coupon.id,
                user_id=current_user.id,
                invoice_id=invoice.id,
            )

    # Create license purchase request
    license_items = []
    for item in cart_items:
        license_item = LicensePurchaseItem(
            product_id=item.product_id,
            quantity=item.quantity,
            license_type=request.license_type,
        )
        license_items.append(license_item)

    license_request = LicensePurchaseRequest(
        items=license_items,
    )

    # Generate licenses
    licenses = await license_service.purchase_licenses(
        request=license_request,
        purchased_by_user_id=current_user.id,
    )

    # Clear cart
    await cart_service.clear_cart(user_id=current_user.id)

    # Send invoice email (async - non-blocking)

    # Note: For true async, use BackgroundTasks or a task queue
    # For now, we'll send synchronously but this could be moved to background
    try:
        from app.services.email_service import get_email_service

        email_service = get_email_service()

        # Get user email
        user_email = current_user.email

        # Prepare invoice items for email
        invoice_items = [
            {
                "description": line.description,
                "quantity": int(line.quantity),
                "unit_price": str(line.unit_price),
                "line_total": str(line.line_total),
            }
            for line in invoice.lines
        ]

        # Send email (in production, use BackgroundTasks)
        email_service.send_invoice_email(
            to_email=user_email,
            invoice_number=invoice.invoice_number,
            total=str(invoice.total),
            issue_date=invoice.issue_date.isoformat(),
            items=invoice_items,
            download_url=f"https://beautylab.com/invoices/{invoice.id}/download",
        )
    except Exception as e:
        # Log error but don't fail checkout
        print(f"Failed to send invoice email: {e}")

    return CheckoutResponse(
        invoice_id=invoice.id,
        licenses=[lic.license_code for lic in licenses],
        message=(
            f"Checkout complete! Generated {len(licenses)} license(s). Invoice sent to {user_email}"
        ),
    )
