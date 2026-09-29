import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { useColumnVisibility } from './useColumnVisibility.js'

const columns = [
  { field: 'name', header: 'Name', locked: true },
  { field: 'ip', header: 'IP' },
  { field: 'mac', header: 'MAC', defaultHidden: true },
]
const fields = list => list.map(c => c.field)

describe('useColumnVisibility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows locked and default columns, and offers only unlocked ones', () => {
    const v = useColumnVisibility(columns, 'grid')
    expect(fields(v.toggleableColumns.value)).toEqual(['ip', 'mac'])
    expect(fields(v.selectedColumns.value)).toEqual(['ip'])
    expect(fields(v.visibleColumns.value)).toEqual(['name', 'ip'])
    expect(v.visibleFields.value.has('mac')).toBe(false)
  })

  it('saves only departures from the defaults, matching on field', () => {
    const v = useColumnVisibility(columns, 'grid')
    v.selectedColumns.value = [{ field: 'mac' }]
    expect(fields(v.visibleColumns.value)).toEqual(['name', 'mac'])
    expect(JSON.parse(localStorage.getItem('grid'))).toEqual({ ip: false, mac: true })

    v.selectedColumns.value = [{ field: 'ip' }]
    expect(JSON.parse(localStorage.getItem('grid'))).toEqual({})
  })

  it('restores saved choices and ignores unreadable ones', () => {
    localStorage.setItem('grid', JSON.stringify({ mac: true, ip: 'yes' }))
    expect(fields(useColumnVisibility(columns, 'grid').selectedColumns.value)).toEqual(['ip', 'mac'])
    localStorage.setItem('grid', '{not json')
    expect(fields(useColumnVisibility(columns, 'grid').selectedColumns.value)).toEqual(['ip'])
  })

  it('reloads choices when the key changes', async () => {
    localStorage.setItem('b', JSON.stringify({ ip: false }))
    const key = ref('a')
    const v = useColumnVisibility(columns, key)
    expect(fields(v.selectedColumns.value)).toEqual(['ip'])
    key.value = 'b'
    await nextTick()
    expect(fields(v.selectedColumns.value)).toEqual([])
  })

  it('sets fields directly and keeps choices in memory without a key', () => {
    const v = useColumnVisibility(columns)
    v.setShown({ ip: false, mac: true })
    expect(fields(v.selectedColumns.value)).toEqual(['mac'])
    expect(localStorage.length).toBe(0)
  })
})
