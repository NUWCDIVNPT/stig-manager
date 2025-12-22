import { computed, unref } from 'vue'

export function useCollectionStats(metrics) {
  const inventory = computed(() => {
    const mMetrics = unref(metrics)
    if (!mMetrics) {
      return null
    }
    const m = mMetrics.metrics || mMetrics
    const root = mMetrics
    return {
      assets: root.assets || m.assets || 0,
      stigs: root.stigs || m.stigs || 0,
      checklists: root.checklists || m.checklists || 0,
    }
  })

  const findings = computed(() => {
    const mMetrics = unref(metrics)
    if (!mMetrics) {
      return null
    }
    const m = mMetrics.metrics || mMetrics
    return m.findings || { high: 0, medium: 0, low: 0 }
  })

  const ages = computed(() => {
    const mMetrics = unref(metrics)
    if (!mMetrics) {
      return null
    }
    const m = mMetrics.metrics || mMetrics
    return {
      minTs: m.minTs || 0,
      maxTs: m.maxTs || 0,
      maxTouchTs: m.maxTouchTs || 0,
    }
  })

  return {
    inventory,
    findings,
    ages,
  }
}
