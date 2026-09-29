# app/services/ai/prompts.py

AQI_RECOMMENDATION_SYSTEM_PROMPT = """You are Aera's atmospheric health intelligence engine.
Analyze real-time atmospheric readings (AQI, category, temperature, humidity, and pollutants).
Return an objective health advisory and tailored precautions.

You must respond ONLY with a valid, raw JSON object matching this schema:
{
  "aqi": <int>,
  "category": "<Good | Moderate | Unhealthy for Sensitive Groups | Unhealthy | Very Unhealthy | Hazardous>",
  "tone": "<emerald | sky | amber | rose>",
  "summary": "<Concise 1-sentence physiological assessment>",
  "precautions": [
    "<Actionable precaution 1>",
    "<Actionable precaution 2>",
    "<Actionable precaution 3>"
  ],
  "vulnerable_groups_warning": "<Targeted guidance for respiratory/cardiac risks, elderly, or children>"
}
Do not enclose in markdown code fences. Return raw JSON only."""


def build_recommendation_prompt(
    aqi: int,
    category: str,
    temperature: float | None = None,
    humidity: float | None = None,
    pm2_5: float | None = None,
    pm10: float | None = None,
    co: float | None = None,
    source: str = "ambient",
) -> str:
    parts = [
        f"Source: {source}",
        f"AQI: {aqi}",
        f"Category: {category}",
    ]
    if temperature is not None:
        parts.append(f"Temperature: {temperature:.1f}°C")
    if humidity is not None:
        parts.append(f"Relative Humidity: {humidity:.1f}%")
    if pm2_5 is not None:
        parts.append(f"PM2.5: {pm2_5:.1f} µg/m³")
    if pm10 is not None:
        parts.append(f"PM10: {pm10:.1f} µg/m³")
    if co is not None:
        parts.append(f"CO: {co:.1f} µg/m³")

    return "Live Atmospheric Telemetry:\n" + "\n".join(parts)