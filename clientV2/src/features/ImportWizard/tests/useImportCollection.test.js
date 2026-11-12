import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const fetchCollectionMock = vi.fn()
const getCollectionRoleIdMock = vi.fn()

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollection: (...args) => fetchCollectionMock(...args),
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ getCollectionRoleId: getCollectionRoleIdMock }),
}))

let useImportCollection
beforeEach(async () => {
  fetchCollectionMock.mockReset()
  getCollectionRoleIdMock.mockReset()
  ;({ useImportCollection } = await import('../composables/useImportCollection.js'))
})

afterEach(() => {
  vi.resetModules()
})

function collectionShape(overrides = {}) {
  return {
    collectionId: '7',
    settings: {
      status: { canAccept: true, minAcceptGrant: 3 },
      fields: { detail: { enabled: 'always' } },
      importOptions: { allowCustom: true },
      ...overrides.settings,
    },
    ...overrides,
  }
}

describe('useImportCollection', () => {
  describe('initial state', () => {
    it('starts with no collection and no error', () => {
      const { collection, collectionError, canAccept, fieldSettings, showCustomizeCb, allowCustom } = useImportCollection('7')
      expect(collection.value).toBeNull()
      expect(collectionError.value).toBeNull()
      expect(canAccept.value).toBe(false)
      expect(fieldSettings.value).toBeUndefined()
      expect(showCustomizeCb.value).toBe(false)
      expect(allowCustom.value).toBe(false)
    })
  })

  describe('loadCollection', () => {
    it('populates collection on success', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      const { collection, collectionError, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(fetchCollectionMock).toHaveBeenCalledWith('7')
      expect(collection.value).toEqual(collectionShape())
      expect(collectionError.value).toBeNull()
    })

    it('captures fetch error message and leaves collection null', async () => {
      fetchCollectionMock.mockRejectedValue(new Error('boom'))
      const { collection, collectionError, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(collection.value).toBeNull()
      expect(collectionError.value).toBe('boom')
    })

    it('clears a prior error when called again successfully', async () => {
      fetchCollectionMock.mockRejectedValueOnce(new Error('first fail'))
      const { collectionError, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(collectionError.value).toBe('first fail')

      fetchCollectionMock.mockResolvedValueOnce(collectionShape())
      await loadCollection()
      expect(collectionError.value).toBeNull()
    })

    it('unwraps a ref-shaped collectionId', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      const id = ref('42')
      const { loadCollection } = useImportCollection(id)
      await loadCollection()
      expect(fetchCollectionMock).toHaveBeenCalledWith('42')
    })
  })

  describe('canAccept', () => {
    it('is false when status.canAccept is false', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape({
        settings: { status: { canAccept: false, minAcceptGrant: 1 }, fields: {}, importOptions: {} },
      }))
      getCollectionRoleIdMock.mockReturnValue(4)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(false)
    })

    it('is false when status is missing entirely', async () => {
      fetchCollectionMock.mockResolvedValue({ collectionId: '7', settings: { fields: {}, importOptions: {} } })
      getCollectionRoleIdMock.mockReturnValue(4)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(false)
    })

    it('is false when roleId is null even if canAccept is true', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      getCollectionRoleIdMock.mockReturnValue(null)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(false)
    })

    it('is false when roleId is below minAcceptGrant', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      getCollectionRoleIdMock.mockReturnValue(2)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(false)
    })

    it('is true when roleId meets minAcceptGrant', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      getCollectionRoleIdMock.mockReturnValue(3)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(true)
    })

    it('is true when roleId exceeds minAcceptGrant', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      getCollectionRoleIdMock.mockReturnValue(10)
      const { canAccept, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(canAccept.value).toBe(true)
    })
  })

  describe('fieldSettings / showCustomizeCb / allowCustom', () => {
    it('exposes collection.settings.fields once loaded', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      const { fieldSettings, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(fieldSettings.value).toEqual({ detail: { enabled: 'always' } })
    })

    it('showCustomizeCb / allowCustom both reflect settings.importOptions.allowCustom', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape({
        settings: { status: { canAccept: false, minAcceptGrant: 1 }, fields: {}, importOptions: { allowCustom: false } },
      }))
      const { showCustomizeCb, allowCustom, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(showCustomizeCb.value).toBe(false)
      expect(allowCustom.value).toBe(false)
    })

    it('only treats strict `true` (not truthy) as allowCustom', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape({
        settings: { status: { canAccept: false, minAcceptGrant: 1 }, fields: {}, importOptions: { allowCustom: 'yes' } },
      }))
      const { showCustomizeCb, allowCustom, loadCollection } = useImportCollection('7')
      await loadCollection()
      expect(showCustomizeCb.value).toBe(false)
      expect(allowCustom.value).toBe(false)
    })
  })

  describe('reset', () => {
    it('clears collection and error', async () => {
      fetchCollectionMock.mockResolvedValue(collectionShape())
      const { collection, collectionError, loadCollection, reset } = useImportCollection('7')
      await loadCollection()
      expect(collection.value).not.toBeNull()

      reset()
      expect(collection.value).toBeNull()
      expect(collectionError.value).toBeNull()
    })
  })
})
