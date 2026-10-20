import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { iterations } from '../iterations.js'
import { expectations } from './expectations.js'
import { expect } from 'chai'
import { createHash } from 'crypto'

const user = Object.fromEntries(iterations.map(iteration => [iteration.name, iteration]))
const admin = user.stigmanadmin
const lvl3 = user.lvl3

const collectionId = reference.testCollection.collectionId
const routinesUrl = `${config.baseUrl}/collections/${collectionId}/routines`
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Each routine gets a unique name and detail so tests sharing one appdata load never collide on uk_name or uk_match.
function newRoutine (overrides = {}) {
  const unique = utils.getUUIDSubString(8)
  return {
    name: `routine-${unique}`,
    ruleId: reference.ruleId,
    match: { result: 'fail', detail: `admin, svc_backup ${unique}` },
    action: { result: 'pass', comment: 'approved accounts', status: 'submitted' },
    ...overrides
  }
}

async function createRoutine (body = newRoutine(), token = lvl3.token) {
  const res = await utils.executeRequest(routinesUrl, 'POST', token, body)
  expect(res.status, JSON.stringify(res.body)).to.eql(201)
  return res.body
}

const reviewsUrl = `${config.baseUrl}/collections/${collectionId}/reviews`

// An automated (scanner) result, which a routine can match and a source review derives its match from.
async function importAutomated (assetId, ruleId, { result = 'fail', detail }) {
  const res = await utils.executeRequest(`${reviewsUrl}/${assetId}`, 'POST', admin.token, [{
    ruleId, result, detail, comment: '', resultEngine: { type: 'script', product: 'Evaluate-STIG' }, status: 'saved'
  }])
  expect(res.body.rejected, JSON.stringify(res.body)).to.eql([])
  return res.body
}

const getRoutineSource = (assetId, ruleId, token = admin.token) =>
  utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}?projection=routineSource`, 'GET', token)

const getRoutine = routineId => utils.executeRequest(`${routinesUrl}/${routineId}`, 'GET', admin.token)
const getRoutineChecks = async routineId => (await utils.executeRequest(`${routinesUrl}/${routineId}?projection=checks`, 'GET', admin.token)).body

// The re-approval an ISSO submits for the routine they were shown and the current check they chose, by default the first.
function reapproval ({ currentChecks: [firstCheck], approvedTs }, chosen = firstCheck) {
  return { ruleId: chosen.ruleId, reviewedCheckDigest: chosen.checkDigest, reviewedApprovedTs: approvedTs }
}
const patchRoutine = (routineId, body, token = admin.token) => utils.executeRequest(`${routinesUrl}/${routineId}`, 'PATCH', token, body)

async function checkContentOf (ruleId) {
  const res = await utils.executeRequest(`${config.baseUrl}/stigs/rules/${ruleId}?projection=check`, 'GET', admin.token)
  return res.body.check.content
}

async function checkDigestOf (ruleId) {
  return createHash('sha256').update(await checkContentOf(ruleId)).digest('hex')
}

describe('Routine endpoint tests', function () {

  before(async function () {
    await utils.loadAppData()
  })

  describe('POST - createCollectionRoutine - /collections/{collectionId}/routines', function () {

    it('creates a routine from ruleId and match, approved by the caller', async function () {
      const body = newRoutine()
      const routine = await createRoutine(body)
      expect(routine.routineId).to.match(uuidPattern)
      expect(routine).to.include({
        name: body.name,
        description: null,
        state: 'active',
        needsReview: false,
        stale: false,
        version: reference.testRule.version,
        checkDigest: await checkDigestOf(reference.ruleId)
      })
      expect(routine.ruleIds).to.include(reference.ruleId)
      expect(routine.match).to.eql({ ...body.match, detailTruncated: false })
      expect(routine.action).to.eql({ ...body.action, detail: null })
      expect(routine.createdUser).to.eql({ userId: lvl3.userId, username: lvl3.name })
      expect(routine.approvedUser).to.eql({ userId: lvl3.userId, username: lvl3.name })
      expect(routine.approvedTs).to.be.a('string')
    })

    it('derives the match from the most recent automated result in the source review history', async function () {
      const assetId = reference.testAsset.assetId
      const ruleId = reference.freshRuleId
      const imported = await importAutomated(assetId, ruleId, { detail: 'admin, svc_backup, from scanner' })
      expect(imported.affected.inserted).to.eql(1)
      const reviewed = await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}`, 'PUT', admin.token, {
        result: 'pass', detail: 'accounts verified', comment: 'approved accounts', status: 'submitted'
      })
      expect(reviewed.status).to.eql(200)

      const { ruleId: _, match, ...body } = newRoutine()
      const routine = await createRoutine({ ...body, source: { assetId, ruleId } })
      expect(routine.match).to.eql({ result: 'fail', detail: 'admin, svc_backup, from scanner', detailTruncated: false })
      expect(routine.ruleIds).to.include(ruleId)
    })

    it('falls back to the current review when no automated result exists', async function () {
      const { ruleId, match, ...body } = newRoutine()
      const routine = await createRoutine({ ...body, source: { assetId: reference.testAsset.assetId, ruleId: reference.ruleId } })
      expect(routine.match).to.eql({ result: 'pass', detail: 'test\nvisible to lvl1', detailTruncated: false })
    })

    it('rejects a source with no review (422)', async function () {
      const { ruleId, match, ...body } = newRoutine()
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, { ...body, source: { assetId: reference.testAsset.assetId, ruleId: reference.testRuleNoMetadata.ruleId } })
      expect(res.status).to.eql(422)
    })

    it('rejects action.status accepted (400)', async function () {
      const body = newRoutine()
      body.action.status = 'accepted'
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, body)
      expect(res.status).to.eql(400)
    })

    it('rejects action.result notchecked (400), naming the results a routine can set', async function () {
      const body = newRoutine()
      body.action.result = 'notchecked'
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, body)
      expect(res.status).to.eql(400)
      expect(res.body.error).to.include('request/body/action/result must be equal to one of the allowed values: fail, pass, notapplicable, unknown, error, notselected, informational, fixed')
    })

    it('rejects action.result notchecked on a routine created from a source review (400)', async function () {
      const { ruleId, match, ...body } = newRoutine()
      body.action.result = 'notchecked'
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, { ...body, source: { assetId: reference.testAsset.assetId, ruleId: reference.ruleId } })
      expect(res.status).to.eql(400)
    })

    it('accepts match.result notchecked', async function () {
      const body = newRoutine()
      body.match.result = 'notchecked'
      const routine = await createRoutine(body)
      expect(routine.match.result).to.eql('notchecked')
    })

    it('rejects an unknown body property (400)', async function () {
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, { ...newRoutine(), bogus: true })
      expect(res.status).to.eql(400)
    })

    it('rejects an empty match.detail (400)', async function () {
      const body = newRoutine()
      body.match.detail = ''
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, body)
      expect(res.status).to.eql(400)
    })

    for (const [detail, stored] of [['Verified by routine', 'Verified by routine'], ['  Verified  ', 'Verified'], ['', null], ['   ', null]]) {
      it(`stores action.detail ${JSON.stringify(detail)} as ${JSON.stringify(stored)}`, async function () {
        const body = newRoutine()
        body.action.detail = detail
        const routine = await createRoutine(body)
        expect(routine.action).to.eql({ ...body.action, detail: stored })
        expect((await getRoutine(routine.routineId)).body.action).to.eql(routine.action)
      })
    }

    it('rejects an action.detail longer than 32767 characters (400)', async function () {
      const body = newRoutine()
      body.action.detail = 'x'.repeat(32768)
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, body)
      expect(res.status).to.eql(400)
    })

    it('rejects an unknown ruleId (422) and creates nothing', async function () {
      const body = newRoutine({ ruleId: reference.unknownRuleId })
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, body)
      expect(res.status).to.eql(422)
      const list = await utils.executeRequest(routinesUrl, 'GET', lvl3.token)
      expect(list.body.map(routine => routine.name)).to.not.include(body.name)
    })

    it('rejects a duplicate match (422)', async function () {
      const body = newRoutine()
      await createRoutine(body)
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, { ...body, name: `${body.name}-copy` })
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/match/)
    })

    it('rejects a duplicate name (422)', async function () {
      const body = newRoutine()
      await createRoutine(body)
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, newRoutine({ name: body.name }))
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/name/)
    })
  })

  describe('GET - getCollectionRoutines - /collections/{collectionId}/routines - GET - getCollectionRoutineById - /collections/{collectionId}/routines/{routineId}', function () {

    it('truncates long match details in the list and returns the full text by id', async function () {
      const detail = 'x'.repeat(1000)
      const routine = await createRoutine(newRoutine({ match: { result: 'fail', detail } }))
      const list = await utils.executeRequest(routinesUrl, 'GET', lvl3.token)
      const listed = list.body.find(r => r.routineId === routine.routineId)
      expect(listed.match.detailTruncated).to.eql(true)
      expect(detail.startsWith(listed.match.detail)).to.eql(true)
      expect(listed.match.detail.length).to.be.lessThan(detail.length)
      const byId = await getRoutine(routine.routineId)
      expect(byId.body.match).to.eql({ result: 'fail', detail, detailTruncated: false })
    })

    it('returns the approved and current check content with projection checks', async function () {
      const routine = await createRoutine()
      const { approvedCheckContent, currentChecks } = await getRoutineChecks(routine.routineId)
      expect(currentChecks).to.deep.include({ ruleId: reference.ruleId, checkDigest: routine.checkDigest, content: await checkContentOf(reference.ruleId) })
      expect(approvedCheckContent).to.eql(await checkContentOf(reference.ruleId))
    })

    it('returns check content only by id with projection checks', async function () {
      const routine = await createRoutine()
      const responses = [
        routine,
        (await getRoutine(routine.routineId)).body,
        (await patchRoutine(routine.routineId, { state: 'disabled' })).body,
        ...(await utils.executeRequest(routinesUrl, 'GET', lvl3.token)).body
      ]
      for (const response of responses) {
        expect(response).to.not.have.any.keys('approvedCheckContent', 'currentChecks')
      }
    })

    it('returns 404 for an unknown routineId', async function () {
      const res = await getRoutine(reference.unknownUuid)
      expect(res.status).to.eql(404)
      expect(res.body.error).to.eql('Resource not found.')
    })
  })

  describe('GET - getReviewByAssetRule - /collections/{collectionId}/reviews/{assetId}/{ruleId}?projection=routineSource - the match a routine created from the review would store', function () {
    const assetId = reference.testAsset.assetId
    const otherAssetId = reference.testAssetNoMetadata.assetId
    const ruleId = reference.freshRuleId

    it('previews the most recent automated result with detail trimmed, as create from source stores it', async function () {
      const detail = `admin, svc_backup ${utils.getUUIDSubString(8)}`
      await importAutomated(assetId, ruleId, { detail: `  ${detail}  ` })
      const reviewed = await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}`, 'PUT', admin.token, {
        result: 'pass', detail: 'accounts verified', comment: 'approved accounts', status: 'submitted'
      })
      expect(reviewed.status).to.eql(200)

      const preview = await getRoutineSource(assetId, ruleId)
      expect(preview.status).to.eql(200)
      expect(preview.body.routineSource).to.eql({ match: { result: 'fail', detail } })
      const plain = await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}`, 'GET', admin.token)
      expect(plain.body).to.not.have.property('routineSource')

      const { ruleId: _, match, ...body } = newRoutine()
      const routine = await createRoutine({ ...body, source: { assetId, ruleId } })
      expect(routine.match).to.eql({ ...preview.body.routineSource.match, detailTruncated: false })
      expect((await getRoutineSource(assetId, ruleId)).body.routineSource).to.eql({ match: preview.body.routineSource.match })
    })

    for (const [ending, eol] of [['a trailing newline', '\n'], ['a trailing CRLF', '\r\n']]) {
      it(`keeps ${ending} in the preview, so a routine created from it matches an import of the same detail`, async function () {
        const detail = `admin, svc_backup ${utils.getUUIDSubString(8)}${eol}`
        await importAutomated(assetId, ruleId, { detail })
        const { routineSource } = (await getRoutineSource(assetId, ruleId)).body
        expect(routineSource.match).to.eql({ result: 'fail', detail })

        await createRoutine(newRoutine({ ruleId, match: routineSource.match }))
        await utils.executeRequest(`${reviewsUrl}/${otherAssetId}/${ruleId}`, 'DELETE', admin.token)
        const imported = await importAutomated(otherAssetId, ruleId, { detail })
        expect(imported.affected.routineApplied).to.eql(1)
      })
    }

    ;[
      ['GET', reviewsUrl],
      ['GET', `${reviewsUrl}/${assetId}`],
      ['PUT', `${reviewsUrl}/${assetId}/${ruleId}`, { result: 'pass', detail: 'x', comment: 'x' }],
      ['PATCH', `${reviewsUrl}/${assetId}/${ruleId}`, { comment: 'x' }],
      ['DELETE', `${reviewsUrl}/${assetId}/${ruleId}`]
    ].forEach(([method, url, body]) => {
      it(`refuses ?projection=routineSource on ${method} ${url.slice(reviewsUrl.length) || '/'}, offering it only on the single-review GET (400)`, async function () {
        const res = await utils.executeRequest(`${url}?projection=routineSource`, method, admin.token, body)
        expect(res.status).to.eql(400)
      })
    })

    it('reports no routine source for a review with only whitespace detail, and create from it is refused (422)', async function () {
      const ruleId = reference.testRuleNoMetadata.ruleId
      await importAutomated(otherAssetId, ruleId, { result: 'pass', detail: '   ' })
      const preview = await getRoutineSource(otherAssetId, ruleId)
      expect(preview.status).to.eql(200)
      expect(preview.body.routineSource).to.eql(null)

      const { ruleId: _, match, ...body } = newRoutine()
      const res = await utils.executeRequest(routinesUrl, 'POST', lvl3.token, { ...body, source: { assetId: otherAssetId, ruleId } })
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/no detail to match/)
    })

    for (const iteration of [user.lvl1, user.collectioncreator]) {
      for (const projection of ['routine', 'routineSource']) {
        it(`answers ${iteration.name}, who has no grant to the rule, with ?projection=${projection} exactly as without it`, async function () {
          const ruleId = reference.scrapRuleIdWindows10
          const plain = await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}`, 'GET', iteration.token)
          const projected = await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}?projection=${projection}`, 'GET', iteration.token)
          expect(plain.status).to.be.oneOf([204, 403])
          expect({ status: projected.status, body: projected.body }).to.eql({ status: plain.status, body: plain.body })
        })
      }
    }
  })

  describe('PATCH - patchCollectionRoutineById - /collections/{collectionId}/routines/{routineId}', function () {

    it('changes state without re-stamping the approver', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { state: 'disabled' })
      expect(res.status).to.eql(200)
      expect(res.body.state).to.eql('disabled')
      expect(res.body.approvedUser).to.eql(routine.approvedUser)
      expect(res.body.approvedTs).to.eql(routine.approvedTs)
    })

    it('stamps the caller as approver when a routine is made active, not when it already is', async function () {
      const routine = await createRoutine()
      const kept = await patchRoutine(routine.routineId, { state: 'active' })
      expect(kept.body.approvedUser).to.eql(routine.approvedUser)
      expect(kept.body.approvedTs).to.eql(routine.approvedTs)
      await patchRoutine(routine.routineId, { state: 'disabled' })
      const activated = await patchRoutine(routine.routineId, { state: 'active' })
      expect(activated.status).to.eql(200)
      expect(activated.body.approvedUser).to.eql({ userId: admin.userId, username: admin.name })
    })

    it('re-stamps the approver when the action changes', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { action: { comment: 'x' } })
      expect(res.status).to.eql(200)
      expect(res.body.action).to.eql({ ...routine.action, comment: 'x' })
      expect(res.body.approvedUser).to.eql({ userId: admin.userId, username: admin.name })
      expect(res.body.createdUser).to.eql(routine.createdUser)
    })

    it('sets and clears action.detail, re-stamping the approver', async function () {
      const routine = await createRoutine()
      await utils.wait(1100)
      const set = await patchRoutine(routine.routineId, { action: { detail: 'changed' } })
      expect(set.status).to.eql(200)
      expect(set.body.action).to.eql({ ...routine.action, detail: 'changed' })
      expect(set.body.approvedTs).to.not.eql(routine.approvedTs)
      const cleared = await patchRoutine(routine.routineId, { action: { detail: null } })
      expect(cleared.body.action).to.eql(routine.action)
    })

    it('keeps action.detail when a patched action omits it', async function () {
      const body = newRoutine()
      body.action.detail = 'kept'
      const routine = await createRoutine(body)
      const res = await patchRoutine(routine.routineId, { action: { result: 'fail' } })
      expect(res.body.action).to.eql({ ...routine.action, result: 'fail' })
    })

    it('reports needsReview for state needsReview on a current routine', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { state: 'needsReview' })
      expect(res.body).to.include({ needsReview: true, stale: false })
    })

    it('rejects a match change that collides with another routine (422)', async function () {
      const existing = await createRoutine()
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { match: { detail: existing.match.detail } })
      expect(res.status).to.eql(422)
    })

    it('rejects an invalid state (400)', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { state: 'bogus' })
      expect(res.status).to.eql(400)
    })

    it('rejects action.result notchecked (400) and leaves the routine unchanged', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { action: { result: 'notchecked' } })
      expect(res.status).to.eql(400)
      expect((await getRoutine(routine.routineId)).body).to.eql(routine)
    })

    it('rejects action.status accepted (400)', async function () {
      const routine = await createRoutine()
      const res = await patchRoutine(routine.routineId, { action: { status: 'accepted' } })
      expect(res.status).to.eql(400)
    })
  })

  describe('DELETE - deleteCollectionRoutineById - /collections/{collectionId}/routines/{routineId}', function () {

    it('deletes an unreferenced routine (204)', async function () {
      const routine = await createRoutine()
      expect(routine.reviewCount).to.eql(0)
      const res = await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'DELETE', lvl3.token)
      expect(res.status).to.eql(204)
      expect((await getRoutine(routine.routineId)).status).to.eql(404)
    })
  })

  describe('reviewCount', function () {

    it('counts the reviews whose current value the routine set, refusing delete while any remain', async function () {
      const ruleId = reference.freshRuleId
      const assetIds = [reference.testAsset.assetId, reference.testAssetNoMetadata.assetId]
      const routine = await createRoutine(newRoutine({ ruleId }))
      for (const assetId of assetIds) {
        await utils.executeRequest(`${reviewsUrl}/${assetId}/${ruleId}`, 'DELETE', admin.token)
        expect((await importAutomated(assetId, ruleId, routine.match)).affected.routineApplied).to.eql(1)
      }
      const listed = (await utils.executeRequest(routinesUrl, 'GET', lvl3.token)).body.find(r => r.routineId === routine.routineId)
      expect(listed.reviewCount).to.eql(2)
      expect((await getRoutine(routine.routineId)).body.reviewCount).to.eql(2)
      expect((await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'DELETE', lvl3.token)).status).to.eql(409)

      const reviewed = await utils.executeRequest(`${reviewsUrl}/${assetIds[0]}/${ruleId}`, 'PUT', admin.token, {
        result: 'fail', detail: routine.match.detail, comment: 'not approved', status: 'submitted'
      })
      expect(reviewed.status).to.eql(200)
      expect((await getRoutine(routine.routineId)).body.reviewCount).to.eql(1)

      const disabled = await patchRoutine(routine.routineId, { state: 'disabled' })
      expect(disabled.body.reviewCount).to.eql(1)
    })
  })

  describe('permissions', function () {
    for (const iteration of iterations) {
      describe(`iteration:${iteration.name}`, function () {
        const { canReadRoutines, canManageRoutines } = expectations[iteration.name]
        let routine

        before(async function () {
          routine = await createRoutine(newRoutine(), admin.token)
        })

        it(`GET list returns ${canReadRoutines ? 200 : 403}`, async function () {
          const res = await utils.executeRequest(routinesUrl, 'GET', iteration.token)
          expect(res.status).to.eql(canReadRoutines ? 200 : 403)
        })

        it(`GET by id returns ${canReadRoutines ? 200 : 403}`, async function () {
          const res = await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'GET', iteration.token)
          expect(res.status).to.eql(canReadRoutines ? 200 : 403)
        })

        it(`POST returns ${canManageRoutines ? 201 : 403}`, async function () {
          const res = await utils.executeRequest(routinesUrl, 'POST', iteration.token, newRoutine())
          expect(res.status).to.eql(canManageRoutines ? 201 : 403)
        })

        it(`PATCH returns ${canManageRoutines ? 200 : 403}`, async function () {
          const res = await patchRoutine(routine.routineId, { state: 'disabled' }, iteration.token)
          expect(res.status).to.eql(canManageRoutines ? 200 : 403)
        })

        it(`DELETE returns ${canManageRoutines ? 204 : 403}`, async function () {
          const res = await utils.executeRequest(`${routinesUrl}/${routine.routineId}`, 'DELETE', iteration.token)
          expect(res.status).to.eql(canManageRoutines ? 204 : 403)
        })
      })
    }
  })

  describe('staleness and re-approval against revision pins', function () {
    const benchmarkId = reference.testCollection.benchmark
    const pinnedRuleId = reference.ruleIdPinnedRev

    before(async function () {
      await utils.uploadTestStig(reference.testStigfileNonLatest)
    })

    afterEach(async function () {
      await utils.setDefaultRevision(collectionId, benchmarkId, 'latest')
    })

    it('is stale while the collection pins a revision with different check content', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const pinned = await getRoutine(routine.routineId)
      expect(pinned.body).to.include({ state: 'active', stale: true, needsReview: true })
      expect(pinned.body.ruleIds).to.eql([])

      await utils.setDefaultRevision(collectionId, benchmarkId, 'latest')
      const unpinned = await getRoutine(routine.routineId)
      expect(unpinned.body).to.include({ stale: false, needsReview: false })
    })

    it('shows a stale routine the approved check content beside the current rule with its STIG ID', async function () {
      const routine = await createRoutine()
      const approvedContent = await checkContentOf(reference.ruleId)
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const stale = await getRoutineChecks(routine.routineId)
      expect(stale).to.include({ stale: true, approvedCheckContent: approvedContent })
      expect(stale.currentChecks).to.eql([{
        ruleId: pinnedRuleId,
        checkDigest: await checkDigestOf(pinnedRuleId),
        content: await checkContentOf(pinnedRuleId)
      }])
      expect(stale.currentChecks[0].content).to.not.eql(approvedContent)
    })

    it('re-approves a stale routine onto the current check content', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const shown = await getRoutineChecks(routine.routineId)
      const res = await patchRoutine(routine.routineId, reapproval(shown))
      expect(res.status).to.eql(200)
      expect(res.body).to.include({
        version: reference.testRule.version,
        checkDigest: await checkDigestOf(pinnedRuleId),
        state: 'active',
        stale: false,
        needsReview: false
      })
      expect(res.body.ruleIds).to.eql([pinnedRuleId])
      expect(res.body.approvedUser).to.eql({ userId: admin.userId, username: admin.name })
      expect(res.body.name).to.eql(routine.name)
    })

    it('renames a routine in the same re-approval when a name is sent', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const name = `renamed-${utils.getUUIDSubString(8)}`
      const res = await patchRoutine(routine.routineId, { ...reapproval(await getRoutineChecks(routine.routineId)), name })
      expect(res.status).to.eql(200)
      expect(res.body).to.include({ name, state: 'active' })
    })

    it('rejects re-approval with a digest that is not the current check content (409) and leaves the routine unchanged', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const before = await getRoutine(routine.routineId)
      const res = await patchRoutine(routine.routineId, { ...reapproval(await getRoutineChecks(routine.routineId)), reviewedCheckDigest: routine.checkDigest })
      expect(res.status).to.eql(409)
      expect((await getRoutine(routine.routineId)).body).to.eql(before.body)
    })

    it('rejects re-approval of a routine whose action changed after it was read (409) and leaves it unchanged', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const shown = await getRoutineChecks(routine.routineId)
      await utils.wait(1100)
      expect((await patchRoutine(routine.routineId, { action: { comment: 'changed by another Manager' } })).status).to.eql(200)
      const before = await getRoutine(routine.routineId)
      const res = await patchRoutine(routine.routineId, reapproval(shown))
      expect(res.status).to.eql(409)
      expect(res.body.detail).to.match(/reviewedApprovedTs/)
      expect((await getRoutine(routine.routineId)).body).to.eql(before.body)
    })

    it('rejects re-approval against a rule with another Version (422) and leaves the routine unchanged', async function () {
      const routine = await createRoutine()
      const otherVersionRuleId = reference.freshRuleId
      const before = await getRoutine(routine.routineId)
      const otherVersionCheck = { ruleId: otherVersionRuleId, checkDigest: await checkDigestOf(otherVersionRuleId) }
      const res = await patchRoutine(routine.routineId, reapproval(await getRoutineChecks(routine.routineId), otherVersionCheck))
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/Version/)
      expect((await getRoutine(routine.routineId)).body).to.eql(before.body)
    })

    it('rejects re-approval without reviewedApprovedTs (400)', async function () {
      const routine = await createRoutine()
      const { reviewedApprovedTs, ...body } = reapproval(await getRoutineChecks(routine.routineId))
      expect((await patchRoutine(routine.routineId, body)).status).to.eql(400)
    })

    it('reports the routine source once the rule leaves the effective revisions', async function () {
      const assetId = reference.testAsset.assetId
      await importAutomated(assetId, reference.ruleId, { detail: `admin ${utils.getUUIDSubString(8)}` })
      const { routineSource } = (await getRoutineSource(assetId, reference.ruleId)).body

      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const pinned = await getRoutineSource(assetId, reference.ruleId)
      expect(pinned.status).to.eql(200)
      expect(pinned.body.routineSource).to.eql({ match: routineSource.match })
    })

    it('rejects re-approval that collides with a routine already on the current content (422)', async function () {
      const routine = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      await createRoutine(newRoutine({ ruleId: pinnedRuleId, match: { detail: routine.match.detail, result: routine.match.result } }))
      const res = await patchRoutine(routine.routineId, reapproval(await getRoutineChecks(routine.routineId)))
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/match/)
    })

    it("rejects re-approval under another routine's name (422) and leaves both routines unchanged", async function () {
      const [routine, other] = [await createRoutine(), await createRoutine()]
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const bothRoutines = async () => (await Promise.all([routine, other].map(({ routineId }) => getRoutine(routineId)))).map(res => res.body)
      const before = await bothRoutines()
      const res = await patchRoutine(routine.routineId, { ...reapproval(await getRoutineChecks(routine.routineId)), name: other.name })
      expect(res.status).to.eql(422)
      expect(res.body.detail).to.match(/name/)
      expect(await bothRoutines()).to.eql(before)
    })

    describe('with several current rules on the Version and different check content', function () {
      const { benchmarkId: sharedBenchmarkId, sharedVersionRuleIds } = reference.fingerprintMatchStig
      const assetStigUrl = `${config.baseUrl}/assets/${reference.testAsset.assetId}/stigs/${sharedBenchmarkId}`

      before(async function () {
        expect((await utils.executeRequest(assetStigUrl, 'PUT', admin.token)).status).to.eql(200)
      })

      after(async function () {
        expect((await utils.executeRequest(assetStigUrl, 'DELETE', admin.token)).status).to.eql(200)
      })

      async function staleRoutineChecks () {
        const routine = await createRoutine()
        await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
        return getRoutineChecks(routine.routineId)
      }

      it("re-approves onto the chosen rule's check content, not the first current rule's", async function () {
        const shown = await staleRoutineChecks()
        const [sharedDigest, pinnedDigest] = [await checkDigestOf(sharedVersionRuleIds[0]), await checkDigestOf(pinnedRuleId)]
        expect(sharedDigest).to.not.eql(pinnedDigest)
        expect(shown.currentChecks.map(({ ruleId, checkDigest }) => [ruleId, checkDigest])).to.eql([
          ...sharedVersionRuleIds.map(ruleId => [ruleId, sharedDigest]),
          [pinnedRuleId, pinnedDigest]
        ])

        const res = await patchRoutine(shown.routineId, reapproval(shown, shown.currentChecks.find(({ ruleId }) => ruleId === pinnedRuleId)))
        expect(res.status).to.eql(200)
        expect(res.body).to.include({ version: reference.testRule.version, checkDigest: pinnedDigest, state: 'active', stale: false })
        expect(res.body.ruleIds).to.eql([pinnedRuleId])
      })

      it("rejects re-approval of one rule with another rule's check content (409) and leaves the routine unchanged", async function () {
        const shown = await staleRoutineChecks()
        const before = await getRoutine(shown.routineId)
        const res = await patchRoutine(shown.routineId, { ...reapproval(shown), reviewedCheckDigest: await checkDigestOf(pinnedRuleId) })
        expect(res.status).to.eql(409)
        expect((await getRoutine(shown.routineId)).body).to.eql(before.body)
      })
    })
  })

  // Reviews are keyed by rule_version_check_digest, one key per ruleId (the newest-dated revision's), whatever the pin;
  // routines follow that key, so a routine is current exactly when it can apply.
  describe('review identity under a pin to a revision that reuses a ruleId with other check content', function () {
    const benchmarkId = reference.testCollection.benchmark
    const pinReusedRevision = () => utils.setDefaultRevision(collectionId, benchmarkId, reference.reusedRuleIdStig.revisionStr)

    before(async function () {
      await utils.uploadTestStig(reference.testStigfileNonLatest)
      await utils.uploadTestStig(reference.reusedRuleIdStig.file)
    })

    afterEach(async function () {
      await utils.setDefaultRevision(collectionId, benchmarkId, 'latest')
    })

    after(async function () {
      await utils.deleteStigByRevision(benchmarkId, reference.reusedRuleIdStig.revisionStr)
    })

    it('keeps a routine approved on the review key current, showing the check content of that key', async function () {
      const routine = await createRoutine()
      await pinReusedRevision()
      const shown = await getRoutineChecks(routine.routineId)
      expect(shown).to.include({ stale: false, needsReview: false })
      expect(shown.ruleIds).to.eql([reference.ruleId])
      expect(shown.currentChecks).to.eql([{ ruleId: reference.ruleId, checkDigest: routine.checkDigest, content: shown.approvedCheckContent }])
    })

    it('creates a routine under the pin on the review key from the routine source', async function () {
      const reviewKey = await createRoutine()
      await pinReusedRevision()
      const assetId = reference.testAsset.assetId
      await importAutomated(assetId, reference.ruleId, { detail: `admin ${utils.getUUIDSubString(8)}` })
      const { routineSource } = (await getRoutineSource(assetId, reference.ruleId)).body
      const routine = await createRoutine(newRoutine({ match: routineSource.match }))
      expect(routine).to.include({ version: reviewKey.version, checkDigest: reviewKey.checkDigest, stale: false })
    })

    it("reports a routine approved on the pinned revision's check content stale and re-approves it onto the review key", async function () {
      const reviewKey = await createRoutine()
      await utils.setDefaultRevision(collectionId, benchmarkId, reference.testCollection.pinRevision)
      const routine = await createRoutine(newRoutine({ ruleId: reference.ruleIdPinnedRev }))
      await pinReusedRevision()
      const shown = await getRoutineChecks(routine.routineId)
      expect(shown).to.include({ stale: true, needsReview: true })
      expect(shown.ruleIds).to.eql([])
      expect(shown.currentChecks.map(({ ruleId, checkDigest }) => [ruleId, checkDigest])).to.eql([[reference.ruleId, reviewKey.checkDigest]])

      const res = await patchRoutine(routine.routineId, reapproval(shown))
      expect(res.status).to.eql(200)
      expect(res.body).to.include({ version: reference.testRule.version, checkDigest: reviewKey.checkDigest, state: 'active', stale: false })
      expect(res.body.ruleIds).to.eql([reference.ruleId])
    })
  })

  describe('POST - cloneCollection - /collections/{collectionId}/clone - copies routines for re-approval', function () {

    async function cloneRoutines (options) {
      const res = await fetch(`${config.baseUrl}/collections/${collectionId}/clone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${admin.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Clone_routines_${utils.getUUIDSubString(10)}`,
          description: 'clone with routines',
          options
        })
      })
      const result = (await res.text()).split('\n').filter(Boolean).map(line => JSON.parse(line)).find(message => message.stage === 'result')
      return (await utils.executeRequest(`${config.baseUrl}/collections/${result.collection.collectionId}/routines`, 'GET', admin.token)).body
    }

    it('by default copies routines with new ids, identical match/action, state needsReview and the cloner as approver', async function () {
      const withDetail = newRoutine()
      withDetail.action.detail = 'Verified by routine'
      const sources = [await createRoutine(withDetail), await createRoutine()]
      const cloned = await cloneRoutines({ grants: true, labels: true, assets: true, stigMappings: 'withReviews', pinRevisions: 'matchSource' })
      for (const source of sources) {
        const copy = cloned.find(routine => routine.name === source.name)
        expect(copy.routineId).to.not.eql(source.routineId)
        expect(copy.match).to.eql(source.match)
        expect(copy.action).to.eql(source.action)
        expect(copy).to.include({ state: 'needsReview', needsReview: true, version: source.version, checkDigest: source.checkDigest })
        expect(copy.approvedUser).to.eql({ userId: admin.userId, username: admin.name })
      }
    })

    it('copies routines into a clone without reviews', async function () {
      const source = await createRoutine()
      const cloned = await cloneRoutines({ stigMappings: 'withoutReviews' })
      expect(cloned.find(routine => routine.name === source.name)).to.include({ state: 'needsReview', checkDigest: source.checkDigest })
    })

    it('copies no routines with routines false', async function () {
      await createRoutine()
      expect(await cloneRoutines({ routines: false })).to.eql([])
    })
  })

  describe('check content retention when a revision is deleted', function () {
    const benchmarkId = reference.testCollection.benchmark
    const pinRevision = reference.testCollection.pinRevision
    const ruleId = reference.ruleIdPinnedRev

    // The pinned revision's only check content of its own is ruleId's; each test starts with no routine on it.
    beforeEach(async function () {
      await utils.loadAppData()
      await utils.uploadTestStig(reference.testStigfileNonLatest)
    })

    async function storedCheckContents () {
      const contents = []
      await utils.exportAppData((table, row) => { if (table === 'check_content') contents.push(row.content) })
      return contents
    }

    it('prunes check content that no revision or routine references', async function () {
      const content = await checkContentOf(ruleId)
      expect(await storedCheckContents()).to.include(content)
      await utils.deleteStigByRevision(benchmarkId, pinRevision)
      expect(await storedCheckContents()).to.not.include(content)
    })

    it('keeps the check content a routine was approved against', async function () {
      await utils.setDefaultRevision(collectionId, benchmarkId, pinRevision)
      const routine = await createRoutine(newRoutine({ ruleId }))
      const content = await checkContentOf(ruleId)
      await utils.setDefaultRevision(collectionId, benchmarkId, 'latest')
      await utils.deleteStigByRevision(benchmarkId, pinRevision)
      expect((await getRoutineChecks(routine.routineId)).approvedCheckContent).to.eql(content)
    })
  })

  describe('state only appdata can produce: referenced routines and deleted approvers', function () {
    let referenced, orphaned

    before(async function () {
      referenced = await createRoutine()
      orphaned = await createRoutine()
      let referencedCrId
      // Appdata reaches state the API never writes directly: a review referencing a routine, and an approver without lastAccess (deletable).
      await utils.editAppData((table, row) => {
        if (table === 'collection_routine' && row.name === referenced.name) referencedCrId = row.crId
        if (table === 'review' && row.reviewId === 1) row.routineId = referencedCrId
        if (table === 'user_data' && row.userId === Number(lvl3.userId)) row.lastAccess = null
      })
      const deleted = await utils.executeRequest(`${config.baseUrl}/users/${lvl3.userId}?elevate=true`, 'DELETE', admin.token)
      expect(deleted.status).to.eql(200)
    })

    it('refuses to delete a routine a review references (409)', async function () {
      const res = await utils.executeRequest(`${routinesUrl}/${referenced.routineId}`, 'DELETE', admin.token)
      expect(res.status).to.eql(409)
      expect(res.body.detail).to.match(/disable/)
    })

    it('reports needsReview when the approver was deleted', async function () {
      const res = await getRoutine(orphaned.routineId)
      expect(res.body).to.include({ state: 'active', stale: false, needsReview: true })
      expect(res.body.approvedUser).to.eql({ userId: null, username: null })
    })
  })
})
