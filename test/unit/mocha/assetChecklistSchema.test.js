import { expect } from 'chai'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const AssetController = require('../../../api/source/controllers/Asset')
const AssetService = require('../../../api/source/service/AssetService')
const dbUtils = require('../../../api/source/service/utils')
const escape = require('../../../api/source/utils/escape')
const writer = require('../../../api/source/utils/writer')

describe('getChecklistByAssetStig cklb response', function () {
  const originalGetUserAssetStigAccess = dbUtils.getUserAssetStigAccess
  const originalGetChecklistByAssetStig = AssetService.getChecklistByAssetStig
  const originalFilenameComponentFromDate = escape.filenameComponentFromDate
  const originalWriteInlineFile = writer.writeInlineFile

  afterEach(function () {
    dbUtils.getUserAssetStigAccess = originalGetUserAssetStigAccess
    AssetService.getChecklistByAssetStig = originalGetChecklistByAssetStig
    escape.filenameComponentFromDate = originalFilenameComponentFromDate
    writer.writeInlineFile = originalWriteInlineFile
  })

  it('returns cklb through res.json with download headers', async function () {
    let writerCalled = false

    dbUtils.getUserAssetStigAccess = async () => 'rw'
    AssetService.getChecklistByAssetStig = async () => ({
      assetName: 'asset-01',
      marking: 'U',
      revisionStrResolved: 'V1R1',
      cklb: {
        title: '',
        stigs: [
          {
            rules: [
              {
                createdAt: null,
                updatedAt: null
              }
            ]
          }
        ]
      }
    })
    escape.filenameComponentFromDate = () => '20260617_000000'
    writer.writeInlineFile = () => {
      writerCalled = true
    }

    const req = {
      params: {
        assetId: 'assetId-1',
        benchmarkId: 'VPN_SRG_TEST',
        revisionStr: 'V1R1'
      },
      query: {
        format: 'cklb'
      },
      userObject: {
        grants: {}
      }
    }

    let nextArg
    const headers = {}
    const res = {
      header: (name, value) => {
        headers[name] = value
        return res
      },
      jsonBody: undefined,
      json: (body) => {
        res.jsonBody = body
        return res
      }
    }

    await AssetController.getChecklistByAssetStig(req, res, (err) => {
      nextArg = err
    })

    expect(nextArg).to.equal(undefined)
    expect(writerCalled).to.equal(false)
    expect(headers['Access-Control-Expose-Headers']).to.equal('Content-Disposition')
    expect(headers['Content-Disposition']).to.equal('inline; filename="U_asset-01-VPN_SRG_TEST-V1R1_20260617_000000.cklb"')
    expect(res.jsonBody).to.be.an('object')
    expect(res.jsonBody.title).to.equal('U_asset-01-VPN_SRG_TEST-V1R1')
    expect(res.jsonBody.stigs[0].rules[0].createdAt).to.equal(null)
    expect(res.jsonBody.stigs[0].rules[0].updatedAt).to.equal(null)
  })
})

describe('Checklist OAS schema regression', function () {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const specPath = path.resolve(__dirname, '../../../api/source/specification/stig-manager.yaml')

  function getSchemaBlock(spec, schemaName) {
    const matcher = new RegExp(`\\n    ${schemaName}:\\n([\\s\\S]*?)(?=\\n    [A-Za-z0-9_]+:)`)
    const match = spec.match(matcher)
    expect(match, `schema block for ${schemaName}`).to.not.equal(null)
    return match[0]
  }

  it('locks down ChecklistJsonAccess so oneOf does not always pass', function () {
    const spec = readFileSync(specPath, 'utf8')
    const checklistJsonAccess = getSchemaBlock(spec, 'ChecklistJsonAccess')

    expect(checklistJsonAccess).to.include('additionalProperties: false')
    expect(checklistJsonAccess).to.include('required:')
    expect(checklistJsonAccess).to.include('- access')
    expect(checklistJsonAccess).to.include('- checklist')
  })

  it('allows null cklb review timestamps in Rule schema', function () {
    const spec = readFileSync(specPath, 'utf8')
    const rule = getSchemaBlock(spec, 'Rule')

    expect(rule).to.match(/createdAt:\n\s+type: string\n\s+format: date-time\n\s+nullable: true/)
    expect(rule).to.match(/updatedAt:\n\s+type: string\n\s+format: date-time\n\s+nullable: true/)
  })
})
