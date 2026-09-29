import re
from typing import Tuple

PROHIBITED_CLINICAL_PATTERNS = [
    r"\b(prescribe|prescription|medication|dosage|steroids?|antibiotics?|inhaler dosage)\b",
    r"\b(cure|diagnose|diagnosis|clinical treatment|seek emergency surgery)\b",
    r"\b(take \d+\s*(mg|pills|tablets))\b",
]

SENSITIVE_GROUPS = [
    r"\b(asthma|copd|bronchitis|respiratory|heart disease|infants?|elderly|pregnant)\b"
]

DISCLAIMER_TEXT = "\n\n*Precaution Advisory: Aera provides atmospheric environmental guidelines for general well-being, not clinical medical diagnosis or treatment.*"


def sanitize_recommendation(text: str) -> str:
    """Sanitizes LLM output and appends a non-medical disclaimer if necessary."""
    if not text:
        return "Air quality conditions are variable. Take standard precautions when outdoors."

    sanitized = text.strip()

    has_clinical_advice = any(
        re.search(pattern, sanitized, re.IGNORECASE)
        for pattern in PROHIBITED_CLINICAL_PATTERNS
    )

    has_sensitive_group_mention = any(
        re.search(pattern, sanitized, re.IGNORECASE)
        for pattern in SENSITIVE_GROUPS
    )

    if (has_clinical_advice or has_sensitive_group_mention) and DISCLAIMER_TEXT not in sanitized:
        sanitized += DISCLAIMER_TEXT

    return sanitized


def validate_input_bounds(aqi: int, temp: float | None, hum: float | None) -> Tuple[bool, str]:
    """Validates sensor values before sending to the LLM prompt."""
    if not (0 <= aqi <= 1000):
        return False, f"AQI value {aqi} is out of atmospheric bounds (0-1000)."

    if temp is not None and not (-50.0 <= temp <= 70.0):
        return False, f"Temperature value {temp}°C is out of realistic environmental bounds."

    if hum is not None and not (0.0 <= hum <= 100.0):
        return False, f"Humidity value {hum}% is out of bounds (0-100%)."

    return True, "Valid"