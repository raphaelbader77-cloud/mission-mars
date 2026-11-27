import { defineConfig } from "@playwright/test";
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
    baseURL: "http://127.0.0.1:4190",
    viewport: { width: 1280, height: 850 },
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4190 --strictPort",
    url: "http://127.0.0.1:4190",
    reuseExistingServer: false,
  },
});
