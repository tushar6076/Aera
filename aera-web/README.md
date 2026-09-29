# Aera Web (`aera-web`)

Single-page atmospheric telemetry dashboard for Aera IoT hardware.

- **Stack**: React 18, Vite, Tailwind CSS v3, shadcn/ui, Recharts.
- **Pattern**: Persistent Live Stage with a Chrome-style side panel (Overview, History, Settings).
- **Gateway**: `https://aera-cloud.hacksmiths.dev` (REST) & `wss://aera-cloud.hacksmiths.dev` (WebSocket).

```bash
npm install
npm run dev