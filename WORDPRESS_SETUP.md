# WordPress + WooCommerce Setup — GrowMedica CMS

Cieľ: headless CMS na `cms.growmedica.sk` (produkcia) alebo `http://localhost:8080` (lokálne).

## 1. Lokálny dev (Docker)

```bash
cd growmedica-wordpress-dashboard
docker compose up -d
# Počkaj ~30s, potom otvor http://localhost:8080
```

### WordPress inštalácia (first run)

1. Jazyk: **Slovenčina**
2. Názov: **GrowMedica CMS**
3. Admin účet + silné heslo
4. Email: admin@growmedica.sk

### Permalinky

**Nastavenia → Trvalé odkazy → Vlastné:** `/produkt/%postname%/`

Pre WooCommerce produkty: slug formát `/produkt/vitamin-c/` (mapuje sa na Next.js `/produkty/vitamin-c`).

## 2. WooCommerce wizard

1. **Plugins → Add New → WooCommerce** → Install & Activate
2. Spusti setup wizard:
   - Krajina: Slovensko, Mena: EUR
   - Platby: bankový prevod + dobierka (placeholder)
   - Doprava: Slovensko flat rate
3. **WooCommerce → Settings → Advanced → REST API**
4. **Add key:**
   - Description: `GrowMedica Next.js storefront`
   - User: admin
   - Permissions: **Read/Write**
5. Skopíruj `Consumer key` (ck_...) a `Consumer secret` (cs_...)

## 3. Odporúčané pluginy

| Plugin | Účel |
|--------|------|
| WooCommerce | Katalóg, objednávky, REST API v3 |
| Yoast SEO | Meta popisy (voliteľné) |
| Application Passwords | WP 6+ built-in — admin auth pre iframe |

JWT alternatíva: [JWT Authentication for WP REST API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)

## 4. Storefront env

```bash
cd storefront
cp .env.example .env.local
```

```bash
CMS_PROVIDER=wordpress
WORDPRESS_BASE_URL=http://localhost:8080
WOO_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOO_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORDPRESS_REVALIDATION_SECRET=local-dev-revalidation-secret-min-16-chars
NEXT_PUBLIC_DASHBOARD_URL=http://localhost:8080/wp-admin
NEXT_PUBLIC_SITE_URL=http://localhost:5555
```

## 5. Smoke test

```bash
cd storefront
yarn woo:smoke
# alebo manuálne:
curl -s "http://localhost:8080/wp-json/wc/v3/products?per_page=1&consumer_key=ck_...&consumer_secret=cs_..." | head -c 200
```

Očakávaný výstup: JSON pole (prázdne `[]` pred importom, alebo produkt po importe).

## 6. Import katalógu

```bash
yarn import:categories   # 14 kategórií z category-map.ts
yarn import:products     # produkty z mock/fixture dát
```

## 7. Produkcia (hosting checklist)

- [ ] VPS/managed WP hosting (min. 2 GB RAM)
- [ ] DNS `cms.growmedica.sk` → WP server
- [ ] SSL certifikát (Let's Encrypt)
- [ ] PHP 8.2+, MariaDB 10.6+
- [ ] WooCommerce REST API keys (Read/Write, server-only)
- [ ] CSP `frame-ancestors` pre `/wp-admin` (growmedica.sk, *.vercel.app, localhost:5555)
- [ ] `WORDPRESS_BASE_URL=https://cms.growmedica.sk` na Vercel
- [ ] Webhook na `/api/revalidate` pri zmene produktu (fáza 7)

## 8. API endpointy

| Endpoint | Popis |
|----------|-------|
| `GET /wp-json/wc/v3/products` | Produkty |
| `GET /wp-json/wc/v3/products/categories` | Kategórie |
| `GET /wp-json/wc/store/v1/cart` | Store API košík (headless) |
| `POST /wp-json/wc/store/v1/cart/add-item` | Pridať do košíka |
