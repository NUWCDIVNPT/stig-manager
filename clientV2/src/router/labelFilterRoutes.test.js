import { describe, expect, it, vi } from 'vitest'

vi.mock('../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ isAdmin: { value: false }, hasCollectionAccess: () => true, getCollectionRoleId: () => 4 }),
}))

const { default: router } = await import('./index.js')

const params = { collectionId: '1', assetId: '2', benchmarkId: 'RHEL_8', revisionStr: 'V1R1' }

// MenuBar shows the label filter on routes with meta.labelFilter
describe('label filter routes', () => {
  it.each(['collection-stigs', 'collection-assets', 'collection-labels', 'collection-findings', 'collection-benchmark-review'])(
    '%s shows the label filter',
    (name) => {
      expect(router.resolve({ name, params }).meta.labelFilter).toBe(true)
    },
  )

  it.each(['collection-management', 'collection-asset-review', 'collections'])(
    '%s does not show the label filter',
    (name) => {
      expect(router.resolve({ name, params }).meta.labelFilter).toBeFalsy()
    },
  )
})
