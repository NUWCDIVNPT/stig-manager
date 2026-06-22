import { computed } from 'vue'
import { FINDINGS_AGGREGATORS } from '../constants.js'

// Returns the set of visible column keys for AggregatedFindingsGrid given:
//   - aggregator: 'groupId' | 'ruleId' | 'cci' — controls which identifier
//     columns appear (Group / Rule / CCI + AP Acronym + Definition)
//   - isAllStigsMode: when true, adds the per-row STIGs column so the user can
//     see which STIG(s) contribute to each aggregated row. When scoped to a
//     single STIG the column is redundant (the scope is implicit).
// Both inputs are Refs.
export function useFindingsColumns(aggregator, isAllStigsMode) {
  return computed(() => {
    const set = new Set(['cat', 'assets'])
    switch (aggregator.value) {
      case FINDINGS_AGGREGATORS.RULE:
        set.add('rule')
        set.add('title')
        break
      case FINDINGS_AGGREGATORS.CCI:
        // No CAT column: CCIs do not have severities themselves (only the
        // rules that map to them do), and the API's cci aggregation returns
        // no severity field. Matches the legacy client.
        set.delete('cat')
        set.add('cci')
        set.add('apAcronym')
        set.add('definition')
        break
      case FINDINGS_AGGREGATORS.GROUP:
      default:
        set.add('group')
        set.add('title')
        break
    }
    if (isAllStigsMode.value) {
      set.add('stigs')
    }
    return set
  })
}
