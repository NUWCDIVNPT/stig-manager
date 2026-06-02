import { computed, reactive, ref, unref, watch } from 'vue'
import { fetchCollectionAssetSummary, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { createAsset, fetchAssetWithStigs, replaceAsset } from '../api/assetManageApi.js'

/**
 * State + actions for the asset create/edit form. The host component owns
 * dialog visibility and PrimeVue passthrough objects; everything else lives
 * here.
 *
 * save() returns the freshly-fetched summary row on success, `null` on a name
 * conflict (caller stays open and shows nameError), and re-throws on any other
 * error (caller closes and re-throws to its own handler).
 */
export function useAssetForm({ collectionId, assetId, visible } = {}) {
  const isEditMode = computed(() => !!unref(assetId))
  const isSubmitting = ref(false)
  const nameError = ref(null)

  const form = reactive({
    name: '',
    noncomputing: false,
    fqdn: '',
    ip: '',
    mac: '',
    labelIds: [],
  })

  const metadataRows = ref([])
  const allStigs = ref([])
  const availableStigs = ref([])
  const assignedStigs = ref([])
  const collectionLabels = ref([])
  const labelPickerIds = ref([])

  const isValid = computed(() => form.name.trim().length > 0)

  const pickListValue = computed({
    get: () => [availableStigs.value, assignedStigs.value],
    set: ([avail, assigned]) => {
      availableStigs.value = avail
      assignedStigs.value = assigned
    },
  })

  function getLabelById(id) {
    return collectionLabels.value.find(l => l.labelId === id)
  }

  function labelColor(label) {
    return normalizeColor(label?.color, '#888888')
  }

  const unselectedLabels = computed(() =>
    collectionLabels.value.filter(l => !form.labelIds.includes(l.labelId)),
  )

  function commitLabelPicker() {
    for (const id of labelPickerIds.value) {
      if (!form.labelIds.includes(id)) {
        form.labelIds.push(id)
      }
    }
    labelPickerIds.value = []
  }

  function removeLabel(id) {
    form.labelIds = form.labelIds.filter(x => x !== id)
  }

  // ── Label picker (filterable checklist + bulk select) ──────────────────────
  const labelFilter = ref('')

  const filteredLabels = computed(() => {
    const q = labelFilter.value.trim().toLowerCase()
    if (!q) {
      return collectionLabels.value
    }
    return collectionLabels.value.filter(l => l.name.toLowerCase().includes(q))
  })

  function isLabelSelected(id) {
    return form.labelIds.includes(id)
  }

  function toggleLabel(id) {
    if (form.labelIds.includes(id)) {
      form.labelIds = form.labelIds.filter(x => x !== id)
    }
    else {
      form.labelIds = [...form.labelIds, id]
    }
  }

  // True only when every currently-filtered label is selected (and there's at
  // least one), so the "select all" toggle reflects the visible subset.
  const allFilteredSelected = computed(() =>
    filteredLabels.value.length > 0
    && filteredLabels.value.every(l => form.labelIds.includes(l.labelId)),
  )

  function selectAllFiltered() {
    const ids = new Set(form.labelIds)
    for (const l of filteredLabels.value) {
      ids.add(l.labelId)
    }
    form.labelIds = [...ids]
  }

  function clearFiltered() {
    const filteredIds = new Set(filteredLabels.value.map(l => l.labelId))
    form.labelIds = form.labelIds.filter(id => !filteredIds.has(id))
  }

  function toggleAllFiltered() {
    if (allFilteredSelected.value) {
      clearFiltered()
    }
    else {
      selectAllFiltered()
    }
  }

  // Apply a single selection state across a contiguous slice of filteredLabels
  // (used by shift-click range select/deselect).
  function setLabelRange(fromIndex, toIndex, selected) {
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    const rangeIds = filteredLabels.value.slice(start, end + 1).map(l => l.labelId)
    const ids = new Set(form.labelIds)
    for (const id of rangeIds) {
      if (selected) {
        ids.add(id)
      }
      else {
        ids.delete(id)
      }
    }
    form.labelIds = [...ids]
  }

  const { isLoading, execute: loadFormData } = useAsyncState(
    async () => {
      const [labels, stigs] = await Promise.all([
        fetchCollectionLabels(unref(collectionId)),
        fetchStigs(),
      ])
      collectionLabels.value = labels ?? []
      allStigs.value = stigs ?? []

      if (isEditMode.value) {
        const asset = await fetchAssetWithStigs(unref(assetId))
        form.name = asset.name ?? ''
        form.noncomputing = asset.noncomputing ?? false
        form.fqdn = asset.fqdn ?? ''
        form.ip = asset.ip ?? ''
        form.mac = asset.mac ?? ''
        form.labelIds = (asset.labels ?? []).map(l => l.labelId)
        metadataRows.value = Object.entries(asset.metadata ?? {}).map(([key, value]) => ({ key, value }))
        const assignedIds = new Set((asset.stigs ?? []).map(s => s.benchmarkId))
        assignedStigs.value = allStigs.value.filter(s => assignedIds.has(s.benchmarkId))
        availableStigs.value = allStigs.value.filter(s => !assignedIds.has(s.benchmarkId))
      }
      else {
        availableStigs.value = [...allStigs.value]
      }
    },
    { immediate: false },
  )

  async function initialize() {
    nameError.value = null
    form.name = ''
    form.noncomputing = false
    form.fqdn = ''
    form.ip = ''
    form.mac = ''
    form.labelIds = []
    labelPickerIds.value = []
    labelFilter.value = ''
    metadataRows.value = []
    availableStigs.value = []
    assignedStigs.value = []
    await loadFormData()
  }

  if (visible) {
    watch(() => unref(visible), (open) => {
      if (open) {
        initialize()
      }
    })
  }

  function buildPayload() {
    const labelNames = form.labelIds.map(id => getLabelById(id)?.name).filter(Boolean)
    const metadata = Object.fromEntries(
      metadataRows.value.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value]),
    )
    return {
      name: form.name.trim(),
      description: null,
      noncomputing: form.noncomputing,
      fqdn: form.fqdn || null,
      ip: form.ip || null,
      mac: form.mac || null,
      collectionId: unref(collectionId),
      metadata,
      stigs: assignedStigs.value.map(s => s.benchmarkId),
      labelNames,
    }
  }

  async function save() {
    if (!isValid.value) {
      return null
    }
    nameError.value = null
    isSubmitting.value = true
    try {
      const payload = buildPayload()
      const result = isEditMode.value
        ? await replaceAsset(unref(assetId), payload)
        : await createAsset(payload)

      const metrics = await fetchCollectionAssetSummary(unref(collectionId), { assetId: result.assetId })
      return { ...(metrics?.[0] ?? {}), collection: result.collection }
    }
    catch (err) {
      const detail = String(err?.body?.detail ?? '')
      if (err?.status === 409 || detail.toLowerCase().includes('name')) {
        nameError.value = 'An asset with this name already exists in this collection.'
        return null
      }
      throw err
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    isEditMode,
    isLoading,
    isSubmitting,
    isValid,
    nameError,

    form,
    metadataRows,
    allStigs,
    availableStigs,
    assignedStigs,
    pickListValue,
    collectionLabels,
    labelPickerIds,
    unselectedLabels,

    labelFilter,
    filteredLabels,
    allFilteredSelected,

    getLabelById,
    labelColor,
    commitLabelPicker,
    removeLabel,
    isLabelSelected,
    toggleLabel,
    toggleAllFiltered,
    setLabelRange,

    initialize,
    buildPayload,
    save,
  }
}
