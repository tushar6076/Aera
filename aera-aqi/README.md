# AERA AQI — ESP32 Telemetry Station

Firmware for the AERA air quality monitoring node based on the ESP32-Solo-1 / ESP32 platform. Samples ambient metrics (DHT11 temperature/humidity and MQ-9 combustible gas / CO PPM) and streams encrypted telemetry payloads over HTTPS to the AERA cloud ingestion pipeline.

---

## Hardware Specifications & Pinout

| Peripheral | Component | ESP32 GPIO | Description / Bus |
| :--- | :--- | :--- | :--- |
| **Temperature / Humidity** | DHT11 | `GPIO 4` | Single-wire digital I/O |
| **Gas Sensor (CO / Methane)** | MQ-9 (Analog) | `GPIO 34` | ADC1 Channel 6 (Wi-Fi safe, input only) |
| **Status Indicator** | LED | `GPIO 2` | Active-HIGH onboard LED indicator |
| **Audible Alarm** | Active Buzzer | `GPIO 15` | Active-HIGH emergency audible trigger |

> **Hardware Power Notice:**  
> The MQ-9 heating coil consumes roughly 150–200 mA. Ensure the board is powered from a stable 5V USB source capable of delivering at least 1A. Disconnect sensor VCC during flashing if flashing through an unpowered USB hub to avoid brownout-induced SPI flash verification failures.

---

## Architecture & Project Structure

The project uses a split compilation setup to bypass the Arduino IDE preprocessor's automatic function prototype injection and `ctags` parsing quirks:

```text
aera-aqi/
├── aera-aqi.ino      # Minimal stub declaring library dependencies for the IDE scanner
├── main.cpp          # Core implementation (state machine, drivers, WiFi, and HTTPS ingest)
└── README.md         # Hardware and operational documentation