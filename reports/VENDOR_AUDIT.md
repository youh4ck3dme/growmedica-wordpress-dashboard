# Vendor audit (read-only) — WooCommerce cms.growmedica.cz

**Generated:** 2026-07-17T10:50Z  
**Products scanned:** 460 (API X-WP-Total=460)  
**Mapping:** mirrors `storefront/src/lib/wordpress/adapter.ts` → `resolveWooVendor`  
**Branch note:** post-`90f9cfa`; Codex tags facet not required for this audit.

## Summary

| Metric | Count |
|--------|------:|
| Published products | 460 |
| Unique mapped vendors | 6 |
| Source `_shopify_vendor` | 460 |
| Source `shopify_vendor` | 0 |
| Source `_vendor` | 0 |
| Source `brands[0]` | 0 |
| Source fallback `GrowMedica` | 0 |
| Missing both meta + brand | 0 |
| Suspicious mapped vendor | 0 |
| tags[0] ≠ mapped (old bug impact) | 459 |

## Mapped vendor distribution

| Vendor | Products |
|--------|--------:|
| ENERGY | 141 |
| CALIVITA | 129 |
| MYCOMEDICA | 102 |
| ALPA | 71 |
| ZEEN | 12 |
| GrowMedica.sk | 5 |

## Missing `_shopify_vendor` and brand

_None — every product has either meta or brand._

## Suspicious mapped vendors

_None matched EAN / numeric / BB·OB / packaging / code-like heuristics._

## Old bug: tags[0] vs correct mapping (sample)

Total products where tags[0] differs from mapped vendor: **459**

| ID | tags[0] (wrong) | mapped (correct) | source |
|---:|-----------------|------------------|--------|
| 1054 | `Huby v prášku` | `MYCOMEDICA` | _shopify_vendor |
| 1052 | `Coriolus` | `MYCOMEDICA` | _shopify_vendor |
| 1050 | `adaptogénne huby` | `MYCOMEDICA` | _shopify_vendor |
| 1048 | `500 BB / 49.92 OB` | `CALIVITA` | _shopify_vendor |
| 1046 | `8588007578019` | `ZEEN` | _shopify_vendor |
| 1044 | `BALÍČKY ZDRAVIA` | `ZEEN` | _shopify_vendor |
| 1042 | `283b` | `ENERGY` | _shopify_vendor |
| 1040 | `282b` | `ENERGY` | _shopify_vendor |
| 1038 | `271b` | `ENERGY` | _shopify_vendor |
| 1036 | `272b` | `ENERGY` | _shopify_vendor |
| 1034 | `289b` | `ENERGY` | _shopify_vendor |
| 1032 | `288b` | `ENERGY` | _shopify_vendor |
| 1030 | `135 BB / 18.75 OB` | `CALIVITA` | _shopify_vendor |
| 1028 | `8588007578477` | `ZEEN` | _shopify_vendor |
| 1026 | `8588007578460` | `ZEEN` | _shopify_vendor |
| 1024 | `8588007578422` | `ZEEN` | _shopify_vendor |
| 1022 | `279 BB / 38.57 OB` | `CALIVITA` | _shopify_vendor |
| 1020 | `8594167650687` | `GrowMedica.sk` | _shopify_vendor |
| 1018 | `8594167650311` | `MYCOMEDICA` | _shopify_vendor |
| 1016 | `8594167650304` | `MYCOMEDICA` | _shopify_vendor |
| 1014 | `8594167650427` | `MYCOMEDICA` | _shopify_vendor |
| 1012 | `8594167651752` | `MYCOMEDICA` | _shopify_vendor |
| 1010 | `8594167652216` | `MYCOMEDICA` | _shopify_vendor |
| 1008 | `8594167652506` | `MYCOMEDICA` | _shopify_vendor |
| 1006 | `8594167650694` | `MYCOMEDICA` | _shopify_vendor |
| 1004 | `8594167650663` | `MYCOMEDICA` | _shopify_vendor |
| 1002 | `8594167650670` | `MYCOMEDICA` | _shopify_vendor |
| 1000 | `859416765062` | `MYCOMEDICA` | _shopify_vendor |
| 998 | `8594167650830` | `MYCOMEDICA` | _shopify_vendor |
| 996 | `8594167651738` | `MYCOMEDICA` | _shopify_vendor |

## Verdict

**GO for vendor data quality** on cms: vast majority have `_shopify_vendor`; storefront mapping is safe.

Machine-readable: `reports/VENDOR_AUDIT.json`

*Read-only audit. No writes. No deploy.*
