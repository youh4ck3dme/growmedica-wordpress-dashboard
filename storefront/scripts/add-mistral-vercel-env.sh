#!/bin/bash
set -euo pipefail

# Push Mistral AI env vars to Vercel (never commit real values).
# Usage:
#   MISTRAL_API_KEY=... MISTRAL_API_KEY_BACKUP=... ./scripts/add-mistral-vercel-env.sh
# Optional:
#   VERCEL_SCOPE=h4ck3d VERCEL_PROJECT=growmedicanextjs VERCEL_TOKEN=...

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERCEL_SCOPE="${VERCEL_SCOPE:-h4ck3d}"
VERCEL_PROJECT="${VERCEL_PROJECT:-growmedicanextjs}"
ENVIRONMENTS=(production development)

MISTRAL_API_KEY="${MISTRAL_API_KEY:-}"
MISTRAL_API_KEY_BACKUP="${MISTRAL_API_KEY_BACKUP:-}"
MISTRAL_MODEL="${MISTRAL_MODEL:-mistral-large-latest}"

echo "===================================================="
echo "Configure Mistral env vars on Vercel"
echo "Project: ${VERCEL_SCOPE}/${VERCEL_PROJECT}"
echo "===================================================="

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: Vercel CLI is not installed."
  echo "Install with: npm install -g vercel"
  exit 1
fi

if [[ -z "$MISTRAL_API_KEY" ]]; then
  echo "ERROR: Missing MISTRAL_API_KEY"
  exit 1
fi

if [[ -z "$MISTRAL_API_KEY_BACKUP" ]]; then
  echo "ERROR: Missing MISTRAL_API_KEY_BACKUP"
  exit 1
fi

cd "$STOREFRONT_DIR"

vercel_args=(--scope "$VERCEL_SCOPE" --non-interactive)
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  vercel_args+=(--token "$VERCEL_TOKEN")
fi

if [[ ! -f .vercel/project.json ]]; then
  vercel link --yes --project "$VERCEL_PROJECT" "${vercel_args[@]}"
fi

remove_env_var() {
  local name=$1
  local target=$2

  if vercel env rm "$name" "$target" --yes "${vercel_args[@]}" 2>/dev/null; then
    echo "  - Removed stale $name from $target"
  fi
}

upsert_env_var() {
  local name=$1
  local value=$2
  local target=$3

  remove_env_var "$name" "$target"
  timeout 60 vercel env add "$name" "$target" --value "$value" --yes "${vercel_args[@]}"
  echo "  - Added $name to $target"
}

disable_mock_mode() {
  local target=$1
  vercel env rm MISTRAL_MOCK_MODE "$target" --yes "${vercel_args[@]}" 2>/dev/null || true
}

upsert_preview_via_api() {
  node <<'NODE'
const fs = require('fs');
const token = process.env.VERCEL_TOKEN || JSON.parse(
  fs.readFileSync(require('os').homedir() + '/.local/share/com.vercel.cli/auth.json', 'utf8'),
).token;
const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
const teamId = project.orgId;
const projectId = project.projectId;
const vars = [
  ['MISTRAL_API_KEY', process.env.MISTRAL_API_KEY],
  ['MISTRAL_API_KEY_BACKUP', process.env.MISTRAL_API_KEY_BACKUP],
  ['MISTRAL_MODEL', process.env.MISTRAL_MODEL || 'mistral-large-latest'],
];

async function upsert(key, value) {
  const list = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env?teamId=${teamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const existing = (list.envs || []).find((entry) => entry.key === key && entry.target?.includes('preview'));
  if (existing) {
    await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}?teamId=${teamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value, type: 'encrypted', target: ['preview'] }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${key}/preview: ${res.status} ${JSON.stringify(body)}`);
  console.log(`  - Added ${key} to preview`);
}

(async () => {
  for (const [key, value] of vars) {
    await upsert(key, value);
  }
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
NODE
}

for target in "${ENVIRONMENTS[@]}"; do
  echo "Setting production/development vars for $target..."
  upsert_env_var "MISTRAL_API_KEY" "$MISTRAL_API_KEY" "$target"
  upsert_env_var "MISTRAL_API_KEY_BACKUP" "$MISTRAL_API_KEY_BACKUP" "$target"
  upsert_env_var "MISTRAL_MODEL" "$MISTRAL_MODEL" "$target"
  disable_mock_mode "$target"
done

echo "Setting preview vars via Vercel API..."
MISTRAL_API_KEY="$MISTRAL_API_KEY" \
MISTRAL_API_KEY_BACKUP="$MISTRAL_API_KEY_BACKUP" \
MISTRAL_MODEL="$MISTRAL_MODEL" \
upsert_preview_via_api

echo "===================================================="
echo "Done. Verify with:"
echo "  vercel env ls production --scope ${VERCEL_SCOPE}"
echo "  vercel env ls preview --scope ${VERCEL_SCOPE}"
echo "Then redeploy preview/production so new env vars apply."
echo "===================================================="
