import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5502",
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "ko-KR",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run serve:test -- --port 5502",
    url: "http://127.0.0.1:5502/dist/app.js",
    reuseExistingServer: true,
  },
});
