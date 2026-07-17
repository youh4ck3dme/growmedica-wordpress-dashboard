# WooCommerce Headless Cart

GrowMedica storefront uses a **signed cookie cart** when `CMS_PROVIDER=wordpress`
(serverless-safe — no in-memory Map across Vercel instances).

## Architektúra

```
Browser → POST /api/cart/add → catalog/cart.ts → wordpress/cart.ts
                                              ↓
                    Cookie: growmedical_cart_id = woo-cart-v1.<payload>.<hmac>
                                              ↓
Checkout → cms/?gm_cart=id:qty,id:qty  (mu-plugin growmedica-checkout-seed.php)
                                              ↓
                    Woo session filled with ALL lines → redirect to checkout
```

## API routes

| Route | Metóda | Popis |
|-------|--------|-------|
| `/api/cart/add` | POST | Pridá variant do košíka (quantity 1–99) |
| `/api/cart` | GET/PUT/DELETE | Čítanie, update qty, remove line |
| `/api/cart/discount` | POST/DELETE | Zľavové kódy (WP: no-op zatiaľ — kupón na CMS) |

## Variant ID formát

WooCommerce produkty používajú Shopify-kompatibilný GID:

```
gid://woocommerce/ProductVariant/{productId}
```

`InteractiveCart.tsx` a `AddToCartButton.tsx` volajú rovnaké `/api/cart/*` routes — abstrakcia je v `src/lib/catalog/cart.ts`.

## Checkout (multi-SKU)

`checkoutUrl` obsahuje `gm_cart=PRODUCT_ID:QTY,...` pre **všetky** riadky.
Mu-plugin `wordpress/mu-plugins/growmedica-checkout-seed.php` na CMS:

1. vyprázdni Woo cart
2. pridá každú položku
3. redirectne na `wc_get_checkout_url()` (SK: `/kontrola-objednavky/`)

**Deploy na CMS (povinné pre 2+ SKU):**

1. **Odporúčané (permanentné):** skopíruj `wordpress/mu-plugins/growmedica-checkout-seed.php` (+ cors/revalidate) do `wp-content/mu-plugins/` na `cms.growmedica.cz` (SSH / WebSupport shell).
2. **Bez SSH (Code Snippets REST):**  
   `WORDPRESS_ADMIN_USER=… WORDPRESS_APP_PASSWORD=… ./scripts/deploy-cms-snippets.sh`  
   Nasadí aktívne snippeti: checkout seed, CORS allowlist, ISR revalidate.

**Verify multi-SKU:**

```bash
# musí 302 → /kontrola-objednavky/ (nie zostať na /?gm_cart=…)
curl -sI 'https://cms.growmedica.cz/?gm_cart=ID1:1,ID2:2' | head
```

## Signing secret

HMAC používa (v poradí): `CART_SIGNING_SECRET` → `WORDPRESS_REVALIDATION_SECRET` → `DASHBOARD_AGENT_SECRET`.
V produkcii **nie je** hardcoded fallback — chýbajúci secret = chyba.

## Mock režim

```bash
CMS_PROVIDER=wordpress
WOO_MOCK_MODE=1
WORDPRESS_BASE_URL=http://localhost:8080
WOO_CONSUMER_KEY=ck_mock
WOO_CONSUMER_SECRET=cs_mock
WORDPRESS_REVALIDATION_SECRET=mock-revalidation-secret-123456
```

## Produkcia

1. `WORDPRESS_BASE_URL=https://cms.growmedica.cz`
2. CORS allowlist — `growmedica-cors.php` (+ voliteľne `GROWMEDICA_CORS_ORIGINS`)
3. Checkout seed mu-plugin nasadený na CMS
4. ISR: `growmedica-revalidate.php` posiela secret v headri `x-revalidation-secret`

## Testy

```bash
yarn test:woo:integrity -- tests/integrity/mock-cart.spec.ts
yarn test:shopify-admin   # + node unit pre checkout URL builder
```
