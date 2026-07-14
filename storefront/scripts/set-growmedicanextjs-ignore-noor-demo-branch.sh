#!/bin/bash
set -euo pipefail

# Configure Ignored Build Step on growmedicanextjs so feat/noor-production-demo
# does not create Preview deploys on the main Vercel project.
#
# NOOR demo production stays on growmedica-noor-demo (unchanged).
#
# Usage:
#   cd storefront
#   VERCEL_TOKEN=xxx ./scripts/set-growmedicanextjs-ignore-noor-demo-branch.sh
#
# Optional:
#   VERCEL_SCOPE=h4ck3d VERCEL_PROJECT=growmedicanextjs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOREFRONT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VERCEL_SCOPE="${VERCEL_SCOPE:-h4ck3d}"
VERCEL_PROJECT="${VERCEL_PROJECT:-growmedicanextjs}"
IGNORE_COMMAND='bash scripts/vercel-skip-noor-demo-on-main-project.sh'

echo "===================================================="
echo "Set Ignored Build Step on ${VERCEL_SCOPE}/${VERCEL_PROJECT}"
echo "Skips branch: feat/noor-production-demo"
echo "Does NOT touch: growmedica-noor-demo"
echo "===================================================="

cd "$STOREFRONT_DIR"

export IGNORE_COMMAND VERCEL_SCOPE VERCEL_PROJECT

node <<'NODE'
const fs = require('fs');
const os = require('os');

function readToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const authPath = os.homedir() + '/.local/share/com.vercel.cli/auth.json';
  if (fs.existsSync(authPath)) {
    return JSON.parse(fs.readFileSync(authPath, 'utf8')).token;
  }
  throw new Error(
    'Missing Vercel auth. Set VERCEL_TOKEN or run vercel login, then retry.',
  );
}

const scope = process.env.VERCEL_SCOPE || 'h4ck3d';
const projectName = process.env.VERCEL_PROJECT || 'growmedicanextjs';
const ignoreCommand = process.env.IGNORE_COMMAND;

(async () => {
  const token = readToken();

  const teams = await fetch('https://api.vercel.com/v2/teams', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  const team = (teams.teams || []).find((entry) => entry.slug === scope || entry.name === scope);
  if (!team) throw new Error(`Team not found: ${scope}`);

  const project = await fetch(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(projectName)}?teamId=${team.id}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());

  if (!project.id) throw new Error(`Project not found: ${projectName}`);

  if (projectName === 'growmedica-noor-demo') {
    throw new Error('Refusing to set ignore step on growmedica-noor-demo — demo must build feat/noor-production-demo');
  }

  const res = await fetch(
    `https://api.vercel.com/v9/projects/${project.id}?teamId=${team.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commandForIgnoringBuildStep: ignoreCommand }),
    },
  );
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`PATCH failed: ${res.status} ${JSON.stringify(body)}`);
  }

  console.log('Updated commandForIgnoringBuildStep:');
  console.log(`  ${body.commandForIgnoringBuildStep || ignoreCommand}`);
  console.log('');
  console.log('Verify in dashboard:');
  console.log(`  Vercel → ${projectName} → Settings → Git → Ignored Build Step`);
})().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
NODE

echo "===================================================="
