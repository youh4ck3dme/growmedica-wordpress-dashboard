#!/usr/bin/env bash
# Show Firebase Auth config: Google provider + authorized domains.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "${SCRIPT_DIR}/_env.sh"

echo "=== Firebase / Auth status ==="
echo "project: ${PROJECT_ID}"
echo "CLOUDSDK_CONFIG: ${CLOUDSDK_CONFIG}"
echo "JAVA_HOME: ${JAVA_HOME:-"(not set)"}"
if command -v java >/dev/null 2>&1; then
  java -version 2>&1 | head -1
else
  echo "java: MISSING (auth:export needs JDK)"
fi

echo
echo "=== firebase login ==="
firebase_bin login:list 2>&1 | grep -v 'update check' | grep -v 'unexpected error' || true

echo
echo "=== Identity Toolkit config (Google + domains) ==="
CFG="$(identity_toolkit_get_config)"
python3 - "$CFG" <<'PY'
import json, sys
cfg = json.loads(sys.argv[1])
sign_in = cfg.get("signIn") or {}
providers = (cfg.get("signIn") or {}).get("hashConfig")  # ignore
# IdPs live under signIn.email / anonymous / phone and under idpConfigs sometimes
# Admin v2: authorizedDomains at top level; provider under signIn
print("authorizedDomains:")
for d in cfg.get("authorizedDomains") or []:
    print(f"  - {d}")
email = (sign_in.get("email") or {})
print(f"email.enabled: {email.get('enabled')}")
print(f"anonymous.enabled: {(sign_in.get('anonymous') or {}).get('enabled')}")
# Google is often under defaultSupportedIdpConfigs
idps = cfg.get("defaultSupportedIdpConfigs") or cfg.get("idpConfigs") or []
if isinstance(idps, dict):
    idps = list(idps.values()) if idps else []
# v2 returns nested under name keys when listing separately — check signIn.google too
google = sign_in.get("google") or {}
if google:
    print(f"signIn.google: {json.dumps(google)}")
# Print raw keys for debugging if google missing
if "defaultSupportedIdpConfigs" in cfg:
    print("defaultSupportedIdpConfigs keys:", list((cfg.get("defaultSupportedIdpConfigs") or {}).keys())[:20])
# Also try listing supported IdPs via known field
for key in ("client", "monitoring", "multiTenant", "mfa", "blockingFunctions"):
    pass
print()
print("signIn keys:", sorted(sign_in.keys()))
print("top-level keys:", sorted(cfg.keys()))
PY

echo
echo "=== Google IdP (defaultSupportedIdpConfigs/google.com) ==="
TOKEN="$(access_token)"
curl -fsSL \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT_ID}" \
  | python3 -c '
import json,sys
d=json.load(sys.stdin)
if "clientSecret" in d:
  d["clientSecret"]="***REDACTED***"
if "clientId" in d and d["clientId"]:
  cid=d["clientId"]
  d["clientId"]=cid[:20]+"…"+cid[-12:] if len(cid)>36 else cid
print(json.dumps(d, indent=2))
' 2>/dev/null || echo "(google.com IdP config not readable — may need enable)"
