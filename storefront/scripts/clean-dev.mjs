#!/usr/bin/env node
/**
 * Revive local Next.js runtime:
 * 1) free ports 5555 + 5557
 * 2) delete .next / .next-playwright caches
 * 3) start a single `next dev` on 5555
 *
 * Usage: yarn clean:dev
 * Then hard-refresh the browser (Cmd+Shift+R).
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const storefrontDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ensurePortScript = path.join(storefrontDir, 'scripts', 'ensure-dev-port.mjs')
const ports = ['5555', '5557']
const cacheDirs = ['.next', '.next-playwright']

function log(step, message) {
  console.log(`[clean:dev] ${step} ${message}`)
}

for (const port of ports) {
  const result = spawnSync(process.execPath, [ensurePortScript, port], {
    cwd: storefrontDir,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    console.error(`[clean:dev] failed freeing port ${port}`)
    process.exit(result.status ?? 1)
  }
  log('✓', `port ${port} freed`)
}

for (const dirName of cacheDirs) {
  const fullPath = path.join(storefrontDir, dirName)
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true })
    log('✓', `removed ${dirName}`)
  } else {
    log('·', `${dirName} already absent`)
  }
}

log('→', 'starting next dev on http://localhost:5555')
log('→', 'after Ready: hard-refresh browser (Cmd+Shift+R)')

const nextBin = path.join(storefrontDir, 'node_modules', '.bin', 'next')
const child = spawn(nextBin, ['dev', '--port', '5555'], {
  cwd: storefrontDir,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
