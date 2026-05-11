from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubtitleTrack(BaseModel):
    label: str
    src: str
    src_lang: str = Field(..., alias="srcLang")
    default: bool = False

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)


class AudioTrack(BaseModel):
    label: str
    src: str
    lang: str
    default: bool = False

    model_config = ConfigDict(from_attributes=True)


class VideoConfig(BaseModel):
    enabled: bool = False
    url: str | None = ""
    title: str | None = ""
    description: str | None = ""
    autoplay: bool = False
    default_subtitle: str | None = ""
    default_audio: str | None = ""
    subtitles: list[SubtitleTrack] = []
    audio_tracks: list[AudioTrack] = []

    model_config = ConfigDict(from_attributes=True)


class CarouselSlide(BaseModel):
    id: str
    image_url: str
    title: str | None = ""
    description: str | None = ""
    link_url: str | None = ""
    order: int = 0
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True)


class CarouselConfig(BaseModel):
    max_width: int = 1920
    max_height: int = 1080
    aspect_ratio: str = "16:9"
    slides: list[CarouselSlide] = []

    model_config = ConfigDict(from_attributes=True)


class HomeConfigData(BaseModel):
    video: VideoConfig
    carousel: CarouselConfig

    model_config = ConfigDict(from_attributes=True)


class HomeConfigRead(BaseModel):
    id: int
    config: HomeConfigData
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HomeConfigUpdate(BaseModel):
    config: HomeConfigData
