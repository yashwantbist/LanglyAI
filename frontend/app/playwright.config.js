const {
  defineConfig,
  devices,
} = require("@playwright/test");

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ||
  "http://127.0.0.1:3000";

const testLocalCandidate =
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(
    baseURL,
  );

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never",
      },
    ],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: testLocalCandidate
    ? {
        command: "npm start",
        url: baseURL,
        reuseExistingServer:
          !process.env.CI,
        timeout: 120000,
        env: {
          BROWSER: "none",
          HOST: "127.0.0.1",
          PORT: "3000",
        },
      }
    : undefined,
});