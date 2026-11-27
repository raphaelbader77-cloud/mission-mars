import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  server: { host: "0.0.0.0", allowedHosts: true },
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
  build: {
    rollupOptions: {
      input: { game: "index.html", prototype: "prototype.html" },
    },
  },
});
