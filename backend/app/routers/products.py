"""Products router."""

import os
import shutil
import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser
from app.database import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductStats,
    ProductUpdate,
    ProductWithDetails,
)
from app.services.product_service import (
    ProductDuplicateSKUError,
    ProductInUseError,
    ProductNotFoundError,
    ProductService,
)

router = APIRouter(prefix="/products", tags=["Products"])

UPLOAD_DIR = "uploads/courses"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.get("/", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    is_active: bool | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> ProductListResponse:
    """List all products with pagination and filters.

    Public endpoint - returns active products by default.
    Use is_active=null to see all products (admin).
    """
    product_service = ProductService(db)
    products, total = await product_service.get_all_products(
        page=page,
        page_size=page_size,
        is_active=is_active,
        search=search,
    )

    total_pages = (total + page_size - 1) // page_size

    return ProductListResponse(
        products=[ProductResponse.model_validate(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats", response_model=ProductStats)
async def get_product_statistics(
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> ProductStats:
    """Get product statistics (admin only)."""
    product_service = ProductService(db)
    stats = await product_service.get_product_statistics()
    return ProductStats(**stats)


@router.get("/{product_id}", response_model=ProductWithDetails)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ProductWithDetails:
    """Get a specific product by ID."""
    product_service = ProductService(db)
    product = await product_service.get_product_by_id(product_id)

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found",
        )

    # Build response with associated course/learning path info
    course_title = product.course.title if product.course else None
    learning_path_title = product.learning_path.title if product.learning_path else None

    return ProductWithDetails(
        id=product.id,
        name=product.name,
        description=product.description,
        sku=product.sku,
        price=product.price,
        tax_rate=product.tax_rate,
        tax_type=product.tax_type,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        course_title=course_title,
        learning_path_title=learning_path_title,
    )


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Create a new product (admin only)."""
    product_service = ProductService(db)

    try:
        product = await product_service.create_product(product_data)
    except ProductDuplicateSKUError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Update an existing product (admin only)."""
    product_service = ProductService(db)

    try:
        product = await product_service.update_product(product_id, product_data)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ProductDuplicateSKUError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a product (admin only).

    Only deletes if product is not linked to any course or learning path.
    """
    product_service = ProductService(db)

    try:
        await product_service.delete_product(product_id)
    except ProductNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ProductInUseError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get("/{product_id}/can-delete")
async def check_can_delete_product(
    product_id: UUID,
    current_user: User = Depends(CurrentUser),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Check if a product can be safely deleted (admin only)."""
    product_service = ProductService(db)
    can_delete, message = await product_service.can_delete_product(product_id)

    return {
        "can_delete": can_delete,
        "message": message,
        "product_id": str(product_id),
    }


@router.post("/upload-image", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_course_image(
    file: UploadFile = File(..., description="Image file to upload"),
):
    """Upload a course image.

    Returns the URL where the image can be accessed.
    """
    # Validate that file has a filename
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
        )

    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    # The URL that the frontend will load it from
    image_url = f"/static/courses/{unique_filename}"

    return {
        "url": image_url,
        "filename": unique_filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
    }
