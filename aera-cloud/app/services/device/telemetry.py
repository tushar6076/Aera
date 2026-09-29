from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.db.models.reading import Reading
from app.db.models.device import Device
from app.utils.aqi import compute_naqi
from app.utils.validators import validate_sensor_payload
from app.core.logging import logger


async def process_telemetry(
    device_id: str,
    data: dict,
    session: AsyncSession | None = None,
) -> dict | None:
    """
    Validates sensor values, computes NAQI, stores reading in PostgreSQL,
    and returns enriched data with buzzer triggers for the ESP32.
    """
    if not validate_sensor_payload(data):
        logger.warning(f"Rejected invalid telemetry from '{device_id}': {data}")
        return None

    pm2_5 = float(data.get("pm2_5", 0.0))
    pm10 = float(data.get("pm10", 0.0))
    temp = float(data.get("temperature")) if data.get("temperature") is not None else None
    hum = float(data.get("humidity")) if data.get("humidity") is not None else None

    aqi, category = compute_naqi(pm2_5, pm10)

    async def _save_record(s: AsyncSession):
        dev = await s.get(Device, device_id)
        if not dev:
            dev = Device(id=device_id, name=f"Node {device_id}")
            s.add(dev)
            await s.flush()

        record = Reading(
            device_id=device_id,
            pm2_5=pm2_5,
            pm10=pm10,
            temperature=temp,
            humidity=hum,
            aqi=aqi,
            category=category,
        )
        s.add(record)
        await s.commit()

    if session:
        await _save_record(session)
    else:
        async with AsyncSessionLocal() as fresh_session:
            await _save_record(fresh_session)

    return {
        "device_id": device_id,
        "pm2_5": pm2_5,
        "pm10": pm10,
        "temperature": temp,
        "humidity": hum,
        "aqi": aqi,
        "category": category,
        "buzzer_alert": aqi > 200,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }