import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  testMatch: "preview.spec.ts",
  workers: 1,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "artifacts/issue-2/phase-e-preview-browser-results.json" },
    ],
  ],
  use: { viewport: { width: 1440, height: 1080 }, headless: true },
  webServer: {
    command: "npx vite preview --mode preview --host 127.0.0.1 --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: false,
  },
  expect: { timeout: 15000 },
});
