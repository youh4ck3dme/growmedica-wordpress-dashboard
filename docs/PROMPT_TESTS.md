# Prompt — E2E a integrity testy (GrowMedica)

Skopíruj a daj agentovi / do CI:

---

## Prompt

```
Si agent na GrowMedica monorepo (storefront = Next.js 15 v growmedica-wordpress-dashboard/storefront).

## Kde sú testy
Všetky testy patria do:
  storefront/tests/
    e2e/           — end-to-end user flow (Playwright)
    e2e/live/      — proti produkcii www.growmedica.cz / cms
    integrity/     — integrity / UI / SEO / mock Woo
    integrity/live/— live API smoke (Shopify, dashboard agent)
    unit/          — Node unit (node --test), nie browser
    fixtures/      — JSON fixtures
    helpers/       — woo-env.ts, shopify-env.ts, …

NIKDY nedávaj .spec.ts do src/, scripts/, ani koreňa repa.

## Príkazy (cwd = storefront/)
# Lokálne / mock integrity
yarn test:integrity
yarn test:woo:integrity
yarn test:unit-integrity
yarn test:i18n
yarn test:seo
yarn test:dashboard-agent

# Lokálne e2e (dev server Playwright)
yarn test:e2e

# Produkčný live nákup (Woo)
yarn test:e2e:live
# = PLAYWRIGHT_SKIP_WEBSERVER=1 E2E_BASE_URL=https://www.growmedica.cz \
#   playwright test --project=e2e-chromium tests/e2e/live/

# Live integrity
yarn test:integrity:live

# Unit
yarn test:shopify-admin

## Pravidlá pri písaní testov
1. Integrity (mock): CMS_PROVIDER=wordpress WOO_MOCK_MODE=1 alebo Shopify mock; používa webServer z playwright.config.
2. Live e2e: PLAYWRIGHT_SKIP_WEBSERVER=1, E2E_BASE_URL=https://www.growmedica.cz; súbor v tests/e2e/live/*.spec.ts.
3. Po add-to-cart VŽDY waitForResponse('/api/cart/add') a assert count > 0 pred /kosik.
4. Checkout live = cms.growmedica.cz (Woo Blocks); place order len v explicitnom live test-e s test dátami.
5. UI freeze: testy neupravujú dizajn; len assertujú správanie.
6. Secrets: žiadne heslá v testoch; env z .env.local / CI secrets.

## Čo overiť po zmene košíka / checkoutu
yarn test:woo:integrity
yarn test:e2e:live

## Referencie
storefront/tests/README.md
docs/OPERATIONS.md
STATUS.md
playwright.config.ts
```

---

## Rýchly copy-paste (len spusti live)

```bash
cd growmedica-wordpress-dashboard/storefront
yarn test:e2e:live
yarn test:woo:integrity
```
