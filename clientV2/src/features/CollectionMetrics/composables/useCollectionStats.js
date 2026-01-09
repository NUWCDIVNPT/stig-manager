import { computed, unref } from 'vue'

export function useCollectionStats(metrics) {
  const inventory = computed(() => {
    const m = unref(metrics) //  unref so we can normalize metrics object
    if (!m) {
      return null
    }
    return {
      assets: m.assets,
      stigs: m.stigs,
      checklists: m.checklists,
    }
  })

  const findings = computed(() => {
    const m = unref(metrics)
    if (!m) {
      return null
    }
    // findings are nested in .metrics
    return m.metrics?.findings || m.findings
  })

  const ages = computed(() => {
    const m = unref(metrics)
    if (!m) {
      return null
    }
    // timestamps are nested in .metrics
    const target = m.metrics || m
    return {
      minTs: target.minTs,
      maxTs: target.maxTs,
      maxTouchTs: target.maxTouchTs,
    }
  })

  return {
    inventory,
    findings,
    ages,
  }
}
