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
  // Breadcrumbs carrying the filter: navigationMatrix.test.js
})
