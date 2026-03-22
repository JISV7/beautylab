"""License service for gift and corporate license management."""

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course
from app.models.learning_path import LearningPath
from app.models.license import License, LicenseAssignment
from app.models.product import Product
from app.schemas.license import LicensePurchaseRequest


class LicenseNotFoundError(ValueError):
    """Raised when a license is not found."""

    pass


class LicenseInvalidError(ValueError):
    """Raised when a license is invalid (wrong status, expired, etc.)."""

    pass


class LicenseAlreadyRedeemedError(ValueError):
    """Raised when attempting to redeem an already redeemed license."""

    pass


class LicenseService:
    """Service for license management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_license_by_id(self, license_id: UUID) -> License | None:
        """Get license by ID."""
        result = await self.db.execute(select(License).where(License.id == license_id))
        return result.scalar_one_or_none()

    async def get_license_by_code(self, license_code: UUID) -> License | None:
        """Get license by license code."""
        result = await self.db.execute(select(License).where(License.license_code == license_code))
        return result.scalar_one_or_none()

    async def purchase_licenses(
        self,
        request: LicensePurchaseRequest,
        purchased_by_user_id: UUID,
        invoice_line_id: int | None = None,
    ) -> list[License]:
        """
        Purchase multiple licenses for products.

        Args:
            request: Purchase request with items and quantities
            purchased_by_user_id: User making the purchase
            invoice_line_id: Optional link to invoice line

        Returns:
            List of created licenses
        """
        licenses = []

        for item in request.items:
            # Verify product exists
            product = await self._get_product_by_id(item.product_id)
            if not product:
                raise LicenseNotFoundError(f"Product {item.product_id} not found")

            # Get associated course or learning path if exists
            course = None
            learning_path = None

            if product.course:
                course = product.course
            elif product.learning_path:
                learning_path = product.learning_path

            # Create licenses for each unit
            for _ in range(item.quantity):
                license_obj = License(
                    license_code=uuid.uuid4(),
                    product_id=item.product_id,
                    course_id=course.id if course else None,
                    learning_path_id=learning_path.id if learning_path else None,
                    invoice_line_id=invoice_line_id,
                    purchased_by_user_id=purchased_by_user_id,
                    license_type=item.license_type,
                    status="pending",
                    quantity=1,
                )
                self.db.add(license_obj)
                licenses.append(license_obj)

        await self.db.commit()

        # Refresh to get generated IDs and codes
        for lic in licenses:
            await self.db.refresh(lic)

        return licenses

    async def redeem_license(
        self,
        license_code: UUID,
        user_id: UUID,
    ) -> License:
        """
        Redeem a license code to gain course/path access.

        Args:
            license_code: The UUID license code
            user_id: User redeeming the license

        Returns:
            The redeemed license

        Raises:
            LicenseNotFoundError: If license doesn't exist
            LicenseAlreadyRedeemedError: If already redeemed
            LicenseInvalidError: If license is cancelled or expired
        """
        license_obj = await self.get_license_by_code(license_code)

        if not license_obj:
            raise LicenseNotFoundError(f"License {license_code} not found")

        if license_obj.status == "redeemed":
            raise LicenseAlreadyRedeemedError("License has already been redeemed")

        if license_obj.status in ["cancelled", "expired"]:
            raise LicenseInvalidError(f"License is {license_obj.status} and cannot be redeemed")

        # Update license status
        license_obj.status = "redeemed"
        license_obj.redeemed_by_user_id = user_id
        license_obj.redeemed_at = datetime.now()

        await self.db.commit()
        await self.db.refresh(license_obj)

        return license_obj

    async def assign_license(
        self,
        license_id: UUID,
        assigned_by_user_id: UUID,
        assigned_to_user_id: UUID,
        corporate_note: str | None = None,
    ) -> LicenseAssignment:
        """
        Assign a corporate license to an employee.

        Args:
            license_id: License to assign
            assigned_by_user_id: Manager making the assignment
            assigned_to_user_id: Employee receiving the license
            corporate_note: Optional note

        Returns:
            License assignment record
        """
        license_obj = await self.get_license_by_id(license_id)
        if not license_obj:
            raise LicenseNotFoundError(f"License {license_id} not found")

        if license_obj.license_type != "corporate":
            raise LicenseInvalidError("Only corporate licenses can be assigned")

        # Create assignment
        assignment = LicenseAssignment(
            license_id=license_id,
            assigned_to_user_id=assigned_to_user_id,
            assigned_by_user_id=assigned_by_user_id,
            corporate_note=corporate_note,
        )
        self.db.add(assignment)
        await self.db.commit()
        await self.db.refresh(assignment)

        return assignment

    async def revoke_license(
        self,
        license_id: UUID,
        revoked_by_user_id: UUID,
        reason: str | None = None,
    ) -> License:
        """
        Revoke a corporate license (if not yet redeemed).

        Args:
            license_id: License to revoke
            revoked_by_user_id: Manager revoking
            reason: Optional reason

        Returns:
            The revoked license
        """
        license_obj = await self.get_license_by_id(license_id)
        if not license_obj:
            raise LicenseNotFoundError(f"License {license_id} not found")

        if license_obj.license_type != "corporate":
            raise LicenseInvalidError("Only corporate licenses can be revoked")

        if license_obj.status == "redeemed":
            raise LicenseInvalidError("Cannot revoke a redeemed license")

        license_obj.status = "cancelled"
        await self.db.commit()
        await self.db.refresh(license_obj)

        return license_obj

    async def get_user_purchased_licenses(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[License], int]:
        """Get all licenses purchased by a user."""
        query = select(License).where(License.purchased_by_user_id == user_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(License.created_at.desc())

        result = await self.db.execute(query)
        licenses = list(result.scalars().all())

        return licenses, total

    async def get_user_redeemable_licenses(
        self,
        user_id: UUID,
    ) -> list[License]:
        """Get licenses that user can redeem (purchased but not yet redeemed)."""
        result = await self.db.execute(
            select(License)
            .where(License.purchased_by_user_id == user_id)
            .where(License.status == "pending")
            .order_by(License.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_corporate_dashboard(
        self,
        user_id: UUID,
    ) -> dict:
        """Get corporate license dashboard data."""
        # Get all corporate licenses purchased by user
        result = await self.db.execute(
            select(License)
            .where(License.purchased_by_user_id == user_id)
            .where(License.license_type == "corporate")
        )
        licenses = list(result.scalars().all())

        total_purchased = len(licenses)
        total_redeemed = sum(1 for lic in licenses if lic.status == "redeemed")
        total_available = sum(1 for lic in licenses if lic.status == "pending")
        total_cancelled = sum(1 for lic in licenses if lic.status == "cancelled")

        return {
            "total_purchased": total_purchased,
            "total_redeemed": total_redeemed,
            "total_available": total_available,
            "total_cancelled": total_cancelled,
            "licenses": licenses,
        }

    async def _get_product_by_id(self, product_id: UUID) -> Product | None:
        """Get product by ID with relationships loaded."""
        result = await self.db.execute(
            select(Product)
            .options(
                # Load course or learning path relationships
            )
            .where(Product.id == product_id)
        )
        return result.scalar_one_or_none()

    async def check_license_status(
        self,
        license_code: UUID,
    ) -> dict:
        """Check license status and details."""
        license_obj = await self.get_license_by_code(license_code)

        if not license_obj:
            return {
                "license_code": str(license_code),
                "is_valid": False,
                "is_redeemable": False,
                "message": "License not found",
            }

        # Get product name
        product_result = await self.db.execute(
            select(Product.name).where(Product.id == license_obj.product_id)
        )
        product_name = product_result.scalar_one_or_none() or "Unknown Product"

        # Get course title if applicable
        course_title = None
        if license_obj.course_id:
            course_result = await self.db.execute(
                select(Course.title).where(Course.id == license_obj.course_id)
            )
            course_title = course_result.scalar_one_or_none()

        # Get learning path title if applicable
        learning_path_title = None
        if license_obj.learning_path_id:
            path_result = await self.db.execute(
                select(LearningPath.title).where(LearningPath.id == license_obj.learning_path_id)
            )
            learning_path_title = path_result.scalar_one_or_none()

        is_redeemable = license_obj.status == "pending"

        message = f"License is {license_obj.status}"
        if is_redeemable:
            message = "License is valid and ready to redeem"
        elif license_obj.status == "redeemed":
            message = "License has already been redeemed"
        elif license_obj.status == "cancelled":
            message = "License has been cancelled"

        return {
            "license_code": str(license_code),
            "is_valid": True,
            "is_redeemable": is_redeemable,
            "status": license_obj.status,
            "license_type": license_obj.license_type,
            "product_name": product_name,
            "course_title": course_title,
            "learning_path_title": learning_path_title,
            "message": message,
        }
