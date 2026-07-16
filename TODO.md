# GrowMedica — TODO

**Aktualizované:** 2026-07-16  
**Repo:** `youh4ck3dme/growmedica-wordpress-dashboard`  
**Branch:** `feat/dashboard-agent-v2`  
**Live:** https://www.growmedica.cz · CMS: https://cms.growmedica.cz  

> **Hlavný stav:** [STATUS.md](./STATUS.md)  
> **UI freeze:** nemeniť layout/dizajn storefrontu bez explicitného zadania.

---

## Hotové ✅

- [x] Next.js storefront na Vercel (www + apex)
- [x] `CMS_PROVIDER=wordpress` na produkcii (katalóg z Woo)
- [x] Import Shopify → Woo (~557 produktov)
- [x] Cookie košík (serverless)
- [x] Checkout cms: `/kosik`, `/kontrola-objednavky`
- [x] Platby: BACS (IBAN) + COD (+3 €)
- [x] Doprava SK: DPD / Packeta / free od 50 €
- [x] Firemné údaje (`docs/vzorfirma.md`, `company.ts`, legal pages, footer)
- [x] E-mail šablóny + SMTP Websupport
- [x] ISR revalidate (Code Snippet)
- [x] WP stránky VOP/GDPR/reklamácie + terms_page_id
- [x] Git čistý + secrets mimo gitu

---

## Ďalej (priorita)

### P0

- [ ] Manuálny E2E nákup (BACS alebo COD) v prehliadači
- [ ] Stripe keys (karty online)
- [ ] GoPay merchant config (ak sa používa)
- [ ] Packeta API (mapa výdajní)
- [ ] DPD API (parcelshop mapa)
- [ ] Reálne telefónne číslo na `/kontakt`

### P1

- [ ] Audit skladu vs realita
- [ ] Top 20 produktov (cena, foto, popis)
- [ ] Plné VOP (právnik)
- [ ] IČ DPH / DPH 20 % podľa účtovníka

### P2

- [ ] 14 dní stabilita → zrušiť Shopify
- [ ] PDF faktúry (plugin)
- [ ] Nexus / dashboard agent polish
- [ ] CZ shipping zone (voliteľné)

---

## Príkazy

```bash
cd storefront
yarn type-check
yarn diagnostic
PREVIEW_URL=https://www.growmedica.cz yarn production:smoke
```

Import (len pri potrebe):

```bash
node scripts/import-shopify-to-woo.mjs --update
```

---

## Dokumentácia

| Súbor | |
|-------|--|
| [STATUS.md](./STATUS.md) | Stav + čo robiť |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Deploy / env |
| [reports/REMAINING_WORK_NOW.md](./reports/REMAINING_WORK_NOW.md) | Detail zvyšku |
| [docs/vzorfirma.md](./docs/vzorfirma.md) | Firma / banka |
