/**
 * Generates category-coverage.json from docs/products_export_shopify.zip
 * Run: node scripts/generate-category-coverage-fixture.mjs
 */

import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const storefrontRoot = join(__dirname, '..')
const pyScript = join(__dirname, 'generate-category-coverage-fixture.py')

execFileSync('python3', [pyScript], { stdio: 'inherit', cwd: storefrontRoot })
