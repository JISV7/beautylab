"""Printers router for managing authorized printers."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin
from app.database import get_db
from app.models.printer import Printer
from app.models.user import User
from app.schemas.printer import PrinterCreate, PrinterResponse, PrinterUpdate

router = APIRouter(prefix="/printers", tags=["Printers"])


@router.get("", response_model=list[PrinterResponse])
async def list_printers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get all authorized printers."""
    result = await db.execute(select(Printer).order_by(Printer.id))
    printers = result.scalars().all()
    return [PrinterResponse.model_validate(printer) for printer in printers]


@router.get("/{printer_id}", response_model=PrinterResponse)
async def get_printer(
    printer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get a specific printer."""
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()

    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")

    return PrinterResponse.model_validate(printer)


@router.post("", response_model=PrinterResponse, status_code=status.HTTP_201_CREATED)
async def create_printer(
    printer_data: PrinterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Create a new authorized printer."""
    # Check if printer with same RIF already exists
    existing = await db.execute(select(Printer).where(Printer.rif == printer_data.rif))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Printer with this RIF already exists",
        )

    printer = Printer(**printer_data.model_dump())
    db.add(printer)
    await db.commit()
    await db.refresh(printer)

    return PrinterResponse.model_validate(printer)


@router.patch("/{printer_id}", response_model=PrinterResponse)
async def update_printer(
    printer_id: int,
    printer_data: PrinterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Update printer information."""
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()

    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")

    # Check RIF uniqueness if being updated
    if printer_data.rif and printer_data.rif != printer.rif:
        existing = await db.execute(
            select(Printer).where(Printer.rif == printer_data.rif, Printer.id != printer_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Printer with this RIF already exists",
            )

    # Update fields
    update_data = printer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(printer, field, value)

    await db.commit()
    await db.refresh(printer)

    return PrinterResponse.model_validate(printer)


@router.delete("/{printer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_printer(
    printer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Delete a printer."""
    result = await db.execute(select(Printer).where(Printer.id == printer_id))
    printer = result.scalar_one_or_none()

    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")

    await db.delete(printer)
    await db.commit()
