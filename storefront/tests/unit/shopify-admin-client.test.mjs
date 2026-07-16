import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { resolve } from 'node:path'

import {
  resolveAdminAccessToken,
  verifyAdminScopesGraphql,
  verifyAdminTokenRest,
} from '../../scripts/lib/shopify-admin-client.mjs'
import { determineOnboardingStatus } from '../../scripts/shopify-admin-onboard.mjs'

test('client credentials take priority over a legacy Admin token', async (t) => {
  const originalFetch = globalThis.fetch
  const originalClientId = process.env.SHOPIFY_CLIENT_ID
  const originalClientSecret = process.env.SHOPIFY_CLIENT_SECRET

  t.after(() => {
    globalThis.fetch = originalFetch
    if (originalClientId === undefined) delete process.env.SHOPIFY_CLIENT_ID
    else process.env.SHOPIFY_CLIENT_ID = originalClientId
    if (originalClientSecret === undefined) delete process.env.SHOPIFY_CLIENT_SECRET
    else process.env.SHOPIFY_CLIENT_SECRET = originalClientSecret
  })

  process.env.SHOPIFY_CLIENT_ID = 'client-id'
  process.env.SHOPIFY_CLIENT_SECRET = 'client-secret'
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://growmedica.myshopify.com/admin/oauth/access_token')
    assert.equal(options.method, 'POST')
    return new Response(
      JSON.stringify({ access_token: 'renewable-token', expires_in: 86_399 }),
      { status: 200 },
    )
  }

  const token = await resolveAdminAccessToken({
    store: 'growmedica.myshopify.com',
    token: 'shpat_legacy-disabled',
  })

  assert.equal(token, 'renewable-token')
})

test('REST verification accepts a non-legacy token returned by OAuth', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['X-Shopify-Access-Token'], 'oauth-token')
    return new Response(
      JSON.stringify({
        shop: { name: 'GrowMedica Slovakia', myshopify_domain: 'growmedica.myshopify.com' },
      }),
      { status: 200, headers: { 'X-Shopify-API-Version': '2026-07' } },
    )
  }

  const result = await verifyAdminTokenRest('oauth-token', {
    store: 'growmedica.myshopify.com',
    apiVersion: '2026-07',
  })

  assert.equal(result.ok, true)
  assert.equal(result.shop, 'GrowMedica Slovakia')
})

test('REST verification rejects Shopify API silent fall-forward', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        shop: { name: 'GrowMedica Slovakia', myshopify_domain: 'growmedica.myshopify.com' },
      }),
      { status: 200, headers: { 'X-Shopify-API-Version': '2025-07' } },
    )

  const result = await verifyAdminTokenRest('oauth-token', {
    store: 'growmedica.myshopify.com',
    apiVersion: '2025-01',
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, 'api_version_fallback')
  assert.equal(result.requested_api_version, '2025-01')
  assert.equal(result.served_api_version, '2025-07')
})

test('an incomplete client credential pair never falls back to a legacy token', async (t) => {
  const originalClientId = process.env.SHOPIFY_CLIENT_ID
  const originalClientSecret = process.env.SHOPIFY_CLIENT_SECRET

  t.after(() => {
    if (originalClientId === undefined) delete process.env.SHOPIFY_CLIENT_ID
    else process.env.SHOPIFY_CLIENT_ID = originalClientId
    if (originalClientSecret === undefined) delete process.env.SHOPIFY_CLIENT_SECRET
    else process.env.SHOPIFY_CLIENT_SECRET = originalClientSecret
  })

  process.env.SHOPIFY_CLIENT_ID = 'client-id-without-secret'
  delete process.env.SHOPIFY_CLIENT_SECRET

  await assert.rejects(
    resolveAdminAccessToken({
      store: 'growmedica.myshopify.com',
      token: 'shpat_legacy-disabled',
    }),
    /must be set together/,
  )
})

test('scope verification requires every GrowMedica Admin read/write scope', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['X-Shopify-Access-Token'], 'oauth-token')
    return new Response(
      JSON.stringify({
        data: {
          currentAppInstallation: {
            accessScopes: [
              { handle: 'read_products' },
              { handle: 'write_products' },
              { handle: 'read_inventory' },
            ],
          },
        },
      }),
      { status: 200 },
    )
  }

  const result = await verifyAdminScopesGraphql('oauth-token', {
    store: 'growmedica.myshopify.com',
    apiVersion: '2026-07',
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, 'missing_scopes')
  assert.deepEqual(result.missing, ['write_inventory'])
})

test('scope verification passes when all required scopes are granted', async (t) => {
  const originalFetch = globalThis.fetch
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          currentAppInstallation: {
            accessScopes: [
              { handle: 'read_products' },
              { handle: 'write_products' },
              { handle: 'read_inventory' },
              { handle: 'write_inventory' },
            ],
          },
        },
      }),
      { status: 200 },
    )

  const result = await verifyAdminScopesGraphql('oauth-token', {
    store: 'growmedica.myshopify.com',
    apiVersion: '2026-07',
  })

  assert.equal(result.ok, true)
  assert.equal(result.code, 'ok')
  assert.deepEqual(result.missing, [])
})

test('onboarding fails when a required Vercel or smoke step fails', () => {
  const base = {
    env_local: 'ok',
    vercel: 'ok',
    storefront_smoke: 'ok',
    errors: [],
  }

  assert.equal(determineOnboardingStatus({ ...base, vercel: 'error' }), 'blocked')
  assert.equal(determineOnboardingStatus({ ...base, storefront_smoke: 'error' }), 'blocked')
  assert.equal(
    determineOnboardingStatus(
      { ...base, vercel: 'skipped', storefront_smoke: 'skipped' },
      { vercelRequired: false, smokeRequired: false },
    ),
    'ok',
  )
})

test('inventory live apply refuses the conflicting full strategy before any request', () => {
  const script = resolve('scripts/fix-shopify-inventory.mjs')
  const result = spawnSync(process.execPath, [script, '--apply', '--limit=1'], {
    encoding: 'utf8',
  })

  assert.equal(result.status, 1)
  assert.match(result.stderr, /Refusing live --strategy=full/)
})
