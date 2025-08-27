import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }, // остальные можно убрать для скорости
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/#/login',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

