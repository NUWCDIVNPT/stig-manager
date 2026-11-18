export const FINDINGS_AGGREGATORS = Object.freeze({
  GROUP: 'groupId',
  RULE: 'ruleId',
  CCI: 'cci',
})

export const FINDINGS_AGGREGATOR_VALUES = Object.freeze(
  Object.values(FINDINGS_AGGREGATORS),
)

// Each aggregator's readable value in the URL (?groupBy=rule)
export const FINDINGS_GROUP_BY_PARAM = Object.freeze({
  [FINDINGS_AGGREGATORS.GROUP]: 'group',
  [FINDINGS_AGGREGATORS.RULE]: 'rule',
  [FINDINGS_AGGREGATORS.CCI]: 'cci',
})

export const FINDINGS_AGGREGATOR_OPTIONS = Object.freeze([
  { label: 'Group', value: FINDINGS_AGGREGATORS.GROUP },
  { label: 'Rule', value: FINDINGS_AGGREGATORS.RULE },
  { label: 'CCI', value: FINDINGS_AGGREGATORS.CCI },
])

// POA&M export formats. The server generates the spreadsheet; the client only
// collects a handful of column defaults. Status options are format-specific.
export const POAM_FORMATS = Object.freeze({
  EMASS: 'EMASS',
  MCCAST: 'MCCAST',
})

export const POAM_FORMAT_OPTIONS = Object.freeze([
  { label: 'eMASS', value: POAM_FORMATS.EMASS },
  { label: 'MCCAST', value: POAM_FORMATS.MCCAST },
])

export const POAM_STATUS_OPTIONS = Object.freeze({
  [POAM_FORMATS.EMASS]: [
    { label: 'Ongoing', value: 'Ongoing' },
    { label: 'Completed', value: 'Completed' },
  ],
  [POAM_FORMATS.MCCAST]: [
    { label: 'Started', value: 'Started' },
    { label: 'Not Started', value: 'Not Started' },
    { label: 'Request Risk Acceptance', value: 'Request Risk Acceptance' },
  ],
})

export const POAM_FORMAT_STORAGE_KEY = 'poam-format'
