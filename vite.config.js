import { offlinePlugin } from "./scripts/pwa.mjs";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.PAGES_BASE || "./",
  plugins: [offlinePlugin()],
  build: { target: "es2022", chunkSizeWarningLimit: 700, rolldownOptions: { input: {main:"index.html",solar:"solar.html"} } },
  server: { port: 5173, strictPort: true },
});
