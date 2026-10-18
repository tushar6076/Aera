# Aera Web Dashboard

`aera-web` is the browser client for Aera. It provides account access and a telemetry dashboard for connected sensor nodes, including current conditions, historical charts, device management, and AI-assisted air-quality guidance.

## Features

- Registration, sign-in, password recovery, and protected dashboard routes.
- Current AQI, pollutant and ambient readings, device selection, and history charts.
- Live device updates through the backend WebSocket endpoint.
- Device claiming and account/device settings.
- AI chat and precautionary recommendations when the backend integration is configured.

## Stack

- React 19, Vite 8, React Router
- Tailwind CSS 3, Radix UI, Base UI, and Recharts
- Axios for API requests
- Nginx static hosting in the Docker image

## Requirements

- Node.js version supported by Vite 8 (Node 20.19+ or Node 22.12+)
- npm
- Aera Cloud API for sign-in, readings, and device features

## Local development

Create the local Vite settings and install the lockfile dependencies:

```sh
cp .env.example .env
npm ci
npm run dev
```

Vite serves the dashboard on port `5175` by default. The `.env.example` values connect to a backend at `http://localhost:8085`:

| Variable | Purpose | Local example |
| --- | --- | --- |
| `VITE_API_URL` | Base URL for HTTP API requests | `http://localhost:8085` |
| `VITE_WS_URL` | Base URL for WebSocket connections | `ws://localhost:8085` |

If using a different API address, update both URLs. For a physical phone or another machine on the network, `localhost` means that client itself; use a host name or IP address reachable from the browser and make sure the backend allows the frontend origin in `BACKEND_CORS_ORIGINS`.

## Build and check

```sh
npm run lint
npm run build
npm run preview
```

`npm run build` writes the static production site to `dist/`.

## Docker

At the repository root, Compose passes the root `.env` values as Vite build arguments:

```sh
docker compose up --build -d aera-web
```

The root `.env.example` uses local API URLs. Set `VITE_API_URL` to the public HTTPS API URL and `VITE_WS_URL` to its WSS equivalent before a public deployment build. These values are embedded at build time; rebuilding the image is necessary after changing them. The web container serves static files on port `5175`; it does not run the Vite development server.

## Related code

```text
src/
├── components/     # Dashboard, layout, and reusable UI components
├── hooks/          # Authentication, device, AQI, and chat state
├── pages/          # Dashboard and account screens
├── services/       # API, auth, device, monitoring, and AI clients
└── main.jsx        # Browser entry point
```

See the [project README](../README.md) for backend and full-stack setup.
