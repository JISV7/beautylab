import os
import shutil
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import RequireAdmin, get_db
from app.models.home_config import HomeConfig
from app.schemas.home_config import HomeConfigRead, HomeConfigUpdate

router = APIRouter(prefix="/home-config", tags=["Home Configuration"])

VIDEO_UPLOAD_DIR = "uploads/videos"
CAROUSEL_UPLOAD_DIR = "uploads/carousel"

os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)
os.makedirs(CAROUSEL_UPLOAD_DIR, exist_ok=True)

ALLOWED_VIDEO_EXT = {".mp4", ".webm", ".ogg"}
ALLOWED_SUBTITLE_EXT = {".vtt", ".srt"}
ALLOWED_AUDIO_EXT = {".mp3", ".wav", ".aac", ".m4a", ".ogg"}
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".svg"}


@router.get("", response_model=HomeConfigRead)
async def get_home_config(db: AsyncSession = Depends(get_db)):
    """Get the current home page configuration."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == 1))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Home configuration not found")
    return config


@router.put("", response_model=HomeConfigRead)
async def update_home_config(
    config_update: HomeConfigUpdate, db: AsyncSession = Depends(get_db), admin=Depends(RequireAdmin)
):
    """Update the home page configuration (Admin only)."""
    result = await db.execute(select(HomeConfig).where(HomeConfig.id == 1))
    db_config = result.scalar_one_or_none()

    if not db_config:
        # Create it if it doesn't exist for some reason
        db_config = HomeConfig(id=1, config=config_update.config.model_dump())
        db.add(db_config)
    else:
        db_config.config = config_update.config.model_dump()

    await db.commit()
    await db.refresh(db_config)
    return db_config


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
