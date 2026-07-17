# SMTP setup — cms.growmedica.cz

**Dátum:** 2026-07-16  

## Nasadené

| Komponent | Stav |
|-----------|------|
| FluentSMTP plugin | ✅ active |
| Code Snippet „GrowMedica SMTP Websupport“ | ✅ active |
| Host | `smtp.m1.websupport.sk` |
| Port / security | `465` / SSL |
| User / From | `info@growmedica.cz` |
| From name | GrowMedica s.r.o. |
| WooCommerce email From | info@growmedica.cz |
| Env kópia | `wordpress-production.local.env` (gitignored) |

## Test 2026-07-16

```
SMTP_LOGIN: FAIL 535 authentication failed
```

Heslo z dokumentu **neprešlo** autentifikáciou WebSupport (ani SSL 465, ani STARTTLS 587).

**Akcia pre majiteľa:** v paneli WebSupport reset hesla schránky `info@growmedica.cz`, potom aktualizovať snippet + FluentSMTP + `SMTP_PASS`.

## Po oprave hesla — test

1. Admin → **FluentSMTP** → Send Test Email na svoj inbox  
2. WooCommerce → Nastavenia → E-maily → odošli test (ak dostupné)  
3. Vytvor testovaciu objednávku → skontroluj e-mail zákazníka/admina  
