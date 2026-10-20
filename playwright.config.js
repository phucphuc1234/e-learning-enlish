import { defineConfig, devices } from "@playwright/test";
import chromium from "@sparticuz/chromium";

const bundled =
  process.platform === "linux" &&
  !process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const browserOptions = bundled
  ? {
      executablePath: await chromium.executablePath(),
      args: chromium.args.filter(
        (arg) =>
          ![
            "--single-process",
            "--disable-web-security",
            "--allow-running-insecure-content",
            "--disable-site-isolation-trials",
          ].includes(arg) && !arg.includes("IsolateOrigins"),
      ),
    }
  : process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {};
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: browserOptions,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: "node scripts/test-server.js",
    url: "http://127.0.0.1:4173/api/health",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
