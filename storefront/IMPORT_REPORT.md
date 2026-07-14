# Import Report — WooCommerce katalóg

**Dátum:** júl 2026  
**Režim:** mock/fixture + dry-run pripravený pre live import

## Kategórie (14/14)

| Slug | Stav |
|------|------|
| proteiny | ✅ fixture |
| aminokyseliny | ✅ fixture |
| sportova-vyziva | ✅ fixture |
| regeneracia | ✅ fixture |
| zdrave-potraviny | ✅ fixture |
| vitaminy-mineraly | ✅ fixture |
| klby-pohyb | ✅ fixture |
| imunita | ✅ fixture |
| travenie | ✅ fixture |
| srdce-cievy | ✅ fixture |
| spanok-stres | ✅ fixture |
| krasa-pokozka | ✅ fixture |
| detox-pecen | ✅ fixture |
| specialna-vyziva | ✅ fixture |

**Woo mock coverage:** 45 produktov, 14/14 kategórií (`tests/fixtures/woo-category-coverage.json`).

## Produkty

| Zdroj | Počet |
|-------|-------|
| `scripts/fixtures/woo-import-products.json` | 15 (live import seed) |
| `WOO_MOCK_MODE` mock catalog | 45 (3 per category + featured) |

## Spustenie

```bash
yarn import:categories:dry   # preview
yarn import:categories       # live → WooCommerce
yarn import:products:dry
yarn import:products
```

## Live import (produkcia)

Po nastavení `WORDPRESS_BASE_URL` + API keys v `.env.local` spustite `yarn import:categories` a `yarn import:products`. Aktualizujte tento report s reálnymi počtami z WooCommerce API.