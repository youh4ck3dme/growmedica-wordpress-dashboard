/**
 * Unit tests for dashboard agent mode constraints + prompt safety.
 * Pure mirror of src/lib/dashboard-agent/modeConstraints.ts + types helpers
 * (Node --test cannot resolve TS path/extension graph for orchestrator).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const WRITE_TOOLS = new Set([
  'bulk_update_prices',
  'apply_product_copy',
  'apply_product_seo',
  'update_inventory',
])

const AGENT_MODES = ['assist', 'plan', 'monitor']

function isAgentMode(value) {
  return value === 'assist' || value === 'plan' || value === 'monitor'
}

function isAgentWriteTool(tool) {
  return WRITE_TOOLS.has(tool)
}

function applyModeConstraints(mode, planned) {
  if (mode === 'monitor') {
    return planned.filter((plan) => !isAgentWriteTool(plan.tool))
  }
  if (mode === 'plan') {
    return planned.map((plan) => {
      if (!isAgentWriteTool(plan.tool)) return plan
      return { tool: plan.tool, args: { ...plan.args, confirm: false } }
    })
  }
  return planned
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')

function readSrc(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('source contract: modeConstraints + types', () => {
  it('modeConstraints.ts exports applyModeConstraints with monitor/plan branches', () => {
    const src = readSrc('src/lib/dashboard-agent/modeConstraints.ts')
    assert.match(src, /export function applyModeConstraints/)
    assert.match(src, /mode === 'monitor'/)
    assert.match(src, /mode === 'plan'/)
    assert.match(src, /confirm: false/)
    assert.match(src, /isAgentWriteTool/)
  })

  it('types.ts defines AgentMode and WRITE tools', () => {
    const src = readSrc('src/lib/dashboard-agent/types.ts')
    assert.match(src, /export type AgentMode = 'assist' \| 'plan' \| 'monitor'/)
    assert.match(src, /bulk_update_prices/)
    assert.match(src, /apply_product_copy/)
    assert.match(src, /apply_product_seo/)
    assert.match(src, /update_inventory/)
    assert.match(src, /mode: AgentMode/)
  })

  it('agentOrchestrator uses applyModeConstraints from modeConstraints', () => {
    const src = readSrc('src/lib/dashboard-agent/agentOrchestrator.ts')
    assert.match(src, /from '\.\/modeConstraints'/)
    assert.match(src, /applyModeConstraints\(/)
    assert.match(src, /mode \?\? 'assist'/)
  })

  it('API route accepts mode enum', () => {
    const src = readSrc('src/app/api/dashboard/agent/route.ts')
    assert.match(src, /z\.enum\(\['assist', 'plan', 'monitor'\]\)/)
  })

  it('DashboardShell sends mode and renders mode UI', () => {
    const src = readSrc('src/components/dashboard/agent/DashboardShell.tsx')
    assert.match(src, /mode: agentMode/)
    assert.match(src, /dashboard-agent-mode/)
    assert.match(src, /AGENT_MODES/)
  })

  it('admin prompts never require unconfirmed live writes', () => {
    const src = readSrc('src/lib/dashboard-agent/prompts/admin-agent.ts')
    assert.match(src, /DASHBOARD_ALLOW_LIVE_WRITES/)
    assert.doesNotMatch(src, /NEVYŽADUJ POTVRDENIE/)
    assert.doesNotMatch(src, /VYKONAJ IHNEĎ!/)
    assert.match(src, /ADMIN_AGENT_PLAN_PROMPT/)
    assert.match(src, /ADMIN_AGENT_MONITOR_PROMPT/)
    assert.match(src, /getAdminAgentSystemPrompt/)
  })

  it('autonomous WIP files are gone', () => {
    const gone = [
      'src/components/dashboard/agent/AutonomousDashboardShell.tsx',
      'src/lib/dashboard-agent/autonomousOrchestrator.ts',
      'src/lib/dashboard-agent/prompts/autonomous-shop-manager.ts',
      'src/app/api/dashboard/autonomous/route.ts',
    ]
    for (const rel of gone) {
      try {
        readSrc(rel)
        assert.fail(`expected missing: ${rel}`)
      } catch (err) {
        assert.equal(err.code, 'ENOENT', rel)
      }
    }
  })
})

describe('isAgentMode / isAgentWriteTool', () => {
  it('accepts only known modes', () => {
    for (const mode of AGENT_MODES) assert.equal(isAgentMode(mode), true)
    assert.equal(isAgentMode('full'), false)
    assert.equal(isAgentMode('off'), false)
    assert.equal(isAgentMode(undefined), false)
  })

  it('write tools are the four mutators', () => {
    assert.equal(isAgentWriteTool('bulk_update_prices'), true)
    assert.equal(isAgentWriteTool('apply_product_copy'), true)
    assert.equal(isAgentWriteTool('apply_product_seo'), true)
    assert.equal(isAgentWriteTool('update_inventory'), true)
    assert.equal(isAgentWriteTool('list_products'), false)
    assert.equal(isAgentWriteTool('optimize_product_copy'), false)
  })
})

describe('applyModeConstraints', () => {
  it('assist leaves plans unchanged', () => {
    const planned = [
      { tool: 'list_products', args: {} },
      { tool: 'bulk_update_prices', args: { confirm: true, percent_change: 5 } },
    ]
    assert.deepEqual(applyModeConstraints('assist', planned), planned)
  })

  it('monitor drops all write tools', () => {
    const planned = [
      { tool: 'catalog_summary', args: {} },
      { tool: 'bulk_update_prices', args: { confirm: true } },
      { tool: 'apply_product_copy', args: { confirm: true } },
      { tool: 'apply_product_seo', args: { confirm: true } },
      { tool: 'update_inventory', args: { confirm: true } },
      { tool: 'list_orders', args: {} },
    ]
    const result = applyModeConstraints('monitor', planned)
    assert.deepEqual(
      result.map((p) => p.tool),
      ['catalog_summary', 'list_orders'],
    )
  })

  it('plan forces confirm=false on every write tool', () => {
    const planned = [...WRITE_TOOLS].map((tool) => ({
      tool,
      args: { confirm: true, handle: 'x' },
    }))
    const result = applyModeConstraints('plan', planned)
    assert.equal(result.length, WRITE_TOOLS.size)
    for (const plan of result) {
      assert.equal(plan.args.confirm, false, plan.tool)
    }
  })

  it('plan leaves read tools alone', () => {
    const planned = [{ tool: 'export_catalog_csv', args: { foo: 1 } }]
    assert.deepEqual(applyModeConstraints('plan', planned), planned)
  })
})
