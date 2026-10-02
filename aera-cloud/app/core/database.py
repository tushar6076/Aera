# app/core/database.py

from typing import AsyncGenerator
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import redis.asyncio as aioredis
from app.core.config import settings

class Base(DeclarativeBase):
    pass

engine_kwargs = {"echo": False}

if "sqlite" not in settings.DATABASE_URL:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_size": 10,
            "max_overflow": 20,
        }
    )

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# In-memory Redis pool / client singleton
_redis_pool: aioredis.ConnectionPool | None = None

def get_redis_client() -> aioredis.Redis | None:
    """Returns an async Redis client instance if REDIS_URL is configured."""
    global _redis_pool
    if not settings.REDIS_URL:
        return None
    if _redis_pool is None:
        _redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=20,
        )
    return aioredis.Redis(connection_pool=_redis_pool)