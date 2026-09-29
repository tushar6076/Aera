import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.aqi import compute_naqi
from app.utils.validators import validate_sensor_payload
from app.services.device.telemetry import process_telemetry
from app.db.models.device import Device
from app.db.models.reading import Reading


def test_naqi_breakpoint_logic():
    aqi, cat = compute_naqi(pm2_5=15.0, pm10=20.0)
    assert cat == "Good"
    assert aqi <= 50

    aqi, cat = compute_naqi(pm2_5=75.0, pm10=80.0)
    assert cat == "Moderate"
    assert 101 <= aqi <= 200

    aqi, cat = compute_naqi(pm2_5=280.0, pm10=450.0)
    assert cat == "Severe"
    assert aqi >= 401


def test_sensor_payload_validation():
    assert validate_sensor_payload({"pm2_5": 25.0, "pm10": 45.0, "temperature": 28.0, "humidity": 60.0}) is True
    assert validate_sensor_payload({"temperature": 28.0}) is False
    assert validate_sensor_payload({"pm2_5": -5.0, "pm10": 50.0}) is False
    assert validate_sensor_payload({"pm2_5": 50.0, "pm10": 2000.0}) is False
    assert validate_sensor_payload({"pm2_5": 50.0, "pm10": 80.0, "humidity": 120.0}) is False


@pytest.mark.asyncio
async def test_process_telemetry_persists_and_flags_buzzer(db_session: AsyncSession):
    device_id = "esp_node_unit_test"
    payload = {
        "pm2_5": 140.0,
        "pm10": 220.0,
        "temperature": 32.5,
        "humidity": 55.0,
    }

    result = await process_telemetry(device_id, payload, session=db_session)
    assert result is not None
    assert result["device_id"] == device_id
    assert result["aqi"] > 200
    assert result["buzzer_alert"] is True

    # Verify device exists in the session
    dev = await db_session.get(Device, device_id)
    assert dev is not None


@pytest.mark.asyncio
async def test_get_latest_reading_endpoint(client: AsyncClient, db_session: AsyncSession):
    device_id = "esp_test_device_01"

    dev = Device(id=device_id, name="Test Node")
    db_session.add(dev)
    await db_session.flush()

    reading = Reading(
        device_id=device_id,
        pm2_5=25.0,
        pm10=50.0,
        temperature=27.0,
        humidity=65.0,
        aqi=42,
        category="Good",
    )
    db_session.add(reading)
    await db_session.commit()

    response = await client.get(f"/api/v1/monitoring/latest/{device_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["device_id"] == device_id
    assert data["aqi"] == 42
    assert data["category"] == "Good"


@pytest.mark.asyncio
async def test_get_latest_reading_not_found(client: AsyncClient):
    response = await client.get("/api/v1/monitoring/latest/non_existent_node")
    assert response.status_code == 404