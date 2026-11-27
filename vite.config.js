import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  appType: "mpa",
  worker: { format: "es" },
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
  build: {
    rollupOptions: {
      input: { game: "index.html", prototype: "prototype.html" },
    },
  },
});
