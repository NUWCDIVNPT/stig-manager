import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { notFoundLocation } from '../../../router/notFound.js'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { useRouteTracking } from '../composables/useRouteTracking.js'

// End to end: real router, real hook, real Recent store. A page sends its bad URL to the 404 page
// with notFoundLocation, as the review and collection pages do, and the matching shortcuts leave Recent.
const Empty = { template: '<div />' }
const routes = [
  { path: '/collection/:collectionId/stigs', name: 'collection-stigs', component: Empty },
  { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
  { path: '/collection/:collectionId/benchmark/:benchmarkId/revision/:revisionStr', name: 'collection-benchmark-review', component: Empty },
  { path: '/collections', name: 'collections', component: Empty },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: Empty },
]

const SHORTCUTS = [
  { type: 'collection', collectionId: '12', label: 'c12' },
  { type: 'collection', collectionId: '123', label: 'c123' },
  { type: 'asset-review', collectionId: '12', assetId: '7', benchmarkId: 'X', label: 'c12 a7 X' },
  { type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'X', label: 'c5 a12 X' },
  { type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'Y', label: 'c5 a12 Y' },
  { type: 'asset-review', collectionId: '5', assetId: '123', benchmarkId: 'X', label: 'c5 a123 X' },
  { type: 'collection-review', collectionId: '5', benchmarkId: 'X', label: 'c5 X' },
]

describe('recent views on the 404 page', () => {
  let router

  const labels = () => useRecentViews().recentViews.value.map(v => v.label)

  // What a page does when its data says the URL is bad
  async function openBadUrl(path) {
    await router.push(path)
    await router.replace(notFoundLocation(router.currentRoute.value))
  }

  beforeEach(async () => {
    localStorage.clear()
    useGlobalAppStore().setUser({
      userId: 'u1',
      collectionGrants: ['5', '12', '123'].map(collectionId => ({ collection: { collectionId }, roleId: 1 })),
    })
    const { addView, clearViews } = useRecentViews()
    clearViews()
    for (const s of [...SHORTCUTS].reverse()) {
      addView({ ...s, url: `/${s.label}` })
    }

    router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/collections')
    const Rail = defineComponent({
      setup() {
        useRouteTracking()
        return () => null
      },
    })
    mount(Rail, { global: { plugins: [router] } })
  })

  it('a bad collection removes every shortcut of that collection, and only that one', async () => {
    await openBadUrl('/collection/12/stigs')
    expect(router.currentRoute.value.name).toBe('not-found')
    expect(labels()).toEqual(['c123', 'c5 a12 X', 'c5 a12 Y', 'c5 a123 X', 'c5 X'])
  })

  it('a bad Asset Review removes that asset and STIG only', async () => {
    await openBadUrl('/collection/5/asset/12/stig/X/revision/V1R1')
    expect(labels()).toEqual(['c12', 'c123', 'c12 a7 X', 'c5 a12 Y', 'c5 a123 X', 'c5 X'])
  })

  it('a bad Collection Review removes that review only', async () => {
    await openBadUrl('/collection/5/benchmark/X/revision/BOGUS')
    expect(labels()).toEqual(['c12', 'c123', 'c12 a7 X', 'c5 a12 X', 'c5 a12 Y', 'c5 a123 X'])
  })

  it('a collection the user has no grant to keeps its shortcuts for when the grant returns', async () => {
    const { setUser } = useGlobalAppStore()
    setUser({ userId: 'u1', collectionGrants: ['5', '123'].map(collectionId => ({ collection: { collectionId }, roleId: 1 })) })
    await openBadUrl('/collection/12/stigs')
    setUser({ userId: 'u1', collectionGrants: ['5', '12', '123'].map(collectionId => ({ collection: { collectionId }, roleId: 1 })) })
    expect(labels()).toHaveLength(SHORTCUTS.length)
  })

  it('an unknown URL removes nothing', async () => {
    await router.push('/no/such/page')
    expect(router.currentRoute.value.name).toBe('not-found')
    expect(labels()).toHaveLength(SHORTCUTS.length)
  })
})
