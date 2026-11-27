import { defineConfig } from "@playwright/test";

const base = "/mission-mars/";
const url = `http://127.0.0.1:4190${base}`;

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.js",
  workers: 1,
  timeout: 90000,
  use: {
    browserName: "chromium",
    launchOptions: {
      executablePath: process.env.MARS_TEST_CHROMIUM || undefined,
    },
    baseURL: url,
    viewport: { width: 1280, height: 850 },
  },
  webServer: {
    command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4190 --strictPort --base ${base}`,
    url,
    reuseExistingServer: false,
    gracefulShutdown: { signal: "SIGINT", timeout: 5000 },
  },
});
