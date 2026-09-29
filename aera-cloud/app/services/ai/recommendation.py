from app.core.config import settings
from app.core.logging import logger
from app.services.ai.client import get_groq_client
from app.services.ai.prompts import (
    AQI_RECOMMENDATION_SYSTEM_PROMPT,
    build_recommendation_prompt,
)
from app.services.ai.safety import sanitize_recommendation


async def generate_aqi_precaution(
    aqi: int,
    category: str,
    temperature: float | None = None,
    humidity: float | None = None,
) -> str:
    """Generates concise, human-centric precaution guidance using Groq."""
    if not settings.GROQ_API_KEY:
        return (
            f"Air quality is currently {category} (AQI {aqi}). "
            "Wear a mask if you are sensitive to dust and avoid strenuous outdoor exercise."
        )

    client = get_groq_client()
    user_prompt = build_recommendation_prompt(aqi, category, temperature, humidity)

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": AQI_RECOMMENDATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=300,
        )
        raw_text = response.choices[0].message.content or "No precautions available."
        return sanitize_recommendation(raw_text)
    except Exception as e:
        logger.error(f"Groq API recommendation generation failed: {e}")
        return f"Air quality is {category} (AQI {aqi}). Keep windows shut and limit long outdoor exposure."