'use strict';
const writer = require('../../utils/writer.js')
const parsers = require('../../utils/parsers.js')
const dbUtils = require('./utils')

let _this = this

/**
Generalized queries for review(s).
**/
exports.queryReviews = async function (inProjection = [], inPredicates = {}, userObject) {
  let connection
  try {
    let context
    if (userObject.accessLevel === 3 ) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.accessLevel === 2) {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'r.assetId',
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
    let groupBy = [
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
    let joins = [
      'review r',
      'left join result on r.resultId = result.resultId',
      'left join status on r.statusId = status.statusId',
      'left join action on r.actionId = action.actionId',
      'left join user_data ud on r.userId = ud.userId',
      'left join asset on r.assetId = asset.assetId'
    ]

    // PROJECTIONS
    if (inProjection.includes('asset')) {
      columns.push(`(select 
        json_object(
          'assetId', a.assetId,
          'name', a.name,
          'dept', json_object(
            'deptId', d.deptId,
            'name', d.name
          ),
          'package', json_object(
            'packageId', p.packageId,
            'name', p.name
          )
        )
        from asset a 
        left join department d on a.deptId = d.deptId
        left join package p on a.packageId = p.packageId
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
    if (context === dbUtils.CONTEXT_USER) {
      
      // Construct an 'aclSubquery' to determine allowed assetId/ruleId pairs
      let aclColumns = [
        'DISTINCT sa.assetId',
        'rgr.ruleId'
      ]
      let aclPredicates = [
        'usa.userId = :context_user'
      ]
      predicates.binds.context_user = userObject.userId

      // item 3 ('inner join current_rev') handles the common case where revisionStr is 'latest'
      // Will replace aclJoins[3] for other revisionStr values
      let aclJoins = [
        'user_stig_asset_map usa',
        'inner join stig_asset_map sa on sa.said = usa.said',
        'left join asset a on a.assetId = sa.assetId',
        'inner join current_rev rev on rev.benchmarkId = sa.benchmarkId',
        'inner join rev_group_map rg on rev.revId = rg.revId',
        'inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId'
      ]

      if (inPredicates.assetId) {
        aclPredicates.push('sa.assetId = :assetId')
        predicates.binds.assetId = inPredicates.assetId
        // Delete property so it is not processed by later code
        delete inPredicates.assetId
      }
      if (inPredicates.ruleId) {
        aclPredicates.push('rgr.ruleId = :ruleId')
        predicates.binds.ruleId = inPredicates.ruleId
        // Delete property so it is not processed by later code
        delete inPredicates.ruleId
      }
      if (inPredicates.packageId) {
        aclPredicates.push('a.packageId = :packageId')
        predicates.binds.packageId = inPredicates.packageId
        // Delete property so it is not processed by later code
        delete inPredicates.packageId
      }
      // If predicates include benchmarkId and revisionStr (which must occur together)
      if (inPredicates.benchmarkId) {
        aclPredicates.push('sa.benchmarkId = :benchmarkId')
        predicates.binds.benchmarkId = inPredicates.benchmarkId
        // Delete property so it is not processed by later code
        delete inPredicates.benchmarkId
      }
      if (inPredicates.revisionStr && inPredicates.revisionStr !== 'latest') {
        // Join to revisions so we can specify a revId
        aclJoins[3] = 'inner join revision rev on rev.benchmarkId = sa.benchmarkId'
        // Calculate the revId
        let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
        let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
        aclPredicates.push('rev.revId = :revId')
        predicates.binds.revId = revId
        // Delete property so it is not processed by later code
        delete inPredicates.revisionStr
      }
      let aclSubquery = `
      SELECT
        ${aclColumns.join(",\n")}
      FROM
        ${aclJoins.join(" \n")}
      WHERE
        ${aclPredicates.join(" and ")}
      `
      // Splice the subquery onto the main query
      joins.splice(0, 1, `(${aclSubquery}) acl`, 'inner join review r on (acl.assetId = r.assetId AND acl.ruleId = r.ruleId)')
      //joins.push(`inner join (${aclSubquery}) acl on (acl.assetId = r.assetId AND acl.ruleId = r.ruleId)`)
    }
    // CONTEXT_DEPT
    else if (context === dbUtils.CONTEXT_DEPT) {
      predicates.statements.push('asset.deptId = :deptId')
      predicates.binds.deptId = userObject.dept.deptId
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
    if (inPredicates.packageId) {
      predicates.statements.push('asset.packageId = :packageId')
      predicates.binds.packageId = inPredicates.packageId
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
exports.deleteReview = async function(reviewId, projection, userObject) {
}


/**
 * Return a list of Reviews accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * state ReviewState  (optional)
 * action ReviewAction  (optional)
 * status ReviewStatus  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * benchmarkId String Selects Reviews mapped to a STIG (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * packageId Integer Selects Reviews mapped to a Package (optional)
 * returns List
 **/
exports.getReviews = async function(projection, predicates, userObject) {
  try {
    let rows = await _this.queryReviews(projection, predicates, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
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
exports.putReview = async function(projection, assetId, ruleId, body, userObject) {
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
    let rows = await _this.queryReviews(projection, {
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


/**
 * Create or update a complete Review
 *
 * projection List Additional properties to include in the response.  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReviews = async function( reviews, userObject) {
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
    reviews.forEach(member => {
      let values = [
        member.assetId,
        member.ruleId,
        dbUtils.REVIEW_RESULT_API[member.result],
        member.resultComment,
        member.autoResult? 1 : 0,
        member.action ? dbUtils.REVIEW_ACTION_API[member.action] : null,
        member.actionComment || null,
        member.status ? dbUtils.REVIEW_STATUS_API[member.status] : 0,
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
exports.patchReview = async function(projection, assetId, ruleId, body, userObject) {
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
    let rows = await this.queryReviews(projection, {
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
      await connection.close()
    }
  }
}


/**
 * Merge updates to a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * body AssetAssign 
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.updateReview = async function(reviewId, body, projection, userObject) {
  try {
    let rows = await _this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

