import { defineConfig, devices } from '@playwright/test';
import { wooTestEnv } from './tests/helpers/woo-env';

const isPwaProductionTest = !!process.env.PWA_PRODUCTION_TEST;
const isNoorDemoTest = process.env.NOOR_DEMO_TEST === '1';
/**
 * Mock-only for local integrity/e2e webServer — never requires a running WordPress.
 * - default / yarn test:integrity → Shopify mock
 * - CMS_PROVIDER=wordpress (yarn test:woo:integrity) → Woo mock fixtures
 */
const isWooTest = process.env.CMS_PROVIDER === 'wordpress';
const playwrightDevPort = process.env.PLAYWRIGHT_DEV_PORT ?? '5557';
const playwrightDevUrl = `http://127.0.0.1:${playwrightDevPort}`;

const shopifyTestEnv: Record<string, string> = {
  CMS_PROVIDER: 'shopify',
  SHOPIFY_MOCK_MODE: '1',
  WOO_MOCK_MODE: '1',
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? 'mock-store.myshopify.com',
  SHOPIFY_STOREFRONT_ACCESS_TOKEN:
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? 'mock-storefront-token',
  SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION ?? '2026-07',
  SHOPIFY_REVALIDATION_SECRET:
    process.env.SHOPIFY_REVALIDATION_SECRET ?? 'mock-revalidation-secret-123456',
  MISTRAL_MOCK_MODE: '1',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? 'mock-mistral-api-key',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'cs',
  NEXT_PUBLIC_DASHBOARD_MODE: process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? 'hybrid',
  DASHBOARD_AGENT_SECRET:
    process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456',
  NEXT_PUBLIC_DASHBOARD_URL:
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://growmedica-nexus.lovable.app/admin',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? playwrightDevUrl,
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

// Default integrity = Shopify mock (no WP). Woo mock only when explicitly requested.
const playwrightEnv = isWooTest
  ? { ...wooTestEnv, WOO_MOCK_MODE: '1', SHOPIFY_MOCK_MODE: '1', MISTRAL_MOCK_MODE: '1' }
  : shopifyTestEnv;

const requestedSpecFiles = process.argv.filter((arg) => arg.endsWith('.spec.ts'));
const unitOnlySpecPatterns = [
  'shopify-live.spec.ts',
  'seo-alternates.spec.ts',
  'copy-quality.spec.ts',
  'i18n-detect.spec.ts',
  'cart-id.spec.ts',
];
const onlyLiveOrUnitSpecs =
  requestedSpecFiles.length > 0 &&
  requestedSpecFiles.every(
    (arg) =>
      arg.includes('/live/') ||
      arg.includes('shopify-live.spec.ts') ||
      unitOnlySpecPatterns.some((pattern) => arg.includes(pattern)),
  );
const skipWebServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1' || onlyLiveOrUnitSpecs;

const playwrightWebServer = {
  command: `node scripts/ensure-dev-port.mjs ${playwrightDevPort} && node scripts/playwright-dev.mjs ${playwrightDevPort}`,
  url: playwrightDevUrl,
  reuseExistingServer: !process.env.CI,
  // Local Mac / CI can be slow to boot Next; avoid false integrity failures.
  timeout: 180_000,
  env: playwrightEnv,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: skipWebServer
    ? undefined
    : isPwaProductionTest
      ? {
          command: 'yarn start --port 5556',
          url: 'http://127.0.0.1:5556',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: playwrightEnv,
        }
      : playwrightWebServer,
  use: {
    baseURL: isPwaProductionTest
      ? 'http://127.0.0.1:5556'
      : process.env.BASE_URL || playwrightDevUrl,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'integrity',
      testMatch: /integrity\/(?!live\/).*\.spec\.ts/,
      testIgnore: isWooTest
        ? [
            '**/pwa.spec.ts',
            '**/revalidation.spec.ts',
            '**/live/**',
            '**/mobile-iphone-layout.spec.ts',
            // requires local WP :8080 — not needed when production is SoT
            '**/wordpress-local.spec.ts',
          ]
        : [
            '**/pwa.spec.ts',
            '**/woo-*.spec.ts',
            '**/live/**',
            '**/mobile-iphone-layout.spec.ts',
            '**/wordpress-local.spec.ts',
          ],
      use: { browserName: 'chromium', ...devices['Desktop Chrome'] },
    },
    {
      name: 'integrity-iphone',
      testMatch: /integrity\/mobile-iphone-layout\.spec\.ts/,
      use: {
        browserName: 'chromium',
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'integrity-live-iphone',
      testMatch: /integrity\/live\/mobile-catalog-iphone\.spec\.ts/,
      use: {
        // Chromium + iPhone viewport (no WebKit install required)
        browserName: 'chromium',
        baseURL: process.env.E2E_BASE_URL || 'https://www.growmedica.cz',
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'pwa',
      testMatch: /integrity\/pwa\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-chromium',
      testMatch: /e2e\/(?!live\/).*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e-mobile',
      testMatch: /e2e\/(?!live\/).*\.spec\.ts/,
      use: {
        browserName: 'chromium',
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
      },
    },
    {
      name: 'e2e-live',
      testMatch: /e2e\/live\/.*\.spec\.ts/,
      use: {
        baseURL: process.env.E2E_BASE_URL || 'https://www.growmedica.cz',
        ...devices['Desktop Chrome'],
      },
    },
  ],
});