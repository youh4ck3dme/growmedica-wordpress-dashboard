import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const STOREFRONT_ROOT = path.resolve(__dirname, '../..')

const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.vercel\//,
  /^storefront\/\.vercel\//,
  /\/\.vercel\/project\.json$/,
  /\/\.vercel\/repo\.json$/,
]

function gitTrackedFiles(): string[] {
  return execSync('git ls-files', { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

test.describe('Vercel link metadata — must stay out of git', () => {
  test('git index neobsahuje .vercel/project.json ani repo.json', () => {
    const tracked = gitTrackedFiles()
    const leaked = tracked.filter((file) =>
      FORBIDDEN_TRACKED_PATTERNS.some((pattern) => pattern.test(file)),
    )

    expect(
      leaked,
      `Citlivé Vercel súbory sú v indexe: ${leaked.join(', ') || '(none)'}`,
    ).toEqual([])
  })

  test('.gitignore blokuje .vercel/ v koreni aj storefront/', () => {
    const rootIgnore = readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8')
    const storefrontIgnore = readFileSync(path.join(STOREFRONT_ROOT, '.gitignore'), 'utf8')

    expect(rootIgnore).toMatch(/\.vercel\//)
    expect(storefrontIgnore).toMatch(/\.vercel\//)
  })

  test('git history neobsahuje .vercel/project.json ani repo.json', () => {
    let historyHits = ''
    try {
      historyHits = execSync(
        'git log --all --oneline -- .vercel/project.json .vercel/repo.json storefront/.vercel/project.json',
        {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      ).trim()
    } catch {
      historyHits = ''
    }

    expect(historyHits, 'Nájdené commity s .vercel link metadata v histórii').toBe('')
  })
})
