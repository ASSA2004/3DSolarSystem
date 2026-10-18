import { offlinePlugin } from "./scripts/pwa.mjs";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.PAGES_BASE || "./",
  plugins: [offlinePlugin()],
  build: { target: "es2022", chunkSizeWarningLimit: 700 },
  server: { port: 5173, strictPort: true },
});
