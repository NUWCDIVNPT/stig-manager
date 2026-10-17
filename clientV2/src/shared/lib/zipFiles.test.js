import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { extractFilesFromZip, MAX_ZIP_DEPTH } from './zipFiles.js'

const ENTRY_DATE = new Date(1600000000000)
const EXTS = ['ckl', 'cklb', 'xml']

async function zipBytes(entries) {
  const zip = new JSZip()
  for (const [path, content] of Object.entries(entries)) {
    if (content === null) {
      zip.folder(path)
    }
    else {
      zip.file(path, content, { date: ENTRY_DATE })
    }
  }
  return zip.generateAsync({ type: 'uint8array' })
}

async function makeZipFile(name, entries) {
  return new File([await zipBytes(entries)], name)
}

function readText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const paths = files => files.map(f => f.fullPath).sort()

describe('extractFilesFromZip', () => {
  it('returns only files with an accepted extension', async () => {
    const zip = await makeZipFile('a.zip', { 'one.ckl': '1', 'two.cklb': '2', 'three.xml': '3', 'notes.txt': 'n', 'noext': 'x' })
    const files = await extractFilesFromZip(zip, EXTS)
    expect(files.map(f => f.name).sort()).toEqual(['one.ckl', 'three.xml', 'two.cklb'])
  })

  it('matches extensions case-insensitively', async () => {
    const zip = await makeZipFile('a.zip', { 'HOST.CKL': '1', 'Other.Xml': '2' })
    const files = await extractFilesFromZip(zip, EXTS)
    expect(files.map(f => f.name).sort()).toEqual(['HOST.CKL', 'Other.Xml'])
  })

  it('skips directory entries and names files by their basename', async () => {
    const zip = await makeZipFile('a.zip', { 'empty/': null, 'hosts/web/host.ckl': '1' })
    const files = await extractFilesFromZip(zip, EXTS)
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('host.ckl')
  })

  it('prefixes fullPath with the source name', async () => {
    const zip = await makeZipFile('export.zip', { 'hosts/web/host.ckl': '1' })
    const [file] = await extractFilesFromZip(zip, EXTS)
    expect(file.fullPath).toBe('export.zip/hosts/web/host.ckl')
  })

  it('prefers the source fullPath (dropped files) over its name', async () => {
    const zip = await makeZipFile('export.zip', { 'host.ckl': '1' })
    zip.fullPath = '/drops/export.zip'
    const [file] = await extractFilesFromZip(zip, EXTS)
    expect(file.fullPath).toBe('/drops/export.zip/host.ckl')
  })

  it('uses an explicit basePath when given', async () => {
    const zip = await makeZipFile('export.zip', { 'host.ckl': '1' })
    const [file] = await extractFilesFromZip(zip, EXTS, { basePath: 'custom/base' })
    expect(file.fullPath).toBe('custom/base/host.ckl')
  })

  it('recurses into nested zips, including ones inside folders', async () => {
    const deepest = await zipBytes({ 'deep.ckl': 'd' })
    const inner = await zipBytes({ 'inner.cklb': 'i', 'deeper.ZIP': deepest, 'skip.txt': 's' })
    const zip = await makeZipFile('outer.zip', { 'outer.xml': 'o', 'nested/inner.zip': inner })
    const files = await extractFilesFromZip(zip, EXTS)
    expect(paths(files)).toEqual([
      'outer.zip/nested/inner.zip/deeper.ZIP/deep.ckl',
      'outer.zip/nested/inner.zip/inner.cklb',
      'outer.zip/outer.xml',
    ])
  })

  it('recurses into nested zips even when "zip" is not in extensions', async () => {
    const inner = await zipBytes({ 'inner.ckl': 'i' })
    const zip = await makeZipFile('outer.zip', { 'inner.zip': inner })
    const files = await extractFilesFromZip(zip, ['ckl'])
    expect(paths(files)).toEqual(['outer.zip/inner.zip/inner.ckl'])
  })

  it('preserves entry contents and size', async () => {
    const zip = await makeZipFile('a.zip', { 'host.ckl': '<CHECKLIST>hello</CHECKLIST>' })
    const [file] = await extractFilesFromZip(zip, EXTS)
    expect(await readText(file)).toBe('<CHECKLIST>hello</CHECKLIST>')
    expect(file.size).toBe(28)
  })

  it('sets lastModified from the zip entry date', async () => {
    const zip = await makeZipFile('a.zip', { 'host.ckl': '1' })
    const [file] = await extractFilesFromZip(zip, EXTS)
    expect(file.lastModified).toBe(ENTRY_DATE.getTime())
  })

  it('returns an empty array when nothing matches', async () => {
    const zip = await makeZipFile('a.zip', { 'readme.txt': 'r' })
    expect(await extractFilesFromZip(zip, EXTS)).toEqual([])
  })

  it('returns an empty array for an empty archive', async () => {
    const zip = await makeZipFile('a.zip', {})
    expect(await extractFilesFromZip(zip, EXTS)).toEqual([])
  })

  it('rejects when the source is not a valid zip', async () => {
    await expect(extractFilesFromZip(new File(['not a zip'], 'bad.zip'), EXTS)).rejects.toThrow()
  })

  it('skips a corrupt nested zip, reports it via onSkip and keeps its siblings', async () => {
    const zip = await makeZipFile('outer.zip', { 'ok.ckl': '1', 'bad.zip': 'not a zip' })
    const skipped = []
    const files = await extractFilesFromZip(zip, EXTS, { onSkip: (path, reason) => skipped.push([path, reason]) })
    expect(paths(files)).toEqual(['outer.zip/ok.ckl'])
    expect(skipped).toEqual([['outer.zip/bad.zip', 'could not be opened']])
  })

  it('skips a corrupt nested zip without an onSkip callback', async () => {
    const zip = await makeZipFile('outer.zip', { 'ok.ckl': '1', 'bad.zip': 'not a zip' })
    expect(paths(await extractFilesFromZip(zip, EXTS))).toEqual(['outer.zip/ok.ckl'])
  })

  it('stops recursing into archives nested deeper than MAX_ZIP_DEPTH', async () => {
    // level N archive holds levelN.ckl and the level N+1 archive
    let bytes = await zipBytes({ [`level${MAX_ZIP_DEPTH + 2}.ckl`]: 'x' })
    for (let level = MAX_ZIP_DEPTH + 1; level > 0; level--) {
      bytes = await zipBytes({ [`level${level}.ckl`]: 'x', 'next.zip': bytes })
    }
    const zip = await makeZipFile('level0.zip', { 'level0.ckl': 'x', 'next.zip': bytes })
    const skipped = []
    const files = await extractFilesFromZip(zip, EXTS, { onSkip: (path, reason) => skipped.push([path, reason]) })
    const names = files.map(f => f.name).sort()
    expect(names).toHaveLength(MAX_ZIP_DEPTH + 1)
    expect(names).toContain(`level${MAX_ZIP_DEPTH}.ckl`)
    expect(names).not.toContain(`level${MAX_ZIP_DEPTH + 1}.ckl`)
    expect(skipped).toEqual([[`level0.zip${'/next.zip'.repeat(MAX_ZIP_DEPTH + 1)}`, `nested more than ${MAX_ZIP_DEPTH} levels deep`]])
  })
})
