import { computed, reactive, watch } from 'vue'
import { buildPatchMap, detectChangedFields } from '../../../shared/lib/ruleDiff.js'

/**
 * Revision-pair diff. Joins two rule arrays by rule.version (STIG ID / V-id),
 * detects changed fields per pair, exposes diffRows + a lazy diffDetailFor(key).
 *
 * Phase A (eager): detectChangedFields per joined pair. Cheap string-equality.
 * Phase B (lazy, per selected row): buildPatchMap via diff.createPatch.
 */
export function useRevisionDiff({ benchmarkId, viewRev, compareRev, getRulesForRev }) {
  const state = reactive({
    status: 'idle',
    error: null,
    rows: [],
    rowMap: new Map(),
  })

  const detailCache = new Map()

  let generation = 0

  async function compute() {
    const thisGen = ++generation
    detailCache.clear()

    const bm = benchmarkId.value
    const vRev = viewRev.value
    const cRev = compareRev.value

    if (!bm || !vRev || !cRev) {
      state.status = 'idle'
      state.error = null
      state.rows = []
      state.rowMap = new Map()
      return
    }

    state.status = 'loading'
    state.error = null

    try {
      const [rhsRules, lhsRules] = await Promise.all([
        getRulesForRev(bm, vRev),
        getRulesForRev(bm, cRev),
      ])
      if (thisGen !== generation) {
        return
      }

      const byStigId = new Map()
      for (const rule of lhsRules ?? []) {
        const key = rule.version
        if (!key) {
          continue
        }
        const entry = byStigId.get(key) ?? {}
        entry.lhs = rule
        byStigId.set(key, entry)
      }
      for (const rule of rhsRules ?? []) {
        const key = rule.version
        if (!key) {
          continue
        }
        const entry = byStigId.get(key) ?? {}
        entry.rhs = rule
        byStigId.set(key, entry)
      }

      const rows = []
      for (const [stigId, entry] of byStigId) {
        const { lhs, rhs } = entry
        const changed = detectChangedFields(lhs, rhs)
        const lhsMissing = !lhs
        const rhsMissing = !rhs
        if (!lhsMissing && !rhsMissing && changed.length === 0) {
          continue
        }
        rows.push({
          key: stigId,
          stigId,
          leftRule: lhs?.ruleId ?? '',
          rightRule: rhs?.ruleId ?? '',
          cat: rhs?.severity ?? lhs?.severity ?? null,
          changed: lhsMissing ? ['rule added'] : rhsMissing ? ['rule removed'] : changed,
          _lhs: lhs,
          _rhs: rhs,
        })
      }
      rows.sort((a, b) => a.stigId.localeCompare(b.stigId))

      if (thisGen !== generation) {
        return
      }
      state.rows = rows
      state.rowMap = new Map(rows.map(r => [r.key, r]))
      state.status = 'ready'
    }
    catch (err) {
      if (thisGen !== generation) {
        return
      }
      state.status = 'error'
      state.error = err
      state.rows = []
      state.rowMap = new Map()
    }
  }

  watch([benchmarkId, viewRev, compareRev], compute, { immediate: true })

  function diffDetailFor(key) {
    if (!key) {
      return null
    }
    if (detailCache.has(key)) {
      return detailCache.get(key)
    }
    const row = state.rowMap.get(key)
    if (!row) {
      return null
    }
    const patches = buildPatchMap(row._lhs, row._rhs, row.changed.filter(p => p !== 'rule added' && p !== 'rule removed'))
    detailCache.set(key, patches)
    return patches
  }

  async function retry() {
    await compute()
  }

  const diffRows = computed(() => state.rows)
  const diffStatus = computed(() => state.status)
  const diffError = computed(() => state.error)

  return {
    diffRows,
    diffStatus,
    diffError,
    diffDetailFor,
    retry,
    rowByKey: key => state.rowMap.get(key) ?? null,
  }
}
