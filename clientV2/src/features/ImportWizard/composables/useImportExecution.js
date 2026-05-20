import { ref, toValue } from 'vue'
import { createAsset, postReviewsByAsset, updateAsset } from '../api/importResultsApi.js'

export function useImportExecution({ collectionId, canUpdateAssetProps, parseResults, importOptions, allowNewObjects, onImported }) {
  const importProgressText = ref('')
  const importStatusRows = ref([])
  const importIsDone = ref(false)
  const selectedStatusRow = ref(null)

  async function runImport() {
    importStatusRows.value = []
    importIsDone.value = false

    const taskAssets = parseResults.value.taskAssets
    const doUpdateAssetProps = (importOptions.value?.updateAssetProps ?? false) && toValue(canUpdateAssetProps)

    for (const taskAsset of taskAssets.values()) {
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
          const apiAsset = await _doImportAsset(taskAsset, doUpdateAssetProps)
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
          const apiResp = await postReviewsByAsset(toValue(collectionId), assetId, reviewsArray)
          reviewResult = { inserted: apiResp.affected.inserted, updated: apiResp.affected.updated, rejected: apiResp.rejected }
        }
        importStatusRows.value.push({ ...statusRow, ...reviewResult })
      }
      catch (e) {
        importStatusRows.value.push({ ...statusRow, error: e.message, inserted: 0, updated: 0, rejected: [] })
      }
    }

    importProgressText.value = 'Finished'
    importIsDone.value = true
    onImported?.()
  }

  async function _doImportAsset(taskAsset, doUpdateAssetProps) {
    if (taskAsset.knownAsset) {
      const body = { collectionId: taskAsset.assetProps.collectionId }
      if (taskAsset.hasNewAssignment) { body.stigs = taskAsset.assetProps.stigs }
      if ((taskAsset.hasUpdatedAssetProps ?? false) && doUpdateAssetProps) {
        const { ip, fqdn, mac, noncomputing, metadata } = taskAsset.assetProps
        Object.assign(body, { ip, fqdn, mac, noncomputing, metadata })
      }
      return updateAsset(taskAsset.assetProps.assetId, body)
    }
    return createAsset(taskAsset.assetProps)
  }

  function reset() {
    importProgressText.value = ''
    importStatusRows.value = []
    importIsDone.value = false
    selectedStatusRow.value = null
  }

  return {
    importProgressText,
    importStatusRows,
    importIsDone,
    selectedStatusRow,
    runImport,
    reset,
  }
}
