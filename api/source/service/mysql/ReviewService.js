'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

let _this = this

/**
Generalized queries for review(s).
**/
exports.getReviews = async function (inProjection = [], inPredicates = {}, userObject) {
  let connection
  try {
    const context = userObject.privileges.globalAccess ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    const columns = [
      'CAST(r.assetId as char) as assetId',
      'asset.name as "assetName"',
      'r.ruleId',
      'result.api as "result"',
      'r.resultComment',
      'r.autoResult',
      'action.api as "action"',
      'r.actionComment',
      'status.api as "status"',
      'CAST(r.userId as char) as userId',
      'ud.username',
      'r.ts',
      'r.rejectText',
      'CAST(r.rejectUserId as char) as rejectUserId',
      `CASE
        WHEN r.ruleId is null
        THEN 0
        ELSE
          CASE WHEN r.resultId != 4
          THEN
            CASE WHEN r.resultComment != ' ' and r.resultComment is not null
              THEN 1
              ELSE 0 END
          ELSE
            CASE WHEN r.actionId is not null and r.actionComment is not null and r.actionComment != ' '
              THEN 1
              ELSE 0 END
          END
      END as "reviewComplete"`
    ]
    const groupBy = [
      'r.assetId',
      'asset.name',
      'r.ruleId',
      'rule.severity',
      'r.resultId',
      'result.api',
      'r.resultComment',
      'r.autoResult',
      'r.actionId',
      'action.api',
      'r.actionComment',
      'status.api',
      'r.userId',
      'ud.username',
      'r.ts',
      'r.rejectText',
      'r.rejectUserId',
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
      'left join action on r.actionId = action.actionId',
      'left join user_data ud on r.userId = ud.userId',
      'left join asset on r.assetId = asset.assetId',
      'left join collection c on asset.collectionId = c.collectionId',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join stig_asset_map sa on (r.assetId = sa.assetId and revision.benchmarkId = sa.benchmarkId)',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]

    // PROJECTIONS
    if (inProjection.includes('stigs')) {
      columns.push(`json_arrayagg(sa.benchmarkId) as "stigs"`)
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
          (select  innerh.h from (select json_arrayagg(
                json_object(
                  'ts' , DATE_FORMAT(rh.ts, '%Y-%m-%dT%H:%i:%sZ'),
                  'result', result.api,
                  'resultComment', rh.resultComment,
                  'action', action.api,
                  'actionComment', rh.actionComment,
                  'autoResult', cast(rh.autoResult is true as json),
                  'userId', CAST(rh.userId as char),
                  'username', ud.username,
                  'rejectText', rh.rejectText,
                  'status', status.api
                )
              ) OVER (order by rh.ts desc) as h,
              ROW_NUMBER() OVER (order by rh.ts) as rn
            FROM
              review_history rh
              left join result on rh.resultId = result.resultId 
              left join status on rh.statusId = status.statusId 
              left join action on rh.actionId = action.actionId 
              left join user_data ud on ud.userId=rh.userId
            where
              rh.reviewId = r.reviewId LIMIT 1) as innerh),
          json_array()
        )
      ) as "history"`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    
    // Role/Assignment based access control 
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('cg.userId = :userId')
      predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN (usa.userId = cg.userId AND sa.benchmarkId = revision.benchmarkId) ELSE TRUE END')
      predicates.binds.userId = userObject.userId
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
      predicates.statements.push('asset.collectionId = :collectionId')
      predicates.binds.collectionId = inPredicates.collectionId
    }
    if (inPredicates.result) {
      predicates.statements.push('result.api = :result')
      predicates.binds.result = inPredicates.result
    }
    if (inPredicates.action) {
      predicates.statements.push('action.api = :action')
      predicates.binds.action = inPredicates.action
    }
    if (inPredicates.status) {
      predicates.statements.push('status.api = :status')
      predicates.binds.status = inPredicates.status
    }
    if (inPredicates.ruleId) {
      predicates.statements.push('r.ruleId = :ruleId')
      predicates.binds.ruleId = inPredicates.ruleId
    }
    if (inPredicates.groupId) {
      predicates.statements.push(`rg.groupId = :groupId`)
      predicates.binds.groupId = inPredicates.groupId
    }
    if (inPredicates.cci) {
      predicates.statements.push(`r.ruleId IN (
        SELECT
          ruleId
        FROM
          rule_cci_map
        WHERE
          cci = :cci
        )` )
        predicates.binds.cci = inPredicates.cci
    }
    if (inPredicates.userId) {
      predicates.statements.push('r.userId = :userId2')
      predicates.binds.userId2 = inPredicates.userId
    }
    if (inPredicates.assetId) {
      predicates.statements.push('r.assetId = :assetId')
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.benchmarkId) {
        predicates.statements.push(`revision.benchmarkId = :benchmarkId`)
        predicates.binds.benchmarkId = inPredicates.benchmarkId
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
    sql += ' order by r.assetId, r.ruleId'

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [rows] = await connection.query(sql, predicates.binds)

    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Delete a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.deleteReviewByAssetRule = async function(assetId, ruleId, projection, userObject) {
}


/**
 * Create or update a complete Review
 *
 * projection List Additional properties to include in the response.  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReviewByAssetRule = async function(projection, assetId, ruleId, body, userObject) {
  let connection
  try {
    let sqlHistory = `
    INSERT INTO review_history (
      reviewId,
      resultId,
      resultComment,
      autoResult,
      actionId,
      actionComment,
      ts,
      userId,
      rejectText,
      rejectUserId,
      statusId
    ) SELECT 
        reviewId,
        resultId,
        resultComment,
        autoResult,
        actionId,
        actionComment,
        ts,
        userId,
        rejectText,
        rejectUserId,
        statusId
      FROM
        review 
      WHERE
        assetId = :assetId
        and ruleId = :ruleId
        and reviewId IS NOT NULL
      FOR UPDATE
    `    

    let values = {
      userId: userObject.userId,
      resultId: dbUtils.REVIEW_RESULT_API[body.result],
      resultComment: body.resultComment,
      actionId: body.action ? dbUtils.REVIEW_ACTION_API[body.action] : null,
      actionComment: body.actionComment || null,
      statusId: body.status ? dbUtils.REVIEW_STATUS_API[body.status] : null,
      autoResult: body.autoResult? 1 : 0
    }

    let binds = {
      assetId: assetId,
      ruleId: ruleId,
      values: values
    }
    let sqlUpdate = `
      UPDATE
        review
      SET
        :values
      WHERE
        assetId = :assetId and ruleId = :ruleId`
    
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION')

    // History
    await connection.query(sqlHistory, binds)
    let [result] = await connection.query(sqlUpdate, binds)
    let status = 'updated'
    if (result.affectedRows == 0) {
      binds = {
        assetId: assetId,
        ruleId: ruleId,
        ...values
      }
      let sqlInsert = `
        INSERT INTO review
        (assetId, ruleId, resultId, resultComment, actionId, actionComment, statusId, userId, autoResult)
        VALUES
        (:assetId, :ruleId, :resultId, :resultComment, :actionId, :actionComment, :statusId, :userId, :autoResult)
      `
      ;[result] = await connection.query(sqlInsert, binds)
      status = 'created'
    }
    await dbUtils.updateStatsAssetStig( connection, {
      assetId: assetId,
      rules: [ruleId]
    })
    await connection.commit()

    let rows = await _this.getReviews(projection, {
      assetId: assetId,
      ruleId: ruleId
    }, userObject)
    return ({
      row: rows[0],
      status: status
    })
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


exports.putReviewsByAsset = async function( assetId, reviews, userObject) {
  let connection
  try {
    let sqlMerge = `
    INSERT INTO review (
      assetId,
      ruleId,
      resultId,
      resultComment,
      autoResult,
      actionId,
      actionComment,
      statusId,
      userId
    ) VALUES ? ON DUPLICATE KEY UPDATE 
      assetId = VALUES(assetId),
      ruleId = VALUES(ruleId),
      resultId = VALUES(resultId),
      resultComment = VALUES(resultComment),
      autoResult = VALUES(autoResult),
      actionId = VALUES(actionId),
      actionComment = VALUES(actionComment),
      statusId = VALUES(statusId),
      userId = VALUES(userId),
      ts = UTC_TIMESTAMP()`
    let sqlHistory = `
    INSERT INTO review_history (
      reviewId,
      resultId,
      resultComment,
      autoResult,
      actionId,
      actionComment,
      ts,
      userId,
      rejectText,
      rejectUserId,
      statusId
    ) SELECT 
        reviewId,
        resultId,
        resultComment,
        autoResult,
        actionId,
        actionComment,
        ts,
        userId,
        rejectText,
        rejectUserId,
        statusId
      FROM
        review 
      WHERE
        assetId = ?
        and ruleId IN ?
        and reviewId IS NOT NULL
      FOR UPDATE    
    `
    let mergeBinds = []
    let historyRules = []
    for (const review of reviews) {
      mergeBinds.push([
        assetId,
        review.ruleId,
        dbUtils.REVIEW_RESULT_API[review.result],
        review.resultComment,
        review.autoResult? 1 : 0,
        review.action ? dbUtils.REVIEW_ACTION_API[review.action] : null,
        review.actionComment || null,
        review.status ? dbUtils.REVIEW_STATUS_API[review.status] : 0,
        userObject.userId
      ])
      historyRules.push(review.ruleId) 
    }

    connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')
    await connection.query(sqlHistory, [ assetId, [historyRules] ])
    let [result] = await connection.query(sqlMerge, [mergeBinds])
    let errors = []
    await dbUtils.updateStatsAssetStig(connection, {
      assetId: assetId,
      rules: historyRules
    })
    await connection.commit()
    return (errors)
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Merge update a Review, if it exists
 *
 * projection List Additional properties to include in the response.  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.patchReviewByAssetRule = async function(projection, assetId, ruleId, body, userObject) {
  let connection
  try {
    let values = {
      userId: userObject.userId
    }
    if (body.result !== undefined) {
      values.resultId = dbUtils.REVIEW_RESULT_API[body.result]
    }
    if (body.resultComment !== undefined) {
      values.resultComment = body.resultComment
    }
    if (body.action !== undefined) {
      values.actionId = dbUtils.REVIEW_ACTION_API[body.action]
    }
    if (body.actionComment !== undefined) {
      values.actionComment = body.actionComment
    }
    if (body.status !== undefined) {
      values.statusId = dbUtils.REVIEW_STATUS_API[body.status]
    }
    if (body.autoResult !== undefined) {
      values.autoResult = body.autoResult ? 1 : 0
    }
    if (body.rejectText !== undefined) {
      values.rejectText = body.rejectText
    }
    if (body.rejectUserId != undefined) {
      values.rejectUserId = body.rejectUserId
    }

    let binds = {
      assetId: assetId,
      ruleId: ruleId,
      values: values
    }
    let sqlHistory = `
    INSERT INTO review_history (
      reviewId,
      resultId,
      resultComment,
      autoResult,
      actionId,
      actionComment,
      ts,
      userId,
      rejectText,
      rejectUserId,
      statusId
    ) SELECT 
        reviewId,
        resultId,
        resultComment,
        autoResult,
        actionId,
        actionComment,
        ts,
        userId,
        rejectText,
        rejectUserId,
        statusId
      FROM
        review 
      WHERE
        assetId = :assetId
        and ruleId = :ruleId
        and reviewId IS NOT NULL`    

    let sqlUpdate = `
      UPDATE
        review
      SET
        :values
      WHERE
        assetId = :assetId and ruleId = :ruleId`

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION')

    // History
    await connection.query(sqlHistory, binds)

    let [result] = await connection.query(sqlUpdate, binds)

    if (result.affectedRows == 0) {
      throw ({message: "Review must exist to be patched."})
    }
    await dbUtils.updateStatsAssetStig(connection, {
      assetId: assetId,
      rules: [ruleId]
    })

    await connection.commit()
    let rows = await _this.getReviews(projection, {
      assetId: assetId,
      ruleId: ruleId
    }, userObject)
    return (rows[0])
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    if (err.code == 400) {
      throw(err)
    }
    else {
      throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
    }
  }
  finally {
    if (typeof connection !== 'undefined') {
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
