# Shopify Product Category Mapping Report

This report summarizes the Shopify Standard Product Taxonomy classification applied to the Grow Medical product catalog.

---

## 1. Classification Summary

*   **Total variants exported (CSV rows)**: 675 (Expected: 675)
*   **Unique Shopify products (Handles)**: 557 (Expected: 557)
*   **Parent products with empty Product Category**: 0

---

## 2. Category Usage Breakdown

*   **Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements**: 356 products
*   **Health & Beauty > Personal Care > Cosmetics**: 200 products
*   **Health & Beauty > Health Care**: 1 products

---

## 3. Classification Rules Applied

*   **Cosmetics (`Health & Beauty > Personal Care > Cosmetics`)**: Matches titles/tags containing creams, body care, oils, balms, etc.
*   **Health Care (`Health & Beauty > Health Care`)**: Matches general medical supplies, bandages, braces, thermometers, toothbrushes, toothpastes, and oral care.
*   **Vitamins & Supplements (`Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements`)**: Default fallback for nutritional supplements, proteins, vitamins, and minerals.

---

## 4. Products Requiring Category Review

The following 21 products did not match any specific category triggers and were assigned the default safe category (**Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements**):

| Handle | Title | Legacy Type |
| :--- | :--- | :--- |
| `mycomedica-mycochemo` | MycoMedica MycoChemo, | `Nádorové ochorenia` |
| `bio-polyporus-prasok-100g-odvodhuje-organizmus` | BIO Polyporus prášok 100g Odvodňuje organizmus | `Product` |
| `volna-cesta` | Voľná cesta | `Ostatné prípravky` |
| `nosovy-vanok` | Nosový vánok | `Priedušky a Kašeľ` |
| `posilnenie-opory` | Posilnenie opory | `Ostatné prípravky` |
| `opity-majster` | Opitý majster | `Alkoholizmus` |
| `zbystrenie-zmyslov` | Zbystrenie zmyslov | `Ostatné prípravky` |
| `odvedenie-toxinu` | Odvedenie toxínu | `Priedušky a Kašeľ` |
| `dang-gui` | Dang Gui | `Ženské zdravie` |
| `chaga` | Chaga | `Ostatné prípravky` |
| `hericium` | Hericium | `Ostatné prípravky` |
| `maitake` | Maitake | `Psychická pohoda` |
| `jasna-mysel` | Jasná myseľ | `Psychická pohoda` |
| `suche-sny` | Suché sny | `Ostatné prípravky` |
| `navrat-mladosti` | Návrat mladosti | `Pokožka` |
| `aquarion-tap-faucet` | AQUARION Tap Faucet | `Product` |
| `bioharmonex-4-0-biorezonacny-prstroj` | BioHarmonex 4.0 biorezonačný prístroj | `Product` |
| `denuts-cream-1000g` | DeNuts Cream 1000g | `Zdravé potraviny` |
| `osvetlenie-pre-rastlinu-elho-bulbo` | Osvetlenie pre rastlinu elho bulbo | `Product` |
| `set-pre-aktivny-zivotny-stl` | Set pre aktívny životný štýl | `Product` |
| `test` | Test | `Product` |

---

## Final Status

**READY_FOR_SHOPIFY_TEST_IMPORT**
