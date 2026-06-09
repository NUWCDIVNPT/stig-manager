import { describe, expect, it } from 'vitest'
import {
  ASSET_FIELDS,
  STIG_FIELDS,
  escapeCsv,
  formatAssetsForCsv,
  generateCsv,
  mapAssetToLabel,
} from '../csv.js'

describe('escapeCsv', () => {
  it('returns empty string for null and undefined', () => {
    expect(escapeCsv(null)).toBe('')
    expect(escapeCsv(undefined)).toBe('')
  })

  it('returns plain strings unchanged', () => {
    expect(escapeCsv('hello')).toBe('hello')
    expect(escapeCsv('')).toBe('')
  })

  it('coerces non-string values via String()', () => {
    expect(escapeCsv(0)).toBe('0')
    expect(escapeCsv(42)).toBe('42')
    expect(escapeCsv(false)).toBe('false')
    expect(escapeCsv(true)).toBe('true')
  })

  it('wraps in quotes when value contains a comma', () => {
    expect(escapeCsv('a,b')).toBe('"a,b"')
  })

  it('wraps in quotes when value contains a newline', () => {
    expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"')
  })

  it('wraps in quotes and doubles embedded quotes', () => {
    expect(escapeCsv('say "hi"')).toBe('"say ""hi"""')
  })

  it('handles all three triggers together', () => {
    expect(escapeCsv('a,"b"\nc')).toBe('"a,""b""\nc"')
  })

  it('prefixes =, +, -, @ with a tab regardless of what follows', () => {
    expect(escapeCsv('=SUM(A1:A10)')).toBe('"\t=SUM(A1:A10)"')
    expect(escapeCsv('=anything')).toBe('"\t=anything"')
    expect(escapeCsv('+1')).toBe('"\t+1"')
    expect(escapeCsv('-2')).toBe('"\t-2"')
    expect(escapeCsv('@3')).toBe('"\t@3"')
    expect(escapeCsv('-assethello')).toBe('"\t-assethello"')
    expect(escapeCsv('+asset')).toBe('"\t+asset"')
    expect(escapeCsv('@user')).toBe('"\t@user"')
  })

  it('does not alter values that do not start with formula chars', () => {
    expect(escapeCsv('asset-01')).toBe('asset-01')
    expect(escapeCsv('1.2.3.4')).toBe('1.2.3.4')
  })
})

describe('generateCsv', () => {
  const cols = [
    { apiProperty: 'name', header: 'Name' },
    { apiProperty: 'ip', header: 'IP' },
  ]

  it('emits just the header row when data is empty', () => {
    expect(generateCsv([], cols)).toBe('Name,IP')
  })

  it('preserves column order regardless of data-key order', () => {
    const data = [{ ip: '1.2.3.4', name: 'srv' }]
    expect(generateCsv(data, cols)).toBe('Name,IP\nsrv,1.2.3.4')
  })

  it('emits empty cells when an apiProperty is missing on the data row', () => {
    const data = [{ name: 'srv' }]
    expect(generateCsv(data, cols)).toBe('Name,IP\nsrv,')
  })

  it('escapes header values', () => {
    const data = [{ name: 'srv' }]
    expect(generateCsv(data, [{ apiProperty: 'name', header: 'Name,with comma' }]))
      .toBe('"Name,with comma"\nsrv')
  })

  it('joins primitive array values with the default comma delimiter', () => {
    const data = [{ tags: ['a', 'b', 'c'] }]
    expect(generateCsv(data, [{ apiProperty: 'tags', header: 'Tags' }]))
      .toBe('Tags\n"a,b,c"')
  })

  it('joins array values with a custom listDelimiter', () => {
    const data = [{ tags: ['a', 'b'] }]
    expect(generateCsv(data, [{ apiProperty: 'tags', header: 'Tags' }], '\n'))
      .toBe('Tags\n"a\nb"')
  })

  it('extracts delimitedProperty when array items are objects', () => {
    const data = [{ stigs: [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }] }]
    const columns = [{ apiProperty: 'stigs', header: 'STIGs', delimitedProperty: 'benchmarkId' }]
    expect(generateCsv(data, columns)).toBe('STIGs\n"B1,B2"')
  })

  it('joins multiple rows with newlines', () => {
    const data = [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
    expect(generateCsv(data, [{ apiProperty: 'name', header: 'Name' }]))
      .toBe('Name\na\nb\nc')
  })
})

describe('field constants', () => {
  it('ASSET_FIELDS is the documented shape', () => {
    expect(ASSET_FIELDS.map(f => f.apiProperty)).toEqual([
      'name', 'description', 'ip', 'fqdn', 'mac', 'noncomputing', 'stigs', 'labels', 'metadata',
    ])
  })

  it('STIG_FIELDS is the documented shape', () => {
    expect(STIG_FIELDS.map(f => f.apiProperty)).toEqual([
      'benchmark', 'title', 'revision', 'date', 'assets',
    ])
  })
})

describe('mapAssetToLabel', () => {
  it('returns [] for empty input', () => {
    expect(mapAssetToLabel([], [])).toEqual([])
  })

  it('resolves labelIds to label names', () => {
    const assets = [{ assetId: 'a1', labelIds: ['l1', 'l3'] }]
    const labels = [{ labelId: 'l1', name: 'prod' }, { labelId: 'l2', name: 'staging' }, { labelId: 'l3', name: 'dev' }]
    expect(mapAssetToLabel(assets, labels)[0].labels).toEqual(['prod', 'dev'])
  })

  it('omits labels not present in the collection list', () => {
    const assets = [{ labelIds: ['l1', 'missing'] }]
    const labels = [{ labelId: 'l1', name: 'prod' }]
    expect(mapAssetToLabel(assets, labels)[0].labels).toEqual(['prod'])
  })

  it('does not add a labels field when asset has no labelIds', () => {
    const assets = [{ assetId: 'a1', name: 'x' }]
    const result = mapAssetToLabel(assets, [{ labelId: 'l1', name: 'prod' }])
    expect(result[0]).not.toHaveProperty('labels')
  })

  it('does not add a labels field when labels arg is missing', () => {
    const assets = [{ assetId: 'a1', labelIds: ['l1'] }]
    expect(mapAssetToLabel(assets, null)[0]).not.toHaveProperty('labels')
    expect(mapAssetToLabel(assets, undefined)[0]).not.toHaveProperty('labels')
  })

  it('preserves other fields on the asset', () => {
    const assets = [{ assetId: 'a1', name: 'srv', ip: '1.2.3.4', labelIds: [] }]
    const labels = []
    const out = mapAssetToLabel(assets, labels)[0]
    expect(out.assetId).toBe('a1')
    expect(out.name).toBe('srv')
    expect(out.ip).toBe('1.2.3.4')
  })

  it('does not mutate the input asset', () => {
    const asset = { assetId: 'a1', labelIds: ['l1'] }
    mapAssetToLabel([asset], [{ labelId: 'l1', name: 'prod' }])
    expect(asset).not.toHaveProperty('labels')
  })
})

describe('formatAssetsForCsv', () => {
  it('renders noncomputing as "True" / "False" strings', () => {
    expect(formatAssetsForCsv([{ noncomputing: true }])[0].noncomputing).toBe('True')
    expect(formatAssetsForCsv([{ noncomputing: false }])[0].noncomputing).toBe('False')
  })

  it('leaves noncomputing untouched when it is undefined', () => {
    const out = formatAssetsForCsv([{ name: 'srv' }])[0]
    expect(out).not.toHaveProperty('noncomputing')
  })

  it('stringifies metadata as JSON', () => {
    expect(formatAssetsForCsv([{ metadata: { env: 'prod', tier: '1' } }])[0].metadata)
      .toBe('{"env":"prod","tier":"1"}')
  })

  it('leaves metadata untouched when missing/null', () => {
    expect(formatAssetsForCsv([{ name: 'x' }])[0]).not.toHaveProperty('metadata')
    expect(formatAssetsForCsv([{ metadata: null }])[0].metadata).toBeNull()
  })

  it('reduces stigs to an array of benchmarkIds', () => {
    expect(formatAssetsForCsv([{ stigs: [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }] }])[0].stigs)
      .toEqual(['B1', 'B2'])
  })

  it('does not mutate the input asset', () => {
    const asset = { noncomputing: true, metadata: { k: 'v' }, stigs: [{ benchmarkId: 'B1' }] }
    formatAssetsForCsv([asset])
    expect(asset.noncomputing).toBe(true)
    expect(asset.metadata).toEqual({ k: 'v' })
    expect(asset.stigs).toEqual([{ benchmarkId: 'B1' }])
  })

  it('round-trips through generateCsv with ASSET_FIELDS', () => {
    const assets = [{
      name: 'srv1',
      description: 'a server',
      ip: '1.2.3.4',
      fqdn: 'srv1.example',
      mac: 'aa:bb',
      noncomputing: false,
      stigs: [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }],
      labelIds: ['l1'],
      metadata: { env: 'prod' },
    }]
    const labels = [{ labelId: 'l1', name: 'prod' }]
    const rows = formatAssetsForCsv(mapAssetToLabel(assets, labels))
    const csv = generateCsv(rows, ASSET_FIELDS, '\n')
    expect(csv).toContain('Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata')
    expect(csv).toContain('srv1')
    expect(csv).toContain('False')
    expect(csv).toContain('"B1\nB2"')
    expect(csv).toContain('prod')
    expect(csv).toContain('"{""env"":""prod""}"')
  })
})
