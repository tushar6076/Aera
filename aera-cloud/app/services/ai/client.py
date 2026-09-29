from groq import AsyncGroq
from app.core.config import settings

_groq_client: AsyncGroq | None = None


def get_groq_client() -> AsyncGroq:
    """Returns singleton AsyncGroq client."""
    global _groq_client
    if _groq_client is None:
        _groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _groq_client