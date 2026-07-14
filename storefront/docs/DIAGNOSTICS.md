# GrowMedica Storefront Diagnostics

Last updated: 2026-07-14

> **UI/UX FREEZE:** Diagnostika a testy nemenia storefront UI. Vývoj: [DEVELOPMENT.md](./DEVELOPMENT.md)

## Current storefront status

| Area | Status |
|------|--------|
| CMS provider switch (`catalog/*`) | PASS |
| WordPress/WooCommerce mock mode | PASS |
| 14 mega menu WebP banners | PASS |
| Woo category coverage (14/14) | PASS |
| TypeScript (`yarn type-check`) | Run locally |
| Integrity tests — Shopify mock | `yarn test:integrity` |
| Integrity tests — Woo mock | `yarn test:woo:integrity` |
| Production smoke | `yarn production:smoke` |
| Dashboard → WP admin iframe | PASS |

## Test commands

```bash
cd storefront
yarn type-check
yarn test:integrity
CMS_PROVIDER=wordpress WOO_MOCK_MODE=1 yarn test:woo:integrity
yarn build
PREVIEW_URL=http://127.0.0.1:5555 CMS_PROVIDER=wordpress WOO_MOCK_MODE=1 yarn production:smoke
```

## WooCommerce mock env

Playwright používa `tests/helpers/woo-env.ts` keď `CMS_PROVIDER=wordpress` alebo `WOO_MOCK_MODE=1`.

Fixtures:

- `tests/fixtures/woo-category-coverage.json` — 14/14 kategórií
- `tests/fixtures/woo-products.json` — deterministické WC produkty

## Live URLs (target)

| Environment | URL |
|-------------|-----|
| Storefront | https://growmedica.cz |
| WordPress CMS | https://cms.growmedica.cz |
| WP Admin (iframe) | https://cms.growmedica.cz/wp-admin |

## Category banner coverage

All 14 navigable categories map to `.webp` files in `public/images/mega-menu/`.