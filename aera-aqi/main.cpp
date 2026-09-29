#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ============================================================================
// DEFAULT CREDENTIALS & ENDPOINT
// ============================================================================
#define DEFAULT_WIFI_SSID     "JioFiber-xcxF6"
#define DEFAULT_WIFI_PASS     "Dooth7Olae9Ooshe"

#define AP_SSID               "AERA-Setup"
#define DNS_PORT              53

#define AERA_HOST             "aera-cloud.hacksmiths.dev"
#define AERA_PORT             443
#define AERA_INGEST_ENDPOINT  "/v1/telemetry/ingest"
#define AERA_DEVICE_ID        "ESP32-SOLO1-NODE01"
#define AERA_API_KEY          "4d977bc73f3b74fa735b5e4d3503df5fe534a6064bd6fabb51919864b6ce47b4"

// Pin Assignments
#define PIN_DHT11             4
#define PIN_MQ9_ANALOG        34
#define PIN_STATUS_LED        2
#define PIN_BUZZER            15

#define MQ9_ADC_RESOLUTION    12
#define MQ9_ALERT_PPM_LIMIT   350.0f

#define TELEMETRY_INTERVAL_MS 5000
#define WIFI_RETRY_INTERVAL_MS 10000
#define SERIAL_BAUD_RATE      115200

enum SystemState {
  STATE_BOOTING,
  STATE_WIFI_CONNECTING,
  STATE_PORTAL_ACTIVE,
  STATE_ONLINE,
  STATE_ALERT,
  STATE_ERROR
};

// ============================================================================
// PORTAL HTML TEMPLATE
// ============================================================================
const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AERA Node Setup</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .card { background: #1e293b; border: 1px solid #334155; padding: 24px; border-radius: 12px; width: 100%; max-width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h2 { margin: 0 0 8px 0; color: #38bdf8; font-size: 20px; font-weight: 600; }
    p { margin: 0 0 20px 0; color: #94a3b8; font-size: 14px; }
    label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #cbd5e1; }
    select, input { width: 100%; padding: 12px; margin-bottom: 16px; border-radius: 6px; border: 1px solid #475569; background: #0f172a; color: #f8fafc; font-size: 14px; outline: none; }
    select:focus, input:focus { border-color: #38bdf8; }
    button { width: 100%; padding: 12px; background: #0284c7; color: white; border: none; border-radius: 6px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #0369a1; }
  </style>
</head>
<body>
  <div class="card">
    <h2>AERA AQI Node</h2>
    <p>Select a 2.4 GHz Wi-Fi network for cloud ingestion.</p>
    <form action="/save" method="POST">
      <label for="ssid">Available Networks</label>
      <select name="ssid" id="ssid">{{NETWORKS}}</select>
      <label for="pass">Password</label>
      <input type="password" name="password" id="pass" placeholder="Network password" required>
      <button type="submit">Save & Connect</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

// ============================================================================
// GLOBALS
// ============================================================================
static DHT dhtSensor(PIN_DHT11, DHT11);
static WebServer server(80);
static DNSServer dnsServer;
static Preferences prefs;

static String activeSSID = "";
static String activePass = "";

static SystemState currentState = STATE_BOOTING;
static unsigned long lastTransmit = 0;
static unsigned long lastWifiRetry = 0;
static unsigned long lastBlinkTime = 0;
static unsigned long pulseEndTime = 0;
static bool blinkToggle = false;
static bool isPulsing = false;

// ============================================================================
// HARDWARE / STATUS HELPERS
// ============================================================================
static void setSystemState(SystemState newState) {
  if (currentState == newState) return;
  currentState = newState;

  if (currentState == STATE_BOOTING || currentState == STATE_ONLINE) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (currentState == STATE_ERROR) {
    digitalWrite(PIN_STATUS_LED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
  } else if (currentState == STATE_ALERT) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    digitalWrite(PIN_BUZZER, HIGH);
  }
}

static void triggerBeep(uint16_t durationMs) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(durationMs);
  digitalWrite(PIN_BUZZER, LOW);
}

static void pulseLed() {
  digitalWrite(PIN_STATUS_LED, LOW);
  isPulsing = true;
  pulseEndTime = millis() + 60;
}

static void updateStatusIndicators() {
  unsigned long now = millis();

  if (isPulsing && now >= pulseEndTime) {
    isPulsing = false;
    digitalWrite(PIN_STATUS_LED, (currentState == STATE_ONLINE) ? HIGH : LOW);
  }

  // Fast blink during portal setup or connection attempts
  if (currentState == STATE_WIFI_CONNECTING || currentState == STATE_PORTAL_ACTIVE) {
    uint16_t interval = (currentState == STATE_PORTAL_ACTIVE) ? 600 : 250;
    if (now - lastBlinkTime >= interval) {
      lastBlinkTime = now;
      blinkToggle = !blinkToggle;
      digitalWrite(PIN_STATUS_LED, blinkToggle ? HIGH : LOW);
    }
  } else if (currentState == STATE_ALERT) {
    if (now - lastBlinkTime >= 150) {
      lastBlinkTime = now;
      blinkToggle = !blinkToggle;
      digitalWrite(PIN_STATUS_LED, blinkToggle ? HIGH : LOW);
      digitalWrite(PIN_BUZZER, blinkToggle ? HIGH : LOW);
    }
  }
}

// ============================================================================
// SENSORS
// ============================================================================
static float readMQ9Ppm() {
  uint32_t rawSum = 0;
  for (int i = 0; i < 8; i++) {
    rawSum += analogRead(PIN_MQ9_ANALOG);
    delay(2);
  }
  float rawAdc = (float)rawSum / 8.0f;
  float voltage = (rawAdc / 4095.0f) * 3.3f;
  float ratio = voltage / 3.3f;
  return 10.0f + (ratio * 990.0f);
}

// ============================================================================
// CAPTIVE PORTAL ROUTINES
// ============================================================================
static void handlePortalRoot() {
  int n = WiFi.scanNetworks();
  String options = "";
  if (n <= 0) {
    options = "<option value=''>No networks found</option>";
  } else {
    for (int i = 0; i < n; ++i) {
      options += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + " dBm)</option>";
    }
  }

  String page = FPSTR(PORTAL_HTML);
  page.replace("{{NETWORKS}}", options);
  server.send(200, "text/html", page);
}

static void handlePortalSave() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    String newSSID = server.arg("ssid");
    String newPass = server.arg("password");

    prefs.begin("aera-net", false);
    prefs.putString("ssid", newSSID);
    prefs.putString("pass", newPass);
    prefs.end();

    server.send(200, "text/html", 
      "<html><body style='background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;'>"
      "<h2>Credentials Saved</h2><p>Rebooting and connecting to " + newSSID + "...</p></body></html>");

    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Missing Parameters");
  }
}

static void startCaptivePortal() {
  Serial.println("[AERA] Starting Captive Portal SoftAP: AERA-Setup");
  WiFi.disconnect(true);
  delay(100);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID);

  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

  dnsServer.start(DNS_PORT, "*", apIP);

  server.on("/", HTTP_GET, handlePortalRoot);
  server.on("/save", HTTP_POST, handlePortalSave);

  // Common OS captive portal detect endpoints
  server.on("/generate_204", HTTP_GET, handlePortalRoot);
  server.on("/hotspot-detect.html", HTTP_GET, handlePortalRoot);
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.4.1/", true);
    server.send(302, "text/plain", "");
  });

  server.begin();
  setSystemState(STATE_PORTAL_ACTIVE);
  Serial.printf("[AERA] Portal server active on IP: %s\n", apIP.toString().c_str());
}

// ============================================================================
// WIFI CLIENT & TELEMETRY POST
// ============================================================================
static bool connectWiFi(const String& ssid, const String& pass) {
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  Serial.printf("[AERA] Connecting to %s", ssid.c_str());
  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) { // 10 seconds timeout
    delay(400);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  return (WiFi.status() == WL_CONNECTED);
}

static bool postTelemetry(float temp, float hum, float co) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  char url[128];
  snprintf(url, sizeof(url), "https://%s:%u%s", AERA_HOST, AERA_PORT, AERA_INGEST_ENDPOINT);

  if (!https.begin(client, url)) {
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-ID", AERA_DEVICE_ID);

  char authHeader[128];
  snprintf(authHeader, sizeof(authHeader), "Bearer %s", AERA_API_KEY);
  https.addHeader("Authorization", authHeader);

  char jsonBody[256];
  snprintf(jsonBody, sizeof(jsonBody),
           "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"co\":%.2f}",
           AERA_DEVICE_ID, temp, hum, co);

  int httpCode = https.POST((uint8_t*)jsonBody, strlen(jsonBody));
  bool success = (httpCode >= 200 && httpCode < 300);

  if (!success) {
    Serial.printf("[HTTP] POST failed, error code: %d\n", httpCode);
  }

  https.end();
  return success;
}

// ============================================================================
// MAIN SETUP & LOOP
// ============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MQ9_ANALOG, INPUT);
  analogReadResolution(MQ9_ADC_RESOLUTION);

  setSystemState(STATE_BOOTING);
  dhtSensor.begin();

  Serial.println("\n[AERA] Booting ESP32-Solo1 Telemetry Station...");

  // Load Wi-Fi from NVS or use defaults
  prefs.begin("aera-net", true);
  activeSSID = prefs.getString("ssid", DEFAULT_WIFI_SSID);
  activePass = prefs.getString("pass", DEFAULT_WIFI_PASS);
  prefs.end();

  setSystemState(STATE_WIFI_CONNECTING);

  if (connectWiFi(activeSSID, activePass)) {
    Serial.println("[AERA] Wi-Fi link established.");
    setSystemState(STATE_ONLINE);
    triggerBeep(120);
  } else {
    Serial.println("[AERA] Wi-Fi association failed. Launching Captive Portal...");
    startCaptivePortal();
  }
}

void loop() {
  updateStatusIndicators();

  // If captive portal is up, process DNS and HTTP requests
  if (currentState == STATE_PORTAL_ACTIVE) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }

  unsigned long now = millis();

  // Background Wi-Fi recovery
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS)) {
    lastWifiRetry = now;
    Serial.println("[AERA] Wi-Fi disconnected. Reconnecting...");
    if (connectWiFi(activeSSID, activePass)) {
      Serial.println("[AERA] Wi-Fi re-established.");
      setSystemState(STATE_ONLINE);
    } else {
      setSystemState(STATE_ERROR);
    }
  }

  // Telemetry loop
  if (now - lastTransmit >= TELEMETRY_INTERVAL_MS) {
    lastTransmit = now;

    float temperature = dhtSensor.readTemperature();
    float humidity = dhtSensor.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0.0f;
      humidity = 0.0f;
      Serial.println("[WARN] DHT11 read timeout. Check pin 4 wiring.");
    }

    float co_ppm = readMQ9Ppm();

    Serial.printf("[TELEMETRY] Temp: %.1f °C | Humidity: %.1f %% | CO: %.2f PPM\n",
                  temperature, humidity, co_ppm);

    if (co_ppm >= MQ9_ALERT_PPM_LIMIT) {
      setSystemState(STATE_ALERT);
    } else if (WiFi.status() == WL_CONNECTED) {
      setSystemState(STATE_ONLINE);
    }

    if (WiFi.status() == WL_CONNECTED) {
      bool ok = postTelemetry(temperature, humidity, co_ppm);
      if (ok) {
        pulseLed();
      } else {
        Serial.println("[WARN] Ingest endpoint returned non-2xx status.");
      }
    }
  }
}