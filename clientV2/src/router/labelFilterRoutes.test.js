import { describe, expect, it, vi } from 'vitest'

vi.mock('../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ isAdmin: { value: false }, hasCollectionAccess: () => true, getCollectionRoleId: () => 4 }),
}))

const { default: router } = await import('./index.js')

const collection = { collectionId: '1' }
const review = { ...collection, benchmarkId: 'RHEL_8', revisionStr: 'V1R1' }
const assetReview = { ...review, assetId: '2' }

// MenuBar shows the label filter on routes with meta.labelFilter
describe('label filter routes', () => {
  it.each([
    ['collection-stigs', collection],
    ['collection-assets', collection],
    ['collection-labels', collection],
    ['collection-findings', collection],
    ['collection-benchmark-review', review],
  ])('%s shows the label filter', (name, params) => {
    expect(router.resolve({ name, params }).meta.labelFilter).toBe(true)
  })

  it.each([
    ['collection-management', collection],
    ['collection-asset-review', assetReview],
    ['collections', {}],
  ])('%s does not show the label filter', (name, params) => {
    expect(router.resolve({ name, params }).meta.labelFilter).toBeFalsy()
  })

  // The collection-name crumb keeps the label filter; the dashboard redirect keeps the query
  it.each([
    ['collection-assets', collection],
    ['collection-benchmark-review', review],
  ])('%s collection crumb carries the label filter', (name, params) => {
    const route = router.resolve({ name, params, query: { labelName: 'prod', labelMatch: 'null', foo: 'bar' } })
    const crumb = route.matched[0].meta.breadcrumbs[1]
    expect(crumb.route(route)).toEqual({
      name: 'collection',
      params: { collectionId: '1' },
      query: { labelName: ['prod'], labelMatch: 'null' },
    })
  })
})
