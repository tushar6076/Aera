import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.device import Device

pytestmark = pytest.mark.asyncio

USER_URL = "/api/v1/user"
AUTH_URL = "/api/v1/auth"


async def _get_auth_headers(client: AsyncClient, email: str = "operator@hacksmiths.dev") -> dict:
    await client.post(
        f"{AUTH_URL}/register",
        json={"email": email, "password": "UserPass123!", "full_name": "Operator"},
    )
    res = await client.post(
        f"{AUTH_URL}/login",
        json={"email": email, "password": "UserPass123!"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_get_me_unauthorized(client: AsyncClient):
    res = await client.get(f"{USER_URL}/me")
    assert res.status_code == 401


async def test_get_me_success(client: AsyncClient):
    headers = await _get_auth_headers(client, email="me_check@hacksmiths.dev")
    res = await client.get(f"{USER_URL}/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "me_check@hacksmiths.dev"


async def test_claim_and_list_devices(client: AsyncClient):
    headers = await _get_auth_headers(client, email="claim_tester@hacksmiths.dev")
    device_id = "AERA-F4803C"

    # Claim device
    claim_res = await client.post(
        f"{USER_URL}/claim-device",
        json={"device_id": device_id, "name": "Balcony Station"},
        headers=headers,
    )
    assert claim_res.status_code == 200
    assert claim_res.json()["id"] == device_id

    # List devices
    list_res = await client.get(f"{USER_URL}/devices", headers=headers)
    assert list_res.status_code == 200
    devices = list_res.json()
    assert len(devices) == 1
    assert devices[0]["id"] == device_id


async def test_claim_device_already_owned_conflict(client: AsyncClient):
    owner_headers = await _get_auth_headers(client, email="owner1@hacksmiths.dev")
    attacker_headers = await _get_auth_headers(client, email="owner2@hacksmiths.dev")
    device_id = "AERA-EXCLUSIVE"

    # First user claims
    await client.post(
        f"{USER_URL}/claim-device",
        json={"device_id": device_id, "name": "Owner Station"},
        headers=owner_headers,
    )

    # Second user tries to claim same hardware ID
    conflict_res = await client.post(
        f"{USER_URL}/claim-device",
        json={"device_id": device_id, "name": "Hijacked Station"},
        headers=attacker_headers,
    )
    assert conflict_res.status_code == 409


async def test_release_device(client: AsyncClient, db_session: AsyncSession):
    headers = await _get_auth_headers(client, email="releaser@hacksmiths.dev")
    device_id = "AERA-TEMP-NODE"

    # Claim
    await client.post(
        f"{USER_URL}/claim-device",
        json={"device_id": device_id, "name": "Temp Node"},
        headers=headers,
    )

    # Release
    del_res = await client.delete(f"{USER_URL}/devices/{device_id}", headers=headers)
    assert del_res.status_code == 204

    # Device list must now be empty
    list_res = await client.get(f"{USER_URL}/devices", headers=headers)
    assert len(list_res.json()) == 0

    # Device row in database should persist with owner_id = None
    dev = await db_session.get(Device, device_id)
    assert dev is not None
    assert dev.owner_id is None