import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // Local dev only: proxies /api to the backend so there are no CORS issues
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tanstackStart({
      server: {
        entry: "server",
        // Vercel auto-detects TanStack Start and applies the correct Nitro preset
      },
    }),
    viteReact(),
    tailwindcss(),
  ],
});
