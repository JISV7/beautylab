from sqlalchemy import TIMESTAMP, Boolean, Column, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


class HomeConfig(Base):
    __tablename__ = "home_configs"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, default="Default Config", server_default="'Default Config'")
    config = Column(JSONB, nullable=False, default=dict, server_default="'{}'::jsonb")
    is_active = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
