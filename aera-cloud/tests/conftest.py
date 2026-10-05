# aera-cloud/tests/conftest.py
import sys
import os
from pathlib import Path
from unittest.mock import AsyncMock

# Add project root directory to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Use the exact same database as the app (fall back to standard local credentials if not set)
POSTGRES_DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://tushar:password@localhost:5432/aera_db"
)

os.environ["SECRET_KEY"] = "test-secret-key-for-local-environment-32chars"
os.environ["DATABASE_URL"] = POSTGRES_DB_URL
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEVICE_PRESHARED_KEY"] = "test-pre-shared-hardware-key"

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from sqlalchemy import text

import app.core.database as db_module
from app import create_app

# Engine targeting aera_db
test_engine = create_async_engine(
    POSTGRES_DB_URL,
    poolclass=NullPool,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Overwrite engine & sessionmaker in core database module
db_module.engine = test_engine
db_module.AsyncSessionLocal = TestingSessionLocal


@pytest_asyncio.fixture(autouse=True)
async def clean_test_artifacts():
    """
    Runs before and after each test.
    Cleans up ONLY test records without touching real user accounts or devices.
    """
    yield
    async with test_engine.begin() as conn:
        # Delete only accounts registered with @hacksmiths.dev test domain
        await conn.execute(text("DELETE FROM readings WHERE device_id LIKE 'AERA-%' OR device_id LIKE 'ESP%'"))
        await conn.execute(text("DELETE FROM devices WHERE id LIKE 'AERA-%' OR id LIKE 'ESP%'"))
        await conn.execute(text("DELETE FROM users WHERE email LIKE '%@hacksmiths.dev'"))


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a fresh database session per test."""
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(monkeypatch) -> AsyncGenerator[AsyncClient, None]:
    """ASGI client where get_db returns a session from TestingSessionLocal."""
    # Mock external email sending service
    try:
        from app.services import email
        monkeypatch.setattr(email, "send_mail", AsyncMock(return_value=True))
    except (ImportError, AttributeError):
        pass

    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[db_module.get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()