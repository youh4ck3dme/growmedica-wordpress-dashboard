import type { AgentMode, AgentToolName } from './types'
import { isAgentWriteTool } from './types'

/**
 * Enforce agent mode constraints server-side (prompt alone is not enough).
 * - monitor: drop write tools
 * - plan: force confirm=false on write tools (dry-run only)
 * - assist: unchanged (tools still require confirm + DASHBOARD_ALLOW_LIVE_WRITES)
 */
export function applyModeConstraints(
  mode: AgentMode,
  planned: Array<{ tool: AgentToolName; args: Record<string, unknown> }>,
): Array<{ tool: AgentToolName; args: Record<string, unknown> }> {
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
