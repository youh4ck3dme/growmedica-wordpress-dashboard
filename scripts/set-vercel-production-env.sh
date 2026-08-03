#!/usr/bin/env bash
# Upsert GrowMedica Production (+ Preview) env vars on Vercel via API.
#
# Usage:
#   ./scripts/set-vercel-production-env.sh
#
# Optional:
#   VERCEL_TOKEN=...              # else reads ~/Library/Application Support/com.vercel.cli/auth.json
#   VERCEL_TEAM_ID=team_...       # default: from storefront/.vercel/project.json orgId
#   VERCEL_PROJECT_ID=prj_...     # default: from storefront/.vercel/project.json projectId
#   VERCEL_ENV_FILE=docs/VERCEL_PRODUCTION_ENV_VALUES.txt
#   TARGETS=production,preview    # comma-separated
#
# Requires: curl, python3

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${VERCEL_ENV_FILE:-$ROOT/docs/VERCEL_PRODUCTION_ENV_VALUES.txt}"
PROJECT_JSON="${VERCEL_PROJECT_JSON:-$ROOT/storefront/.vercel/project.json}"
TARGETS_CSV="${TARGETS:-production,preview}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: missing $ENV_FILE — generate it first"
  exit 1
fi

python3 - "$ROOT" "$ENV_FILE" "$PROJECT_JSON" "$TARGETS_CSV" <<'PY'
import json, os, sys, urllib.request, urllib.error
from pathlib import Path

root, env_file, project_json, targets_csv = sys.argv[1:5]
targets = [t.strip() for t in targets_csv.split(",") if t.strip()]

# token
token = os.environ.get("VERCEL_TOKEN", "").strip()
if not token:
    auth_path = Path.home() / "Library/Application Support/com.vercel.cli/auth.json"
    if auth_path.exists():
        token = json.loads(auth_path.read_text()).get("token", "")
if not token:
    print("ERROR: no VERCEL_TOKEN and no CLI auth.json — run: vercel login")
    sys.exit(1)

# project / team
pj = json.loads(Path(project_json).read_text()) if Path(project_json).exists() else {}
team_id = os.environ.get("VERCEL_TEAM_ID", "").strip() or pj.get("orgId", "")
project_id = os.environ.get("VERCEL_PROJECT_ID", "").strip() or pj.get("projectId", "")
if not team_id or not project_id:
    print("ERROR: set VERCEL_TEAM_ID and VERCEL_PROJECT_ID (or link storefront/.vercel/project.json)")
    sys.exit(1)

# values: prefer COPY-PASTE block, else KEY=VALUE lines
raw = Path(env_file).read_text()
wanted = {}
in_block = False
for line in raw.splitlines():
    s = line.strip()
    if s.startswith("========== COPY-PASTE") or s.startswith("────") and "COPY-PASTE" in s:
        in_block = True
        continue
    if s.startswith("POVINNÉ") or "POVINNÉ — Production" in s:
        in_block = True
        continue
    if s.startswith("────") and in_block and wanted:
        # end of first values section after we collected
        pass
    if not s or s.startswith("#") or s.startswith("⚠️") or s.startswith("Kam") or s.startswith("Vygener") or s.startswith("Environment") or s.startswith("Po ") or s.startswith("Súbor") or s.startswith("Zdroje") or s.startswith("POZNÁM"):
        continue
    if s.startswith("NEXT_PUBLIC_GTM_ID=") and not s.split("=",1)[1].strip():
        continue
    if "=" in s and not s.startswith(" "):
        k, v = s.split("=", 1)
        k, v = k.strip(), v.strip()
        if k and v and not k.startswith("#"):
            wanted[k] = v

# harden production site URL
if wanted.get("NEXT_PUBLIC_SITE_URL", "").startswith("http://localhost"):
    wanted["NEXT_PUBLIC_SITE_URL"] = "https://www.growmedica.cz"

# required keys for this script
keys = [
    "WORDPRESS_BASE_URL",
    "WOO_CONSUMER_KEY",
    "WOO_CONSUMER_SECRET",
    "WORDPRESS_REVALIDATION_SECRET",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_DASHBOARD_MODE",
    "NEXT_PUBLIC_DASHBOARD_URL",
    "SITE_NOINDEX",
    "NEXT_PUBLIC_HIDE_THEME_SWITCHER",
    "NEXT_PUBLIC_DEFAULT_LOCALE",
]
missing = [k for k in keys if k not in wanted]
if missing:
    print("ERROR: missing keys in env file:", ", ".join(missing))
    sys.exit(1)

print(f"Project: {project_id}")
print(f"Team:    {team_id}")
print(f"Targets: {targets}")
print(f"Keys:    {len(keys)}")

def api(method, path, payload=None):
    url = f"https://api.vercel.com{path}"
    sep = "&" if "?" in path else "?"
    url = f"{url}{sep}teamId={team_id}"
    data = None
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "growmedica-set-vercel-env",
    }
    if payload is not None:
        data = json.dumps(payload).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read().decode()
            return r.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(body) if body else {}
        except Exception:
            parsed = {"raw": body[:500]}
        return e.code, parsed

# probe access
st, probe = api("GET", f"/v9/projects/{project_id}")
if st == 403 or (isinstance(probe, dict) and probe.get("error", {}).get("code") == "forbidden"):
    print("ERROR: Not authorized for this team/project.")
    print("  Current CLI account cannot access h4ck3d.")
    print("  Fix: vercel logout && vercel login  (account with team h4ck3d)")
    print("  Or:  VERCEL_TOKEN=<token with h4ck3d access> ./scripts/set-vercel-production-env.sh")
    print("  API:", probe)
    sys.exit(2)
if st >= 400:
    print("ERROR: cannot read project", st, probe)
    sys.exit(2)
print("OK access:", probe.get("name"))

# list existing envs
st, env_list = api("GET", f"/v9/projects/{project_id}/env")
if st >= 400:
    print("ERROR: cannot list env", st, env_list)
    sys.exit(2)
envs = env_list.get("envs") or []

def find_env(key, target):
    for e in envs:
        t = e.get("target") or []
        if e.get("key") == key and target in t:
            # prefer exact single-target rows for clean updates
            return e
    # fallback: multi-target containing this target
    for e in envs:
        t = e.get("target") or []
        if e.get("key") == key and target in t:
            return e
    return None

# Secrets stay sensitive; public/config can be encrypted.
SENSITIVE_KEYS = {
    "WOO_CONSUMER_KEY",
    "WOO_CONSUMER_SECRET",
    "WORDPRESS_REVALIDATION_SECRET",
}

created = updated = 0
patched_ids = set()

for key in keys:
    value = wanted[key]
    for target in targets:
        candidates = [e for e in envs if e.get("key") == key and target in (e.get("target") or [])]
        exact = [e for e in candidates if e.get("target") == [target]]
        existing = exact[0] if exact else (candidates[0] if candidates else None)

        if existing:
            eid = existing["id"]
            if eid in patched_ids:
                print(f"skip   {key} [{target}] (already patched multi-target row)")
                continue
            # Never change type: sensitive ↔ encrypted is rejected by Vercel API.
            env_type = existing.get("type") or (
                "sensitive" if key in SENSITIVE_KEYS else "encrypted"
            )
            payload = {"value": value, "target": existing.get("target") or [target]}
            # Only send type when creating; on PATCH omit type to avoid BAD_REQUEST.
            st, res = api(
                "PATCH",
                f"/v9/projects/{project_id}/env/{eid}",
                payload,
            )
            if st >= 400:
                # Fallback: delete + recreate with same type (cannot change sensitive→encrypted)
                print(f"warn  PATCH {key} [{target}] -> {st} {res}; recreate with type={env_type}")
                st_del, res_del = api("DELETE", f"/v9/projects/{project_id}/env/{eid}")
                if st_del >= 400:
                    print(f"FAIL  delete {key} [{target}] -> {st_del} {res_del}")
                    sys.exit(3)
                envs = [e for e in envs if e.get("id") != eid]
                st, res = api(
                    "POST",
                    f"/v9/projects/{project_id}/env",
                    {
                        "key": key,
                        "value": value,
                        "type": env_type,
                        "target": existing.get("target") or [target],
                    },
                )
                if st >= 400:
                    print(f"FAIL  recreate {key} [{target}] -> {st} {res}")
                    sys.exit(3)
                print(f"recreate {key} target={existing.get('target')} type={env_type}")
                created += 1
                if isinstance(res, dict) and res.get("id"):
                    envs.append(res)
                    patched_ids.add(res["id"])
            else:
                print(f"update {key} target={existing.get('target')} type={env_type} ({target})")
                updated += 1
                patched_ids.add(eid)
        else:
            env_type = "sensitive" if key in SENSITIVE_KEYS else "encrypted"
            st, res = api(
                "POST",
                f"/v9/projects/{project_id}/env",
                {
                    "key": key,
                    "value": value,
                    "type": env_type,
                    "target": [target],
                },
            )
            if st >= 400:
                print(f"FAIL  create {key} [{target}] -> {st} {res}")
                sys.exit(3)
            print(f"create {key} target=[{target}] type={env_type}")
            created += 1
            if isinstance(res, dict) and res.get("id"):
                envs.append(res)
                patched_ids.add(res["id"])

print(f"DONE created={created} updated={updated}")
print("Next: Redeploy Production on Vercel (Deployments → … → Redeploy)")
PY
