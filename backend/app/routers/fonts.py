import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.font import Font
from app.models.user import User
from app.core.dependencies import get_current_user
from app.schemas.font import FontResponse

router = APIRouter(prefix="/fonts", tags=["Fonts"])

UPLOAD_DIR = "uploads/fonts"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".ttf", ".otf", ".woff", ".woff2"}


@router.get("", response_model=List[FontResponse])
async def list_fonts(db: AsyncSession = Depends(get_db)):
    """Get all installed custom fonts."""
    result = await db.execute(select(Font).order_by(Font.name))
    return result.scalars().all()


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
            detail=f"Invalid file extension. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Generate unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file.")
    
    # Font name is derived from the original filename without extension
    font_name = os.path.splitext(file.filename)[0] if file.filename else "Unknown Font"
    
    # The URL that the frontend will load it from
    font_url = f"/static/fonts/{unique_filename}"
    
    # Create DB entry
    db_font = Font(
        name=font_name,
        filename=unique_filename,
        url=font_url,
        created_by=current_user.id
    )
    
    db.add(db_font)
    await db.commit()
    await db.refresh(db_font)
    
    return db_font


@router.delete("/{font_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_font(
    font_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a custom font."""
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
            pass # Ignore if file missing or locked
            
    await db.delete(font)
    await db.commit()
