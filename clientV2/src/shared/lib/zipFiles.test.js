import { describe, expect, it } from 'vitest'
import { makeZipFile, ZIP_ENTRY_DATE, zipBytes } from '../../testUtils/zipFixtures.js'
import { extractFilesFromZip, MAX_ZIP_DEPTH } from './zipFiles.js'

const EXTS = ['ckl', 'cklb', 'xml']

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
    expect(file.lastModified).toBe(ZIP_ENTRY_DATE.getTime())
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

  it('skips a corrupt nested zip, keeps its siblings and reports it via onSkip when given', async () => {
    const zip = await makeZipFile('outer.zip', { 'ok.ckl': '1', 'bad.zip': 'not a zip' })
    expect(paths(await extractFilesFromZip(zip, EXTS))).toEqual(['outer.zip/ok.ckl'])
    const skipped = []
    await extractFilesFromZip(zip, EXTS, { onSkip: (path, reason) => skipped.push([path, reason]) })
    expect(skipped).toEqual([['outer.zip/bad.zip', 'could not be opened']])
  })

  it('stops recursing into archives nested deeper than MAX_ZIP_DEPTH', async () => {
    // level N archive holds levelN.ckl and the level N+1 archive; the last one is past the limit
    let bytes = await zipBytes({ [`level${MAX_ZIP_DEPTH + 1}.ckl`]: 'x' })
    for (let level = MAX_ZIP_DEPTH; level > 0; level--) {
      bytes = await zipBytes({ [`level${level}.ckl`]: 'x', 'next.zip': bytes })
    }
    const zip = await makeZipFile('level0.zip', { 'level0.ckl': 'x', 'next.zip': bytes })
    const skipped = []
    const files = await extractFilesFromZip(zip, EXTS, { onSkip: (path, reason) => skipped.push([path, reason]) })
    const expectedNames = Array.from({ length: MAX_ZIP_DEPTH + 1 }, (_, level) => `level${level}.ckl`)
    expect(files.map(f => f.name).sort()).toEqual(expectedNames)
    expect(skipped).toEqual([[`level0.zip${'/next.zip'.repeat(MAX_ZIP_DEPTH + 1)}`, `nested more than ${MAX_ZIP_DEPTH} levels deep`]])
  })
})
