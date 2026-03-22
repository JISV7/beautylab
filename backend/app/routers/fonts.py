import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin, get_current_user
from app.database import get_db
from app.models.font import Font
from app.models.theme import Theme
from app.models.user import User
from app.schemas.font import FontResponse, FontWithUsage
from app.services.theme_service import ThemeService

try:
    from fontTools.ttLib import TTFont

    FONTTOOLS_AVAILABLE = True
except ImportError:
    FONTTOOLS_AVAILABLE = False

router = APIRouter(prefix="/fonts", tags=["Fonts"])

UPLOAD_DIR = "uploads/fonts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".ttf", ".otf", ".woff", ".woff2"}


def extract_font_metadata(filepath: str) -> str | None:
    """Extract font family name from font file using fonttools.

    Args:
        filepath: Path to the font file

    Returns:
        Font family name if available, None otherwise
    """
    if not FONTTOOLS_AVAILABLE:
        return None

    try:
        font = TTFont(filepath)
        name_table = font["name"]

        # Name ID 1 = Font Family name
        for record in name_table.names:
            if record.nameID == 1:
                return record.toUnicode()

        # Fallback: try name ID 16 (Typographic Family)
        for record in name_table.names:
            if record.nameID == 16:
                return record.toUnicode()
    except Exception:
        # If extraction fails, return None to use filename as fallback
        pass

    return None


@router.get("", response_model=list[FontResponse])
async def list_fonts(db: AsyncSession = Depends(get_db)):
    """Get all installed custom fonts."""
    result = await db.execute(select(Font).order_by(Font.name))
    fonts = result.scalars().all()

    # Include usage count and uploader name in response
    font_list = []
    for font in fonts:
        # Get uploader name if available
        uploader_name = None
        if font.created_by:
            from app.models.user import User

            user_result = await db.execute(select(User.full_name).where(User.id == font.created_by))
            uploader_name = user_result.scalar_one_or_none()

        # Ensure font_usage is a list and calculate usage count
        font_usage = font.font_usage if font.font_usage else []
        usage_count = len(font_usage)

        # Convert font_usage entries to camelCase for frontend
        font_usage_camel = []
        for usage in font_usage:
            font_usage_camel.append(
                {
                    "themeId": usage.get("theme_id"),
                    "themeName": usage.get("theme_name"),
                    "palette": usage.get("palette"),
                    "element": usage.get("element"),
                }
            )

        font_dict = {
            "id": str(font.id),
            "name": font.name,
            "filename": font.filename,
            "url": font.url,
            "created_by": str(font.created_by) if font.created_by else None,
            "created_by_name": uploader_name,
            "created_at": font.created_at.isoformat() if font.created_at else None,
            "font_usage": font_usage_camel,
            "usage_count": usage_count,
        }
        font_list.append(font_dict)

    return font_list


@router.get("/{font_id}", response_model=FontWithUsage)
async def get_font_with_usage(
    font_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a font with detailed usage information."""
    result = await db.execute(select(Font).where(Font.id == font_id))
    font = result.scalar_one_or_none()

    if not font:
        raise HTTPException(status_code=404, detail="Font not found")

    # Build usage list with theme names
    usages = []
    font_usage = font.font_usage if font.font_usage else []
    if font_usage:
        for usage in font_usage:
            usages.append(
                {
                    "themeId": usage.get("theme_id"),
                    "themeName": usage.get("theme_name"),
                    "palette": usage.get("palette"),
                    "element": usage.get("element"),
                }
            )

    # Convert font_usage entries to camelCase for frontend
    font_usage_camel = []
    for usage in font_usage:
        font_usage_camel.append(
            {
                "themeId": usage.get("theme_id"),
                "themeName": usage.get("theme_name"),
                "palette": usage.get("palette"),
                "element": usage.get("element"),
            }
        )

    return {
        "id": str(font.id),
        "name": font.name,
        "filename": font.filename,
        "url": font.url,
        "created_by": str(font.created_by) if font.created_by else None,
        "created_at": font.created_at.isoformat() if font.created_at else None,
        "font_usage": font_usage_camel,
        "usage_count": len(font_usage),
        "usages": usages,
    }


@router.post("/upload", response_model=FontResponse, status_code=status.HTTP_201_CREATED)
async def upload_font(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a new custom font file."""
    # Enforce admin permission eventually here, assuming UI filters for now.

    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to save file.")

    # Extract font metadata from file (font family name)
    extracted_name = extract_font_metadata(filepath)

    # Use extracted name if available, otherwise derive from filename
    font_name = (
        extracted_name
        if extracted_name
        else os.path.splitext(file.filename)[0]
        if file.filename
        else "Unknown Font"
    )

    # The URL that the frontend will load it from
    font_url = f"/static/fonts/{unique_filename}"

    # Create DB entry with all available font information
    db_font = Font(
        name=font_name, filename=unique_filename, url=font_url, created_by=current_user.id
    )

    db.add(db_font)
    await db.commit()
    await db.refresh(db_font)

    return {
        "id": db_font.id,
        "name": db_font.name,
        "filename": db_font.filename,
        "url": db_font.url,
        "created_by": db_font.created_by,
        "created_by_name": current_user.full_name,
        "created_at": db_font.created_at.isoformat(),
        "font_usage": [],
        "usage_count": 0,
    }


@router.delete("/{font_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_font(
    font_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequireAdmin),
):
    """Delete a custom font.

    Cannot delete if font is in use by any theme palette.
    """
    theme_service = ThemeService(db)

    # Check if font can be deleted
    can_delete, reason = await theme_service.can_delete_font(font_id)

    if not can_delete:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    result = await db.execute(select(Font).where(Font.id == font_id))
    font = result.scalar_one_or_none()

    if not font:
        raise HTTPException(status_code=404, detail="Font not found")

    # Attempt to delete file from disk
    filepath = os.path.join(UPLOAD_DIR, font.filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except OSError:
            pass  # Ignore if file missing or locked

    await db.delete(font)
    await db.commit()


@router.post("/rebuild-usage", status_code=status.HTTP_200_OK)
async def rebuild_font_usage(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(RequireAdmin)
):
    """Rebuild font usage tracking from existing themes.

    This endpoint scans all themes and rebuilds the font_usage tracking
    for each font. Use this to fix inconsistencies between theme configs
    and font usage counts.

    Returns the number of fonts updated.
    """
    theme_service = ThemeService(db)

    # Get all themes
    result = await db.execute(select(Theme))
    themes = result.scalars().all()

    # Clear all font usage first
    clear_result = await db.execute(select(Font).where(Font.font_usage.isnot(None)))
    all_fonts = clear_result.scalars().all()
    for font in all_fonts:
        font.font_usage = []

    # Rebuild usage from each theme
    updated_fonts = set()
    for theme in themes:
        print(f"[RebuildUsage] Processing theme: {theme.name} ({theme.id})")
        await theme_service._update_font_usage_for_theme(theme)

        # Track which fonts were updated
        if theme.config:
            for palette_name in ["light", "dark", "accessibility"]:
                if palette_name in theme.config:
                    palette = theme.config[palette_name]
                    typography = palette.get("typography", {})
                    for element_name, element_config in typography.items():
                        font_id = element_config.get("font_id") or element_config.get("fontId")
                        if font_id:
                            updated_fonts.add(str(font_id))

    await db.commit()

    return {
        "message": "Font usage rebuilt successfully",
        "themes_processed": len(themes),
        "fonts_updated": len(updated_fonts),
    }
