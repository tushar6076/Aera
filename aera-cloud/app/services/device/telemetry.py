import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core import logger, AsyncSessionLocal, get_redis_client
from app.db.models.reading import Reading
from app.db.models.device import Device
from app.utils.aqi import compute_naqi
from app.utils.validators import validate_sensor_payload

async def process_telemetry(
    device_id: str,
    data: dict,
    session: AsyncSession | None = None,
) -> dict | None:
    """
    Validates sensor values, computes multi-pollutant NAQI, updates Redis hot
    telemetry/heartbeat, persists reading to PostgreSQL, and returns enriched telemetry.
    """
    device_id = device_id.strip().upper()

    if not validate_sensor_payload(data):
        logger.warning(f"Validation warning on telemetry from '{device_id}': {data}")

    # Standardize input keys
    pm2_5_val = data.get("pm2_5") if data.get("pm2_5") is not None else data.get("pm25", 0.0)
    pm10_val = data.get("pm10", 0.0)
    co_val = data.get("co", 0.0)

    try:
        pm2_5 = float(pm2_5_val or 0.0)
        pm10 = float(pm10_val or 0.0)
        co = float(co_val or 0.0)
        temp = float(data.get("temperature")) if data.get("temperature") is not None else None
        hum = float(data.get("humidity")) if data.get("humidity") is not None else None
    except (ValueError, TypeError) as err:
        logger.warning(f"Rejected unparsable telemetry from '{device_id}': {err}")
        return None

    # Bi-directional calculation across all available pollutants
    aqi, category = compute_naqi(pm2_5=pm2_5, pm10=pm10, co=co)

    # Threshold alerts: CO hazard or severe overall AQI
    co_alert = co >= 350.0
    buzzer_alert = (aqi > 300) or co_alert

    enriched = {
        "device_id": device_id,
        "pm2_5": pm2_5,
        "pm10": pm10,
        "co": co,
        "temperature": temp,
        "humidity": hum,
        "aqi": aqi,
        "category": category,
        "buzzer_alert": buzzer_alert,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # 1. Update in-memory Redis cache
    redis = get_redis_client()
    if redis:
        try:
            await redis.set(f"device:{device_id}:heartbeat", "online", ex=15)
            await redis.set(f"device:{device_id}:latest", json.dumps(enriched))
        except Exception as e:
            logger.error(f"Redis cache write failed for '{device_id}': {e}")

    # 2. Persist to PostgreSQL
    async def _save_record(s: AsyncSession):
        stmt = select(Device).where(Device.id == device_id)
        result = await s.execute(stmt)
        dev = result.scalars().first()

        if not dev:
            dev = Device(
                id=device_id,
                name=f"Node {device_id[-6:] if len(device_id) >= 6 else device_id}",
                owner_id=None,
            )
            s.add(dev)
            await s.flush()

        if dev.owner_id is None and redis:
            try:
                await redis.set(f"device:{device_id}:unclaimed", "true", ex=900)
            except Exception:
                pass

        record = Reading(
            device_id=device_id,
            pm2_5=pm2_5,
            pm10=pm10,
            co=co,
            temperature=temp,
            humidity=hum,
            aqi=aqi,
            category=category,
        )
        s.add(record)
        await s.commit()

    try:
        if session:
            await _save_record(session)
        else:
            async with AsyncSessionLocal() as fresh_session:
                await _save_record(fresh_session)
    except Exception as e:
        logger.error(f"Database persist failed for '{device_id}': {e}")

    return enriched