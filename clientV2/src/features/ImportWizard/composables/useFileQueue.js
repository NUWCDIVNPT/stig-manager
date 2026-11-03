import { computed, ref } from 'vue'
import { fileExtension, formatExtensionList } from '../../../shared/lib.js'
import { extractFilesFromZip } from '../../../shared/lib/zipFiles.js'

const RESULT_EXTENSIONS = ['ckl', 'cklb', 'xml']
const QUEUEABLE_EXTENSIONS = new Set([...RESULT_EXTENSIONS, 'zip'])
const ACCEPT_ATTR = [...QUEUEABLE_EXTENSIONS].map(ext => `.${ext}`).join(',')
const RESULT_EXTENSION_LIST = formatExtensionList(RESULT_EXTENSIONS, 'or')
const isZip = name => fileExtension(name) === 'zip'
const isQueueable = name => QUEUEABLE_EXTENSIONS.has(fileExtension(name))

export function useFileQueue() {
  const sourceFiles = ref([])
  const selectedQueueRows = ref([])
  const isDragOver = ref(false)
  const queueNote = ref('')
  const pendingAdds = ref(0)
  const isAdding = computed(() => pendingAdds.value > 0)
  const canContinue = computed(() => sourceFiles.value.length > 0 && !isAdding.value)

  function _queueId(file) {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  // Runs `work` with isAdding raised, so Continue is disabled while files are
  // still being read or extracted
  async function _whileAdding(work) {
    pendingAdds.value++
    try {
      await work()
    }
    finally {
      pendingAdds.value--
    }
  }

  function addFilesToQueue(files) {
    return _whileAdding(() => _expandAndAdd(files))
  }

  async function _expandAndAdd(files) {
    const expanded = []
    const notes = []
    const onSkip = (path, reason) => notes.push(`Skipped nested archive ${path} (${reason})`)
    for (const file of files) {
      if (!isZip(file.name)) {
        expanded.push(file)
        continue
      }
      try {
        const inner = await extractFilesFromZip(file, RESULT_EXTENSIONS, { onSkip })
        if (!inner.length) {
          notes.push(`No ${RESULT_EXTENSION_LIST} files found in ${file.name}`)
        }
        expanded.push(...inner)
      }
      catch {
        notes.push(`Could not open ZIP archive ${file.name}`)
      }
    }
    queueNote.value = notes.join('; ')
    const queued = new Set(sourceFiles.value.map(f => f._queueId))
    for (const file of expanded) {
      const id = _queueId(file)
      if (!queued.has(id)) {
        queued.add(id)
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
    await _whileAdding(async () => {
      const entries = await _getAllFileEntries(items)
      const files = await Promise.all(entries.map(_entryFilePromise))
      await _expandAndAdd(files)
    })
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
    isAdding,
    canContinue,
    acceptAttr: ACCEPT_ATTR,
    addFilesToQueue,
    removeSelectedFromQueue,
    onDragOver,
    onDragLeave,
    onDropFiles,
    reset,
  }
}
