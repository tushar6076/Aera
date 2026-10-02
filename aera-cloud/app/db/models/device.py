# app/db/models/device.py

import enum
from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Boolean, ForeignKey, Enum as SQLEnum, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.reading import Reading


class DeviceVisibility(str, enum.Enum):
    PRIVATE = "private"
    PUBLIC = "public"


class Device(Base):
    __tablename__ = "devices"

    # Hardware MAC e.g. "AERA-B21A80"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64), default="My Aera Node", nullable=False)

    # Ownership: Nullable when hardware node is unclaimed/broadcasting
    # Set to Integer if User.id is Integer (or String if using UUIDs)
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    visibility: Mapped[DeviceVisibility] = mapped_column(
        SQLEnum(DeviceVisibility),
        default=DeviceVisibility.PRIVATE,
        nullable=False,
    )
    claim_secret: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    claimed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # --- Relationships ---
    owner: Mapped[Optional["User"]] = relationship("User", back_populates="devices")

    # Bidirectional link matching Reading.device
    readings: Mapped[List["Reading"]] = relationship(
        "Reading",
        back_populates="device",
        cascade="all, delete-orphan",
        order_by="desc(Reading.created_at)",
    )