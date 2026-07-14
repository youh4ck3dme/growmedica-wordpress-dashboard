import { defineConfig, devices } from '@playwright/test';
import { wooTestEnv } from './tests/helpers/woo-env';

const isPwaProductionTest = !!process.env.PWA_PRODUCTION_TEST;
const isNoorDemoTest = process.env.NOOR_DEMO_TEST === '1';
const isWooTest =
  process.env.CMS_PROVIDER === 'wordpress' || process.env.WOO_MOCK_MODE === '1';
const playwrightDevPort = process.env.PLAYWRIGHT_DEV_PORT ?? '5557';
const playwrightDevUrl = `http://127.0.0.1:${playwrightDevPort}`;

const shopifyTestEnv: Record<string, string> = {
  CMS_PROVIDER: 'shopify',
  SHOPIFY_MOCK_MODE: process.env.SHOPIFY_MOCK_MODE ?? '1',
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? 'mock-store.myshopify.com',
  SHOPIFY_STOREFRONT_ACCESS_TOKEN:
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? 'mock-storefront-token',
  SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION ?? '2025-01',
  SHOPIFY_REVALIDATION_SECRET:
    process.env.SHOPIFY_REVALIDATION_SECRET ?? 'mock-revalidation-secret-123456',
  MISTRAL_MOCK_MODE: process.env.MISTRAL_MOCK_MODE ?? '1',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? 'mock-mistral-api-key',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'sk',
  NEXT_PUBLIC_DASHBOARD_MODE: process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? 'iframe',
  DASHBOARD_AGENT_SECRET:
    process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456',
  NEXT_PUBLIC_DASHBOARD_URL:
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://growmedica-nexus.lovable.app/admin',
};

if (isNoorDemoTest) {
  shopifyTestEnv.NEXT_PUBLIC_DEFAULT_THEME = 'noor';
  shopifyTestEnv.NEXT_PUBLIC_HIDE_THEME_SWITCHER = '1';
}

const dashboardTestUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
if (dashboardTestUrl) {
  shopifyTestEnv.NEXT_PUBLIC_DASHBOARD_URL = dashboardTestUrl;
  wooTestEnv.NEXT_PUBLIC_DASHBOARD_URL = dashboardTestUrl;
} else {
  wooTestEnv.NEXT_PUBLIC_DASHBOARD_URL =
    wooTestEnv.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://growmedica-nexus.lovable.app/admin';
}

const playwrightEnv = isWooTest ? wooTestEnv : shopifyTestEnv;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: isPwaProductionTest
    ? {
        command: 'yarn start --port 5556',
        url: 'http://127.0.0.1:5556',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: playwrightEnv,
      }
    : {
        command: `node scripts/ensure-dev-port.mjs ${playwrightDevPort} && node scripts/playwright-dev.mjs ${playwrightDevPort}`,
        url: playwrightDevUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { ...process.env, ...playwrightEnv },
      },
  use: {
    baseURL: isPwaProductionTest
      ? 'http://127.0.0.1:5556'
      : process.env.BASE_URL || playwrightDevUrl,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'integrity',
      testMatch: /integrity\/.*\.spec\.ts/,
      testIgnore: isWooTest
        ? ['**/pwa.spec.ts', '**/revalidation.spec.ts']
        : ['**/pwa.spec.ts', '**/woo-*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'pwa',
      testMatch: /integrity\/pwa\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-chromium',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-mobile',
      testMatch: /e2e\/.*\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
    },
  ],
});