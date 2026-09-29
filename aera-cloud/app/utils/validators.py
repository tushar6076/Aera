def validate_sensor_payload(data: dict) -> bool:
    """Validates that ESP32 payload contains reasonable float ranges."""
    pm2_5 = data.get("pm2_5")
    pm10 = data.get("pm10")

    if pm2_5 is None or pm10 is None:
        return False
    
    # Filter sensor glitch anomalies
    if not (0.0 <= float(pm2_5) <= 1000.0):
        return False
    if not (0.0 <= float(pm10) <= 1500.0):
        return False

    temp = data.get("temperature")
    if temp is not None and not (-40.0 <= float(temp) <= 85.0):
        return False

    hum = data.get("humidity")
    if hum is not None and not (0.0 <= float(hum) <= 100.0):
        return False

    return True