# Aera Cloud API

The `aera-cloud` service is Aera's asynchronous backend. It accepts ESP32 readings over HTTP or WebSocket, stores telemetry and account data, and exposes REST and live-update endpoints for the browser and mobile clients.

## Features

- FastAPI service with interactive OpenAPI documentation.
- Device authentication and telemetry ingestion, with AQI calculation and buzzer directives.
- User registration, sign-in, password reset, profile management, and device claiming.
- Per-device latest readings, history, and live WebSocket subscriptions.
- Optional Redis cache, Groq-powered chat/recommendation features, and SMTP email notifications.
- Alembic schema migrations.

## Stack

- Python 3.13 (container image), FastAPI, Pydantic Settings
- SQLAlchemy async ORM with PostgreSQL/asyncpg
- Alembic migrations
- Optional Redis, Groq API, and SMTP provider

## Configuration

The production API hostname is [aera-cloud.hacksmiths.dev](https://aera-cloud.hacksmiths.dev); the browser dashboard is [aera.hacksmiths.dev](https://aera.hacksmiths.dev). Configure `BACKEND_CORS_ORIGINS` to permit the dashboard origin when serving it publicly.

Run commands from this directory so the service loads `aera-cloud/.env`:

```sh
cp .env.example .env
```

Set at least the following values in `.env`:

| Setting | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL URL used by the API (use `postgresql+asyncpg://...`) |
| `SECRET_KEY` | Secret used to sign authentication tokens; generate a unique strong value |
| `DEVICE_PRESHARED_KEY` | Shared hardware credential expected by device-ingestion routes |
| `BACKEND_CORS_ORIGINS` | JSON array or comma-separated list of allowed browser origins |

Optional integrations:

| Settings | Purpose |
| --- | --- |
| `REDIS_URL` | Latest-reading cache and device discovery acceleration |
| `GROQ_API_KEY`, `GROQ_MODEL` | AI chat and generated precautionary recommendations |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_USE_TLS`, `MAIL_USE_SSL` | Account and device notification email |
| `CLOUD_BASE_URL`, `WEB_BASE_URL` | Public API and web URLs used in generated links |
| `PROJECT_NAME`, `ENVIRONMENT`, `DEBUG`, `PORT`, `HOST`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | Application and server behavior |

`DIRECT_URL` is present in the example for provider-specific workflows; the API and current Alembic configuration use `DATABASE_URL`. The Compose tunnel token belongs in the repository-root `.env`; it is used by the `cloudflared` service, not required to run this API.

## Run locally

Python 3.13 is recommended to match the Docker image. Make sure PostgreSQL is running and the database in `DATABASE_URL` exists:

```sh
cd aera-cloud
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8085
```

The service exposes:

- Health check: <http://localhost:8085/health>
- OpenAPI UI: <http://localhost:8085/docs>
- ReDoc: <http://localhost:8085/redoc>

To run from the repository root instead, set `PYTHONPATH` to `aera-cloud` and run the equivalent commands from that directory. The API loads its relative `.env` from the current working directory.

## Run with Docker Compose

From the repository root, create and configure `aera-cloud/.env`, then start the services:

```sh
docker compose up --build -d aera-cloud aera-web
docker compose exec aera-cloud alembic upgrade head
```

The backend port is `8085`. Compose does not start PostgreSQL; configure `DATABASE_URL` with an address reachable from the container. See the [project setup](../README.md#run-with-docker-compose) for the full tunnel-enabled stack.

## API surface

The top-level router is mounted under `/api`:

| Area | Example routes |
| --- | --- |
| Device ingestion | `POST /api/device/telemetry/ingest`, `WS /api/device/ws/{device_id}` |
| Authentication | `/api/v1/auth/register`, `/login`, `/forgot-password`, `/reset-password` (6-digit email code, expires in 15 minutes) |
| User and devices | `/api/v1/user/me`, `/api/v1/user/devices`, `/api/v1/user/claim-device` |
| Monitoring | `/api/v1/monitoring/latest/{device_id}`, `/history/{device_id}`, `WS /api/v1/monitoring/ws/live/{device_id}` |
| AI | `/api/v1/ai/chat`, `/api/v1/ai/history/{session_id}` |

The API docs at `/docs` list request and response schemas, parameters, and the complete route set.

## Tests

Run the suite from `aera-cloud/`:

```sh
pytest
```

The test fixtures use PostgreSQL through `DATABASE_URL` (or a local default) and clean up test-pattern records. Configure a **disposable test database** before running tests; never aim the test suite at production or a database containing user data. Auth tests cover the emailed reset-code flow, including expiry, attempt limits, reissue, and one-time use. They mock SMTP delivery; they do not verify delivery to a real inbox.

## Layout

```text
aera-cloud/
├── alembic/             # Database migration environment and revisions
├── app/api/             # Device, auth, user, monitoring, and AI routes
├── app/core/            # Settings, database, logging, security
├── app/db/              # SQLAlchemy models
├── app/schemas/          # Pydantic request and response models
├── app/services/         # Telemetry, device state, email, and AI services
├── app/utils/            # AQI calculations, unit conversions, validation
├── tests/                # API and service tests
├── main.py               # ASGI entry point
└── requirements.txt      # Python dependencies
```

## Contact

For project questions, contact [contact@hacksmiths.dev](mailto:contact@hacksmiths.dev) or visit [hacksmiths.dev](https://hacksmiths.dev).
