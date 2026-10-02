# app/db/models/reading.py

from typing import TYPE_CHECKING
from sqlalchemy import Float, Integer, String, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.db.base import TimestampMixin  # Provides created_at / updated_at

if TYPE_CHECKING:
    from app.db.models.device import Device


class Reading(Base, TimestampMixin):
    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[str] = mapped_column(
        String(32), 
        ForeignKey("devices.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )

    # Sensor Telemetry Fields
    pm2_5: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    pm10: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    co: Mapped[float | None] = mapped_column(Float, nullable=True)  # MQ-9 Carbon Monoxide (PPM)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Calculated Indexing
    aqi: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)  # Good, Moderate, Poor, etc.

    # Relationships
    device: Mapped["Device"] = relationship("Device", back_populates="readings")

    __table_args__ = (
        Index("idx_device_reading_timestamp", "device_id", "created_at"),
    )