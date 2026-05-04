import { computed, ref } from 'vue'

export function useFileQueue() {
  const fileQueue = ref([])
  const selectedQueueRows = ref([])
  const isDragOver = ref(false)
  const canContinue = computed(() => fileQueue.value.length > 0)

  function _queueId(file) { return `${file.name}-${file.size}-${file.lastModified}` }

  function addFilesToQueue(files) {
    for (const file of files) {
      const id = _queueId(file)
      if (!fileQueue.value.some(f => f._queueId === id)) {
        file._queueId = id
        fileQueue.value.push(file)
      }
    }
  }

  function removeSelectedFromQueue() {
    const ids = new Set(selectedQueueRows.value.map(f => f._queueId))
    fileQueue.value = fileQueue.value.filter(f => !ids.has(f._queueId))
    selectedQueueRows.value = []
  }

  function onDragOver() { isDragOver.value = true }
  function onDragLeave() { isDragOver.value = false }

  async function onDropFiles(event) {
    isDragOver.value = false
    const items = event.dataTransfer?.items
    if (!items) return
    const entries = await _getAllFileEntries(items)
    const files = await Promise.all(entries.map(_entryFilePromise))
    addFilesToQueue(files)
  }

  async function _getAllFileEntries(dataTransferItemList) {
    const fileEntries = []
    const queue = []
    for (let i = 0; i < dataTransferItemList.length; i++) {
      const entry = dataTransferItemList[i].webkitGetAsEntry?.()
      if (entry) queue.push(entry)
    }
    while (queue.length > 0) {
      const entry = queue.shift()
      const lower = entry.name.toLowerCase()
      if (entry.isFile && (lower.endsWith('.ckl') || lower.endsWith('.cklb') || lower.endsWith('.xml'))) {
        fileEntries.push(entry)
      }
      else if (entry.isDirectory) {
        queue.push(...await _readAllDirectoryEntries(entry.createReader()))
      }
    }
    return fileEntries
  }

  async function _readAllDirectoryEntries(reader) {
    const entries = []
    let batch = await _readEntriesPromise(reader)
    while (batch?.length > 0) { entries.push(...batch); batch = await _readEntriesPromise(reader) }
    return entries
  }

  function _readEntriesPromise(reader) {
    return new Promise((resolve, reject) => reader.readEntries(resolve, reject))
  }

  function _entryFilePromise(entry) {
    return new Promise((resolve, reject) => {
      entry.file((file) => { file.fullPath = entry.fullPath; resolve(file) }, reject)
    })
  }

  function reset() {
    fileQueue.value = []
    selectedQueueRows.value = []
    isDragOver.value = false
  }

  return {
    fileQueue,
    selectedQueueRows,
    isDragOver,
    canContinue,
    addFilesToQueue,
    removeSelectedFromQueue,
    onDragOver,
    onDragLeave,
    onDropFiles,
    reset
  }
}
