'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const parsers = require('../../utils/parsers.js')
const dbUtils = require('./utils')
const {promises: fs} = require('fs')
const ROLE = require('../../utils/appRoles')


/**
Generalized queries for review(s).
**/
exports.queryReviews = async function (inProjection = [], inPredicates = {}, userObject) {
  let connection
  try {
    let context
    if (userObject.role.roleId === ROLE.COMMAND ) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.role.roleId === ROLE.DEPT) {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'r.assetId as "assetId"',
      'asset.name as "assetName"',
      'r.ruleId as "ruleId"',
      'result.api as "result"',
      'r.resultComment as "resultComment"',
      'r.autoResult as "autoResult"',
      'action.api as "action"',
      'r.actionComment as "actionComment"',
      'status.api as "status"',
      'r.userId as "userId"',
      'ud.username as "username"',
      'r.ts as "ts"',
      'r.rejectText as "rejectText"',
      'r.rejectUserId as "rejectUserId"',
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
      'left join asset on r.assetId = asset.assetId',
      'left join asset_package_map ap on asset.assetId = ap.assetId'
    ]

    // PROJECTIONS
    if (inProjection.includes('packages')) {
      columns.push(`(select json_arrayagg(json_object(
        KEY 'packageId' VALUE p.packageId,
        KEY 'name' VALUE  p.name))
        from asset_package_map ap 
        left join package p on ap.packageId = p.packageId
        where ap.assetId = r.assetId) as "packages"`)
    }
    if (inProjection.includes('stigs')) {
      columns.push(`(select json_arrayagg(json_object(
        KEY 'benchmarkId' VALUE rev.benchmarkId,
        KEY 'revisionStr' VALUE  'V'||rev.version||'R'||rev.release))
        from rev_group_rule_map rgr 
        left join rev_group_map rg on rgr.rgId = rg.rgId
        left join revision rev on rg.revId = rev.revId
        where rgr.ruleId = r.ruleId) as "stigs"`)
    }
    if (inProjection.includes('ruleInfo')) {
      columns.push(`(select
        json_object(
          KEY 'ruleId' VALUE rule.ruleId
          ,KEY 'ruleTitle' VALUE rule.title
          ,KEY 'group' VALUE g.groupId
          ,KEY 'groupTitle' VALUE g.title
          ,KEY 'severity' VALUE rule.severity)
        from
          rule
          left join rev_group_rule_map rgr on rgr.ruleId=rule.ruleId
          inner join rev_group_map rg on rgr.rgId=rg.rgId
          inner join groups g on rg.groupId=g.groupId
        where
          ROWNUM = 1 and
          rule.ruleId = r.ruleId) as "ruleInfo"`)
    }
    if (inProjection.includes('history')) {
      columns.push(`(select
      json_arrayagg(
        json_object(
          KEY 'ts' VALUE TO_CHAR(rh.ts,'yyyy-mm-dd hh24:mi:ss'),
          KEY 'activityType' VALUE rh.activityType,
          KEY 'columnName' VALUE rh.columnName,
          KEY 'oldValue' VALUE rh.oldValue,
          KEY 'newValue' VALUE rh.newValue,
          KEY 'userId' VALUE rh.userId,
          KEY 'username' VALUE ud.username
        )
      order by rh.ts desc, rh.columnName returning VARCHAR2(32000))
      FROM
        review_history rh
        left join user_data ud on ud.userId=rh.userId
      where
        rh.ruleId = r.ruleId and
        rh.assetId = r.assetId
        -- don't want to handle 'rejectText' yet
        and rh.columnName != 'rejectText') as "history"`)
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
        'left join asset_package_map ap on ap.assetId = sa.assetId',
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
        aclPredicates.push('ap.packageId = :packageId')
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
      predicates.statements.push('ap.packageId = :packageId')
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


    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
  //     await connection.close()

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast the columns 'reviewComplete' and 'autoResult'
    // * Oracle doesn't support a JSON type, so we parse string values from 'packages' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      record.reviewComplete = record.reviewComplete == 1 ? true : false
      record.autoResult = record.autoResult == 1 ? true : false
      if (inProjection.includes('packages')) {
         record.packages = record.packages == '[{}]' ? [] : JSON.parse(record.packages)
       }
      if (inProjection.includes('stigs')) {
         record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs)
       }
      if (inProjection.includes('ruleInfo')) {
        record.ruleInfo = JSON.parse(record.ruleInfo)
      }
      if (inProjection.includes('history')) {
        record.history = JSON.parse(record.history) || []
      }
    }

    return (result.rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }
}


/**
 * Import a Review
 *
 * body Review 
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.importReviews = async function(body, file, userObject) {
  try {
    // let jobId = await dbUtils.insertJobRecord({
    //   userId: userObject.userId,
    //   assetId: body.assetId,
    //   benchmarkId: body.benchmarkId,
    //   packageId: body.packageId,
    //   source: body.source,
    //   filename: file.originalname,
    //   filesize: file.size
    // })
    let assetId = parseInt(body.assetId)
    let extension = file.originalname.substring(file.originalname.lastIndexOf(".")+1)
    let buffer = await fs.readFile(file.path)
    let result
    switch (extension) {
      case 'ckl':
        result = await parsers.reviewsFromCkl(buffer, assetId)
        break
      case 'xml':
        result = parsers.reviewsFromScc(buffer, assetId)
        break
    }
    return (this.putReviews(result.reviews, userObject))
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
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
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Reviews accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * result ReviewState  (optional)
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
    let rows = await this.queryReviews(projection, predicates, userObject)
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
      ruleId: ruleId
    }
    let sqlUpdate = `
      UPDATE
        review
      SET
        ${dbUtils.objectBindObject(values, binds)}
      WHERE
        assetId = :assetId and ruleId = :ruleId`
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sqlUpdate, binds, {autoCommit: true})
    let status = 'created'
    if (result.rowsAffected == 0) {
      let sqlInsert = `
        INSERT INTO review
        (assetId, ruleId, resultId, resultComment, actionId, actionComment, statusId, userId, autoResult)
        VALUES
        (:assetId, :ruleId, :resultId, :resultComment, :actionId, :actionComment, :statusId, :userId, :autoResult)
      `
      result = await connection.execute(sqlInsert, binds, {autoCommit: true})
      status = 'updated'
    }
    await connection.close()
    let rows = await this.queryReviews(projection, {
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
exports.putReviews = async function( body, userObject) {
  try {
    let sqlMerge = `
    MERGE INTO review r USING (
      SELECT 
        :assetId as ASSETID,
        :ruleId as RULEID,
        :resultId as RESULTID,
        :resultComment as RESULTCOMMENT,
        :autoResult AS AUTORESULT,
        :actionId as ACTIONID,
        :actionComment AS ACTIONCOMMENT,
        :statusId AS STATUSID,
        :userId AS USERID
      FROM DUAL) i
      ON (r.assetId = i.assetId AND r.ruleId = i.ruleId)
      WHEN MATCHED THEN
        UPDATE SET
          r.RESULTID = i.RESULTID,
          r.RESULTCOMMENT = i.RESULTCOMMENT,
          r.AUTORESULT = i.AUTORESULT,
          r.ACTIONID = i.ACTIONID,
          r.ACTIONCOMMENT = i.ACTIONCOMMENT,
          r.STATUSID = i.STATUSID,
          r.USERID = i.USERID
      WHEN NOT MATCHED THEN
      INSERT (r.assetId, r.ruleId, r.resultId, r.resultComment, r.autoResult, r.actionId, r.actionComment, r.statusId, r.userId)
      VALUES (i.assetId, i.ruleId, i.resultId, i.resultComment, i.autoResult, i.actionId, i.actionComment, i.statusId, i.userId)
    `
    let binds = []
    let reviewsByStatus = await dbUtils.scrubReviewsByUser(body, false, userObject)
    reviewsByStatus.permitted.forEach(member => {
      let values = {
        assetId: member.assetId,
        ruleId: member.ruleId,
        resultId: dbUtils.REVIEW_RESULT_API[member.result],
        resultComment: member.resultComment,
        autoResult: member.autoResult? 1 : 0,
        actionId: member.action ? dbUtils.REVIEW_ACTION_API[member.action] : null,
        actionComment: member.actionComment || null,
        statusId: member.status ? dbUtils.REVIEW_STATUS_API[member.status] : 0,
        userId: userObject.userId
      }
      binds.push(values)
    })

    let connection = await oracledb.getConnection()
    let result = await connection.executeMany(sqlMerge, binds, {
      autoCommit: true,
      batchErrors: true
    })
    reviewsByStatus.errors = []
    if (result.batchErrors) {
      result.batchErrors.forEach(e => {
        reviewsByStatus.errors.push(binds[e.offset])
      })
      await connection.commit()
    }
    await connection.close()
    return (reviewsByStatus)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
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
      ruleId: ruleId
    }
    let sqlUpdate = `
      UPDATE
        review
      SET
        ${dbUtils.objectBindObject(values, binds)}
      WHERE
        assetId = :assetId and ruleId = :ruleId`
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sqlUpdate, binds, {autoCommit: true})
    await connection.close()
    if (result.rowsAffected == 0) {
      throw (writer.respondWithCode ( 400, {message: "Review must exist to be patched."}))
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
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

