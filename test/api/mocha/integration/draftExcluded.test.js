
import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { iterations } from '../iterations.js'
import { expectations } from './expectations.js'
import { expect } from 'chai'

// Covers issue #2051: revisions with status="draft" must never be auto-selected
// as "latest", even when their version+release ranks higher than every other
// revision of the same benchmark. Non-draft statuses (accepted, deprecated,
// sunset, etc.) all compete equally on version+release, so deprecated-wins-
// over-accepted is just version+release ordering and is exercised elsewhere.
//
// The fixture U_VPN_SRG_V2R0_Manual-xccdf-draft.xml imports VPN_SRG_TEST V2R0
// with status="draft"; the seeded appdata already contains VPN_SRG_TEST V1R1
// with status="accepted".

const benchmarkId = reference.testCollection.benchmark
const draftRevisionStr = 'V2R0'
const acceptedRevisionStr = reference.testCollection.defaultRevision
const draftFixture = 'U_VPN_SRG_V2R0_Manual-xccdf-draft.xml'

describe('Issue #2051 - draft revision excluded from "latest"', () => {

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
          await utils.deleteStigByRevision(benchmarkId, draftRevisionStr)
        } catch {
          // not present yet
        }
      })

      after(async function () {
        try {
          await utils.deleteStigByRevision(benchmarkId, draftRevisionStr)
        } catch {
          // already removed
        }
      })

      describe('Latest selection with a higher-versioned draft', () => {

        it('Baseline: accepted V1R1 is latest before draft import', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(acceptedRevisionStr)
        })

        it('Import a draft revision with a higher version+release', async () => {
          const res = await utils.uploadTestStig(draftFixture)
          expect(res).to.deep.include({
            benchmarkId,
            revisionStr: draftRevisionStr,
            action: 'inserted'
          })
        })

        it('lastRevisionStr still reports the accepted revision (draft is held back)', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(acceptedRevisionStr)
          expect(res.body.revisionStrs).to.include.members([acceptedRevisionStr, draftRevisionStr])
        })

        it('GET .../revisions/latest resolves to the accepted revision', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}/revisions/latest`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.revisionStr).to.eql(acceptedRevisionStr)
          expect(res.body.status).to.eql('accepted')
        })

        it('GET .../revisions still lists both revisions', async () => {
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}/revisions`, 'GET', user.token)
          expect(res.status).to.eql(200)
          const revisionStrs = res.body.map(r => r.revisionStr)
          expect(revisionStrs).to.include.members([acceptedRevisionStr, draftRevisionStr])
        })
      })

      describe('Collection default revision resolution', () => {

        it("Setting defaultRevisionStr='latest' resolves to the accepted revision", async () => {
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
          expect(res.body.revisionStr).to.eql(acceptedRevisionStr)
          expect(res.body.revisionPinned).to.eql(false)
          expect(res.body.benchmarkId).to.eql(benchmarkId)
        })

        it('Explicit pin to the draft V2R0 still works (regression)', async () => {
          const post = {
            defaultRevisionStr: draftRevisionStr,
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
          expect(res.body.revisionStr).to.eql(draftRevisionStr)
          expect(res.body.revisionPinned).to.eql(true)
        })
      })

      describe('Reverting after delete', () => {

        it('Deleting the draft revision leaves V1R1 as latest', async () => {
          await utils.deleteStigByRevision(benchmarkId, draftRevisionStr)
          const res = await utils.executeRequest(`${config.baseUrl}/stigs/${benchmarkId}`, 'GET', user.token)
          expect(res.status).to.eql(200)
          expect(res.body.lastRevisionStr).to.eql(acceptedRevisionStr)
        })
      })
    })
  }
})
