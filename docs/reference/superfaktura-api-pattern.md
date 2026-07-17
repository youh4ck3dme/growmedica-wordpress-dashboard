# SuperFaktúra API — referencia (nie produkčný plugin)

**Účel:** vzor Auth + endpointov z archívu `su-fakktura` / `newprojekt-faktury`.  
**Produkcia GrowMedica:** oficiálny plugin [`woocommerce-superfaktura`](https://wordpress.org/plugins/woocommerce-superfaktura/) na [cms.growmedica.cz](https://cms.growmedica.cz) — **neinštaluj** CPT plugin `newprojekt-faktury`.

| Dokument | |
|----------|--|
| Majiteľ (drobné úlohy **2a–2k**) | [../../majitel.md](../../majitel.md#2-superfaktúra--automatické-faktúry) |
| Setup + stav cms | [../SUPERFAKTURA_SETUP.md](../SUPERFAKTURA_SETUP.md) |
| Merchant hub | [../MERCHANT_KEYS.md](../MERCHANT_KEYS.md#1-superfaktúra-pdf-faktúry--proforma) |
| PHP sample | [class-newprojekt-faktury-superfaktura-provider.php](./class-newprojekt-faktury-superfaktura-provider.php) |
| Smoke | `../../scripts/smoke-superfaktura-30.sh` |

---

## Stav GrowMedica (2026-07-17)

| | |
|--|--|
| Plugin 1.53.2 + defaults | ✅ |
| 30× `sf-status` infra | ✅ |
| API credentials v Woo | ⏳ majiteľ (registrácia + 2a–2j) |

---

## Registrácia (majiteľ)

1. Účet: [moja.superfaktura.sk](https://moja.superfaktura.sk/) pod **GrowMedica s.r.o.** (SK, nie CZ).  
2. Firemné údaje podľa [vzorfirma.md](../vzorfirma.md) (IČO, DIČ, IBAN).  
3. Plán **Premium** alebo **trial s API** (free často API nemá).  
4. **Nástroje → API** → API e-mail, API kľúč, Company ID.  
5. Vlož do Woo: [Nastavenia → SuperFaktúra](https://cms.growmedica.cz/wp-admin/admin.php?page=wc-settings&tab=superfaktura)  
   - Version = **SuperFaktura.sk**  
   - Sandbox = **off**  
   - **Test API connection** = OK  
6. Agentovi: „API vložené, otestuj“.

Nikdy nedávaj API key do gitu.

---

## Auth a endpointy (vzor z reference PHP)

| Vec | Hodnota |
|-----|---------|
| Auth | HTTP Basic: `base64(email + ':' + api_key)` |
| Vytvorenie faktúry | `POST https://moja.superfaktura.sk/api/invoices/add` |
| Stav faktúry | `GET https://moja.superfaktura.sk/api/invoices/view/{id}` |
| Content-Type | `application/json; charset=utf-8` |

Oficiálna dokumentácia: https://github.com/superfaktura/docs

Typický payload (zjednodušený vzor — Woo plugin mapuje Woo order sám):

- odberateľ: meno, email, adresa  
- položky: názov, množstvo, cena, DPH %  
- poznámka / VS  
- mena EUR  

---

## GrowMedica stack (produkcia)

| Vrstva | Čo |
|--------|-----|
| CMS plugin | `woocommerce-superfaktura` 1.53.2 |
| Defaults | Code Snippet *GrowMedica SuperFaktura defaults* (BACS/COD) |
| Status API | `GET /wp-json/growmedica/v1/sf-status` (App Password) |
| Smoke | `./scripts/smoke-superfaktura-30.sh` |

Headless Next.js **nevolá** SuperFaktúra API — faktúry idú z Woo order lifecycle na cms.

---

## Čo z iCloud `su-fakktura` nebrať

- celý CPT plugin `newprojekt-faktury` (+ zip)  
- iDoklad provider  
- `simple-cloud-landing`  
- `auth_key.exp` (SSH secrets — mimo GrowMedica)  
