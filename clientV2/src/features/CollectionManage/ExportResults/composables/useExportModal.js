import { computed, ref, watch } from 'vue'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { readStoredValue, storeValue } from '../../../../shared/lib/localStorage.js'
import {
  downloadArchive,
  startCollectionExport,
} from '../api/exportResultsApi.js'
import {
  archiveFilename,
  buildDestinationOptions,
  parsePrefs,
  validateExport,
} from '../exportResultsLogic.js'

export const EXPORT_TARGETS = [
  { label: 'Zip archive', value: 'archive' },
  { label: 'Collection', value: 'collection' },
]

export const EXPORT_FORMATS = [
  { label: 'CKL', value: 'ckl', mode: 'mono' },
  { label: 'CKL (multi-STIG)', value: 'ckl', mode: 'multi' },
  { label: 'CKLB', value: 'cklb', mode: 'mono' },
  { label: 'CKLB (multi-STIG)', value: 'cklb', mode: 'multi' },
  { label: 'XCCDF', value: 'xccdf', mode: null },
]

/**
 * Pivot-agnostic export-modal logic shared by the asset- and STIG-pivot modals:
 * target / format / destination state, localStorage prefs, validation, and the
 * archive / collection submit flows.
 *
 * @param {object} props - The host component props (visible, collectionId, collectionName).
 * @param {Function} emit - The host component emit.
 * @param {object} ctx
 * @param {string} ctx.prefsKeyPrefix - localStorage key prefix (e.g. 'exportResults').
 * @param {import('vue').ComputedRef<Array>} ctx.effectiveSelections - The export selection shape.
 * @param {import('vue').Ref<boolean>} [ctx.busy] - When truthy, submission is disabled.
 */
export function useExportModal(props, emit, { prefsKeyPrefix, effectiveSelections, busy }) {
  const { user } = useCurrentUser()

  const localVisible = computed({
    get: () => props.visible,
    set: v => emit('update:visible', v),
  })

  const prefsKey = computed(() => `${prefsKeyPrefix}:${props.collectionId}`)

  const target = ref('archive')
  const selectedFormat = ref(EXPORT_FORMATS[0])
  const selectedDestinationId = ref(null)

  const destinationOptions = computed(() =>
    buildDestinationOptions(user.value?.collectionGrants, props.collectionId),
  )

  const validationMessage = computed(() => validateExport({
    target: target.value,
    count: effectiveSelections.value.length,
    destinationId: selectedDestinationId.value,
  }))

  const canSubmit = computed(() => !busy?.value && validationMessage.value === null)

  const submitLabel = computed(() =>
    target.value === 'collection' ? 'Export to collection' : 'Download archive',
  )

  // ── Prefs (localStorage) ──────────────────────────────────────────────────
  function loadPrefs() {
    const raw = readStoredValue(prefsKey.value, null)
    const next = parsePrefs(raw, EXPORT_FORMATS, destinationOptions.value, {
      target: target.value,
      format: selectedFormat.value,
      destinationId: selectedDestinationId.value,
    })
    target.value = next.target
    selectedFormat.value = next.format
    selectedDestinationId.value = next.destinationId
  }

  function savePrefs() {
    storeValue(prefsKey.value, JSON.stringify({
      target: target.value,
      formatKey: `${selectedFormat.value.value}|${selectedFormat.value.mode ?? ''}`,
      destinationId: selectedDestinationId.value,
    }))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function submitArchive() {
    const { value, mode } = selectedFormat.value
    const filename = archiveFilename(props.collectionName, value)
    try {
      const result = await downloadArchive({
        collectionId: props.collectionId,
        format: value,
        mode,
        selections: effectiveSelections.value,
        filename,
        onStreamStart: () => {
          emit('export-started', { type: 'archive', format: value, mode, filename })
        },
        onProgress: ({ bytesReceived, totalBytes }) => {
          emit('archive-export-progress', { bytesReceived, totalBytes })
        },
      })
      if (result?.via !== 'service-worker') {
        emit('archive-export-complete', { filename })
      }
    }
    catch (err) {
      emit('archive-export-error', err)
    }
  }

  async function submitCollection() {
    const dstId = selectedDestinationId.value
    const dstName = destinationOptions.value.find(d => d.value === String(dstId))?.label ?? ''
    emit('export-started', { type: 'collection', dstCollectionId: dstId, dstCollectionName: dstName })
    try {
      const response = await startCollectionExport({
        collectionId: props.collectionId,
        dstCollectionId: dstId,
        selections: effectiveSelections.value,
      })
      const { readNdjson } = await import('../../../../shared/lib/ndjsonStream.js')
      let errorEvent = null
      for await (const event of readNdjson(response)) {
        emit('collection-export-progress', event)
        if (event && event.status === 'error') {
          errorEvent = event
        }
      }
      if (errorEvent) {
        const err = new Error(errorEvent.message || 'Export failed')
        err.event = errorEvent
        emit('collection-export-error', err)
        return
      }
      emit('collection-export-complete', { dstCollectionId: dstId })
    }
    catch (err) {
      emit('collection-export-error', err)
    }
  }

  function onSubmit() {
    if (!canSubmit.value) { return }
    savePrefs()
    // Close the dialog first; the parent renders a progress window
    // and the export runs in the background.
    localVisible.value = false
    if (target.value === 'archive') {
      submitArchive()
    }
    else {
      submitCollection()
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  watch(() => props.visible, (open) => {
    if (open) { loadPrefs() }
  })

  watch(target, () => {
    if (target.value === 'collection' && !selectedDestinationId.value && destinationOptions.value.length > 0) {
      selectedDestinationId.value = destinationOptions.value[0].value
    }
  })

  return {
    localVisible,
    target,
    selectedFormat,
    selectedDestinationId,
    destinationOptions,
    validationMessage,
    canSubmit,
    submitLabel,
    EXPORT_TARGETS,
    EXPORT_FORMATS,
    onSubmit,
  }
}
