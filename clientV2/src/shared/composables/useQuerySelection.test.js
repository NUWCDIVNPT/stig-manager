import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQuerySelection } from './useQuerySelection.js'

const Empty = { template: '<div />' }

let router

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/stigs', name: 'stigs', component: Empty },
      { path: '/findings', name: 'findings', component: Empty },
      // Same route name for every collection, like the real collection tabs
      { path: '/collection/:collectionId/stigs', name: 'collection-stigs', component: Empty },
    ],
  })
}

async function setupKeys(path, keys) {
  await router.push(path)
  await router.isReady()
  let selections
  mount({
    setup() {
      selections = keys.map(key => useQuerySelection(key))
      return () => null
    },
  }, { global: { plugins: [router] } })
  return selections
}

async function setup(path) {
  return (await setupKeys(path, ['stig']))[0]
}

const query = () => router.currentRoute.value.query

describe('useQuerySelection', () => {
  beforeEach(() => {
    router = makeRouter()
  })

  it('starts from the URL value', async () => {
    const selected = await setup('/stigs?stig=RHEL_9')
    expect(selected.value).toBe('RHEL_9')
  })

  it('starts empty without the key', async () => {
    const selected = await setup('/stigs')
    expect(selected.value).toBeNull()
  })

  it.each([
    ['an empty value', '/stigs?stig='],
    ['a repeated key', '/stigs?stig=a&stig=b'],
  ])('ignores %s', async (_, path) => {
    const selected = await setup(path)
    expect(selected.value).toBeNull()
  })

  it('writes a new selection to the URL, keeping other keys', async () => {
    const selected = await setup('/stigs?labelName=web')
    selected.value = 'RHEL_9'
    await flushPromises()
    expect(query()).toEqual({ labelName: 'web', stig: 'RHEL_9' })
  })

  it('writes numbers as strings', async () => {
    const selected = await setup('/stigs')
    selected.value = 12
    await flushPromises()
    expect(query().stig).toBe('12')
  })

  it('removes the key when cleared', async () => {
    const selected = await setup('/stigs?stig=RHEL_9&labelName=web')
    selected.value = null
    await flushPromises()
    expect(query()).toEqual({ labelName: 'web' })
  })

  it('uses replace, so selections add no history entries', async () => {
    await router.push('/findings')
    const selected = await setup('/stigs')
    selected.value = 'A'
    await flushPromises()
    selected.value = 'B'
    await flushPromises()

    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('findings'))
  })

  it('does not write while another route is current (hidden tab)', async () => {
    const selected = await setup('/stigs')
    await router.push('/findings?stig=Findings_scope')

    selected.value = 'RHEL_9'
    await flushPromises()
    expect(query()).toEqual({ stig: 'Findings_scope' })
  })

  it('keeps both writes when two keys change in the same tick', async () => {
    const [label, asset] = await setupKeys('/stigs?labelName=web', ['label', 'asset'])
    label.value = 'L1'
    asset.value = '2'
    await flushPromises()
    expect(query()).toEqual({ labelName: 'web', label: 'L1', asset: '2' })
  })

  it('keeps both removals when two keys are cleared in the same tick', async () => {
    const [label, asset] = await setupKeys('/stigs?label=L1&asset=2&labelName=web', ['label', 'asset'])
    label.value = null
    asset.value = null
    await flushPromises()
    expect(query()).toEqual({ labelName: 'web' })
  })

  it('re-syncs the URL when its route becomes current again', async () => {
    const selected = await setup('/stigs?stig=A')
    await router.push('/findings')
    selected.value = 'B'
    await flushPromises()

    // e.g. the tab's restored query is stale: it still says A
    await router.push('/stigs?stig=A')
    await flushPromises()
    expect(query().stig).toBe('B')
  })

  describe('follows the URL while its route stays current', () => {
    it('adopts a new value from a link or Recent view to the same route', async () => {
      const selected = await setup('/stigs?stig=A')
      await router.push('/stigs?stig=C')
      await flushPromises()
      expect(selected.value).toBe('C')
    })

    it('keeps the selection and restores the key when a link to the same page leaves it out (collection breadcrumb)', async () => {
      const selected = await setup('/collection/1/stigs?stig=A')
      await router.push('/collection/1/stigs')
      await flushPromises()
      expect(selected.value).toBe('A')
      expect(query()).toEqual({ stig: 'A' })
    })

    it('clears when the URL drops the key on another path (another collection)', async () => {
      const selected = await setup('/collection/1/stigs?stig=A')
      await router.push('/collection/2/stigs')
      await flushPromises()
      expect(selected.value).toBeNull()
    })

    it('restores the selection on Back after switching collection (same route, reused component)', async () => {
      const selected = await setup('/collection/1/stigs?stig=A')

      await router.push('/collection/2/stigs')
      await flushPromises()
      expect(selected.value).toBeNull()
      // the tab then picks collection 2's first row
      selected.value = 'B'
      await flushPromises()
      expect(query()).toEqual({ stig: 'B' })

      router.back()
      await vi.waitFor(() => expect(router.currentRoute.value.params.collectionId).toBe('1'))
      await flushPromises()
      expect(selected.value).toBe('A')
      expect(query()).toEqual({ stig: 'A' })
    })

    it('ignores URL changes while another route is current (hidden tab)', async () => {
      const selected = await setup('/stigs?stig=A')
      await router.push('/findings?stig=Findings_scope')
      await flushPromises()
      expect(selected.value).toBe('A')
    })

    it('does not fight its own writes', async () => {
      const selected = await setup('/stigs')
      selected.value = 'A'
      await flushPromises()
      selected.value = 'B'
      await flushPromises()
      expect(selected.value).toBe('B')
      expect(query().stig).toBe('B')
    })
  })

  describe('writes build on the current URL', () => {
    it('keeps the URL hash when writing a selection', async () => {
      const selected = await setup('/stigs?labelName=web#top')
      selected.value = 'A'
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe('/stigs?labelName=web&stig=A#top')
    })

    it('does not bring back a query that another navigation replaced while its write was in flight', async () => {
      const selected = await setup('/stigs?labelName=a')
      // hold any navigation that writes stig=X, so that write is still in flight
      router.beforeEach(to => (to.query.stig === 'X' ? new Promise(() => {}) : true))

      selected.value = 'X'
      await flushPromises()

      // meanwhile the label filter changes on the same page (this cancels the held write)
      await router.push('/stigs?labelName=b')
      await flushPromises()
      expect(query()).toEqual({ labelName: 'b' })

      selected.value = 'Y'
      await flushPromises()
      expect(query()).toEqual({ labelName: 'b', stig: 'Y' })
    })
  })
})
