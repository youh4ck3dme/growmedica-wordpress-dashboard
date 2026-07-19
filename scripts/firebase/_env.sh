#!/usr/bin/env bash
# Shared env for GrowMedica Firebase / gcloud Auth ops.
# Project: noorgrowmfinnal-58800798-76fac (Nexus Google Sign-In)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TOOLS="${ROOT}/.tools"
PROJECT_ID="${FIREBASE_PROJECT_ID:-noorgrowmfinnal-58800798-76fac}"

export CI=1
export FIREBASE_CLI_DISABLE_UPDATE_CHECK=1
export CLOUDSDK_CONFIG="${CLOUDSDK_CONFIG:-${TOOLS}/gcloud}"
export GOOGLE_APPLICATION_CREDENTIALS="${GOOGLE_APPLICATION_CREDENTIALS:-${CLOUDSDK_CONFIG}/application_default_credentials.json}"

# Temurin macOS layout uses Contents/Home; symlink .tools/jdk-home may exist.
if [[ -z "${JAVA_HOME:-}" ]]; then
  if [[ -x "${TOOLS}/jdk-home/bin/java" ]]; then
    export JAVA_HOME="${TOOLS}/jdk-home"
  elif [[ -x "${TOOLS}/jdk-21/Contents/Home/bin/java" ]]; then
    export JAVA_HOME="${TOOLS}/jdk-21/Contents/Home"
  elif [[ -x "${TOOLS}/jdk-21/bin/java" ]]; then
    export JAVA_HOME="${TOOLS}/jdk-21"
  fi
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

if [[ -x "${TOOLS}/firebase-cli/node_modules/.bin/firebase" ]]; then
  export PATH="${TOOLS}/firebase-cli/node_modules/.bin:${PATH}"
fi

export CLOUDSDK_CORE_PROJECT="${CLOUDSDK_CORE_PROJECT:-${PROJECT_ID}}"

firebase_bin() {
  if command -v firebase >/dev/null 2>&1; then
    command firebase "$@"
  else
    echo "ERROR: firebase CLI not found. Run: cd ${TOOLS}/firebase-cli && npm install firebase-tools" >&2
    exit 1
  fi
}

access_token() {
  if [[ ! -f "${GOOGLE_APPLICATION_CREDENTIALS}" ]]; then
    echo "ERROR: missing ADC at ${GOOGLE_APPLICATION_CREDENTIALS}" >&2
    echo "Copy from ~/.config/gcloud/application_default_credentials.json or run: gcloud auth application-default login" >&2
    exit 1
  fi
  gcloud auth application-default print-access-token
}

identity_toolkit_get_config() {
  local token
  token="$(access_token)"
  curl -fsSL \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config" \
    -H "Authorization: Bearer ${token}" \
    -H "x-goog-user-project: ${PROJECT_ID}"
}

identity_toolkit_patch_config() {
  local update_mask="$1"
  local body="$2"
  local token
  token="$(access_token)"
  curl -fsSL -X PATCH \
    "https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=${update_mask}" \
    -H "Authorization: Bearer ${token}" \
    -H "x-goog-user-project: ${PROJECT_ID}" \
    -H "Content-Type: application/json" \
    -d "${body}"
}
