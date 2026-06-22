import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useFindingsColumns } from '../composables/useFindingsColumns.js'
import { FINDINGS_AGGREGATORS } from '../constants.js'

function columnsFor(aggregatorValue, allStigs = false) {
  const aggregator = ref(aggregatorValue)
  const isAllStigsMode = ref(allStigs)
  return useFindingsColumns(aggregator, isAllStigsMode).value
}

describe('useFindingsColumns', () => {
  it('shows group identifier columns for the groupId aggregator', () => {
    const cols = columnsFor(FINDINGS_AGGREGATORS.GROUP)
    expect(cols.has('group')).toBe(true)
    expect(cols.has('title')).toBe(true)
    expect(cols.has('cat')).toBe(true)
    expect(cols.has('rule')).toBe(false)
    expect(cols.has('cci')).toBe(false)
  })

  it('shows rule identifier columns for the ruleId aggregator', () => {
    const cols = columnsFor(FINDINGS_AGGREGATORS.RULE)
    expect(cols.has('rule')).toBe(true)
    expect(cols.has('title')).toBe(true)
    expect(cols.has('cat')).toBe(true)
    expect(cols.has('group')).toBe(false)
  })

  it('shows cci columns without CAT for the cci aggregator', () => {
    // CCIs do not have severities themselves and the API's cci aggregation
    // returns no severity field — the CAT column must be hidden.
    const cols = columnsFor(FINDINGS_AGGREGATORS.CCI)
    expect(cols.has('cci')).toBe(true)
    expect(cols.has('apAcronym')).toBe(true)
    expect(cols.has('definition')).toBe(true)
    expect(cols.has('cat')).toBe(false)
  })

  it('adds the STIGs column only in all-STIGs mode', () => {
    expect(columnsFor(FINDINGS_AGGREGATORS.GROUP, true).has('stigs')).toBe(true)
    expect(columnsFor(FINDINGS_AGGREGATORS.GROUP, false).has('stigs')).toBe(false)
  })

  it('reacts to aggregator changes', () => {
    const aggregator = ref(FINDINGS_AGGREGATORS.GROUP)
    const isAllStigsMode = ref(false)
    const cols = useFindingsColumns(aggregator, isAllStigsMode)
    expect(cols.value.has('cat')).toBe(true)
    aggregator.value = FINDINGS_AGGREGATORS.CCI
    expect(cols.value.has('cat')).toBe(false)
    expect(cols.value.has('cci')).toBe(true)
  })
})
