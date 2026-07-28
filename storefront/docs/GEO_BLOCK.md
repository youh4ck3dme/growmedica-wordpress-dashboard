# GeoIP country blocking (Singapore / SG)

**Aktualizované:** 21. júl 2026  
**Scope:** globálny HTTP traffic na Next.js storefront (stránky + `/api/*` + `/dashboard`)

## Čo to robí

Keď je zapnuté, middleware vráti **HTTP 403 Forbidden** pre requesty z krajín v zozname (default: **SG** — Singapur).

- GeoIP **nie** je hardcodovaný IP range — používa platform header `x-vercel-ip-country` (Vercel Edge).
- Alternatíva: `cf-ipcountry` (Cloudflare), ak by traffic išiel cez CF.
- Rozhodnutie **neberie** client-forged `X-Forwarded-For` / falošné country headery.

## Zapnutie / vypnutie

| Env | Význam | Default |
|-----|--------|---------|
| `GEO_BLOCK_ENABLED` | `1` / `true` / `on` / `yes` = zapnuté | **vypnuté** |
| `GEO_BLOCK_COUNTRIES` | ISO kódy oddelené čiarkou, napr. `SG` alebo `SG,CN` | `SG` (ak enabled a prázdne) |

### Produkcia (Vercel)

```bash
cd storefront
vercel env add GEO_BLOCK_ENABLED production --scope h4ck3d
# value: 1

vercel env add GEO_BLOCK_COUNTRIES production --scope h4ck3d
# value: SG
```

Alebo Dashboard → Project → Settings → Environment Variables → Production.

Po zmene env **redeploy**.

### Dočasné vypnutie

1. `GEO_BLOCK_ENABLED=0` (alebo odstráň premennú) na Vercel
2. Redeploy  
Alebo len zmeň hodnotu a redeploy — bez zmeny kódu.

### Lokálny dev

Header `x-vercel-ip-country` Vercel lokálne neposiela → block sa typicky nespustí (country unknown → allow).  
Simulácia: pozri Testovanie nižšie.

## Implementácia

| Súbor | Úloha |
|-------|--------|
| `src/lib/geo-block.ts` | Eval, log, 403 response |
| `src/middleware.ts` | `maybeGeoBlock()` ako prvá kontrola; matcher zahŕňa `/api` |

### Log formát (Vercel Runtime Logs)

```json
{
  "level": "warn",
  "event": "geo_block",
  "timestamp": "2026-07-21T12:00:00.000Z",
  "ip": "1.2.3.4",
  "country": "SG",
  "path": "/api/cart",
  "userAgent": "..."
}
```

Body odpovede: plain text `Forbidden` (bez detailov).

## Testovanie

### Unit

```bash
yarn test:unit
# alebo:
node --test tests/unit/geo-block.test.mjs
```

### Simulácia requestu zo SG (lokálne)

```bash
# Zapni block v .env.local:
# GEO_BLOCK_ENABLED=1
# GEO_BLOCK_COUNTRIES=SG

curl -i -H 'x-vercel-ip-country: SG' http://localhost:5555/
# → 403 Forbidden

curl -i -H 'x-vercel-ip-country: SK' http://localhost:5555/
# → 200 (alebo bežná app odpoveď)

# Spoofing X-Forwarded-For NESMIE ovplyvniť rozhodnutie bez trusted country:
curl -i -H 'x-forwarded-for: 1.2.3.4' http://localhost:5555/
# → nie 403 (country unknown)
```

> Poznámka: v produkcii klient **nemôže** nastaviť `x-vercel-ip-country` — Vercel ho prepíše podľa skutočného edge connection IP.

### Produkčný smoke (po deployi)

Z Vercel logs over `event":"geo_block"` pri trafficu zo SG (VPN / cloud instance v Singapore).

## Riziká

| Riziko | Poznámka |
|--------|----------|
| **VPN / proxy** | User v EÚ s VPN exit v SG bude zablokovaný; user v SG s VPN v SK prejde. |
| **False positives** | Mobile carrier / CGNAT môže mať imprecise GeoIP (zriedkavé pre SG vs SK/CZ). |
| **False negatives** | Bez `x-vercel-ip-country` (niektoré edge edge cases) request prejde. |
| **Proxy spoofing** | Client nemôže spoofnúť Vercel geo; `X-Forwarded-For` sa **nepoužíva** na block decision. |
| **Legitimate SG customers** | E-shop zablokuje reálnych zákazníkov zo Singapuru — business trade-off. |
| **WordPress CMS** | Toto pokrýva len Next na Vercel (`growmedica.cz`), nie priamo `cms.growmedica.cz` (WebSupport). CMS chráň WAF / hosting firewall samostatne. |

## Related

- i18n geo: `x-vercel-ip-country` v `src/lib/i18n/detect.ts` (locale, nie block)
- Env šablóna: `.env.example`
- Operations: [../docs/OPERATIONS.md](../../docs/OPERATIONS.md)
