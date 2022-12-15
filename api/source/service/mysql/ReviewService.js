'use strict';
const dbUtils = require('./utils')

let _this = this

function cteReviewGen(obj) {
  const cte = `SELECT
  jtresult.resultId,
  TRIM(jt.detail) as detail,
  TRIM(jt.comment) as comment,
  jt.resultEngine,
  jt.metadata,
  jtstatus.statusId,
  jt.statusText
  FROM
  JSON_TABLE(
    @review,
    "$"
    COLUMNS(
    result VARCHAR(255) PATH "$.result",
    detail MEDIUMTEXT PATH "$.detail" NULL ON EMPTY,
    comment MEDIUMTEXT PATH "$.comment",
    resultEngine JSON PATH "$.resultEngine" DEFAULT '0' ON EMPTY,
    metadata JSON PATH "$.metadata",
    statusLabel VARCHAR(255) PATH "$.status.label",
    statusText VARCHAR(255) PATH "$.status.text"
    )
  ) as jt
  left join result jtresult on (jtresult.api = jt.result)
  left join status jtstatus on (jtstatus.api = jt.statusLabel)`
  return `cteReview AS (${cte})`
}

function cteAssetGen({assetIds, benchmarkIds, labelIds, labelNames}) {
  let cte
  if (assetIds?.length) {
    const json = JSON.stringify(assetIds)
    const sql = `select jtAssets.assetId
  from
    json_table(
      ?,
      '$[*]'
      COLUMNS (assetId INT PATH '$') 
    ) as jtAssets`
    cte = dbUtils.pool.format(sql,[json])
  }
  else if (benchmarkIds?.length) {
    const sql = `select distinct assetId 
    from
      asset a
      left join collection_grant cg on a.collectionId = cg.collectionId
      left join stig_asset_map sa using (assetId)
      left join user_stig_asset_map usa on sa.saId = usa.saId
    where
      a.collectionId = @collectionId 
      and cg.userId = @userId 
      and (CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)
      and sa.benchmarkId IN ?`
    cte = dbUtils.pool.format(sql,[[benchmarkIds]])
  }
  return `cteAsset AS (${cte})`
}

function cteRuleGen({ruleIds, benchmarkIds}) {
  let cte
  if (ruleIds?.length) {
    const json = JSON.stringify(ruleIds)
    const sql = `select jtRules.ruleId
  from
    json_table(
      ?,
      '$[*]'
      COLUMNS (ruleId VARCHAR(255) PATH '$') 
    ) as jtRules`
    cte = dbUtils.pool.format(sql,[json])
  }
  else if (benchmarkIds?.length) {
    const sql = `select ruleId from current_group_rule where benchmarkId IN ?`
    cte = dbUtils.pool.format(sql,[[benchmarkIds]])
  }
  return `cteRule AS (${cte})`
}

function cteGrantGen() {
  const cte = `select
  distinct a.assetId,
  rgr.ruleId 
from 
  asset a
  left join collection_grant cg on a.collectionId = cg.collectionId
  left join stig_asset_map sa using (assetId)
  left join user_stig_asset_map usa on sa.saId = usa.saId
  left join revision rev using (benchmarkId)
  left join rev_group_map rg using (revId)
  left join rev_group_rule_map rgr using (rgId)
where 
  cg.collectionId =  @collectionId
  and a.assetId IN (select assetId from cteAsset)
  and rgr.ruleId IN (select ruleId from cteRule)
  and cg.userId = @userId 
  and (CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)`
  
  return `cteGrant AS (${cte})`
}

function cteCollectionSettingGen () {
  const cte = `SELECT 
  c.settings->>"$.fields.detail.required" as detailRequired,
  c.settings->>"$.fields.comment.required" as commentRequired,
  c.settings->>"$.status.canAccept" as canAccept,
  c.settings->>"$.status.resetCriteria" as resetCriteria,
  c.settings->>"$.status.minAcceptGrant" as minAcceptGrant
FROM
  collection c
where
  collectionId = @collectionId`
  return `cteCollectionSetting AS (${cte})`
}

const mergeFilterOperators = {
  contains: 'LIKE',
  beginsWith: 'LIKE',
  endsWith: 'LIKE',
  equals: '=',
  notequal: '!=',
  greaterThan: '>',
  lessThan: '<',
}

function genFilter(filter) {
  let {field, condition = 'equals', value} = filter
  if (field === 'result') {
    field = 'resultId'
    value = dbUtils.REVIEW_RESULT_API[value]
  }
  if (field === 'status' || field === 'statusLabel') {
    field = 'statusId'
    value = dbUtils.REVIEW_STATUS_API[value]
  }

  value = field === 'userId' || field === 'statusUserId' ? parseInt(value) : value

  const sqlOperator = mergeFilterOperators[condition]
  const isDateValue =  (field === 'ts' || field === 'touchTs' || field === 'statusTs')
  let sqlValue
  if (isDateValue) {
    sqlValue = dbUtils.pool.escape(new Date(value))
  }
  else if (condition === 'contains') {
    sqlValue = dbUtils.pool.escape(`%${value}%`)
  }
  else if (condition === 'beginsWith') {
    sqlValue = dbUtils.pool.escape(`${value}%`)
  }
  else if (condition === 'endsWith') {
    sqlValue = dbUtils.pool.escape(`%${value}`)
  }
  else {
    sqlValue = dbUtils.pool.escape(value)
  }
  return `review.${field} ${sqlOperator} ${sqlValue}`
}

function cteCandidateGen ({skipGrantCheck = false, action, updateFilters}) {
  let sqlFilterPredicates, sqlPredicates
  if (updateFilters) {
    sqlFilterPredicates = updateFilters.map( filter => genFilter(filter)).join(' AND ')
  }

  if (action === 'insert') {
    sqlPredicates = `review.reviewId is null`
  }
  else if (action === 'update') {
    sqlPredicates = sqlFilterPredicates || 'review.reviewId is not null'
  }
  else if (action === 'merge') {
    sqlPredicates = `${sqlFilterPredicates ? `review.reviewId is null OR (${sqlFilterPredicates})` : ''}`
  }
  const cte = `
select
  ${!skipGrantCheck ? 'CASE WHEN cteGrant.assetId is not null then 1 else null end' : '1'} as granted,
  review.reviewId,
  cteAsset.assetId,
  cteRule.ruleId,
  
  COALESCE(cteReview.resultId, review.resultId) as resultId,
  COALESCE(cteReview.detail, review.detail, '') as detail,
  COALESCE(cteReview.comment, review.comment, '') as comment,
  COALESCE(cteReview.metadata, review.metadata, '{}') as metadata,
  
  CASE WHEN cteReview.resultEngine != 0 -- resultEngine present
    THEN cteReview.resultEngine
    ELSE
    CASE WHEN cteReview.resultId is null or cteReview.resultId = review.resultId
      THEN review.resultEngine
      ELSE NULL
    END
  END as resultEngine,
    
  CASE WHEN cteReview.statusId is not null
    THEN cteReview.statusId
    ELSE
      CASE WHEN review.reviewId is null
          or (cteCollectionSetting.resetCriteria = 'result' and rChangedResult.reviewId is not null)
          or (cteCollectionSetting.resetCriteria = 'any' and rChangedAny.reviewId is not null)
        THEN 0
        ELSE review.statusId
      END
  END as statusId,
    
  CASE WHEN cteReview.statusId is not null or review.reviewId is null
    THEN cteReview.statusText
    ELSE
      CASE WHEN (cteCollectionSetting.resetCriteria = 'result' and rChangedResult.reviewId is not null)
          or (cteCollectionSetting.resetCriteria = 'any' and rChangedAny.reviewId is not null)
        THEN 'Review change triggered status update'
        ELSE review.statusText
      END
  END as statusText,
    
  CASE WHEN cteReview.statusId is not null 
      or review.reviewId is null
      or (cteCollectionSetting.resetCriteria = 'result' and rChangedResult.reviewId is not null)
      or (cteCollectionSetting.resetCriteria = 'any' and rChangedAny.reviewId is not null)
    THEN UTC_TIMESTAMP()
    ELSE review.statusTs
  END as statusTs,
  
  CASE WHEN cteReview.statusId is not null 
      or review.reviewId is null
      or (cteCollectionSetting.resetCriteria = 'result' and rChangedResult.reviewId is not null)
      or (cteCollectionSetting.resetCriteria = 'any' and rChangedAny.reviewId is not null)
    THEN @userId
    ELSE review.statusUserId
  END as statusUserId,
    
  CASE WHEN cteReview.resultId is not null
      or cteReview.detail is not null
      or cteReview.comment is not null
      or review.reviewId is null
    THEN @userId
    ELSE review.userId
  END as userId,
    
  CASE WHEN cteReview.resultId is not null
      or cteReview.detail is not null
      or cteReview.comment is not null
      or review.reviewId is null
    THEN UTC_TIMESTAMP()
    ELSE review.ts
  END as ts

from
  cteAsset
  CROSS JOIN cteRule
  LEFT JOIN cteReview on true
  ${!skipGrantCheck ? 'LEFT JOIN cteGrant on (cteAsset.assetId = cteGrant.assetId and cteRule.ruleId = cteGrant.ruleId)' : ''}
  LEFT JOIN review on (cteAsset.assetId = review.assetId and cteRule.ruleId = review.ruleId)
  LEFT JOIN cteCollectionSetting on true
  LEFT JOIN review rChangedResult on (
    rChangedResult.reviewId = review.reviewId 
    and rChangedResult.statusId != 0
    and rChangedResult.resultId != cteReview.resultId
  )
  LEFT JOIN review rChangedAny on (
    rChangedAny.reviewId = review.reviewId 
    and rChangedAny.statusId != 0
    and (rChangedAny.resultId != cteReview.resultId or rChangedAny.detail != cteReview.detail or rChangedAny.comment != cteReview.comment)
  )
  ${sqlPredicates ? `WHERE ${sqlPredicates}` : ''}
  `
  return `cteCandidate AS (${cte})`
}

exports.postReviewBatch = async function ({
  source, 
  assets, 
  rules,
  action,
  updateFilters,
  dryRun,
  collectionId, 
  userId,
  svcStatus,
  historyMaxReviews,
  skipGrantCheck = false
}) {
  const { performance } = require('node:perf_hooks');

  // performance.mark('beforeCteGen');

  const cteReview = cteReviewGen()
  const cteAsset = cteAssetGen(assets)
  const cteRule = cteRuleGen(rules)
  let cteGrant
  if (!skipGrantCheck) {
    cteGrant = cteGrantGen()
  }
  const cteCollectionSetting = cteCollectionSettingGen()
  const cteCandidate = cteCandidateGen({skipGrantCheck, action, updateFilters})
  const sqlTempTable = `
CREATE TEMPORARY TABLE IF NOT EXISTS validated_reviews (
  INDEX idx_reviewId (reviewId),
  INDEX id_error (error)
)
WITH
${cteReview},
${cteAsset},
${cteRule},
${!skipGrantCheck ? `${cteGrant},` : ''}
${cteCollectionSetting},
${cteCandidate}
select
  cteCandidate.reviewId, 
  cteCandidate.assetId, 
  cteCandidate.ruleId, 
  cteCandidate.resultId, 
  cteCandidate.detail, 
  cteCandidate.comment, 
  cteCandidate.resultEngine, 
  cteCandidate.metadata, 
  cteCandidate.statusId, 
  cteCandidate.statusText,
  cteCandidate.statusUserId,
  cteCandidate.statusTs,
  cteCandidate.userId,
  cteCandidate.ts,
  CASE WHEN cteCandidate.granted IS NULL
    THEN 
      'no grant for this asset/ruleId'
    ELSE
      CASE WHEN (cteCandidate.reviewId IS NULL AND cteCandidate.resultId IS NULL)
        THEN 
          'cannot insert null result'
        ELSE
          CASE WHEN cteCandidate.statusId > 0 -- submitted, rejected, accepted
            THEN
              CASE WHEN (cteCandidate.resultId NOT IN (2,3,4))
                THEN
                  'status is not allowed for the result'
                ELSE
                  CASE WHEN (cteCollectionSetting.detailRequired = 'always' AND cteCandidate.detail = '')
                    THEN 
                      'detail is empty and detail.required = always'
                    ELSE
                      CASE WHEN (cteCollectionSetting.commentRequired = 'always' AND cteCandidate.comment = '')
                        THEN 
                          'comment is empty and comment.required = always'
                        ELSE
                          CASE WHEN cteCandidate.resultId = 4 -- fail
                            THEN
                              CASE WHEN (cteCollectionSetting.detailRequired = 'findings' AND cteCandidate.detail = '')
                                THEN 
                                  'detail is empty and detail.required = findings'
                                ELSE
                                  CASE WHEN (cteCollectionSetting.commentRequired = 'findings' AND cteCandidate.comment = '')
                                    THEN 
                                      'comment is empty and comment.required = findings '
                                  END
                              END
                          END
                      END
                  END
              END
          END
      END
	END as error
from
  cteCandidate
  LEFT JOIN cteCollectionSetting on true`
  const sqlHistoryPrune = `
  with historyRecs AS (
    select
      rh.historyId,
      ROW_NUMBER() OVER (PARTITION BY r.assetId, r.ruleId ORDER BY rh.historyId DESC) as rowNum
    from
      review_history rh
      left join review r using (reviewId)
    where
      reviewId IN (SELECT reviewId from validated_reviews where error is null and reviewId is not null)
  )
  delete review_history
  FROM 
     review_history
     left join historyRecs on review_history.historyId = historyRecs.historyId 
  WHERE 
     historyRecs.rowNum > ? - 1
  `
  const sqlHistory = `  
  INSERT INTO review_history (
    reviewId,
    resultId,
    detail,
    comment,
    autoResult,
    ts,
    userId,
    statusText,
    statusUserId,
    statusTs,
    statusId,
    touchTs,
    resultEngine
  ) SELECT 
      reviewId,
      resultId,
      LEFT(detail,32767) as detail,
      LEFT(comment,32767) as comment,
      autoResult,
      ts,
      userId,
      statusText,
      statusUserId,
      statusTs,
      statusId,
      touchTs,
      CASE WHEN resultEngine = 0 THEN NULL ELSE resultEngine END
    FROM
      review 
    WHERE
      reviewId IN (SELECT reviewId from validated_reviews where error is null and reviewId is not null)
    FOR UPDATE    
  `
  const sqlInsertReviews = `
  insert into review (
    assetId,
    ruleId,
    resultId,
    resultEngine,
    detail,
    comment,
    metadata,
    statusId,
    statusText,
    statusUserId,
    statusTs,
    userId,
    ts)
  select 
    assetId,
    ruleId,
    resultId,
    resultEngine,
    detail,
    comment,
    metadata,
    statusId,
    statusText,
    statusUserId,
    statusTs,
    userId,
    ts
  from
    validated_reviews vr
  where
    error is null and reviewId is null 
  `
  const sqlUpdateReviews = `
  update
    review r
    inner join validated_reviews vr on (r.reviewId = vr.reviewId and vr.error is null)
  set
    r.resultId = vr.resultId,
    r.resultEngine = vr.resultEngine,
    r.detail = vr.detail,
    r.comment = vr.comment,
    r.metadata = vr.metadata,
    r.statusId = vr.statusId,
    r.statusText = vr.statusText,
    r.statusUserId = vr.statusUserId,
    r.statusTs = vr.statusTs,
    r.userId = vr.userId,
    r.ts = vr.ts
  `
  // performance.mark('afterCteGen');

  // performance.measure('CteGen', 'beforeCteGen', 'afterCteGen')

  let connection
  try {
    // performance.mark('beforeGetConnection')
    connection = await dbUtils.pool.getConnection()
    // performance.mark('afterGetConnection')
    // performance.measure('GetConnection', 'beforeGetConnection', 'afterGetConnection')

    connection.config.namedPlaceholders = false

    const sqlVariables = `set @collectionId = ?, @userId = ?, @review = ?`
    await connection.query(sqlVariables, [parseInt(collectionId), parseInt(userId), JSON.stringify(source.review)])
    // performance.mark('beforeTempTable')
    await connection.query(sqlTempTable)
    // performance.mark('afterTempTable')
    // performance.measure('TempTable', 'beforeTempTable', 'afterTempTable')

    
    let validationErrors = []
    let [table] = await connection.query('select * from validated_reviews')
    let [counts] = await connection.query(`select
    coalesce(sum(case when error is not null then 1 else 0 end),0) as failedValidations,
    coalesce(sum(case when error is null and reviewId is null then 1 else 0 end),0) as inserts,
    coalesce(sum(case when error is null and reviewId is not null then 1 else 0 end),0) as updates
    from validated_reviews`)
    if (counts[0].failedValidations) {
      ;[validationErrors] = await connection.query('select CAST(assetId AS CHAR) as assetId, ruleId, error from validated_reviews where error is not null LIMIT 50')
    }
    // performance.mark('afterCounts')
    // performance.measure('Counts', 'afterTempTable', 'afterCounts')

    // return {inserted: 0, updated: 0, errors:[]}
    async function transaction () {
      await connection.query('START TRANSACTION')

      if (counts[0].updates) {
        if (historyMaxReviews !== -1) {
          // performance.mark('beforeHistoryPrune')
          await connection.query(sqlHistoryPrune, [ historyMaxReviews ])
          // performance.mark('afterHistoryPrune')
          // performance.measure('HistoryPrune', 'beforeHistoryPrune', 'afterHistoryPrune')


        }
        if (historyMaxReviews !== 0) {
          // performance.mark('beforeHistory')
          await connection.query(sqlHistory)
          // performance.mark('afterHistory')
          // performance.measure('History', 'beforeHistory', 'afterHistory')

        }
        // performance.mark('beforeUpdateReviews')
        await connection.query(sqlUpdateReviews) 
        // performance.mark('afterUpdateReviews')
        // performance.measure('UpdateReviews', 'beforeUpdateReviews', 'afterUpdateReviews')

      }
      if (counts[0].inserts) {
        await connection.query(sqlInsertReviews) 
      }
      const statsParams = {
        collectionId
      }
      if (assets.assetIds) {
        statsParams.assetIds = assets.assetIds
      }
      else if (assets.benchmarkIds) {
        statsParams.assetBenchmarkIds = assets.benchmarkIds
      }
      if (rules.ruleIds) {
        statsParams.rules = rules.ruleIds
      }
      else if (rules.benchmarkIds) {
        statsParams.benchmarkIds = rules.benchmarkIds
      }
      // performance.mark('beforeUpdateStats')
      dbUtils.updateStatsAssetStig(connection, statsParams)
      // performance.mark('afterUpdateStats')
      // performance.measure('UpdateStats', 'beforeUpdateStats', 'afterUpdateStats')


      // performance.mark('beforeCommit')
      await connection.commit()
      // performance.mark('afterCommit')
      // performance.measure('Commit', 'beforeCommit', 'afterCommit')

     
    }

    if (!dryRun) {
      await dbUtils.retryOnDeadlock(transaction, svcStatus)
    }
    if (dryRun) {
      return {willInsert: counts[0].inserts, willUpdate: counts[0].updates, willFailValidation: counts[0].failedValidations, validationErrors}
    }
    return {inserted: counts[0].inserts, updated: counts[0].updates, failedValidation: counts[0].failedValidations, validationErrors}
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }    
    throw ( {status: 500, message: err.message, stack: err.stack} ) ;
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.query('DROP TEMPORARY TABLE IF EXISTS validated_reviews')
      await connection.release()
    }
  }
}

const writeQueries = {
  dropIncoming: 'DROP TEMPORARY TABLE IF EXISTS incoming',
  createIncomingForPost: `
  CREATE TEMPORARY TABLE IF NOT EXISTS incoming (
    ruleId varchar(255),
    resultId int,
    resultEngine json,
    detail mediumtext,
    comment mediumtext,
    autoResult json,
    statusId int,
    statusText varchar(255),
    PRIMARY KEY (ruleId)
  ) 
    SELECT
      jt.ruleId,
      jtresult.resultId,
      jt.resultEngine,
      jt.detail,
      jt.comment,
      jt.autoResult,
      jtstatus.statusId,
      jt.statusText
    FROM
      JSON_TABLE(
        ?,
        "$[*]"
        COLUMNS(
          ruleId VARCHAR(255) PATH "$.ruleId",
          result VARCHAR(255) PATH "$.result",
          resultEngine JSON PATH "$.resultEngine",
          detail MEDIUMTEXT PATH "$.detail" NULL ON EMPTY,
          comment MEDIUMTEXT PATH "$.comment",
          autoResult JSON PATH "$.autoResult",
          statusLabel VARCHAR(255) PATH "$.status.label",
          statusText VARCHAR(255) PATH "$.status.text"
        )
      ) as jt
      left join result jtresult on (jtresult.api = jt.result)
      left join status jtstatus on (jtstatus.api = jt.statusLabel)
  `,
  insertReviews: `
  insert into review (
    assetId,
      ruleId,
      resultId,
      resultEngine,
      detail,
      comment,
      autoResult,
      ts,
      userId,
      statusId,
      statusText,
      statusUserId,
      statusTs
  )
  select
    :assetId,
    i.ruleId,
    i.resultId,
    CASE WHEN i.resultEngine = 0 THEN NULL ELSE i.resultEngine END,
    COALESCE(i.detail,''),
    COALESCE(i.comment,''),
    CASE WHEN i.autoResult THEN 1 ELSE 0 END,
    UTC_TIMESTAMP(),
    :userId,
    CASE WHEN i.statusId is not null THEN i.statusId ELSE 0 END,
    i.statusText,
    :userId,
    UTC_TIMESTAMP()
    from
      incoming i
      left join review r on (r.assetId = :assetId and r.ruleId = i.ruleId)
    where
      r.ruleId is null  
  `,
  updateReviews: (resetCriteria = 'result') => `
  update 
    incoming i
    inner join review r on (r.assetId = :assetId and r.ruleId = i.ruleId)
    left join review rChanged on (
      rChanged.assetId = :assetId 
      and rChanged.ruleId = i.ruleId 
      and rChanged.statusId != 0 
      and (
        rChanged.resultId != i.resultId
        ${resetCriteria === 'any' ? 'or rChanged.detail != i.detail or rChanged.comment != i.comment' : ''}
      )
    )
  SET
    r.assetId = :assetId,

    r.ruleId = i.ruleId,

    r.resultId = COALESCE(i.resultId, r.resultId),

    r.detail = COALESCE(i.detail, r.detail),

    r.comment = COALESCE(i.comment, r.comment),

    r.autoResult = CASE WHEN i.autoResult IS NOT NULL
      THEN CASE WHEN i.autoResult THEN 1 ELSE 0 END
      ELSE r.autoResult
    END,

    r.resultEngine = CASE WHEN i.resultEngine = 0 THEN NULL ELSE COALESCE(i.resultEngine, r.resultEngine) END,

    r.ts = CASE WHEN i.resultId IS NOT NULL 
    OR i.detail IS NOT NULL 
    OR i.comment IS NOT NULL
    OR i.autoResult IS NOT NULL
      THEN UTC_TIMESTAMP()
      ELSE r.ts
    END,

    r.userId = CASE WHEN i.resultId IS NOT NULL 
    OR i.detail IS NOT NULL 
    OR i.comment IS NOT NULL
    OR i.autoResult IS NOT NULL
      THEN :userId
      ELSE r.userId
    END,

    r.statusId = CASE WHEN i.statusId IS NOT NULL 
      THEN i.statusId 
      ELSE CASE WHEN rChanged.reviewId IS NOT NULL
        THEN 0
        ELSE r.statusId
      END
    END,

    r.statusText = CASE WHEN i.statusId IS NOT NULL 
      THEN i.statusText 
        ELSE CASE WHEN rChanged.reviewId IS NOT NULL
          THEN 'Review change triggered status update'
          ELSE CASE WHEN r.statusId = 0
            THEN NULL
            ELSE r.statusText
        END
      END
    END,

    r.statusUserId = CASE WHEN i.statusId IS NOT NULL
    OR rChanged.reviewId IS NOT NULL
    OR r.statusId = 0
      THEN :userId 
      ELSE r.statusUserId
    END,

    r.statusTs = CASE WHEN i.statusId IS NOT NULL 
    OR rChanged.reviewId IS NOT NULL
    OR r.statusId = 0
      THEN UTC_TIMESTAMP()
      ELSE r.statusTs
    END
  `
}

/**
Generalized queries for review(s).
**/
exports.getReviews = async function (inProjection = [], inPredicates = {}, userObject) {
  const context = userObject.privileges.globalAccess ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
  const columns = [
    'CAST(r.assetId as char) as assetId',
    'asset.name as "assetName"',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = r.assetId),
      json_array()
    ) as assetLabelIds`,
    'r.ruleId',
    'result.api as "result"',
    'CASE WHEN r.resultEngine = 0 THEN NULL ELSE r.resultEngine END as resultEngine',
    "COALESCE(LEFT(r.detail,32767),'') as detail",
    "COALESCE(LEFT(r.comment,32767),'') as comment",
    'r.autoResult',
    'CAST(r.userId as char) as userId',
    'ud.username',
    "DATE_FORMAT(r.ts, '%Y-%m-%dT%H:%i:%sZ') as ts",
    "DATE_FORMAT(r.touchTs, '%Y-%m-%dT%H:%i:%sZ') as touchTs",
    `JSON_OBJECT(
      'label', status.api,
      'text', r.statusText,
      'user', JSON_OBJECT(
        'userId', CAST(r.statusUserId as char),
        'username', udStatus.username
      ),
      'ts', DATE_FORMAT(r.statusTs, '%Y-%m-%dT%TZ')
    ) as status`
  ]
  const groupBy = [
    'r.assetId',
    'asset.name',
    'r.ruleId',
    'rule.severity',
    'r.resultId',
    'result.api',
    'r.resultEngine',
    'r.detail',
    'r.autoResult',
    'r.comment',
    'status.api',
    'r.userId',
    'ud.username',
    'udStatus.username',
    'r.ts',
    'r.statusText',
    'r.statusUserId',
    'r.statusTs',
    'r.reviewId'
  ]
  const joins = [
    'review r',
    'left join rev_group_rule_map rgr on r.ruleId = rgr.ruleId',
    'left join rev_group_map rg on rgr.rgId = rg.rgId',
    'left join revision on rg.revId = revision.revId',
    'left join current_rev on rg.revId = current_rev.revId',
    'left join rule on r.ruleId = rule.ruleId',
    'left join result on r.resultId = result.resultId',
    'left join status on r.statusId = status.statusId',
    'left join user_data ud on r.userId = ud.userId',
    'left join user_data udStatus on r.statusUserId = udStatus.userId',
    'left join asset on r.assetId = asset.assetId',
    'left join collection c on asset.collectionId = c.collectionId',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join stig_asset_map sa on (r.assetId = sa.assetId and revision.benchmarkId = sa.benchmarkId)',
    'left join user_stig_asset_map usa on sa.saId = usa.saId'
  ]

  // PROJECTIONS
  if (inProjection.includes('metadata')) {
    columns.push(`r.metadata`)
    groupBy.push(`r.metadata`)
  }
  if (inProjection.includes('stigs')) {
    columns.push(`cast( concat( '[', group_concat(distinct concat('"',sa.benchmarkId,'"')), ']' ) as json ) as "stigs"`)

  }
  if (inProjection.includes('rule')) {
    columns.push(`json_object(
        'ruleId' , rule.ruleId,
        'title' , rule.title,
        'version' , rule.version,
        'severity' , rule.severity) as "rule"`
    )
  }
  if (inProjection.includes('history')) {
    // OVER clauses and subquery needed to order the json_arrayagg
    columns.push(`
    (select
      coalesce(
        (select json_arrayagg(
              json_object(
                'ts' , DATE_FORMAT(rh.ts, '%Y-%m-%dT%H:%i:%sZ'),
                'result', result.api,
                'resultEngine', CASE WHEN rh.resultEngine = 0 THEN NULL ELSE rh.resultEngine END,
                'detail', COALESCE(LEFT(rh.detail,32767),''),
                'comment', COALESCE(LEFT(rh.comment,32767),''),
                'autoResult', cast(rh.autoResult is true as json),
                'userId', CAST(rh.userId as char),
                'username', ud.username,
                'status', JSON_OBJECT(
                  'label', status.api,
                  'text', rh.statusText,
                  'user', JSON_OBJECT(
                    'userId', CAST(rh.statusUserId as char),
                    'username', udStatus.username
                  ),
                  'ts', DATE_FORMAT(rh.statusTs, '%Y-%m-%dT%TZ')
                ),
                'touchTs', DATE_FORMAT(rh.touchTs, '%Y-%m-%dT%TZ')
              )
            )
          FROM
            review_history rh
            left join result on rh.resultId = result.resultId 
            left join status on rh.statusId = status.statusId 
            left join user_data ud on ud.userId=rh.userId
            left join user_data udStatus on udStatus.userId=rh.statusUserId
          where
            rh.reviewId = r.reviewId),
        json_array()
      )
    ) as "history"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  
  // Role/Assignment based access control 
  if (context == dbUtils.CONTEXT_USER) {
    predicates.statements.push('cg.userId = ?')
    predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN (usa.userId = cg.userId AND sa.benchmarkId = revision.benchmarkId) ELSE TRUE END')
    predicates.binds.push(userObject.userId)
  }

  switch (inPredicates.rules) {
    case 'current-mapped':
      predicates.statements.push(`current_rev.revId IS NOT NULL`)
      predicates.statements.push(`sa.saId IS NOT NULL`)
      break
    case 'current':
      predicates.statements.push(`current_rev.revId IS NOT NULL`)
      break
    case 'not-current-mapped':
      predicates.statements.push(`current_rev.revId IS NULL`)
      predicates.statements.push(`sa.saId IS NULL`)
      break
    case 'not-current':
      predicates.statements.push(`current_rev.revId IS NULL`)
      break
  }

    // COMMON
  if (inPredicates.collectionId) {
    predicates.statements.push('asset.collectionId = ?')
    predicates.binds.push(inPredicates.collectionId)
  }
  if (inPredicates.result) {
    predicates.statements.push('result.api = ?')
    predicates.binds.push(inPredicates.result)
  }
  if (inPredicates.status) {
    predicates.statements.push('status.api = ?')
    predicates.binds.push(inPredicates.status)
  }
  if (inPredicates.ruleId) {
    predicates.statements.push('r.ruleId = ?')
    predicates.binds.push(inPredicates.ruleId)
  }
  if (inPredicates.groupId) {
    predicates.statements.push(`rg.groupId = ?`)
    predicates.binds.push(inPredicates.groupId)
  }
  if (inPredicates.cci) {
    predicates.statements.push(`r.ruleId IN (
      SELECT
        ruleId
      FROM
        rule_cci_map
      WHERE
        cci = ?
      )` )
      predicates.binds.push(inPredicates.cci)
  }
  if (inPredicates.userId) {
    predicates.statements.push('r.userId = ?')
    predicates.binds.push(inPredicates.userId)
  }
  if (inPredicates.assetId) {
    predicates.statements.push('r.assetId = ?')
    predicates.binds.push(inPredicates.assetId)
  }
  if (inPredicates.benchmarkId) {
      predicates.statements.push(`revision.benchmarkId = ?`)
      predicates.binds.push(inPredicates.benchmarkId)
  }
  if ( inPredicates.metadata ) {
    for (const pair of inPredicates.metadata) {
      const [key, value] = pair.split(':')
      predicates.statements.push('JSON_CONTAINS(r.metadata, ?, ?)')
      predicates.binds.push( `"${value}"`,  `$.${key}`)
    }
  }


  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ` GROUP BY ${groupBy.join(', ')}`

  let [rows] = await dbUtils.pool.query(sql, predicates.binds)

  return (rows)
}

exports.exportReviews = async function (includeHistory = false) {
  const columns = [
    'CAST(r.assetId as char) as assetId',
    'r.ruleId',
    'result.api as "result"',
    'CASE WHEN r.resultEngine = 0 THEN NULL ELSE r.resultEngine END as resultEngine',
    'LEFT(r.detail,32767) as detail',
    'LEFT(r.comment,32767) as comment',
    'CAST(r.userId as char) as userId',
    "DATE_FORMAT(r.ts, '%Y-%m-%dT%H:%i:%sZ') as ts",
    "DATE_FORMAT(r.touchTs, '%Y-%m-%dT%H:%i:%sZ') as touchTs",
    `JSON_OBJECT(
      'label', status.api,
      'text', r.statusText,
      'userId', CAST(r.statusUserId as char),
      'ts', DATE_FORMAT(r.statusTs, '%Y-%m-%dT%TZ')
    ) as status`,
    'r.metadata'
  ]
  const joins = [
    'review r',
    'left join result on r.resultId = result.resultId',
    'left join status on r.statusId = status.statusId',
  ]

  let groupBy
  if (includeHistory) {
    columns.push(`
    (select
      coalesce(
        (select json_arrayagg(
              json_object(
                'ts' , DATE_FORMAT(rh.ts, '%Y-%m-%dT%H:%i:%sZ'),
                'result', result.api,
                'resultEngine', CASE WHEN rh.resultEngine = 0 THEN NULL ELSE rh.resultEngine END,
                'detail', LEFT(rh.detail,32767),
                'comment', LEFT(rh.comment,32767),
                'userId', CAST(rh.userId as char),
                'status', JSON_OBJECT(
                  'label', status.api,
                  'text', rh.statusText,
                  'userId', CAST(rh.statusUserId as char),
                  'ts', DATE_FORMAT(rh.statusTs, '%Y-%m-%dT%TZ')
                ),
                'touchTs', DATE_FORMAT(rh.touchTs, '%Y-%m-%dT%TZ')
              )
            )
          FROM
            review_history rh
            left join result on rh.resultId = result.resultId 
            left join status on rh.statusId = status.statusId 
          where
            rh.reviewId = r.reviewId),
        json_array()
      )
    ) as "history"`)
    groupBy = [
      'r.assetId',
      'r.ruleId',
      'r.resultId',
      'result.api',
      'r.resultEngine',
      'r.detail',
      'r.comment',
      'status.api',
      'r.userId',
      'r.ts',
      'r.statusText',
      'r.statusUserId',
      'r.statusTs',
      'r.metadata',
      'r.reviewId',
    ]
  }

  const sql = `SELECT
  ${columns.join(',\n')}
  FROM
  ${joins.join(" \n")}
  ${includeHistory ? ` GROUP BY ${groupBy.join(', ')}` : ''}
  `
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}


/**
 * Delete a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.deleteReviewByAssetRule = async function(assetId, ruleId, projection, userObject, svcStatus = {}) {
  let connection
  try {
    let binds = {
      assetId: assetId,
      ruleId: ruleId
    };

    let rows = await _this.getReviews(projection, binds, userObject);
    
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      let sqlDelete = 'DELETE FROM review WHERE assetId = :assetId AND ruleId = :ruleId;';
      await connection.query(sqlDelete, binds);
      await dbUtils.updateStatsAssetStig( connection, { ruleId, assetId })
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return (rows[0]);
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }    
    throw ( {status: 500, message: err.message, stack: err.stack} ) ;
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

}

exports.putReviewsByAsset = async function ({
    assetId, 
    reviews, 
    userObject, 
    resetCriteria, 
    tryInsert = true, 
    svcStatus = {},
    maxHistory = 5
  }) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    await connection.query(writeQueries.dropIncoming)
    await connection.query(writeQueries.createIncomingForPost, [ JSON.stringify(reviews) ])

    async function transaction () {
      const affected = {
        updated: 0,
        inserted: 0
      }
      const sqlHistoryPrune = `
      with historyRecs AS (
        select
          rh.historyId,
          ROW_NUMBER() OVER (PARTITION BY r.assetId, r.ruleId ORDER BY rh.historyId DESC) as rowNum
        from
          review_history rh
          left join review r using (reviewId)
        where
          assetId = ?
          and ruleId IN ?)
      delete review_history
      FROM 
         review_history
         left join historyRecs on review_history.historyId = historyRecs.historyId 
      WHERE 
         historyRecs.rowNum > ? - 1
      `
      const sqlHistory = `  
      INSERT INTO review_history (
        reviewId,
        resultId,
        detail,
        comment,
        autoResult,
        ts,
        userId,
        statusText,
        statusUserId,
        statusTs,
        statusId,
        touchTs,
        resultEngine
      ) SELECT 
          reviewId,
          resultId,
          LEFT(detail,32767) as detail,
          LEFT(comment,32767) as comment,
          autoResult,
          ts,
          userId,
          statusText,
          statusUserId,
          statusTs,
          statusId,
          touchTs,
          CASE WHEN resultEngine = 0 THEN NULL ELSE resultEngine END
        FROM
          review 
        WHERE
          assetId = ?
          and ruleId IN ?
          and reviewId IS NOT NULL
        FOR UPDATE    
      `
      await connection.query('START TRANSACTION')
      const historyRules = reviews.map( r => r.ruleId )
      if (maxHistory !== -1) {
        await connection.query(sqlHistoryPrune, [ assetId, [historyRules], maxHistory ])
      }
      if (maxHistory !== 0) {
        await connection.query(sqlHistory, [ assetId, [historyRules] ])
      }
      const [resultUpdate] = await connection.query(writeQueries.updateReviews(resetCriteria), {userId: userObject.userId, assetId})
      affected.updated = resultUpdate.affectedRows
      if (tryInsert) {
        const [resultInsert] = await connection.query(writeQueries.insertReviews, {userId: userObject.userId, assetId})
        affected.inserted = resultInsert.affectedRows
      }
      await dbUtils.updateStatsAssetStig(connection, {
        assetId: assetId,
        rules: historyRules
      })
      await connection.commit()
      return affected
    }
    return await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    if (err.code === 'ER_DUP_ENTRY') {
      throw({status: 400, message: err.message})
    }
    throw ( err )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.query(writeQueries.dropIncoming)
      await connection.release()
    }
  }
}

// Returns a Set of ruleIds
exports.getRulesByAssetUser = async function ( assetId, userObject ) {
  try {
    const binds = []
    let sql = `
      select
        distinct rgr.ruleId 
      from 
        asset a
        left join collection_grant cg on a.collectionId = cg.collectionId
        left join stig_asset_map sa using (assetId)
        left join user_stig_asset_map usa on sa.saId = usa.saId
        left join revision rev using (benchmarkId)
        left join rev_group_map rg using (revId)
        left join rev_group_rule_map rgr using (rgId)
      where 
        a.assetid = ?`
    binds.push(assetId)
    if (!userObject.privileges.globalAccess) {
      sql += `
      and cg.userId = ?
      and CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END`
      binds.push(userObject.userId)
    }
    let [rows] = await dbUtils.pool.query(sql, binds)
    return new Set(rows.map( row => row.ruleId ))
  }
  finally { }
}

// Returns a Boolean
exports.checkRuleByAssetUser = async function (ruleId, assetId, userObject) {
  try {
    const binds = []
    let sql = `
      select
        distinct rgr.ruleId 
      from 
        asset a
        left join collection_grant cg on a.collectionId = cg.collectionId
        left join stig_asset_map sa using (assetId)
        left join user_stig_asset_map usa on sa.saId = usa.saId
        left join revision rev using (benchmarkId)
        left join rev_group_map rg using (revId)
        left join rev_group_rule_map rgr using (rgId)
      where 
        a.assetId = ?
        and rgr.ruleId = ?`
    binds.push(assetId, ruleId)
    if (!userObject.privileges.globalAccess) {
      sql += `
      and cg.userId = ?
      and CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END`
      binds.push(userObject.userId)
    }    
    let [rows] = await dbUtils.pool.query(sql, binds)
    return rows.length > 0
  }
  finally { }
}

exports.getReviewMetadataKeys = async function ( assetId, ruleId ) {
  const binds = []
  let sql = `
    select
      JSON_KEYS(metadata) as keyArray
    from 
      review r
    where 
      r.assetId = ?
      and r.ruleId = ?`
  binds.push(assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].keyArray : []
}

exports.getReviewMetadata = async function ( assetId, ruleId ) {
    const binds = []
    let sql = `
      select
        metadata 
      from 
        review r
      where 
        r.assetId = ?
        and r.ruleId = ?`
    binds.push(assetId, ruleId)
    let [rows] = await dbUtils.pool.query(sql, binds)
    return rows.length > 0 ? rows[0].metadata : {}
}

exports.patchReviewMetadata = async function ( assetId, ruleId, metadata ) {
  const binds = []
  let sql = `
    update
      review 
    set 
      metadata = JSON_MERGE_PATCH(metadata, ?)
    where 
      assetId = ?
      and ruleId = ?`
  binds.push(JSON.stringify(metadata), assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.putReviewMetadata = async function ( assetId, ruleId, metadata ) {
  const binds = []
  let sql = `
    update
      review
    set 
      metadata = ?
    where 
      assetId = ?
      and ruleId = ?`
  binds.push(JSON.stringify(metadata), assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.getReviewMetadataValue = async function ( assetId, ruleId, key ) {
  const binds = []
  let sql = `
    select
      JSON_EXTRACT(metadata, ?) as value
    from 
      review r
    where 
      r.assetId = ?
      and r.ruleId = ?`
  binds.push(`$."${key}"`, assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.putReviewMetadataValue = async function ( assetId, ruleId, key, value ) {
  const binds = []
  let sql = `
    update
      review
    set 
      metadata = JSON_SET(metadata, ?, ?)
    where 
      assetId = ?
      and ruleId = ?`
  binds.push(`$."${key}"`, value, assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.deleteReviewMetadataKey = async function ( assetId, ruleId, key ) {
  const binds = []
  let sql = `
    update
      review 
    set 
      metadata = JSON_REMOVE(metadata, ?)
    where 
      assetId = ?
      and ruleId = ?`
binds.push(`$."${key}"`, assetId, ruleId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}