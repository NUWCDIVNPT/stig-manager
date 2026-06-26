import { normalizeColor } from '../../../shared/lib/colorUtils.js'

// gets the default access for a role everoyne has rw access except restricted users who only have no access by default restrectied number is 1
export function getDefaultAccessForRole(roleId) {
  return Number(roleId) === 1 ? 'none' : 'rw'
}

// gets the options for that grant based on role id. Only roleId 1 (Restricted) CAN get the "No Access" option.
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

// Breaks a rule into its component resources for display. Icon-free so it stays
// framework-independent; the renderer maps `type` to an icon. A rule with no
// asset/label/STIG is the whole collection.
export function resourceParts(rule) {
  const parts = []
  if (!rule.assetName && !rule.labelName && !rule.benchmarkId) {
    parts.push({ type: 'collection', text: 'Whole Collection' })
  }
  if (rule.assetName) {
    parts.push({ type: 'asset', text: rule.assetName })
  }
  if (rule.labelName) {
    parts.push({ type: 'label', text: rule.labelName, color: normalizeColor(rule.label?.color ?? rule.color) })
  }
  if (rule.benchmarkId) {
    parts.push({ type: 'stig', text: rule.benchmarkId })
  }
  return parts
}

export function resourceSortKey(rule) {
  return resourceParts(rule).map(part => part.text).join(' ')
}
