import { computed, reactive, ref, unref, watch } from 'vue'
import { fetchCollectionAssetSummary, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { createAsset, fetchAssetWithStigs, replaceAsset } from '../api/assetManageApi.js'
import { useLabelSelection } from './useLabelSelection.js'

/**
 * State + actions for the asset create/edit form. The host component owns
 * dialog visibility and PrimeVue passthrough objects; everything else lives
 * here. Label multi-select is delegated to useLabelSelection (returned as
 * `labels`); STIG assignment is exposed via `pickListValue`.
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

  const isValid = computed(() => form.name.trim().length > 0)

  const pickListValue = computed({
    get: () => [availableStigs.value, assignedStigs.value],
    set: ([avail, assigned]) => {
      availableStigs.value = avail
      assignedStigs.value = assigned
    },
  })

  // Label multi-select operates on form.labelIds as its source of truth.
  const labels = useLabelSelection(collectionLabels, computed({
    get: () => form.labelIds,
    set: (v) => { form.labelIds = v },
  }))

  const { isLoading, execute: loadFormData } = useAsyncState(
    async () => {
      const [labelList, stigs] = await Promise.all([
        fetchCollectionLabels(unref(collectionId)),
        fetchStigs(),
      ])
      collectionLabels.value = labelList ?? []
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
    labels.labelFilter.value = ''
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
    const labelNames = form.labelIds.map(id => labels.getLabelById(id)?.name).filter(Boolean)
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
    assignedStigs,
    pickListValue,
    collectionLabels,
    labels,

    initialize,
    buildPayload,
    save,
  }
}
