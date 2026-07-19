# Firebase CLI — GrowMedica Auth ops

**Projekt:** `noorgrowmfinnal-58800798-76fac` (Nexus Google Sign-In)  
**Repo wiring:** [`.firebaserc`](../.firebaserc) · [`firebase.json`](../firebase.json)  
**App kód:** `growmedica-nexus` (`signInWithPopup` + `GoogleAuthProvider`)  
**Deploy checklist:** [storefront/docs/DASHBOARD_DEPLOY.md](../storefront/docs/DASHBOARD_DEPLOY.md)

---

## Toolchain (lokálne v `.tools/`)

Home `~/.config` môže byť na tomto Macu neprístupný pre agent sandbox — preto:

| Tool | Cesta |
|------|--------|
| firebase-tools | `.tools/firebase-cli/node_modules/.bin/firebase` |
| gcloud config + ADC | `.tools/gcloud/` (`CLOUDSDK_CONFIG`) |
| Temurin JDK 21 | `.tools/jdk-21/Contents/Home` (symlink `.tools/jdk-home`) |

Skriptové env: [`scripts/firebase/_env.sh`](../scripts/firebase/_env.sh)

```bash
cd growmedica-wordpress-dashboard
export PATH="$PWD/.tools/firebase-cli/node_modules/.bin:$PATH"
export CLOUDSDK_CONFIG="$PWD/.tools/gcloud"
export GOOGLE_APPLICATION_CREDENTIALS="$CLOUDSDK_CONFIG/application_default_credentials.json"
export JAVA_HOME="$PWD/.tools/jdk-home"
export CI=1   # vypne firebase update-notifier crash
```

Ak chýba ADC:

```bash
cp ~/.config/gcloud/application_default_credentials.json .tools/gcloud/
# alebo: gcloud auth application-default login
```

Ak treba obnoviť firebase-tools:

```bash
cd .tools/firebase-cli && npm install firebase-tools@latest
```

---

## Skripty

```bash
./scripts/firebase/status.sh                 # Google IdP + authorized domains
./scripts/firebase/ensure-auth-domains.sh    # doplní growmedica.cz / www / Vercel / Nexus
./scripts/firebase/ensure-google-provider.sh # zapne Google IdP ak je vypnutý
```

### Authorized domains (očakávané)

- `localhost`
- `growmedica.cz`, `www.growmedica.cz`
- `growmedicanextjs.vercel.app`
- `growmedica-nexus.lovable.app`
- `grow.nexify-studio.tech`, `growmedica.nexify-studio.tech`

---

## Bežné CLI príkazy

```bash
firebase use                    # default = noorgrowmfinnal-58800798-76fac
firebase projects:list
firebase auth:export /tmp/gm-auth.json --format=json   # potrebuje JAVA_HOME
```

Google OAuth client ID/secret (ak Console žiada) sa nastavujú v  
https://console.firebase.google.com/project/noorgrowmfinnal-58800798-76fac/authentication/providers  

**Nekommitovať** API keys, ADC JSON, service account.

---

## Manuálny chown (ak firebase update check padá mimo CI=1)

```bash
sudo chown -R "$(whoami):$(id -gn)" ~/.config/configstore ~/.config/firebase ~/.config/gcloud
```
