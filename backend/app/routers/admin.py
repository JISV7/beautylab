"""Admin router for user and role management."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, RequireAdmin, RequireRoot
from app.database import get_db
from app.models.audit_log import AuditLog
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.schemas.role import PermissionResponse, RoleResponse, RoleWithPermissions
from app.schemas.user import UserWithRoles
from app.services.auth_service import AuthService

router = APIRouter(prefix="/admin", tags=["Admin"])


# ==================== User Management ====================


@router.post("/users/{user_id}/roles/{role_id}", response_model=UserWithRoles)
async def assign_role_to_user(
    user_id: UUID,
    role_id: int,
    current_user: CurrentUser,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> UserWithRoles:
    """Assign a role to a user (admin only)."""
    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify role exists
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Check if role already assigned
    existing = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id).where(UserRole.role_id == role_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role already assigned to user")

    # Assign role
    user_role = UserRole(user_id=user_id, role_id=role_id, assigned_by=current_user.id)
    db.add(user_role)
    await db.commit()

    # Get user roles
    auth_service = AuthService(db)
    roles = await auth_service.get_user_roles(user_id)

    return UserWithRoles(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        preferred_theme_id=user.preferred_theme_id,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=roles,
    )


@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: UUID,
    role_id: int,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a role from a user (admin only)."""
    user_role = await db.execute(
        select(UserRole).where(UserRole.user_id == user_id).where(UserRole.role_id == role_id)
    )
    user_role = user_role.scalar_one_or_none()

    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")

    await db.delete(user_role)
    await db.commit()


# ==================== Role Management ====================


@router.get("/roles", response_model=list[RoleWithPermissions])
async def list_roles(
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> list[RoleWithPermissions]:
    """List all roles (admin only)."""
    result = await db.execute(select(Role).order_by(Role.id))
    roles = result.scalars().all()

    # Get permissions for each role
    roles_with_perms = []
    for role in roles:
        perm_result = await db.execute(
            select(Permission.name)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role.id)
        )
        permissions = [row[0] for row in perm_result.all()]

        roles_with_perms.append(
            RoleWithPermissions(
                id=role.id,
                name=role.name,
                created_at=role.created_at,
                permissions=permissions,
            )
        )

    return roles_with_perms


@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: int,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> RoleWithPermissions:
    """Get a specific role with permissions (admin only)."""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Get permissions
    perm_result = await db.execute(
        select(Permission.name)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .where(RolePermission.role_id == role_id)
    )
    permissions = [row[0] for row in perm_result.all()]

    return RoleWithPermissions(
        id=role.id,
        name=role.name,
        created_at=role.created_at,
        permissions=permissions,
    )


@router.post("/roles", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    role_name: str,
    _: User = Depends(RequireRoot),
    db: AsyncSession = Depends(get_db),
) -> RoleResponse:
    """Create a new role (root only)."""
    # Check if role exists
    existing = await db.execute(select(Role).where(Role.name == role_name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role already exists")

    role = Role(name=role_name)
    db.add(role)
    await db.commit()
    await db.refresh(role)

    return RoleResponse.model_validate(role)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    _: User = Depends(RequireRoot),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a role (root only)."""
    role = await db.execute(select(Role).where(Role.id == role_id))
    role = role.scalar_one_or_none()

    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Prevent deletion of default roles
    if role.name in ["root", "admin", "user"]:
        raise HTTPException(status_code=400, detail="Cannot delete default roles")

    await db.delete(role)
    await db.commit()


# ==================== Permission Management ====================


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> list[PermissionResponse]:
    """List all permissions (admin only)."""
    result = await db.execute(select(Permission))
    permissions = result.scalars().all()

    return [PermissionResponse.model_validate(p) for p in permissions]


@router.post("/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
async def create_permission(
    name: str,
    resource: str,
    _: User = Depends(RequireRoot),
    db: AsyncSession = Depends(get_db),
) -> PermissionResponse:
    """Create a new permission (root only)."""
    # Check if permission exists
    existing = await db.execute(
        select(Permission).where(Permission.name == name).where(Permission.resource == resource)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Permission already exists")

    permission = Permission(name=name, resource=resource)
    db.add(permission)
    await db.commit()
    await db.refresh(permission)

    return PermissionResponse.model_validate(permission)


@router.post("/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int,
    _: User = Depends(RequireRoot),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Assign a permission to a role (root only)."""
    # Check if already assigned
    existing = await db.execute(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Permission already assigned to role")

    role_permission = RolePermission(role_id=role_id, permission_id=permission_id)
    db.add(role_permission)
    await db.commit()


@router.delete(
    "/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    _: User = Depends(RequireRoot),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a permission from a role (root only)."""
    role_permission = await db.execute(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    )
    role_permission = role_permission.scalar_one_or_none()

    if not role_permission:
        raise HTTPException(status_code=404, detail="Role permission not found")

    await db.delete(role_permission)
    await db.commit()


# ==================== Audit Logs ====================


@router.get("/audit-logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user_id: Optional[UUID] = None,
    resource_type: Optional[str] = None,
    action: Optional[str] = None,
    _: User = Depends(RequireAdmin),
    db: AsyncSession = Depends(get_db),
) -> AuditLogListResponse:
    """List audit logs (admin only)."""
    offset = (page - 1) * page_size

    # Build query
    query = select(AuditLog)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    if action:
        query = query.where(AuditLog.action == action)

    # Get total count
    count_query = select(func.count()).select_from(AuditLog)
    if user_id:
        count_query = count_query.where(AuditLog.user_id == user_id)
    if resource_type:
        count_query = count_query.where(AuditLog.resource_type == resource_type)
    if action:
        count_query = count_query.where(AuditLog.action == action)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get logs
    query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    logs = result.scalars().all()

    return AuditLogListResponse(
        logs=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
    )
