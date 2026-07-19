# Report — krajiny CZ / AT / HU / PL (Woo CMS)

**Dátum:** 2026-07-19  
**CMS:** https://cms.growmedica.cz  

## 1) Allowed + ship-to

| Option | Hodnota |
|--------|---------|
| allowed_countries | specific |
| specific allowed | **SK, CZ, AT, HU, PL** |
| ship_to | specific |
| specific ship_to | **SK, CZ, AT, HU, PL** |
| default country (shop base) | **SK** (firma SK; e-shop www default trh CZ, mena EUR) |
| currency | **EUR** (jediná mena — nie PLN/HUF/CZK) |
| calc_taxes | **no** |

## 2) Tax rates (pripravené, neúčtované)

| Country | Rate % | Name | ID |
|---------|--------|------|-----|
| SK | 23 | DPH SK | 1 |
| CZ | 21 | DPH CZ | 2 |
| AT | 20 | DPH AT (USt) | 4 |
| HU | 27 | DPH HU (AFA) | 5 |
| PL | 23 | DPH PL (VAT) | 6 |

`woocommerce_calc_taxes = no` → zákazníkom sa DPH **neúčtuje**.  
`tax_based_on = shipping` (pripravené na budúcnosť).

## 3) Shipping zones

| Zone | ID | Country | Metóda | Cost |
|------|-----|---------|--------|------|
| Slovensko | 1 | SK | DPD kuriér / DPD box / Packeta / free ≥ 50 € | **nezmenené** 3,90 / 2,90 / 2,90 / free |
| Česko | 2 | CZ | Slovenská pošta – balík | **13,00 €** |
| Rakúsko | 3 | AT | Slovenská pošta – balík | **14,00 €** |
| Maďarsko | 4 | HU | Slovenská pošta – balík | **14,00 €** |
| Poľsko | 5 | PL | Slovenská pošta – balík | **15,00 €** |

**Ceny poštovného:** draft odhad (≈1,5 kg SP + 1,50 € manipulačný) — **overiť na [posta.sk cenník](https://www.posta.sk/cennik)**.  
Free shipping / Packeta / DPD **len SK**.

## 4) Platby

| Gateway | Stav |
|---------|------|
| BACS | enabled (všetky krajiny) |
| COD | enabled **len pre SK shipping metódy** (`flat_rate:1,2,3` + `free_shipping:5`) — nie pre SP balík CZ/AT/HU/PL |
| Stripe | disabled (nezmenené) |

## 5) Meny

- **EUR** je jediná mena obchodu.
- PLN / HUF **nie sú** aktivované (multi-currency nie je v scope; CZ trh default na www, ale checkout v EUR).

## 6) Admin

- General: https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=general  
- Tax: https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=tax  
- Shipping: https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=shipping  

## 7) Majiteľovi ostáva

1. Overiť poštovné na posta.sk a prípadne upraviť 13/14/14/15 €  
2. Rozhodnutie platca DPH s účtovníkom pred zapnutím `calc_taxes`  
3. Voliteľne multi-currency PLN/HUF neskôr  
4. Manuálny test checkout s adresou CZ/AT/HU/PL  

## 8) Zakázané — dodržané

- SK zóna a ceny nedotknuté  
- calc_taxes = no  
- mena EUR  
- storefront Next.js nemený  

## 9) Manuálny / Store API prechod (2026-07-19)

Live test cez **Woo Store API** (`/wp-json/wc/store/v1/cart`) s reálnym produktom `balicek-turistika-pohyb` (id 1326):

### Shipping rates podľa krajiny

| Krajina | Metódy (Store API) | Platby | DPH |
|---------|-------------------|--------|-----|
| SK | DPD 3,90 · DPD box 2,90 · Packeta 2,90 · free od 50 € | **cod + bacs** | 0 |
| CZ | **Slovenská pošta – balík 13 €** | **bacs** (bez COD) | 0 |
| AT | SP balík **14 €** | bacs | 0 |
| HU | SP balík **14 €** | bacs | 0 |
| PL | SP balík **15 €** | bacs | 0 |

### Ďalšie overenia
- CZ **neuniká** DPD/Packeta/free ✅  
- CZ aj pri košíku > 50 € ostáva len SP 13 € (žiadne free) ✅  
- SK free shipping sa zobrazí pri košíku ~78 € ✅  
- Dane `total_tax=0` pre SK/CZ/HU ✅  
- Storefront: produkt → Do košíka → `/kosik` funguje (screenshot) ✅  
- Checkout CTA: **Pokračovať do pokladne** (`#checkout-btn`) ✅  

### Stále draft
- Ceny SP **neoverené na posta.sk** (odhad).

## 10) Smoke test (automat)

```bash
# z rootu growmedica-wordpress-dashboard
source ./scripts/load-wp-prod-env.sh   # voliteľné — skript načíta env sám
./scripts/smoke-woo-countries-cz-at-hu-pl.sh
```

Skript overí admin settings + Store API cart (shipping/payments/tax) pre SK/CZ/AT/HU/PL.
Exit `0` = zelené.
