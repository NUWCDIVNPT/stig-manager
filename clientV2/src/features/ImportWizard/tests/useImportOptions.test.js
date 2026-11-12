import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { EMPTY_FIELD_OPTIONS, UNREVIEWED_COMMENTED_OPTIONS, UNREVIEWED_OPTIONS, useImportOptions } from '../composables/useImportOptions.js'

function makeCollection(importOptions = {}) {
  return {
    collectionId: '7',
    settings: {
      importOptions: {
        autoStatus: { fail: 'submitted', notapplicable: 'submitted', pass: 'submitted' },
        unreviewed: 'never',
        unreviewedCommented: 'informational',
        emptyDetail: 'replace',
        emptyComment: 'ignore',
        allowCustom: true,
        ...importOptions,
      },
    },
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('useImportOptions', () => {
  describe('static exports', () => {
    it('exports the well-known option lists', () => {
      expect(UNREVIEWED_OPTIONS).toEqual([
        { label: 'Never', value: 'never' },
        { label: 'Having comments', value: 'commented' },
        { label: 'Always', value: 'always' },
      ])
      expect(UNREVIEWED_COMMENTED_OPTIONS).toEqual([
        { label: 'Informational', value: 'informational' },
        { label: 'Not Reviewed', value: 'notchecked' },
      ])
      expect(EMPTY_FIELD_OPTIONS).toEqual([
        { label: 'Ignored', value: 'ignore' },
        { label: 'Replaced', value: 'replace' },
        { label: 'Imported', value: 'import' },
      ])
    })
  })

  describe('initial state', () => {
    it('starts with null importOptions and isCustomizing false', () => {
      const { importOptions, isCustomizing } = useImportOptions({ collection: ref(null), canAccept: ref(false) })
      expect(importOptions.value).toBeNull()
      expect(isCustomizing.value).toBe(false)
    })
  })

  describe('statusOptions', () => {
    it('omits Accepted when canAccept is false', () => {
      const { statusOptions } = useImportOptions({ collection: ref(null), canAccept: ref(false) })
      expect(statusOptions.value.map(o => o.value)).toEqual(['null', 'saved', 'submitted'])
    })

    it('appends Accepted when canAccept is true', () => {
      const { statusOptions } = useImportOptions({ collection: ref(null), canAccept: ref(true) })
      expect(statusOptions.value.map(o => o.value)).toEqual(['null', 'saved', 'submitted', 'accepted'])
    })

    it('reacts when canAccept flips', async () => {
      const canAccept = ref(false)
      const { statusOptions } = useImportOptions({ collection: ref(null), canAccept })
      expect(statusOptions.value).toHaveLength(3)
      canAccept.value = true
      await nextTick()
      expect(statusOptions.value).toHaveLength(4)
    })
  })

  describe('restoreCollectionDefaults', () => {
    it('does nothing when collection is null', () => {
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection: ref(null), canAccept: ref(true) })
      restoreCollectionDefaults()
      expect(importOptions.value).toBeNull()
    })

    it('deep-clones collection.settings.importOptions', () => {
      const collection = ref(makeCollection())
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(true) })
      restoreCollectionDefaults()
      expect(importOptions.value).toEqual(collection.value.settings.importOptions)
      expect(importOptions.value).not.toBe(collection.value.settings.importOptions)
      expect(importOptions.value.autoStatus).not.toBe(collection.value.settings.importOptions.autoStatus)
    })

    it('downgrades autoStatus.* from "accepted" to "submitted" when !canAccept', () => {
      const collection = ref(makeCollection({
        autoStatus: { fail: 'accepted', notapplicable: 'accepted', pass: 'accepted' },
      }))
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(false) })
      restoreCollectionDefaults()
      expect(importOptions.value.autoStatus).toEqual({ fail: 'submitted', notapplicable: 'submitted', pass: 'submitted' })
    })

    it('preserves "accepted" autoStatus values when canAccept is true', () => {
      const collection = ref(makeCollection({
        autoStatus: { fail: 'accepted', notapplicable: 'accepted', pass: 'accepted' },
      }))
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(true) })
      restoreCollectionDefaults()
      expect(importOptions.value.autoStatus).toEqual({ fail: 'accepted', notapplicable: 'accepted', pass: 'accepted' })
    })

    it('leaves non-"accepted" autoStatus values untouched when !canAccept', () => {
      const collection = ref(makeCollection({
        autoStatus: { fail: 'saved', notapplicable: 'submitted', pass: 'saved' },
      }))
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(false) })
      restoreCollectionDefaults()
      expect(importOptions.value.autoStatus).toEqual({ fail: 'saved', notapplicable: 'submitted', pass: 'saved' })
    })

    it('tolerates a missing autoStatus block', () => {
      const collection = ref({ collectionId: '7', settings: { importOptions: { foo: 'bar' } } })
      const { importOptions, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(false) })
      expect(() => restoreCollectionDefaults()).not.toThrow()
      expect(importOptions.value).toEqual({ foo: 'bar' })
    })
  })

  describe('isCustomizing watch', () => {
    it('restores collection defaults when toggled off', async () => {
      const collection = ref(makeCollection())
      const { importOptions, isCustomizing } = useImportOptions({ collection, canAccept: ref(true) })
      isCustomizing.value = true
      await nextTick()
      importOptions.value = { ...importOptions.value, unreviewed: 'always' }
      await nextTick()

      isCustomizing.value = false
      await nextTick()
      expect(importOptions.value.unreviewed).toBe('never')
    })

    it('loads stored options from localStorage when toggled on', async () => {
      const stored = { autoStatus: { fail: 'saved' }, unreviewed: 'always' }
      localStorage.setItem('wizardImportOptions', JSON.stringify(stored))
      const { importOptions, isCustomizing } = useImportOptions({ collection: ref(makeCollection()), canAccept: ref(true) })
      isCustomizing.value = true
      await nextTick()
      expect(importOptions.value).toEqual(stored)
    })

    it('does nothing when no stored options exist and toggled on', async () => {
      const collection = ref(makeCollection())
      const { importOptions, isCustomizing, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(true) })
      restoreCollectionDefaults()
      const before = importOptions.value
      isCustomizing.value = true
      await nextTick()
      expect(importOptions.value).toBe(before)
    })
  })

  describe('importOptions watch (persistence)', () => {
    it('persists to localStorage only while isCustomizing is true', async () => {
      const collection = ref(makeCollection())
      const { importOptions, isCustomizing, restoreCollectionDefaults } = useImportOptions({ collection, canAccept: ref(true) })
      restoreCollectionDefaults()
      await nextTick()

      importOptions.value = { ...importOptions.value, unreviewed: 'always' }
      await nextTick()
      expect(localStorage.getItem('wizardImportOptions')).toBeNull()

      isCustomizing.value = true
      await nextTick()
      importOptions.value = { ...importOptions.value, unreviewed: 'commented' }
      await nextTick()
      const persisted = JSON.parse(localStorage.getItem('wizardImportOptions'))
      expect(persisted.unreviewed).toBe('commented')
    })

    it('persists deep nested mutations while customizing', async () => {
      const collection = ref(makeCollection())
      const { importOptions, isCustomizing } = useImportOptions({ collection, canAccept: ref(true) })
      isCustomizing.value = true
      await nextTick()
      importOptions.value = { autoStatus: { fail: 'saved' } }
      await nextTick()

      importOptions.value.autoStatus.fail = 'submitted'
      await nextTick()
      const persisted = JSON.parse(localStorage.getItem('wizardImportOptions'))
      expect(persisted.autoStatus.fail).toBe('submitted')
    })

    it('does not persist when value is null', async () => {
      const { isCustomizing } = useImportOptions({ collection: ref(null), canAccept: ref(true) })
      isCustomizing.value = true
      await nextTick()
      // importOptions stays null
      expect(localStorage.getItem('wizardImportOptions')).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears importOptions and isCustomizing', async () => {
      const collection = ref(makeCollection())
      const { importOptions, isCustomizing, restoreCollectionDefaults, reset } = useImportOptions({ collection, canAccept: ref(true) })
      restoreCollectionDefaults()
      isCustomizing.value = true
      await nextTick()

      reset()
      expect(importOptions.value).toBeNull()
      expect(isCustomizing.value).toBe(false)
    })
  })
})
