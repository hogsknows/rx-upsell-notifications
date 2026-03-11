import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    proxy: {
      // Host simulator API (personas, user-context)
      "/api": {
        target: "http://127.0.0.1:3003",
        changeOrigin: true,
      },
      // Message generator (GetMessages + events) — strip /generator prefix
      "/generator": {
        target: "http://127.0.0.1:3002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/generator/, ""),
      },
    },
  },
});
