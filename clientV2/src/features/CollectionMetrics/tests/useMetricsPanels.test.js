import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useMetricsPanels } from '../composables/useMetricsPanels.js'
import { EMPTY_METRICS } from '../emptyMetrics.js'

function collectLeaves(value, path = '', out = []) {
  if (value !== null && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      collectLeaves(v, path ? `${path}.${k}` : k, out)
    }
  }
  else {
    out.push([path, value])
  }
  return out
}

describe('useMetricsPanels', () => {
  it('is pending with zeroed, finite panel inputs before the first response', () => {
    const metrics = ref(null)
    const { pending, progressStats, coraData, inventory, findings, ages } = useMetricsPanels(metrics)

    expect(pending.value).toBe(true)
    expect(progressStats.value.counts.total).toBe(0)
    expect(coraData.value.weightedAvg).toBe(0)

    // Guards EMPTY_METRICS drifting from what the composables read
    const leaves = collectLeaves({ progressStats: progressStats.value, coraData: coraData.value, inventory: inventory.value, findings: findings.value, ages: ages.value })
    const bad = leaves.filter(([, v]) => v === undefined || (typeof v === 'number' && !Number.isFinite(v)) || v === 'NaN')
    expect(bad).toEqual([])
  })

  it('reports not pending and derives from the response once it lands', () => {
    const metrics = ref(null)
    const { pending, progressStats } = useMetricsPanels(metrics)

    metrics.value = { ...EMPTY_METRICS, metrics: { ...EMPTY_METRICS.metrics, assessments: 10, assessed: 5 } }

    expect(pending.value).toBe(false)
    expect(progressStats.value.counts.total).toBe(10)
    expect(progressStats.value.formatted.overall).toBe('50.0')
  })
})
