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
#define AERA_INGEST_ENDPOINT     "/v1/telemetry/ingest"
#define AERA_API_KEY             "4d977bc73f3b74fa735b5e4d3503df5fe534a6064bd6fabb51919864b6ce47b4"

// Pin Assignments
#define PIN_DHT11                4
#define PIN_MQ9_ANALOG           34
#define PIN_STATUS_LED           2
#define PIN_BUZZER               15

// Operational Parameters
#define MQ9_ADC_RESOLUTION       12
#define MQ9_ALERT_PPM_LIMIT      350.0f
#define TELEMETRY_INTERVAL_MS    5000
#define WIFI_RETRY_INTERVAL_MS   10000
#define SERIAL_BAUD_RATE         115200

enum SystemState {
  STATE_BOOTING,
  STATE_WIFI_CONNECTING,
  STATE_PORTAL_ACTIVE,
  STATE_ONLINE,
  STATE_ALERT,
  STATE_ERROR
};

// ============================================================================
// HARDWARE IDENTITY (DERIVED FROM EFUSE MAC)
// ============================================================================
static String aeraDeviceId = "";  // e.g. "AERA-B21A80"
static String aeraAPName   = "";  // e.g. "Aera-B21A80"

static void initHardwareIdentity() {
  uint64_t mac = ESP.getEfuseMac();
  char idBuffer[20];
  char apBuffer[20];

  // Extract the last 3 octets (6 hex characters) for a clean hardware tag
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

  if (currentState == STATE_WIFI_CONNECTING || currentState == STATE_PORTAL_ACTIVE) {
    uint16_t interval = (currentState == STATE_PORTAL_ACTIVE) ? 500 : 200;
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
// SENSOR ACQUISITION PROTOCOLS
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
    setSystemState(STATE_ERROR);
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
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
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

  char jsonBody[256];
  snprintf(jsonBody, sizeof(jsonBody),
           "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"co\":%.2f}",
           aeraDeviceId.c_str(), temp, hum, co);

  int httpCode = https.POST((uint8_t*)jsonBody, strlen(jsonBody));
  bool success = (httpCode >= 200 && httpCode < 300);

  if (!success) {
    Serial.printf("[HTTP] POST rejected. Code: %d\n", httpCode);
  } else {
    Serial.printf("[HTTP] Ingest 200 OK: %s\n", jsonBody);
  }

  https.end();
  return success;
}

// ============================================================================
// MAIN SETUP & EXECUTION PIPELINE
// ============================================================================
void setup() {
  Serial.begin(SERIAL_BAUD_RATE);

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_MQ9_ANALOG, INPUT);
  analogReadResolution(MQ9_ADC_RESOLUTION);

  setSystemState(STATE_BOOTING);
  dhtSensor.begin();

  // Derive unique hardware IDs before doing anything with radios or storage
  initHardwareIdentity();

  Serial.println("\n--------------------------------------------------------");
  Serial.println(" Aera Environmental Labs - Atmospheric Sensor Node");
  Serial.printf(" Device Hardware Identity: %s\n", aeraDeviceId.c_str());
  Serial.println("--------------------------------------------------------");

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
      triggerBeep(120);
      return;
    }
    Serial.println("[AERA] Connection failed. Escalating to provisioning mode.");
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

  // Background Wi-Fi self-healing and recovery
  if (WiFi.status() != WL_CONNECTED && (now - lastWifiRetry >= WIFI_RETRY_INTERVAL_MS)) {
    lastWifiRetry = now;
    Serial.println("[AERA] Wi-Fi drop detected. Attempting telemetry recovery...");
    if (connectWiFi(activeSSID, activePass)) {
      Serial.println("[AERA] Wi-Fi link re-established.");
      setSystemState(STATE_ONLINE);
    } else {
      setSystemState(STATE_ERROR);
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

    if (co_ppm >= MQ9_ALERT_PPM_LIMIT) {
      setSystemState(STATE_ALERT);
    } else if (WiFi.status() == WL_CONNECTED) {
      setSystemState(STATE_ONLINE);
    }

    if (WiFi.status() == WL_CONNECTED) {
      bool dispatched = postTelemetry(temperature, humidity, co_ppm);
      if (dispatched) {
        pulseLed();
      } else {
        Serial.println("[WARN] Telemetry pipeline rejected packet.");
      }
    }
  }
}