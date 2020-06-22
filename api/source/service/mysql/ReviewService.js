'use strict';
const writer = require('../../utils/writer.js')
const parsers = require('../../utils/parsers.js')
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
      'r.userId',
      'ud.username',
      'r.ts',
      'r.rejectText',
      'r.rejectUserId',
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
      'r.rejectUserId'
    ]
    const joins = [
      'review r',
      'left join result on r.resultId = result.resultId',
      'left join status on r.statusId = status.statusId',
      'left join action on r.actionId = action.actionId',
      'left join user_data ud on r.userId = ud.userId',
      'left join asset on r.assetId = asset.assetId',
      'left join collection p on asset.collectionId = p.collectionId',
      'left join collection_grant pg on p.collectionId = pg.collectionId',
      'left join stig_asset_map sa on asset.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]

    // PROJECTIONS
    if (inProjection.includes('asset')) {
      columns.push(`(select 
        json_object(
          'assetId', CAST(a.assetId as char),
          'name', a.name,
          'collection', json_object(
            'collectionId', CAST(p.collectionId as char),
            'name', p.name,
            'workflow', p.workflow
          )
        )
        from asset a 
        left join collection p on a.collectionId = p.collectionId
        where a.assetId = r.assetId) as "asset"`)
    }
    if (inProjection.includes('stigs')) {
      columns.push(`(select json_arrayagg(json_object(
        'benchmarkId' , rev.benchmarkId,
        'revisionStr' ,  concat('V', rev.version, 'R', rev.release)))
        from rev_group_rule_map rgr 
        left join rev_group_map rg on rgr.rgId = rg.rgId
        left join revision rev on rg.revId = rev.revId
        where rgr.ruleId = r.ruleId) as "stigs"`)
    }
    if (inProjection.includes('rule')) {
      // Query hacks the possibility of a 1:n rule:group relationship
      columns.push(`(select
        json_object(
          'ruleId' , rule.ruleId
          ,'ruleTitle' , rule.title
          ,'groupId' , g.groupId
          ,'groupTitle' , g.title
          ,'severity' , rule.severity)
        from
          rule
          left join rev_group_rule_map rgr on rgr.ruleId=rule.ruleId
          inner join rev_group_map rg on rgr.rgId=rg.rgId
          inner join \`group\` g on rg.groupId=g.groupId
        where
          rule.ruleId = r.ruleId LIMIT 1) as "rule"`)
    }
    if (inProjection.includes('history')) {
      columns.push(`
      (select
        coalesce(
          (select hh.h from 
            (select
              json_arrayagg(
                json_object(
                  'ts' , DATE_FORMAT(rh.ts, '%Y-%m-%d %H:%i:%s'),
                  'activityType' , rh.activityType,
                  'columnName' , rh.columnName,
                  'oldValue' , rh.oldValue,
                  'newValue' , rh.newValue,
                  'userId' , rh.userId,
                  'username' , ud.username
                )
              ) OVER (order by rh.ts desc) as h,
              ROW_NUMBER() OVER (order by rh.ts) as rn
            FROM
              review_history rh
              left join user_data ud on ud.userId=rh.userId
            where
              rh.ruleId = :ruleId and
              rh.assetId = :assetId LIMIT 1) as hh),
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
    // CONTEXT_USER
    if (context == dbUtils.CONTEXT_USER) {
      predicates.statements.push('pg.userId = :userId')
      predicates.statements.push('CASE WHEN pg.accessLevel = 1 THEN usa.userId = pg.userId ELSE TRUE END')
      predicates.binds.userId = userObject.userId
    }

      // COMMON
    if (inPredicates.userId) {
      predicates.statements.push('r.userId = :userId')
      predicates.binds.userId = inPredicates.userId
    }
    if (inPredicates.assetId) {
      predicates.statements.push('r.assetId = :assetId')
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.ruleId) {
      predicates.statements.push('r.ruleId = :ruleId')
      predicates.binds.ruleId = inPredicates.ruleId
    }
    if (inPredicates.result) {
      predicates.statements.push('result.api = :result')
      predicates.binds.result = inPredicates.result
    }
    if (inPredicates.status) {
      predicates.statements.push('status.api = :status')
      predicates.binds.status = inPredicates.status
    }
    if (inPredicates.action) {
      predicates.statements.push('action.api = :action')
      predicates.binds.action = inPredicates.action
    }
    if (inPredicates.collectionId) {
      predicates.statements.push('asset.collectionId = :collectionId')
      predicates.binds.collectionId = inPredicates.collectionId
    }
    if (inPredicates.benchmarkId) {
      if (inPredicates.revisionStr && inPredicates.revisionStr != 'latest') {
        // Calculate the revId
        let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
        let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
        predicates.statements.push(`r.ruleId IN (
          SELECT
            r2.ruleId
          FROM
            revision rev
            left join rev_group_map rg on rev.revId = rg.revId
            left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
            left join rule r2 on rgr.ruleId = r2.ruleId
          WHERE
            rev.benchmarkId = :benchmarkId
            and rev.revId = :revId    
          )` )
          predicates.binds.benchmarkId = inPredicates.benchmarkId
          predicates.binds.revId = revId
      } 
      else { 
        predicates.statements.push(`r.ruleId IN (
          SELECT
            r2.ruleId
          FROM
            current_rev rev
            left join rev_group_map rg on rev.revId = rg.revId
            left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
            left join rule r2 on rgr.ruleId = r2.ruleId
          WHERE
            rev.benchmarkId = :benchmarkId      
          )` )
        predicates.binds.benchmarkId = inPredicates.benchmarkId
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
    sql += ' order by r.assetId, r.ruleId'

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [rows] = await connection.query(sql, predicates.binds)

    for (let x = 0, l = rows.length; x < l; x++) {
      let record = rows[x]
      record.reviewComplete = record.reviewComplete == 1 ? true : false
    }

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
    let [result] = await connection.query(sqlUpdate, binds)
    let status = 'created'
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
      status = 'updated'
    }
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
      userId = VALUES(userId)`
    let binds = []
    reviews.forEach(review => {
      let values = [
        assetId,
        review.ruleId,
        dbUtils.REVIEW_RESULT_API[review.result],
        review.resultComment,
        review.autoResult? 1 : 0,
        review.action ? dbUtils.REVIEW_ACTION_API[review.action] : null,
        review.actionComment || null,
        review.status ? dbUtils.REVIEW_STATUS_API[review.status] : 0,
        userObject.userId
      ]
      binds.push(values)
    })

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [result] = await connection.query(sqlMerge, [binds])

    let errors = []
    await connection.commit()
    return (errors)
  }
  catch(err) {
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
    if (body.result != undefined) {
      values.resultId = dbUtils.REVIEW_RESULT_API[body.result]
    }
    if (body.resultComment != undefined) {
      values.resultComment = body.resultComment
    }
    if (body.action != undefined) {
      values.actionId = dbUtils.REVIEW_ACTION_API[body.action]
    }
    if (body.actionComment != undefined) {
      values.actionComment = body.actionComment
    }
    if (body.status != undefined) {
      values.statusId = dbUtils.REVIEW_STATUS_API[body.status]
    }
    if (body.autoResult != undefined) {
      values.autoResult = body.autoResult ? 1 : 0
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
    let [result] = await connection.query(sqlUpdate, binds)

    if (result.affectedRows == 0) {
      throw ({message: "Review must exist to be patched."})
    }
    let rows = await _this.getReviews(projection, {
      assetId: assetId,
      ruleId: ruleId
    }, userObject)
    return (rows[0])
  }
  catch(err) {
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
