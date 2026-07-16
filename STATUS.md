# GrowMedica — stav a čo treba urobiť

**Aktualizované:** 2026-07-17 (security + multi-SKU checkout)  
**Branch:** `feat/dashboard-agent-v2`  
**Produkcia:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  

**Prevádzka / endpointy / env:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)

---

## Hotové automaticky (agent) ✅

| Oblasť | Stav |
|--------|------|
| Next + Woo katalóg na www | ✅ |
| Cookie košík, checkout cms | ✅ multi-SKU cez `gm_cart` mu-plugin |
| Firma, VOP, GDPR, IBAN, e-maily, SMTP | ✅ |
| BACS + COD, doprava SK s cenami, free od 50 € | ✅ |
| Test order REST (BACS + DPD 3,90 → cancel) | ✅ opakovane |
| ISR revalidate snippet | ✅ header-only secret |
| Dokumentácia STATUS / OPERATIONS / TODO | ✅ |
| Git clean + secrets mimo gitu | ✅ |
| Security hardening (XSS, live-write AND, CORS, CI) | ✅ 2026-07-17 |
| Fake telefón skrytý (kým nedáš reálne číslo) | ✅ |
| Duplicitná DPD plugin metóda bez ceny vypnutá | ✅ |
| Audit skladu (qty 50 ≈ fiktívne) | ✅ [reports/STOCK_AUDIT.md](./reports/STOCK_AUDIT.md) |

**Shop ide predávať cez bankový prevod a dobierku** bez Stripe/Packeta API.

---

## Čo vie spraviť len ty (nie agent)

| # | Úloha | Prečo agent nemôže |
|---|--------|---------------------|
| 0 | **Nasadiť mu-plugins na cms** (`growmedica-checkout-seed.php`, CORS, revalidate) | prístup na produkčný WP filesystem |
| 1 | **Manuálny nákup v prehliadači** (1× + 2× SKU BACS) | potvrdenie UX + e-mail v tvojej schránke |
| 2 | **Reálne telefónne číslo** | neexistuje v dátach — daj ho a doplníme |
| 3 | **Stripe** API keys (test/live) | merchant účet |
| 4 | **GoPay** merchant | merchant účet |
| 5 | **Packeta** API + odosielateľ | merchant účet |
| 6 | **DPD** API zmluva | merchant účet |
| 7 | **Reálny sklad** (CSV/qty) | 397 produktov má falošných 50 ks |
| 8 | **Plné VOP** právnik | právny text |
| 9 | **IČ DPH / DPH 20 %** | účtovné rozhodnutie |
| 10 | **Zrušiť Shopify** | po tvojom schválení (po stabilite) |

---

## Odporúčané poradie pre teba

1. Otvor www → 1 produkt → košík → cms checkout → BACS → skontroluj e-mail.  
2. Pošli **telefón** (ak máš).  
3. Doplň **Stripe** (alebo GoPay).  
4. Daj **sklad** (Excel sku/qty) — agent vie bulk update.  
5. Packeta/DPD keď máš API.

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
