import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testIgnore: "**/preview.spec.ts",
  timeout: 300000,
  expect: { timeout: 60000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/browser-results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    actionTimeout: 45000,
    navigationTimeout: 20000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
