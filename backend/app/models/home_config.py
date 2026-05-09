from sqlalchemy import TIMESTAMP, Column, Integer, func
from sqlalchemy.dialects.postgresql import JSONB

from .base import Base


class HomeConfig(Base):
    __tablename__ = "home_configs"

    id = Column(Integer, primary_key=True)
    config = Column(JSONB, nullable=False, default=dict, server_default="'{}'::jsonb")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
