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

## Zostáva (aktuálne — shop už = Woo na produkcii)

1. **Deploy storefront** — firemné údaje + cookie cart ešte lokálne / nie plne na www.
2. **Stripe / GoPay** merchant keys (BACS+COD už idú).
3. **Packeta / DPD** API (flat rate doprava už má ceny).
4. **Mu-plugin revalidate** na cms (namespace ešte nevidno).
5. Manuálny E2E nákup v prehliadači.
6. Detail: `reports/CO_DOROBIT.md` (predtým `REMAINING_WORK_NOW.md`)

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
