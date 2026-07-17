# Data Mapping Specifications: Legacy DB to Shopify

This document defines the exact field-level mapping rules for migrating catalog data from the legacy Grow Medical MariaDB database to Shopify. 

---

## 1. Field-by-Field Mapping Matrix

The table below shows how database fields from the legacy WooCommerce/Custom database map to Shopify CSV columns and Shopify GraphQL Product objects.

| Legacy Field | Shopify CSV Column | Shopify API Attribute (GraphQL) | Transformation / Logic Rules |
| :--- | :--- | :--- | :--- |
| `post_title` | `Title` | `Product.title` | Direct string import. |
| `post_name` (slug) | `URL handle` | `Product.handle` | Sanitized URL slug. Must be unique. Used for SEO redirects. |
| `post_content` | `Description` | `Product.descriptionHtml` | Keep valid HTML; strip custom legacy inline CSS, JS, and PHP script tags. |
| `_manufacturer` | `Vendor` | `Product.vendor` | E.g., `ENERGY`, `Hera`, etc. |
| `_product_type` | `Type` | `Product.productType` | E.g., `Bioinformačné prípravky`, `Doplnky stravy`. |
| `_stock` | `Inventory quantity` | `InventoryItem.inventoryLevels` | Map integer stock value. Enable Shopify inventory tracking. |
| `_price` | `Price` | `ProductVariant.price` | Map retail price (formatted with `.`, e.g., `21.80`). |
| `_regular_price` | `Compare-at price` | `ProductVariant.compareAtPrice` | Map original/slashed price. |
| `_sku` | `SKU` | `ProductVariant.sku` | Must be unique across all variants. E.g., `113b`. |
| `_ean` | `Barcode` | `ProductVariant.barcode` | E.g., GTIN, EAN, or UPC. |
| `_weight` | `Weight value (grams)` | `ProductVariant.weight` | Convert legacy values (usually in kg) to grams (multiply by 1000). |
| `_visibility` | `Status` | `Product.status` | Mapping: `instock` or `visible` -> `active`, `outofstock` -> `active` (with continue selling enabled), hidden -> `draft`. |
| `_image_url` | `Product image URL` | `Product.media` | Points to public image URLs to be pulled into Shopify CDN. |
| `_image_position` | `Image position` | `Product.media` | Order position of the media (1, 2, 3, etc.). |
| `_meta_title` | `SEO title` | `Product.seo.title` | Custom SEO Title. Fallback to `Title` if empty. |
| `_meta_description`| `SEO description` | `Product.seo.description` | Custom Meta Description (max 160 characters). Fallback to plain-text description excerpt if empty. |
| `_category_name` | `Type` or `Tags` | `Product.tags` / `Collections` | Map legacy hierarchical categories to Shopify Collections and tags (e.g. `Kozmetika`, `Bylinné čaje`). |

---

## 2. Special Rules and Transformations

### A. Price and Tax Handling (DPH)
*   **Legacy System**: Prices in the legacy MariaDB database are stored either with or without VAT (DPH).
*   **Shopify Configuration**: 
    *   Set Shopify to **"All prices include tax"** (Standard for Slovak e-commerce selling B2C).
    *   Slovak standard VAT is **20%** (10% for certain products like books/medicines).
    *   The import script must calculate and map the final retail price (with tax) to `Price`.
    *   Set `Charge tax` to `true` for all variants.

### B. Weight Mapping
*   Shopify displays weights in specified display units but stores them internally.
*   **Rule**: The migration script converts legacy weights (which are stored in kg, e.g. `0.03 kg`) into grams (`30 g`) by multiplying by 1000, ensuring shipping rate calculations work flawlessly.

### C. Category-to-Collection Mapping
Shopify does not have a native "category hierarchy" in the same way WooCommerce does.
*   **Automated Collection Assignment**: 
    1.  The legacy category is mapped as a **Tag** to the product (e.g., `kategoria:Bylinné čaje`).
    2.  An **automated collection** is set up in Shopify with the condition: `Product Tag equals kategoria:Bylinné čaje`.
*   This decouples menu navigation from product data and allows products to exist in multiple collections easily.

### D. Inventory Policy (Out of Stock Selling)
*   For products where back-ordering is allowed in the legacy shop:
    *   `Continue selling when out of stock` is set to `true`.
*   Otherwise, set it to `false`.
