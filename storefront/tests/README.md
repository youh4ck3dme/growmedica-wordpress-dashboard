# Testy — GrowMedica storefront

**Koreň:** `storefront/tests/` (Playwright `testDir`)

```
tests/
├── e2e/                    # End-to-end (prehliadač, user flow)
│   ├── shop.spec.ts        # lokálny/mock e2e
│   └── live/               # proti produkcii www / cms
│       └── purchase-woo-live.spec.ts
├── integrity/              # Integrita UI, SEO, brand, Woo mock, …
│   ├── *.spec.ts
│   ├── woo-*.spec.ts
│   └── live/               # live API (Shopify smoke, dashboard agent live)
│       ├── shopify-live.spec.ts
│       └── dashboard-agent-live.spec.ts
├── unit/                   # Node unit (nie Playwright browser)
│   └── shopify-admin-client.test.mjs
├── fixtures/               # JSON / brand fixtures
└── helpers/                # woo-env, shopify-env, html helpers
```

## Príkazy (z `storefront/`)

| Príkaz | Čo beží |
|--------|---------|
| `yarn test:integrity` | integrity mock (**bez WordPressu**) |
| `yarn test:integrity:iphone` | **live** katalóg ≥300 + **všetky iPhone** viewports (www) |
| `yarn test:integrity:iphone:mock` | mock layout iPhone 17 family |
| `yarn test:woo:integrity` | len `woo-*` integrity, Woo **mock** (bez real WP) |
| `yarn test:e2e` | e2e `shop.spec.ts` (mock server) |
| `yarn test:e2e:live` | **produkcia** www → košík → cms checkout |
| `yarn test:integrity:live` | live integrity (Shopify / agent / mobile catalog) |
| `yarn test:unit-integrity` | rýchle unit-like integrity |
| `yarn test:shopify-admin` | unit Node test |
| `yarn test:dashboard-agent` | agent mock |
| `yarn test:i18n` / `yarn test:seo` | cielené sady |

### Live E2E (produkcia)

```bash
cd storefront
yarn test:e2e:live
# ekvivalent:
PLAYWRIGHT_SKIP_WEBSERVER=1 E2E_BASE_URL=https://www.growmedica.cz \
  yarn playwright test --project=e2e-chromium tests/e2e/live/
```

Env (voliteľné):

| Premenná | Default |
|----------|---------|
| `E2E_BASE_URL` | `https://www.growmedica.cz` |
| `E2E_PRODUCT_HANDLE` | `mycomedica-bio-polyporus-100-g` |
| `PLAYWRIGHT_SKIP_WEBSERVER` | `1` pri live |

## Pravidlá

- **integrity** = rýchle kontroly (brand, SEO, mock cart, Woo mock) — bez reálneho nákupu.
- **e2e** = user journey v prehliadači.
- **live/** = ide proti **www/cms** — nespúšťaj v CI bez vedomia (môže vytvoriť košík/checkout traffic).
- Nové testy dávaj do správneho priečinka; live vždy pod `live/`.

## Playwright projekty

| Project | Match |
|---------|--------|
| `integrity` | `integrity/**/*.spec.ts` |
| `e2e-chromium` / `e2e-mobile` | `e2e/**/*.spec.ts` |
| `pwa` | `integrity/pwa.spec.ts` |

Konfig: `playwright.config.ts`
