# Aera AQI ESP32 Firmware

The `aera-aqi` firmware runs on an ESP32 sensor node. It provisions Wi-Fi through a local captive portal, samples a DHT22 temperature/humidity sensor and an MQ-9 analog gas sensor, then sends readings to the Aera Cloud API over HTTPS. The backend response can trigger the node's buzzer.

This is a prototype monitoring station, not a certified CO detector or life-safety alarm. The MQ-9 output is an estimate, depends on sensor warm-up and calibration, and must not be used as the sole basis for health or evacuation decisions.

## Hardware and pinout

| Function | Component | ESP32 pin | Notes |
| --- | --- | --- | --- |
| Temperature / humidity | DHT22 | GPIO 4 | Digital data; use the required pull-up if the sensor module does not include one |
| Gas estimate | MQ-9 analog output | GPIO 34 | ADC input; ensure the signal never exceeds the ESP32's 3.3 V input limit |
| Power indicator | LED | GPIO 13 | Set high while running |
| Status indicator | LED | GPIO 2 | Activity / connection status |
| Audible alert | Active buzzer | GPIO 15 | Active-high output |

Power the MQ-9 heater from a stable supply appropriate for the sensor module. The heater can draw significant current; do not power it from an ESP32 GPIO. Ensure the ESP32 and sensor grounds are common, and use appropriate level shifting or a divider if the module's analog output can exceed 3.3 V.

## Build and upload

1. Install Arduino IDE and Espressif's ESP32 board support.
2. Install the Adafruit DHT sensor library (and any dependency requested by the library manager).
3. Open `aera-aqi.ino` from this directory. Keep `main.cpp` alongside it; the `.ino` stub supplies library includes for Arduino's scanner while the implementation lives in the C++ file.
4. Select the correct ESP32 board and serial port, compile, and upload. If the board browns out during flashing, disconnect the MQ-9 heater supply while uploading and power it again after the board starts.
5. Open Serial Monitor at **115200 baud** for startup logs and the generated device ID.

No PlatformIO project configuration is included.

## First boot and Wi-Fi provisioning

1. Power the node. If no saved Wi-Fi credentials work, it starts an open setup access point named `Aera-<six-hex-digits>`.
2. Connect a phone or computer to that network. The node ID is printed in Serial Monitor and shown in the portal.
3. Open <http://192.168.4.1>, select a 2.4 GHz Wi-Fi network, and submit its password.
4. The ESP32 stores the credentials in its non-volatile preferences and restarts. It then attempts to reconnect automatically; if it cannot connect later, it starts the provisioning portal again.

Use the temporary access point only in a trusted environment. The setup page is served over local HTTP and the access point is not password-protected.

## Telemetry and cloud configuration

The firmware sends a reading approximately every five seconds to:

```text
POST /api/device/telemetry/ingest
```

It includes the generated device ID, temperature, humidity, and estimated CO concentration. PM2.5 and PM10 are sent as `0.0` because this hardware build has no particulate sensor. The cloud API returns the AQI and an optional buzzer directive; the firmware also has a local CO threshold configured in `main.cpp`.

The cloud hostname, ingestion endpoint, and hardware shared key are currently compile-time settings in `main.cpp`. The firmware key must match `DEVICE_PRESHARED_KEY` in `aera-cloud/.env`. Change the value in your private working copy before deploying; never publish live device credentials.

**TLS limitation:** The current client establishes an HTTPS connection but disables certificate verification (`setInsecure`). Traffic is encrypted, but the node does not authenticate the server certificate, leaving it vulnerable to a man-in-the-middle attack. Do not treat this as production-grade transport security; pin or validate the server certificate before deploying in an untrusted network.

## Source files

```text
aera-aqi/
├── aera-aqi.ino   # Arduino IDE scanner entry point and required includes
└── main.cpp       # Hardware initialization, portal, sampling, and HTTPS upload
```

See the [project README](../README.md) for API and backend setup.

## Contact

For project questions, contact [contact@hacksmiths.dev](mailto:contact@hacksmiths.dev) or visit [hacksmiths.dev](https://hacksmiths.dev).
