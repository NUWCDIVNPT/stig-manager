import { computed, ref, watch } from 'vue'
import { readStoredValue, storeValue } from '../../../shared/lib/localStorage.js'

export const UNREVIEWED_OPTIONS = [
  { label: 'Never', value: 'never' },
  { label: 'Having comments', value: 'commented' },
  { label: 'Always', value: 'always' },
]

export const UNREVIEWED_COMMENTED_OPTIONS = [
  { label: 'Informational', value: 'informational' },
  { label: 'Not Reviewed', value: 'notchecked' },
]

export const EMPTY_FIELD_OPTIONS = [
  { label: 'Ignored', value: 'ignore' },
  { label: 'Replaced', value: 'replace' },
  { label: 'Imported', value: 'import' },
]

export function useImportOptions({ collection, canAccept }) {
  const importOptions = ref(null)
  const isCustomizing = ref(false)

  const STATUS_OPTIONS_BASE = [
    { label: 'Keep Existing', value: 'null' },
    { label: 'Saved', value: 'saved' },
    { label: 'Submitted', value: 'submitted' },
  ]
  const STATUS_OPTION_ACCEPTED = { label: 'Accepted', value: 'accepted' }
  const statusOptions = computed(() =>
    canAccept.value ? [...STATUS_OPTIONS_BASE, STATUS_OPTION_ACCEPTED] : STATUS_OPTIONS_BASE,
  )

  watch(isCustomizing, (val) => {
    if (!val) {
      restoreCollectionDefaults()
    }
    else {
      const stored = JSON.parse(readStoredValue('wizardImportOptions', 'null'))
      if (stored) { importOptions.value = stored }
    }
  })

  watch(importOptions, (val) => {
    if (isCustomizing.value && val) { storeValue('wizardImportOptions', JSON.stringify(val)) }
  }, { deep: true })

  function restoreCollectionDefaults() {
    if (!collection.value) { return }
    const opts = JSON.parse(JSON.stringify(collection.value.settings.importOptions))
    applyAutoStatusGuard(opts)
    importOptions.value = opts
  }

  function applyAutoStatusGuard(opts) {
    for (const key of ['fail', 'notapplicable', 'pass']) {
      if (opts.autoStatus?.[key] === 'accepted' && !canAccept.value) { opts.autoStatus[key] = 'submitted' }
    }
  }

  function reset() {
    importOptions.value = null
    isCustomizing.value = false
  }

  return {
    importOptions,
    isCustomizing,
    statusOptions,
    UNREVIEWED_OPTIONS,
    UNREVIEWED_COMMENTED_OPTIONS,
    EMPTY_FIELD_OPTIONS,
    restoreCollectionDefaults,
    reset,
  }
}
