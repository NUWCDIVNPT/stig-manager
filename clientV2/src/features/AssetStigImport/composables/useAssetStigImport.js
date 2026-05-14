import { reviewsFromCkl, reviewsFromCklb, reviewsFromScc } from '@nuwcdivnpt/stig-manager-client-modules'
import { computed, ref, toValue, watch } from 'vue'
import { useImportCollection } from '../../ImportWizard/composables/useImportCollection.js'
import { useImportOptions } from '../../ImportWizard/composables/useImportOptions.js'
import {
  fetchAsset,
  fetchAssetChecklist,
  fetchScapMap,
  postReviewsByAsset,
} from '../api/assetStigImportApi.js'

const STEPS = Object.freeze({
  FILE: 'file',
  PARSING: 'parsing',
  ERROR: 'error',
  PREVIEW: 'preview',
  IMPORT_PROGRESS: 'importProgress',
  IMPORT_DONE: 'importDone',
})

export function useAssetStigImport({
  collectionId,
  assetId,
  assetName,
  benchmarkId,
  revisionStr,
  onImported,
} = {}) {
  const step = ref(STEPS.FILE)

  const collection = useImportCollection(collectionId)
  const options = useImportOptions({
    collection: collection.collection,
    canAccept: collection.canAccept,
  })

  const file = ref(null)
  const isDragOver = ref(false)

  const errorMessage = ref(null)
  const errorDetail = ref(null)
  const parseProgressText = ref('')

  const partition = ref({ matched: [], notReviewed: [], unmatched: [] })

  const updatedOnlyFilter = ref(false)
  const filteredMatched = computed(() => {
    if (!updatedOnlyFilter.value) {
      return partition.value.matched
    }
    return partition.value.matched.filter(row => row.new.result !== row.current.result)
  })

  const importIsRunning = ref(false)
  const importIsDone = ref(false)
  const importStatus = ref(null)

  const canContinueFromFile = computed(() => !!file.value && !!options.importOptions.value)

  const selectedQueueRows = ref([])
  const sourceFiles = computed(() => (file.value ? [file.value] : []))

  const selectedStatusRow = ref(null)
  const importStatusRows = computed(() => (importStatus.value ? [importStatus.value] : []))
  watch(importStatus, (s) => {
    selectedStatusRow.value = s
  })

  async function open() {
    reset()
    await collection.loadCollection()
    options.restoreCollectionDefaults()
  }

  function reset() {
    step.value = STEPS.FILE
    collection.reset()
    options.reset()
    file.value = null
    isDragOver.value = false
    errorMessage.value = null
    errorDetail.value = null
    parseProgressText.value = ''
    partition.value = { matched: [], notReviewed: [], unmatched: [] }
    updatedOnlyFilter.value = false
    importIsRunning.value = false
    importIsDone.value = false
    importStatus.value = null
    selectedQueueRows.value = []
    selectedStatusRow.value = null
  }

  function setFile(picked) {
    if (!picked) {
      file.value = null
      selectedQueueRows.value = []
      return
    }
    if (!picked._queueId) {
      picked._queueId = `${picked.name}-${picked.size}-${picked.lastModified}`
    }
    file.value = picked
  }

  function addFilesToQueue(files) {
    if (files?.length) {
      setFile(files[0])
    }
  }

  function removeSelectedFromQueue() {
    setFile(null)
  }

  function onDragOver() {
    isDragOver.value = true
  }
  function onDragLeave() {
    isDragOver.value = false
  }

  async function onDropFiles(event) {
    isDragOver.value = false
    const items = event.dataTransfer?.items
    if (items?.length) {
      const entries = []
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.()
        if (entry) {
          entries.push(entry)
        }
      }
      const resolved = await _resolveFirstAcceptableFile(entries)
      if (resolved) {
        setFile(resolved)
        return
      }
    }
    const dropped = event.dataTransfer?.files
    if (dropped?.length) {
      setFile(dropped[0])
    }
  }

  async function startParsing() {
    errorMessage.value = null
    errorDetail.value = null
    step.value = STEPS.PARSING

    const sourceFile = file.value
    if (!sourceFile) {
      _failWith('No result file was selected.')
      return
    }

    const ext = sourceFile.name.substring(sourceFile.name.lastIndexOf('.') + 1).toLowerCase()
    if (!['ckl', 'cklb', 'xml'].includes(ext)) {
      _failWith('Unknown file extension. Expected .ckl, .cklb, or .xml.')
      return
    }

    parseProgressText.value = `Reading and parsing ${sourceFile.name}…`

    let apiAsset, parsed
    try {
      [apiAsset, parsed] = await Promise.all([
        fetchAsset(toValue(assetId)),
        _readAndParse(sourceFile, ext),
      ])
    }
    catch (e) {
      _failWith(e.message ?? 'Failed to load asset or parse file.')
      return
    }

    if (!_assetMatchesParsedTarget(apiAsset, parsed.target)) {
      _failWith('The file does not include reviews for this asset.', _assetMismatchDetail(apiAsset, parsed.target))
      return
    }

    const parsedChecklist = parsed.checklists.find(c => c.benchmarkId === toValue(benchmarkId))
    if (!parsedChecklist) {
      const found = parsed.checklists[0]?.benchmarkId ?? 'none'
      _failWith(
        `The file does not include reviews for STIG: ${toValue(benchmarkId)}.`,
        `The file includes reviews for: ${found}.`,
      )
      return
    }

    parseProgressText.value = 'Loading current checklist…'
    let currentChecklist
    try {
      currentChecklist = await fetchAssetChecklist(toValue(assetId), toValue(benchmarkId), toValue(revisionStr))
    }
    catch (e) {
      _failWith(`Could not load current checklist: ${e.message}`)
      return
    }

    partition.value = _partitionParsedReviews(parsedChecklist, currentChecklist)
    step.value = STEPS.PREVIEW
  }

  async function _readAndParse(sourceFile, ext) {
    let data, scapBenchmarkMap
    if (ext === 'xml') {
      const [text, apiScapMaps] = await Promise.all([
        _readTextFileAsync(sourceFile),
        fetchScapMap(),
      ])
      data = text
      scapBenchmarkMap = new Map(apiScapMaps.map(r => [r.scapBenchmarkId, r.benchmarkId]))
    }
    else {
      data = await _readTextFileAsync(sourceFile)
    }

    const common = {
      data,
      fieldSettings: collection.fieldSettings.value,
      allowAccept: collection.canAccept.value,
      importOptions: _effectiveImportOptions(),
      sourceRef: sourceFile,
    }
    if (ext === 'ckl') {
      return reviewsFromCkl(common)
    }
    if (ext === 'cklb') {
      return reviewsFromCklb(common)
    }
    return reviewsFromScc({ ...common, scapBenchmarkMap })
  }

  function _effectiveImportOptions() {
    const opts = options.importOptions.value
    if (!opts) {
      return opts
    }
    return { ...opts, updateAssetProps: false }
  }

  function _failWith(message, detail = null) {
    errorMessage.value = message
    errorDetail.value = detail
    step.value = STEPS.ERROR
  }

  async function startImport() {
    step.value = STEPS.IMPORT_PROGRESS
    importIsRunning.value = true
    importIsDone.value = false
    importStatus.value = null

    const reviews = filteredMatched.value.map(row => row.new)
    const baseStatus = {
      assetId: toValue(assetId),
      assetName: toValue(assetName),
      created: false,
      addedStigs: false,
      inserted: 0,
      updated: 0,
      rejected: [],
    }

    if (!reviews.length) {
      importStatus.value = baseStatus
      importIsRunning.value = false
      importIsDone.value = true
      step.value = STEPS.IMPORT_DONE
      return
    }

    let succeeded = false
    try {
      const apiResp = await postReviewsByAsset(toValue(collectionId), toValue(assetId), reviews)
      importStatus.value = {
        ...baseStatus,
        inserted: apiResp.affected.inserted,
        updated: apiResp.affected.updated,
        rejected: apiResp.rejected,
      }
      succeeded = true
    }
    catch (e) {
      importStatus.value = { ...baseStatus, error: e.message }
    }
    importIsRunning.value = false
    importIsDone.value = true
    step.value = STEPS.IMPORT_DONE
    if (succeeded) {
      onImported?.()
    }
  }

  return {
    STEPS,
    step,
    collection,
    options,
    file,
    isDragOver,
    setFile,
    addFilesToQueue,
    removeSelectedFromQueue,
    onDragOver,
    onDragLeave,
    onDropFiles,
    canContinueFromFile,
    parseProgressText,
    errorMessage,
    errorDetail,
    partition,
    updatedOnlyFilter,
    filteredMatched,
    importStatus,
    importIsRunning,
    importIsDone,
    sourceFiles,
    selectedQueueRows,
    importStatusRows,
    selectedStatusRow,
    open,
    reset,
    startParsing,
    startImport,
  }
}

async function _resolveFirstAcceptableFile(entries) {
  const queue = [...entries]
  while (queue.length) {
    const entry = queue.shift()
    if (entry.isFile) {
      const lower = entry.name.toLowerCase()
      if (lower.endsWith('.ckl') || lower.endsWith('.cklb') || lower.endsWith('.xml')) {
        return await new Promise((resolve, reject) => {
          entry.file((f) => {
            f.fullPath = entry.fullPath
            resolve(f)
          }, reject)
        })
      }
    }
    else if (entry.isDirectory) {
      const reader = entry.createReader()
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
      if (batch?.length) {
        queue.push(...batch)
      }
    }
  }
  return null
}

function _readTextFileAsync(f) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(f)
  })
}

function _lower(value) {
  return value == null ? value : String(value).toLowerCase()
}

function _assetMatchesParsedTarget(apiAsset, parsedTarget) {
  const apiMeta = apiAsset?.metadata ?? {}
  const parsedMeta = parsedTarget?.metadata ?? {}
  if (parsedMeta.cklHostName || apiMeta.cklHostName) {
    return _lower(apiMeta.cklHostName) === _lower(parsedMeta.cklHostName)
      && _lower(apiMeta.cklWebDbSite) === _lower(parsedMeta.cklWebDbSite)
      && _lower(apiMeta.cklWebDbInstance) === _lower(parsedMeta.cklWebDbInstance)
  }
  return _lower(apiAsset?.name) === _lower(parsedTarget?.name)
}

function _assetMismatchDetail(apiAsset, parsedTarget) {
  const apiMeta = apiAsset?.metadata ?? {}
  const parsedMeta = parsedTarget?.metadata ?? {}
  if (parsedMeta.cklHostName || apiMeta.cklHostName) {
    const lines = [
      'CKL web/database metadata mismatch:',
      `File: cklHostName=${parsedMeta.cklHostName ?? '—'}, cklWebDbSite=${parsedMeta.cklWebDbSite ?? '—'}, cklWebDbInstance=${parsedMeta.cklWebDbInstance ?? '—'}`,
      `Asset: cklHostName=${apiMeta.cklHostName ?? '—'}, cklWebDbSite=${apiMeta.cklWebDbSite ?? '—'}, cklWebDbInstance=${apiMeta.cklWebDbInstance ?? '—'}`,
    ]
    return lines.join('\n')
  }
  return `The file contains reviews for "${parsedTarget?.name ?? '—'}", which does not match the current asset "${apiAsset?.name ?? '—'}".`
}

function _partitionParsedReviews(parsedChecklist, currentChecklist) {
  const currentByRuleId = new Map()
  for (const item of currentChecklist) {
    currentByRuleId.set(item.ruleId, item)
  }

  const matched = []
  const notReviewed = []
  const unmatched = []

  for (const parsedReview of parsedChecklist.reviews ?? []) {
    const currentReview = currentByRuleId.get(parsedReview.ruleId)
    if (!currentReview) {
      unmatched.push(parsedReview.ruleId)
      continue
    }
    if (parsedReview.result === 'notchecked') {
      notReviewed.push(parsedReview.ruleId)
      continue
    }
    matched.push({ new: parsedReview, current: currentReview })
  }

  return { matched, notReviewed, unmatched }
}
