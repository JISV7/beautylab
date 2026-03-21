"""Database seeder script.

Run this script to seed the database with initial data:
    python -m app.seed
"""

import asyncio
import shutil
import sys
import uuid
from pathlib import Path
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database import AsyncSessionLocal, close_db, init_db
from app.models.font import Font
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.theme import Theme
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


async def seed_fonts(db: AsyncSession, root_user: User) -> Font | None:
    """Seed default fonts.

    Copies the Roboto font from the Default directory and creates
    a Font database entry owned by the root user.

    Args:
        db: Database session
        root_user: Root user who will own the font

    Returns:
        The created Font object, or None if font file is not available
    """
    print("Seeding fonts...")

    # Check if Roboto font already exists
    result = await db.execute(select(Font).where(Font.name == "Roboto"))
    existing_font = result.scalar_one_or_none()

    if existing_font:
        print(f"  Font exists: Roboto (ID: {existing_font.id})")
        return existing_font

    # Source font file from within backend directory
    # Font is stored in app/fonts/ to be available in Docker container
    backend_root = Path(__file__).parent
    source_path = backend_root / "fonts" / "Roboto-VariableFont_wdth,wght.ttf"

    if not source_path.exists():
        print(f"  Warning: Font file not found at {source_path}")
        print(f"  Skipping font seeding - themes will need font assignment later")
        return None

    # Setup upload directory
    upload_dir = Path("uploads/fonts")
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}.ttf"
    dest_path = upload_dir / unique_filename

    # Copy font file
    shutil.copy2(source_path, dest_path)
    print(f"  Copied font file to {dest_path}")

    # Create database entry
    db_font = Font(
        name="Roboto",
        filename=unique_filename,
        url=f"/static/fonts/{unique_filename}",
        created_by=root_user.id,
    )

    db.add(db_font)
    await db.commit()
    await db.refresh(db_font)
    print(f"  Created font: Roboto (ID: {db_font.id}, owned by {root_user.email})")

    return db_font


async def seed_default_theme(
    db: AsyncSession,
    default_font: Font | None = None,
    created_by: UUID | None = None,
) -> Theme:
    """Seed default theme with placeholder values.

    This theme is used as a fallback so the site is never unstyled.
    All 3 palettes (light, dark, accessibility) have identical values.

    Args:
        db: Database session
        default_font: Optional Font object to use for typography elements
        created_by: UUID of the user creating the theme
    """
    print("Seeding default theme...")

    theme_name = "Default Theme"
    result = await db.execute(select(Theme).where(Theme.name == theme_name))
    theme = result.scalar_one_or_none()

    if not theme:
        # Build typography config with font_id if font is available
        font_id_str = str(default_font.id) if default_font and default_font.id else None
        font_name = default_font.name if default_font else "Roboto"

        # Helper to create typography element with mandatory font_id and font_name
        def make_typography_element(font_size: str, font_weight: int, color: str) -> dict:
            elem = {
                "font_id": font_id_str,
                "font_name": font_name,
                "font_size": font_size,
                "font_weight": font_weight,
                "color": color,
            }
            return elem

        # Default theme config based on Default/DefaultTheme.md
        # Typography sizes follow 1.2 scale rule (major second musical interval):
        # paragraph = 1.0, h6 = 1.0, h5 = 1.2, h4 = 1.44, h3 = 1.73, h2 = 2.076, h1 = 2.488
        default_config = {
            "light": {
                "colors": {
                    "primary": "#F83A3A",
                    "secondary": "#FAA2B6",
                    "accent": "#D73359",
                    "background": "#FBFBFE",
                    "surface": "#EEEEF0",
                    "border": "#DDDDDD",
                },
                "typography": {
                    "h1": make_typography_element("2.492", 400, "#F83A3A"),
                    "h2": make_typography_element("2.076", 400, "#F83A3A"),
                    "h3": make_typography_element("1.73", 400, "#D73359"),
                    "h4": make_typography_element("1.44", 400, "#8F1D1D"),
                    "h5": make_typography_element("1.2", 400, "#8F1D1D"),
                    "h6": make_typography_element("1.0", 400, "#8F1D1D"),
                    "title": make_typography_element("1.5", 700, "#8F1D1D"),
                    "subtitle": make_typography_element("1.0", 600, "#8F1D1D"),
                    "paragraph": make_typography_element("1.0", 400, "#1A1A1A"),
                    "decorator": make_typography_element("1.0", 500, "#FFFFFF"),
                },
            },
            "dark": {
                "colors": {
                    "primary": "#C50707",
                    "secondary": "#5C0519",
                    "accent": "#CC284F",
                    "background": "#010104",
                    "surface": "#0E0E10",
                    "border": "#212121",
                },
                "typography": {
                    "h1": make_typography_element("2.488", 400, "#C50707"),
                    "h2": make_typography_element("2.076", 400, "#C50707"),
                    "h3": make_typography_element("1.73", 400, "#CC284F"),
                    "h4": make_typography_element("1.44", 400, "#FF4D4D"),
                    "h5": make_typography_element("1.2", 400, "#FF4D4D"),
                    "h6": make_typography_element("1.0", 400, "#FF4D4D"),
                    "title": make_typography_element("1.5", 700, "#FF4D4D"),
                    "subtitle": make_typography_element("1.0", 600, "#FF4D4D"),
                    "paragraph": make_typography_element("1.0", 400, "#E0E0E0"),
                    "decorator": make_typography_element("1.0", 500, "#FFFFFF"),
                },
            },
            "accessibility": {
                "colors": {
                    "primary": "#2F27CE",
                    "secondary": "#DEDCFF",
                    "accent": "#433BFF",
                    "background": "#FBFBFE",
                    "surface": "#EEEEF0",
                    "border": "#DDDDDD",
                },
                "typography": {
                    "h1": make_typography_element("2.488", 400, "#2F27CE"),
                    "h2": make_typography_element("2.076", 400, "#2F27CE"),
                    "h3": make_typography_element("1.73", 400, "#433BFF"),
                    "h4": make_typography_element("1.44", 400, "#1A1675"),
                    "h5": make_typography_element("1.2", 400, "#1A1675"),
                    "h6": make_typography_element("1.0", 400, "#1A1675"),
                    "title": make_typography_element("1.5", 700, "#1A1675"),
                    "subtitle": make_typography_element("1.0", 600, "#1A1675"),
                    "paragraph": make_typography_element("1.0", 400, "#1A1A2E"),
                    "decorator": make_typography_element("1.0", 500, "#FFFFFF"),
                },
            },
        }

        theme = Theme(
            name=theme_name,
            description="Default placeholder theme. Customize or create new themes in the admin panel.",
            type="preset",
            config=default_config,
            is_active=True,
            is_default=True,
            created_by=created_by,
        )
        db.add(theme)
        await db.commit()
        await db.refresh(theme)

        print(f"  Created default theme: {theme_name}")
    else:
        print(f"  Default theme exists: {theme_name}")

    # Update font usage tracking if font is available (ALWAYS runs, even for existing themes)
    if default_font and default_font.id and theme:
        theme_id_str = str(theme.id)
        # Build new usage list and reassign (SQLAlchemy doesn't detect in-place mutations of JSONB)
        new_usages = []
        for palette in ["light", "dark", "accessibility"]:
            for element in [
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "title",
                "subtitle",
                "paragraph",
                "decorator",
            ]:
                new_usages.append(
                    {
                        "theme_id": theme_id_str,
                        "theme_name": theme.name,
                        "palette": palette,
                        "element": element,
                    }
                )
        default_font.font_usage = new_usages
        await db.commit()
        print(f"  Updated font usage tracking for Roboto ({len(new_usages)} entries)")

    return theme


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
            root_user = await seed_root_user(db, roles)

            # Seed admin user
            await seed_admin_user(db, roles)

            # Seed fonts (owned by root user)
            default_font = await seed_fonts(db, root_user)

            # Seed default theme (with font reference and creator)
            await seed_default_theme(db, default_font, root_user.id)

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
