import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8083', headless: true, viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  reporter: [['list']],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'NEXT_PUBLIC_SERVER_URL=https://api.proeduc.test/v1 NEXT_TELEMETRY_DISABLED=1 ./node_modules/.bin/next dev --hostname 127.0.0.1 -p 8083',
    url: 'http://127.0.0.1:8083',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
