# GrowMedica — stav a čo treba urobiť

**Aktualizované:** 2026-07-16  
**Branch:** `feat/dashboard-agent-v2`  
**Produkcia:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  

---

## Architektúra (live)

```
Zákazník → www.growmedica.cz (Next.js / Vercel)
              CMS_PROVIDER=wordpress
                    │ Woo REST (ck_/cs_)
                    ▼
           cms.growmedica.cz (WordPress + WooCommerce)
              produkty · sklad · objednávky · platby · doprava

Shopify (growmedica.myshopify.com) = dočasný import/rollback, nie live shop
```

| Vrstva | Stav |
|--------|------|
| Next storefront (Vercel) | ✅ live, Woo katalóg |
| Cookie košík | ✅ |
| Checkout | ✅ cms `/kontrola-objednavky` |
| Platby BACS + COD | ✅ |
| Karty Stripe / GoPay | ⬜ merchant keys |
| Packeta / DPD flat rate | ✅ ceny; ⬜ API mapy |
| Firemné údaje + e-maily | ✅ |
| SMTP | ✅ |
| ISR revalidate | ✅ Code Snippet na cms |

**Firma (SoT):** [docs/vzorfirma.md](./docs/vzorfirma.md) · kód `storefront/src/lib/company.ts`

---

## Čo ostáva (priorita)

### P0 — predaj / merchant

1. **Manuálny E2E nákup** v prehliadači (produkt → košík → BACS/COD)
2. **Stripe** a/alebo **GoPay** API keys
3. **Packeta / DPD** merchant API (výber výdajne na mape)
4. Reálne **telefónne číslo** (namiesto placeholderu)

### P1 — kvalita

5. Overiť **sklad** (import často qty 50)
6. Top 20 produktov (ceny, fotky, texty)
7. Plné **VOP** (právnik) — teraz skrátená verzia s reálnymi údajmi
8. IČ DPH ak ste plátca; voliteľne DPH 20 %

### P2 — neskôr

9. Zrušenie Shopify po stabilite  
10. Fakturačný PDF plugin  
11. Nexus / dashboard polish  
12. Predaj/doprava do CZ  

Detail: [reports/REMAINING_WORK_NOW.md](./reports/REMAINING_WORK_NOW.md)

---

## Produkčné kontroly

```bash
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
# očakávaj: gid://woocommerce/Product/...
```

| Check | OK keď |
|-------|--------|
| www | 200 |
| `/api/products` | Woo GID |
| `/kontakt` | IČO 56 455 143, Bellova 3455 |
| cms checkout | doprava + BACS/COD |
| e-mail | dorazí z info@growmedica.cz |

---

## Hlavná dokumentácia

| Dokument | Účel |
|----------|------|
| **[STATUS.md](./STATUS.md)** | Tento súbor — stav + čo robiť |
| [README.md](./README.md) | Quick start, štruktúra |
| [TODO.md](./TODO.md) | Checklist úloh |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Env, DNS, smoke pred/po deployi |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | Firemné / bankové údaje |
| [reports/REMAINING_WORK_NOW.md](./reports/REMAINING_WORK_NOW.md) | Detail zvyšku |
| [reports/EMAIL_TEMPLATES.md](./reports/EMAIL_TEMPLATES.md) | Woo e-maily |
| [reports/WOOCOMMERCE_SETTINGS_REVIEW.md](./reports/WOOCOMMERCE_SETTINGS_REVIEW.md) | Woo nastavenia |
| [storefront/docs/DEVELOPMENT.md](./storefront/docs/DEVELOPMENT.md) | Vývoj + UI freeze |
| [storefront/docs/WOO_CART.md](./storefront/docs/WOO_CART.md) | Košík BFF |
| [AGENTS.md](./AGENTS.md) | Pravidlá pre AI agentov |

Historické / zastarané plány: `reports/archive/` (nepoužívať ako aktuálny plán).

---

## Zakázané

- UI redesign (`src/components/**` layout/tokens) mimo bugfixov  
- `DB_*` na Vercel  
- Secrets do gitu (`.env.local`, `wordpress-production.local.env`, …)  
