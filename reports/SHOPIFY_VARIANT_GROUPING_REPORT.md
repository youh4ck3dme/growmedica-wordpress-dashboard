# Shopify Variant Grouping & Validation Report

This report summarizes the variant grouping logic applied to the Grow Medical product catalog to consolidate single-product listings into proper variant-based Shopify products.

---

## 1. Grouping Statistics

*   **Original product rows (source)**: 675
*   **Resulting Shopify products (unique Handles)**: 557
*   **Total variants exported**: 675
*   **Single products (no variants)**: 524
*   **Grouped products (with multiple variants)**: 33
*   **Review required (LOW confidence entries kept separate)**: 0

---

## 2. Validation Checks

| Check | Expected | Actual | Status |
| :--- | :---: | :---: | :---: |
| **Row Count Alignment** | 675 | 675 | **PASS** |
| **Empty SKUs** | 0 | 8 | **FAIL** |
| **Duplicate SKUs** | 0 | 39 | **FAIL** |
| **Empty Prices** | 0 | 0 | **PASS** |
| **Invalid Prices** | 0 | 0 | **PASS** |
| **CSV Columns Alignment** | 34 | 34 | **PASS** |

---

## 3. Variant Grouping Examples (HIGH Confidence)

### Product: Nutrend - MASS CORE (`/products/nutrend-mass-core`)
- Nutrend - MASS CORE - vanilka - 5 440 g (SKU: 4,29,03, Price: 61.07 EUR)
- Nutrend - MASS CORE - čokoláda + kakao - 5 440 g (SKU: 4,29,02, Price: 61.07 EUR)

### Product: Nutrend 100% BEEF PROTEIN (`/products/nutrend-100-beef-protein`)
- Nutrend 100% BEEF PROTEIN - čokoláda + lieskový orech 900 g (SKU: 5,95,01, Price: 39 EUR)
- Nutrend 100% BEEF PROTEIN - mandľa + pistácia 900 g (SKU: 5,95,02, Price: 39 EUR)

### Product: Alpa Francovka (`/products/alpa-francovka`)
- Alpa Francovka 60 ml (SKU: 00013, Price: 1.49 EUR)
- Alpa Francovka 160 ml (SKU: 00137, Price: 2.39 EUR)
- Alpa Francovka 1L (SKU: 00012, Price: 9.99 EUR)

### Product: ALPA francovka LESANA – liehový bylinný roztok (`/products/alpa-francovka-lesana-liehovy-bylinny-roztok`)
- ALPA francovka LESANA – liehový bylinný roztok 60 ml (SKU: 00075, Price: 1.49 EUR)
- ALPA francovka LESANA – liehový bylinný roztok 160 ml (SKU: 00453, Price: 2.39 EUR)

### Product: ALPA francovka KONOPE – liehový bylinný roztok (`/products/alpa-francovka-konope-liehovy-bylinny-roztok`)
- ALPA francovka KONOPE – liehový bylinný roztok 60 ml (SKU: 02192, Price: 1.49 EUR)
- ALPA francovka KONOPE – liehový bylinný roztok 160ml (SKU: 02401, Price: 2.69 EUR)

---

## 4. Low Confidence Entries (Kept Separate)

No low confidence entries found.

---

## Final Status

**READY_FOR_SHOPIFY_TEST_IMPORT**
