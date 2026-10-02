# app/api/v1/ai.py

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_db
from app.db.models.user import User
from app.db.models.device import Device, DeviceVisibility
from app.db.models.ai import ChatMessage
from app.schemas.ai import ChatRequest, ChatResponse, ChatMessageItem
from app.services.ai.chat import handle_user_chat
from app.api.v1.deps import get_current_user

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_aera_intelligence(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.device_id:
        dev = await db.get(Device, payload.device_id)
        if not dev:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target node '{payload.device_id}' does not exist.",
            )
        if dev.visibility == DeviceVisibility.PRIVATE and dev.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to target device telemetry.",
            )

    return await handle_user_chat(
        user_id=str(current_user.id),
        message=payload.message,
        session_id=payload.session_id,
        device_id=payload.device_id,
        ambient_context=payload.ambient_context,
        db=db,
    )


@router.get("/history/{session_id}", response_model=List[ChatMessageItem])
async def get_chat_session_history(
    session_id: str,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Loads previous conversation turns for a given chat session."""
    query = (
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session_id,
            ChatMessage.user_id == current_user.id,
        )
        .order_by(desc(ChatMessage.created_at))
        .limit(limit)
    )
    result = await db.execute(query)
    messages = list(reversed(result.scalars().all()))

    return [
        ChatMessageItem(role=msg.role, content=msg.content)
        for msg in messages
    ]