# Aera Cloud (`aera-cloud`)

Asynchronous ingestion engine, intelligence layer, and REST/WebSocket API for the Aera Air Quality Monitoring System.

Built with **FastAPI**, **SQLAlchemy 2.0 (Asyncpg)**, **PostgreSQL (Neon)**, **Groq API**, and **Titan SMTP**.

---

## Architectural Highlights

- **Dual-Gateway Separation**:
  - `/api/device/ws/{device_id}`: High-throughput ingestion gateway authenticated via hardware pre-shared key (PSK). Computes real-time India NAQI, persists readings, and replies with immediate buzzer flags.
  - `/api/v1/`: Consumer-facing REST & WebSocket endpoints serving authenticated Web (`aera-web`) and Mobile (`aera-app`) clients.
- **Atmospheric Precaution Engine**: Relies on Groq LLM inference (`app/services/ai/`) wrapped with deterministic guardrails (`safety.py`) to provide lifestyle guidance without clinical diagnostic risks.
- **Reliable Email Dispatch**: Non-blocking SMTP deliveries via Titan Email over SSL (Port 465) for password reset flows.
- **Automated Verification**: Complete asynchronous test suite with 100% green pass rate utilizing an isolated in-memory SQLite engine.

---

## Directory Structure

```text
aera-cloud/
├── alembic/                 # Database migrations (PostgreSQL)
├── app/
│   ├── api/
│   │   ├── device/          # Hardware WebSocket endpoint (/api/device/ws)
│   │   ├── v1/              # Auth, User, and Telemetry routes (/api/v1/...)
│   │   └── router.py        # Centralized router mount point
│   ├── core/                # Config, DB engine, security, logging
│   ├── db/
│   │   ├── models/          # User, Device, Reading ORM tables
│   │   └── base.py          # Declarative Base & TimestampMixin
│   ├── schemas/             # Pydantic v2 validation models
│   ├── services/
│   │   ├── ai/              # Groq client, prompts, precautions, safety guardrails
│   │   ├── device/          # Device connection hub & telemetry ingestion
│   │   └── email/           # Titan Mail async worker & HTML templates
│   └── utils/               # India NAQI math, unit converters, bounds validation
├── tests/                   # Pytest test suite (17 passing tests)
├── Dockerfile               # Multi-stage production container build
├── main.py                  # ASGI application entrypoint
└── requirements.txt         # Pinned production dependencies