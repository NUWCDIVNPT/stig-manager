import { describe, expect, it } from 'vitest'
import { sourceFileContents } from '../../testUtils/sourceFiles.js'

// Every DataTable wired to the footer CSV export (`:dt=`) must declare an
// export title for columns whose visible header is a slot, and must give each
// column a `field` or `:export-value`, or opt it out with `:exportable="false"`.
// exportDataTableCsv reads only those props, so a slot-only header exports as
// the dotted field path and a column without field/export-value silently
// disappears from the file.

// Quote-aware scan for the end of an opening tag (attribute values such as
// `:sort-field="r => r.x"` contain `>`).
function openingTagEnd(src, from) {
  let quote = null
  for (let i = from; i < src.length; i++) {
    const ch = src[i]
    if (quote) {
      if (ch === quote) {
        quote = null
      }
    }
    else if (ch === '"' || ch === '\'') {
      quote = ch
    }
    else if (ch === '>') {
      return { end: i, selfClosing: src[i - 1] === '/' }
    }
  }
  return null
}

function columnsOf(src) {
  const cols = []
  const re = /<Column\b/g
  let m = re.exec(src)
  while (m) {
    const tag = openingTagEnd(src, m.index)
    const attrs = src.slice(m.index + 7, tag.end)
    let body = ''
    if (!tag.selfClosing) {
      const close = src.indexOf('</Column>', tag.end)
      body = src.slice(tag.end, close)
    }
    cols.push({ line: src.slice(0, m.index).split('\n').length, attrs, body })
    m = re.exec(src)
  }
  return cols
}

const exportingFiles = sourceFileContents(['.vue'])
  .filter(f => f.src.includes('<Column') && /:dt="/.test(f.src))

describe('dataTable CSV export conventions', () => {
  it('scans the exporting tables', () => {
    expect(exportingFiles.length).toBeGreaterThan(20)
  })

  it.each(exportingFiles.map(f => [f.path, f]))('%s declares export headers and opts control columns out', (_path, file) => {
    const problems = []
    for (const col of columnsOf(file.src)) {
      const hasField = /(?<![\w-])field="/.test(col.attrs) || /:export-value="/.test(col.attrs)
      // PrimeVue control columns never export; :exportable="false" is redundant on them.
      const control = /\b(?:selection-mode|expander|row-editor)=/.test(col.attrs)
      const optedOut = control || /:exportable="false"/.test(col.attrs)
      const hasHeader = /\b(?:header|export-header)="/.test(col.attrs)
      if (!hasField && !optedOut) {
        problems.push(`line ${col.line}: no field — add field="…", :export-value="…" or :exportable="false"`)
      }
      if (hasField && !hasHeader && col.body.includes('<template #header')) {
        problems.push(`line ${col.line}: slot-only header — add export-header="…"`)
      }
    }
    expect(problems).toEqual([])
  })
})
