# aera-cloud/app/utils/aqi.py
from typing import Tuple

# CPCB NAQI Breakpoints for PM2.5 (µg/m³, 24-hr average standard)
PM25_BREAKPOINTS = [
    (0.0, 30.0, 0, 50, "Good"),
    (30.1, 60.0, 51, 100, "Satisfactory"),
    (60.1, 90.0, 101, 200, "Moderate"),
    (90.1, 120.0, 201, 300, "Poor"),
    (120.1, 250.0, 301, 400, "Very Poor"),
    (250.1, 500.0, 401, 500, "Severe"),
]

# CPCB NAQI Breakpoints for PM10 (µg/m³, 24-hr average standard)
PM10_BREAKPOINTS = [
    (0.0, 50.0, 0, 50, "Good"),
    (50.1, 100.0, 51, 100, "Satisfactory"),
    (100.1, 250.0, 101, 200, "Moderate"),
    (250.1, 350.0, 201, 300, "Poor"),
    (350.1, 430.0, 301, 400, "Very Poor"),
    (430.1, 600.0, 401, 500, "Severe"),
]

# Residential Calibrated Breakpoints for MQ-9 Carbon Monoxide (Instantaneous PPM)
# Absorbs MQ-9 baseline offset while preserving acute safety warnings
CO_BREAKPOINTS = [
    # (c_low, c_high, i_low, i_high, category)
    (0.0, 3.5, 0, 50, "Good"),             # Normal clean residential air + sensor baseline
    (3.6, 7.0, 51, 100, "Satisfactory"),    # Typical room with cooking / closed doors
    (7.1, 12.0, 101, 200, "Moderate"),     # Approaching WHO chronic limits; prompt ventilation
    (12.1, 20.0, 201, 300, "Poor"),        # Noticeable hazard / abnormal combustion
    (20.1, 35.0, 301, 400, "Very Poor"),   # Severe buildup / acute indoor alarm
    (35.1, 70.0, 401, 500, "Severe"),      # Immediate physical evacuation threshold
]


def _calc_sub_index(conc: float, breakpoints: list) -> Tuple[int, str]:
    if conc <= 0.0:
        return 0, "Good"

    for low_c, high_c, low_i, high_i, category in breakpoints:
        if low_c <= conc <= high_c:
            index = ((high_i - low_i) / (high_c - low_c)) * (conc - low_c) + low_i
            return max(0, min(500, round(index))), category

    # If concentration exceeds the highest defined threshold
    if conc > breakpoints[-1][1]:
        return 500, "Severe"

    return 0, "Good"


def compute_naqi(
    pm2_5: float = 0.0, 
    pm10: float = 0.0, 
    co: float = 0.0
) -> Tuple[int, str]:
    """
    Computes overall NAQI by taking the max sub-index across all active sensors:
    PM2.5, PM10, and Carbon Monoxide (CO in PPM).
    """
    sub_indices = []

    if pm2_5 > 0.0:
        sub_indices.append(_calc_sub_index(pm2_5, PM25_BREAKPOINTS))
    if pm10 > 0.0:
        sub_indices.append(_calc_sub_index(pm10, PM10_BREAKPOINTS))
    if co > 0.0:
        sub_indices.append(_calc_sub_index(co, CO_BREAKPOINTS))

    if not sub_indices:
        return 0, "Good"

    # Max sub-index defines the aggregate air quality index & category
    return max(sub_indices, key=lambda item: item[0])