"""Service for company (tenant) operations."""

from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.models.company import Company
from app.models.course import Course
from app.models.course_class import CourseClass
from app.models.course_module import CourseModule
from app.models.department import Department
from app.models.enrollment import Enrollment
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.company import (
    ActivityItem,
    CompanyRegisterRequest,
    CompanySummary,
    CompanyUserCreate,
    CompanyUserResponse,
    CompanyUserUpdate,
    CourseClassCreate,
    CourseClassUpdate,
    CourseModuleCreate,
    CourseModuleUpdate,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)


class CompanyService:
    """Company-scoped queries and mutations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------
    async def register_company(self, payload: CompanyRegisterRequest) -> tuple[Company, User]:
        existing_email = await self.db.execute(select(User).where(User.email == payload.email))
        if existing_email.scalar_one_or_none():
            raise ValueError("El correo ya está registrado")

        existing_rif = await self.db.execute(select(Company).where(Company.rif == payload.rif))
        if existing_rif.scalar_one_or_none():
            raise ValueError("Ya existe una empresa con este RIF")

        company = Company(
            name=payload.name.strip(),
            rif=payload.rif,
            sector=payload.sector,
            email=str(payload.email),
            phone=payload.phone,
        )
        self.db.add(company)
        await self.db.flush()

        for name in payload.departments:
            self.db.add(Department(company_id=company.id, name=name))

        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.password),
            full_name=payload.admin_name.strip(),
            is_active=True,
            is_verified=True,
            company_id=company.id,
            business_name=company.name,
            rif=company.rif,
            document_type="J",
            document_number=company.rif.replace("-", "")[-9:],
            phone=payload.phone,
        )
        self.db.add(user)
        await self.db.flush()

        role = await self._get_or_create_role("company_admin")
        self.db.add(UserRole(user_id=user.id, role_id=role.id))

        await self.db.commit()
        await self.db.refresh(company)
        await self.db.refresh(user)
        return company, user

    async def _get_or_create_role(self, name: str) -> Role:
        result = await self.db.execute(select(Role).where(Role.name == name))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(name=name)
            self.db.add(role)
            await self.db.flush()
        return role

    # ------------------------------------------------------------------
    # Company / summary
    # ------------------------------------------------------------------
    async def get_company(self, company_id: UUID) -> Company | None:
        result = await self.db.execute(select(Company).where(Company.id == company_id))
        return result.scalar_one_or_none()

    async def get_summary(self, company_id: UUID) -> CompanySummary:
        company = await self.get_company(company_id)
        if not company:
            raise ValueError("Empresa no encontrada")

        departments = await self.db.scalar(
            select(func.count(Department.id)).where(Department.company_id == company_id)
        )

        employees = await self.db.scalar(
            select(func.count(User.id)).where(User.company_id == company_id)
        )
        active_employees = await self.db.scalar(
            select(func.count(User.id)).where(
                User.company_id == company_id,
                User.is_active.is_(True),
            )
        )

        courses_assigned = await self.db.scalar(
            select(func.count(distinct(Enrollment.course_id)))
            .join(User, User.id == Enrollment.user_id)
            .where(User.company_id == company_id)
        )

        total_enrollments = await self.db.scalar(
            select(func.count(Enrollment.id))
            .join(User, User.id == Enrollment.user_id)
            .where(User.company_id == company_id)
        )
        completed_enrollments = await self.db.scalar(
            select(func.count(Enrollment.id))
            .join(User, User.id == Enrollment.user_id)
            .where(
                User.company_id == company_id,
                (Enrollment.status == "completed") | (Enrollment.progress >= 100),
            )
        )

        completion_rate = (
            round((completed_enrollments or 0) * 100 / total_enrollments)
            if total_enrollments
            else 0
        )

        return CompanySummary(
            company_name=company.name,
            departments=departments or 0,
            employees=employees or 0,
            active_employees=active_employees or 0,
            courses_assigned=courses_assigned or 0,
            completion_rate=completion_rate,
        )

    # ------------------------------------------------------------------
    # Departments
    # ------------------------------------------------------------------
    async def list_departments(self, company_id: UUID) -> list[DepartmentResponse]:
        result = await self.db.execute(
            select(Department)
            .where(Department.company_id == company_id)
            .order_by(Department.name)
        )
        departments = result.scalars().all()

        employee_rows = await self.db.execute(
            select(
                User.department_id,
                func.count(User.id),
            )
            .where(User.company_id == company_id, User.department_id.is_not(None))
            .group_by(User.department_id)
        )
        employees_by_department = {row[0]: row[1] for row in employee_rows.all()}

        enrollment_rows = await self.db.execute(
            select(
                User.department_id,
                func.count(distinct(Enrollment.course_id)),
                func.coalesce(func.avg(Enrollment.progress), 0),
            )
            .join(Enrollment, Enrollment.user_id == User.id)
            .where(User.company_id == company_id, User.department_id.is_not(None))
            .group_by(User.department_id)
        )
        enrollment_by_department = {
            row[0]: (row[1], row[2]) for row in enrollment_rows.all()
        }

        responses: list[DepartmentResponse] = []
        for department in departments:
            courses, average = enrollment_by_department.get(department.id, (0, 0))
            responses.append(
                DepartmentResponse(
                    id=department.id,
                    name=department.name,
                    description=department.description,
                    employee_count=employees_by_department.get(department.id, 0),
                    courses_assigned=courses,
                    average_progress=round(float(average or 0)),
                )
            )
        return responses

    async def create_department(
        self, company_id: UUID, payload: DepartmentCreate
    ) -> Department:
        await self._ensure_department_name_available(company_id, payload.name)
        department = Department(
            company_id=company_id,
            name=payload.name.strip(),
            description=payload.description,
        )
        self.db.add(department)
        await self.db.commit()
        await self.db.refresh(department)
        return department

    async def update_department(
        self, company_id: UUID, department_id: UUID, payload: DepartmentUpdate
    ) -> Department:
        department = await self._get_department(company_id, department_id)
        if payload.name and payload.name.strip().lower() != department.name.lower():
            await self._ensure_department_name_available(company_id, payload.name)
            department.name = payload.name.strip()
        if payload.description is not None:
            department.description = payload.description
        await self.db.commit()
        await self.db.refresh(department)
        return department

    async def delete_department(self, company_id: UUID, department_id: UUID) -> None:
        department = await self._get_department(company_id, department_id)
        await self.db.delete(department)
        await self.db.commit()

    async def _get_department(self, company_id: UUID, department_id: UUID) -> Department:
        result = await self.db.execute(
            select(Department).where(
                Department.id == department_id,
                Department.company_id == company_id,
            )
        )
        department = result.scalar_one_or_none()
        if not department:
            raise ValueError("Departamento no encontrado")
        return department

    async def _ensure_department_name_available(self, company_id: UUID, name: str) -> None:
        result = await self.db.execute(
            select(Department).where(
                Department.company_id == company_id,
                func.lower(Department.name) == name.strip().lower(),
            )
        )
        if result.scalar_one_or_none():
            raise ValueError("Ya existe un departamento con ese nombre")

    # ------------------------------------------------------------------
    # Activity
    # ------------------------------------------------------------------
    async def get_activity(self, company_id: UUID, limit: int = 10) -> list[ActivityItem]:
        result = await self.db.execute(
            select(Enrollment, User, Course)
            .join(User, User.id == Enrollment.user_id)
            .join(Course, Course.id == Enrollment.course_id)
            .where(User.company_id == company_id)
            .order_by(Enrollment.enrolled_at.desc())
            .limit(limit)
        )

        items: list[ActivityItem] = []
        for enrollment, user, course in result.all():
            completed = enrollment.status == "completed" or enrollment.progress >= 100
            if completed:
                event_at = enrollment.completed_at or enrollment.enrolled_at
            else:
                event_at = enrollment.enrolled_at
            items.append(
                ActivityItem(
                    id=f"enrollment-{enrollment.id}",
                    user_name=user.full_name or user.email,
                    action="Completó el curso" if completed else "Inició el curso",
                    detail=course.title,
                    created_at=event_at,
                )
            )
        return items

    # ------------------------------------------------------------------
    # Company users (directory)
    # ------------------------------------------------------------------
    async def list_company_users(self, company_id: UUID) -> list[CompanyUserResponse]:
        result = await self.db.execute(
            select(User, Department.name)
            .outerjoin(Department, Department.id == User.department_id)
            .where(User.company_id == company_id)
            .order_by(User.full_name, User.email)
        )
        rows = result.all()

        responses: list[CompanyUserResponse] = []
        for user, department_name in rows:
            role = await self._primary_role(user.id)
            responses.append(
                CompanyUserResponse(
                    id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    role=role,
                    department_id=user.department_id,
                    department_name=department_name,
                    is_active=user.is_active,
                    created_at=user.created_at,
                )
            )
        return responses

    async def create_company_user(
        self, company_id: UUID, payload: CompanyUserCreate
    ) -> CompanyUserResponse:
        existing = await self.db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise ValueError("El correo ya está registrado")

        if payload.department_id:
            await self._get_department(company_id, payload.department_id)

        user = User(
            email=str(payload.email),
            password_hash=hash_password(payload.password),
            full_name=payload.full_name.strip(),
            is_active=True,
            is_verified=True,
            company_id=company_id,
            department_id=payload.department_id,
        )
        self.db.add(user)
        await self.db.flush()

        role = await self._get_or_create_role(payload.role)
        self.db.add(UserRole(user_id=user.id, role_id=role.id))
        await self.db.commit()
        await self.db.refresh(user)

        return await self._company_user_response(user)

    async def update_company_user(
        self, company_id: UUID, user_id: UUID, payload: CompanyUserUpdate
    ) -> CompanyUserResponse:
        user = await self._get_company_user(company_id, user_id)

        if payload.department_id is not None:
            await self._get_department(company_id, payload.department_id)
            user.department_id = payload.department_id
        if payload.full_name is not None:
            user.full_name = payload.full_name.strip()
        if payload.is_active is not None:
            user.is_active = payload.is_active
        if payload.role is not None:
            await self._replace_company_role(user, payload.role)

        await self.db.commit()
        await self.db.refresh(user)
        return await self._company_user_response(user)

    async def deactivate_company_user(self, company_id: UUID, user_id: UUID) -> None:
        user = await self._get_company_user(company_id, user_id)
        user.is_active = False
        await self.db.commit()

    async def _get_company_user(self, company_id: UUID, user_id: UUID) -> User:
        result = await self.db.execute(
            select(User).where(User.id == user_id, User.company_id == company_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("Usuario no encontrado")
        return user

    async def _primary_role(self, user_id: UUID) -> str:
        result = await self.db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        )
        names = [row[0] for row in result.all()]
        if "company_admin" in names:
            return "company_admin"
        if "admin" in names:
            return "admin"
        if "root" in names:
            return "root"
        return names[0] if names else "user"

    async def _replace_company_role(self, user: User, role_name: str) -> None:
        role = await self._get_or_create_role(role_name)
        result = await self.db.execute(
            select(UserRole)
            .join(Role, Role.id == UserRole.role_id)
            .where(
                UserRole.user_id == user.id,
                Role.name.in_(["company_admin", "user"]),
            )
        )
        for assignment in result.scalars().all():
            await self.db.delete(assignment)
        await self.db.flush()
        self.db.add(UserRole(user_id=user.id, role_id=role.id))

    async def _company_user_response(self, user: User) -> CompanyUserResponse:
        department_name = None
        if user.department_id:
            department = await self.db.execute(
                select(Department.name).where(Department.id == user.department_id)
            )
            department_name = department.scalar_one_or_none()

        return CompanyUserResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            role=await self._primary_role(user.id),
            department_id=user.department_id,
            department_name=department_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

    # ------------------------------------------------------------------
    # Classes
    # ------------------------------------------------------------------
    async def list_courses_with_classes(self) -> list[Course]:
        result = await self.db.execute(
            select(Course)
            .options(
                selectinload(Course.modules).selectinload(CourseModule.classes),
            )
            .order_by(Course.title)
        )
        return list(result.scalars().all())

    async def create_module(
        self, company_id: UUID, payload: CourseModuleCreate
    ) -> CourseModule:
        await self._get_course(payload.course_id)
        module = CourseModule(
            course_id=payload.course_id,
            title=payload.title.strip(),
            description=payload.description,
            position=payload.position,
        )
        self.db.add(module)
        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def update_module(
        self, company_id: UUID, module_id: UUID, payload: CourseModuleUpdate
    ) -> CourseModule:
        module = await self._get_module(module_id)
        if payload.title is not None:
            module.title = payload.title.strip()
        if payload.description is not None:
            module.description = payload.description
        if payload.position is not None:
            module.position = payload.position
        await self.db.commit()
        await self.db.refresh(module)
        return module

    async def delete_module(self, company_id: UUID, module_id: UUID) -> None:
        module = await self._get_module(module_id)
        await self.db.delete(module)
        await self.db.commit()

    async def create_class(self, company_id: UUID, payload: CourseClassCreate) -> CourseClass:
        await self._get_module(payload.module_id)
        course_class = CourseClass(
            module_id=payload.module_id,
            title=payload.title.strip(),
            description=payload.description,
            video_url=payload.video_url,
            thumbnail_url=payload.thumbnail_url,
            duration_minutes=payload.duration_minutes,
            has_evaluation=payload.has_evaluation,
            content_type=payload.content_type,
            is_required=payload.is_required,
            position=payload.position,
        )
        self.db.add(course_class)
        await self.db.commit()
        await self.db.refresh(course_class)
        return course_class

    async def update_class(
        self, company_id: UUID, class_id: UUID, payload: CourseClassUpdate
    ) -> CourseClass:
        course_class = await self._get_class(class_id)
        if payload.title is not None:
            course_class.title = payload.title.strip()
        if payload.description is not None:
            course_class.description = payload.description
        if payload.video_url is not None:
            course_class.video_url = payload.video_url
        if payload.thumbnail_url is not None:
            course_class.thumbnail_url = payload.thumbnail_url
        if payload.duration_minutes is not None:
            course_class.duration_minutes = payload.duration_minutes
        if payload.has_evaluation is not None:
            course_class.has_evaluation = payload.has_evaluation
        if payload.content_type is not None:
            course_class.content_type = payload.content_type
        if payload.is_required is not None:
            course_class.is_required = payload.is_required
        if payload.position is not None:
            course_class.position = payload.position
        await self.db.commit()
        await self.db.refresh(course_class)
        return course_class

    async def delete_class(self, company_id: UUID, class_id: UUID) -> None:
        course_class = await self._get_class(class_id)
        await self.db.delete(course_class)
        await self.db.commit()

    async def _get_course(self, course_id: UUID) -> Course:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise ValueError("Curso no encontrado")
        return course

    async def _get_module(self, module_id: UUID) -> CourseModule:
        result = await self.db.execute(
            select(CourseModule).where(CourseModule.id == module_id)
        )
        module = result.scalar_one_or_none()
        if not module:
            raise ValueError("Módulo no encontrado")
        return module

    async def _get_class(self, class_id: UUID) -> CourseClass:
        result = await self.db.execute(select(CourseClass).where(CourseClass.id == class_id))
        course_class = result.scalar_one_or_none()
        if not course_class:
            raise ValueError("Clase no encontrada")
        return course_class
