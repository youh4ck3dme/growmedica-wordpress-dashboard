# GrowMedica — stav a čo treba urobiť

**Aktualizované:** 2026-07-19  
**Branch:** `main`  
**Produkcia:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  

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
| **Krajiny CZ / AT / HU / PL** (sell + ship, EUR) | ✅ 2026-07-19 · [WOO_KRAJINY report](./reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md) · smoke 61/0 |
| Test order REST (BACS → cancel) | ✅ order #1263 cancelled |
| ISR revalidate | ✅ snippet + CMS option + Vercel secret + prod redeploy |
| Dokumentácia STATUS / OPERATIONS / MERCHANT_KEYS | ✅ |
| Git clean + secrets mimo gitu | ✅ |
| Security hardening (XSS, live-write AND, CORS, CI) | ✅ 2026-07-17 |
| Fake telefón skrytý (kým nedáš reálne číslo) | ✅ |
| Duplicitná DPD plugin metóda bez ceny vypnutá | ✅ |
| Audit skladu (qty 50 ≈ fiktívne) | ✅ [reports/STOCK_AUDIT.md](./reports/STOCK_AUDIT.md) |
| **SuperFaktúra WooCommerce 1.53.2** | ✅ active + BACS/COD defaults · CMS firma/IBAN overené · skripty smoke ✅ · **API key ešte majiteľ** · [verify](./reports/SUPERFAKTURA_GO_LIVE_VERIFY.md) |
| DPH interim (neplatca) | ✅ `calc_taxes: no` / `taxesEnabled: false` zámerne · VOP · IČ DPH prázdne |
| CMS snippets redeploy | ✅ checkout seed + CORS + ISR |
| Production smoke www | ✅ `/api/products` Woo gid |
| Facets vendor/type/effect | ✅ controlled taxonomy + URL query sync |
| Canonical listing pages | ✅ `buildPageMetadata(..., pathname)` |
| Mega-menu empty leaves + logo mark / banners | ✅ |
| Health bundle fotky + Woo produkty (balíčky) | ✅ časť skladu s shotmi (35+ slugov) |
| Vendor audit 460 | ✅ [reports/VENDOR_AUDIT.md](./reports/VENDOR_AUDIT.md) |
| **Shopify fully cleaned (runtime + scripts + CLI)** | ✅ catalog/cart/nav Woo-only · `src/lib/shopify` deleted |
| **`/dashboard` plne na WordPress/Woo** | ✅ 2026-07-19 · panely + agent tools (orders, inventory, copy, SEO, prices) · prod smoke `list_orders` OK · docs: [DASHBOARD_PANELS](./storefront/docs/DASHBOARD_PANELS.md) · [DASHBOARD_AGENT](./storefront/docs/DASHBOARD_AGENT.md) |

**Shop ide predávať cez bankový prevod a dobierku** bez Stripe/Packeta. Shopify runtime v storefronte **nie je**.

> **mu-plugins na disk (SSH):** ekvivalent beží ako **Code Snippets** na cms. Fyzické PHP súbory v `wp-content/mu-plugins/` sú voliteľné, ak máš SSH.

---

## Čo vie spraviť len ty (nie agent)

> **Pre majiteľa (ľudsky, body):** **[majitel.md](./majitel.md)**  
> **Tech hub (Packeta · karta · SF · GoPay · DPD):** [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)

| # | Úloha | Prečo agent nemôže |
|---|--------|---------------------|
| 1 | **Manuálny nákup v prehliadači** (1× + 2× SKU BACS) | potvrdenie UX + e-mail v tvojej schránke |
| 2 | **Reálne telefónne číslo** | neexistuje v dátach — daj ho a doplníme |
| 3 | **Stripe** API keys (test/live) — debetná/kreditná karta | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#2-stripe-debetná--kreditná-karta) |
| 4 | **GoPay** merchant | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#3-gopay) |
| 5 | **Packeta** API + odosielateľ | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#4-packeta-zásielkovňa) |
| 6 | **DPD** API zmluva | merchant účet → [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#5-dpd) |
| 7 | **Reálny sklad** (CSV/qty) | 397 produktov má falošných 50 ks |
| 8 | **Plné VOP** právnik | právny text |
| 9 | **IČ DPH / DPH 20 %** | účtovné rozhodnutie |
| 10 | **SuperFaktúra** — registrácia + API (body **2a–2j** v majitel.md) | [majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry) · [SUPERFAKTURA_SETUP](./docs/SUPERFAKTURA_SETUP.md) |
| 11 | ~~Zrušiť Shopify / dashboard Shopify~~ | ✅ runtime + `/dashboard` agent 2026-07-19 (admin = WP + natívny dashboard) |

---

## Odporúčané poradie pre teba

1. Otvor www → 1 produkt → košík → cms checkout → BACS → skontroluj e-mail.  
2. **SuperFaktúra** — body **2a–2j** v [majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry) → „API vložené, otestuj“.  
3. **Stripe test** (karty) → potom Packeta/DPD.  
4. Pošli **telefón** (ak máš).  
5. Daj **sklad** (Excel sku/qty) — agent vie bulk update.

---

## Architektúra (live)

```
www.growmedica.cz (Next/Vercel, Woo only)
   ├─ storefront + /dashboard (agent + panely)
   └─ Woo REST ──► cms.growmedica.cz (WP + WooCommerce)
```

Shopify runtime **odstránený**. Dashboard link v UI ide na WordPress admin (`cms…/wp-admin`), nie Legacy Nexus.

---

## Produkčný smoke

```bash
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
# Dashboard (vyžaduje secret):
curl -s -H "x-dashboard-agent-secret: $DASHBOARD_AGENT_SECRET" \
  https://www.growmedica.cz/api/dashboard/health
```

| Check | OK |
|-------|-----|
| `/api/products` | `gid://woocommerce/...` |
| `/kontakt` | IČO 56 455 143, bez fake telefónu |
| cms checkout | doprava + BACS/COD · CZ/AT/HU/PL |
| Woo order API | smoke ✅ |
| `/dashboard` agent `list_orders` | ✅ Woo live (2026-07-19) |
| `/api/dashboard/health` (auth) | `cms_provider: wordpress`, `admin: wordpress` |

---

## Dokumentácia

| Súbor | |
|-------|--|
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | endpointy, env, prevádzka |
| [TODO.md](./TODO.md) | checklist |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | deploy |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | firma |
| [reports/STOCK_AUDIT.md](./reports/STOCK_AUDIT.md) | sklad |
| [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md) | čo dorobiť (súhrn) |
| [storefront/docs/DASHBOARD_PANELS.md](./storefront/docs/DASHBOARD_PANELS.md) | natívne panely |
| [storefront/docs/DASHBOARD_AGENT.md](./storefront/docs/DASHBOARD_AGENT.md) | AI agent tools (Woo) |
| [reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md](./reports/WOO_KRAJINY_CZ_AT_HU_PL_REPORT.md) | multi-krajiny |
