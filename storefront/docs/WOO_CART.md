# WooCommerce Headless Cart

GrowMedica storefront uses a **BFF session cart** when `CMS_PROVIDER=wordpress`.

## Architektúra

```
Browser → POST /api/cart/add → catalog/cart.ts → wordpress/cart.ts (in-memory session)
                                              ↓
                                    Cookie: growmedical_cart_id
                                              ↓
Checkout → redirect na cms.growmedica.cz/checkout/?add-to-cart=ID&quantity=N
```

## API routes

| Route | Metóda | Popis |
|-------|--------|-------|
| `/api/cart/add` | POST | Pridá variant do košíka |
| `/api/cart` | GET/PUT/DELETE | Čítanie, update qty, remove line |
| `/api/cart/discount` | POST/DELETE | Zľavové kódy (WP: no-op zatiaľ) |

## Variant ID formát

WooCommerce produkty používajú Shopify-kompatibilný GID:

```
gid://woocommerce/ProductVariant/{productId}
```

`InteractiveCart.tsx` a `AddToCartButton.tsx` volajú rovnaké `/api/cart/*` routes — abstrakcia je v `src/lib/catalog/cart.ts`.

## Checkout

Košík obsahuje `checkoutUrl` s parametrami `add-to-cart` pre každý produkt. Používateľ je presmerovaný na natívny WooCommerce checkout.

## Mock režim

Pre Playwright a lokálny dev bez WP:

```bash
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
WORDPRESS_BASE_URL=http://localhost:8080
WOO_CONSUMER_KEY=ck_mock
WOO_CONSUMER_SECRET=cs_mock
WORDPRESS_REVALIDATION_SECRET=mock-revalidation-secret-123456
```

## Produkcia

1. Nastav `WORDPRESS_BASE_URL=https://cms.growmedica.cz`
2. WooCommerce Store API CORS — mu-plugin `wordpress/mu-plugins/growmedica-cors.php`
3. Session cart je in-memory (dev); pre produkciu zváž Redis/DB session store

## Testy

```bash
yarn test:integrity -- tests/integrity/mock-cart.spec.ts
```

Shopify mock: `SHOPIFY_MOCK_MODE=1` + `CMS_PROVIDER=shopify`  
Woo mock: `WOO_MOCK_MODE=1` + `CMS_PROVIDER=wordpress`
