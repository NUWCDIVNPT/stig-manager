
import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { iterations } from '../iterations.js'
import { expectations } from './expectations.js'
import { expect } from 'chai'

// Covers issue #2051: a deprecated revision with a higher version+release
// should be selected as "latest" instead of an older accepted revision.
// The fixture U_VPN_SRG_V2R0_Manual-xccdf-deprecated.xml imports
// VPN_SRG_TEST V2R0 with status="deprecated"; the seeded appdata already
// contains VPN_SRG_TEST V1R1 with status="accepted".

const benchmarkId = reference.testCollection.benchmark
const deprecatedRevisionStr = 'V2R0'
const acceptedRevisionStr = reference.testCollection.defaultRevision
const deprecatedFixture = 'U_VPN_SRG_V2R0_Manual-xccdf-deprecated.xml'

describe('Issue #2051 - deprecated revision as latest', () => {

  for (const user of iterations) {
    if (expectations[user.name] === undefined) {
      it(`No expectations for this iteration scenario: ${user.name}`, async () => {})
      continue
    }
    describe(`user:${user.name}`, () => {
      const distinct = expectations[user.name]

      before(async function () {
        await utils.loadAppData()
        try {
          await utils.deleteStigByRevision(benchmarkId, deprecatedRevisionStr)
        } catch {
          // not present yet
        }
      })

      after(async function () {
        try {
          await utils.deleteStigByRevision(benchmarkId, deprecatedRevisionStr)
        } catch {
          // already removed
        }
      })

      describe('Latest selection after deprecated import', () => {

        it('Baseline: accepted V1R1 is latest before deprecated import', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(acceptedRevisionStr)
        })

        it('Import a deprecated revision with a higher version+release', async () => {
          const res = await utils.uploadTestStig(deprecatedFixture)
          expect(res).to.deep.include({
            benchmarkId,
            revisionStr: deprecatedRevisionStr,
            action: 'inserted'
          })
        })

        it('lastRevisionStr now reports the deprecated revision', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(deprecatedRevisionStr)
          expect(res.body.revisionStrs).to.include.members([acceptedRevisionStr, deprecatedRevisionStr])
        })

        it('GET .../revisions/latest resolves to the deprecated revision and exposes status', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}/revisions/latest`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.revisionStr).to.eql(deprecatedRevisionStr)
          expect(res.body.status).to.eql('deprecated')
        })

        it('GET .../revisions still lists both revisions', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}/revisions`, 'GET', user.token)
          expect(res.status).to.eql(200)
          const revisionStrs = res.body.map(r => r.revisionStr)
          expect(revisionStrs).to.include.members([acceptedRevisionStr, deprecatedRevisionStr])
        })
      })

      describe('Collection default revision resolution', () => {

        it("Setting defaultRevisionStr='latest' resolves to the deprecated revision", async () => {
          const post = {
            defaultRevisionStr: 'latest',
            assetIds: reference.writeStigPropsByCollectionStig
          }
          const res = await utils.executeRequest(
            `${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${benchmarkId}`,
            'POST', user.token, post
          )
          if (distinct.canModifyCollection === false) {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.revisionStr).to.eql(deprecatedRevisionStr)
          expect(res.body.revisionPinned).to.eql(false)
          expect(res.body.benchmarkId).to.eql(benchmarkId)
        })

        it('Pinning to the accepted V1R1 still works (regression)', async () => {
          const post = {
            defaultRevisionStr: acceptedRevisionStr,
            assetIds: reference.writeStigPropsByCollectionStig
          }
          const res = await utils.executeRequest(
            `${config.baseUrl}/collections/${reference.testCollection.collectionId}/stigs/${benchmarkId}`,
            'POST', user.token, post
          )
          if (distinct.canModifyCollection === false) {
            expect(res.status).to.eql(403)
            return
          }
          expect(res.status).to.eql(200)
          expect(res.body.revisionStr).to.eql(acceptedRevisionStr)
          expect(res.body.revisionPinned).to.eql(true)
        })
      })

      describe('Reverting after delete', () => {

        it('Deleting the deprecated revision restores V1R1 as latest', async () => {
          if (distinct.grant === 'none') {
            // collection-creator has no read access to confirm
            return
          }
          await utils.deleteStigByRevision(benchmarkId, deprecatedRevisionStr)
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(acceptedRevisionStr)
        })
      })
    })
  }
})
