import { describe, expect, it } from 'vitest'
import {
  formToRule,
  intervalToSeconds,
  isCollectionTarget,
  ruleActionSummary,
  ruleIntervalLabel,
  rulesToPutPayload,
  ruleToForm,
  secondsToInterval,
  targetDisplayLabel,
  targetToPut,
  updateValueOptions,
} from '../Configuration/reviewAgingLogic.js'

describe('interval conversion', () => {
  it('converts value + unit to seconds', () => {
    expect(intervalToSeconds(30, 'days')).toBe(2592000)
    expect(intervalToSeconds(2, 'hours')).toBe(7200)
  })

  it('prefers whole days, falls back to hours', () => {
    expect(secondsToInterval(2592000)).toEqual({ value: 30, unit: 'days' })
    expect(secondsToInterval(604800)).toEqual({ value: 7, unit: 'days' })
    expect(secondsToInterval(7200)).toEqual({ value: 2, unit: 'hours' })
    expect(secondsToInterval(5400)).toEqual({ value: 2, unit: 'hours' }) // 1.5h rounds
  })
})

describe('targets', () => {
  it('treats null and {collection:true} as Collection scope', () => {
    expect(isCollectionTarget(null)).toBe(true)
    expect(isCollectionTarget({ collection: true })).toBe(true)
    expect(targetToPut(null)).toBeUndefined()
    expect(targetDisplayLabel({ collection: true })).toBe('Collection')
  })

  it('reduces display targets to ID-only PUT shapes', () => {
    expect(targetToPut({ benchmarkId: 'U_RHEL_8_STIG' })).toEqual({ benchmarkId: 'U_RHEL_8_STIG' })
    expect(targetToPut({ asset: { assetId: '123', name: 'host' } })).toEqual({ assetId: '123' })
    expect(targetToPut({ asset: { assetId: '123', name: 'host' }, benchmarkId: 'U_RHEL_8_STIG' }))
      .toEqual({ assetId: '123', benchmarkId: 'U_RHEL_8_STIG' })
    expect(targetToPut({ label: { labelId: 'uuid', name: 'L', color: 'fff' } })).toEqual({ labelId: 'uuid' })
  })

  it('passes already-flattened ID-only targets through unchanged', () => {
    expect(targetToPut({ assetId: '123' })).toEqual({ assetId: '123' })
    expect(targetToPut({ labelId: 'uuid', benchmarkId: 'U_RHEL_8_STIG' }))
      .toEqual({ labelId: 'uuid', benchmarkId: 'U_RHEL_8_STIG' })
  })
})

describe('updateValueOptions', () => {
  it('returns status / result value sets', () => {
    expect(updateValueOptions('status').map(o => o.value)).toEqual(['saved', 'submitted'])
    expect(updateValueOptions('result').map(o => o.value)).toEqual(['notchecked', 'informational'])
    expect(updateValueOptions('bogus')).toEqual([])
  })
})

describe('serialization', () => {
  it('serializes a delete rule for Collection scope without update or target fields', () => {
    const form = {
      title: 'Delete old reviews',
      enabled: true,
      target: null,
      triggerField: 'ts',
      intervalValue: 30,
      intervalUnit: 'days',
      triggerAction: 'delete',
      updateField: 'status',
      updateValue: 'saved',
    }
    const rule = formToRule(form)
    expect(rule).toMatchObject({
      title: 'Delete old reviews',
      enabled: true,
      triggerField: 'ts',
      triggerInterval: 2592000,
      triggerAction: 'delete',
    })
    expect(rule.updateField).toBeUndefined()
    expect(rule.updateValue).toBeUndefined()
    expect(rule.target).toBeUndefined()
  })

  it('serializes an update rule with a STIG target', () => {
    const form = {
      title: 'Reset stale',
      enabled: true,
      target: { benchmarkId: 'U_MS_Windows_11_STIG' },
      triggerField: 'statusTs',
      intervalValue: 7,
      intervalUnit: 'days',
      triggerAction: 'update',
      updateField: 'status',
      updateValue: 'saved',
    }
    const rule = formToRule(form)
    expect(rule.target).toEqual({ benchmarkId: 'U_MS_Windows_11_STIG' })
    expect(rule.updateField).toBe('status')
    expect(rule.updateValue).toBe('saved')
  })

  it('coerces a blank title to null', () => {
    expect(formToRule({ ...minimalForm(), title: '   ' }).title).toBeNull()
  })

  it('round-trips through ruleToForm', () => {
    const rule = formToRule({ ...minimalForm(), title: 'X', target: { asset: { assetId: '9', name: 'h' } } })
    const form = ruleToForm(rule)
    expect(form.title).toBe('X')
    expect(form.target).toEqual({ asset: { assetId: '9', name: 'h' } })
  })

  it('reduces rich targets and strips client fields for the PUT payload', () => {
    const rules = [{
      _clientId: 'abc',
      ...formToRule({ ...minimalForm(), target: { asset: { assetId: '9', name: 'h' }, benchmarkId: 'b' } }),
    }]
    const payload = rulesToPutPayload(rules)
    expect(payload[0]._clientId).toBeUndefined()
    expect(payload[0].target).toEqual({ assetId: '9', benchmarkId: 'b' })
  })
})

describe('grid display helpers', () => {
  it('summarizes actions and intervals', () => {
    const del = formToRule({ ...minimalForm(), triggerAction: 'delete' })
    expect(ruleActionSummary(del)).toBe('Delete reviews')
    const upd = formToRule({ ...minimalForm(), triggerAction: 'update', updateField: 'result', updateValue: 'notchecked' })
    expect(ruleActionSummary(upd)).toBe('Set Result → Not Checked')
    expect(ruleIntervalLabel(formToRule({ ...minimalForm(), intervalValue: 1, intervalUnit: 'days' }))).toBe('1 day')
  })
})

function minimalForm() {
  return {
    title: 'Rule',
    enabled: true,
    target: null,
    triggerField: 'ts',
    intervalValue: 30,
    intervalUnit: 'days',
    triggerAction: 'update',
    updateField: 'status',
    updateValue: 'saved',
  }
}
