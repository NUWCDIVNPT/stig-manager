import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useGlobalAppStore } from '../stores/globalAppStore.js'
import { useRecentViews, useTrackRecentView } from './useRecentViews.js'

const appStore = useGlobalAppStore()
const grants = ids => ids.map(collectionId => ({ collection: { collectionId }, roleId: 1 }))
const signIn = (userId, collectionIds = ['5', '12', '123']) =>
  appStore.setUser({ userId, collectionGrants: grants(collectionIds) })

const labels = () => useRecentViews().recentViews.value.map(v => v.label)

function addAll(entries) {
  const { addView } = useRecentViews()
  // Added oldest first so the list reads in the order given
  for (const e of [...entries].reverse()) {
    addView({ url: `/${e.label}`, ...e })
  }
}

// Fields alike as text (12 vs 123, asset 12 vs collection 12, X vs X_V2)
const ENTRIES = [
  { type: 'collection', collectionId: '12', label: 'c12' },
  { type: 'collection', collectionId: '123', label: 'c123' },
  { type: 'collection', section: 'findings', collectionId: '12', label: 'c12 findings' },
  { type: 'asset-review', collectionId: '12', assetId: '7', benchmarkId: 'X', label: 'c12 a7 X' },
  { type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'X', label: 'c5 a12 X' },
  { type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'Y', label: 'c5 a12 Y' },
  { type: 'asset-review', collectionId: '5', assetId: '123', benchmarkId: 'X', label: 'c5 a123 X' },
  { type: 'collection-review', collectionId: '5', benchmarkId: 'X', label: 'c5 X' },
  { type: 'collection-review', collectionId: '5', benchmarkId: 'X_V2', label: 'c5 X_V2' },
  { type: 'admin', section: 'admin-users', label: 'Admin / Users' },
]

beforeEach(() => {
  localStorage.clear()
  signIn('u1')
  useRecentViews().clearViews()
})

describe('addView', () => {
  it('puts the newest view first', () => {
    const { addView } = useRecentViews()
    addView({ type: 'collection', collectionId: '5', label: 'first', url: '/a' })
    addView({ type: 'collection', collectionId: '12', label: 'second', url: '/b' })
    expect(labels()).toEqual(['second', 'first'])
  })

  it('keeps one entry per view, updating its URL and label', () => {
    const { addView, recentViews } = useRecentViews()
    addView({ type: 'collection', collectionId: '5', label: 'Old', url: '/collection/5/stigs' })
    addView({ type: 'collection', collectionId: '12', label: 'Other', url: '/collection/12/stigs' })
    addView({ type: 'collection', collectionId: '5', label: 'New', url: '/collection/5/assets' })
    expect(recentViews.value.map(v => [v.label, v.url])).toEqual([
      ['New', '/collection/5/assets'],
      ['Other', '/collection/12/stigs'],
    ])
  })

  it('keeps sections of one collection apart', () => {
    addAll(ENTRIES.slice(0, 3))
    expect(labels()).toEqual(['c12', 'c123', 'c12 findings'])
  })

  it('keeps the 20 newest', () => {
    const { addView } = useRecentViews()
    for (let i = 0; i < 25; i++) {
      addView({ type: 'admin', section: `s${i}`, label: `s${i}`, url: `/s${i}` })
    }
    expect(labels()).toHaveLength(20)
    expect(labels()[0]).toBe('s24')
  })

  it('does not count hidden views toward the 20', () => {
    const { addView } = useRecentViews()
    for (let i = 0; i < 5; i++) {
      addView({ type: 'collection', section: `s${i}`, collectionId: '12', label: `c12 s${i}`, url: `/c12/s${i}` })
    }
    signIn('u1', ['5'])
    for (let i = 0; i < 25; i++) {
      addView({ type: 'admin', section: `s${i}`, label: `s${i}`, url: `/s${i}` })
    }
    expect(labels()).toHaveLength(20)
    signIn('u1', ['5', '12'])
    expect(labels().filter(l => l.startsWith('c12'))).toHaveLength(5)
  })

  it('ignores a view without a label or URL', () => {
    const { addView } = useRecentViews()
    addView({ type: 'admin', section: 'a', url: '/a' })
    addView({ type: 'admin', section: 'b', label: 'b' })
    expect(labels()).toEqual([])
  })
})

describe('forget', () => {
  beforeEach(() => addAll(ENTRIES))

  it('forgets every view of a collection, and only that collection', () => {
    useRecentViews().forget({ collectionId: '12' })
    expect(labels()).toEqual(['c123', 'c5 a12 X', 'c5 a12 Y', 'c5 a123 X', 'c5 X', 'c5 X_V2', 'Admin / Users'])
  })

  it('forgets one asset review', () => {
    useRecentViews().forget({ type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'X' })
    expect(labels()).not.toContain('c5 a12 X')
    expect(labels()).toHaveLength(ENTRIES.length - 1)
  })

  it('forgets one collection review', () => {
    useRecentViews().forget({ type: 'collection-review', collectionId: '5', benchmarkId: 'X' })
    expect(labels()).not.toContain('c5 X')
    expect(labels()).toHaveLength(ENTRIES.length - 1)
  })

  it('compares numbers and strings alike', () => {
    useRecentViews().forget({ collectionId: 123 })
    expect(labels()).not.toContain('c123')
    expect(labels()).toHaveLength(ENTRIES.length - 1)
  })

  it('forgets nothing for an empty match', () => {
    useRecentViews().forget({})
    useRecentViews().forget({ collectionId: undefined })
    expect(labels()).toHaveLength(ENTRIES.length)
  })
})

describe('visibility', () => {
  it('hides views of collections the user has no grant for, and shows them again if granted', () => {
    addAll(ENTRIES)
    signIn('u1', ['5'])
    expect(labels()).toEqual(['c5 a12 X', 'c5 a12 Y', 'c5 a123 X', 'c5 X', 'c5 X_V2', 'Admin / Users'])
    signIn('u1')
    expect(labels()).toHaveLength(ENTRIES.length)
  })
})

describe('storage', () => {
  it('keeps each user\'s views apart', () => {
    addAll(ENTRIES.slice(0, 1))
    signIn('u2')
    expect(labels()).toEqual([])
    addAll(ENTRIES.slice(1, 2))
    signIn('u1')
    expect(labels()).toEqual(['c12'])
  })

  it('saves under the user\'s own key', () => {
    addAll(ENTRIES.slice(0, 1))
    const stored = JSON.parse(localStorage.getItem('stigman:recentViews:u1'))
    expect(stored.map(v => v.label)).toEqual(['c12'])
  })

  it('removes the old key that all users shared', () => {
    localStorage.setItem('stigman:recentViews', '[{"key":"collection:1","url":"/x","label":"x"}]')
    signIn('u3')
    expect(labels()).toEqual([])
    expect(localStorage.getItem('stigman:recentViews')).toBeNull()
  })

  it('starts empty on unreadable storage', () => {
    localStorage.setItem('stigman:recentViews:u4', '{not json')
    signIn('u4')
    expect(labels()).toEqual([])
  })

  it('clears the user\'s views', () => {
    addAll(ENTRIES)
    useRecentViews().clearViews()
    expect(labels()).toEqual([])
    expect(JSON.parse(localStorage.getItem('stigman:recentViews:u1'))).toEqual([])
  })
})

describe('useTrackRecentView', () => {
  async function mountTracking(describeView, path = '/collection/5/stigs') {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }],
    })
    await router.push(path)
    const Tracker = defineComponent({
      setup() {
        useTrackRecentView(describeView)
        return () => null
      },
    })
    mount(Tracker, { global: { plugins: [router] } })
    await nextTick()
    return router
  }

  it('adds the view with the page\'s URL once described', async () => {
    const name = ref(null)
    await mountTracking(() => name.value && { type: 'collection', collectionId: '5', label: name.value })
    expect(labels()).toEqual([])

    name.value = 'Alpha'
    await nextTick()
    expect(useRecentViews().recentViews.value).toMatchObject([
      { type: 'collection', collectionId: '5', label: 'Alpha', url: '/collection/5/stigs' },
    ])
  })

  it('follows the URL, so the entry returns to where the user was', async () => {
    const router = await mountTracking(() => ({ type: 'collection', collectionId: '5', label: 'Alpha' }))
    await router.push('/collection/5/assets?labelName=web')
    await nextTick()
    expect(useRecentViews().recentViews.value.map(v => v.url)).toEqual(['/collection/5/assets?labelName=web'])
  })
})
