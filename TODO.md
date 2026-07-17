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

## Zostáva na teba

- [ ] **Nasadiť mu-plugin** `growmedica-checkout-seed.php` (+ CORS/revalidate) na **cms.growmedica.cz**  
- [ ] Manuálny E2E nákup v prehliadači (1 SKU + 2 SKU)  
- [ ] Telefón (reálne číslo)  
- [ ] Stripe a/alebo GoPay keys  
- [ ] Packeta / DPD API  
- [ ] Reálny sklad (CSV)  
- [ ] Právnik VOP / DPH podľa potreby  
- [ ] Shopify off po stabilite  

## Po dodaní dát agent vie

| Ty dodáš | Agent spraví |
|----------|----------------|
| Telefón | `company.ts` + deploy |
| Stripe keys | zapnúť bránu v Woo |
| Packeta/DPD API | plugin config |
| CSV sku→qty | bulk stock update |
