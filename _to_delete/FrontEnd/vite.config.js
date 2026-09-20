import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "172.31.28.253",
    port: 1001,
  },
  preview: {
    host: "172.31.28.253",
    port: 1001,
  },
});
