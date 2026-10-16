'use strict';

const dbUtils = require('./utils')
const SmError = require('../utils/error')

const LIST_DETAIL_LENGTH = 255

// Reviews are keyed per ruleId by rule_version_check_digest whatever the pin; pins only decide which ruleIds are effective.
const sqlEffectiveRuleKeys = collectionId => `rule_version_check_digest ruleKey
  WHERE EXISTS (SELECT 1 FROM default_rev dr INNER JOIN rev_group_rule_map rgr ON rgr.revId = dr.revId
    WHERE dr.collectionId = ${collectionId} AND rgr.ruleId = ruleKey.ruleId)`

// A routine with no effective rule for the review key it was approved for is stale and never applies.
const sqlRoutineEffectiveRules = `${sqlEffectiveRuleKeys('cr.collectionId')}
  AND ruleKey.version = cr.version AND ruleKey.checkDigest = cr.checkDigest`

async function queryRoutines ({ collectionId, routineId, detailLength, projections = [] }) {
  const detail = detailLength ? `LEFT(cr.matchDetail, ${detailLength})` : 'cr.matchDetail'
  const columns = [
    'BIN_TO_UUID(cr.uuid,1) as routineId',
    'cr.name',
    'cr.description',
    'cr.state',
    `cast((cr.state = 'needsReview' OR effective.ruleIds IS NULL OR cr.approvedUserId IS NULL) is true as json) as needsReview`,
    'cast(effective.ruleIds IS NULL as json) as stale',
    'COALESCE(effective.ruleIds, json_array()) as ruleIds',
    'cr.version',
    'LOWER(HEX(cr.checkDigest)) as checkDigest',
    `json_object(
      'result', matchResult.api,
      'detail', ${detail},
      'detailTruncated', cast(CHAR_LENGTH(cr.matchDetail) > CHAR_LENGTH(${detail}) as json)
    ) as \`match\``,
    `json_object('result', actionResult.api, 'detail', cr.actionDetail, 'comment', cr.actionComment, 'status', actionStatus.api) as action`,
    `json_object('userId', CAST(createdUser.userId as char), 'username', createdUser.username) as createdUser`,
    `json_object('userId', CAST(approvedUser.userId as char), 'username', approvedUser.username) as approvedUser`,
    `DATE_FORMAT(cr.approvedTs, '%Y-%m-%dT%TZ') as approvedTs`,
    '(SELECT COUNT(*) FROM review WHERE review.routineId = cr.crId) as reviewCount'
  ]
  const joins = [
    'collection_routine cr',
    `INNER JOIN LATERAL (
      SELECT ${dbUtils.jsonArrayAgg({ value: 'json_quote(ruleKey.ruleId)', orderBy: 'ruleKey.ruleId' })} as ruleIds
      FROM ${sqlRoutineEffectiveRules}
    ) effective ON true`,
    'INNER JOIN result matchResult ON matchResult.resultId = cr.matchResultId',
    'INNER JOIN result actionResult ON actionResult.resultId = cr.actionResultId',
    'INNER JOIN status actionStatus ON actionStatus.statusId = cr.actionStatusId',
    'LEFT JOIN user_data createdUser ON createdUser.userId = cr.createdUserId',
    'LEFT JOIN user_data approvedUser ON approvedUser.userId = cr.approvedUserId'
  ]
  if (projections.includes('checks')) {
    columns.push('approvedCheck.content as approvedCheckContent', 'COALESCE(current.checks, json_array()) as currentChecks')
    joins.push(
      'LEFT JOIN check_content approvedCheck ON approvedCheck.digest = cr.checkDigest',
      `INNER JOIN LATERAL (
        SELECT ${dbUtils.jsonArrayAgg({
          value: `json_object('ruleId', currentRule.ruleId, 'checkDigest', LOWER(HEX(currentRule.checkDigest)), 'content', cc.content)`,
          orderBy: 'currentRule.ruleId'
        })} as checks
        FROM (
          SELECT ruleKey.ruleId, ruleKey.checkDigest FROM ${sqlEffectiveRuleKeys('cr.collectionId')} AND ruleKey.version = cr.version
        ) currentRule
          INNER JOIN check_content cc ON cc.digest = currentRule.checkDigest
      ) current ON true`
    )
  }
  const predicates = { statements: ['cr.collectionId = ?'], binds: [collectionId] }
  if (routineId) {
    predicates.statements.push('cr.uuid = UUID_TO_BIN(?,1)')
    predicates.binds.push(routineId)
  }
  const sql = dbUtils.makeQueryString({ columns, joins, predicates, orderBy: ['cr.name'], format: true })
  const [rows] = await dbUtils.pool.query(sql)
  return rows
}

async function effectiveRuleKey (collectionId, ruleId) {
  const [[key]] = await dbUtils.pool.query(
    `SELECT ruleKey.version, ruleKey.checkDigest FROM ${sqlEffectiveRuleKeys('?')} AND ruleKey.ruleId = ?`,
    [collectionId, ruleId]
  )
  if (!key) throw new SmError.UnprocessableError(`ruleId ${ruleId} is not in the Collection's effective revisions.`)
  return key
}

// Prefer the most recent automated result (review or history); detail is trimmed as the routine INSERT trims it.
async function matchFromSource (collectionId, { assetId, ruleId }) {
  const [rows] = await dbUtils.pool.query(
    `WITH sourceReview AS (
      SELECT r.reviewId, r.resultId, r.detail, r.resultEngine
      FROM enabled_asset a
        INNER JOIN rule_version_check_digest rvcd ON rvcd.ruleId = ?
        INNER JOIN review r ON r.assetId = a.assetId AND r.version = rvcd.version AND r.checkDigest = rvcd.checkDigest
      WHERE a.assetId = ? AND a.collectionId = ?
    ), candidate AS (
      SELECT resultId, detail, resultEngine, NULL as historyId FROM sourceReview
      UNION ALL
      SELECT rh.resultId, rh.detail, rh.resultEngine, rh.historyId FROM review_history rh INNER JOIN sourceReview USING (reviewId)
    )
    SELECT result.api as result, TRIM(candidate.detail) as detail
    FROM candidate INNER JOIN result USING (resultId)
    ORDER BY candidate.resultEngine IS NOT NULL DESC, candidate.historyId IS NULL DESC, candidate.historyId DESC
    LIMIT 1`,
    [ruleId, assetId, collectionId]
  )
  return rows[0]?.detail ? rows[0] : undefined
}

function unprocessableIfDuplicate (err) {
  if (err.code !== 'ER_DUP_ENTRY') return err
  return new SmError.UnprocessableError(err.sqlMessage.includes('uk_name')
    ? 'A Routine with this name exists in the Collection.'
    : 'A Routine with this rule and the same match result and detail exists in the Collection.')
}

function editAssignments ({ name, description, state, match, action }) {
  return [
    ['name = ?', name],
    ['description = ?', description],
    ['state = ?', state],
    ['matchResultId = ?', dbUtils.REVIEW_RESULT_API[match?.result]],
    ['matchDetail = TRIM(?)', match?.detail],
    ['actionResultId = ?', dbUtils.REVIEW_RESULT_API[action?.result]],
    ["actionDetail = NULLIF(TRIM(?), '')", action?.detail],
    ['actionComment = ?', action?.comment],
    ['actionStatusId = ?', dbUtils.REVIEW_STATUS_API[action?.status]]
  ].filter(([, value]) => value !== undefined)
}

// A routine's Version never changes, so re-approval only re-points it at a current rule with that Version.
async function reapprovalAssignments (collectionId, routine, { ruleId, name, reviewedCheckDigest }) {
  const { version, checkDigest } = await effectiveRuleKey(collectionId, ruleId)
  if (version !== routine.version) {
    throw new SmError.UnprocessableError(`ruleId ${ruleId} has Version ${version}, not the Routine's Version ${routine.version}.`)
  }
  if (checkDigest.toString('hex') !== reviewedCheckDigest) {
    throw new SmError.ConflictError(`reviewedCheckDigest is not the current check content of ruleId ${ruleId}.`)
  }
  const assignments = [['checkDigest = ?', checkDigest], ['state = ?', 'active']]
  if (name !== undefined) assignments.push(['name = ?', name])
  return assignments
}

exports.getRoutines = function (collectionId) {
  return queryRoutines({ collectionId, detailLength: LIST_DETAIL_LENGTH })
}

exports.getRoutineById = async function (collectionId, routineId, projections) {
  return (await queryRoutines({ collectionId, routineId, projections }))[0]
}

exports.getRoutineSource = async function (collectionId, source) {
  const match = await matchFromSource(collectionId, source)
  return match ? { match } : null
}

exports.createRoutine = async function ({ collectionId, routine, userId }) {
  const { version, checkDigest } = await effectiveRuleKey(collectionId, routine.ruleId ?? routine.source.ruleId)
  const match = routine.match ?? await matchFromSource(collectionId, routine.source)
  if (!match) {
    throw new SmError.UnprocessableError('The source review does not exist or has no detail to match.')
  }
  try {
    const [inserted] = await dbUtils.pool.query(
      `INSERT INTO collection_routine
        (uuid, collectionId, name, description, version, checkDigest, matchResultId, matchDetail,
          actionResultId, actionDetail, actionComment, actionStatusId, createdUserId, createdTs, approvedUserId, approvedTs)
      VALUES (UUID_TO_BIN(UUID(),1), ?, ?, ?, ?, ?, ?, TRIM(?), ?, NULLIF(TRIM(?), ''), ?, ?, ?, UTC_TIMESTAMP(), ?, UTC_TIMESTAMP())`,
      [
        collectionId, routine.name, routine.description, version, checkDigest,
        dbUtils.REVIEW_RESULT_API[match.result], match.detail,
        dbUtils.REVIEW_RESULT_API[routine.action.result], routine.action.detail, routine.action.comment, dbUtils.REVIEW_STATUS_API[routine.action.status],
        userId, userId
      ]
    )
    const [rows] = await dbUtils.pool.query('SELECT BIN_TO_UUID(uuid,1) as routineId FROM collection_routine WHERE crId = ?', [inserted.insertId])
    return rows[0].routineId
  }
  catch (err) {
    throw unprocessableIfDuplicate(err)
  }
}

async function routineExists (collectionId, routineId) {
  const [rows] = await dbUtils.pool.query('SELECT 1 FROM collection_routine WHERE collectionId = ? AND uuid = UUID_TO_BIN(?,1)', [collectionId, routineId])
  return rows.length > 0
}

// A re-approval updates only the approval it was reviewed against, so a concurrent edit is never approved unseen.
exports.patchRoutine = async function ({ collectionId, routineId, patch, userId }) {
  const [[routine]] = await dbUtils.pool.query(
    'SELECT version, state FROM collection_routine WHERE collectionId = ? AND uuid = UUID_TO_BIN(?,1)',
    [collectionId, routineId]
  )
  if (!routine) return 0
  const isReapproval = 'reviewedCheckDigest' in patch
  const assignments = isReapproval ? await reapprovalAssignments(collectionId, routine, patch) : editAssignments(patch)
  if (isReapproval || patch.match || patch.action || (patch.state === 'active' && routine.state !== 'active')) {
    assignments.push(['approvedUserId = ?, approvedTs = UTC_TIMESTAMP()', userId])
  }
  const predicates = [['collectionId = ?', collectionId], ['uuid = UUID_TO_BIN(?,1)', routineId]]
  if (isReapproval) {
    predicates.push([`DATE_FORMAT(approvedTs, '%Y-%m-%dT%TZ') = ?`, patch.reviewedApprovedTs])
  }
  const [result] = await dbUtils.pool.query(
    `UPDATE collection_routine SET ${assignments.map(([sql]) => sql).join(', ')} WHERE ${predicates.map(([sql]) => sql).join(' AND ')}`,
    [...assignments, ...predicates].map(([, value]) => value)
  ).catch(err => { throw unprocessableIfDuplicate(err) })
  if (result.affectedRows === 0 && isReapproval) {
    throw new SmError.ConflictError('reviewedApprovedTs is not the approvedTs of the Routine, which changed after it was read.')
  }
  return result.affectedRows
}

// review.routineId has no FK, so the reference check is part of the DELETE itself.
exports.deleteRoutine = async function (collectionId, routineId) {
  const [result] = await dbUtils.pool.query(
    `DELETE FROM collection_routine WHERE collectionId = ? AND uuid = UUID_TO_BIN(?,1)
      AND NOT EXISTS (SELECT 1 FROM review WHERE review.routineId = collection_routine.crId)`,
    [collectionId, routineId]
  )
  if (result.affectedRows === 0 && await routineExists(collectionId, routineId)) {
    throw new SmError.ConflictError('The Routine is referenced by Reviews; disable it instead.')
  }
  return result.affectedRows
}

// A pipeline's effective value is COALESCE(<routine column>, <pipeline value>); each is NULL when no routine matched.
const routineColumns = {
  resultId: 'cr.actionResultId',
  detail: 'cr.actionDetail',
  comment: 'cr.actionComment',
  statusId: 'cr.actionStatusId',
  statusText: `CONCAT('Routine: ', cr.name)`,
  statusUserId: 'cr.approvedUserId',
  statusTs: 'IF(cr.crId IS NULL, NULL, @utcTimestamp)',
  routineId: 'cr.crId'
}

exports.sqlNoRoutineMatch = {
  join: '',
  columns: Object.fromEntries(Object.keys(routineColumns).map(name => [name, 'NULL']))
}

// Callers join rvcd and review and set @collectionId and @utcTimestamp. A routine never overrides a human decision it
// does not encode: the review must be absent, set by this routine, equal to its action, or untouched automated output.
exports.sqlRoutineMatch = function (incoming, { extraOn } = {}) {
  return {
    join: `LEFT JOIN collection_routine cr ON cr.collectionId = @collectionId
      AND cr.state = 'active'
      AND cr.approvedUserId IS NOT NULL
      AND cr.version = rvcd.version
      AND cr.checkDigest = rvcd.checkDigest
      AND cr.matchResultId = ${incoming}.resultId
      AND cr.matchDetailDigest = UNHEX(SHA2(${incoming}.detail, 256))
      AND EXISTS (SELECT 1 FROM ${sqlRoutineEffectiveRules})
      AND (
        review.reviewId IS NULL
        OR review.routineId = cr.crId
        OR (review.resultId = cr.actionResultId
          AND (cr.actionDetail IS NULL OR CAST(review.detail AS BINARY) = CAST(cr.actionDetail AS BINARY))
          AND (cr.actionComment IS NULL OR CAST(COALESCE(review.comment, '') AS BINARY) = CAST(cr.actionComment AS BINARY))
          AND review.statusId = cr.actionStatusId)
        OR (review.routineId IS NULL
          AND review.resultId = cr.matchResultId
          AND CAST(review.detail AS BINARY) = CAST(${incoming}.detail AS BINARY)
          AND CAST(COALESCE(review.comment, '') AS BINARY) IN (CAST(COALESCE(${incoming}.comment, '') AS BINARY), CAST(cr.actionComment AS BINARY))
          AND review.statusId = 0)
      )
      ${extraOn ? `AND ${extraOn}` : ''}`,
    columns: routineColumns
  }
}

// Copies need re-approval by the destination's Managers, so they start in needsReview.
exports.sqlCopyRoutinesForClone = `INSERT INTO collection_routine
  (uuid, collectionId, name, description, state, version, checkDigest, matchResultId, matchDetail,
    actionResultId, actionDetail, actionComment, actionStatusId, createdUserId, createdTs, approvedUserId, approvedTs)
  SELECT UUID_TO_BIN(UUID(),1), @destCollectionId, name, description, 'needsReview', version, checkDigest, matchResultId, matchDetail,
    actionResultId, actionDetail, actionComment, actionStatusId, createdUserId, createdTs, @userId, UTC_TIMESTAMP()
  FROM collection_routine WHERE collectionId = @srcCollectionId`
