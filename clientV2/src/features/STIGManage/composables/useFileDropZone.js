import { ref } from 'vue'

// Recursively collects File objects from a dropped file/directory entry
async function collectFilesFromEntry(entry, out) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
    out.push(file)
  }
  else if (entry.isDirectory) {
    const reader = entry.createReader()
    let batch
    do {
      // readEntries returns at most ~100 entries per call; loop until drained
      batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
      await Promise.all(batch.map(child => collectFilesFromEntry(child, out)))
    } while (batch.length)
  }
}

function formatExtensionList(extensions) {
  const list = extensions.map(ext => `.${ext}`)
  return list.length <= 1 ? (list[0] ?? '') : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
}

/**
 * A drop zone that accepts files and folders (dropped folders are scanned
 * recursively for matching files) plus a plain <input type="file"> fallback,
 * filtered to `acceptedExtensions` (lowercase, no dot — e.g. ['xml', 'zip']).
 */
export function useFileDropZone(acceptedExtensions) {
  const accepted = new Set(acceptedExtensions.map(ext => ext.toLowerCase()))
  const acceptAttr = acceptedExtensions.map(ext => `.${ext}`).join(',')

  const selectedFiles = ref([])
  const dragActive = ref(false)
  const rejectedNote = ref('')

  function addFiles(fileList) {
    let rejected = 0
    for (const file of fileList) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!accepted.has(ext)) {
        rejected++
        continue
      }
      const duplicate = selectedFiles.value.some(f => f.name === file.name && f.size === file.size)
      if (!duplicate) {
        selectedFiles.value.push(file)
      }
    }
    rejectedNote.value = rejected
      ? `${rejected} unsupported file${rejected === 1 ? '' : 's'} ignored — only ${formatExtensionList(acceptedExtensions)} are accepted`
      : ''
  }

  function onFileInput(event) {
    if (event.target.files?.length) {
      addFiles(event.target.files)
    }
    event.target.value = ''
  }

  function onDragOver(event) {
    event.preventDefault()
    dragActive.value = true
  }

  function onDragLeave() {
    dragActive.value = false
  }

  async function onDrop(event) {
    event.preventDefault()
    dragActive.value = false

    // Entries must be captured synchronously, before the first await
    const items = event.dataTransfer?.items
    const entries = items ? [...items].map(item => item.webkitGetAsEntry?.()).filter(Boolean) : []

    if (entries.length) {
      const files = []
      await Promise.all(
        entries.map(async (entry) => {
          try {
            await collectFilesFromEntry(entry, files)
          }
          catch {
            // unreadable entry — skip it
          }
        }),
      )
      addFiles(files)
    }
    else if (event.dataTransfer?.files?.length) {
      addFiles(event.dataTransfer.files)
    }
  }

  function removeFile(index) {
    selectedFiles.value.splice(index, 1)
  }

  function clearFiles() {
    selectedFiles.value = []
    rejectedNote.value = ''
  }

  function reset() {
    selectedFiles.value = []
    rejectedNote.value = ''
    dragActive.value = false
  }

  return {
    acceptAttr,
    selectedFiles,
    dragActive,
    rejectedNote,
    addFiles,
    onFileInput,
    onDragOver,
    onDragLeave,
    onDrop,
    removeFile,
    clearFiles,
    reset,
  }
}
