"""Company Info service for business logic."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company_info import CompanyInfo
from app.schemas.company_info import CompanyInfoCreate, CompanyInfoUpdate


class CompanyInfoService:
    """Service class for company information operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[CompanyInfo]:
        """Get all company information records."""
        result = await self.db.execute(select(CompanyInfo).order_by(CompanyInfo.id))
        return list(result.scalars().all())

    async def get_by_id(self, company_id: int) -> CompanyInfo | None:
        """Get company info by ID."""
        result = await self.db.execute(select(CompanyInfo).where(CompanyInfo.id == company_id))
        return result.scalar_one_or_none()

    async def get_active_company(self) -> CompanyInfo | None:
        """Get the currently active company information."""
        result = await self.db.execute(
            select(CompanyInfo).where(CompanyInfo.is_active).order_by(CompanyInfo.id).limit(1)
        )
        return result.scalar_one_or_none()

    async def create(self, company_data: CompanyInfoCreate) -> CompanyInfo:
        """Create a new company information record."""
        company = CompanyInfo(**company_data.model_dump())
        self.db.add(company)
        await self.db.commit()
        await self.db.refresh(company)
        return company

    async def update(self, company_id: int, company_data: CompanyInfoUpdate) -> CompanyInfo | None:
        """Update company information."""
        company = await self.get_by_id(company_id)
        if not company:
            return None

        update_data = company_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)

        await self.db.commit()
        await self.db.refresh(company)
        return company

    async def set_active(self, company_id: int) -> CompanyInfo | None:
        """
        Set a company as active, automatically deactivating all others.

        This ensures only one company profile is active at any time.
        """
        company = await self.get_by_id(company_id)
        if not company:
            return None

        # Deactivate all other companies
        await self.db.execute(
            select(CompanyInfo).where(CompanyInfo.is_active, CompanyInfo.id != company_id)
        )
        all_companies = await self.get_all()
        for comp in all_companies:
            if comp.id != company_id:
                comp.is_active = False

        # Activate this company
        company.is_active = True
        await self.db.commit()
        await self.db.refresh(company)
        return company

    async def delete(self, company_id: int) -> bool:
        """Delete company information."""
        company = await self.get_by_id(company_id)
        if not company:
            return False

        # Prevent deletion of active company
        if company.is_active:
            raise ValueError("Cannot delete active company information. Deactivate it first.")

        await self.db.delete(company)
        await self.db.commit()
        return True

    async def check_rif_exists(self, rif: str, exclude_id: int | None = None) -> bool:
        """Check if a RIF already exists."""
        query = select(CompanyInfo).where(CompanyInfo.rif == rif)
        if exclude_id:
            query = query.where(CompanyInfo.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
