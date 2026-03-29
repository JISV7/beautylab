"""Company Info router for managing company information."""

import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin
from app.database import get_db
from app.models.company_info import CompanyInfo
from app.models.user import User
from app.schemas.company_info import (
    CompanyInfoCreate,
    CompanyInfoResponse,
    CompanyInfoUpdate,
)

router = APIRouter(prefix="/company-info", tags=["Company Info"])

UPLOAD_DIR = "uploads/company_logos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_LOGO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}


@router.get("", response_model=list[CompanyInfoResponse])
async def list_company_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get all company information records."""
    result = await db.execute(select(CompanyInfo).order_by(CompanyInfo.id))
    companies = result.scalars().all()
    return [CompanyInfoResponse.model_validate(company) for company in companies]


@router.post("/upload-logo", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_company_logo(
    file: UploadFile = File(...),
):
    """Upload a company logo image."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_LOGO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_LOGO_EXTENSIONS)}",
        )

    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )

    image_url = f"/static/company_logos/{unique_filename}"

    return {
        "url": image_url,
        "filename": unique_filename,
        "original_filename": file.filename,
        "content_type": file.content_type,
    }


@router.get("/{company_id}", response_model=CompanyInfoResponse)
async def get_company_info(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get a specific company information record."""
    result = await db.execute(select(CompanyInfo).where(CompanyInfo.id == company_id))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")

    return CompanyInfoResponse.model_validate(company)


@router.post("", response_model=CompanyInfoResponse, status_code=status.HTTP_201_CREATED)
async def create_company_info(
    company_data: CompanyInfoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Create a new company information record."""
    # Check if company with same RIF already exists
    existing = await db.execute(select(CompanyInfo).where(CompanyInfo.rif == company_data.rif))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company with this RIF already exists",
        )

    company = CompanyInfo(**company_data.model_dump())
    db.add(company)
    await db.commit()
    await db.refresh(company)

    return CompanyInfoResponse.model_validate(company)


@router.patch("/{company_id}", response_model=CompanyInfoResponse)
async def update_company_info(
    company_id: int,
    company_data: CompanyInfoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Update company information."""
    result = await db.execute(select(CompanyInfo).where(CompanyInfo.id == company_id))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")

    # Check RIF uniqueness if being updated
    if company_data.rif and company_data.rif != company.rif:
        existing = await db.execute(
            select(CompanyInfo).where(
                CompanyInfo.rif == company_data.rif, CompanyInfo.id != company_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company with this RIF already exists",
            )

    # Update fields
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    await db.commit()
    await db.refresh(company)

    return CompanyInfoResponse.model_validate(company)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company_info(
    company_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Delete a company information record."""
    result = await db.execute(select(CompanyInfo).where(CompanyInfo.id == company_id))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company info not found")

    await db.delete(company)
    await db.commit()
