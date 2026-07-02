import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  ssr: true,
  server: {
    preset: "vercel",
  },
  vite: {
    optimizeDeps: {
      include: ["maplibre-gl"],
    },
    server: {
      hmr: {
        // vinxi 0.5.x picks a random HMR port by default. We pin it to a
        // dedicated port (3002) so the WS URL is stable across reloads and
        // the HTTP server (port 3000) isn't blocked from binding.
        port: 3002,
        clientPort: 3002,
      },
    },
    ssr: {
      external: ["better-sqlite3"],
    },
  },
});
