# aera-cloud/app/api/v1/user/__init__.py

from fastapi import APIRouter
from app.api.v1.user.profile import router as profile_router
from app.api.v1.user.device import router as device_router

router = APIRouter()

# Include sub-modules under the /user scope without adding extra path nesting
router.include_router(profile_router)
router.include_router(device_router)

__all__ = ["router"]