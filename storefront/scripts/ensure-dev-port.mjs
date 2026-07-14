#!/usr/bin/env node
/**
 * Frees a TCP port before Playwright starts `next dev`.
 * Fixes EADDRINUSE when a stale or manual dev server holds the test port.
 */
import { execSync } from 'node:child_process'

const port = process.argv[2] ?? '5557'

function listListeningPids(targetPort) {
  try {
    const output = execSync(`lsof -ti tcp:${targetPort} -sTCP:LISTEN 2>/dev/null || true`, {
      encoding: 'utf8',
    }).trim()

    if (!output) return []

    return output
      .split(/\s+/)
      .map((value) => Number(value))
      .filter((pid) => Number.isFinite(pid) && pid > 0)
  } catch {
    return []
  }
}

for (const pid of listListeningPids(port)) {
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    try {
      process.kill(pid, 'SIGKILL')
    } catch {
      // Process already gone
    }
  }
}

if (listListeningPids(port).length > 0) {
  // Brief pause so the OS releases the port before next dev binds.
  execSync('sleep 0.5')
}
