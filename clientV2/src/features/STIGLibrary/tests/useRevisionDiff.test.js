import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useRevisionDiff } from '../composables/useRevisionDiff.js'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function rule(version, overrides = {}) {
  return { version, ruleId: `SV-${version}r1_rule`, severity: 'medium', title: `${version} title`, ...overrides }
}

// Serves lhs rules for `compareRev` and rhs rules for `viewRev`.
function rulesFor({ lhs = [], rhs = [] }) {
  return vi.fn((_bm, rev) => Promise.resolve(rev === 'V1R1' ? lhs : rhs))
}

function setup({ lhs, rhs, getRulesForRev, compareRev = 'V1R1' } = {}) {
  const refs = {
    benchmarkId: ref('RHEL_8'),
    viewRev: ref('V1R2'),
    compareRev: ref(compareRev),
  }
  const api = useRevisionDiff({ ...refs, getRulesForRev: getRulesForRev ?? rulesFor({ lhs, rhs }) })
  return { ...refs, ...api }
}

describe('useRevisionDiff', () => {
  it('stays idle without a compareRev and never fetches', async () => {
    const getRulesForRev = vi.fn()
    const { diffStatus, diffRows } = setup({ getRulesForRev, compareRev: null })
    await flushPromises()

    expect(diffStatus.value).toBe('idle')
    expect(diffRows.value).toEqual([])
    expect(getRulesForRev).not.toHaveBeenCalled()
  })

  it('omits rules that are identical in both revisions', async () => {
    const { diffRows, diffStatus } = setup({ lhs: [rule('V-1')], rhs: [rule('V-1')] })
    await flushPromises()
    expect(diffStatus.value).toBe('ready')
    expect(diffRows.value).toEqual([])
  })

  it('reports a changed field for a rule present in both revisions', async () => {
    const { diffRows } = setup({
      lhs: [rule('V-1', { title: 'old title' })],
      rhs: [rule('V-1', { title: 'new title' })],
    })
    await flushPromises()

    expect(diffRows.value).toHaveLength(1)
    expect(diffRows.value[0].changed).toEqual(['title'])
    expect(diffRows.value[0].leftRule).toBe('SV-V-1r1_rule')
    expect(diffRows.value[0].rightRule).toBe('SV-V-1r1_rule')
  })

  it('labels a rule only in the viewed revision as \'rule added\'', async () => {
    const { diffRows } = setup({ lhs: [], rhs: [rule('V-1')] })
    await flushPromises()
    expect(diffRows.value[0].changed).toEqual(['rule added'])
    expect(diffRows.value[0].leftRule).toBe('')
  })

  it('labels a rule only in the compared revision as \'rule removed\'', async () => {
    const { diffRows } = setup({ lhs: [rule('V-1')], rhs: [] })
    await flushPromises()
    expect(diffRows.value[0].changed).toEqual(['rule removed'])
    expect(diffRows.value[0].rightRule).toBe('')
  })

  it('skips rules with no version, and sorts rows by stigId', async () => {
    const { diffRows } = setup({
      lhs: [],
      rhs: [rule('V-3'), rule(''), rule('V-1'), rule('V-2')],
    })
    await flushPromises()
    expect(diffRows.value.map(r => r.stigId)).toEqual(['V-1', 'V-2', 'V-3'])
  })

  it('prefers the viewed revision severity for cat, falling back to the compared one', async () => {
    const { diffRows } = setup({
      lhs: [rule('V-1', { severity: 'low' }), rule('V-2', { severity: 'high' })],
      rhs: [rule('V-1', { severity: 'high', title: 'changed' })],
    })
    await flushPromises()
    const byId = Object.fromEntries(diffRows.value.map(r => [r.stigId, r.cat]))
    expect(byId['V-1']).toBe('high')
    expect(byId['V-2']).toBe('high')
  })

  it('builds a patch map lazily and caches it per row', async () => {
    const { diffDetailFor } = setup({
      lhs: [rule('V-1', { title: 'old title' })],
      rhs: [rule('V-1', { title: 'new title' })],
    })
    await flushPromises()

    const first = diffDetailFor('V-1')
    expect(Object.keys(first)).toEqual(['title'])
    expect(diffDetailFor('V-1')).toBe(first)
    expect(diffDetailFor('nope')).toBeNull()
    expect(diffDetailFor(null)).toBeNull()
  })

  it('patches the whole rule when it was added, not the added/removed pseudo-property', async () => {
    const { diffDetailFor } = setup({ lhs: [], rhs: [rule('V-1')] })
    await flushPromises()

    const patches = diffDetailFor('V-1')
    expect(Object.keys(patches)).not.toContain('rule added')
    expect(Object.keys(patches)).toEqual(expect.arrayContaining(['ruleId', 'title', 'severity']))
  })

  it('rowByKey resolves a row and returns null for an unknown key', async () => {
    const { rowByKey } = setup({ lhs: [], rhs: [rule('V-1')] })
    await flushPromises()
    expect(rowByKey('V-1').stigId).toBe('V-1')
    expect(rowByKey('missing')).toBeNull()
  })

  it('surfaces a fetch failure as error status with no rows', async () => {
    const err = new Error('boom')
    const { diffStatus, diffError, diffRows } = setup({ getRulesForRev: vi.fn().mockRejectedValue(err) })
    await flushPromises()
    expect(diffStatus.value).toBe('error')
    expect(diffError.value).toBe(err)
    expect(diffRows.value).toEqual([])
  })

  it('recomputes when the compared revision changes', async () => {
    const getRulesForRev = vi.fn((_bm, rev) =>
      Promise.resolve(rev === 'V1R2' ? [rule('V-1', { title: 'new' })] : [rule('V-1', { title: rev })]),
    )
    const { compareRev, diffRows } = setup({ getRulesForRev })
    await flushPromises()
    expect(diffRows.value).toHaveLength(1)

    compareRev.value = 'V1R0'
    await nextTick()
    await flushPromises()
    expect(getRulesForRev).toHaveBeenCalledWith('RHEL_8', 'V1R0')
  })

  it('ignores a stale in-flight computation when the revision changes mid-flight', async () => {
    let resolveSlow
    const getRulesForRev = vi.fn((_bm, rev) => {
      if (rev === 'V1R1') {
        return new Promise((resolve) => {
          resolveSlow = resolve
        })
      }
      return Promise.resolve(rev === 'V1R2' ? [rule('FAST')] : [])
    })

    const { compareRev, diffRows } = setup({ getRulesForRev })
    compareRev.value = 'V1R0'
    await nextTick()
    await flushPromises()

    expect(diffRows.value.map(r => r.stigId)).toEqual(['FAST'])

    resolveSlow([rule('SLOW')])
    await flushPromises()
    expect(diffRows.value.map(r => r.stigId)).toEqual(['FAST'])
  })
})
