export const stigKeys = {
  all: ['stigs'],
  detail: benchmarkId => [...stigKeys.all, benchmarkId],
  properties: benchmarkId => [...stigKeys.detail(benchmarkId), 'properties'],

  cciLookup: cci => [...stigKeys.all, 'cci', cci],
  ruleLookup: ruleId => [...stigKeys.all, 'rules', ruleId],
  scapMaps: () => [...stigKeys.all, 'scap-maps'],

  revisions: benchmarkId => [...stigKeys.detail(benchmarkId), 'revisions'],
  revisionDetail: (benchmarkId, revisionStr) => [...stigKeys.revisions(benchmarkId), revisionStr],
  revisionCcis: (benchmarkId, revisionStr) => [...stigKeys.revisionDetail(benchmarkId, revisionStr), 'ccis'],
  revisionGroups: (benchmarkId, revisionStr) => [...stigKeys.revisionDetail(benchmarkId, revisionStr), 'groups'],
  revisionGroupDetail: (benchmarkId, revisionStr, groupId) => [
    ...stigKeys.revisionGroups(benchmarkId, revisionStr),
    groupId,
  ],
  revisionRules: (benchmarkId, revisionStr) => [...stigKeys.revisionDetail(benchmarkId, revisionStr), 'rules'],
  revisionRuleDetail: (benchmarkId, revisionStr, ruleId) => [...stigKeys.revisionRules(benchmarkId, revisionStr), ruleId],
}
