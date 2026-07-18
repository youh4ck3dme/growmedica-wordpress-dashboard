# SuperFaktúra go-live — agent verification (2026-07-18)

Live probe against `cms.growmedica.cz` (App Password + Woo REST). No secrets in this file.

## 1. Company profile (CMS ↔ vzorfirma)

| Pole | vzorfirma / company.ts | Live CMS | Match |
|------|------------------------|----------|-------|
| Názov | GrowMedica s.r.o. | BACS instructions + store_address_2 | ✅ |
| Adresa | Bellova 3455 / 6 | `woocommerce_store_address` | ✅ |
| Mesto | Košice - Staré Mesto | `woocommerce_store_city` | ✅ |
| PSČ | 040 01 | `woocommerce_store_postcode` | ✅ |
| Krajina | SK | `woocommerce_default_country: SK` | ✅ |
| IČO | 56 455 143 | v BACS instructions | ✅ |
| DIČ | 2122314975 | v BACS instructions | ✅ |
| IBAN | SK48 0200 0000 0050 3517 2956 | BACS instructions | ✅ |
| BIC | SUBASKBX | BACS instructions | ✅ |
| IČ DPH | *(nie je)* | — | ⏳ účtovník |
| Platca DPH | interim: **neplatca** (pozri §4) | `calc_taxes: no` | ✅ intentional |

**Majiteľ v SuperFaktúre (2c):** skopíruj rovnaké hodnoty do profilu firmy na [moja.superfaktura.sk](https://moja.superfaktura.sk/) — plugin ich ťahá z SF, nie z Woo.

## 2. Plugin / API / invoice rules (`sf-status`)

```json
{
  "plugin_active": true,
  "plugin_version": "1.53.2",
  "lang": "sk",
  "sandbox": false,
  "api_email_set": false,
  "api_key_set": false,
  "company_id_set": false,
  "defaults_applied": true,
  "invoice_rules": {
    "proforma_bacs": "on-hold",
    "regular_bacs": "processing",
    "regular_bacs_paid": "yes",
    "proforma_cod": "0",
    "regular_cod": "processing",
    "regular_cod_paid": "no"
  }
}
```

| Krok | Stav |
|------|------|
| Premium/API + credentials v Woo | ⏳ majiteľ 2a–2i |
| Test API connection | ⏳ po credentials |
| Full smoke `smoke-superfaktura-30.sh` | ⏳ po API (`api_*_set: true`) |
| BACS PDF smoke | ⏳ `scripts/smoke-superfaktura-bacs-order.sh` po API |

## 3. BACS smoke checklist (po API)

1. `./scripts/smoke-superfaktura-bacs-order.sh` → order `on-hold`
2. Meta `wc_sf_internal_proforma_id` + PDF / SF zálohová
3. Status → `processing` → `wc_sf_internal_regular_id` + ostrá faktúra (paid)
4. Majiteľ 2k: číslo dokladu, DPH, IBAN, e-mail zákazníka

## 4. DPH / `taxesEnabled: false`

| Signal | Value |
|--------|-------|
| Woo `woocommerce_calc_taxes` | `no` |
| Store API tax totals | `total_tax: 0` |
| Checkout `taxesEnabled` | `false` (Woo mirror of calc_taxes) |

**Interim policy (2026-07-18):** GrowMedica operates as **neplatca DPH** until accountant provides IČ DPH / payer status. Taxes stay off. If later registered as platca → enable Woo taxes, set IČ DPH in SF + vzorfirma, align VOP.

## 5. Agent tooling added

| Script | Purpose |
|--------|---------|
| `scripts/load-wp-prod-env.sh` | Quote-safe source of `wordpress-production.local.env` |
| `scripts/set-superfaktura-api-from-env.sh` | Write SF API options from env (never git) |
| `scripts/smoke-superfaktura-bacs-order.sh` | BACS on-hold → processing invoice smoke |

## Odovzdanie majiteľovi

1. SF profil = tabuľka §1  
2. API → Woo → Test → „API vložené, otestuj“  
3. Agent spustí full smoke + BACS script  
4. Majiteľ 2k v SF UI  
