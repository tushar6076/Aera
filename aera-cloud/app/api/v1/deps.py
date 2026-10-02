# app/api/v1/deps.py

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import CredentialsException
from app.db.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_raw = payload.get("sub")
        token_type = payload.get("type", "access")  # default to access if not set
        
        if not user_id_raw:
            raise CredentialsException()
            
        # Convert string token subject to integer for Postgres primary key lookup
        user_id = int(user_id_raw)
    except (JWTError, ValueError, TypeError):
        raise CredentialsException()

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise CredentialsException(detail="Inactive or non-existent user account.")

    return user