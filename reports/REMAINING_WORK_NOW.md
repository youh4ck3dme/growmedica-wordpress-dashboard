# Zostávajúca práca — GrowMedica (aktualizované 2026-07-16 večer)

## Hotové dnes (už NErobiť znova)

| Oblasť | Stav |
|--------|------|
| Firemné údaje Next (`company.ts`, kontakt, VOP, GDPR, reklamácie, doprava) | ✅ |
| `docs/vzorfirma.md` + root `vzorfirma.md` | ✅ |
| Woo adresa Bellova 3455/6 + e-mail footer IČO/DIČ/IBAN | ✅ |
| BACS inštrukcie (IBAN/BIC) + COD | ✅ |
| E-mailové šablóny SK (on-hold s IBAN, processing, completed, invoice…) | ✅ |
| SMTP Websupport | ✅ |
| Katalóg Woo 557 produktov; www ťahá Woo (`gid://woocommerce/...`) | ✅ |
| Cookie košík (serverless) | ✅ |
| Doprava SK: DPD 3,90 / odberné 2,90 / Packeta 2,90 / free od 50 € | ✅ |
| WP stránky VOP / GDPR / reklamácie + `terms_page_id` | ✅ |
| POS / tracking / marketplace suggestions off | ✅ |

---

## P0 — blokuje „pekný“ live predaj (urobiť ďalej)

| # | Úloha | Kto / ako | Blokuje |
|---|--------|-----------|---------|
| **P0.1** | **Deploy storefront** s firemnými údajmi na Vercel | ✅ 2026-07-16 `vercel --prod` → www.growmedica.cz | — |
| **P0.2** | **Stripe** API keys (live/test) | Woo → Stripe → Dashboard keys | karty online |
| **P0.3** | **GoPay** merchant config | plugin GoPay | GoPay platby |
| **P0.4** | **Packeta** API kľúč + odosielateľ | Packeta plugin | mapový výber výdajne (flat rate už ide) |
| **P0.5** | **DPD** API / zmluva | DPD plugin | parcelshop map (flat rate už ide) |
| **P0.6** | Manuálny E2E v prehliadači: produkt → Next košík → cms checkout → BACS/COD | ty + agent | potvrdenie celej cesty |

Bez Stripe/GoPay stále ide kúpiť cez **bankový prevod** alebo **dobierku**.

---

## P1 — kvalita / cutover

| # | Úloha | Poznámka |
|---|--------|----------|
| **P1.1** | ISR revalidate | ✅ Code Snippet „GrowMedica ISR revalidate“ (options secret + storefront URL) |
| **P1.2** | Overiť sklad reálne vs importované `50` | inak falošný stock |
| **P1.3** | Top 20 produktov: ceny, obrázky, short desc | manuálne |
| **P1.4** | Commit + push všetkých lokálnych zmien (cart, company, import, dashboard) | git dirty |
| **P1.5** | Plné právne VOP (právnik) | teraz je skrátená verzia s reálnymi údajmi |
| **P1.6** | IČ DPH (ak plátca) | zatiaľ len DIČ |
| **P1.7** | Telefón zákazníckej linky (teraz placeholder `+421 900…`) | doplniť reálne |

---

## P2 — neskôr / voliteľné

| # | Úloha |
|---|--------|
| P2.1 | Dane 20 % DPH (ak plátca DPH) |
| P2.2 | Fakturačný plugin (PDF faktúra s dodávateľom) |
| P2.3 | Zrušenie Shopify po 14 dňoch stability |
| P2.4 | Nexus publish / ADMIN_EMAILS |
| P2.5 | Mistral live smoke na /dashboard |
| P2.6 | CZ doprava / predaj (teraz len SK) |

---

## Čo **nemôžem** dokončiť bez teba

1. **Stripe / GoPay / Packeta / DPD** merchant účty a API kľúče  
2. **Reálne telefónne číslo**  
3. **Schválenie deploy** na production (push/prod)  
4. **Právnik** na plné VOP  
5. **WebSupport shell** ak treba nahrávať mu-pluginy FTP/shell

---

## Odporúčané poradie (ďalšia hodina)

```
1. Deploy Next (company + cart) → www
2. Manuálny nákup 1 produktu (BACS) na cms checkout
3. Doplniť Stripe test keys → karta
4. Packeta API keď máš účet
5. Mu-plugin revalidate na cms
6. Commit všetkého do gitu
```

---

## Rýchly smoke (agent)

```bash
# katalóg = Woo
curl -s 'https://www.growmedica.cz/api/products?limit=1' | head -c 200

# doprava SK
# Woo REST shipping/zones/1/methods → cost 3.90 / 2.90 / free 50

# test order (vytvoriť + cancel) — skript v session
```
