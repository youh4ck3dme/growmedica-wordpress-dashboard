# GrowMedica — TODO

**Aktualizované:** 2026-07-17  
**Hlavný stav:** [STATUS.md](./STATUS.md) · **Prevádzka:** [docs/OPERATIONS.md](./docs/OPERATIONS.md)

## Hotové agentom ✅

- [x] Woo live na www, cookie cart, checkout cms  
- [x] Multi-SKU checkout seed (`gm_cart` mu-plugin)  
- [x] Security P0–P2 (DOMPurify-like sanitize, live-write guards, CORS, CI)  
- [x] Firma / IBAN / e-maily / SMTP / VOP stránky  
- [x] BACS + COD, doprava SK, free ≥ 50 €  
- [x] REST smoke order  
- [x] Docs OPERATIONS + STATUS  
- [x] Fake telefón skrytý  
- [x] Stock audit report  
- [x] Git + secrets OK  
- [x] SuperFaktúra plugin 1.53.2 active + defaults (BACS/COD)  
- [x] CMS Code Snippets redeploy (gm_cart + CORS + ISR)  
- [x] ISR secret CMS ↔ Vercel production sync + redeploy  
- [x] Production smoke + REST order smoke (#1263 cancelled)  
- [x] Docs hub [MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)  

## Zostáva na teba

> Všetky merchant kľúče na jednom mieste: **[docs/MERCHANT_KEYS.md](./docs/MERCHANT_KEYS.md)**

- [ ] Manuálny E2E nákup v prehliadači (1 SKU + 2 SKU)  
- [ ] Telefón (reálne číslo)  
- [ ] **SuperFaktúra API** (e-mail + key + company_id)  
- [ ] Stripe (debetná karta) a/alebo GoPay keys  
- [ ] Packeta / DPD API  
- [ ] Reálny sklad (CSV)  
- [ ] Právnik VOP / DPH podľa potreby  
- [ ] Shopify off po stabilite  

*(mu-plugins na disk: voliteľné — ekvivalent beží ako Code Snippets na cms)*

## Po dodaní dát agent vie

| Ty dodáš | Agent spraví |
|----------|----------------|
| Telefón | `company.ts` + deploy |
| Stripe keys | zapnúť bránu v Woo + SF invoice rule |
| Packeta/DPD API | plugin config |
| SuperFaktúra API | overenie `/sf-status` + smoke order → faktúra |
| CSV sku→qty | bulk stock update |
