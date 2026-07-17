# WordPress / WooCommerce — odkaz (bez secrets)

**Tento súbor NEobsahuje heslá.** Secrets sú len v gitignored env:

| Súbor | Obsah |
|-------|--------|
| [`../wordpress-production.local.env`](../wordpress-production.local.env) | DB, Woo `ck_`/`cs_`, App Password, revalidation |
| [`../wordpress.local.md`](../wordpress.local.md) | Ops tabuľka |
| `../storefront/.env.local` | Storefront + Woo keys (mirror tooling) |

Ak máš starú kópiu s heslami v chate/docs — **nesdieľaj**, rotuj App Password a Woo keys v WP admin.

## Live

- CMS: https://cms.growmedica.cz  
- Admin: https://cms.growmedica.cz/wp-admin  
- Login: `info@growmedica.cz`  
- E-shop (zákazník): https://www.growmedica.cz — **Shopify**, nie WP  

## Pluginy (produkcia cms)

| Plugin | Účel |
|--------|------|
| WooCommerce | katalóg, checkout, objednávky |
| SuperFaktúra WooCommerce **1.53.2** | faktúry / proforma — [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) |
| Packeta / DPD | doprava (API keys ešte ty) |
| Stripe / GoPay | platby (keys ešte ty) |
| FluentSMTP | odchod e-mailov |

**Čo musíš ty (API handoff):** [MERCHANT_KEYS.md](./MERCHANT_KEYS.md)

## Blueprint

Shopify → Woo import: [`../reports/SHOPIFY_TO_WOO_IMPORT_BLUEPRINT.md`](../reports/SHOPIFY_TO_WOO_IMPORT_BLUEPRINT.md)

Setup guide: [`../WORDPRESS_SETUP.md`](../WORDPRESS_SETUP.md)
