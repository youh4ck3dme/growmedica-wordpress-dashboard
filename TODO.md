# GrowMedica — TODO

**Aktualizované:** 2026-07-18  
**Súhrn čo dorobiť:** [reports/CO_DOROBIT.md](./reports/CO_DOROBIT.md)  
**Hlavný stav:** [STATUS.md](./STATUS.md) · **Prevádzka:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)  
**Majiteľ:** [majitel.md](./majitel.md) · SuperFaktúra **2a–2k**

## Hotové (agent + main)

- [x] Woo live na www, cookie cart, multi-SKU checkout seed  
- [x] Security, firma/IBAN/SMTP, BACS+COD, doprava SK  
- [x] SuperFaktúra plugin + defaults + smoke/API skripty (API key ešte majiteľ 2a–2j)  
- [x] CMS firma/IBAN verify + DPH interim neplatca + VOP (2026-07-18)  
- [x] Menu ako growmedica.sk, facets (vendor / type / effect)  
- [x] Vendor z `_shopify_vendor`, vendor audit report  
- [x] Mega-menu empty leaf filter (PR #7)  
- [x] Docs MERCHANT_KEYS + majitel.md + CO_DOROBIT  

## Otvorené — majiteľ (secrets / rozhodnutia)

- [ ] Manuálny E2E nákup (1 + 2 SKU BACS)  
- [ ] SuperFaktúra — majiteľ **2a–2j** ([majitel.md §2](./majitel.md#2-superfaktúra--automatické-faktúry)); agent potom smoke + BACS PDF  
  Stav: plugin+defaults ✅ · infra ✅ · **`api_*_set: false`** ⏳  
  Ref: [docs/SUPERFAKTURA_SETUP.md](./docs/SUPERFAKTURA_SETUP.md) · [reports/SUPERFAKTURA_GO_LIVE_VERIFY.md](./reports/SUPERFAKTURA_GO_LIVE_VERIFY.md)
- [ ] Telefón na web  
- [ ] Stripe test/live a/alebo GoPay  
- [ ] Packeta / DPD API  
- [ ] Reálny sklad (CSV)  
- [ ] DPH / VOP právnik podľa potreby (dnes interim neplatca)  
- [ ] Shopify off po stabilite  

## Otvorené — agent (technické, podľa priority)

- [ ] Behavior E2E facets v prehliadači (Playwright flow)  
- [ ] Plná stabilita `yarn test:integrity` na pomalom CI/Mac (webServer)  
- [ ] Performance `/produkty` (Lighthouse ~66)  
- [ ] Mega-menu banner assets (ak WIP stash)  

## Po dodaní dát agent vie

| Ty dodáš | Agent spraví |
|----------|----------------|
| SuperFaktúra API | `./scripts/set-superfaktura-api-from-env.sh` (voliteľné) · `smoke-superfaktura-30.sh` · `smoke-superfaktura-bacs-order.sh` |
| Stripe keys | zapnúť bránu + SF rules |
| Packeta/DPD API | plugin config |
| Telefón | company.ts + deploy |
| CSV sklad | bulk stock update |
