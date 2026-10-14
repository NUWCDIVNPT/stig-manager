import { computed, ref } from 'vue'
import { extractFilesFromZip } from '../../../shared/lib/zipFiles.js'

const RESULT_EXTENSIONS = ['ckl', 'cklb', 'xml']
const isZip = name => name.toLowerCase().endsWith('.zip')
const isQueueable = name => RESULT_EXTENSIONS.some(ext => name.toLowerCase().endsWith(`.${ext}`)) || isZip(name)

export function useFileQueue() {
  const sourceFiles = ref([])
  const selectedQueueRows = ref([])
  const isDragOver = ref(false)
  const queueNote = ref('')
  const canContinue = computed(() => sourceFiles.value.length > 0)

  function _queueId(file) {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  async function addFilesToQueue(files) {
    const expanded = []
    const notes = []
    for (const file of files) {
      if (!isZip(file.name)) {
        expanded.push(file)
        continue
      }
      try {
        const inner = await extractFilesFromZip(file, RESULT_EXTENSIONS)
        if (!inner.length) {
          notes.push(`No .ckl, .cklb or .xml files found in ${file.name}`)
        }
        expanded.push(...inner)
      }
      catch {
        notes.push(`Could not open ZIP archive ${file.name}`)
      }
    }
    queueNote.value = notes.join('; ')
    for (const file of expanded) {
      const id = _queueId(file)
      if (!sourceFiles.value.some(f => f._queueId === id)) {
        file._queueId = id
        sourceFiles.value.push(file)
      }
    }
  }

  function removeSelectedFromQueue() {
    const ids = new Set(selectedQueueRows.value.map(f => f._queueId))
    sourceFiles.value = sourceFiles.value.filter(f => !ids.has(f._queueId))
    selectedQueueRows.value = []
  }

  function onDragOver() { isDragOver.value = true }
  function onDragLeave() { isDragOver.value = false }

  async function onDropFiles(event) {
    isDragOver.value = false
    const items = event.dataTransfer?.items
    if (!items) { return }
    const entries = await _getAllFileEntries(items)
    const files = await Promise.all(entries.map(_entryFilePromise))
    await addFilesToQueue(files)
  }

  async function _getAllFileEntries(dataTransferItemList) {
    const fileEntries = []
    const queue = []
    for (let i = 0; i < dataTransferItemList.length; i++) {
      const entry = dataTransferItemList[i].webkitGetAsEntry?.()
      if (entry) { queue.push(entry) }
    }
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry.isFile && isQueueable(entry.name)) {
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
    sourceFiles.value = []
    selectedQueueRows.value = []
    isDragOver.value = false
    queueNote.value = ''
  }

  return {
    sourceFiles,
    selectedQueueRows,
    isDragOver,
    queueNote,
    canContinue,
    addFilesToQueue,
    removeSelectedFromQueue,
    onDragOver,
    onDragLeave,
    onDropFiles,
    reset,
  }
}
