export const FINDINGS_AGGREGATORS = Object.freeze({
  GROUP: 'groupId',
  RULE: 'ruleId',
  CCI: 'cci',
})

export const FINDINGS_AGGREGATOR_VALUES = Object.freeze(
  Object.values(FINDINGS_AGGREGATORS),
)

export const FINDINGS_AGGREGATOR_OPTIONS = Object.freeze([
  { label: 'Group', value: FINDINGS_AGGREGATORS.GROUP },
  { label: 'Rule', value: FINDINGS_AGGREGATORS.RULE },
  { label: 'CCI', value: FINDINGS_AGGREGATORS.CCI },
])
