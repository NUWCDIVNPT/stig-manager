import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGranteeFilter } from './useGranteeFilter.js'

// Fix "now" so cutoff math is deterministic. lastAccess is stored as Unix
// seconds (see api/source/utils/auth.js), which is exactly what these tests pin.
const NOW = new Date('2026-06-29T12:00:00Z')
const nowSeconds = Math.floor(NOW.getTime() / 1000)
const daysAgoSeconds = days => nowSeconds - days * 24 * 60 * 60

function userNames(displaySource) {
  return displaySource.value.find(g => g.value === 'user').items.map(u => u.displayName)
}

describe('useGranteeFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('All (value 0) returns every user regardless of lastAccess', () => {
    const users = ref([
      { displayName: 'recent', lastAccess: daysAgoSeconds(5) },
      { displayName: 'stale', lastAccess: daysAgoSeconds(200) },
      { displayName: 'never', lastAccess: 0 },
    ])
    const { displaySource } = useGranteeFilter(users, ref([]))

    expect(userNames(displaySource)).toEqual(['recent', 'stale', 'never'])
  })

  it('30 Days keeps users active within the window and drops older ones', () => {
    const users = ref([
      { displayName: 'day5', lastAccess: daysAgoSeconds(5) },
      { displayName: 'day29', lastAccess: daysAgoSeconds(29) },
      { displayName: 'day31', lastAccess: daysAgoSeconds(31) },
      { displayName: 'day90', lastAccess: daysAgoSeconds(90) },
    ])
    const { selectedFilter, filterOptions, displaySource } = useGranteeFilter(users, ref([]))

    selectedFilter.value = filterOptions.find(o => o.value === 30)

    expect(userNames(displaySource)).toEqual(['day5', 'day29'])
  })

  it('90 Days keeps a 60-day-old user that a naive ms parse would hide', () => {
    // Regression guard: new Date(seconds) (no *1000) lands in ~Jan 1970, which
    // is always below the cutoff, so this user would be wrongly filtered out.
    const users = ref([{ displayName: 'day60', lastAccess: daysAgoSeconds(60) }])
    const { selectedFilter, filterOptions, displaySource } = useGranteeFilter(users, ref([]))

    selectedFilter.value = filterOptions.find(o => o.value === 90)

    expect(userNames(displaySource)).toEqual(['day60'])
  })

  it('treats falsy lastAccess as never-active and excludes it under a filter', () => {
    const users = ref([
      { displayName: 'recent', lastAccess: daysAgoSeconds(1) },
      { displayName: 'zero', lastAccess: 0 },
      { displayName: 'undef' },
    ])
    const { selectedFilter, filterOptions, displaySource } = useGranteeFilter(users, ref([]))

    selectedFilter.value = filterOptions.find(o => o.value === 30)

    expect(userNames(displaySource)).toEqual(['recent'])
  })

  it('search text filters users and groups by displayName, case-insensitively', () => {
    const users = ref([{ displayName: 'Alice' }, { displayName: 'Bob' }])
    const groups = ref([{ displayName: 'Admins' }, { displayName: 'Readers' }])
    const { searchText, displaySource } = useGranteeFilter(users, groups)

    searchText.value = 'a'

    expect(userNames(displaySource)).toEqual(['Alice'])
    expect(displaySource.value.find(g => g.value === 'group').items.map(g => g.displayName))
      .toEqual(['Admins', 'Readers'])
  })
})
