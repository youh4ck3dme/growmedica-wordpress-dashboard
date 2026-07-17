# Migration Phase Plan: Legacy to Headless Shopify

This document outlines the detailed timeline, milestones, actions, and rollback plans for the transition of Grow Medical from a self-hosted PHP monolith to a Next.js/Shopify headless setup.

---

## Migration Roadmap Overview

| Phase | Title | Main Milestone | Duration | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Data Audit & CSV Validation | Clean product templates ready | Done | Low |
| **Phase 2** | Shopify Test Import (10 products) | Visual verification in Shopify Admin | 1 day | Low |
| **Phase 3** | Mapping Corrections & Rerun | Refined CSVs and import script corrections | 1 day | Low |
| **Phase 4** | Full Shopify Import | All 675 products live in Shopify | 1 day | Medium |
| **Phase 5** | Next.js Read-Only Storefront | Frontend displays catalog via Storefront API | 3-4 days| Medium |
| **Phase 6** | Cart & Checkout Integration | End-to-end checkout functionality | 2 days | High |
| **Phase 7** | SEO Redirect Mapping | Custom 301 redirect configs live in Next.js | 1 day | High |
| **Phase 8** | Production Launch & Monitoring | Domain redirect & live order processing | 1 day | Critical |

---

## Detailed Phase Breakdown

### Phase 1: Data Audit & CSV Validation (Completed)
*   **Actions**:
    *   Queried legacy database.
    *   Identified 675 products and exported catalog structure.
    *   Constructed Shopify product templates.
    *   Split the CSV into parts under 10MB to bypass GCS upload limit of 15MB.
*   **Milestone**: Six clean, well-sized parts (`product_template_part_1.csv` to `product_template_part_6.csv`) generated and verified.

### Phase 2: Shopify Test Import (10 Products)
*   **Actions**:
    *   Isolate the first 10 products from `product_template_part_1.csv` into a test import file.
    *   Import them into the Shopify sandbox/trial account.
    *   Inspect product layout, pricing (DPH inclusion), descriptions (HTML rendering), and media downloads from legacy assets.
*   **Milestone**: Shopify dashboard confirms correct visual rendering of products and variant detail mapping.

### Phase 3: Mapping Corrections & Rerun
*   **Actions**:
    *   Review any fields (like missing collections or malformed HTML descriptions) identified during Phase 2.
    *   Adjust the conversion script `convert_shopify_to_template.php`.
    *   Regenerate all CSV parts.

### Phase 4: Full Shopify Import
*   **Actions**:
    *   Import all 6 generated CSV parts sequentially into Shopify Admin.
    *   Verify product counts (expecting 675 items), variant counts, prices, and status.
*   **Rollback Strategy**: If database integrity is broken, Shopify allows deleting imported products in bulk. Correct scripts and re-import.

### Phase 5: Next.js Read-Only Storefront
*   **Actions**:
    *   Set up the Next.js storefront directory structure.
    *   Configure Storefront API GraphQL client.
    *   Build Category (Collection) listings and Product Details Pages (PDP) with Incremental Static Regeneration (ISR).
*   **Milestone**: High-speed, crawlable catalog accessible locally/on staging.

### Phase 6: Cart & Checkout Integration
*   **Actions**:
    *   Build client-side cart drawer utilizing Shopify Storefront Cart mutations.
    *   Create checkout redirect button that transfers the cart session to standard Shopify Checkout page.
    *   Test cart operations (add, remove, adjust quantities, apply discount codes) and successful payment gateway integrations.

### Phase 7: SEO Redirect Mapping
*   **Actions**:
    *   Collect all legacy product and category URL links.
    *   Map legacy URLs to modern Shopify Handles.
    *   Implement **permanent 301 redirects** within `next.config.js` or Next.js Middleware.
*   **Example configuration inside `next.config.js`**:
    ```javascript
    module.exports = {
      async redirects() {
        return [
          {
            source: '/product/energy-renol-30-ml', // Old path
            destination: '/products/energy-renol-30-ml', // New path
            permanent: true,
          },
          {
            source: '/kategoria/bioinformacne-pripravky',
            destination: '/collections/bioinformacne-pripravky',
            permanent: true,
          }
        ]
      },
    }
    ```

### Phase 8: Production Launch
*   **Actions**:
    *   Configure Vercel custom domains to point to `growmedical.sk`.
    *   Update DNS records (A, CNAME, TXT/SPF).
    *   Shut down legacy PHP Docker containers.
    *   Monitor analytics, SEO search consoles, and incoming Shopify orders.
