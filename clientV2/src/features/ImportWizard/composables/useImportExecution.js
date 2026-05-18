import { ref, toValue } from 'vue'
import { createAsset, postReviewsByAsset, updateAsset } from '../api/importResultsApi.js'

export function useImportExecution({ collectionId, canUpdateAssetProps, parseResults, importOptions, allowNewObjects, onImported }) {
  const importProgressText = ref('')
  const importStatusRows = ref([])
  const importIsDone = ref(false)
  const importCancelled = ref(false)
  const selectedStatusRow = ref(null)

  let abortController = null

  async function runImport() {
    importStatusRows.value = []
    importIsDone.value = false
    importCancelled.value = false
    abortController = new AbortController()
    const signal = abortController.signal

    const taskAssets = parseResults.value.taskAssets
    const doUpdateAssetProps = (importOptions.value?.updateAssetProps ?? false) && toValue(canUpdateAssetProps)

    for (const taskAsset of taskAssets.values()) {
      if (importCancelled.value) { return }
      importProgressText.value = taskAsset.assetProps.name

      let assetId = taskAsset.assetProps.assetId
      let statusRow = { assetName: taskAsset.assetProps.name, assetId, created: false, addedStigs: false }

      try {
        const needsWrite = allowNewObjects.value && (
          !taskAsset.knownAsset
          || taskAsset.hasNewAssignment
          || ((taskAsset.hasUpdatedAssetProps ?? false) && doUpdateAssetProps)
        )
        if (needsWrite) {
          const apiAsset = await _doImportAsset(taskAsset, doUpdateAssetProps, signal)
          assetId = apiAsset.assetId
          statusRow = { assetName: apiAsset.name, assetId: apiAsset.assetId, created: !taskAsset.knownAsset, addedStigs: taskAsset.hasNewAssignment }
        }
        else if (!assetId) {
          importStatusRows.value.push({
            ...statusRow,
            error: 'Skipped: asset does not exist and new-object creation is disabled',
            inserted: 0,
            updated: 0,
            rejected: [],
          })
          continue
        }

        let reviewResult = { inserted: 0, updated: 0, rejected: [] }
        let reviewsArray = []
        for (const benchmarkId of taskAsset.checklists.keys()) {
          reviewsArray = reviewsArray.concat(taskAsset.checklists.get(benchmarkId)[0].reviews)
        }
        if (reviewsArray.length > 0) {
          const apiResp = await postReviewsByAsset(toValue(collectionId), assetId, reviewsArray, { signal })
          reviewResult = { inserted: apiResp.affected.inserted, updated: apiResp.affected.updated, rejected: apiResp.rejected }
        }
        importStatusRows.value.push({ ...statusRow, ...reviewResult })
      }
      catch (e) {
        if (importCancelled.value) { return }
        importStatusRows.value.push({ ...statusRow, error: e.message, inserted: 0, updated: 0, rejected: [] })
      }
    }

    if (importCancelled.value) { return }
    importProgressText.value = 'Finished'
    importIsDone.value = true
    onImported?.()
  }

  function cancel() {
    importCancelled.value = true
    abortController?.abort()
  }

  async function _doImportAsset(taskAsset, doUpdateAssetProps, signal) {
    if (taskAsset.knownAsset) {
      const body = { collectionId: taskAsset.assetProps.collectionId }
      if (taskAsset.hasNewAssignment) { body.stigs = taskAsset.assetProps.stigs }
      if ((taskAsset.hasUpdatedAssetProps ?? false) && doUpdateAssetProps) {
        const { ip, fqdn, mac, noncomputing, metadata } = taskAsset.assetProps
        Object.assign(body, { ip, fqdn, mac, noncomputing, metadata })
      }
      return updateAsset(taskAsset.assetProps.assetId, body, { signal })
    }
    return createAsset(taskAsset.assetProps, { signal })
  }

  function reset() {
    abortController = null
    importProgressText.value = ''
    importStatusRows.value = []
    importIsDone.value = false
    importCancelled.value = false
    selectedStatusRow.value = null
  }

  return {
    importProgressText,
    importStatusRows,
    importIsDone,
    importCancelled,
    selectedStatusRow,
    runImport,
    cancel,
    reset,
  }
}
