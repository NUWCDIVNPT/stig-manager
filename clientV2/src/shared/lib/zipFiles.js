import JSZip from 'jszip'

const extOf = name => name.split('.').pop().toLowerCase()

/**
 * Unpacks a .zip (recursing into nested zips) into File objects whose
 * extension is in `extensions` (lowercase, no dot). Each File's fullPath is
 * the archive-qualified path, e.g. 'outer.zip/inner.zip/dir/host.ckl'.
 */
export async function extractFilesFromZip(source, extensions, basePath = source.fullPath ?? source.name) {
  const accepted = new Set(extensions)
  const zip = await JSZip.loadAsync(source)
  const files = []
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) {
      continue
    }
    const ext = extOf(path)
    const fullPath = `${basePath}/${path}`
    if (ext === 'zip') {
      files.push(...await extractFilesFromZip(await entry.async('blob'), extensions, fullPath))
    }
    else if (accepted.has(ext)) {
      const file = new File([await entry.async('blob')], path.split('/').pop(), { lastModified: entry.date.getTime() })
      file.fullPath = fullPath
      files.push(file)
    }
  }
  return files
}
