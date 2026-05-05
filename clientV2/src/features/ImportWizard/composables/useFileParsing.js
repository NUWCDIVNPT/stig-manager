import { reviewsFromCkl, reviewsFromCklb, reviewsFromScc, TaskObject } from '@nuwcdivnpt/stig-manager-client-modules'
import { computed, ref, toValue } from 'vue'
import { fetchCollectionAssetsWithStigs, fetchInstalledStigs, fetchScapMap } from '../api/importResultsApi.js'

export function useFileParsing({ collectionId, createObjects, fileQueue, fieldSettings, canAccept, importOptions }) {
  const parseProgressValue = ref(0)
  const parseProgressText = ref('')
  const parseProgressCurrent = ref(0)
  const parseProgressTotal = ref(0)
  const parseResults = ref({
    taskAssets: null,
    rows: [],
    dupedRows: [],
    errors: [],
    hasDuplicates: false,
    stopWizard: false,
  })

  const previewCreateObjects = ref(true)
  const filteredPreviewRows = computed(() => {
    if (!previewCreateObjects.value) {
      return parseResults.value.rows.filter(r => r.taskAsset.assetProps.assetId && !r.checklist.newAssignment)
    }
    return parseResults.value.rows
  })

  async function startParsing() {
    parseProgressValue.value = 0
    parseProgressText.value = ''
    parseProgressCurrent.value = 0
    parseProgressTotal.value = 0

    const [apiAssets, apiStigs, apiScapMapsRaw] = await Promise.all([
      fetchCollectionAssetsWithStigs(toValue(collectionId)),
      fetchInstalledStigs(),
      fetchScapMap(),
    ])

    const scapBenchmarkMap = new Map(apiScapMapsRaw.map(r => [r.scapBenchmarkId, r.benchmarkId]))
    const rawSuccess = []; const rawFail = []
    const files = fileQueue.value
    parseProgressTotal.value = files.length
    let handled = 0

    for (const file of files) {
      parseProgressText.value = file.name
      parseProgressCurrent.value = handled
      parseProgressValue.value = Math.round((handled / files.length) * 100)

      const ext = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase()
      let data
      try { data = await _readTextFileAsync(file) }
      catch (e) { rawFail.push({ file, error: `Could not read file: ${e.message}` }); handled++; continue }

      const common = {
        data,
        fieldSettings: fieldSettings.value,
        allowAccept: canAccept.value,
        importOptions: importOptions.value,
        sourceRef: file,
      }
      try {
        if (ext === 'ckl') { rawSuccess.push(reviewsFromCkl(common)) }
        else if (ext === 'cklb') { rawSuccess.push(reviewsFromCklb(common)) }
        else if (ext === 'xml') { rawSuccess.push(reviewsFromScc({ ...common, scapBenchmarkMap })) }
        else { throw new Error(`Unsupported extension: .${ext}`) }
      }
      catch (e) { rawFail.push({ file, error: e.message }) }

      handled++
      parseProgressCurrent.value = handled
      parseProgressValue.value = Math.round((handled / files.length) * 100)
    }

    parseProgressText.value = ''

    const tasks = new TaskObject({
      apiAssets,
      apiStigs,
      parsedResults: rawSuccess,
      options: {
        collectionId: toValue(collectionId),
        createObjects: toValue(createObjects),
        strictRevisionCheck: false,
      },
    })

    const taskErrors = tasks.errors.map(e => ({ file: e.sourceRef, error: e.message }))
    const allErrors = [...rawFail, ...taskErrors]
    const rows = []; const dupedRows = []
    let hasDuplicates = false

    for (const taskAsset of tasks.taskAssets.values()) {
      for (const assetStigChecklists of taskAsset.checklists.values()) {
        if (assetStigChecklists.length > 1) {
          hasDuplicates = true
          assetStigChecklists.sort((a, b) => b.sourceRef.lastModified - a.sourceRef.lastModified)
          dupedRows.push(...assetStigChecklists.slice(1).map(checklist => ({ taskAsset, checklist })))
        }
        rows.push({ taskAsset, checklist: assetStigChecklists[0] })
      }
      for (const ic of taskAsset.checklistsIgnored) {
        allErrors.push({ file: ic.sourceRef, error: `Ignoring ${ic.benchmarkId} ${ic.revisionStr}. ${ic.ignored}` })
      }
    }

    parseResults.value = {
      taskAssets: tasks.taskAssets,
      rows,
      dupedRows,
      errors: allErrors,
      hasDuplicates,
      stopWizard: rows.length === 0,
    }
  }

  function _readTextFileAsync(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  function reset() {
    parseProgressValue.value = 0
    parseProgressText.value = ''
    parseProgressCurrent.value = 0
    parseProgressTotal.value = 0
    parseResults.value = { taskAssets: null, rows: [], dupedRows: [], errors: [], hasDuplicates: false, stopWizard: false }
    previewCreateObjects.value = true
  }

  return {
    parseProgressValue,
    parseProgressText,
    parseProgressCurrent,
    parseProgressTotal,
    parseResults,
    previewCreateObjects,
    filteredPreviewRows,
    startParsing,
    reset,
  }
}
