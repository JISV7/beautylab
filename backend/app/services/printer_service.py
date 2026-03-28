"""Printer service for business logic."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.printer import Printer
from app.schemas.printer import PrinterCreate, PrinterUpdate


class PrinterService:
    """Service class for printer operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Printer]:
        """Get all printers."""
        result = await self.db.execute(select(Printer).order_by(Printer.id))
        return list(result.scalars().all())

    async def get_by_id(self, printer_id: int) -> Printer | None:
        """Get printer by ID."""
        result = await self.db.execute(select(Printer).where(Printer.id == printer_id))
        return result.scalar_one_or_none()

    async def create(self, printer_data: PrinterCreate) -> Printer:
        """Create a new printer."""
        printer = Printer(**printer_data.model_dump())
        self.db.add(printer)
        await self.db.commit()
        await self.db.refresh(printer)
        return printer

    async def update(self, printer_id: int, printer_data: PrinterUpdate) -> Printer | None:
        """Update printer information."""
        printer = await self.get_by_id(printer_id)
        if not printer:
            return None

        update_data = printer_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(printer, field, value)

        await self.db.commit()
        await self.db.refresh(printer)
        return printer

    async def delete(self, printer_id: int) -> bool:
        """Delete a printer."""
        printer = await self.get_by_id(printer_id)
        if not printer:
            return False

        await self.db.delete(printer)
        await self.db.commit()
        return True

    async def check_rif_exists(self, rif: str, exclude_id: int | None = None) -> bool:
        """Check if a RIF already exists."""
        query = select(Printer).where(Printer.rif == rif)
        if exclude_id:
            query = query.where(Printer.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
