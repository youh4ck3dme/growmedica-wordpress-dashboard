# GrowMedica — stav a čo treba urobiť

**Aktualizované:** 2026-07-29  
**Branch:** `main`  
**Produkcia:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  
**Last deploy:** `26bcf3f` (homepage full-bleed Pro Max + Finder merge)

> **AI agent:** najprv [README.md § AI AGENT](./README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29) — kanónický backlog.

**Prevádzka / endpointy / env:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)  
**Firebase Auth CLI:** [docs/FIREBASE_CLI.md](./docs/FIREBASE_CLI.md)  
**Merchant API (ty):** [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)  
**Majiteľ (ľudský checklist):** [majitel.md](./majitel.md) · SuperFaktúra drobné úlohy **2a–2k**  
**Čo dorobiť:** [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md)

---

## Hotové automaticky (agent) ✅

| Oblasť | Stav |
|--------|------|
| Next + Woo katalóg na www | ✅ |
| Cookie košík, checkout cms | ✅ multi-SKU `gm_cart` (Code Snippet active) |
| Firma, VOP, GDPR, IBAN, e-maily, SMTP | ✅ |
| BACS + COD, doprava SK s cenami, free od 50 € | ✅ |
| **Krajiny CZ / AT / HU / PL** (sell + ship, EUR) | ✅ 2026-07-19 · [WOO_KRAJINY report](./reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md) |
| ISR revalidate | ✅ |
| Security hardening | ✅ |
| SuperFaktúra WooCommerce 1.53.2 | ✅ plugin · **API key ešte majiteľ** |
| DPH interim (neplatca) | ✅ |
| Facets / mega-menu / bundles / vendor audit | ✅ |
| **Shopify runtime odstránený** | ✅ |
| **`/dashboard` Woo-only** | ✅ panely + agent tools |
| Homepage reorder + Finder merge + Pro Max layout | ✅ 2026-07-28 · `26bcf3f` |
| i18n CS/SK/EN/DE (shop UI + finder) | ✅ |
| AI pharmacist drawer + Supplement Finder | ✅ |
| Mobile iPhone layout regression tests | ✅ |

**Shop ide predávať cez bankový prevod a dobierku** bez Stripe/Packeta.

---

## Agent backlog (storefront) — 2026-07-29 audit

| P | Úloha | Závažnosť | Súbory / poznámka |
|---|--------|-----------|-------------------|
| P0 | **Reálna auth** (prihlásenie + profil) | Kritické | `src/app/prihlasenie/page.tsx`, `src/app/profil/page.tsx` — dnes MOCK |
| P0 | **Analytics** GTM/GA4/Pixel + consent | Vysoké | Cookie banner existuje, trackuje nič |
| P1 | Meta title `/prihlasenie`, `/profil`, `/oblubene` | Nízke→P1 | `metadata` export |
| P1 | Wishlist sync vs localStorage-only | Stredné | `WishlistButton`, `/oblubene` |
| P1 | Dead CSS `.why-growmedica__*` | Nízke | `globals.css` |
| P2 | E-mail notifikácie Woo branding | Stredné | CMS |
| P2 | Product reviews Woo napojenie | Stredné | overiť |
| P2 | Search UX `/vyhladavanie` | Stredné | overiť relevantnosť |
| P3 | Theme switcher / blog / B2B form / Upstash | Nice | |

Detail tabuliek: [README.md § AI AGENT](./README.md#-ai-agent--čítaj-prvé-aktualizované-2026-07-29).

---

## Čo vie spraviť len ty (nie agent)

> **Pre majiteľa (ľudsky, body):** **[majitel.md](./majitel.md)**  
> **Tech hub (Packeta · karta · SF · GoPay · DPD):** [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)

| # | Úloha | Prečo agent nemôže |
|---|--------|---------------------|
| 1 | **Manuálny nákup v prehliadači** (1× + 2× SKU BACS) | potvrdenie UX + e-mail v tvojej schránke |
| 2 | **Reálne telefónne číslo** | neexistuje v dátach — daj ho a doplníme |
| 3 | **Stripe** API keys (test/live) | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#2-stripe-debetná--kreditná-karta) |
| 4 | **GoPay** merchant | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#3-gopay) |
| 5 | **Packeta** API + odosielateľ | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#4-packeta-zásielkovňa) |
| 6 | **DPD** API zmluva | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#5-dpd) |
| 7 | **Reálny sklad** (CSV/qty) | 397 produktov má falošných 50 ks |
| 8 | **Plné VOP** právnik | právny text |
| 9 | **IČ DPH / DPH 20 %** | účtovné rozhodnutie |
| 10 | **SuperFaktúra** — registrácia + API (body **2a–2j**) | [majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry) |
| 11 | **GTM / GA4 / Pixel IDs** | merchant účty — agent zapojí po dodaní ID |

---

## Odporúčané poradie pre teba

1. Otvor www → 1 produkt → košík → cms checkout → BACS → skontroluj e-mail.  
2. **SuperFaktúra** — body **2a–2j** v [majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry).  
3. Pošli **GTM/GA4/Pixel** ID (ak máš) — agent zapojí analytics.  
4. **Stripe test** (karty) → potom Packeta/DPD.  
5. Pošli **telefón** (ak máš).  
6. Daj **sklad** (Excel sku/qty).

---

## Architektúra (live)

```
www.growmedica.cz (Next/Vercel, Woo only)
   ├─ storefront + /dashboard (agent + panely)
   └─ Woo REST ──► cms.growmedica.cz (WP + WooCommerce)
         └─ checkout /kontrola-objednavky (platba + doprava)
```

Shopify runtime **odstránený**. Auth/profil storefrontu je zatiaľ **MOCK** (pozri P0).

---

## Produkčný smoke

```bash
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
curl -s -H "x-dashboard-agent-secret: $DASHBOARD_AGENT_SECRET" \
  https://www.growmedica.cz/api/dashboard/health
```

| Check | OK |
|-------|-----|
| `/api/products` | `gid://woocommerce/...` |
| Homepage Finder `#supplement-finder` | ✅ live |
| Pro Max full-bleed (bez `main{zoom}`) | ✅ `26bcf3f` |
| cms checkout | doprava + BACS/COD · CZ/AT/HU/PL |
| `/dashboard` agent `list_orders` | ✅ Woo live |

---

## Dokumentácia

| Súbor | |
|-------|--|
| [README.md](./README.md) | **AI AGENT backlog (hore)** + quick start |
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | endpointy, env, prevádzka |
| [TODO.md](./TODO.md) | checklist |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | deploy |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | firma |
| [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md) | čo dorobiť (súhrn) |
| [storefront/docs/DASHBOARD_AGENT.md](./storefront/docs/DASHBOARD_AGENT.md) | AI agent tools (Woo) |
| [AGENTS.md](./AGENTS.md) | Cursor Cloud pravidlá |
