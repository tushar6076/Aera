def validate_sensor_payload(data: dict) -> bool:
    """Validates that ESP32 payload contains reasonable float ranges."""
    pm2_5 = data.get("pm2_5", data.get("pm25"))
    pm10 = data.get("pm10")

    if pm2_5 is not None and not (0.0 <= float(pm2_5) <= 1000.0):
        return False
    if pm10 is not None and not (0.0 <= float(pm10) <= 1500.0):
        return False

    temp = data.get("temperature")
    if temp is not None and not (-40.0 <= float(temp) <= 85.0):
        return False

    hum = data.get("humidity")
    if hum is not None and not (0.0 <= float(hum) <= 100.0):
        return False

    co = data.get("co")
    if co is not None and not (0.0 <= float(co) <= 5000.0):
        return False

    return True