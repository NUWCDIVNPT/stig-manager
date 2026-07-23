import { ref, toValue, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { sortByName } from '../lib/displaySort.js'

/**
 * Shared machinery for the live-apply detail panels (UserProperties,
 * UserGroupProperties): the detail fetch keyed to the list selection, the
 * collection grant picker models, and applyPatch with stale-selection guards.
 *
 * @param {object} options
 * @param {Function} options.selectedId - getter for the selected row's id
 * @param {Function} options.fetchDetail - (id) => Promise<record>
 * @param {Function} options.patchDetail - (id, body) => Promise<record>
 * @param {Array<import('vue').Ref>} options.sourcesLoading - picker-source
 *   isLoading refs that gate the first detail fetch
 * @param {import('vue').Ref} options.allCollections - grant picker source
 * @param {Function} options.extractDirectGrants - (record) => the record's
 *   direct collectionGrants
 * @param {Function} options.rebuildModels - (record) => void, rebuilds the
 *   panel-specific fields and member pane
 * @param {Function} [options.onPatchError] - (err, body, {stillSelected}) =>
 *   boolean; return true to skip the global error modal and resync
 * @param {Function} options.emit - component emit, used for 'updated'
 * @returns {object} { detail, detailLoading, detailError, availableCollections,
 *   directGrants, grantPickerGen, loadDetail, onDetailRetry, applyPatch,
 *   onGrantsTargetUpdate }
 */
export function useLiveApplyDetailPanel({
  selectedId,
  fetchDetail,
  patchDetail,
  sourcesLoading,
  allCollections,
  extractDirectGrants,
  rebuildModels,
  onPatchError,
  emit,
}) {
  const { triggerError } = useGlobalError()

  const availableCollections = ref([])
  const directGrants = ref([])
  // Remount key for CollectionGrantPickList: it copies its props once on
  // mount, so rebuilding the lists (selection change, error resync) must
  // remount it.
  const grantPickerGen = ref(0)

  // Splits the picker source into granted/available. Called only on selection
  // change and error resync — successful live-applies leave the picklists
  // alone since they already reflect the admin's intent.
  function rebuildGrantModels(record) {
    const grants = extractDirectGrants(record).map(grant => ({
      collectionId: grant.collection.collectionId,
      name: grant.collection.name,
      roleId: grant.roleId,
    }))
    directGrants.value = sortByName(grants)
    const grantedIds = new Set(grants.map(g => String(g.collectionId)))
    availableCollections.value = sortByName(
      allCollections.value
        .filter(c => !grantedIds.has(String(c.collectionId)))
        .map(({ collectionId, name }) => ({ collectionId, name })),
    )
    grantPickerGen.value++
  }

  const { state: detail, isLoading: detailLoading, error: detailError, execute: loadDetail } = useAsyncState(
    async () => {
      const requestedId = toValue(selectedId)
      const record = await fetchDetail(requestedId)
      // The selection may have moved on while the fetch was in flight; the
      // generation guard in useAsyncState discards the stale state, but the
      // model rebuilds are side effects and need their own check.
      if (String(requestedId) !== String(toValue(selectedId))) {
        return null
      }
      rebuildModels(record)
      rebuildGrantModels(record)
      return record
    },
    { initialState: null, immediate: false, onError: null },
  )

  // Refetch only when the selected id changes; table reloads re-point the
  // selection at a fresh object with the same id and must not reset the panel.
  // The watch getter returns a fresh array each run (compared by reference),
  // so the callback fires on every re-point — the id must be checked explicitly.
  let requestedDetailId = null
  watch(
    () => [toValue(selectedId), ...sourcesLoading.map(loading => toValue(loading))],
    ([id, ...loading]) => {
      if (!id) {
        requestedDetailId = null
        return
      }
      if (loading.every(isLoading => !isLoading) && String(id) !== requestedDetailId) {
        requestedDetailId = String(id)
        loadDetail()
      }
    },
    { immediate: true },
  )

  // A failed fetch must not leave the previous record rendered under the new
  // selection, and must clear the id guard so a refresh or reselect retries.
  watch(detailError, (err) => {
    if (err) {
      detail.value = null
      requestedDetailId = null
    }
  })

  function onDetailRetry() {
    requestedDetailId = String(toValue(selectedId))
    loadDetail()
  }

  // Live-apply: each committed edit PATCHes immediately (legacy behavior). On
  // unhandled failure the panel refetches to resync with the server state.
  // The selection may change while the request is in flight; the response
  // must not overwrite (or trigger a refetch of) the newly selected record's
  // panel. The table refresh via 'updated' is still wanted either way.
  async function applyPatch(body) {
    const id = toValue(selectedId)
    try {
      const updated = await patchDetail(id, body)
      if (String(id) === String(toValue(selectedId))) {
        detail.value = updated
      }
      emit('updated', updated)
    }
    catch (err) {
      const stillSelected = String(id) === String(toValue(selectedId))
      if (onPatchError?.(err, body, { stillSelected })) {
        return
      }
      triggerError(err)
      if (stillSelected) {
        await loadDetail()
      }
    }
  }

  function onGrantsTargetUpdate(target) {
    directGrants.value = target
    applyPatch({
      collectionGrants: target.map(grant => ({
        collectionId: String(grant.collectionId),
        roleId: Number(grant.roleId),
      })),
    })
  }

  return {
    detail,
    detailLoading,
    detailError,
    availableCollections,
    directGrants,
    grantPickerGen,
    loadDetail,
    onDetailRetry,
    applyPatch,
    onGrantsTargetUpdate,
  }
}
