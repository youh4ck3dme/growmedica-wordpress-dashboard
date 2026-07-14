# WordPress → Next.js ISR revalidation

Pri uložení produktu alebo kategórie vo WooCommerce mu-plugin pošle POST na storefront `/api/revalidate`.

## Cache tagy

| Tag | Kedy |
|-----|------|
| `woo-products` | Akákoľvek zmena produktu |
| `woo-product-{slug}` | Konkrétny produkt |
| `woo-categories` | Akákoľvek zmena kategórie |
| `woo-category-{slug}` | Konkrétna kategória |

## Storefront env

```bash
CMS_PROVIDER=wordpress
WORDPRESS_REVALIDATION_SECRET=your-secret-min-16-chars
```

## WordPress env (docker-compose / hosting)

```bash
GROWMEDICA_STOREFRONT_URL=https://growmedica.cz
GROWMEDICA_REVALIDATION_SECRET=your-secret-min-16-chars  # rovnaký ako WORDPRESS_REVALIDATION_SECRET
```

## Mu-plugin

Súbor: `wordpress/mu-plugins/growmedica-revalidate.php`

Mount do `wp-content/mu-plugins/` (docker-compose už mountuje `wordpress/mu-plugins/`).

## Manuálny test

```bash
curl -X POST \
  "http://localhost:5555/api/revalidate?secret=mock-revalidation-secret-123456&tag=woo-product-imunita-mock-1"
```

Očakávaná odpoveď: `{"revalidated":true,"provider":"wordpress","tags":[...]}`

## Overenie v produkcii

1. Upravte produkt vo WP admin.
2. Do ~60 s sa aktualizuje Next.js stránka bez full rebuild (ISR `revalidate = 3600` + on-demand tag invalidation).