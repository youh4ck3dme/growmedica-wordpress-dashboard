# GrowMedica — TODO

**Aktualizované:** 2026-07-17  
**Hlavný stav:** [STATUS.md](./STATUS.md) · **Prevádzka:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)  
**Majiteľ:** [majitel.md](./majitel.md)

## Hotové (agent + main)

- [x] Woo live na www, cookie cart, multi-SKU checkout seed  
- [x] Security, firma/IBAN/SMTP, BACS+COD, doprava SK  
- [x] SuperFaktúra plugin + defaults (API key ešte majiteľ)  
- [x] Menu ako growmedica.sk, facets (vendor / type / effect)  
- [x] Vendor z `_shopify_vendor`, vendor audit report  
- [x] Mega-menu empty leaf filter (PR #7)  
- [x] Docs MERCHANT_KEYS + majitel.md  

## Otvorené — majiteľ (secrets / rozhodnutia)

- [ ] Manuálny E2E nákup (1 + 2 SKU BACS)  
- [ ] SuperFaktúra API (e-mail + key + company_id)  
- [ ] Telefón na web  
- [ ] Stripe test/live a/alebo GoPay  
- [ ] Packeta / DPD API  
- [ ] Reálny sklad (CSV)  
- [ ] DPH / VOP právnik podľa potreby  
- [ ] Shopify off po stabilite  

## Otvorené — agent (technické, podľa priority)

- [ ] Behavior E2E facets v prehliadači (Playwright flow)  
- [ ] Plná stabilita `yarn test:integrity` na pomalom CI/Mac (webServer)  
- [ ] Performance `/produkty` (Lighthouse ~66)  
- [ ] Mega-menu banner assets (ak WIP stash)  

## Po dodaní dát agent vie

| Ty dodáš | Agent spraví |
|----------|----------------|
| SuperFaktúra API | `/sf-status` + smoke faktúra |
| Stripe keys | zapnúť bránu + SF rules |
| Packeta/DPD API | plugin config |
| Telefón | company.ts + deploy |
| CSV sklad | bulk stock update |
