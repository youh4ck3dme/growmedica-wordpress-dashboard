#!/usr/bin/env bash
# Idempotently ensure GrowMedica authorized domains are present on Firebase Auth.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=_env.sh
source "${SCRIPT_DIR}/_env.sh"

REQUIRED_DOMAINS=(
  "localhost"
  "growmedica.cz"
  "www.growmedica.cz"
  "growmedicanextjs.vercel.app"
  "growmedica-nexus.lovable.app"
  "grow.nexify-studio.tech"
  "growmedica.nexify-studio.tech"
)

echo "=== ensure authorized domains on ${PROJECT_ID} ==="
CFG="$(identity_toolkit_get_config)"
MERGED="$(python3 - "$CFG" "${REQUIRED_DOMAINS[@]}" <<'PY'
import json, sys
cfg = json.loads(sys.argv[1])
required = sys.argv[2:]
existing = list(cfg.get("authorizedDomains") or [])
seen = set(existing)
added = []
for d in required:
    if d not in seen:
        existing.append(d)
        seen.add(d)
        added.append(d)
print(json.dumps({"authorizedDomains": existing, "_added": added}))
PY
)"

ADDED="$(python3 -c 'import json,sys; print(",".join(json.loads(sys.argv[1]).get("_added") or []))' "$MERGED")"
DOMAINS_JSON="$(python3 -c 'import json,sys; d=json.loads(sys.argv[1]); print(json.dumps({"authorizedDomains": d["authorizedDomains"]}))' "$MERGED")"

if [[ -z "$ADDED" ]]; then
  echo "All required domains already present."
  python3 -c 'import json,sys; [print(" -", d) for d in json.loads(sys.argv[1])["authorizedDomains"]]' "$MERGED"
  exit 0
fi

echo "Adding: ${ADDED}"
RESULT="$(identity_toolkit_patch_config "authorizedDomains" "$DOMAINS_JSON")"
python3 -c 'import json,sys; cfg=json.loads(sys.argv[1]); print("authorizedDomains now:");
[print(" -", d) for d in cfg.get("authorizedDomains") or []]' "$RESULT"
echo "OK"
