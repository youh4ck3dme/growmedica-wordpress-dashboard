#!/usr/bin/env node
/**
 * Starts `next dev` for Playwright with test env vars pinned before Next loads .env.local.
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const port = process.argv[2] ?? '5557'
const storefrontDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const pinnedEnv = {
  CMS_PROVIDER: process.env.CMS_PROVIDER ?? 'wordpress',
  WOO_MOCK_MODE: process.env.WOO_MOCK_MODE ?? '1',
  WORDPRESS_BASE_URL: process.env.WORDPRESS_BASE_URL ?? 'http://localhost:8080',
  WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY ?? 'ck_mock',
  WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET ?? 'cs_mock',
  WORDPRESS_REVALIDATION_SECRET:
    process.env.WORDPRESS_REVALIDATION_SECRET ?? 'mock-revalidation-secret-123456',
  SHOPIFY_REVALIDATION_SECRET:
    process.env.SHOPIFY_REVALIDATION_SECRET ?? 'mock-revalidation-secret-123456',
  MISTRAL_MOCK_MODE: process.env.MISTRAL_MOCK_MODE ?? '1',
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ?? 'mock-mistral-api-key',
  MISTRAL_MODEL: process.env.MISTRAL_MODEL ?? 'mistral-large-latest',
  NEXT_PUBLIC_DASHBOARD_MODE: process.env.NEXT_PUBLIC_DASHBOARD_MODE ?? 'hybrid',
  NEXT_PUBLIC_DASHBOARD_URL:
    process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'https://growmedica-nexus.lovable.app/admin',
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? `http://127.0.0.1:${port}`,
  NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'sk',
  DASHBOARD_AGENT_SECRET:
    process.env.DASHBOARD_AGENT_SECRET ?? 'mock-dashboard-agent-secret-123456',
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN ?? 'mock-store.myshopify.com',
  SHOPIFY_STOREFRONT_ACCESS_TOKEN:
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? 'mock-storefront-token',
  SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION ?? '2026-07',
}

for (const [key, value] of Object.entries(pinnedEnv)) {
  process.env[key] = value
}

const nextBin = path.join(storefrontDir, 'node_modules', '.bin', 'next')
const child = spawn(nextBin, ['dev', '--port', port], {
  cwd: storefrontDir,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})