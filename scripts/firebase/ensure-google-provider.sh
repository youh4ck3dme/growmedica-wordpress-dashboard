#!/usr/bin/env bash
# Enable Google as a default supported IdP for Firebase Auth (if disabled/missing).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "${SCRIPT_DIR}/_env.sh"

TOKEN="$(access_token)"
IDP_URL="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/google.com"

echo "=== ensure Google IdP on ${PROJECT_ID} ==="
EXISTING="$(curl -sS \
  "$IDP_URL" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT_ID}" || true)"

if echo "$EXISTING" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("enabled") else 1)' 2>/dev/null; then
  echo "Google IdP already enabled."
  echo "$EXISTING" | python3 -c '
import json,sys
d=json.load(sys.stdin)
if "clientSecret" in d: d["clientSecret"]="***REDACTED***"
if d.get("clientId"):
  c=d["clientId"]; d["clientId"]=c[:20]+"…"+c[-12:] if len(c)>36 else c
print(json.dumps(d, indent=2))
'
  exit 0
fi
# If 404 / not found — create; if exists but disabled — patch enable
if echo "$EXISTING" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("error") else 1)' 2>/dev/null; then
  CODE="$(echo "$EXISTING" | python3 -c 'import json,sys; print((json.load(sys.stdin).get("error") or {}).get("code",""))')"
  echo "Current error response code: ${CODE}"
  echo "Creating google.com defaultSupportedIdpConfig (enabled=true)…"
  curl -fsSL -X POST \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=google.com" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "x-goog-user-project: ${PROJECT_ID}" \
    -H "Content-Type: application/json" \
    -d '{"enabled": true}' \
    | python3 -c '
import json,sys
d=json.load(sys.stdin)
if "clientSecret" in d: d["clientSecret"]="***REDACTED***"
print(json.dumps(d, indent=2))
'
  echo
  echo "NOTE: If create requires OAuth clientId/secret, set them in Firebase Console → Authentication → Sign-in method → Google."
  echo "      Console: https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
  exit 0
fi

echo "Patching Google IdP enabled=true…"
curl -fsSL -X PATCH \
  "${IDP_URL}?updateMask=enabled" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "x-goog-user-project: ${PROJECT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' \
  | python3 -c '
import json,sys
d=json.load(sys.stdin)
if "clientSecret" in d: d["clientSecret"]="***REDACTED***"
print(json.dumps(d, indent=2))
'

echo "OK"
