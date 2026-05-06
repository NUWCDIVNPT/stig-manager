import { computed } from 'vue'

// Returns the set of visible column keys for the AggregatedFindingsGrid based on:
//   - aggregator: 'groupId' | 'ruleId' | 'cci'
//   - isAllStigsMode: when true, the STIGs column is shown (otherwise scope is implicit)
// Both inputs are Refs.
export function useFindingsColumns(aggregator, isAllStigsMode) {
  return computed(() => {
    const set = new Set(['cat', 'assets'])
    switch (aggregator.value) {
      case 'ruleId':
        set.add('rule')
        set.add('title')
        break
      case 'cci':
        set.add('cci')
        set.add('apAcronym')
        set.add('definition')
        break
      case 'groupId':
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
