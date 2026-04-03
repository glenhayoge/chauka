import type { Activity, Result } from '../api/types'

/**
 * Build a map of result ID → hierarchical dot-notation code (e.g. "1", "1.1", "1.1.2").
 * Codes are derived from the tree structure (parent_id) and sibling order.
 */
export function buildResultCodeMap(results: Result[]): Map<number, string> {
  const codes = new Map<number, string>()

  // Group by parent_id
  const byParent = new Map<number | null, Result[]>()
  for (const r of results) {
    const key = r.parent_id ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(r)
  }

  // Sort each group by order and assign codes recursively
  function assign(parentId: number | null, prefix: string) {
    const children = byParent.get(parentId)
    if (!children) return
    children.sort((a, b) => a.order - b.order)
    children.forEach((child, idx) => {
      const code = prefix ? `${prefix}.${idx + 1}` : String(idx + 1)
      codes.set(child.id, code)
      assign(child.id, code)
    })
  }

  assign(null, '')
  return codes
}

/**
 * Build a map of activity ID → hierarchical code (e.g. "1.1.1.1", "1.1.1.2").
 * Each activity's code is its parent result's code + sequential sibling index.
 */
export function buildActivityCodeMap(
  activities: Activity[],
  resultCodes: Map<number, string>,
): Map<number, string> {
  const codes = new Map<number, string>()

  // Group activities by result_id
  const byResult = new Map<number, Activity[]>()
  for (const a of activities) {
    if (!byResult.has(a.result_id)) byResult.set(a.result_id, [])
    byResult.get(a.result_id)!.push(a)
  }

  for (const [resultId, acts] of byResult) {
    const parentCode = resultCodes.get(resultId) ?? ''
    acts.sort((a, b) => a.order - b.order)
    acts.forEach((act, idx) => {
      codes.set(act.id, parentCode ? `${parentCode}.${idx + 1}` : String(idx + 1))
    })
  }

  return codes
}
