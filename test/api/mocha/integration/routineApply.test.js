import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { iterations } from '../iterations.js'
import { expect } from 'chai'

const user = Object.fromEntries(iterations.map(iteration => [iteration.name, iteration]))
const { stigmanadmin: admin, lvl1, lvl3 } = user

const collectionId = reference.testCollection.collectionId
const otherCollectionId = reference.scrapCollection.collectionId
const ruleId = reference.freshRuleId
const [assetId, secondAssetId] = [reference.testAsset.assetId, reference.testAssetNoMetadata.assetId]
const otherCollectionAssetId = reference.scrapAsset.assetId

const match = { result: 'fail', detail: 'admin, svc_backup' }
const action = { result: 'pass', comment: 'Approved accounts per SSP', status: 'submitted' }
const detailAction = { ...action, detail: 'Verified by routine' }
const scanned = { ruleId, ...match, comment: null, status: 'saved' }

const routinesUrl = `${config.baseUrl}/collections/${collectionId}/routines`
const reviewUrl = (asset = assetId, cId = collectionId) => `${config.baseUrl}/collections/${cId}/reviews/${asset}`
const writtenReviewUrls = [
  `${reviewUrl()}/${ruleId}`,
  `${reviewUrl(secondAssetId)}/${ruleId}`,
  `${reviewUrl()}/${reference.ruleIdPinnedRev}`,
  `${reviewUrl(otherCollectionAssetId, otherCollectionId)}/${ruleId}`
]

async function createRoutine (overrides = {}) {
  const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, {
    name: `routine-${utils.getUUIDSubString(8)}`, ruleId, match, action, ...overrides
  })
  expect(res.status, JSON.stringify(res.body)).to.eql(201)
  return res.body
}

const patchRoutine = (routine, body) => utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'PATCH', admin.token, body)

async function importReviews (reviews, { asset = assetId, cId = collectionId, token = admin.token, query = '' } = {}) {
  const res = await utils.executeRequest(`${reviewUrl(asset, cId)}${query}`, 'POST', token, reviews)
  expect(res.status, JSON.stringify(res.body)).to.eql(200)
  return res.body
}

// The human edit path: PUT never applies routines.
async function putReview (body, asset = assetId) {
  const res = await utils.executeRequest(`${reviewUrl(asset)}/${ruleId}`, 'PUT', admin.token, body)
  expect(res.status, JSON.stringify(res.body)).to.be.oneOf([200, 201])
  return res.body
}

async function patchReview (body) {
  const res = await utils.executeRequest(`${reviewUrl()}/${ruleId}`, 'PATCH', admin.token, body)
  expect(res.status, JSON.stringify(res.body)).to.eql(200)
}

async function getReview (asset = assetId, cId = collectionId) {
  const res = await utils.executeRequest(`${reviewUrl(asset, cId)}/${ruleId}?projection=history`, 'GET', admin.token)
  return res.body
}

async function reviewRoutine (asset = assetId) {
  const res = await utils.executeRequest(`${reviewUrl(asset)}/${ruleId}?projection=routine`, 'GET', admin.token)
  return res.body.routine
}

const routineRef = routine => ({ routineId: routine.routineId, name: routine.name })

// review_history.routineId is not exposed by the API, so history provenance is read from an appdata export, as routine names.
async function historyRoutines (asset = assetId) {
  const routineNames = new Map()
  const histories = []
  let review
  await utils.exportAppData((table, row) => {
    if (table === 'collection_routine') routineNames.set(row.crId, row.name)
    if (table === 'review' && String(row.assetId) === asset && row.ruleId === ruleId) review = row
    if (table === 'review_history') histories.push(row)
  })
  return histories.filter(history => history.reviewId === review.reviewId).map(history => routineNames.get(history.routineId) ?? null)
}

function expectRoutineApplied (review, routine) {
  expect(review).to.include({ result: action.result, comment: action.comment, detail: routine.action.detail ?? match.detail })
  expect(review.status).to.include({ label: action.status, text: `Routine: ${routine.name}` })
  expect(review.status.user).to.eql({ userId: lvl3.userId, username: lvl3.name })
}

describe('Routine application tests', function () {

  let settings

  // Reloading appdata per test is slow, so each test instead undoes exactly what these tests write.
  before(async function () {
    await utils.loadAppData()
    ;({ settings } = await utils.getCollection(collectionId))
  })

  afterEach(async function () {
    for (const url of writtenReviewUrls) {
      await utils.executeRequest(url, 'DELETE', admin.token)
    }
    for (const routine of (await utils.executeRequest(routinesUrl, 'GET', admin.token)).body) {
      expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'DELETE', admin.token)).status).to.eql(204)
    }
    await utils.setDefaultRevision(collectionId, reference.testCollection.benchmark, 'latest')
    await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}`, 'PATCH', admin.token, { settings })
  })

  describe('POST - postReviewsByAsset - /collections/{collectionId}/reviews/{assetId}', function () {

    it('applies the routine to a new review and records its provenance', async function () {
      const routine = await createRoutine()
      const res = await importReviews([scanned])
      expect(res).to.eql({ rejected: [], affected: { inserted: 1, updated: 0, routineApplied: 1 } })
      const review = await getReview()
      expectRoutineApplied(review, routine)
      expect(review).to.not.have.property('routine')
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it('applies the routine with applyRoutines=true, as without it', async function () {
      const routine = await createRoutine()
      const res = await importReviews([scanned], { query: '?applyRoutines=true' })
      expect(res.affected).to.eql({ inserted: 1, updated: 0, routineApplied: 1 })
      expectRoutineApplied(await getReview(), routine)
    })

    it('leaves the review as imported with applyRoutines=false', async function () {
      await createRoutine()
      const res = await importReviews([scanned], { query: '?applyRoutines=false' })
      expect(res).to.eql({ rejected: [], affected: { inserted: 1, updated: 0, routineApplied: 0 } })
      const review = await getReview()
      expect(review).to.include({ result: match.result, detail: match.detail })
      expect(review.status).to.include({ label: 'saved', text: null })
      expect(await reviewRoutine()).to.eql(null)
    })

    it("adopts the ISSO's approved review as a no-op: review and history unchanged, routineId set", async function () {
      await putReview({ ...match, result: action.result, comment: action.comment, status: action.status })
      const routine = await createRoutine()
      const before = await getReview()
      const res = await importReviews([scanned])
      expect(res.affected).to.eql({ inserted: 0, updated: 0, routineApplied: 1 })
      expect(await getReview()).to.eql(before)
      expect(before.history).to.have.length(0)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it("applies the routine's detail, and an identical re-import leaves the review and its history unchanged", async function () {
      const routine = await createRoutine({ action: detailAction })
      const res = await importReviews([scanned])
      expect(res.affected).to.eql({ inserted: 1, updated: 0, routineApplied: 1 })
      const before = await getReview()
      expectRoutineApplied(before, routine)
      expect(await reviewRoutine()).to.eql(routineRef(routine))

      const again = await importReviews([scanned])
      expect(again.affected).to.eql({ inserted: 0, updated: 0, routineApplied: 1 })
      expect(await getReview()).to.eql(before)
    })

    it('adopts a review already equal to the action, detail included, as a no-op', async function () {
      await putReview({ ...match, ...detailAction })
      const routine = await createRoutine({ action: detailAction })
      const before = await getReview()
      const res = await importReviews([scanned])
      expect(res.affected).to.eql({ inserted: 0, updated: 0, routineApplied: 1 })
      expect(await getReview()).to.eql(before)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it('adopts a review with an empty comment when the action keeps the imported comment', async function () {
      const keepCommentAction = { result: 'notapplicable', comment: null, status: 'saved' }
      await putReview({ ...match, ...keepCommentAction, comment: '' })
      const routine = await createRoutine({ action: keepCommentAction })
      const before = await getReview()
      const res = await importReviews([scanned])
      expect(res.affected).to.eql({ inserted: 0, updated: 0, routineApplied: 1 })
      expect(await getReview()).to.eql(before)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    for (const [difference, actionOverride] of [
      ['a different detail', { detail: detailAction.detail }],
      ['a case-only different detail', { detail: match.detail.toUpperCase() }],
      ['a case-only different comment', { comment: action.comment.toUpperCase() }]
    ]) {
      it(`does not adopt a review whose human-set value has ${difference} than the action`, async function () {
        await putReview({ ...match, result: action.result, comment: action.comment, status: action.status })
        await createRoutine({ action: { ...action, ...actionOverride } })
        const res = await importReviews([scanned])
        expect(res.affected.routineApplied).to.eql(0)
        expect(await getReview()).to.include({ detail: match.detail, comment: action.comment })
        expect(await reviewRoutine()).to.eql(null)
      })
    }

    for (const [field, routineAction] of [['detail', detailAction], ['comment', action]]) {
      it(`rewrites a review it set when only the case of its action ${field} changed`, async function () {
        const routine = await createRoutine({ action: routineAction })
        await importReviews([scanned])
        const caseChanged = routineAction[field].toUpperCase()
        expect((await patchRoutine(routine, { action: { [field]: caseChanged } })).status).to.eql(200)
        const res = await importReviews([scanned])
        expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 1 })
        expect(await getReview()).to.include({ [field]: caseChanged })
      })
    }

    it('applies the routine over untouched automated output, stamping the status it sets', async function () {
      await putReview({ ...match, comment: '', status: 'saved' })
      const routine = await createRoutine()
      await utils.wait(1100)
      const res = await importReviews([{ ruleId, ...match, comment: null }])
      expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 1 })
      const review = await getReview()
      expectRoutineApplied(review, routine)
      expect(review.status.ts).to.eql(review.ts)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it('leaves automated output whose detail differs from the scan only in case as the import alone would', async function () {
      await putReview({ ...match, detail: match.detail.toUpperCase(), comment: '', status: 'saved' })
      await createRoutine()
      const res = await importReviews([scanned])
      expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 0 })
      expect(await getReview()).to.include({ ...match, comment: '' })
      expect(await reviewRoutine()).to.eql(null)
    })

    it('leaves automated output a human commented on as the import alone would', async function () {
      await importReviews([scanned])
      await patchReview({ comment: 'POA&M 123' })
      await createRoutine()
      const res = await importReviews([scanned])
      expect(res.affected.routineApplied).to.eql(0)
      expect(await getReview()).to.include({ ...match, comment: 'POA&M 123' })
      expect(await reviewRoutine()).to.eql(null)
    })

    // An import without routines that keeps existing comments reverts a review a routine set to the scan,
    // but leaves the routine's comment, which is not a human annotation; any other comment is.
    for (const [kept, comment, applied] of [
      ["the routine's own comment", action.comment, 1],
      ['a human comment', 'POA&M 123', 0]
    ]) {
      it(`${applied ? 'takes back' : 'leaves'} automated output keeping ${kept} after an import without routines`, async function () {
        const routine = await createRoutine()
        await importReviews([scanned])
        expect((await importReviews([scanned], { query: '?applyRoutines=false' })).affected.routineApplied).to.eql(0)
        expect(await getReview()).to.include({ ...match, comment: action.comment })
        expect((await getReview()).status.label).to.eql('saved')
        expect(await reviewRoutine()).to.eql(null)
        if (!applied) await patchReview({ comment })

        const res = await importReviews([scanned])
        expect(res.affected.routineApplied).to.eql(applied)
        if (applied) {
          expectRoutineApplied(await getReview(), routine)
          expect(await reviewRoutine()).to.eql(routineRef(routine))
        }
        else {
          expect(await getReview()).to.include({ ...match, comment })
          expect(await reviewRoutine()).to.eql(null)
        }
      })
    }

    it('leaves a review a human decided differently exactly as the import alone would', async function () {
      await putReview({ ...match, comment: 'compensating control', status: 'submitted' })
      await createRoutine()
      const res = await importReviews([{ ruleId, ...match, comment: null }])
      expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 0 })
      const review = await getReview()
      expect(review).to.include({ result: 'fail', comment: 'compensating control', detail: match.detail })
      expect(review.status.label).to.eql('submitted')
      expect(await reviewRoutine()).to.eql(null)
    })

    it('does not re-apply after a human edit supersedes it; the superseded history row keeps the routineId', async function () {
      const routine = await createRoutine()
      await importReviews([scanned])
      await putReview({ ...match, comment: 'no longer approved', status: 'submitted' })
      expect(await reviewRoutine()).to.eql(null)
      expect(await historyRoutines()).to.eql([routine.name])

      const res = await importReviews([scanned])
      expect(res.affected.routineApplied).to.eql(0)
      expect(await getReview()).to.include({ result: 'fail', comment: 'no longer approved' })
      expect(await reviewRoutine()).to.eql(null)
    })

    it('leaves history, ts and userId unchanged across repeated identical imports', async function () {
      await createRoutine()
      await importReviews([scanned])
      const before = await getReview()
      for (let cycle = 0; cycle < 5; cycle++) {
        const res = await importReviews([scanned], { token: lvl3.token })
        expect(res.affected).to.eql({ inserted: 0, updated: 0, routineApplied: 1 })
      }
      expect(await getReview()).to.eql(before)
    })

    it('writes new metadata on a re-import a routine already handled', async function () {
      const routine = await createRoutine()
      await importReviews([scanned])
      const metadata = { [reference.reviewMetadataKey]: reference.reviewMetadataValue }
      const res = await importReviews([{ ...scanned, metadata }])
      expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 1 })
      expect((await utils.executeRequest(`${reviewUrl()}/${ruleId}/metadata`, 'GET', admin.token)).body).to.eql(metadata)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it('matches detail after trimming it', async function () {
      const routine = await createRoutine()
      await importReviews([{ ...scanned, detail: `  ${match.detail}  ` }])
      expectRoutineApplied(await getReview(), routine)
    })

    for (const [difference, mismatch] of [
      ['detail', { detail: `${match.detail}, eve` }],
      ['result', { result: 'notapplicable' }]
    ]) {
      it(`does not apply when the incoming ${difference} differs`, async function () {
        await createRoutine()
        const res = await importReviews([{ ...scanned, ...mismatch }])
        expect(res.affected.routineApplied).to.eql(0)
        expect(await getReview()).to.include({ ...match, ...mismatch, comment: '' })
        expect((await getReview()).status.label).to.eql('saved')
      })
    }

    it('does not apply when the import leaves detail to the stored review', async function () {
      await putReview({ ...match, comment: '', status: 'saved' })
      await createRoutine()
      const res = await importReviews([{ ruleId, result: match.result, detail: null, comment: 'scanner note' }])
      expect(res.affected).to.eql({ inserted: 0, updated: 1, routineApplied: 0 })
      expect(await getReview()).to.include({ ...match, comment: 'scanner note' })
      expect(await reviewRoutine()).to.eql(null)
    })

    for (const state of ['disabled', 'needsReview']) {
      it(`does not apply a routine in state ${state}`, async function () {
        const routine = await createRoutine()
        expect((await patchRoutine(routine, { state })).status).to.eql(200)
        const res = await importReviews([scanned])
        expect(res.affected.routineApplied).to.eql(0)
        expect(await getReview()).to.include(match)
      })
    }

    it('does not apply a routine whose approver was deleted', async function () {
      const routine = await createRoutine()
      await utils.editAppData((table, row) => {
        if (table === 'collection_routine' && row.name === routine.name) row.approvedUserId = null
      })
      const res = await importReviews([scanned])
      expect(res.affected.routineApplied).to.eql(0)
      expect(await getReview()).to.include(match)
    })

    it('does not apply a stale routine to reviews on the current check content', async function () {
      const routine = await createRoutine({ ruleId: reference.ruleId })
      await utils.uploadTestStig(reference.testStigfileNonLatest)
      await utils.setDefaultRevision(collectionId, reference.testCollection.benchmark, reference.testCollection.pinRevision)
      const pinnedRuleId = reference.ruleIdPinnedRev
      expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'GET', admin.token)).body.stale).to.eql(true)
      const res = await importReviews([{ ...scanned, ruleId: pinnedRuleId }])
      expect(res.affected).to.eql({ inserted: 1, updated: 0, routineApplied: 0 })
      const review = await utils.executeRequest(`${reviewUrl()}/${pinnedRuleId}`, 'GET', admin.token)
      expect(review.body).to.include(match)
      expect(review.body.status.label).to.eql('saved')

      const { assetId: unreviewedAssetId } = await utils.createTempAsset()
      try {
        const approvedContent = await importReviews([{ ...scanned, ruleId: reference.ruleId }], { asset: unreviewedAssetId })
        expect(approvedContent.affected).to.eql({ inserted: 1, updated: 0, routineApplied: 0 })
      }
      finally {
        await utils.deleteAsset(unreviewedAssetId)
      }
    })

    // Reviews are keyed by rule_version_check_digest, one key per ruleId (the newest-dated revision's), whatever the pin.
    describe('under a pin to a revision that reuses the ruleId with other check content', function () {
      const { benchmark } = reference.testCollection
      const reusedRuleId = reference.ruleId
      let tempAssetId

      before(async function () {
        await utils.uploadTestStig(reference.testStigfileNonLatest)
        await utils.uploadTestStig(reference.reusedRuleIdStig.file)
      })

      after(async function () {
        await utils.deleteStigByRevision(benchmark, reference.reusedRuleIdStig.revisionStr)
      })

      beforeEach(async function () {
        ;({ assetId: tempAssetId } = await utils.createTempAsset())
      })

      // A deleted asset keeps its reviews, which would keep the outer afterEach from deleting the routines.
      afterEach(async function () {
        await utils.executeRequest(`${reviewUrl(tempAssetId)}/${reusedRuleId}`, 'DELETE', admin.token)
        await utils.deleteAsset(tempAssetId)
      })

      const pinReusedRevision = () => utils.setDefaultRevision(collectionId, benchmark, reference.reusedRuleIdStig.revisionStr)

      async function importReused () {
        const res = await importReviews([{ ...scanned, ruleId: reusedRuleId }], { asset: tempAssetId })
        const review = await utils.executeRequest(`${reviewUrl(tempAssetId)}/${reusedRuleId}?projection=routine`, 'GET', admin.token)
        return { affected: res.affected, review: review.body }
      }

      it('applies a routine approved on the review key, which is not stale', async function () {
        const routine = await createRoutine({ ruleId: reusedRuleId })
        await pinReusedRevision()
        expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'GET', admin.token)).body.stale).to.eql(false)
        const { affected, review } = await importReused()
        expect(affected).to.eql({ inserted: 1, updated: 0, routineApplied: 1 })
        expectRoutineApplied(review, routine)
        expect(review.routine).to.eql(routineRef(routine))
      })

      it('applies a routine created under the pin, which stores the review key', async function () {
        const unpinned = await createRoutine({ ruleId: reusedRuleId })
        await pinReusedRevision()
        const routine = await createRoutine({ ruleId: reusedRuleId, match: { ...match, detail: `${match.detail} pinned` } })
        expect(routine).to.include({ version: unpinned.version, checkDigest: unpinned.checkDigest, stale: false })
        const res = await importReviews([{ ...scanned, ruleId: reusedRuleId, detail: routine.match.detail }], { asset: tempAssetId })
        expect(res.affected).to.eql({ inserted: 1, updated: 0, routineApplied: 1 })
      })

      it("does not apply a routine approved on the pinned revision's check content, which is stale", async function () {
        await utils.setDefaultRevision(collectionId, benchmark, reference.testCollection.pinRevision)
        const routine = await createRoutine({ ruleId: reference.ruleIdPinnedRev })
        await pinReusedRevision()
        expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'GET', admin.token)).body.stale).to.eql(true)
        const { affected, review } = await importReused()
        expect(affected).to.eql({ inserted: 1, updated: 0, routineApplied: 0 })
        expect(review).to.include(match)
        expect(review.routine).to.eql(null)
      })
    })

    it('does not apply on the human edit paths, PUT and PATCH', async function () {
      await createRoutine()
      await putReview({ ...match, comment: '', status: 'saved' })
      expect(await getReview()).to.include(match)

      await putReview({ result: 'pass', detail: 'other', comment: '', status: 'saved' }, secondAssetId)
      const patched = await utils.executeRequest(`${reviewUrl(secondAssetId)}/${ruleId}`, 'PATCH', admin.token, match)
      expect(patched.status).to.eql(200)
      expect(patched.body).to.include(match)
    })

    it("rejects a routine-applied row that fails the Collection's field requirements, naming the routine", async function () {
      const routine = await createRoutine({ action: { result: action.result, status: action.status } })
      const patched = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}`, 'PATCH', admin.token, {
        settings: { ...settings, fields: { ...settings.fields, comment: { enabled: 'always', required: 'always' } } }
      })
      expect(patched.status).to.eql(200)

      const res = await importReviews([{ ...scanned, comment: '' }])
      expect(res).to.eql({
        rejected: [{ ruleId, reason: `empty comment is not allowed for status = submitted, accepted, rejected (Routine: ${routine.name})` }],
        affected: { inserted: 0, updated: 0, routineApplied: 0 }
      })
      expect((await utils.executeRequest(`${reviewUrl()}/${ruleId}`, 'GET', admin.token)).status).to.eql(204)
    })

    it('rejects a row for grant reasons exactly as before', async function () {
      await createRoutine()
      const res = await importReviews([scanned], { asset: reference.testCollection.lvl1ReadOnlyAssetId, token: lvl1.token })
      expect(res).to.eql({
        rejected: [{ ruleId, reason: 'no grant for this asset/ruleId' }],
        affected: { inserted: 0, updated: 0, routineApplied: 0 }
      })
    })

    it('never applies a routine to an import into another Collection', async function () {
      await createRoutine()
      const res = await importReviews([scanned], { asset: otherCollectionAssetId, cId: otherCollectionId })
      expect(res).to.eql({ rejected: [], affected: { inserted: 1, updated: 0, routineApplied: 0 } })
      expect(await getReview(otherCollectionAssetId, otherCollectionId)).to.include(match)
    })
  })

  describe('POST - postReviewBatch - /collections/{collectionId}/reviews', function () {

    const batch = (review, assetIds = [assetId, secondAssetId], cId = collectionId, query = '') => utils.executeRequest(`${config.baseUrl}/collections/${cId}/reviews${query}`, 'POST', admin.token, {
      source: { review },
      assets: { assetIds },
      rules: { ruleIds: [ruleId] }
    })

    it('applies the routine to every new review', async function () {
      const routine = await createRoutine()
      const res = await batch(match)
      expect(res.body).to.eql({ inserted: 2, updated: 0, failedValidation: 0, validationErrors: [], routineApplied: 2 })
      for (const asset of [assetId, secondAssetId]) {
        expectRoutineApplied(await getReview(asset), routine)
      }
      const { body: reviews } = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/reviews?projection=routine`, 'GET', admin.token)
      const setByRoutine = reviews.filter(review => review.routine !== null)
      expect(setByRoutine.map(review => [review.assetId, review.ruleId, review.routine])).to.have.deep.members([
        [assetId, ruleId, routineRef(routine)],
        [secondAssetId, ruleId, routineRef(routine)]
      ])
      expect(reviews.length).to.be.greaterThan(setByRoutine.length)
    })

    it("applies the routine's detail", async function () {
      const routine = await createRoutine({ action: detailAction })
      const res = await batch(match)
      expect(res.body).to.eql({ inserted: 2, updated: 0, failedValidation: 0, validationErrors: [], routineApplied: 2 })
      for (const asset of [assetId, secondAssetId]) {
        expectRoutineApplied(await getReview(asset), routine)
      }
    })

    it('leaves every review as written with applyRoutines=false', async function () {
      await createRoutine()
      const res = await batch(match, [assetId, secondAssetId], collectionId, '?applyRoutines=false')
      expect(res.body).to.eql({ inserted: 2, updated: 0, failedValidation: 0, validationErrors: [], routineApplied: 0 })
      for (const asset of [assetId, secondAssetId]) {
        expect(await getReview(asset)).to.include({ result: match.result, detail: match.detail })
        expect(await reviewRoutine(asset)).to.eql(null)
      }
    })

    it('reports routineApplied = 0 without routines', async function () {
      const res = await batch(match, [otherCollectionAssetId], otherCollectionId)
      expect(res.body).to.eql({ inserted: 1, updated: 0, failedValidation: 0, validationErrors: [], routineApplied: 0 })
    })

    it('does not apply to an update that supplies only a comment', async function () {
      await putReview({ ...match, comment: '', status: 'saved' })
      await createRoutine()
      const res = await batch({ comment: 'scanner note' }, [assetId])
      expect(res.body).to.eql({ inserted: 0, updated: 1, failedValidation: 0, validationErrors: [], routineApplied: 0 })
      expect(await getReview()).to.include({ ...match, comment: 'scanner note' })
      expect(await reviewRoutine()).to.eql(null)
    })

    for (const [carried, review] of [['a match', match], ['only metadata', { metadata: { [reference.reviewMetadataKey]: reference.reviewMetadataValue } }]]) {
      it(`rejects a dry-run row carrying ${carried} on an asset without a grant without naming the routine the review carries`, async function () {
        await createRoutine()
        expect((await importReviews([scanned], { asset: secondAssetId })).affected.routineApplied).to.eql(1)
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/reviews`, 'POST', lvl1.token, {
          source: { review },
          assets: { assetIds: [secondAssetId] },
          rules: { ruleIds: [ruleId] },
          dryRun: true
        })
        expect(res.body.validationErrors).to.eql([{ assetId: secondAssetId, ruleId, error: 'no grant for this asset/ruleId' }])
      })
    }

    for (const [action, failedValidation] of [['insert', 0], ['update', 1]]) {
      for (const query of ['', '?applyRoutines=false']) {
        it(`validates an ${action} over a review on an asset without a grant as before${query && ', without routines'}`, async function () {
          await putReview({ ...match, comment: '', status: 'saved' }, secondAssetId)
          const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/reviews${query}`, 'POST', lvl1.token, {
            source: { review: match },
            assets: { assetIds: [secondAssetId] },
            rules: { ruleIds: [ruleId] },
            action
          })
          expect(res.body).to.eql({
            inserted: 0,
            updated: 0,
            failedValidation,
            validationErrors: failedValidation ? [{ assetId: secondAssetId, ruleId, error: 'no grant for this asset/ruleId' }] : [],
            routineApplied: 0
          })
        })
      }
    }
  })

  describe('PATCH - updateAsset - /assets/{assetId} - transfer to another collection', function () {

    it("leaves the destination's reviews without the source routine, which stays deletable", async function () {
      const routine = await createRoutine()
      const { assetId: transferredAssetId } = await utils.createTempAsset()
      try {
        expect((await importReviews([scanned], { asset: transferredAssetId })).affected.routineApplied).to.eql(1)
        const transferred = await utils.executeRequest(`${config.baseUrl}/assets/${transferredAssetId}`, 'PATCH', admin.token, { collectionId: otherCollectionId })
        expect(transferred.status, JSON.stringify(transferred.body)).to.eql(200)

        const res = await utils.executeRequest(`${reviewUrl(transferredAssetId, otherCollectionId)}/${ruleId}?projection=routine`, 'GET', admin.token)
        expect(res.body).to.include({ result: action.result, comment: action.comment, routine: null })
        expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'GET', admin.token)).body.reviewCount).to.eql(0)
        expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'DELETE', admin.token)).status).to.eql(204)
      }
      finally {
        await utils.deleteAsset(transferredAssetId)
      }
    })
  })

  describe('Task - ReviewAging', function () {
    const agingConfigUrl = `${config.baseUrl}/collections/${collectionId}/tasks/review-aging/config`
    const reviewAgingJobId = 4

    afterEach(async function () {
      await utils.executeRequest(agingConfigUrl, 'DELETE', admin.token)
    })

    for (const [updateField, updateValue] of [['status', 'saved'], ['result', 'notchecked']]) {
      it(`clears the routine of a review whose ${updateField} it ages, which the history snapshot keeps, so a re-import does not re-apply it`, async function () {
        this.timeout(60_000)
        const routine = await createRoutine()
        const { assetId: agedAssetId } = await utils.createTempAsset()
        try {
          await importReviews([scanned], { asset: agedAssetId })
          await utils.wait(1100)
          const configured = await utils.executeRequest(agingConfigUrl, 'PUT', admin.token, [{
            triggerField: 'ts', triggerInterval: 0, triggerAction: 'update', updateField, updateValue, target: { assetId: agedAssetId }, enabled: true
          }])
          expect(configured.status, JSON.stringify(configured.body)).to.eql(200)
          const run = await utils.executeRequest(`${config.baseUrl}/jobs/${reviewAgingJobId}/runs?elevate=true`, 'POST', admin.token)
          expect(await utils.waitForRunFinish(run.body.runId)).to.eql('completed')

          expect(await reviewRoutine(agedAssetId)).to.eql(null)
          expect(await historyRoutines(agedAssetId)).to.eql([routine.name])
          expect((await importReviews([scanned], { asset: agedAssetId })).affected.routineApplied).to.eql(0)
        }
        finally {
          await utils.deleteAsset(agedAssetId)
        }
      })
    }
  })

  describe('POST - exportToCollection - /collections/{collectionId}/export-to/{dstCollectionId}', function () {

    it('clears the routine of a destination review it overwrites, which the history snapshot keeps, so a re-import does not re-apply it', async function () {
      const routine = await createRoutine()
      const { assetId: dstAssetId, name } = await utils.createTempAsset()
      const { assetId: srcAssetId } = await utils.createTempAsset({
        name, collectionId: otherCollectionId, description: 'temp', ip: '1.1.1.1', noncomputing: true, metadata: {}, stigs: [reference.testCollection.benchmark]
      })
      try {
        await importReviews([scanned], { asset: dstAssetId })
        const exported = { ruleId, result: 'fail', detail: 'exported decision', comment: 'exported', status: 'saved' }
        await importReviews([exported], { asset: srcAssetId, cId: otherCollectionId })
        const res = await utils.executeRequest(`${config.baseUrl}/collections/${otherCollectionId}/export-to/${collectionId}`, 'POST', admin.token, [{ assetId: srcAssetId }])
        expect(res.status).to.eql(200)

        expect(await getReview(dstAssetId)).to.include({ detail: exported.detail, comment: exported.comment })
        expect(await reviewRoutine(dstAssetId)).to.eql(null)
        expect(await historyRoutines(dstAssetId)).to.eql([routine.name])
        expect((await importReviews([scanned], { asset: dstAssetId })).affected.routineApplied).to.eql(0)
      }
      finally {
        await utils.deleteAsset(dstAssetId)
        await utils.deleteAsset(srcAssetId)
      }
    })
  })

  describe('human writes to a review a routine set', function () {
    const metadata = { [reference.reviewMetadataKey]: reference.reviewMetadataValue }
    let routine

    beforeEach(async function () {
      routine = await createRoutine()
      await importReviews([scanned])
    })

    for (const [method, path, status, body] of [
      ['PUT', '/metadata', 200, metadata],
      ['PATCH', '/metadata', 200, metadata],
      ['PUT', `/metadata/keys/${reference.reviewMetadataKey}`, 204, reference.reviewMetadataValue],
      ['DELETE', `/metadata/keys/${reference.reviewMetadataKey}`, 204]
    ]) {
      it(`keeps the routine and leaves the rest of the review unchanged on ${method} ${path}`, async function () {
        const before = await getReview()
        const res = await utils.executeRequest(`${reviewUrl()}/${ruleId}${path}`, method, admin.token, body)
        expect(res.status, JSON.stringify(res.body)).to.eql(status)
        expect(await getReview()).to.eql(before)
        expect(await reviewRoutine()).to.eql(routineRef(routine))
      })
    }

    it('keeps the routine on a PATCH of metadata alone, writing the metadata and a history row', async function () {
      const before = await getReview()
      await patchReview({ metadata })
      expect((await utils.executeRequest(`${reviewUrl()}/${ruleId}/metadata`, 'GET', admin.token)).body).to.eql(metadata)
      expect(await getReview()).to.deep.include({ result: before.result, detail: before.detail, comment: before.comment, ts: before.ts, userId: before.userId, status: before.status })
      expect(await reviewRoutine()).to.eql(routineRef(routine))
      expect(await historyRoutines()).to.eql([routine.name])
    })

    for (const [carried, body] of [
      ['a comment', { comment: 'human' }],
      ['the stored result and detail', { result: action.result, detail: match.detail }]
    ]) {
      it(`clears the routine on a PATCH carrying ${carried}`, async function () {
        await patchReview(body)
        expect(await reviewRoutine()).to.eql(null)
      })
    }

    it('clears the routine and its status text on a PATCH carrying a status', async function () {
      await patchReview({ status: 'accepted' })
      expect(await reviewRoutine()).to.eql(null)
      expect((await getReview()).status.text).to.not.eql(`Routine: ${routine.name}`)
    })

    it('keeps the routine on a batch update carrying only metadata, writing the metadata', async function () {
      const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/reviews`, 'POST', admin.token, {
        source: { review: { metadata } }, assets: { assetIds: [assetId] }, rules: { ruleIds: [ruleId] }, action: 'update'
      })
      expect(res.body).to.eql({ inserted: 0, updated: 1, failedValidation: 0, validationErrors: [], routineApplied: 0 })
      expect((await utils.executeRequest(`${reviewUrl()}/${ruleId}/metadata`, 'GET', admin.token)).body).to.eql(metadata)
      expect(await reviewRoutine()).to.eql(routineRef(routine))
    })

    it('clears the routine on a batch update carrying only resultEngine, writing the resultEngine', async function () {
      const resultEngine = { type: 'script', product: 'Evaluate-STIG' }
      const res = await utils.executeRequest(`${config.baseUrl}/collections/${collectionId}/reviews`, 'POST', admin.token, {
        source: { review: { resultEngine } }, assets: { assetIds: [assetId] }, rules: { ruleIds: [ruleId] }, action: 'update'
      })
      expect(res.body).to.eql({ inserted: 0, updated: 1, failedValidation: 0, validationErrors: [], routineApplied: 0 })
      expect((await getReview()).resultEngine).to.eql(resultEngine)
      expect(await reviewRoutine()).to.eql(null)
    })

    it('clears the routine on a PUT of the same review with new metadata', async function () {
      const { result, detail, comment, status } = await getReview()
      await putReview({ result, detail, comment, status: status.label, metadata })
      expect(await reviewRoutine()).to.eql(null)
    })
  })
})
