# app/services/ai/recommendation.py

import json
from app.core.config import settings
from app.core.logging import logger
from app.services.ai.client import get_groq_client
from app.services.ai.prompts import (
    AQI_RECOMMENDATION_SYSTEM_PROMPT,
    build_recommendation_prompt,
)
from app.schemas.monitoring import StructuredRecommendation


def _calculate_fallback_aqi(pm2_5: float | None, pm10: float | None, fallback: int = 50) -> int:
    val = pm2_5 if pm2_5 is not None else (pm10 / 2.0 if pm10 is not None else None)
    if val is None:
        return fallback
    if val <= 12.0:
        return int((50 / 12.0) * val)
    elif val <= 35.4:
        return int(50 + ((100 - 50) / (35.4 - 12.0)) * (val - 12.0))
    elif val <= 55.4:
        return int(101 + ((150 - 101) / (55.4 - 35.4)) * (val - 35.4))
    else:
        return int(151 + ((200 - 151) / (150.4 - 55.4)) * (val - 55.4))


async def generate_aqi_precaution(
    aqi: int | None = None,
    category: str | None = None,
    temperature: float | None = None,
    humidity: float | None = None,
    pm2_5: float | None = None,
    pm10: float | None = None,
    co: float | None = None,
    source: str = "ambient",
) -> StructuredRecommendation:
    """Generates structured, dynamic health guidance using Groq."""
    resolved_aqi = aqi if aqi is not None else _calculate_fallback_aqi(pm2_5, pm10)
    resolved_cat = category or ("Good" if resolved_aqi <= 50 else "Moderate" if resolved_aqi <= 100 else "Unhealthy")

    # Offline / missing credentials fallback
    if not settings.GROQ_API_KEY:
        tone = "emerald" if resolved_aqi <= 50 else "sky" if resolved_aqi <= 100 else "rose"
        return StructuredRecommendation(
            source=source,
            aqi=resolved_aqi,
            category=resolved_cat,
            tone=tone,
            summary=f"Air quality currently sits at index {resolved_aqi} ({resolved_cat}).",
            precautions=[
                "Maintain standard indoor air filtration.",
                "Ventilate living spaces during low-particulate hours.",
                "Stay hydrated and monitor breathing ease outdoors.",
            ],
            vulnerable_groups_warning="Individuals with respiratory sensitivities should moderate high-intensity outdoor activities.",
        )

    client = get_groq_client()
    user_prompt = build_recommendation_prompt(
        aqi=resolved_aqi,
        category=resolved_cat,
        temperature=temperature,
        humidity=humidity,
        pm2_5=pm2_5,
        pm10=pm10,
        co=co,
        source=source,
    )

    try:
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": AQI_RECOMMENDATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=1024,  # <-- Raised from 400 to prevent JSON truncation
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)

        return StructuredRecommendation(
            source=source,
            aqi=parsed.get("aqi", resolved_aqi),
            category=parsed.get("category", resolved_cat),
            tone=parsed.get("tone", "sky"),
            summary=parsed.get("summary", f"Atmosphere evaluated at {resolved_cat}."),
            precautions=parsed.get("precautions", ["Keep living spaces adequately ventilated."]),
            vulnerable_groups_warning=parsed.get("vulnerable_groups_warning"),
        )
    except Exception as e:
        logger.error(f"Groq API recommendation generation failed: {e}")
        tone = "emerald" if resolved_aqi <= 50 else "sky" if resolved_aqi <= 100 else "rose"
        return StructuredRecommendation(
            source=source,
            aqi=resolved_aqi,
            category=resolved_cat,
            tone=tone,
            summary=f"Automated evaluation: conditions currently ranked {resolved_cat}.",
            precautions=[
                "Limit prolonged heavy aerobic exposure during peak hours.",
                "Ensure indoor HEPA filters or fresh air circulation are running.",
            ],
            vulnerable_groups_warning="Sensitive groups should observe breathing comfort during travel.",
        )