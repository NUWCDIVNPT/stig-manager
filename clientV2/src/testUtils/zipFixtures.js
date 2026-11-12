import JSZip from 'jszip'

export const ZIP_ENTRY_DATE = new Date(1600000000000)

/**
 * Builds zip bytes from { 'path/file.ckl': 'content', 'folder/': null, 'inner.zip': bytes }.
 * A null value creates a directory entry; every file entry gets ZIP_ENTRY_DATE.
 */
export async function zipBytes(entries) {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(entries)) {
    if (content === null) {
      zip.folder(path)
    }
    else {
      zip.file(path, content, { date: ZIP_ENTRY_DATE })
    }
  }
  return zip.generateAsync({ type: 'uint8array' })
}

export async function makeZipFile(name, entries) {
  return new File([await zipBytes(entries)], name)
}
