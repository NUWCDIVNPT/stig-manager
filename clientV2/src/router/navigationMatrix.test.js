import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Navigation matrix (docs/todos/url-state.md): start URL, action, expected URL, through the real router.
// Tab switches and grid shields are covered by the CollectionView tab tests.

vi.mock('../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({
    isAdmin: { value: false },
    hasCollectionAccess: () => true,
    getCollectionRoleId: () => 4,
    refreshUser: async () => {},
    user: ref({ collectionGrants: [
      { collection: { collectionId: 5, name: 'Five' } },
      { collection: { collectionId: 7, name: 'Seven' } },
    ] }),
  }),
}))

const stigs = [{ benchmarkId: 'RHEL_9', revisionStr: 'V2R1' }, { benchmarkId: 'WIN_11', revisionStr: 'V1R3' }]
vi.mock('../shared/api/assetsApi.js', () => ({
  fetchAsset: vi.fn(async () => ({ name: 'web-01' })),
  fetchAssetStigs: vi.fn(async () => stigs),
}))
vi.mock('../shared/api/collectionsApi.js', () => ({
  fetchCollectionStig: vi.fn(async () => null),
  fetchCollectionStigs: vi.fn(async () => stigs),
}))
vi.mock('../shared/api/stigsApi.js', () => ({
  fetchStigRevisions: vi.fn(async () => []),
}))

// Route components are irrelevant to the URL; stub them so navigation doesn't load the app
const Stub = { render: () => null }
for (const path of [
  '../features/Home/components/Home.vue',
  '../features/CollectionView/components/CollectionView.vue',
  '../features/MetaCollectionView/components/MetaCollectionView.vue',
  '../features/AssetReview/components/AssetReview.vue',
  '../features/CollectionReview/components/CollectionReview.vue',
  '../features/STIGLibrary/components/StigLibrary.vue',
  '../features/NotFound/components/NotFound.vue',
]) {
  vi.doMock(path, () => ({ default: Stub }))
}

const { default: router } = await import('./index.js')
const { useAppBreadcrumb } = await import('../features/MenuBar/composables/useAppBreadcrumb.js')
const { forgetViews } = await import('./lastViews.js')
const { notFoundLocation } = await import('./notFound.js')

let breadcrumb
let wrapper

async function go(location) {
  await router.push(location)
  await flushPromises()
}

// Actions, as the user would trigger them
const crumb = label => async () => {
  const item = breadcrumb.breadcrumbItems.value.find(i => i.label === label)
  expect(item?.route, `clickable crumb "${label}"`).toBeTruthy()
  await go(item.route)
}
const pickStig = id => async () => {
  breadcrumb.navigateToStig(id)
  await flushPromises()
}
const pickRevision = rev => async () => {
  breadcrumb.navigateToRevision(rev)
  await flushPromises()
}
const pickCollection = id => async () => {
  breadcrumb.navigateToCollection(id)
  await flushPromises()
}
const navRail = path => () => go(path)

const assetReview = '/collection/5/asset/12/stig/RHEL_9/revision/V2R1'
const collectionReview = '/collection/5/benchmark/RHEL_9/revision/V2R1'
const library = '/stig-library/RHEL_9/V2R1'

beforeEach(async () => {
  forgetViews()
  await router.push('/')
  wrapper = mount({ setup() {
    breadcrumb = useAppBreadcrumb()
    return () => null
  } }, { global: { plugins: [router] } })
})

afterEach(() => wrapper.unmount())

describe('navigation matrix', () => {
  // [from, action name, action, expected]
  it.each([
    // Breadcrumbs. Nothing is remembered yet, so the collection crumb opens the default tab;
    // on a tab it opens the STIGs tab (as last left there), never another tab
    [`${assetReview}?labelName=web`, 'Collections crumb', crumb('Collections'), '/collections'],
    [`${assetReview}?labelName=web&ruleId=SV-1`, 'collection crumb', crumb('Five'), '/collection/5/stigs?labelName=web'],
    [`${collectionReview}?labelName=web&ruleId=SV-1`, 'collection crumb', crumb('Five'), '/collection/5/stigs?labelName=web'],
    ['/collection/5/findings?agg=ruleId&sel=SV-1&labelName=web', 'collection crumb', crumb('Five'), '/collection/5/stigs?labelName=web'],
    ['/collection/5/assets?labelName=prod&labelMatch=null&foo=bar', 'collection crumb', crumb('Five'), '/collection/5/stigs?labelMatch=null&labelName=prod'],
    ['/collection/5/management', 'collection crumb', crumb('Five'), '/collection/5/stigs'],
    [`${library}?ruleId=SV-1`, 'STIG Library crumb', crumb('STIG Library'), '/stig-library'],

    // Breadcrumb pickers
    [`${assetReview}?labelName=web&ruleId=SV-1`, 'STIG picker', pickStig('WIN_11'), '/collection/5/asset/12/stig/WIN_11/revision/V1R3?labelName=web'],
    [`${assetReview}?labelMatch=null&ruleId=SV-1`, 'revision picker', pickRevision('V2R2'), '/collection/5/asset/12/stig/RHEL_9/revision/V2R2?labelMatch=null'],
    [`${collectionReview}?labelName=web&ruleId=SV-1`, 'STIG picker', pickStig('WIN_11'), '/collection/5/benchmark/WIN_11/revision/V1R3?labelName=web'],
    [`${collectionReview}?labelName=web&ruleId=SV-1`, 'revision picker', pickRevision('V2R2'), '/collection/5/benchmark/RHEL_9/revision/V2R2?labelName=web'],
    [`${collectionReview}?labelName=web`, 'collection picker', pickCollection('7'), '/collection/7/stigs'],
    [`${assetReview}?labelName=web`, 'collection picker', pickCollection('7'), '/collection/7/stigs'],
    ['/collection/5/assets?asset=12&labelName=web', 'collection picker', pickCollection('7'), '/collection/7/assets'],
    ['/collection/5/findings?agg=ruleId&sel=SV-1', 'collection picker', pickCollection('7'), '/collection/7/findings'],
  ])('%s → %s', async (from, _, action, expected) => {
    await go(from)
    await action()
    expect(router.currentRoute.value.fullPath).toBe(expected)
  })
})

// From a review page the collection crumb reopens the tab and selection last left there, with the current label filter
describe('collection crumb returns to the last view', () => {
  it('reopens Findings as it was left', async () => {
    await go('/collection/5/findings?agg=ruleId&sel=SV-1&labelName=web')
    await go(`${assetReview}?labelName=web&ruleId=SV-1`)
    await crumb('Five')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/5/findings?labelName=web&agg=ruleId&sel=SV-1')
  })

  it('applies the current label filter, not the one the tab was left with', async () => {
    await go('/collection/5/stigs?stig=RHEL_9&labelName=web')
    await go(`${collectionReview}?labelName=web`)
    await go(`${collectionReview}?labelName=db`)
    await crumb('Five')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/5/stigs?labelName=db&stig=RHEL_9')
  })

  it('remembers each collection separately', async () => {
    await go('/collection/5/findings?agg=ruleId')
    await go('/collection/7/assets?asset=3')
    await go('/collection/7/asset/3/stig/RHEL_9/revision/V2R1')
    await crumb('Seven')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/7/assets?asset=3')
  })

  it('keeps the label filter off a remembered Management tab', async () => {
    await go('/collection/5/management')
    await go(`${assetReview}?labelName=web`)
    await crumb('Five')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/5/management')
  })

  it('on a tab, opens the STIGs tab with the STIG last selected there', async () => {
    await go('/collection/5/stigs?stig=RHEL_9&labelName=web')
    await go('/collection/5/findings?agg=ruleId&labelName=web')
    await crumb('Five')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/5/stigs?labelName=web&stig=RHEL_9')
  })

  it('on the STIGs tab, keeps its selection', async () => {
    await go('/collection/5/stigs?stig=WIN_11')
    await crumb('Five')()
    expect(router.currentRoute.value.fullPath).toBe('/collection/5/stigs?stig=WIN_11')
  })

  it('shows the restored URL as the crumb link', async () => {
    await go('/collection/5/assets?asset=12')
    await go(assetReview)
    expect(router.resolve(breadcrumb.breadcrumbItems.value.find(i => i.label === 'Five').route).fullPath).toBe('/collection/5/assets?asset=12')
  })
})

describe('sTIG Library entry', () => {
  it('nav rail returns to the last STIG Library page', async () => {
    await go(`${library}?ruleId=SV-1`)
    await go('/collections')
    await navRail('/stig-library')()
    expect(router.currentRoute.value.fullPath).toBe(`${library}?ruleId=SV-1`)
  })

  it('the /library alias returns to the last STIG Library page', async () => {
    await go(`${library}?ruleId=SV-1`)
    await go('/collections')
    await navRail('/library')()
    expect(router.currentRoute.value.fullPath).toBe(`${library}?ruleId=SV-1`)
  })

  it('nav rail opens the list when the list was the last page', async () => {
    await go(library)
    await go('/stig-library')
    await go('/collections')
    await navRail('/stig-library')()
    expect(router.currentRoute.value.fullPath).toBe('/stig-library')
  })

  it('nav rail opens the list after a STIG Library page turned out bad', async () => {
    await go(library)
    await go('/stig-library/BOGUS')
    // StigLibrary finds the STIG unknown and replaces to the 404 page
    await router.replace(notFoundLocation(router.currentRoute.value))
    await flushPromises()
    await navRail('/stig-library')()
    expect(router.currentRoute.value.fullPath).toBe('/stig-library')
  })

  it('nav rail opens the list on first visit', async () => {
    await navRail('/stig-library')()
    expect(router.currentRoute.value.fullPath).toBe('/stig-library')
  })

  it('the crumb stays on the list instead of bouncing back to the STIG', async () => {
    await go(`${library}?ruleId=SV-1`)
    await crumb('STIG Library')()
    expect(router.currentRoute.value.fullPath).toBe('/stig-library')

    // and the list is now the page the nav rail reopens
    await go('/collections')
    await navRail('/stig-library')()
    expect(router.currentRoute.value.fullPath).toBe('/stig-library')
  })
})
