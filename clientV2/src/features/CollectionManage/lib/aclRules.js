// Framework-independent helpers for editing collection grant ACL rules.
// See collection-manage-grants-users-tabs-notes.md "ACL Rule Data Shapes" for context.

export function getDefaultAccessForRole(roleId) {
  return Number(roleId) === 1 ? 'none' : 'rw'
}

export function getAllowedAclAccessOptions(roleId) {
  const options = [
    { label: 'Read/Write', value: 'rw' },
    { label: 'Read Only', value: 'r' },
  ]
  if (Number(roleId) === 1) {
    options.push({ label: 'No Access', value: 'none' })
  }
  return options
}

export function normalizeAclRule(rule) {
  return {
    benchmarkId: rule.benchmarkId,
    assetId: rule.asset?.assetId ?? rule.assetId,
    assetName: rule.asset?.name ?? rule.assetName,
    labelId: rule.label?.labelId ?? rule.labelId,
    labelName: rule.label?.name ?? rule.labelName,
    label: rule.label,
    access: rule.access,
  }
}

export function aclRuleToPayload(rule) {
  return {
    benchmarkId: rule.benchmarkId || undefined,
    assetId: rule.assetId || undefined,
    labelId: rule.labelId || undefined,
    access: rule.access,
  }
}

export function getAclRuleKey(rule) {
  return [
    rule.assetId ?? '',
    rule.labelId ?? '',
    rule.benchmarkId ?? '',
  ].join(':')
}

export function isDuplicateAclRule(rules, candidate) {
  const candidateKey = getAclRuleKey(candidate)
  return rules.some(rule => getAclRuleKey(rule) === candidateKey)
}
