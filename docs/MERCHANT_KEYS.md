# Merchant / API kľúče — čo dávaš ty (AI handoff)

**Účel:** jedno miesto pre všetky integrácie, kde agent **nemôže** ísť ďalej bez tvojich credentials.  
**Bez secrets v gite.** Sem patria len *kde získať* a *kam vložiť*. Heslá/API keys len do CMS adminu alebo gitignored env.

> **Ľudský checklist pre majiteľa (odporúčané čítať prvé):**  
> **[../majitel.md](../majitel.md)**

| Súvisiace | |
|-----------|--|
| Majiteľ (prehľad) | [../majitel.md](../majitel.md) |
| Stav / backlog | [../STATUS.md](../STATUS.md) · [../TODO.md](../TODO.md) · [../reports/CO_DOROBIT.md](../reports/CO_DOROBIT.md) |
| Prevádzka | [OPERATIONS.md](./OPERATIONS.md) |
| Firma / IBAN | [vzorfirma.md](./vzorfirma.md) |
| SuperFaktúra detail | [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) |
| SuperFaktúra majiteľ (2a–2k) | [../majitel.md](../majitel.md#2-superfaktúra--automatické-faktúry) |
| SuperFaktúra API pattern | [reference/superfaktura-api-pattern.md](./reference/superfaktura-api-pattern.md) |
| Shopify Admin (legacy) | [../storefront/docs/poznamky.md](../storefront/docs/poznamky.md) |
| Deploy checklist | [../PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) |
| Lokálne secrets (gitignored) | `wordpress-production.local.env`, `storefront/.env.local` |

**CMS admin:** https://cms.growmedica.cz/wp-admin  
**E-shop:** https://www.growmedica.cz  

---

## Prehľad (aktualizované 2026-07-18)

| Integrácia | Plugin na cms | Stav | Čaká na teba |
|------------|---------------|------|----------------|
| **SuperFaktúra** (faktúry) | SuperFaktúra WooCommerce **1.53.2** ✅ | defaults + skripty ✅ · api_* ⏳ · [verify report](../reports/SUPERFAKTURA_GO_LIVE_VERIFY.md) | Registrácia + API (**majitel 2a–2j**) |
| **Stripe** (debetná/kreditná karta) | WooCommerce Stripe Gateway ✅ | brána **off** | publishable + secret (test/live) |
| **GoPay** | gopay-gateway ✅ | brána **off** | merchant ID + client credentials |
| **Packeta** | Packeta **2.3.1** ✅ | flat rate OK · mapa API ❌ | API password + odosielateľ |
| **DPD** | DPD pre WooCommerce **8.5.0** ✅ | flat rate OK · parcelshop API ❌ | API zmluva / credentials |
| **BACS** (prevod) | core Woo | ✅ live | — (IBAN v [vzorfirma.md](./vzorfirma.md)) |
| **COD** (dobierka) | core Woo | ✅ live | — |
| SMTP | FluentSMTP ✅ | ✅ | rotácia hesla len pri 535 |

Shop **už predáva** cez BACS + COD bez položiek vyššie.

---

## 1. SuperFaktúra (PDF faktúry / proforma)

**Prečo:** automatické doklady z Woo objednávok.  
**Detail:** [SUPERFAKTURA_SETUP.md](./SUPERFAKTURA_SETUP.md) · API vzor: [reference/superfaktura-api-pattern.md](./reference/superfaktura-api-pattern.md)

### Kroky (ty) — detail s odškrtávacími bodmi

Kompletný ľudský checklist: **[majitel.md §2 — body 2a–2k](../majitel.md#2-superfaktúra--automatické-faktúry)**.

Skrátene:

1. **Zaregistruj / prihlás** účet: https://moja.superfaktura.sk/ (firma GrowMedica s.r.o.; Premium/trial s API).  
2. **Nástroje → API** — API e-mail, API key, Company ID.  
3. CMS SuperFaktúra tab → Version SK, Sandbox off → Uložiť → **Test API**.  
4. Napíš agentovi „API vložené, otestuj“.

### Agent po tvojom kroku

- Overí `GET /wp-json/growmedica/v1/sf-status` (`api_key_set: true`)
- `./scripts/smoke-superfaktura-30.sh` (30× full green)
- `./scripts/smoke-superfaktura-bacs-order.sh` (on-hold→proforma, processing→faktúra)
- Voliteľne: `SUPERFAKTURA_API_*` v local env → `./scripts/set-superfaktura-api-from-env.sh`
- Reinstall defaults: `./scripts/install-superfaktura-cms.sh`

### Už nastavené agentom

- Plugin active 1.53.2  
- BACS: proforma `on-hold` → faktúra `processing` (paid)  
- COD: faktúra `processing` (nie paid)  
- Firemné polia na checkoute, retry API, prevent concurrency  
- Infra smoke 30/30 (`ALLOW_WITHOUT_API=1`) — full green čaká na API  

**Nikdy:** API key do gitu / Vercel / chatu v plain commit.

---

## 2. Stripe (debetná / kreditná karta)

**Prečo:** kartové platby na cms checkout.  
**Plugin:** WooCommerce Stripe Gateway (active, brána disabled).

### Kroky (ty)

1. https://dashboard.stripe.com/ → Developers → API keys  
2. Skopíruj **Publishable key** + **Secret key** (najprv **test**, potom live)  
3. CMS: **WooCommerce → Settings → Payments → Stripe**  
   (alebo Stripe menu podľa verzie pluginu)  
4. Vlož kľúče, zapni test mode, ulož, zapni payment method.  
5. (Voliteľne) webhook endpoint z pluginu → Stripe Dashboard → Webhooks.

### Agent po tvojom kroku

- Overí `payment_gateways` REST (`stripe.enabled=true`)  
- Smoke test card `4242…` v test mode  
- SuperFaktúra: pravidlo regular invoice pri `processing` + paid pre gateway `stripe`

### Poznámky

- Secret key **nie** do Next/Vercel public env — len Woo/Stripe plugin na cms.  
- Live keys až po úspešnom test mode.

---

## 3. GoPay

**Prečo:** alternatívna kartová / online brána (SK/CZ).  
**Plugin:** `gopay-gateway` (active, brána disabled).

### Kroky (ty)

1. Merchant účet GoPay (https://www.gopay.com / partner panel)  
2. Získaj **GoID / client ID / client secret** (podľa UI merchant portálu)  
3. CMS: **WooCommerce → Settings → Payments → GoPay** (alebo nastavenia pluginu)  
4. Ulož + zapni bránu v test/sandbox, potom produkcia.

### Agent po tvojom kroku

- Enable + smoke  
- SuperFaktúra: `prevent_concurrency` už **yes** (duplicity pri return URL)  
- Invoice rule pre `wc_gopay_gateway` / gateway id podľa pluginu

---

## 4. Packeta (Zásielkovňa)

**Prečo:** výber výdajne na mape + podacie API.  
**Plugin:** Packeta 2.3.1 ✅ · flat rate doprava už má cenu; **API mapa ešte nie**.

### Kroky (ty)

1. Účet https://client.packeta.com/ (alebo partner portál)  
2. **API heslo** + údaje **odosielateľa** (meno, adresa, telefón)  
3. CMS: **WooCommerce → Settings → Packeta** (alebo Packeta menu)  
4. Ulož API password, odosielateľa, zapni widget/mapu na checkoute.

### Agent po tvojom kroku

- Overí nastavenia / test label ak API dovoľuje  
- Checkout smoke: výber packety point  
- Zip záloha (gitignored): `docs/plugins/packeta-2.3.1.zip`

---

## 5. DPD

**Prečo:** parcelshop mapa + labels.  
**Plugin:** DPD pre WooCommerce 8.5.0 ✅ · flat rate cena OK; **API zmluva ešte nie**.

### Kroky (ty)

1. Zmluva DPD + prístup do DPD shipper / API  
2. Credentials podľa pluginu (login, password, delis ID, …)  
3. CMS: nastavenia **DPD pre WooCommerce**  
4. Test spojenia v plugine.

### Agent po tvojom kroku

- Config + smoke  
- Zip: `docs/plugins/wc-dpd-8.5.0.zip`

---

## 6. Ďalšie „ty musíš“ (nie API merchant, ale ľudské)

| Položka | Kam | Agent potom |
|---------|-----|-------------|
| **Telefón** (reálny) | napíš číslo agentovi | `vzorfirma.md` + `storefront/src/lib/company.ts` + deploy |
| **Reálny sklad** | CSV `sku,qty` | bulk stock update Woo |
| **IČ DPH / DPH 20 %** | účtovné rozhodnutie | Woo tax + SuperFaktúra profil |
| **mu-plugins na disk** | SSH / WebSupport | skopírovať `wordpress/mu-plugins/*.php` (alebo snippety už na cms) |
| **Shopify Admin** (rollback/Nexus) | Client ID/Secret | [poznamky-agent.md](../storefront/docs/poznamky-agent.md) |

---

## Ako poslať credentials agentovi (bezpečne)

| ✅ OK | ❌ NIE |
|------|--------|
| Vložiť priamo do **cms wp-admin** a napísať „hotovo, otestuj“ | Commit do gitu |
| Dočasne do **chatu** len na setup, potom rotovať ak treba | Vercel `NEXT_PUBLIC_*` |
| Gitignored `wordpress-production.local.env` (ops mirror) | Screenshot s plným key v PR |
| Stripe **test** keys najprv | Miešať live keys do testu |

Po úspešnom setup **neukladaj** merchant secrets do README, STATUS ani OPERATIONS.

---

## Rýchly checklist (majiteľ)

```
[ ] SuperFaktúra 2a–2j (majitel.md) + Test connection → agent „API vložené“
[ ] Stripe test keys → enable → test card
[ ] (voliteľne) Stripe live
[ ] (voliteľne) GoPay
[ ] Packeta API + odosielateľ
[ ] DPD API
[ ] Telefón na web
[ ] Sklad CSV
```

Poradie odporúčané: **SuperFaktúra → Stripe test → Packeta → DPD → live karty**.

---

## Overenie statusov (agent / ty s App Password)

```bash
# SuperFaktúra (bez odhalenia secretov)
curl -sS -u "$WORDPRESS_ADMIN_USER:$WORDPRESS_APP_PASSWORD" \
  'https://cms.growmedica.cz/wp-json/growmedica/v1/sf-status' | python3 -m json.tool

# Platobné brány
# (Woo REST ck/cs) GET /wp-json/wc/v3/payment_gateways
```

---

*Jediný „AI handoff“ hub pre Packeta / kartu / SuperFaktúru / GoPay / DPD.  
Aktualizované: 2026-07-17*
