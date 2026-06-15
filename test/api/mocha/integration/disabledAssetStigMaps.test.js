
import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { iterations } from '../iterations.js'
import { expectations } from './expectations.js'
import { expect } from 'chai'

// Covers issue #1780: stig_asset_map rows belonging to disabled assets must
// not contribute rows to default_rev, and removing a STIG from a Collection
// must also remove the mapping rows of the Collection's disabled assets.
//
// Fixture facts from appdata.jsonl:
// - Collection 21 maps VPN_SRG_TEST to enabled assets 42, 62, 154 and to
//   disabled asset 248 (reference.deletedAsset); Windows_10_STIG_TEST is
//   mapped to the same three enabled assets.
// - stig_asset_map has 17 rows; default_rev has 6 rows.
//
// Row counts are observed with GET /op/appinfo?includeRowCounts=true, since
// every read endpoint already filters through enabled_asset and cannot see
// the stale rows.

const collectionId = reference.testCollection.collectionId
const benchmarkId = reference.testCollection.benchmark
const otherBenchmarkId = 'Windows_10_STIG_TEST'
const enabledAssetIds = ['42', '62', '154']

const baseline = { stigAssetMapRows: 17, defaultRevRows: 6 }

async function getRowCounts () {
  const res = await utils.executeRequest(`${config.baseUrl}/op/appinfo?elevate=true&includeRowCounts=true`, 'GET', config.adminToken)
  expect(res.status).to.eql(200)
  return {
    stigAssetMapRows: res.body.mysql.tables.stig_asset_map.rowCount,
    defaultRevRows: res.body.mysql.tables.default_rev.rowCount
  }
}

async function getCollectionStigs () {
  const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/stigs`, 'GET', config.adminToken)
  expect(res.status).to.eql(200)
  return res.body.map(s => s.benchmarkId)
}

describe('Issue #1780 - disabled asset mappings excluded from default_rev', () => {

  for (const user of iterations) {
    if (expectations[user.name] === undefined) {
      it(`No expectations for this iteration scenario: ${user.name}`, async () => {})
      continue
    }
    describe(`user:${user.name}`, () => {
      const distinct = expectations[user.name]

      describe('Removing a STIG held by enabled and disabled assets', () => {

        before(async function () {
          await utils.loadAppData()
        })

        it('Baseline: row counts and collection STIG list', async () => {
          expect(await getRowCounts()).to.eql(baseline)
          expect(await getCollectionStigs()).to.have.members([benchmarkId, otherBenchmarkId])
        })

        it('Remove the STIG from all assets in the Collection', async () => {
          const res = await utils.executeRequest(
            `${config.baseUrl}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
            'PUT', user.token, []
          )
          if (distinct.canModifyCollection === false) {
            expect(res.status).to.eql(403)
            // perform the removal as admin so state assertions below apply
            const adminRes = await utils.executeRequest(
              `${config.baseUrl}/collections/${collectionId}/stigs/${benchmarkId}/assets`,
              'PUT', config.adminToken, []
            )
            expect(adminRes.status).to.eql(200)
            return
          }
          expect(res.status).to.eql(200)
        })

        it('Disabled asset mapping is deleted and no default_rev row remains', async () => {
          // 4 stig_asset_map rows removed: enabled assets 42, 62, 154 AND
          // disabled asset 248. Pre-fix the disabled mapping survived (14
          // rows) and re-inserted the default_rev pair (6 rows).
          expect(await getRowCounts()).to.eql({
            stigAssetMapRows: baseline.stigAssetMapRows - 4,
            defaultRevRows: baseline.defaultRevRows - 1
          })
          expect(await getCollectionStigs()).to.have.members([otherBenchmarkId])
        })
      })

      describe('Disabling every asset mapped to a STIG', () => {

        before(async function () {
          await utils.loadAppData()
        })

        it('Disable all assets carrying STIGs in the Collection', async () => {
          for (const assetId of enabledAssetIds) {
            await utils.deleteAsset(assetId)
          }
        })

        it('default_rev rows for the Collection are removed, mappings retained', async () => {
          // Disabling an asset keeps its stig_asset_map rows by design, but
          // the Collection pairs for both benchmarks must leave default_rev.
          // Pre-fix the pairs persisted (6 rows).
          expect(await getRowCounts()).to.eql({
            stigAssetMapRows: baseline.stigAssetMapRows,
            defaultRevRows: baseline.defaultRevRows - 2
          })
          expect(await getCollectionStigs()).to.be.empty
        })
      })
    })
  }
})
