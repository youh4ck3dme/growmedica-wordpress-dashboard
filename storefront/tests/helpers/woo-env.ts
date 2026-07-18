/** Playwright mock env for CMS_PROVIDER=wordpress + WOO_MOCK_MODE=1 */
export const wooTestEnv: Record<string, string> = {
  CMS_PROVIDER: 'wordpress',
  WOO_MOCK_MODE: '1',
  WORDPRESS_BASE_URL: process.env.WORDPRESS_BASE_URL ?? 'http://localhost:8080',
  WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY ?? 'ck_mock',
  WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET ?? 'cs_mock',
  WORDPRESS_REVALIDATION_SECRET:
    process.env.WORDPRESS_REVALIDATION_SECRET ?? 'mock-revalidation-secret-123456',
  MISTRAL_MOCK_MODE: process.env.MISTRAL_MOCK_MODE ?? '1',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? 'mock-mistral-api-key',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
  NEXT_PUBLIC_DASHBOARD_MODE: process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? 'hybrid',
  DASHBOARD_AGENT_SECRET:
    process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://127.0.0.1:5557',
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'cs',
  SITE_NOINDEX: process.env.SITE_NOINDEX ?? '0',
  NEXT_PUBLIC_SITE_NOINDEX: process.env.NEXT_PUBLIC_SITE_NOINDEX ?? '0',
}
