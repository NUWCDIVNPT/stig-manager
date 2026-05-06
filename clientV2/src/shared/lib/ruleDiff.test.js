import { describe, expect, it } from 'vitest'
import { buildPatchMap, detectChangedFields, extractPropText, RULE_DIFF_PROPERTY_ORDER } from './ruleDiff.js'

function makeRule(overrides = {}) {
  return {
    ruleId: 'SV-1r1_rule',
    severity: 'medium',
    title: 'baseline title',
    groupId: 'V-1',
    groupTitle: 'baseline group',
    check: { content: 'check text' },
    fix: { text: 'fix text' },
    ccis: [{ cci: 'CCI-002' }, { cci: 'CCI-001' }],
    detail: {
      vulnDiscussion: 'discussion',
      documentable: 'false',
      falseNegatives: '',
      falsePositives: '',
      responsibility: '',
      weight: '10.0',
      mitigations: '',
      thirdPartyTools: '',
      potentialImpacts: '',
      mitigationControl: '',
      severityOverrideGuidance: '',
    },
    ...overrides,
  }
}

describe('extractPropText', () => {
  it('returns empty string for null rule', () => {
    expect(extractPropText(null, 'ruleId')).toBe('')
  })

  it('extracts top-level props', () => {
    const r = makeRule()
    expect(extractPropText(r, 'ruleId')).toBe('SV-1r1_rule')
    expect(extractPropText(r, 'severity')).toBe('medium')
  })

  it('extracts check and fix from nested structures', () => {
    const r = makeRule()
    expect(extractPropText(r, 'check')).toBe('check text')
    expect(extractPropText(r, 'fix')).toBe('fix text')
  })

  it('serializes ccis as sorted JSON', () => {
    const r = makeRule()
    const json = extractPropText(r, 'ccis')
    expect(JSON.parse(json)).toEqual(['CCI-001', 'CCI-002'])
  })

  it('extracts detail-nested props', () => {
    const r = makeRule()
    expect(extractPropText(r, 'vulnDiscussion')).toBe('discussion')
    expect(extractPropText(r, 'weight')).toBe('10.0')
  })

  it('returns empty string for missing props', () => {
    const r = makeRule({ detail: {} })
    expect(extractPropText(r, 'vulnDiscussion')).toBe('')
  })

  it('returns empty string when ccis missing', () => {
    const r = makeRule({ ccis: undefined })
    expect(JSON.parse(extractPropText(r, 'ccis'))).toEqual([])
  })
})

describe('detectChangedFields', () => {
  it('returns empty array for identical rules', () => {
    expect(detectChangedFields(makeRule(), makeRule())).toEqual([])
  })

  it('detects ruleId change', () => {
    const changed = detectChangedFields(makeRule(), makeRule({ ruleId: 'SV-1r2_rule' }))
    expect(changed).toContain('ruleId')
    expect(changed).toHaveLength(1)
  })

  it('detects check.content change', () => {
    const changed = detectChangedFields(
      makeRule(),
      makeRule({ check: { content: 'new check' } }),
    )
    expect(changed).toEqual(['check'])
  })

  it('detects fix.text change', () => {
    const changed = detectChangedFields(makeRule(), makeRule({ fix: { text: 'new fix' } }))
    expect(changed).toEqual(['fix'])
  })

  it('detects detail-nested change', () => {
    const rhs = makeRule()
    rhs.detail.vulnDiscussion = 'updated discussion'
    const changed = detectChangedFields(makeRule(), rhs)
    expect(changed).toEqual(['vulnDiscussion'])
  })

  it('detects ccis reorder as NOT changed (sorted comparison)', () => {
    const lhs = makeRule({ ccis: [{ cci: 'CCI-001' }, { cci: 'CCI-002' }] })
    const rhs = makeRule({ ccis: [{ cci: 'CCI-002' }, { cci: 'CCI-001' }] })
    expect(detectChangedFields(lhs, rhs)).toEqual([])
  })

  it('detects ccis addition', () => {
    const lhs = makeRule({ ccis: [{ cci: 'CCI-001' }] })
    const rhs = makeRule({ ccis: [{ cci: 'CCI-001' }, { cci: 'CCI-003' }] })
    expect(detectChangedFields(lhs, rhs)).toEqual(['ccis'])
  })

  it('detects multiple changes in deterministic order', () => {
    const lhs = makeRule()
    const rhs = makeRule({ ruleId: 'SV-1r2_rule', fix: { text: 'new fix' } })
    const changed = detectChangedFields(lhs, rhs)
    expect(changed).toEqual(['ruleId', 'fix'])
  })
})

describe('buildPatchMap', () => {
  it('returns empty map when nothing changed', () => {
    expect(buildPatchMap(makeRule(), makeRule())).toEqual({})
  })

  it('returns a patch string for each changed field', () => {
    const rhs = makeRule({ ruleId: 'SV-1r2_rule' })
    const patches = buildPatchMap(makeRule(), rhs, ['ruleId'])
    expect(Object.keys(patches)).toEqual(['ruleId'])
    expect(patches.ruleId).toContain('SV-1r1_rule')
    expect(patches.ruleId).toContain('SV-1r2_rule')
  })

  it('defaults to the full property list when fields omitted', () => {
    const rhs = makeRule({ ruleId: 'SV-1r2_rule', fix: { text: 'new fix' } })
    const patches = buildPatchMap(makeRule(), rhs)
    expect(Object.keys(patches).sort()).toEqual(['fix', 'ruleId'])
  })

  it('skips unchanged fields even when explicitly requested', () => {
    const patches = buildPatchMap(makeRule(), makeRule(), ['ruleId', 'check', 'fix'])
    expect(patches).toEqual({})
  })
})

describe('property order', () => {
  it('starts with primary display props in the expected order', () => {
    expect(RULE_DIFF_PROPERTY_ORDER.slice(0, 7)).toEqual([
      'ruleId',
      'severity',
      'title',
      'groupId',
      'groupTitle',
      'check',
      'fix',
    ])
  })

  it('ends with ccis', () => {
    expect(RULE_DIFF_PROPERTY_ORDER[RULE_DIFF_PROPERTY_ORDER.length - 1]).toBe('ccis')
  })
})
