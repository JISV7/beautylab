"""Printers router for managing authorized printers."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin
from app.database import get_db
from app.models.user import User
from app.schemas.printer import PrinterCreate, PrinterResponse, PrinterUpdate
from app.services.printer_service import PrinterService

router = APIRouter(prefix="/printers", tags=["Printers"])


@router.get("", response_model=list[PrinterResponse])
async def list_printers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get all authorized printers."""
    service = PrinterService(db)
    printers = await service.get_all()
    return [PrinterResponse.model_validate(printer) for printer in printers]


@router.get("/{printer_id}", response_model=PrinterResponse)
async def get_printer(
    printer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Get a specific printer."""
    service = PrinterService(db)
    printer = await service.get_by_id(printer_id)

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
    service = PrinterService(db)

    # Check if printer with same RIF already exists
    if await service.check_rif_exists(printer_data.rif):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Printer with this RIF already exists",
        )

    printer = await service.create(printer_data)
    return PrinterResponse.model_validate(printer)


@router.patch("/{printer_id}", response_model=PrinterResponse)
async def update_printer(
    printer_id: int,
    printer_data: PrinterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Update printer information."""
    service = PrinterService(db)
    printer = await service.get_by_id(printer_id)

    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")

    # Check RIF uniqueness if being updated
    if printer_data.rif and printer_data.rif != printer.rif:
        if await service.check_rif_exists(printer_data.rif, exclude_id=printer_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Printer with this RIF already exists",
            )

    # Handle is_active change through service
    if printer_data.is_active is not None and printer_data.is_active:
        printer = await service.set_active(printer_id)
    else:
        # Update other fields
        update_data = printer_data.model_dump(exclude_unset=True, exclude={"is_active"})
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
    service = PrinterService(db)

    try:
        success = await service.delete(printer_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{printer_id}/set-active", response_model=PrinterResponse)
async def set_active_printer(
    printer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """
    Set a printer as the active one for invoice printing.

    This will automatically deactivate all other printers and their control number ranges.
    Only one printer can be active at a time.
    """
    service = PrinterService(db)
    printer = await service.set_active(printer_id)

    if not printer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found")

    return PrinterResponse.model_validate(printer)
