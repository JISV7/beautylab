import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin, get_db
from app.models.home_config import HomeConfig
from app.schemas.home_config import HomeConfigCreate, HomeConfigRead, HomeConfigUpdate

router = APIRouter(prefix="/home-config", tags=["Home Configuration"])

VIDEO_UPLOAD_DIR = "uploads/videos"
CAROUSEL_UPLOAD_DIR = "uploads/carousel"

os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)
os.makedirs(CAROUSEL_UPLOAD_DIR, exist_ok=True)

ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".ogg"}
ALLOWED_SUBTITLE_EXT = {".vtt", ".srt"}
ALLOWED_AUDIO_EXT = {".mp3", ".wav", ".aac", ".m4a", ".ogg"}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


@router.get("", response_model=list[HomeConfigRead])
async def list_home_configs(db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)):
    """List all home page configurations (Admin only)."""
    result = await db.execute(select(HomeConfig).order_by(HomeConfig.id))
    return result.scalars().all()


@router.get("/active", response_model=HomeConfigRead)
async def get_active_home_config(db: AsyncSession = Depends(get_db)):
    """Get the currently active home page configuration."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.is_active))
    config = result.scalar_one_or_none()
    if not config:
        # Fallback to the first one if none is active
        result = await db.execute(select(HomeConfig).limit(1))
        config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(status_code=404, detail="No home configuration found")
    return config


@router.post("", response_model=HomeConfigRead, status_code=status.HTTP_201_CREATED)
async def create_home_config(
    config_in: HomeConfigCreate, db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)
):
    """Create a new home page configuration (Admin only)."""
    new_config = HomeConfig(
        name=config_in.name,
        config=config_in.config.model_dump(),
        is_active=False,
    )
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    return new_config


@router.get("/{config_id}", response_model=HomeConfigRead)
async def get_home_config(
    config_id: int, db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)
):
    """Get a specific home page configuration (Admin only)."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Home configuration not found")
    return config


@router.put("/{config_id}", response_model=HomeConfigRead)
async def update_home_config(
    config_id: int,
    config_update: HomeConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(RequireAdmin),
):
    """Update a specific home page configuration (Admin only)."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == config_id))
    db_config = result.scalar_one_or_none()

    if not db_config:
        raise HTTPException(status_code=404, detail="Home configuration not found")

    if config_update.name is not None:
        db_config.name = config_update.name
    if config_update.config is not None:
        db_config.config = config_update.config.model_dump()

    await db.commit()
    await db.refresh(db_config)
    return db_config


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_home_config(
    config_id: int, db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)
):
    """Delete a specific home page configuration (Admin only)."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == config_id))
    db_config = result.scalar_one_or_none()

    if not db_config:
        raise HTTPException(status_code=404, detail="Home configuration not found")

    if db_config.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the active configuration")

    # Ensure there's at least one config left?
    # Actually, we just need to make sure we don't delete the only one if it's active.

    await db.delete(db_config)
    await db.commit()
    return


@router.post("/{config_id}/activate", response_model=HomeConfigRead)
async def activate_home_config(
    config_id: int, db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)
):
    """Activate a specific home page configuration (Admin only)."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == config_id))
    target_config = result.scalar_one_or_none()

    if not target_config:
        raise HTTPException(status_code=404, detail="Home configuration not found")

    # Deactivate all others
    from sqlalchemy import update

    await db.execute(update(HomeConfig).values(is_active=False))

    # Activate target
    target_config.is_active = True

    await db.commit()
    await db.refresh(target_config)
    return target_config


@router.post("/upload/video", status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...), admin=Depends(RequireAdmin)):
    """Upload a promotional video (Admin only)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_VIDEO_EXT:
        raise HTTPException(
            status_code=400, detail=f"Invalid video extension. Allowed: {ALLOWED_VIDEO_EXT}"
        )

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(VIDEO_UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/static/videos/{filename}", "filename": filename}


@router.post("/upload/subtitle", status_code=status.HTTP_201_CREATED)
async def upload_subtitle(file: UploadFile = File(...), admin=Depends(RequireAdmin)):
    """Upload a subtitle file (Admin only)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_SUBTITLE_EXT:
        raise HTTPException(
            status_code=400, detail=f"Invalid subtitle extension. Allowed: {ALLOWED_SUBTITLE_EXT}"
        )

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(VIDEO_UPLOAD_DIR, filename)  # Keep subtitles with videos

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/static/videos/{filename}", "filename": filename}


@router.post("/upload/audio", status_code=status.HTTP_201_CREATED)
async def upload_audio(file: UploadFile = File(...), admin=Depends(RequireAdmin)):
    """Upload an audio track file (Admin only)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_AUDIO_EXT:
        raise HTTPException(
            status_code=400, detail=f"Invalid audio extension. Allowed: {ALLOWED_AUDIO_EXT}"
        )

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(VIDEO_UPLOAD_DIR, filename)  # Keep audio tracks with videos

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/static/videos/{filename}", "filename": filename}


@router.post("/upload/carousel", status_code=status.HTTP_201_CREATED)
async def upload_carousel_image(file: UploadFile = File(...), admin=Depends(RequireAdmin)):
    """Upload a carousel image (Admin only)."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(
            status_code=400, detail=f"Invalid image extension. Allowed: {ALLOWED_IMAGE_EXT}"
        )

    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(CAROUSEL_UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/static/carousel/{filename}", "filename": filename}
