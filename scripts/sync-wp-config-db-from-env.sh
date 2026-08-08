#!/usr/bin/env bash
# Sync wp-config.php DB_* on WebSupport from wordpress-production.local.env.
#
# Usage:
#   source ./scripts/load-wp-prod-env.sh
#   export WEBSUPPORT_SSH_PASS='…'   # WebSupport → Shell (~60 min)
#   export WEBSUPPORT_SSH_PORT=29267 # from panel
#   ./scripts/sync-wp-config-db-from-env.sh
#
# Requires: expect, DB_* in env, SSH password.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${WEBSUPPORT_SSH_PASS:-}" ]]; then
  echo "ERROR: set WEBSUPPORT_SSH_PASS (WebSupport → Shell password)" >&2
  exit 1
fi

# Load prod env if not already loaded
if [[ -z "${DB_NAME:-}" || -z "${DB_PASSWORD:-}" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT/scripts/load-wp-prod-env.sh"
fi

SSH_HOST="${WEBSUPPORT_SSH_HOST:-shell.r1.websupport.sk}"
SSH_USER="${WEBSUPPORT_SSH_USER:-uid6438887}"
SSH_PORT="${WEBSUPPORT_SSH_PORT:-26728}"
WP_PATH="growmedica.cz/sub/cms"

for var in DB_NAME DB_USER DB_PASSWORD DB_HOST; do
  if [[ -z "${!var:-}" ]]; then
    echo "ERROR: $var not set (source load-wp-prod-env.sh)" >&2
    exit 1
  fi
done

if ! command -v expect >/dev/null; then
  echo "ERROR: need expect (apt install expect)" >&2
  exit 1
fi

export SSH_HOST SSH_USER SSH_PORT SSH_PASS="$WEBSUPPORT_SSH_PASS"
export DB_NAME DB_USER DB_PASSWORD DB_HOST WP_PATH

echo "=== Sync wp-config DB credentials on WebSupport ==="
echo "Host: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "Path: $WP_PATH"

REMOTE_SCRIPT=$(cat <<'REMOTE'
set -e
WP=growmedica.cz/sub/cms
cd "$WP"

echo "Before:"
wp config get DB_NAME
wp config get DB_USER
wp config get DB_HOST

wp config set DB_NAME "$ENV_DB_NAME" --type=constant
wp config set DB_USER "$ENV_DB_USER" --type=constant
wp config set DB_PASSWORD "$ENV_DB_PASSWORD" --type=constant
wp config set DB_HOST "$ENV_DB_HOST" --type=constant

echo "After wp db check:"
wp db check
wp db query "SELECT 1 AS ok"
echo SYNC_DB_DONE
REMOTE
)

export REMOTE_SCRIPT
export ENV_DB_NAME="$DB_NAME" ENV_DB_USER="$DB_USER" ENV_DB_PASSWORD="$DB_PASSWORD" ENV_DB_HOST="$DB_HOST"

expect << 'EOF'
set timeout 180
spawn ssh -o StrictHostKeyChecking=accept-new -p $env(SSH_PORT) $env(SSH_USER)@$env(SSH_HOST)
expect {
  -re "(?i)password:" { send -- "$env(SSH_PASS)\r" }
  timeout { puts "LOGIN_TIMEOUT"; exit 1 }
}
expect {
  -re {\$ $} {}
  -re {Permission denied} { puts "LOGIN_DENIED"; exit 1 }
  timeout { puts "SHELL_TIMEOUT"; exit 1 }
}
send -- "export ENV_DB_NAME='$env(ENV_DB_NAME)'; export ENV_DB_USER='$env(ENV_DB_USER)'; export ENV_DB_PASSWORD='$env(ENV_DB_PASSWORD)'; export ENV_DB_HOST='$env(ENV_DB_HOST)'\r"
send -- "bash -s <<'EOS'\r"
send -- "$env(REMOTE_SCRIPT)\r"
send -- "EOS\r"
expect {
  -re {SYNC_DB_DONE} {}
  timeout { puts "REMOTE_TIMEOUT"; exit 1 }
}
expect -re {\$ $}
send -- "exit\r"
expect eof
EOF

echo ""
echo "=== Public CMS check ==="
curl -sI -m 15 "https://cms.growmedica.cz/wp-json/" | head -5
