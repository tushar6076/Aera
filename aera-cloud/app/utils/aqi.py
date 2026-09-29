from typing import Tuple

# CPCB NAQI Breakpoints for PM2.5 (24-hr avg / real-time proxy)
PM25_BREAKPOINTS = [
    (0.0, 30.0, 0, 50, "Good"),
    (30.1, 60.0, 51, 100, "Satisfactory"),
    (60.1, 90.0, 101, 200, "Moderate"),
    (90.1, 120.0, 201, 300, "Poor"),
    (120.1, 250.0, 301, 400, "Very Poor"),
    (250.1, 500.0, 401, 500, "Severe"),
]

# CPCB NAQI Breakpoints for PM10
PM10_BREAKPOINTS = [
    (0.0, 50.0, 0, 50, "Good"),
    (50.1, 100.0, 51, 100, "Satisfactory"),
    (100.1, 250.0, 101, 200, "Moderate"),
    (250.1, 350.0, 201, 300, "Poor"),
    (350.1, 430.0, 301, 400, "Very Poor"),
    (430.1, 600.0, 401, 500, "Severe"),
]

def _calc_sub_index(conc: float, breakpoints: list) -> Tuple[int, str]:
    for low_c, high_c, low_i, high_i, category in breakpoints:
        if low_c <= conc <= high_c:
            index = ((high_i - low_i) / (high_c - low_c)) * (conc - low_c) + low_i
            return round(index), category
    if conc > breakpoints[-1][1]:
        return 500, "Severe"
    return 0, "Good"

def compute_naqi(pm2_5: float, pm10: float) -> Tuple[int, str]:
    """Computes overall AQI as the max sub-index between PM2.5 and PM10."""
    sub_pm25, cat_pm25 = _calc_sub_index(pm2_5, PM25_BREAKPOINTS)
    sub_pm10, cat_pm10 = _calc_sub_index(pm10, PM10_BREAKPOINTS)
    
    if sub_pm25 >= sub_pm10:
        return sub_pm25, cat_pm25
    return sub_pm10, cat_pm10