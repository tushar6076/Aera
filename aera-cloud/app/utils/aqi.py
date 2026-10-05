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

# CPCB NAQI Breakpoints for Carbon Monoxide (converted from standard mg/m³ to PPM at 25°C, 1 atm)
# CPCB Standard: 0-1 mg/m³ (Good), 1.1-2 (Satisfactory), 2.1-10 (Moderate), 10.1-17 (Poor), 17.1-34 (Very Poor), >34 (Severe)
CO_BREAKPOINTS = [
    (0.0, 4.5, 0, 50, "Good"),
    (4.6, 9.0, 51, 100, "Satisfactory"),
    (9.1, 15.0, 101, 200, "Moderate"),
    (15.1, 25.0, 201, 300, "Poor"),
    (25.1, 40.0, 301, 400, "Very Poor"),
    (40.1, 70.0, 401, 500, "Severe"),
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