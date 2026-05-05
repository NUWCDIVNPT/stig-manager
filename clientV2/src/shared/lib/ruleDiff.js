import { createPatch } from 'diff'

const RULE_DETAIL_PROPS = [
  'vulnDiscussion',
  'documentable',
  'falseNegatives',
  'falsePositives',
  'responsibility',
  'weight',
  'mitigations',
  'thirdPartyTools',
  'potentialImpacts',
  'mitigationControl',
  'severityOverrideGuidance',
]

export const RULE_DIFF_PROPERTY_ORDER = [
  'ruleId',
  'severity',
  'title',
  'groupId',
  'groupTitle',
  'check',
  'fix',
  ...RULE_DETAIL_PROPS,
  'ccis',
]

const DIFF_OPTIONS = { context: 999, ignoreWhitespace: false }

export function extractPropText(rule, prop) {
  if (!rule) {
    return ''
  }
  if (prop === 'check') {
    return rule.check?.content ?? ''
  }
  if (prop === 'fix') {
    return rule.fix?.text ?? ''
  }
  if (prop === 'ccis') {
    const list = Array.isArray(rule.ccis) ? rule.ccis.map(c => c.cci).sort((a, b) => a.localeCompare(b)) : []
    return JSON.stringify(list, null, 2)
  }
  if (RULE_DETAIL_PROPS.includes(prop)) {
    const v = rule.detail?.[prop]
    return v == null ? '' : String(v)
  }
  const v = rule[prop]
  return v == null ? '' : String(v)
}

export function detectChangedFields(lhs, rhs) {
  const changed = []
  for (const prop of RULE_DIFF_PROPERTY_ORDER) {
    const lText = extractPropText(lhs, prop)
    const rText = extractPropText(rhs, prop)
    if (lText !== rText) {
      changed.push(prop)
    }
  }
  return changed
}

export function buildPatchMap(lhs, rhs, fields) {
  const out = {}
  const props = Array.isArray(fields) && fields.length ? fields : RULE_DIFF_PROPERTY_ORDER
  for (const prop of props) {
    const lText = extractPropText(lhs, prop)
    const rText = extractPropText(rhs, prop)
    if (lText === rText) {
      continue
    }
    try {
      out[prop] = createPatch(prop, lText, rText, undefined, undefined, DIFF_OPTIONS)
    }
    catch {
      out[prop] = null
    }
  }
  return out
}
