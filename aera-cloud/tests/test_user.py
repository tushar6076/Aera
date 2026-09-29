import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.device import Device

pytestmark = pytest.mark.asyncio


async def _get_auth_headers(client: AsyncClient, email: str = "user@hacksmiths.dev") -> dict:
    """Helper to register and return authorization headers with a fresh Bearer token."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "UserPass123!", "full_name": "Test User"},
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "UserPass123!"},
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


async def test_get_me_unauthorized(client: AsyncClient):
    """Calling /me without an Authorization header must return 401."""
    response = await client.get("/api/v1/user/me")
    assert response.status_code == 401


async def test_get_me_success(client: AsyncClient):
    """Calling /me with a valid token returns profile details."""
    headers = await _get_auth_headers(client, email="me_check@hacksmiths.dev")
    response = await client.get("/api/v1/user/me", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me_check@hacksmiths.dev"
    assert data["full_name"] == "Test User"
    assert "id" in data


async def test_update_profile(client: AsyncClient):
    """Partially updates the user's name and email."""
    headers = await _get_auth_headers(client, email="update_me@hacksmiths.dev")

    patch_payload = {"full_name": "Updated Name"}
    response = await client.patch("/api/v1/user/me", json=patch_payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Name"


async def test_claim_and_list_devices(client: AsyncClient):
    """A user can claim a hardware device and see it listed in their account."""
    headers = await _get_auth_headers(client, email="owner@hacksmiths.dev")
    device_id = "esp32_living_room"

    # Claim device
    claim_payload = {"device_id": device_id, "name": "Living Room Monitor"}
    claim_res = await client.post("/api/v1/user/claim-device", json=claim_payload, headers=headers)
    assert claim_res.status_code == 200
    assert claim_res.json()["id"] == device_id
    assert claim_res.json()["name"] == "Living Room Monitor"

    # List claimed devices
    list_res = await client.get("/api/v1/user/devices", headers=headers)
    assert list_res.status_code == 200
    devices = list_res.json()
    assert len(devices) == 1
    assert devices[0]["id"] == device_id


async def test_claim_device_already_owned_conflict(client: AsyncClient):
    """Another user cannot claim a device that is already bound to someone else."""
    owner_headers = await _get_auth_headers(client, email="original_owner@hacksmiths.dev")
    attacker_headers = await _get_auth_headers(client, email="second_user@hacksmiths.dev")

    device_id = "esp32_exclusive_node"

    # First user claims
    await client.post(
        "/api/v1/user/claim-device",
        json={"device_id": device_id, "name": "Owner Node"},
        headers=owner_headers,
    )

    # Second user attempts to claim the same hardware ID
    conflict_res = await client.post(
        "/api/v1/user/claim-device",
        json={"device_id": device_id, "name": "Stolen Node"},
        headers=attacker_headers,
    )
    assert conflict_res.status_code == 409
    assert "already claimed" in conflict_res.json()["detail"].lower()


async def test_release_device(client: AsyncClient, db_session: AsyncSession):
    """A user can unbind/release their device so it is no longer associated with them."""
    headers = await _get_auth_headers(client, email="releaser@hacksmiths.dev")
    device_id = "esp32_to_release"

    # Claim
    await client.post(
        "/api/v1/user/claim-device",
        json={"device_id": device_id, "name": "Temporary Node"},
        headers=headers,
    )

    # Release
    del_res = await client.delete(f"/api/v1/user/devices/{device_id}", headers=headers)
    assert del_res.status_code == 204

    # Confirm device list is now empty
    list_res = await client.get("/api/v1/user/devices", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 0

    # Ensure device record still exists in DB, but with owner_id = None
    dev = await db_session.get(Device, device_id)
    assert dev is not None
    assert dev.owner_id is None