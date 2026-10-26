"""Database seeder script for Cursorg.

Run this script to seed the database with initial data:
    python -m app.seed

The seeder is idempotent and safe to run on every container start. It creates
or updates the base roles, permissions, users, fonts, theme, and the initial
corporate-training catalog without duplicating records or deleting content
created by administrators.
"""

import asyncio
import shutil
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.database import AsyncSessionLocal, close_db, init_db
from app.models.category import Category
from app.models.course import Course
from app.models.font import Font
from app.models.learning_path import LearningPath
from app.models.learning_path_course import LearningPathCourse
from app.models.level import Level
from app.models.permission import Permission
from app.models.product import Product
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.theme import Theme
from app.models.user import User
from app.models.user_role import UserRole

ROOT_EMAIL = "root@cursorg.ve"
ADMIN_EMAIL = "admin@cursorg.ve"

# Legacy addresses from the previous brand. They are only used to migrate
# existing users in place so the rebrand does not create duplicate accounts.
LEGACY_ROOT_EMAIL = "root@beautylab.com"
LEGACY_ADMIN_EMAIL = "admin@beautylab.com"

LEARNING_PATH_SKU = "CURSORG-100"
LEARNING_PATH_SLUG = "ruta-de-capacitacion-corporativa"
LEARNING_PATH_TITLE = "Ruta de Capacitación Corporativa"

# Local, CC0 demo clip served by FastAPI. It is only a placeholder so the
# customer player can be tested end-to-end without an external video CDN.
DEMO_COURSE_VIDEO_URL = "/static/course-videos/cursorg-demo.mp4"

COURSE_CATALOG = [
    {
        "title": "Seguridad y Salud en el Trabajo",
        "slug": "seguridad-y-salud-en-el-trabajo",
        "description": (
            "Prevención de riesgos industriales, uso seguro de equipos y "
            "cumplimiento normativo para equipos de planta."
        ),
        "duration_hours": 6,
        "level_slug": "basico",
        "category_slug": "seguridad-salud",
        "sku": "CURSORG-001",
        "image_url": (
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
    },
    {
        "title": "Finanzas Prácticas para No Financieros",
        "slug": "finanzas-practicas-para-no-financieros",
        "description": (
            "Lectura de estados financieros, gestión presupuestaria y control "
            "de costos para responsables de área."
        ),
        "duration_hours": 8,
        "level_slug": "basico",
        "category_slug": "finanzas",
        "sku": "CURSORG-002",
        "image_url": (
            "https://images.unsplash.com/photo-1554224155-6726b3ff858f"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
    },
    {
        "title": "Ventas Consultivas y Atención al Cliente",
        "slug": "ventas-consultivas-y-atencion-al-cliente",
        "description": (
            "Técnicas de venta consultiva, manejo de objeciones y excelencia en "
            "el servicio al cliente."
        ),
        "duration_hours": 6,
        "level_slug": "intermedio",
        "category_slug": "ventas-servicio",
        "sku": "CURSORG-003",
        "image_url": (
            "https://images.unsplash.com/photo-1556761175-b413da4baf72"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
    },
    {
        "title": "Habilidades Digitales y Productividad",
        "slug": "habilidades-digitales-y-productividad",
        "description": (
            "Herramientas digitales, colaboración y organización del trabajo en "
            "la oficina moderna."
        ),
        "duration_hours": 4,
        "level_slug": "basico",
        "category_slug": "habilidades-digitales",
        "sku": "CURSORG-004",
        "image_url": (
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
    },
    {
        "title": "Liderazgo Operativo y Supervisión",
        "slug": "liderazgo-operativo-y-supervision",
        "description": (
            "Supervisión efectiva, comunicación, delegación y seguimiento de "
            "equipos operativos."
        ),
        "duration_hours": 6,
        "level_slug": "intermedio",
        "category_slug": "liderazgo",
        "sku": "CURSORG-005",
        "image_url": (
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c"
            "?auto=format&fit=crop&w=1200&q=80"
        ),
    },
]


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
    admin_perm_keys = [k for k in permissions if k != "manage_settings:settings"]
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


async def _ensure_user_role(db: AsyncSession, user: User, role: Role) -> None:
    """Ensure a user has a role without creating duplicate assignments."""
    result = await db.execute(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if not result.scalar_one_or_none():
        db.add(UserRole(user_id=user.id, role_id=role.id))


async def seed_root_user(
    db: AsyncSession,
    roles: dict[str, Role],
) -> User:
    """Seed the default root user, migrating the legacy account in place."""
    print("Seeding root user...")

    result = await db.execute(select(User).where(User.email == ROOT_EMAIL))
    root = result.scalar_one_or_none()

    if not root:
        legacy_result = await db.execute(select(User).where(User.email == LEGACY_ROOT_EMAIL))
        legacy_root = legacy_result.scalar_one_or_none()

        if legacy_root:
            legacy_root.email = ROOT_EMAIL
            if not legacy_root.full_name:
                legacy_root.full_name = "Root User"
            root = legacy_root
            await db.commit()
            await db.refresh(root)
            print(f"  Migrated legacy root user to {ROOT_EMAIL}")
        else:
            root = User(
                email=ROOT_EMAIL,
                password_hash=hash_password("password12345*"),
                full_name="Root User",
                is_active=True,
                is_verified=True,
            )
            db.add(root)
            await db.flush()
            print(f"  Created root user: {ROOT_EMAIL}")
            print("  Default password: password12345*")
    else:
        print(f"  Root user exists: {ROOT_EMAIL}")

    await _ensure_user_role(db, root, roles["root"])
    await db.commit()
    await db.refresh(root)
    return root


async def seed_admin_user(
    db: AsyncSession,
    roles: dict[str, Role],
) -> User:
    """Seed the default admin user, migrating the legacy account in place."""
    print("Seeding admin user...")

    result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
    admin = result.scalar_one_or_none()

    if not admin:
        legacy_result = await db.execute(select(User).where(User.email == LEGACY_ADMIN_EMAIL))
        legacy_admin = legacy_result.scalar_one_or_none()

        if legacy_admin:
            legacy_admin.email = ADMIN_EMAIL
            if not legacy_admin.full_name:
                legacy_admin.full_name = "Admin User"
            admin = legacy_admin
            await db.commit()
            await db.refresh(admin)
            print(f"  Migrated legacy admin user to {ADMIN_EMAIL}")
        else:
            admin = User(
                email=ADMIN_EMAIL,
                password_hash=hash_password("password123*"),
                full_name="Admin User",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            await db.flush()
            print(f"  Created admin user: {ADMIN_EMAIL}")
            print("  Default password: password123*")
    else:
        print(f"  Admin user exists: {ADMIN_EMAIL}")

    await _ensure_user_role(db, admin, roles["admin"])
    await db.commit()
    await db.refresh(admin)
    return admin


async def _seed_font(
    db: AsyncSession,
    name: str,
    source_filename: str,
    root_user: User,
) -> Font | None:
    """Create or repair a single seeded font."""
    result = await db.execute(select(Font).where(Font.name == name))
    existing_font = result.scalar_one_or_none()

    backend_root = Path(__file__).parent
    source_path = backend_root / "fonts" / source_filename
    upload_dir = Path("uploads/fonts")

    if existing_font:
        print(f"  Font exists: {name} (ID: {existing_font.id})")
        # Ensure the physical file exists on disk, restore if missing.
        dest_path = upload_dir / existing_font.filename
        if not dest_path.exists():
            if source_path.exists():
                upload_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, dest_path)
                print(f"  Restored missing font file to {dest_path}")
            else:
                print(f"  Warning: Source font file not found at {source_path}")
        return existing_font

    if not source_path.exists():
        print(f"  Warning: Font file not found at {source_path}")
        return None

    upload_dir.mkdir(parents=True, exist_ok=True)
    unique_filename = f"{uuid.uuid4()}.ttf"
    dest_path = upload_dir / unique_filename
    shutil.copy2(source_path, dest_path)
    print(f"  Copied font file to {dest_path}")

    db_font = Font(
        name=name,
        filename=unique_filename,
        url=f"/static/fonts/{unique_filename}",
        created_by=root_user.id,
    )
    db.add(db_font)
    await db.commit()
    await db.refresh(db_font)
    print(f"  Created font: {name} (ID: {db_font.id}, owned by {root_user.email})")
    return db_font


async def seed_fonts(db: AsyncSession, root_user: User) -> Font | None:
    """Seed Montserrat as the Cursorg brand font and keep Roboto as fallback.

    Returns:
        The Montserrat font when available, otherwise Roboto, or None when no
        font file can be seeded.
    """
    print("Seeding fonts...")

    montserrat = await _seed_font(
        db,
        "Montserrat",
        "Montserrat-VariableFont_wght.ttf",
        root_user,
    )
    roboto = await _seed_font(
        db,
        "Roboto",
        "Roboto-VariableFont_wdth,wght.ttf",
        root_user,
    )

    if not montserrat:
        print("  Warning: Montserrat could not be seeded; using Roboto as fallback")
    return montserrat or roboto


def _build_default_theme_config(default_font: Font | None) -> dict:
    """Build the Cursorg default theme config for the three palettes."""
    font_id_str = str(default_font.id) if default_font and default_font.id else None

    if default_font and default_font.name == "Montserrat":
        font_name = "Montserrat, system-ui, sans-serif"
    elif default_font:
        font_name = f"{default_font.name}, system-ui, sans-serif"
    else:
        font_name = "Montserrat, system-ui, sans-serif"

    def typography_element(font_size: str, font_weight: int, color: str) -> dict:
        return {
            "font_id": font_id_str,
            "font_name": font_name,
            "font_size": font_size,
            "font_weight": font_weight,
            "color": color,
        }

    def loader() -> dict:
        return {"enabled": False, "selectedTangram": 1}

    return {
        "light": {
            "colors": {
                "primary": "#0D2B4D",
                "secondary": "#1E5AA8",
                "accent": "#55C7E8",
                "background": "#FBFBFE",
                "surface": "#F1F5F9",
                "border": "#D9E2EC",
                "loader": loader(),
            },
            "typography": {
                "h1": typography_element("2.492", 700, "#0D2B4D"),
                "h2": typography_element("2.076", 700, "#0D2B4D"),
                "h3": typography_element("1.73", 600, "#1E5AA8"),
                "h4": typography_element("1.44", 600, "#1E5AA8"),
                "h5": typography_element("1.2", 600, "#0D2B4D"),
                "h6": typography_element("1.0", 500, "#6E7882"),
                "title": typography_element("1.5", 700, "#0D2B4D"),
                "subtitle": typography_element("1.0", 600, "#1E5AA8"),
                "paragraph": typography_element("1.0", 400, "#334155"),
                "decorator": typography_element("1.0", 500, "#FFFFFF"),
            },
        },
        "dark": {
            "colors": {
                "primary": "#1E5AA8",
                "secondary": "#55C7E8",
                "accent": "#55C7E8",
                "background": "#07111F",
                "surface": "#0F1F33",
                "border": "#1E3A5F",
                "loader": loader(),
            },
            "typography": {
                "h1": typography_element("2.492", 700, "#55C7E8"),
                "h2": typography_element("2.076", 700, "#55C7E8"),
                "h3": typography_element("1.73", 600, "#8ED8F0"),
                "h4": typography_element("1.44", 600, "#8ED8F0"),
                "h5": typography_element("1.2", 600, "#E2E8F0"),
                "h6": typography_element("1.0", 500, "#CBD5E1"),
                "title": typography_element("1.5", 700, "#FFFFFF"),
                "subtitle": typography_element("1.0", 600, "#55C7E8"),
                "paragraph": typography_element("1.0", 400, "#CBD5E1"),
                "decorator": typography_element("1.0", 500, "#FFFFFF"),
            },
        },
        "accessibility": {
            "colors": {
                "primary": "#0D2B4D",
                "secondary": "#1E5AA8",
                "accent": "#0B6E8A",
                "background": "#FFFFFF",
                "surface": "#F1F5F9",
                "border": "#0D2B4D",
                "loader": loader(),
            },
            "typography": {
                "h1": typography_element("2.492", 700, "#0D2B4D"),
                "h2": typography_element("2.076", 700, "#0D2B4D"),
                "h3": typography_element("1.73", 600, "#1E5AA8"),
                "h4": typography_element("1.44", 600, "#1E5AA8"),
                "h5": typography_element("1.2", 600, "#0D2B4D"),
                "h6": typography_element("1.0", 500, "#0D2B4D"),
                "title": typography_element("1.5", 700, "#0D2B4D"),
                "subtitle": typography_element("1.0", 600, "#1E5AA8"),
                "paragraph": typography_element("1.0", 400, "#1F2937"),
                "decorator": typography_element("1.0", 500, "#FFFFFF"),
            },
        },
    }


async def seed_default_theme(
    db: AsyncSession,
    default_font: Font | None = None,
    created_by: UUID | None = None,
) -> Theme:
    """Create or rebrand the default Cursorg theme.

    Existing rows are updated in place so databases created under the previous
    brand receive the new palette and Montserrat typography. Administrator
    choices for is_active/is_default are preserved after creation.
    """
    print("Seeding default theme...")

    theme_name = "Default Theme"
    description = (
        "Tema predeterminado de Cursorg. Paleta corporativa azul y tipografía Montserrat."
    )
    config = _build_default_theme_config(default_font)

    result = await db.execute(select(Theme).where(Theme.name == theme_name))
    theme = result.scalar_one_or_none()

    if not theme:
        theme = Theme(
            name=theme_name,
            description=description,
            type="preset",
            config=config,
            is_active=True,
            is_default=True,
            created_by=created_by,
        )
        db.add(theme)
        await db.commit()
        await db.refresh(theme)
        print(f"  Created default theme: {theme_name}")
    else:
        theme.config = config
        theme.description = description
        theme.type = "preset"
        if created_by and not theme.created_by:
            theme.created_by = created_by
        await db.commit()
        await db.refresh(theme)
        print(f"  Updated default theme: {theme_name}")

    # Rebuild font usage tracking so the theme points at Montserrat, not Roboto.
    if default_font and default_font.id and theme:
        theme_id_str = str(theme.id)
        fonts_result = await db.execute(select(Font).where(Font.font_usage.isnot(None)))
        for font in fonts_result.scalars().all():
            if font.font_usage and any(
                usage.get("theme_id") == theme_id_str for usage in font.font_usage
            ):
                font.font_usage = [
                    usage
                    for usage in font.font_usage
                    if usage.get("theme_id") != theme_id_str
                ]

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
        print(
            f"  Updated font usage tracking for {default_font.name} "
            f"({len(new_usages)} entries)"
        )

    return theme


async def seed_levels(db: AsyncSession) -> dict[str, Level]:
    """Seed the course difficulty levels."""
    print("Seeding course levels...")

    levels_data = [
        {
            "name": "Básico",
            "slug": "basico",
            "description": "Contenidos introductorios para construir fundamentos sólidos.",
            "order": 1,
        },
        {
            "name": "Intermedio",
            "slug": "intermedio",
            "description": "Aplicación práctica para profesionales con experiencia.",
            "order": 2,
        },
    ]

    levels = {}
    for data in levels_data:
        result = await db.execute(select(Level).where(Level.slug == data["slug"]))
        level = result.scalar_one_or_none()

        if not level:
            level = Level(**data)
            db.add(level)
            print(f"  Created level: {data['name']}")
        else:
            level.name = data["name"]
            level.order = data["order"]
            if not level.description:
                level.description = data["description"]
            print(f"  Level exists: {level.name}")

        levels[data["slug"]] = level

    await db.commit()
    return levels


async def seed_categories(db: AsyncSession) -> dict[str, Category]:
    """Seed the corporate-training categories."""
    print("Seeding course categories...")

    categories_data = [
        {
            "name": "Seguridad y Salud",
            "slug": "seguridad-salud",
            "description": "Prevención de riesgos, salud ocupacional y cumplimiento normativo.",
            "order": 1,
        },
        {
            "name": "Finanzas",
            "slug": "finanzas",
            "description": "Gestión financiera, presupuestos y control de costos.",
            "order": 2,
        },
        {
            "name": "Ventas y Servicio",
            "slug": "ventas-servicio",
            "description": "Ventas consultivas, experiencia y atención al cliente.",
            "order": 3,
        },
        {
            "name": "Habilidades Digitales",
            "slug": "habilidades-digitales",
            "description": "Herramientas digitales y productividad para el trabajo moderno.",
            "order": 4,
        },
        {
            "name": "Liderazgo",
            "slug": "liderazgo",
            "description": "Supervisión, comunicación y desarrollo de equipos.",
            "order": 5,
        },
    ]

    categories = {}
    for data in categories_data:
        result = await db.execute(select(Category).where(Category.slug == data["slug"]))
        category = result.scalar_one_or_none()

        if not category:
            category = Category(**data)
            db.add(category)
            print(f"  Created category: {data['name']}")
        else:
            category.name = data["name"]
            category.order = data["order"]
            if not category.description:
                category.description = data["description"]
            print(f"  Category exists: {category.name}")

        categories[data["slug"]] = category

    await db.commit()
    return categories


async def seed_catalog(
    db: AsyncSession,
    levels: dict[str, Level],
    categories: dict[str, Category],
) -> list[Course]:
    """Seed the five Cursorg courses and their one-to-one products."""
    print("Seeding course catalog...")

    courses = []
    for entry in COURSE_CATALOG:
        level = levels.get(entry["level_slug"])
        category = categories.get(entry["category_slug"])
        if not level or not category:
            print(
                f"  Warning: skipping {entry['title']} because its level or category "
                "is missing"
            )
            continue

        result = await db.execute(select(Product).where(Product.sku == entry["sku"]))
        product = result.scalar_one_or_none()

        if not product:
            product = Product(
                name=entry["title"],
                description=entry["description"],
                sku=entry["sku"],
                price=Decimal("0.00"),
                tax_rate=Decimal("0.00"),
                tax_type="exento",
                is_active=True,
            )
            db.add(product)
            await db.flush()
            print(f"  Created product: {entry['sku']} - {entry['title']}")
        else:
            # Keep the seeded identity current without overwriting an
            # administrator-defined price or tax configuration.
            product.name = entry["title"]
            product.description = entry["description"]
            product.is_active = True
            print(f"  Product exists: {entry['sku']}")

        result = await db.execute(select(Course).where(Course.slug == entry["slug"]))
        course = result.scalar_one_or_none()

        if not course:
            # A product can only be linked to one course. Reuse an existing
            # course already linked to this product instead of duplicating it.
            linked_result = await db.execute(
                select(Course).where(Course.product_id == product.id)
            )
            course = linked_result.scalar_one_or_none()

        if not course:
            course = Course(
                title=entry["title"],
                slug=entry["slug"],
                description=entry["description"],
                image_url=entry["image_url"],
                video_url=DEMO_COURSE_VIDEO_URL,
                duration_hours=entry["duration_hours"],
                level_id=level.id,
                category_id=category.id,
                product_id=product.id,
                published=True,
            )
            db.add(course)
            print(f"  Created course: {entry['title']}")
        else:
            if course.product_id != product.id:
                conflict_result = await db.execute(
                    select(Course).where(
                        Course.product_id == product.id,
                        Course.id != course.id,
                    )
                )
                if conflict_result.scalar_one_or_none():
                    print(
                        f"  Warning: product {entry['sku']} is already linked to "
                        f"another course; keeping course '{course.slug}' unchanged"
                    )
                else:
                    course.product_id = product.id

            course.title = entry["title"]
            course.slug = entry["slug"]
            course.description = entry["description"]
            course.image_url = entry["image_url"]
            if not course.video_url:
                course.video_url = DEMO_COURSE_VIDEO_URL
            course.duration_hours = entry["duration_hours"]
            course.level_id = level.id
            course.category_id = category.id
            course.published = True
            print(f"  Course exists: {entry['title']}")

        courses.append(course)

    await db.commit()
    for course in courses:
        await db.refresh(course)
    return courses


async def seed_learning_path(db: AsyncSession, courses: list[Course]) -> None:
    """Seed one published learning path containing all five courses."""
    if not courses:
        return

    print("Seeding learning path...")
    description = (
        "Programa integral que combina seguridad, finanzas, ventas, habilidades "
        "digitales y liderazgo para equipos corporativos."
    )
    image_url = (
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
        "?auto=format&fit=crop&w=1200&q=80"
    )

    result = await db.execute(select(Product).where(Product.sku == LEARNING_PATH_SKU))
    product = result.scalar_one_or_none()

    if not product:
        product = Product(
            name=LEARNING_PATH_TITLE,
            description=description,
            sku=LEARNING_PATH_SKU,
            price=Decimal("0.00"),
            tax_rate=Decimal("0.00"),
            tax_type="exento",
            is_active=True,
        )
        db.add(product)
        await db.flush()
        print(f"  Created product: {LEARNING_PATH_SKU} - {LEARNING_PATH_TITLE}")
    else:
        product.name = LEARNING_PATH_TITLE
        product.description = description
        product.is_active = True
        print(f"  Product exists: {LEARNING_PATH_SKU}")

    result = await db.execute(
        select(LearningPath).where(LearningPath.slug == LEARNING_PATH_SLUG)
    )
    path = result.scalar_one_or_none()

    if not path:
        linked_result = await db.execute(
            select(LearningPath).where(LearningPath.product_id == product.id)
        )
        path = linked_result.scalar_one_or_none()

    if not path:
        path = LearningPath(
            title=LEARNING_PATH_TITLE,
            slug=LEARNING_PATH_SLUG,
            description=description,
            image_url=image_url,
            product_id=product.id,
            published=True,
        )
        db.add(path)
        await db.flush()
        print(f"  Created learning path: {LEARNING_PATH_TITLE}")
    else:
        if path.product_id != product.id:
            conflict_result = await db.execute(
                select(LearningPath).where(
                    LearningPath.product_id == product.id,
                    LearningPath.id != path.id,
                )
            )
            if conflict_result.scalar_one_or_none():
                print(
                    f"  Warning: product {LEARNING_PATH_SKU} is already linked to "
                    "another learning path"
                )
            else:
                path.product_id = product.id

        path.title = LEARNING_PATH_TITLE
        path.slug = LEARNING_PATH_SLUG
        path.description = description
        path.image_url = image_url
        path.published = True
        print(f"  Learning path exists: {LEARNING_PATH_TITLE}")

    existing_result = await db.execute(
        select(LearningPathCourse).where(
            LearningPathCourse.learning_path_id == path.id
        )
    )
    existing_links = {
        link.course_id: link for link in existing_result.scalars().all()
    }

    for order, course in enumerate(courses, start=1):
        link = existing_links.get(course.id)
        if link:
            link.order = order
        else:
            db.add(
                LearningPathCourse(
                    learning_path_id=path.id,
                    course_id=course.id,
                    order=order,
                )
            )

    await db.commit()
    print(f"  Learning path contains {len(courses)} courses")


async def seed_database() -> None:
    """Main seeding function."""
    print("=" * 50)
    print("Cursorg Database Seeder")
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

            # Seed corporate-training catalog
            levels = await seed_levels(db)
            categories = await seed_categories(db)
            courses = await seed_catalog(db, levels, categories)
            await seed_learning_path(db, courses)

            print("=" * 50)
            print("Database seeding completed successfully!")
            print(f"Catalog courses available: {len(courses)}")
            print("=" * 50)

        except Exception as e:
            await db.rollback()
            print(f"Error seeding database: {e}")
            raise
        finally:
            await close_db()


if __name__ == "__main__":
    asyncio.run(seed_database())
