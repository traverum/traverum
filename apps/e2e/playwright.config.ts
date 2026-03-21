import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { config as dotenvConfig } from 'dotenv'

// Load staging env vars from apps/e2e/.env
dotenvConfig({ path: path.resolve(__dirname, '.env') })

const WIDGET_PORT = 3000
const WIDGET_URL = `http://localhost:${WIDGET_PORT}`

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],

  use: {
    baseURL: WIDGET_URL,
    trace: 'retain-on-failure',
    screenshot: 'off',
  },

  projects: [
    {
      name: 'ui',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      // No browser needed — uses request context only
      use: { baseURL: WIDGET_URL },
    },
  ],

  webServer: {
    command: 'pnpm --filter @traverum/widget dev',
    port: WIDGET_PORT,
    reuseExistingServer: !process.env.CI,
    cwd: path.resolve(__dirname, '../..'),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy',
      TOKEN_SECRET: process.env.TOKEN_SECRET || 'e2e-test-token-secret',
      NEXT_PUBLIC_APP_URL: WIDGET_URL,
    },
  },
})
