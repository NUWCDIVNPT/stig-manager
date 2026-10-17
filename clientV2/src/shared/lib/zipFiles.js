import JSZip from 'jszip'

const extOf = name => name.split('.').pop().toLowerCase()

// Nested archives deeper than this are skipped (guards against zip quines
// and runaway nesting; real inputs nest one or two levels at most)
export const MAX_ZIP_DEPTH = 5

/**
 * Unpacks a .zip (recursing into nested zips) into File objects whose
 * extension is in `extensions` (lowercase, no dot). Each File's fullPath is
 * the archive-qualified path, e.g. 'outer.zip/inner.zip/dir/host.ckl'.
 * A nested zip that is unreadable or too deeply nested is skipped (reported
 * via `onSkip(fullPath, reason)` when given); its siblings are still returned.
 */
export async function extractFilesFromZip(source, extensions, { basePath = source.fullPath ?? source.name, depth = 0, onSkip } = {}) {
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
      if (depth >= MAX_ZIP_DEPTH) {
        onSkip?.(fullPath, `nested more than ${MAX_ZIP_DEPTH} levels deep`)
        continue
      }
      try {
        files.push(...await extractFilesFromZip(await entry.async('blob'), extensions, { basePath: fullPath, depth: depth + 1, onSkip }))
      }
      catch {
        onSkip?.(fullPath, 'could not be opened')
      }
    }
    else if (accepted.has(ext)) {
      const file = new File([await entry.async('blob')], path.split('/').pop(), { lastModified: entry.date.getTime() })
      file.fullPath = fullPath
      files.push(file)
    }
  }
  return files
}
