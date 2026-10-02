# app/db/models/ai.py

import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.db.models.user import User
    from app.db.models.device import Device


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )

    # Must be Integer to match User.id (Mapped[int])
    user_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )

    # Matches Device.id (String(32))
    device_id: Mapped[Optional[str]] = mapped_column(
        String(32), 
        ForeignKey("devices.id", ondelete="SET NULL"), 
        nullable=True, 
        index=True
    )

    session_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user", "assistant", or "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )

    # Explicit bidirectional relationships matching User and Device
    user: Mapped["User"] = relationship("User", back_populates="chat_messages")
    device: Mapped[Optional["Device"]] = relationship("Device")

    __table_args__ = (
        Index("ix_chat_session_created", "session_id", "created_at"),
    )