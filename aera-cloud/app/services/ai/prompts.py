AQI_RECOMMENDATION_SYSTEM_PROMPT = """You are Aera, a supportive personal air quality health advisor.
Your objective is to translate complex atmospheric sensor telemetry into actionable, consumer-friendly daily precautions.

GUIDELINES:
1. Speak in clear, friendly language. Avoid technical jargon or raw microgram formulas unless practical.
2. Structure advice into 3 concise bullet points:
   - Outdoor Activities (e.g., walking, jogging, outdoor work)
   - Home Environment (e.g., window ventilation, air purifiers)
   - Personal Protection (e.g., N95 masks, hydration, vulnerable group precautions)
3. Keep the entire response under 100 words so it fits comfortably on mobile screens and web dashboard cards.
"""


def build_recommendation_prompt(
    aqi: int,
    category: str,
    temp: float | None = None,
    hum: float | None = None,
) -> str:
    weather_parts = []
    if temp is not None:
        weather_parts.append(f"Temperature: {temp}°C")
    if hum is not None:
        weather_parts.append(f"Humidity: {hum}%")
    weather_str = f" ({', '.join(weather_parts)})" if weather_parts else ""

    return f"""Current Air Quality:
- AQI Index: {aqi}
- Category: {category}{weather_str}

Provide 3 quick, everyday precautions for normal people based on this reading."""