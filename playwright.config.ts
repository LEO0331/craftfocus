import { defineConfig } from '@playwright/test';

const externalBaseURL = process.env.E2E_BASE_URL;
const localOrigin = `http://127.0.0.1:${process.env.PORT || 4173}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  use: {
    baseURL: `${(externalBaseURL || `${localOrigin}/craftfocus`).replace(/\/+$/, '')}/`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm run e2e:serve',
        url: localOrigin,
        timeout: 120_000,
        reuseExistingServer: false,
      },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
