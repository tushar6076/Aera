# aera-cloud/tests/test_monitoring.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.utils.aqi import compute_naqi
from app.utils.validators import validate_sensor_payload
from app.services.device.telemetry import process_telemetry
from app.db.models.device import Device, DeviceVisibility
from app.db.models.reading import Reading

MONITORING_URL = "/api/v1/monitoring"


# Synchronous pure function tests (NO @pytest.mark.asyncio)
def test_naqi_breakpoint_and_calibrated_co_logic():
    # Good AQI
    aqi, cat = compute_naqi(pm2_5=15.0, pm10=20.0, co=2.0)
    assert cat == "Good"
    assert aqi <= 50

    # Moderate AQI
    aqi, cat = compute_naqi(pm2_5=75.0, pm10=80.0, co=10.0)
    assert cat == "Moderate"
    assert 101 <= aqi <= 200

    # Severe CO event (high MQ-9 PPM)
    aqi, cat = compute_naqi(pm2_5=10.0, pm10=20.0, co=65.0)
    assert aqi >= 300


def test_sensor_payload_validation():
    # Valid complete payload
    assert validate_sensor_payload({"pm2_5": 25.0, "pm10": 45.0, "temperature": 28.0, "humidity": 60.0}) is True
    # Out of range negative values
    assert validate_sensor_payload({"pm2_5": -5.0, "pm10": 50.0}) is False
    # Unrealistic sensor values
    assert validate_sensor_payload({"pm2_5": 50.0, "pm10": 2000.0}) is False


# Async integration tests
@pytest.mark.asyncio
async def test_process_telemetry_persists_and_flags_buzzer(db_session: AsyncSession):
    raw_device_id = "aera-f4803c"
    payload = {
        "pm2_5": 140.0,
        "pm10": 220.0,
        "co": 55.0,  # Above acute 50 PPM threshold
        "temperature": 32.5,
        "humidity": 55.0,
    }

    result = await process_telemetry(raw_device_id, payload, session=db_session)
    assert result is not None
    assert result["device_id"] == "AERA-F4803C"
    assert result["buzzer_alert"] is True

    # Check persistence in database
    dev = await db_session.get(Device, "AERA-F4803C")
    assert dev is not None


@pytest.mark.asyncio
async def test_get_latest_reading_fallback_to_db(client: AsyncClient, db_session: AsyncSession):
    device_id = "AERA-TEST-NODE"

    # 1. Obtain authenticated user headers
    await client.post(
        "/api/v1/auth/register",
        json={"email": "monitor_tester@hacksmiths.dev", "password": "UserPass123!", "full_name": "Monitor Tester"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "monitor_tester@hacksmiths.dev", "password": "UserPass123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed device as PUBLIC so any authenticated user can view its telemetry
    dev = Device(
        id=device_id,
        name="Test Node",
        visibility=DeviceVisibility.PUBLIC,
    )
    db_session.add(dev)
    await db_session.flush()

    reading = Reading(
        device_id=device_id,
        pm2_5=22.0,
        pm10=44.0,
        co=3.2,
        temperature=26.5,
        humidity=60.0,
        aqi=45,
        category="Good",
    )
    db_session.add(reading)
    await db_session.commit()

    # 3. Request with auth headers
    res = await client.get(f"{MONITORING_URL}/latest/{device_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["device_id"] == device_id
    assert data["aqi"] == 45
    assert data["category"] == "Good"