# Production checklist — GrowMedica

**Aktualizované:** 2026-07-16  
**UI freeze:** len infra, env, dáta — nie redesign.

Hlavný stav: [STATUS.md](./STATUS.md)

---

## Live stack

| | |
|--|--|
| E-shop | https://www.growmedica.cz (Next.js / Vercel) |
| CMS | https://cms.growmedica.cz (WooCommerce) |
| `CMS_PROVIDER` | **`wordpress`** |
| Rollback | `CMS_PROVIDER=shopify` + Shopify env (dočasné) |

---

## Vercel env (Production) — WordPress

| Premenná | Poznámka |
|----------|----------|
| `CMS_PROVIDER` | `wordpress` |
| `WORDPRESS_BASE_URL` | `https://cms.growmedica.cz` |
| `WOO_CONSUMER_KEY` | server-only |
| `WOO_CONSUMER_SECRET` | server-only |
| `WORDPRESS_REVALIDATION_SECRET` | = cms `growmedica_revalidation_secret` |
| `NEXT_PUBLIC_SITE_URL` | `https://www.growmedica.cz` |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://cms.growmedica.cz/wp-admin` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `cs` |
| `DASHBOARD_AGENT_SECRET` | min 16 znakov |
| `MISTRAL_API_KEY` / `MISTRAL_MODEL` | dashboard AI |
| Shopify env | môže ostať pre rollback / import skripty |

**Nikdy na Vercel:** `DB_*`, SMTP heslá CMS, Application Password (okrem skriptov lokálne).

Lokálne secrets: gitignored `wordpress-production.local.env`, `storefront/.env.local`.

---

## CMS (Woo) — musí bežať

- [x] Coming soon off  
- [x] Adresa: Bellova 3455/6, Košice - Staré Mesto  
- [x] BACS + IBAN, COD  
- [x] Zóna SK + doprava s cenami + free ≥ 50 €  
- [x] E-mail footer + SK subjects  
- [x] SMTP  
- [x] terms_page_id (VOP)  
- [ ] SuperFaktúra — majiteľ **2a–2j** ([majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry)) · plugin+defaults+skripty ✅ · CMS firma overená ✅ · api_* ⏳ · [verify](./reports/SUPERFAKTURA_GO_LIVE_VERIFY.md)  
- [ ] Stripe / GoPay keys (karty)  
- [ ] Packeta / DPD API  

**Všetky merchant kroky:** [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md) · **ľudsky:** [majitel.md](./majitel.md)  
Firma: [docs/vzorfirma.md](./docs/vzorfirma.md) · SuperFaktúra: [docs/SUPERFAKTURA_SETUP.md](./docs/SUPERFAKTURA_SETUP.md)

---

## Pre-deploy

```bash
cd storefront
yarn type-check
yarn build
yarn diagnostic
```

## Post-deploy smoke

```bash
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
# gid://woocommerce/Product/...
curl -sI https://cms.growmedica.cz | head -3
```

Manuálne: `/kontakt` (IČO) · košík · checkout · test e-mail.

---

## DNS (cieľ)

| Host | Cieľ |
|------|------|
| `www` | Vercel |
| apex `growmedica.cz` | Vercel (redirect → www) |
| `cms` | WebSupport `37.9.175.131` |

---

## Rollback na Shopify (núdzový)

```bash
# Vercel: CMS_PROVIDER=shopify + Storefront tokenless/token
# Redeploy
```

Import späť do Woo: `storefront/scripts/import-shopify-to-woo.mjs`

---

## Súvisiace

- [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md) — Packeta / karta / SuperFaktúra / GoPay / DPD  
- [TODO.md](./TODO.md)  
- [STATUS.md](./STATUS.md)  
- [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md) — čo dorobiť  
- [storefront/docs/WOO_CART.md](./storefront/docs/WOO_CART.md)  

