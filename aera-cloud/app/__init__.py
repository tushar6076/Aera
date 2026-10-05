import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging import setup_logging
from app.core.config import settings
from app.core.database import engine
from app.api.router import api_router

__title__ = "Aera Cloud"
__version__ = "0.1.0"
__author__ = "Aera Team"

START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions (DB pool ready)
    yield
    # Shutdown actions: gracefully close database connections
    await engine.dispose()


def create_app() -> FastAPI:
    """Application factory for Aera Cloud."""

    setup_logging()
    
    app = FastAPI(
        title=__title__,
        version=__version__,
        description="Air Quality Index ingestion, live websocket broadcast, and AI-driven health precautions.",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount unified API routers (/api/device and /v1)
    app.include_router(api_router, prefix="/api")

    @app.get("/", tags=["General"])
    async def root():
        return {
            "service": __title__,
            "version": __version__,
            "status": "operational",
            "docs": "/docs",
        }

    @app.get("/health", tags=["General"])
    async def health_check():
        return {
            "status": "healthy",
            "uptime_seconds": round(time.time() - START_TIME, 2),
            "version": __version__,
        }

    return app