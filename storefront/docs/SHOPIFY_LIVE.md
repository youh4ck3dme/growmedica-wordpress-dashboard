# Shopify — removed

The storefront no longer uses Shopify at runtime.

- **Live stack:** Next.js → WooCommerce REST (`cms.growmedica.cz`)
- **Admin:** WordPress admin (`https://cms.growmedica.cz/wp-admin`)
- **Removed:** `src/lib/shopify/**`, Shopify offline scripts, `@shopify/cli`, Shopify npm scripts

Historical import notes may exist in git history. Do not reintroduce Shopify env vars for production storefront.
