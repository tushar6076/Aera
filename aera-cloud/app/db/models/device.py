from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin

class Device(Base, TimestampMixin):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # hardware serial/MAC
    name: Mapped[str] = mapped_column(String(100), default="Aera Node")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)

    owner: Mapped["User"] = relationship("User", back_populates="devices")
    readings: Mapped[list["Reading"]] = relationship("Reading", back_populates="device", cascade="all, delete-orphan")