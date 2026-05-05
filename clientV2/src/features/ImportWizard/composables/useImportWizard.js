import { ref } from 'vue'
import { useFileParsing } from './useFileParsing.js'
import { useFileQueue } from './useFileQueue.js'
import { useImportCollection } from './useImportCollection.js'
import { useImportExecution } from './useImportExecution.js'
import { useImportOptions } from './useImportOptions.js'

export function useImportWizard({ collectionId, createObjects = true, canUpdateAssetProps = true, onImported } = {}) {
  const step = ref('fileQueue')

  const collection = useImportCollection(collectionId)

  const options = useImportOptions({
    collection: collection.collection,
    canAccept: collection.canAccept,
  })

  const queue = useFileQueue()

  const parser = useFileParsing({
    collectionId,
    createObjects,
    fileQueue: queue.fileQueue,
    fieldSettings: collection.fieldSettings,
    canAccept: collection.canAccept,
    importOptions: options.importOptions,
  })

  const executor = useImportExecution({
    collectionId,
    canUpdateAssetProps,
    parseResults: parser.parseResults,
    importOptions: options.importOptions,
    previewCreateObjects: parser.previewCreateObjects,
    onImported,
  })

  async function open() {
    reset()
    await collection.loadCollection()
    options.restoreCollectionDefaults()
  }

  function reset() {
    step.value = 'fileQueue'
    collection.reset()
    options.reset()
    queue.reset()
    parser.reset()
    executor.reset()
  }

  // Step transitions
  async function advanceFromFileQueue() {
    if (queue.fileQueue.value.length >= 250) {
      step.value = 'batchWarning'
    }
    else {
      await advanceToParsing()
    }
  }

  async function advanceFromBatchWarning() {
    await advanceToParsing()
  }

  async function advanceToParsing() {
    step.value = 'parseProgress'
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
    collection,
    options,
    queue,
    parser,
    executor,

    open,
    reset,

    advanceFromFileQueue,
    advanceFromBatchWarning,
    advanceFromErrors,
    startImport,
  }
}
