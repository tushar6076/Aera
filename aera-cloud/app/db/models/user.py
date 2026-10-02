# app/db/models/user.py

from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.db.base import TimestampMixin

if TYPE_CHECKING:
    from app.db.models.device import Device
    from app.db.models.ai import ChatMessage


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Devices linked to this user (SET NULL on delete keeps the hardware registered in cloud)
    devices: Mapped[List["Device"]] = relationship(
        "Device",
        back_populates="owner",
        passive_deletes=True,
    )

    # Conversational turns with Groq Atmospheric Intelligence
    chat_messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(ChatMessage.created_at)",
    )