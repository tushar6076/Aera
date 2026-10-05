#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>

// ============================================================================
// CLOUD GATEWAY & HARDWARE PROFILES
// ============================================================================
#define DNS_PORT                 53

#define AERA_HOST                "aera-cloud.hacksmiths.dev"
#define AERA_PORT                443
#define AERA_INGEST_ENDPOINT     "/api/device/telemetry/ingest"
#define AERA_API_KEY             "4d977bc73f3b74fa735b5e4d3503df5fe534a6064bd6fabb51919864b6ce47b4"

// Pin Assignments
#define PIN_DHT11                4
#define PIN_MQ9_ANALOG           34
#define PIN_POWER_LED            13
#define PIN_STATUS_LED           2  
#define PIN_BUZZER               15

// Operational Parameters
#define MQ9_ADC_RESOLUTION       12

// Standard Atmospheric & Hardware Calibration
#define MQ9_RL_VALUE_KOHM        10.0f    // Standard 10k load resistor on MQ breakouts
#define MQ9_CLEAN_AIR_RATIO      9.83f    // Rs/R0 ratio in clean ambient air from MQ-9 datasheet
#define HARD_SAFETY_CO_LIMIT     70.0f    // Immediate physical evacuation hazard limit (PPM)
#define TELEMETRY_INTERVAL_MS    5000
#define WIFI_RETRY_INTERVAL_MS   10000
#define SERIAL_BAUD_RATE         115200

enum SystemState {
  STATE_BOOTING,
  STATE_WIFI_CONNECTING,
  STATE_PORTAL_ACTIVE,
  STATE_ONLINE
};

// ============================================================================
// HARDWARE IDENTITY & SENSOR CALIBRATION STATE
// ============================================================================
static String aeraDeviceId = "";
static String aeraAPName   = "";
static float mq9_R0        = 12.5f;       // Calibrated clean-air baseline resistance (kOhm)

static void initHardwareIdentity() {
  uint64_t mac = ESP.getEfuseMac();
  char idBuffer[20];
  char apBuffer[20];

  uint32_t shortId = (uint32_t)(mac >> 24) & 0xFFFFFF;

  snprintf(idBuffer, sizeof(idBuffer), "AERA-%06X", shortId);
  snprintf(apBuffer, sizeof(apBuffer), "Aera-%06X", shortId);

  aeraDeviceId = String(idBuffer);
  aeraAPName   = String(apBuffer);

  Serial.println("\n[AERA-HW] Silicon Hardware Fingerprint Initialized:");
  Serial.printf("          Node ID : %s\n", aeraDeviceId.c_str());
  Serial.printf("          Raw MAC : %s\n", WiFi.macAddress().c_str());
  Serial.printf("          AP SSID : %s\n", aeraAPName.c_str());
}

// ============================================================================
// CAPTIVE PORTAL INTERFACE
// ============================================================================
const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Aera Station Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(2, 132, 199, 0.15);
      border: 1px solid rgba(2, 132, 199, 0.4);
      color: #38bdf8;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .badge-dot { width: 6px; height: 6px; background: #38bdf8; border-radius: 50%; }
    h2 { font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 6px; }
    p { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 24px; }
    label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    select, input[type="password"] {
      width: 100%;
      padding: 12px 14px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #f8fafc;
      font-size: 14px;
      margin-bottom: 18px;
      outline: none;
    }
    select:focus, input[type="password"]:focus { border-color: #0284c7; }
    button {
      width: 100%;
      padding: 12px;
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .footer-note {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: #38bdf8;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="badge-dot"></span> Telemetry Station</div>
    <h2>Pair Node to Wi-Fi</h2>
    <p>Select your local 2.4 GHz network to link this atmospheric node to your Aera Cloud workspace.</p>
    <form action="/save" method="POST">
      <label for="ssid">Available Access Points</label>
      <select name="ssid" id="ssid">{{NETWORKS}}</select>
      <label for="pass">Security Passphrase</label>
      <input type="password" name="password" id="pass" placeholder="••••••••" required>
      <button type="submit">Establish Uplink</button>
    </form>
    <div class="footer-note">Hardware Node ID: {{DEVICE_ID}}</div>
  </div>
</body>
</html>
)rawliteral";

// ============================================================================
// SYSTEM STATE & GLOBAL INSTANCES
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
// PERIPHERAL DRIVERS & SIGNALING
// ============================================================================
static void setSystemState(SystemState newState) {
  if (currentState == newState) return;
  currentState = newState;

  if (currentState == STATE_BOOTING) {
    digitalWrite(PIN_STATUS_LED, LOW);
  } else if (currentState == STATE_ONLINE) {
    digitalWrite(PIN_STATUS_LED, HIGH);
  }
}

static void triggerBeep(uint16_t durationMs) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(durationMs);
  digitalWrite(PIN_BUZZER, LOW);
}

static void pulseStatusLed() {
  if (currentState != STATE_ONLINE) return;
  digitalWrite(PIN_STATUS_LED, LOW);
  isPulsing = true;
  pulseEndTime = millis() + 60;
}

static void updateStatusIndicators() {
  unsigned long now = millis();

  // Process heartbeat pulse recovery
  if (isPulsing && now >= pulseEndTime) {
    isPulsing = false;
    digitalWrite(PIN_STATUS_LED, HIGH);
  }

  // Blink indicator during network association or captive portal setup
  if (currentState == STATE_WIFI_CONNECTING || currentState == STATE_PORTAL_ACTIVE) {
    uint16_t interval = (currentState == STATE_PORTAL_ACTIVE) ? 500 : 200;
    if (now - lastBlinkTime >= interval) {
      lastBlinkTime = now;
      blinkToggle = !blinkToggle;
      digitalWrite(PIN_STATUS_LED, blinkToggle ? HIGH : LOW);
    }
  }
}

// ============================================================================
// STANDARD SENSOR ACQUISITION & CALIBRATION PROTOCOLS
// ============================================================================
static void calibrateCleanAirR0() {
  uint32_t rawSum = 0;
  for (int i = 0; i < 32; i++) {
    rawSum += analogRead(PIN_MQ9_ANALOG);
    delay(20);
  }
  float avgAdc = (float)rawSum / 32.0f;
  float voltage = (avgAdc / 4095.0f) * 3.3f;

  if (voltage > 0.1f && voltage < 3.2f) {
    // Rs in clean air = RL * (Vin - Vout) / Vout
    float rs_air = MQ9_RL_VALUE_KOHM * (3.3f - voltage) / voltage;
    // R0 = Rs_air / ratio_clean_air
    mq9_R0 = rs_air / MQ9_CLEAN_AIR_RATIO;
    Serial.printf("[MQ9] Baseline calibrated: R0 = %.2f kOhm (Clean Air Voltage: %.2fV)\n", mq9_R0, voltage);
  } else {
    mq9_R0 = 12.5f; // Fallback to nominal if readings are floating
    Serial.printf("[MQ9] Using nominal fallback R0: %.2f kOhm\n", mq9_R0);
  }
}

static float readMQ9Ppm() {
  uint32_t rawSum = 0;
  for (int i = 0; i < 16; i++) {
    rawSum += analogRead(PIN_MQ9_ANALOG);
    delay(2);
  }
  float rawAdc = (float)rawSum / 16.0f;
  float voltage = (rawAdc / 4095.0f) * 3.3f;

  // Sensor disconnected or floating
  if (voltage <= 0.05f) return 0.0f;
  // Saturated near VCC rail
  if (voltage >= 3.25f) return 1000.0f;

  // 1. Calculate internal element resistance Rs (kOhm)
  float rs = MQ9_RL_VALUE_KOHM * (3.3f - voltage) / voltage;

  // 2. Compute standardized Rs/R0 ratio
  float ratio = rs / mq9_R0;
  if (ratio <= 0.01f) ratio = 0.01f;

  // 3. MQ-9 Carbon Monoxide Characteristic Curve: PPM = 95.0 * (Rs/R0)^(-1.45)
  float ppm = 95.0f * pow(ratio, -1.45f);

  if (isnan(ppm) || ppm < 0.0f) ppm = 0.0f;
  return ppm;
}

// ============================================================================
// CAPTIVE PORTAL ROUTINES & DNS INTERCEPTION
// ============================================================================
static void handlePortalRoot() {
  Serial.println("[AERA-AP] Captive portal probe received. Scanning 2.4 GHz RF landscape...");
  int n = WiFi.scanNetworks();
  String options = "";
  if (n <= 0) {
    options = "<option value=''>No networks detected</option>";
  } else {
    for (int i = 0; i < n; ++i) {
      options += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + " (" + String(WiFi.RSSI(i)) + " dBm)</option>";
    }
  }

  String page = FPSTR(PORTAL_HTML);
  page.replace("{{NETWORKS}}", options);
  page.replace("{{DEVICE_ID}}", aeraDeviceId);
  server.send(200, "text/html", page);
}

static void handlePortalSave() {
  if (server.hasArg("ssid") && server.hasArg("password")) {
    String newSSID = server.arg("ssid");
    String newPass = server.arg("password");

    Serial.printf("[AERA-AP] Committing new Wi-Fi credentials to NVS: %s\n", newSSID.c_str());

    prefs.begin("aera-net", false);
    prefs.putString("ssid", newSSID);
    prefs.putString("pass", newPass);
    prefs.end();

    server.send(200, "text/html", 
      "<!DOCTYPE html><html><body style='background:#0f172a;color:#f8fafc;font-family:-apple-system,sans-serif;text-align:center;padding:50px;'>"
      "<h2 style='color:#38bdf8;margin-bottom:12px;'>Node Paired Successfully</h2>"
      "<p style='color:#94a3b8;font-size:14px;'>Connecting to " + newSSID + "...</p>"
      "</body></html>");

    delay(2000);
    ESP.restart();
  } else {
    server.send(400, "text/plain", "Missing Parameters: Form requires both SSID and password.");
  }
}

static void startCaptivePortal() {
  Serial.println("\n========================================================");
  Serial.printf("[AERA] Launching Access Point: %s\n", aeraAPName.c_str());
  Serial.println("========================================================");

  WiFi.disconnect(true);
  delay(100);

  WiFi.mode(WIFI_AP_STA);
  bool apSuccess = WiFi.softAP(aeraAPName.c_str());

  if (apSuccess) {
    IPAddress apIP(192, 168, 4, 1);
    WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

    dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
    dnsServer.start(DNS_PORT, "*", apIP);

    server.on("/", HTTP_GET, handlePortalRoot);
    server.on("/save", HTTP_POST, handlePortalSave);

    server.on("/generate_204", HTTP_GET, handlePortalRoot);
    server.on("/gen_204", HTTP_GET, handlePortalRoot);
    server.on("/hotspot-detect.html", HTTP_GET, handlePortalRoot);
    server.on("/ncsi.txt", HTTP_GET, handlePortalRoot);

    server.onNotFound([]() {
      server.sendHeader("Location", "http://192.168.4.1/", true);
      server.send(302, "text/plain", "");
    });

    server.begin();
    setSystemState(STATE_PORTAL_ACTIVE);
    Serial.printf("[AERA] Station broadcast active! SSID: %s | Gateway: http://192.168.4.1\n", aeraAPName.c_str());
  } else {
    Serial.println("[ERROR] Failed to start SoftAP radio layer.");
  }
}

// ============================================================================
// UPLINK NETWORKING & TELEMETRY INGEST
// ============================================================================
static bool connectWiFi(const String& ssid, const String& pass) {
  if (ssid.length() == 0) return false;

  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  Serial.printf("[AERA] Associating with network: %s", ssid.c_str());
  uint8_t attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    for (int i = 0; i < 20; i++) {
      delay(20);
      updateStatusIndicators();
    }
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  return (WiFi.status() == WL_CONNECTED);
}

static bool postTelemetry(float temp, float hum, float co) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(6);

  HTTPClient https;
  https.setTimeout(6000);

  char url[160];
  snprintf(url, sizeof(url), "https://%s:%u%s", AERA_HOST, AERA_PORT, AERA_INGEST_ENDPOINT);

  if (!https.begin(client, url)) {
    Serial.println("[HTTP] TLS handshake instantiation failed.");
    return false;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("X-Device-ID", aeraDeviceId.c_str());

  char authHeader[128];
  snprintf(authHeader, sizeof(authHeader), "Bearer %s", AERA_API_KEY);
  https.addHeader("Authorization", authHeader);

  char jsonBody[280];
  snprintf(jsonBody, sizeof(jsonBody),
           "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"co\":%.2f,\"pm25\":0.0,\"pm10\":0.0}",
           aeraDeviceId.c_str(), temp, hum, co);

  int httpCode = https.POST((uint8_t*)jsonBody, strlen(jsonBody));
  bool success = (httpCode >= 200 && httpCode < 300);

  if (success) {
    String responseBody = https.getString();
    Serial.printf("[HTTP] 200 OK: %s\n", responseBody.c_str());

    bool isOkStatus = (responseBody.indexOf("\"status\":\"ok\"") >= 0);

    if (isOkStatus) {
      bool serverBuzzerAlert = (responseBody.indexOf("\"buzzer\":true") >= 0 || 
                                responseBody.indexOf("\"buzzer\": true") >= 0);

      // Trigger buzzer strictly on cloud advisory directive or acute safety threshold
      if (serverBuzzerAlert || co >= HARD_SAFETY_CO_LIMIT) {
        digitalWrite(PIN_BUZZER, HIGH);
        Serial.printf("[ALERT] Buzzer active: Cloud directive=%s | CO=%.1f PPM (Limit: %.1f PPM)\n", 
                      serverBuzzerAlert ? "TRUE" : "FALSE", co, HARD_SAFETY_CO_LIMIT);
      } else {
        digitalWrite(PIN_BUZZER, LOW);
      }
    } else {
      digitalWrite(PIN_BUZZER, LOW);
    }
    setSystemState(STATE_ONLINE);
  } else {
    Serial.printf("[HTTP] POST rejected. Code: %d\n", httpCode);
  }

  https.end();
  client.stop();
  return success;
}

// ============================================================================
// MAIN SETUP & EXECUTION PIPELINE
// ============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);

  pinMode(PIN_POWER_LED, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MQ9_ANALOG, INPUT);
  analogReadResolution(MQ9_ADC_RESOLUTION);

  digitalWrite(PIN_STATUS_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_POWER_LED, HIGH);

  setSystemState(STATE_BOOTING);
  dhtSensor.begin();

  initHardwareIdentity();

  Serial.println("\n--------------------------------------------------------");
  Serial.println(" Aera Environmental Labs - Atmospheric Sensor Node");
  Serial.printf(" Device Hardware Identity: %s\n", aeraDeviceId.c_str());
  Serial.println("--------------------------------------------------------");

  // Perform clean-air baseline resistance acquisition
  calibrateCleanAirR0();

  prefs.begin("aera-net", true);
  activeSSID = prefs.getString("ssid", "");
  activePass = prefs.getString("pass", "");
  prefs.end();

  if (activeSSID.length() > 0) {
    Serial.printf("[AERA] Stored network profile located: %s\n", activeSSID.c_str());
    setSystemState(STATE_WIFI_CONNECTING);

    if (connectWiFi(activeSSID, activePass)) {
      Serial.println("[AERA] Station successfully associated with local router.");
      Serial.printf("[AERA] IP Assigned: %s\n", WiFi.localIP().toString().c_str());
      setSystemState(STATE_ONLINE);
      triggerBeep(80);
      return;
    }
    Serial.println("[AERA] Stored network unreachable. Starting provisioning portal...");
  } else {
    Serial.println("[AERA] No previous network configured.");
  }

  startCaptivePortal();
}

void loop() {
  updateStatusIndicators();

  if (currentState == STATE_PORTAL_ACTIVE) {
    dnsServer.processNextRequest();
    server.handleClient();
    return;
  }

  unsigned long now = millis();

  // Self-healing Wi-Fi link monitoring
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS)) {
    lastWifiRetry = now;
    Serial.println("[AERA] Wi-Fi link interrupted. Attempting reconnection...");
    setSystemState(STATE_WIFI_CONNECTING);
    if (connectWiFi(activeSSID, activePass)) {
      Serial.println("[AERA] Wi-Fi link re-established.");
      setSystemState(STATE_ONLINE);
    }
  }

  // Periodic Telemetry Dispatch
  if (now - lastTransmit >= TELEMETRY_INTERVAL_MS) {
    lastTransmit = now;

    float temperature = dhtSensor.readTemperature();
    float humidity = dhtSensor.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
      temperature = 0.0f;
      humidity = 0.0f;
      Serial.println("[WARN] DHT11 sensor read fault. Check data pin 4 pullup.");
    }

    float co_ppm = readMQ9Ppm();

    Serial.printf("[TELEMETRY] [%s] Temp: %.1f C | Humidity: %.1f %% | CO: %.2f PPM\n",
                  aeraDeviceId.c_str(), temperature, humidity, co_ppm);

    if (WiFi.status() == WL_CONNECTED) {
      bool dispatched = postTelemetry(temperature, humidity, co_ppm);
      if (dispatched) {
        pulseStatusLed();
      }
    }
  }
}