"""Database seeder script.

Run this script to seed the database with initial data:
    python -m app.seed
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database import AsyncSessionLocal, close_db, init_db
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.models.user_role import UserRole


async def seed_roles(db: AsyncSession) -> dict[str, Role]:
    """Seed default roles."""
    print("Seeding roles...")

    default_roles = ["root", "admin", "user"]
    roles = {}

    for role_name in default_roles:
        result = await db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()

        if not role:
            role = Role(name=role_name)
            db.add(role)
            print(f"  Created role: {role_name}")
        else:
            print(f"  Role exists: {role_name}")

        roles[role_name] = role

    await db.commit()
    return roles


async def seed_permissions(db: AsyncSession) -> dict[str, Permission]:
    """Seed default permissions."""
    print("Seeding permissions...")

    default_permissions = [
        # Theme permissions
        ("create_theme", "theme"),
        ("edit_theme", "theme"),
        ("delete_theme", "theme"),
        ("publish_theme", "theme"),
        # User permissions
        ("view_user", "user"),
        ("edit_user", "user"),
        ("delete_user", "user"),
        # Role permissions
        ("assign_role", "role"),
        ("remove_role", "role"),
        # Admin permissions
        ("view_audit_logs", "audit_log"),
        ("manage_settings", "settings"),
    ]

    permissions = {}

    for name, resource in default_permissions:
        result = await db.execute(
            select(Permission).where(
                Permission.name == name,
                Permission.resource == resource,
            )
        )
        perm = result.scalar_one_or_none()

        if not perm:
            perm = Permission(name=name, resource=resource)
            db.add(perm)
            print(f"  Created permission: {name}:{resource}")
        else:
            print(f"  Permission exists: {name}:{resource}")

        permissions[f"{name}:{resource}"] = perm

    await db.commit()
    return permissions


async def seed_role_permissions(
    db: AsyncSession,
    roles: dict[str, Role],
    permissions: dict[str, Permission],
) -> None:
    """Seed role-permission assignments."""
    print("Seeding role-permission assignments...")

    # Root role - all permissions
    root_perms = list(permissions.values())

    # Admin role - most permissions except manage_settings
    admin_perm_keys = [k for k in permissions.keys() if k != "manage_settings:settings"]
    admin_perms = [permissions[k] for k in admin_perm_keys]

    # User role - basic permissions
    user_perm_keys = [
        "create_theme:theme",
        "edit_theme:theme",
        "view_user:user",
    ]
    user_perms = [permissions[k] for k in user_perm_keys if k in permissions]

    role_permissions = {
        "root": root_perms,
        "admin": admin_perms,
        "user": user_perms,
    }

    for role_name, perms in role_permissions.items():
        role = roles[role_name]

        for perm in perms:
            # Check if already assigned
            result = await db.execute(
                select(RolePermission).where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == perm.id,
                )
            )
            if not result.scalar_one_or_none():
                role_perm = RolePermission(role_id=role.id, permission_id=perm.id)
                db.add(role_perm)
                print(f"  Assigned {perm.name}:{perm.resource} to {role_name}")

    await db.commit()
    print("  Role-permission assignments complete")


async def seed_root_user(
    db: AsyncSession,
    roles: dict[str, Role],
) -> User:
    """Seed default root user."""
    print("Seeding root user...")

    email = "root@beautylab.com"
    result = await db.execute(select(User).where(User.email == email))
    root = result.scalar_one_or_none()

    if not root:
        root = User(
            email=email,
            password_hash=hash_password("password12345*"),
            full_name="Root User",
            is_active=True,
            is_verified=True,
        )
        db.add(root)
        await db.flush()

        # Assign root role
        user_role = UserRole(
            user_id=root.id,
            role_id=roles["root"].id,
        )
        db.add(user_role)

        await db.commit()
        await db.refresh(root)
        print(f"  Created root user: {email}")
        print("  Default password: password12345*")
    else:
        print(f"  Root user exists: {email}")

    return root


async def seed_admin_user(
    db: AsyncSession,
    roles: dict[str, Role],
) -> User:
    """Seed default admin user."""
    print("Seeding admin user...")

    email = "admin@beautylab.com"
    result = await db.execute(select(User).where(User.email == email))
    admin = result.scalar_one_or_none()

    if not admin:
        admin = User(
            email=email,
            password_hash=hash_password("password123*"),
            full_name="Admin User",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        await db.flush()

        # Assign admin role
        user_role = UserRole(
            user_id=admin.id,
            role_id=roles["admin"].id,
        )
        db.add(user_role)

        await db.commit()
        await db.refresh(admin)
        print(f"  Created admin user: {email}")
        print("  Default password: password123*")
    else:
        print(f"  Admin user exists: {email}")

    return admin


async def seed_database() -> None:
    """Main seeding function."""
    print("=" * 50)
    print("BeautyLab Database Seeder")
    print("=" * 50)

    # Initialize database connection
    await init_db()

    async with AsyncSessionLocal() as db:
        try:
            # Seed roles
            roles = await seed_roles(db)

            # Seed permissions
            permissions = await seed_permissions(db)

            # Seed role-permission assignments
            await seed_role_permissions(db, roles, permissions)

            # Seed root user
            await seed_root_user(db, roles)

            # Seed admin user
            await seed_admin_user(db, roles)

            print("=" * 50)
            print("Database seeding completed successfully!")
            print("=" * 50)

        except Exception as e:
            await db.rollback()
            print(f"Error seeding database: {e}")
            raise
        finally:
            await close_db()


if __name__ == "__main__":
    asyncio.run(seed_database())
