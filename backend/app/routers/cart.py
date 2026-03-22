"""Shopping cart router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.cart_item import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
    CheckoutRequest,
    CheckoutResponse,
)
from app.schemas.invoice import InvoiceCreate, InvoiceLineCreate, InvoiceResponse
from app.schemas.license import LicensePurchaseItem, LicensePurchaseRequest, LicenseResponse
from app.services.cart_service import CartItemNotFoundError, CartService, ProductNotFoundError
from app.services.invoice_service import InvoiceService
from app.services.license_service import LicenseService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Clear all items from cart."""
    cart_service = CartService(db)
    await cart_service.clear_cart(user_id=current_user.id)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    request: CheckoutRequest,
    current_user: User = Depends(CurrentUser),
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
        "payment_method": "split"
    }
    ```

    Returns invoice and generated license codes.
    Note: Payment is processed separately via /payments/split endpoint.
    """
    cart_service = CartService(db)
    invoice_service = InvoiceService(db)
    license_service = LicenseService(db)

    # Get cart items
    summary = await cart_service.get_cart_summary(user_id=current_user.id)
    cart_items = summary["items"]

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

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

    # Create invoice
    invoice_data = InvoiceCreate(
        client_id=current_user.id,
        lines=lines,
        adjustments=[],
    )
    invoice = await invoice_service.create_invoice(invoice_data=invoice_data)

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

    return CheckoutResponse(
        invoice=InvoiceResponse.model_validate(invoice),
        licenses=[LicenseResponse.model_validate(lic) for lic in licenses],
        message=f"Checkout complete! Generated {len(licenses)} license(s).",
    )
