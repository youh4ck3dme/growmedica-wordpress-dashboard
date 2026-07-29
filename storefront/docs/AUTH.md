# Customer auth (Woo / WordPress)

**Aktualizované:** 2026-07-29

Storefront `/prihlasenie` a `/profil` používajú **reálny WooCommerce zákaznícky účet** (nie mock).

## Tok

```
Browser → POST /api/auth/login (Next BFF)
       → CMS POST /wp-json/growmedica/v1/auth/login
         header X-GrowMedica-Auth-Secret
       → httpOnly cookie gm_customer_session (HMAC)
Browser → GET /api/auth/me → CMS /auth/me + Woo orders
```

## CMS

- Mu-plugin: `wordpress/mu-plugins/growmedica-customer-auth.php`
- Code Snippet (deploy): `./scripts/deploy-cms-snippets.sh` → **GrowMedica Customer Auth API**
- Shared secret: WP option `growmedica_auth_secret` alebo `growmedica_revalidation_secret`  
  (rovnaká hodnota ako `WORDPRESS_REVALIDATION_SECRET` / `AUTH_SESSION_SECRET` na Vercel)

## Env (storefront)

```bash
WORDPRESS_REVALIDATION_SECRET=...   # min 16; fallback pre session + CMS secret
# AUTH_SESSION_SECRET=...           # optional dedicated
# GROWMEDICA_AUTH_SECRET=...        # optional explicit CMS secret
```

## Mock

`WOO_MOCK_MODE=1` → login/register vracajú demo customer bez CMS.

## UI

- Login + registrácia (email/heslo)
- Profil: meno, email, adresy, posledné objednávky
- Vernostné body: „coming soon“ (už nie fake Jozef Novák)
