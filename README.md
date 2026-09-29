# Aera - Atmospheric Telemetry & Intelligence Platform

A high-performance air quality monitoring system engineered with an asynchronous FastAPI backend and a real-time single-page ambient React interface.

## Architecture

- **`aera-cloud`**: FastAPI, SQLAlchemy 2.0 (Asyncpg), Neon PostgreSQL, Groq AI precautionary heuristics, and WebSocket ingestion pipeline.
- **`aera-web`**: Single-stage ambient dashboard with a Chrome-style slide-over side panel for hardware vitals, historical telemetry audits, and user account management.
- **`aera-firmware`**: ESP32 C++ firmware with PMS5003 particulates sensor, DHT22 ambient probe, buzzer alerts, and WebSocket telemetry transmission.

## Quickstart

```bash
docker compose up -d --build