"""Company dashboard router (departments, classes and directory)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, check_role
from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import (
    ActivityItem,
    CompanyResponse,
    CompanySummary,
    CompanyUserCreate,
    CompanyUserResponse,
    CompanyUserUpdate,
    CourseClassCreate,
    CourseClassesResponse,
    CourseClassResponse,
    CourseClassUpdate,
    CourseModuleCreate,
    CourseModuleResponse,
    CourseModuleUpdate,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.company_service import CompanyService

router = APIRouter(prefix="/company", tags=["Company"])

CompanyAdmin = Depends(check_role("company_admin", "admin", "root"))


async def _resolve_company_id(user: User, db: AsyncSession) -> UUID:
    if user.company_id:
        return user.company_id

    result = await db.execute(select(Company.id).order_by(Company.created_at))
    company_id = result.scalars().first()
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay una empresa asociada a este usuario",
        )
    return company_id


def _handle_value_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ----------------------------------------------------------------------
# Profile and summary
# ----------------------------------------------------------------------
@router.get("/profile", response_model=CompanyResponse)
async def get_company_profile(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    company = await service.get_company(company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")
    return CompanyResponse.model_validate(company)


@router.get("/summary", response_model=CompanySummary)
async def get_company_summary(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CompanySummary:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        return await service.get_summary(company_id)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


@router.get("/activity", response_model=list[ActivityItem])
async def get_company_activity(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> list[ActivityItem]:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    return await service.get_activity(company_id, limit=limit)


# ----------------------------------------------------------------------
# Departments
# ----------------------------------------------------------------------
@router.get("/departments", response_model=list[DepartmentResponse])
async def list_departments(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> list[DepartmentResponse]:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    return await service.list_departments(company_id)


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_department(
    payload: DepartmentCreate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> DepartmentResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        department = await service.create_department(company_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return DepartmentResponse(
        id=department.id,
        name=department.name,
        description=department.description,
    )


@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: UUID,
    payload: DepartmentUpdate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> DepartmentResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        department = await service.update_department(company_id, department_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return DepartmentResponse(
        id=department.id,
        name=department.name,
        description=department.description,
    )


@router.delete("/departments/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: UUID,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> None:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        await service.delete_department(company_id, department_id)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


# ----------------------------------------------------------------------
# Classes and modules
# ----------------------------------------------------------------------
@router.get("/classes", response_model=list[CourseClassesResponse])
async def list_classes(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> list[CourseClassesResponse]:
    service = CompanyService(db)
    courses = await service.list_courses_with_classes()
    return [CourseClassesResponse.model_validate(course) for course in courses]


@router.post("/modules", response_model=CourseModuleResponse, status_code=status.HTTP_201_CREATED)
async def create_module(
    payload: CourseModuleCreate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CourseModuleResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        module = await service.create_module(company_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return CourseModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        position=module.position,
    )


@router.patch("/modules/{module_id}", response_model=CourseModuleResponse)
async def update_module(
    module_id: UUID,
    payload: CourseModuleUpdate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CourseModuleResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        module = await service.update_module(company_id, module_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return CourseModuleResponse(
        id=module.id,
        title=module.title,
        description=module.description,
        position=module.position,
    )


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: UUID,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> None:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        await service.delete_module(company_id, module_id)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


@router.post("/classes", response_model=CourseClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    payload: CourseClassCreate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CourseClassResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        course_class = await service.create_class(company_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return CourseClassResponse.model_validate(course_class)


@router.patch("/classes/{class_id}", response_model=CourseClassResponse)
async def update_class(
    class_id: UUID,
    payload: CourseClassUpdate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CourseClassResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        course_class = await service.update_class(company_id, class_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
    return CourseClassResponse.model_validate(course_class)


@router.delete("/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: UUID,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> None:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        await service.delete_class(company_id, class_id)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


# ----------------------------------------------------------------------
# Directory
# ----------------------------------------------------------------------
@router.get("/users", response_model=list[CompanyUserResponse])
async def list_company_users(
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> list[CompanyUserResponse]:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    return await service.list_company_users(company_id)


@router.post(
    "/users",
    response_model=CompanyUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_company_user(
    payload: CompanyUserCreate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CompanyUserResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        return await service.create_company_user(company_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


@router.patch("/users/{user_id}", response_model=CompanyUserResponse)
async def update_company_user(
    user_id: UUID,
    payload: CompanyUserUpdate,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> CompanyUserResponse:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        return await service.update_company_user(company_id, user_id, payload)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_company_user(
    user_id: UUID,
    current_user: CurrentUser,
    _: User = CompanyAdmin,
    db: AsyncSession = Depends(get_db),
) -> None:
    company_id = await _resolve_company_id(current_user, db)
    service = CompanyService(db)
    try:
        await service.deactivate_company_user(company_id, user_id)
    except ValueError as exc:
        raise _handle_value_error(exc) from exc
