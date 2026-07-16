# Prompt pre AI — zvyšné GrowMedica úlohy (aktualizované 2026-07-16)

## Už hotové (NEMENIŤ bez dôvodu)

| Systém | URL / stav |
|--------|------------|
| E-shop Next.js | https://www.growmedica.cz — live, UI freeze |
| Katalóg | https://www.growmedica.cz/api/products — ~460 produktov, tokenless |
| Dashboard hybrid | https://www.growmedica.cz/dashboard |
| Shopify Admin API | ✅ client_credentials, API **2026-07**, 4 scopes |
| Nexus Lovable Secrets | ✅ CLIENT_ID/SECRET, domain `growmedica.myshopify.com` |
| CMS WP | https://cms.growmedica.cz — WP 7.0; **nie** shop master |
| Vercel | `h4ck3d/growmedica-wordpress-dashboard` |
| Admin Google | `erikbabcan@gmail.com` |

## Zostáva

1. **Deploy storefront** — AI SupplementFinder fix (`userInput` min 2, ľudské errory) je v gite, treba production deploy.
2. **Nexus publish** — ak cloud patch ešte nie je published.
3. **ADMIN_EMAILS** — potvrdiť `erikbabcan@gmail.com` v Lovable Secrets.
4. **CMS** — Woo/mu-plugins len na explicitný cutover; shop = Shopify.
5. **Write testy** — inventory/bundles len dry-run alebo po schválení.

## Zakázané

- UI redesign (`src/components/**` layout/tokens mimo bugfixov)
- `DB_*` na Vercel
- `CMS_PROVIDER=wordpress` na Production bez cutover plánu
- Secrets v gite / chate

## Overenie

```bash
cd storefront
yarn shopify:admin-verify --json
yarn type-check
# po deployi:
curl -sI https://www.growmedica.cz/api/products | head
# AI: krátky text „ahoj“ nesmie vrátiť Zod JSON dump
```
