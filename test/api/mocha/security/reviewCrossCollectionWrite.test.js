/**
 * Security Regression Tests: Unauthorized Cross-Collection Review Write (Finding 1)
 *
 * VULNERABILITY SUMMARY
 * ---------------------
 * postReviewsByAsset  (POST  /collections/{collectionId}/reviews/{assetId})
 * putReviewByAssetRule  (PUT  /collections/{collectionId}/reviews/{assetId}/{ruleId})
 * patchReviewByAssetRule (PATCH /collections/{collectionId}/reviews/{assetId}/{ruleId})
 *
 * All three handlers verify that the caller holds a grant on the collectionId in the
 * URL path, and that the assetId exists. None verify that the asset belongs to that
 * collection.
 *
 * ReviewService.putReviewsByAsset builds cteGrant with:
 *   WHERE a.assetId = @assetId
 * with no AND a.collectionId = @collectionId predicate (ReviewService.js:1000-1011).
 * For non-Restricted callers (roleId > 1) the ACL join in cteGrant is a LEFT JOIN,
 * so it returns rules for any asset regardless of which collection owns it.
 * The write succeeds: reviews are inserted or updated in the review table for the
 * victim asset using the attacker's collection's validation settings.
 *
 * A secondary enabler in patchReviewByAssetRule: the pre-write existence check
 * (Review.js:202-206) calls getReviews with filter: {assetId, ruleId} and no
 * collectionId. This allows a review in the victim collection to satisfy the
 * "review must exist to be patched" gate (Review.js:207), enabling the PATCH
 * write path when the asset is in a foreign collection.
 *
 * ATTACK SCENARIO
 * ---------------
 * - Collection X  (collectionId: 21) — attacker's collection; attacker (lvl2) has Full grant
 * - Collection Y  (collectionId: 83) — victim collection; attacker has NO grant
 * - Asset 153     — belongs to Collection Y; has VPN_SRG_TEST STIG mapped and an
 *                   existing submitted review for ruleId SV-106179r1_rule
 * - Attacker      — user "lvl2" (userId: 21), Full grant on Collection X (21) only;
 *                   no grant on Collection Y (83)
 *
 * The attacker issues POST, PUT, or PATCH to a URL using Collection X's collectionId
 * but Asset 153's assetId (which belongs to Collection Y).
 *
 * CORRECT BEHAVIOUR (after fix)
 * ------------------------------
 * After verifying the caller's grant on the URL collectionId, the API must verify
 * that the assetId belongs to that collection. If it does not, the request must be
 * rejected with 403 before any write occurs.
 *
 * HOW THESE TESTS FAIL TODAY / PASS AFTER FIX
 * --------------------------------------------
 * Today:  POST, PUT, and PATCH all succeed (HTTP 200/201). The write-impact tests
 *         verify this by reading the victim asset's review via admin token after the
 *         attack and confirming the review was mutated — the test asserts it was NOT
 *         mutated, so it fails.
 * After fix: the API returns 403, no write occurs, the admin read-back confirms the
 *         original review is unchanged, and all assertions pass.
 */

import { config } from '../testConfig.js'
import * as utils from '../utils/testUtils.js'
import reference from '../referenceData.js'
import { expect } from 'chai'

// ---------------------------------------------------------------------------
// Actors
// ---------------------------------------------------------------------------

// The attacker: Full grant (roleId 2) on Collection X (21).
// Has grants on collections 1 and 21 only — NO grant on Collection Y (83).
const attacker = {
  name: 'lvl2',
  userId: '21',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDkwNzQsImlhdCI6MTY3MDU2ODI3NSwiYXV0aF90aW1lIjoxNjcwNTY4Mjc0LCJqdGkiOiIwM2Y0OWVmYy1jYzcxLTQ3MTItOWFjNy0xNGY5YzZiNDc1ZGEiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJjMTM3ZDYzNy1mMDU2LTRjNzItOWJlZi1lYzJhZjdjMWFiYzciLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjQ5MzY5ZTdmLWEyZGYtNDkxYS04YjQ0LWEwNDJjYWYyMzhlYyIsInNlc3Npb25fc3RhdGUiOiJjNmUyZTgyNi0xMzMzLTRmMDctOTc4OC03OTQxMGM5ZjJkMDYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImM2ZTJlODI2LTEzMzMtNGYwNy05Nzg4LTc5NDEwYzlmMmQwNiIsIm5hbWUiOiJsdmwyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMiIsImdpdmVuX25hbWUiOiJsdmwyIn0.F1i8VVLNkVsaW9i83vbVyB9eFiSxX_9ZpR6K7Zs0r7pKOCMJnSOHeKIHrlMO4hW8DrbmSRrkrrXExwNtw6zUsuH8_1uxx-SVUkaQyHEMfbx1_TstkTOFcjxIWqtlVvwPIt-DlTpQ_IFuby8wDAIxUvNwogn2OoybzAy1CDMcpIA'
}

// The restricted attacker: Restricted grant (roleId 1) on Collection X (21) via group membership
// (userId=85, belongs to userGroupId=1 which holds grantId=32, roleId=1 on collectionId=21).
// No grant on Collection Y (83).
const restrictedAttacker = {
  name: 'lvl1',
  userId: '85',
  token:
    'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
}

// ---------------------------------------------------------------------------
// Fixture identifiers
// ---------------------------------------------------------------------------

// Attacker's collection — attacker holds a Full grant here
const attackerCollectionId = '21'   // Collection X

// Victim collection — attacker has NO grant here
const victimCollectionId = '83'     // Collection Y

// Victim asset — belongs to Collection Y (83)
// Has VPN_SRG_TEST mapped; seed review (reviewId 13) exists for victimRuleId
// with detail "test\nvisible to lvl1" and status submitted
const victimAssetId = '153'

// Rule present in VPN_SRG_TEST, mapped to victimAsset via stig_asset_map
const victimRuleId = 'SV-106179r1_rule'

// The seed review detail — used to confirm the review was NOT mutated after fix
const seedDetail = 'test\nvisible to lvl1'

// Attacker-controlled content — used to confirm mutation in the unfixed case
const attackerDetail = 'ATTACKER WROTE THIS VIA CROSS-COLLECTION WRITE'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Read the victim review via admin token — source of truth for write-impact checks
async function getVictimReview () {
  return utils.executeRequest(
    `${config.baseUrl}/collections/${victimCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
    'GET',
    config.adminToken
  )
}

// ---------------------------------------------------------------------------

describe('Security Regression: Unauthorized Cross-Collection Review Write (Finding 1)', () => {

  // -------------------------------------------------------------------------
  // Sanity checks — confirm the prerequisite fixture state is correct.
  // These must pass both before and after the fix.
  // -------------------------------------------------------------------------
  describe('Fixture sanity checks', () => {

    before(async function () {
      await utils.loadAppData()
    })

    it('attacker (lvl2) has no access to victim asset 153 via GET — confirming no grant on Collection Y', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/assets/${victimAssetId}`,
        'GET',
        attacker.token
      )
      expect(res.status).to.equal(403)
    })

    it('attacker (lvl2) can access Collection X (21) — confirming their grant is active', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}`,
        'GET',
        attacker.token
      )
      expect(res.status).to.equal(200)
    })

    it('seed review exists on victim asset 153 with expected detail text', async () => {
      const res = await getVictimReview()
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('detail', seedDetail)
    })
  })

  // -------------------------------------------------------------------------
  // POST /collections/{collectionId}/reviews/{assetId}
  //
  // Attack: collectionId = 21 (Collection X, attacker has Full grant)
  //         assetId      = 153 (belongs to Collection Y, attacker has NO grant)
  //
  // CURRENT BEHAVIOUR (bug):  HTTP 200, review written to victim asset.
  // EXPECTED BEHAVIOUR (fix): HTTP 403, no write occurs.
  // -------------------------------------------------------------------------
  describe('POST /collections/{collectionId}/reviews/{assetId} — cross-collection write', () => {

    beforeEach(async function () {
      await utils.loadAppData()
    })

    it('SECURITY: POST must return 403 when assetId belongs to a different collection than collectionId', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}`,
        'POST',
        attacker.token,
        [{ ruleId: victimRuleId, result: 'pass', detail: attackerDetail, comment: 'attacker comment' }]
      )
      expect(res.status,
        'Expected 403: asset 153 belongs to Collection Y (83), not Collection X (21). ' +
        'The API must reject writes that cross collection boundaries. ' +
        'If this is 200, the vulnerability is present.'
      ).to.equal(403)
    })

    it('SECURITY: POST cross-collection attack must not mutate the victim review (write-impact verification)', async () => {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}`,
        'POST',
        attacker.token,
        [{ ruleId: victimRuleId, result: 'pass', detail: attackerDetail, comment: 'attacker comment' }]
      )

      // Read the victim review via admin to check whether it was actually written.
      // After fix: the POST was rejected (403), so the review is unchanged.
      // Today (bug): the POST succeeded, so the detail has been overwritten.
      const adminRes = await getVictimReview()
      expect(adminRes.status).to.equal(200)
      expect(adminRes.body.detail,
        'The victim review detail must not have been modified by the cross-collection POST. ' +
        `Expected the seed value "${seedDetail}" to be unchanged. ` +
        'If the detail was overwritten, the unauthorized write succeeded.'
      ).to.equal(seedDetail)
    })
  })

  // -------------------------------------------------------------------------
  // PUT /collections/{collectionId}/reviews/{assetId}/{ruleId}
  //
  // CURRENT BEHAVIOUR (bug):  HTTP 200/201, review written to victim asset.
  // EXPECTED BEHAVIOUR (fix): HTTP 403, no write occurs.
  // -------------------------------------------------------------------------
  describe('PUT /collections/{collectionId}/reviews/{assetId}/{ruleId} — cross-collection write', () => {

    beforeEach(async function () {
      await utils.loadAppData()
    })

    it('SECURITY: PUT must return 403 when assetId belongs to a different collection than collectionId', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PUT',
        attacker.token,
        { result: 'pass', detail: attackerDetail, comment: 'attacker comment', status: 'saved' }
      )
      expect(res.status,
        'Expected 403: asset 153 belongs to Collection Y (83), not Collection X (21). ' +
        'If this is 200, the vulnerability is present.'
      ).to.equal(403)
    })

    it('SECURITY: PUT cross-collection attack must not mutate the victim review (write-impact verification)', async () => {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PUT',
        attacker.token,
        { result: 'pass', detail: attackerDetail, comment: 'attacker comment', status: 'saved' }
      )

      const adminRes = await getVictimReview()
      expect(adminRes.status).to.equal(200)
      expect(adminRes.body.detail,
        'The victim review detail must not have been modified by the cross-collection PUT. ' +
        `Expected the seed value "${seedDetail}" to be unchanged.`
      ).to.equal(seedDetail)
    })
  })

  // -------------------------------------------------------------------------
  // PATCH /collections/{collectionId}/reviews/{assetId}/{ruleId}
  //
  // The PATCH path has an additional enabler: the pre-write existence check
  // (Review.js:202-206) calls getReviews without a collectionId filter.
  // This allows the victim asset's existing review to satisfy the
  // "review must exist to be patched" gate, enabling the write path.
  //
  // CURRENT BEHAVIOUR (bug):  HTTP 200, review patched on victim asset.
  // EXPECTED BEHAVIOUR (fix): HTTP 403, no write occurs.
  // -------------------------------------------------------------------------
  describe('PATCH /collections/{collectionId}/reviews/{assetId}/{ruleId} — cross-collection write', () => {

    beforeEach(async function () {
      await utils.loadAppData()
    })

    it('SECURITY: PATCH must return 403 when assetId belongs to a different collection than collectionId', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PATCH',
        attacker.token,
        { detail: attackerDetail }
      )
      expect(res.status,
        'Expected 403: asset 153 belongs to Collection Y (83), not Collection X (21). ' +
        'The pre-write existence check must not satisfy itself using a review from a ' +
        'foreign collection. If this is 200, the vulnerability is present.'
      ).to.equal(403)
    })

    it('SECURITY: PATCH cross-collection attack must not mutate the victim review (write-impact verification)', async () => {
      await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PATCH',
        attacker.token,
        { detail: attackerDetail }
      )

      const adminRes = await getVictimReview()
      expect(adminRes.status).to.equal(200)
      expect(adminRes.body.detail,
        'The victim review detail must not have been modified by the cross-collection PATCH. ' +
        `Expected the seed value "${seedDetail}" to be unchanged.`
      ).to.equal(seedDetail)
    })
  })

  // -------------------------------------------------------------------------
  // Restricted-role attacker — incidentally blocked today, must remain blocked after fix.
  //
  // When the attacker's grant roleId === 1 (Restricted), cteGrant in
  // putReviewsByAsset uses an INNER JOIN on cteAclEffective (ReviewService.js:1006).
  // cteAclEffective is built from the attacker's grant IDs in Collection X. The
  // victim asset's stig_asset_map entries have saId values that never appear in
  // Collection X's ACL, so cteGrant returns zero rules, every incoming review gets
  // error = 'no grant for this asset/ruleId', and nothing is committed.
  //
  // These tests confirm that the Restricted path is blocked both before and after
  // the fix, and that the fix does not accidentally change this behaviour.
  // The tests should PASS today and continue to PASS after the fix.
  // -------------------------------------------------------------------------
  describe('Restricted-role attacker (lvl1) — blocked by ACL INNER JOIN, must stay blocked', () => {

    beforeEach(async function () {
      await utils.loadAppData()
    })

    it('Restricted attacker: POST returns 403 and does not mutate victim review', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}`,
        'POST',
        restrictedAttacker.token,
        [{ ruleId: victimRuleId, result: 'pass', detail: attackerDetail, comment: 'restricted attacker comment' }]
      )
      // The membership check (added by the Finding 1 fix) fires before putReviewsByAsset
      // is called, so the Restricted user gets 403 — the same as the Full-role attacker.
      expect(res.status).to.equal(403)

      const adminRes = await getVictimReview()
      expect(adminRes.body.detail).to.equal(seedDetail)
    })

    it('Restricted attacker: PUT returns non-2xx and does not mutate victim review', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PUT',
        restrictedAttacker.token,
        { result: 'pass', detail: attackerDetail, comment: 'restricted attacker comment', status: 'saved' }
      )
      expect(res.status).to.equal(403)

      const adminRes = await getVictimReview()
      expect(adminRes.body.detail).to.equal(seedDetail)
    })

    it('Restricted attacker: PATCH returns 403 and does not mutate victim review', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${victimAssetId}/${victimRuleId}`,
        'PATCH',
        restrictedAttacker.token,
        { detail: attackerDetail }
      )
      // 403 is required in all cases — not 404.
      //
      // Today (before fix): the PATCH pre-write read (Review.js:202-206) calls getReviews
      // without collectionId. For a Restricted caller the ACL join is an INNER JOIN, so
      // the victim review is invisible to that read — currentReviews is empty and the
      // handler throws NotFoundError (404). This is incorrect: a 404 tells the attacker
      // that no review exists for this rule on this asset from the perspective of their
      // ACL, which leaks review state across a collection boundary they cannot access.
      //
      // After fix: the asset-collection membership check must fire BEFORE the pre-write
      // existence read, so the attacker receives 403 regardless of whether a review exists
      // on the victim asset. This eliminates the 403/404 oracle.
      expect(res.status,
        'Expected 403 — not 404. A 404 leaks review state across a collection boundary: ' +
        'it reveals whether a review exists for this rule on this asset, which is information ' +
        'the caller has no grant to access. The collection-membership check must run before ' +
        'the pre-write existence read.'
      ).to.equal(403)

      const adminRes = await getVictimReview()
      expect(adminRes.body.detail).to.equal(seedDetail)
    })
  })

  // -------------------------------------------------------------------------
  // Negative controls — confirm the fix does not block legitimate same-collection writes.
  // These tests must pass both before and after the fix.
  // -------------------------------------------------------------------------
  describe('Negative controls — legitimate same-collection writes must still succeed', () => {

    before(async function () {
      await utils.loadAppData()
    })

    // Full-role user (lvl2): asset 42 belongs to Collection X (21)
    it('Full-role (lvl2): POST reviews to asset 42 in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}`,
        'POST',
        attacker.token,
        [{ ruleId: reference.testCollection.ruleId, result: 'pass', detail: 'legitimate post from lvl2', comment: 'comment' }]
      )
      expect(res.status).to.equal(200)
    })

    it('Full-role (lvl2): PUT review to asset 42 in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`,
        'PUT',
        attacker.token,
        { result: 'pass', detail: 'legitimate write from lvl2', comment: 'legitimate comment', status: 'saved' }
      )
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('ruleId', reference.testCollection.ruleId)
      expect(res.body).to.have.property('assetId', reference.testAsset.assetId)
    })

    it('Full-role (lvl2): PATCH review on asset 42 in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`,
        'PATCH',
        attacker.token,
        { detail: 'legitimate patch from lvl2' }
      )
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('ruleId', reference.testCollection.ruleId)
    })

    // Restricted-role user (lvl1): rw access via ACL rule —
    // grantId=32 grants rw to label 'test-label-lvl1' (clId=2) + VPN_SRG_TEST.
    // Asset 42 carries that label and has VPN_SRG_TEST mapped, so lvl1 has
    // legitimate rw access to VPN_SRG_TEST rules on asset 42 within Collection X.
    it('Restricted-role (lvl1): POST review to ACL-granted asset 42 / VPN_SRG_TEST in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}`,
        'POST',
        restrictedAttacker.token,
        [{ ruleId: reference.testCollection.ruleId, result: 'pass', detail: 'legitimate post from lvl1', comment: 'comment' }]
      )
      expect(res.status).to.equal(200)
    })

    it('Restricted-role (lvl1): PUT review to ACL-granted asset 42 / VPN_SRG_TEST in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`,
        'PUT',
        restrictedAttacker.token,
        { result: 'pass', detail: 'legitimate write from lvl1', comment: 'legitimate comment', status: 'saved' }
      )
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('ruleId', reference.testCollection.ruleId)
      expect(res.body).to.have.property('assetId', reference.testAsset.assetId)
    })

    it('Restricted-role (lvl1): PATCH review on ACL-granted asset 42 / VPN_SRG_TEST in Collection X succeeds', async () => {
      const res = await utils.executeRequest(
        `${config.baseUrl}/collections/${attackerCollectionId}/reviews/${reference.testAsset.assetId}/${reference.testCollection.ruleId}`,
        'PATCH',
        restrictedAttacker.token,
        { detail: 'legitimate patch from lvl1' }
      )
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('ruleId', reference.testCollection.ruleId)
    })
  })
})
