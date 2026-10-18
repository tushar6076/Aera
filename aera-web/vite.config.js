import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    allowedHosts: ["aera.hacksmiths.dev", ".hacksmiths.dev"],
  },
  preview: {
    host: true,
    port: 5175,
    strictPort: true,
    allowedHosts: ["aera.hacksmiths.dev", ".hacksmiths.dev"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/*.test.{js,jsx}"],
  },
});