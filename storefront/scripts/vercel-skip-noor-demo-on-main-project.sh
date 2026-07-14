#!/bin/bash
# Ignored Build Step for Vercel project growmedicanextjs ONLY.
# Do NOT configure this on growmedica-noor-demo (that project must build feat/noor-production-demo).
#
# Vercel semantics: exit 0 = skip deployment, exit 1 = proceed with build.

if [ "$VERCEL_GIT_COMMIT_REF" = "feat/noor-production-demo" ]; then
  echo "Skipping NOOR demo branch on main Vercel project"
  exit 0
fi

exit 1
