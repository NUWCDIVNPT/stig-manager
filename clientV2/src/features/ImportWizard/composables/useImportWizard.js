import { ref } from 'vue'
import { useFileParsing } from './useFileParsing.js'
import { useFileQueue } from './useFileQueue.js'
import { useImportCollection } from './useImportCollection.js'
import { useImportExecution } from './useImportExecution.js'
import { useImportOptions } from './useImportOptions.js'

const LARGE_BATCH_THRESHOLD = 250

export function useImportWizard({ collectionId, createObjects = true, canUpdateAssetProps = true, onImported } = {}) {
  const step = ref('fileQueue')
  const awaitingParseConfirmation = ref(false)

  const collection = useImportCollection(collectionId)

  const options = useImportOptions({
    collection: collection.collection,
    canAccept: collection.canAccept,
  })

  const queue = useFileQueue()

  const parser = useFileParsing({
    collectionId,
    createObjects,
    sourceFiles: queue.sourceFiles,
    fieldSettings: collection.fieldSettings,
    canAccept: collection.canAccept,
    importOptions: options.importOptions,
  })

  const executor = useImportExecution({
    collectionId,
    canUpdateAssetProps,
    parseResults: parser.parseResults,
    importOptions: options.importOptions,
    allowNewObjects: parser.allowNewObjects,
    onImported,
  })

  async function open() {
    reset()
    await collection.loadCollection()
    options.restoreCollectionDefaults()
  }

  function reset() {
    step.value = 'fileQueue'
    awaitingParseConfirmation.value = false
    collection.reset()
    options.reset()
    queue.reset()
    parser.reset()
    executor.reset()
  }

  // Step transitions
  async function advanceFromFileQueue() {
    step.value = 'parseProgress'
    if (queue.sourceFiles.value.length >= LARGE_BATCH_THRESHOLD) {
      awaitingParseConfirmation.value = true
      return
    }
    await runParsing()
  }

  async function confirmAndStartParsing() {
    awaitingParseConfirmation.value = false
    await runParsing()
  }

  async function runParsing() {
    await parser.startParsing()

    if (parser.parseResults.value.errors.length > 0 || parser.parseResults.value.hasDuplicates) {
      step.value = 'errorsWarnings'
    }
    else {
      step.value = 'preview'
    }
  }

  function advanceFromErrors() {
    step.value = 'preview'
  }

  async function startImport() {
    step.value = 'importProgress'
    await executor.runImport()
  }

  return {
    step,
    awaitingParseConfirmation,
    collection,
    options,
    queue,
    parser,
    executor,

    open,
    reset,

    advanceFromFileQueue,
    confirmAndStartParsing,
    advanceFromErrors,
    startImport,
  }
}
