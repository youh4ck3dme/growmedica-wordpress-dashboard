# GrowMedica — stav a čo treba urobiť

**Aktualizované:** 2026-07-17 (agent-done: snippets, SF, ISR sync, smoke)  
**Branch:** `feat/dashboard-agent-v2`  
**Produkcia:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  

**Prevádzka / endpointy / env:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)  
**Merchant API (ty):** [docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)

---

## Hotové automaticky (agent) ✅

| Oblasť | Stav |
|--------|------|
| Next + Woo katalóg na www | ✅ |
| Cookie košík, checkout cms | ✅ multi-SKU `gm_cart` (Code Snippet active) |
| Firma, VOP, GDPR, IBAN, e-maily, SMTP | ✅ |
| BACS + COD, doprava SK s cenami, free od 50 € | ✅ |
| Test order REST (BACS → cancel) | ✅ order #1263 cancelled |
| ISR revalidate | ✅ snippet + CMS option + Vercel secret zosynchronizované + prod redeploy |
| Dokumentácia STATUS / OPERATIONS / MERCHANT_KEYS | ✅ |
| Git clean + secrets mimo gitu | ✅ |
| Security hardening (XSS, live-write AND, CORS, CI) | ✅ 2026-07-17 |
| Fake telefón skrytý (kým nedáš reálne číslo) | ✅ |
| Duplicitná DPD plugin metóda bez ceny vypnutá | ✅ |
| Audit skladu (qty 50 ≈ fiktívne) | ✅ [reports/STOCK_AUDIT.md](./reports/STOCK_AUDIT.md) |
| **SuperFaktúra WooCommerce 1.53.2** | ✅ active + BACS/COD defaults · API key ešte ty |
| CMS snippets redeploy | ✅ checkout seed + CORS + ISR (2026-07-17) |
| Production smoke www | ✅ `/api/products` Woo gid |

**Shop ide predávať cez bankový prevod a dobierku** bez Stripe/Packeta API.

> **mu-plugins na disk (SSH):** ekvivalent beží ako **Code Snippets** na cms. Fyzické PHP súbory v `wp-content/mu-plugins/` sú voliteľné, ak máš SSH.

---

## Čo vie spraviť len ty (nie agent)

> **Hub (Packeta · karta · SuperFaktúra · GoPay · DPD):**  
> **[docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)** — kde získať kľúče a kam ich vložiť.

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
| 10 | **SuperFaktúra API** (e-mail + key + company_id) | [MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#1-superfaktúra-pdf-faktúry--proforma) · [detail](./docs/SUPERFAKTURA_SETUP.md) |
| 11 | **Zrušiť Shopify** | po tvojom schválení (po stabilite) |

---

## Odporúčané poradie pre teba

1. Otvor www → 1 produkt → košík → cms checkout → BACS → skontroluj e-mail.  
2. **SuperFaktúra API** ([MERCHANT_KEYS](./docs/MERCHANT_KEYS.md#1-superfaktúra-pdf-faktúry--proforma)).  
3. **Stripe test** (karty) → potom Packeta/DPD.  
4. Pošli **telefón** (ak máš).  
5. Daj **sklad** (Excel sku/qty) — agent vie bulk update.

---

## Architektúra (live)

```
www.growmedica.cz (Next/Vercel, CMS_PROVIDER=wordpress)
        → Woo REST → cms.growmedica.cz
```

Shopify = len import/rollback.

---

## Produkčný smoke

```bash
cd storefront
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200
```

| Check | OK |
|-------|-----|
| `/api/products` | `gid://woocommerce/...` |
| `/kontakt` | IČO 56 455 143, bez fake telefónu |
| cms checkout | doprava + BACS/COD |
| Woo order API | smoke ✅ |

---

## Dokumentácia

| Súbor | |
|-------|--|
| [docs/OPERATIONS.md](./docs/OPERATIONS.md) | endpointy, env, prevádzka |
| [TODO.md](./TODO.md) | checklist |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | deploy |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | firma |
| [reports/STOCK_AUDIT.md](./reports/STOCK_AUDIT.md) | sklad |
| [reports/REMAINING_WORK_NOW.md](./reports/REMAINING_WORK_NOW.md) | zvyšok |
