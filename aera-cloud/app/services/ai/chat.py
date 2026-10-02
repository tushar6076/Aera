# app/services/ai/chat.py

import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from groq import AsyncGroq

from app.core.config import settings
from app.core import get_redis_client
from app.core.logging import logger
from app.db.models.ai import ChatMessage
from app.db.models.reading import Reading
from app.schemas.ai import ChatResponse, AmbientContext
from app.services.ai.client import get_groq_client
from app.services.ai.prompts import build_chat_system_prompt, format_telemetry_snapshot
from app.services.ai.safety import sanitize_recommendation, validate_input_bounds


async def handle_user_chat(
    user_id: str | int,
    message: str,
    session_id: str | None,
    device_id: str | None,
    db: AsyncSession,
    ambient_context: AmbientContext | None = None,
) -> ChatResponse:
    client: AsyncGroq = get_groq_client()
    session_key = session_id or str(uuid.uuid4())
    numeric_user_id = int(user_id)

    telemetry_context: str | None = None
    telemetry_injected = False
    redis = get_redis_client()

    # -------------------------------------------------------------------------
    # Case A: Hardware Telemetry Injection (Redis-First, Postgres Fallback)
    # -------------------------------------------------------------------------
    if device_id:
        hardware_snapshot = None

        # 1. Attempt sub-millisecond Redis RAM lookup
        if redis:
            try:
                cached_raw = await redis.get(f"device:{device_id}:latest")
                if cached_raw:
                    hardware_snapshot = json.loads(cached_raw)
            except Exception as e:
                logger.warning(f"Redis lookup failed for device context '{device_id}': {e}")

        if hardware_snapshot:
            is_valid, _ = validate_input_bounds(
                hardware_snapshot.get("aqi", 0),
                hardware_snapshot.get("temperature"),
                hardware_snapshot.get("humidity"),
            )
            if is_valid:
                telemetry_context = format_telemetry_snapshot(
                    device_id=device_id,
                    timestamp=hardware_snapshot.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    aqi=hardware_snapshot.get("aqi"),
                    pm25=hardware_snapshot.get("pm2_5"),
                    pm10=hardware_snapshot.get("pm10"),
                    temperature=hardware_snapshot.get("temperature"),
                    humidity=hardware_snapshot.get("humidity"),
                    co=hardware_snapshot.get("co", "N/A"),
                    source_type="ESP32 Hardware Node",
                )
                telemetry_injected = True
        else:
            # 2. Cold-start fallback to PostgreSQL
            query = (
                select(Reading)
                .where(Reading.device_id == device_id)
                .order_by(desc(Reading.created_at))
                .limit(1)
            )
            result = await db.execute(query)
            latest: Reading | None = result.scalars().first()

            if latest:
                is_valid, _ = validate_input_bounds(latest.aqi or 0, latest.temperature, latest.humidity)
                if is_valid:
                    telemetry_context = format_telemetry_snapshot(
                        device_id=device_id,
                        timestamp=latest.created_at.isoformat(),
                        aqi=latest.aqi,
                        pm25=latest.pm2_5,
                        pm10=latest.pm10,
                        temperature=latest.temperature,
                        humidity=latest.humidity,
                        co=latest.co if latest.co is not None else "N/A",
                        source_type="ESP32 Hardware Node",
                    )
                    telemetry_injected = True

    # -------------------------------------------------------------------------
    # Case B: Ambient Regional Telemetry Injection (No Hardware Selected)
    # -------------------------------------------------------------------------
    else:
        cached_ambient = None
        if redis:
            try:
                raw_cached = await redis.get(f"ambient:user:{numeric_user_id}:latest")
                if raw_cached:
                    cached_ambient = json.loads(raw_cached)
            except Exception as e:
                logger.warning(f"Failed to fetch ambient user cache: {e}")

        if cached_ambient:
            telemetry_context = format_telemetry_snapshot(
                device_id=None,
                timestamp=cached_ambient.get("timestamp", datetime.now(timezone.utc).isoformat()),
                aqi=cached_ambient.get("aqi"),
                pm25=cached_ambient.get("pm25"),
                pm10=cached_ambient.get("pm10"),
                temperature=cached_ambient.get("temperature"),
                humidity=cached_ambient.get("humidity"),
                co=cached_ambient.get("co", "N/A"),
                source_type=f"Ambient Regional Grid ({cached_ambient.get('source', 'Outdoor')})",
            )
            telemetry_injected = True
        elif ambient_context:
            telemetry_context = format_telemetry_snapshot(
                device_id=None,
                timestamp=datetime.now(timezone.utc).isoformat(),
                aqi=ambient_context.aqi,
                pm25=ambient_context.pm25,
                pm10=ambient_context.pm10,
                temperature=ambient_context.temperature,
                humidity=ambient_context.humidity,
                co=ambient_context.co if ambient_context.co is not None else "N/A",
                source_type=f"Ambient Regional Grid ({ambient_context.location_name or 'Outdoor'})",
            )
            telemetry_injected = True

    # -------------------------------------------------------------------------
    # Assemble Groq Prompt Payload
    # -------------------------------------------------------------------------
    system_content = build_chat_system_prompt(telemetry_context=telemetry_context)

    # Fetch last 6 conversation turns
    history_query = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_key)
        .order_by(desc(ChatMessage.created_at))
        .limit(6)
    )
    history_records = (await db.execute(history_query)).scalars().all()
    history_records.reverse()

    messages = [{"role": "system", "content": system_content}]
    for past in history_records:
        messages.append({"role": past.role, "content": past.content})
    messages.append({"role": "user", "content": message})

    # -------------------------------------------------------------------------
    # Execute Groq Inference
    # -------------------------------------------------------------------------
    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=500,
        )
        raw_reply = response.choices[0].message.content or "No response generated."
    except Exception as e:
        logger.error(f"Groq conversational inference error: {e}")
        raw_reply = "Atmospheric processing is temporarily unavailable. Please retry in a few moments."

    # Enforce non-clinical safety guardrails
    sanitized_reply = sanitize_recommendation(raw_reply)

    # -------------------------------------------------------------------------
    # Persist Conversation Turns in PostgreSQL
    # -------------------------------------------------------------------------
    user_msg_entry = ChatMessage(
        user_id=numeric_user_id,
        device_id=device_id,
        session_id=session_key,
        role="user",
        content=message,
    )
    bot_msg_entry = ChatMessage(
        user_id=numeric_user_id,
        device_id=device_id,
        session_id=session_key,
        role="assistant",
        content=sanitized_reply,
    )
    db.add_all([user_msg_entry, bot_msg_entry])
    await db.commit()
    await db.refresh(bot_msg_entry)

    return ChatResponse(
        reply=sanitized_reply,
        session_id=session_key,
        device_id=device_id,
        telemetry_injected=telemetry_injected,
        created_at=bot_msg_entry.created_at,
    )