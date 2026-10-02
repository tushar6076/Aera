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


AERA_CHAT_SYSTEM_PROMPT_TEMPLATE = """You are Aera Atmospheric Intelligence, an advanced environmental AI integrated into the Aera hardware & cloud platform.
You analyze real-time air quality, microclimates, and sensor diagnostics to answer user inquiries accurately and concisely.

Context Telemetry Snapshot:
{telemetry_context}

Guidelines:
1. Ground your conclusions in the user's sensor readings when discussing conditions.
2. Explain physiological impacts of pollutants (PM2.5, PM10, VOCs, CO) without diagnosing clinical ailments.
3. Provide concrete mitigations (HEPA filtration cycles, cross-ventilation timing, source containment).
4. Maintain a direct, technical, yet accessible tone. Keep responses within 2 to 4 sentences unless detailed instructions are requested."""


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


def build_chat_system_prompt(telemetry_context: str | None = None) -> str:
    """Builds the dynamic system prompt with an injected live sensor snapshot."""
    context = telemetry_context or "No connected hardware node selected or telemetry unavailable."
    return AERA_CHAT_SYSTEM_PROMPT_TEMPLATE.format(telemetry_context=context)


def format_telemetry_snapshot(
    device_id: str | None,
    timestamp: str,
    aqi: int | None,
    pm25: float | None,
    pm10: float | None,
    temperature: float | None,
    humidity: float | None,
    co: float | str | None = "N/A",
    source_type: str = "Hardware Node",
) -> str:
    """Formats raw database or ambient telemetry into clean context blocks for the LLM."""
    identifier = f"Node: {device_id}" if device_id else f"Source: {source_type}"
    return (
        f"Mode: {source_type}\n"
        f"{identifier}\n"
        f"Timestamp: {timestamp}\n"
        f"AQI: {aqi if aqi is not None else 'N/A'}\n"
        f"PM2.5: {f'{pm25:.1f} µg/m³' if pm25 is not None else 'N/A'}, "
        f"PM10: {f'{pm10:.1f} µg/m³' if pm10 is not None else 'N/A'}\n"
        f"Temperature: {f'{temperature:.1f}°C' if temperature is not None else 'N/A'}, "
        f"Relative Humidity: {f'{humidity:.1f}%' if humidity is not None else 'N/A'}\n"
        f"CO / Gas Level: {co}"
    )