'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const parsers = require('../../utils/parsers.js')
const dbUtils = require('./utils')
const {promises: fs} = require('fs')


/**
Generalized queries for review(s).
**/
exports.queryReviews = async function (inProjection = [], inPredicates = {}, elevate, userObject) {
  let connection
  try {
    let context
    if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.role == "IAO") {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'r.REVIEWID as "reviewId"',
      'r.assetId as "assetId"',
      'asset.name as "assetName"',
      'r.ruleId as "ruleId"',
      'state.abbr as "state"',
      'r.stateId as "stateId"',
      'r.stateComment as "stateComment"',
      'r.actionId as "actionId"',
      'action.action as "action"',
      'r.actionComment as "actionComment"',
      'r.statusId as "statusId"',
      'status.statusStr as "status"',
      'r.ts as "ts"',
      'r.autoState as "autoState"',
      'r.userId as "userId"',
      'ud.name as "username"',
      'r.rejectText as "rejectText"',
      'r.rejectUserId as "rejectUserId"',
      `CASE
        WHEN r.ruleId is null
        THEN 0
        ELSE
          CASE WHEN r.stateId != 4
          THEN
            CASE WHEN r.stateComment != ' ' and r.stateComment is not null
              THEN 1
              ELSE 0 END
          ELSE
            CASE WHEN r.actionId is not null and r.actionComment is not null and r.actionComment != ' '
              THEN 1
              ELSE 0 END
          END
      END as "done"`
    ]
    let groupBy = [
      'r.reviewId',
      'r.assetId',
      'asset.name',
      'r.ruleId',
      'state.abbr',
      'r.stateId',
      'r.stateComment',
      'r.actionId',
      'action.action',
      'r.actionComment',
      'r.statusId',
      'status.statusStr',
      'r.ts',
      'r.autoState',
      'r.userId',
      'ud.name',
      'r.rejectText',
      'r.rejectUserId'
    ]
    let joins = [
      'stigman.reviews r',
      'left join stigman.states state on r.stateId = state.stateId',
      'left join stigman.statuses status on r.statusId = status.statusId',
      'left join stigman.actions action on r.actionId = action.actionId',
      'left join stigman.user_data ud on r.userId = ud.id',
      'left join stigman.assets asset on r.assetId = asset.assetId',
      'left join stigman.asset_collection_map ap on asset.assetId = ap.assetId'
    ]

    // PROJECTIONS
    if (inProjection.includes('collections')) {
      columns.push(`(select json_arrayagg(json_object(
        KEY 'collectionId' VALUE p.collectionId,
        KEY 'name' VALUE  p.name))
        from stigman.asset_collection_map ap 
        left join stigman.collections p on ap.collectionId = p.collectionId
        where ap.assetId = r.assetId) as "collections"`)
    }
    if (inProjection.includes('stigs')) {
      columns.push(`(select json_arrayagg(json_object(
        KEY 'benchmarkId' VALUE rev.stigId,
        KEY 'revisionStr' VALUE  'V'||rev.version||'R'||rev.release))
        from stigs.rev_group_rule_map rgr 
        left join stigs.rev_group_map rg on rgr.rgId = rg.rgId
        left join stigs.revisions rev on rg.revId = rev.revId
        where rgr.ruleId = r.ruleId) as "stigs"`)
    }
    if (inProjection.includes('rule')) {
      columns.push(`(select
        json_object(
        KEY 'ruleId' VALUE rule.ruleId
        ,KEY 'ruleTitle' VALUE rule.title
        ,KEY 'group' VALUE g.groupId
        ,KEY 'groupTitle' VALUE g.title
        ,KEY 'severity' VALUE rule.severity)
        from
        stigs.rules rule
        left join stigs.rev_group_rule_map rgr on rgr.ruleId=rule.ruleId
        inner join stigs.rev_group_map rg on rgr.rgId=rg.rgId
        inner join stigs.groups g on rg.groupId=g.groupId
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
          KEY 'username' VALUE ud.name
        )
      order by rh.ts desc, rh.columnName returning VARCHAR2(32000))
      FROM
        reviews_history rh
        left join user_data ud on ud.id=rh.userId
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
      predicates.binds.context_user = userObject.id

      // item 2 handles the common case where revisionStr is 'latest'
      // Will replace aclJoins[2] for other revisionStr values
      let aclJoins = [
        'stigman.user_stig_asset_map usa',
        'inner join stigman.stig_asset_map sa on sa.said = usa.said',
        'left join stigman.asset_collection_map ap on ap.assetId = sa.assetId',
        'inner join stigs.current_revs rev on rev.stigId = sa.stigId',
        'inner join stigs.rev_group_map rg on rev.revId = rg.revId',
        'inner join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId'
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
      if (inPredicates.collectionId) {
        aclPredicates.push('ap.collectionId = :collectionId')
        predicates.binds.collectionId = inPredicates.collectionId
        // Delete property so it is not processed by later code
        delete inPredicates.collectionId
      }
      // If predicates include benchmarkId and revisionStr (which must occur together)
      if (inPredicates.benchmarkId) {
        aclPredicates.push('sa.stigId = :benchmarkId')
        predicates.binds.benchmarkId = inPredicates.benchmarkId
        // Delete property so it is not processed by later code
        delete inPredicates.benchmarkId
      }
      if (inPredicates.revisionStr && inPredicates.revisionStr !== 'latest') {
        // Join to revisions so we can specify a revId
        aclJoins[2] = 'inner join stigs.revisions rev on rev.stigId = sa.stigId'
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
      joins.splice(0, 1, `(${aclSubquery}) acl`, 'inner join stigman.reviews r on (acl.assetId = r.assetId AND acl.ruleId = r.ruleId)')
      //joins.push(`inner join (${aclSubquery}) acl on (acl.assetId = r.assetId AND acl.ruleId = r.ruleId)`)
    }
    // CONTEXT_DEPT
    else if (context === dbUtils.CONTEXT_DEPT) {
      predicates.statements.push('asset.dept = :dept')
      predicates.binds.dept = userObject.dept
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
    if (inPredicates.state) {
      predicates.statements.push('state.abbr = :stateAbbr')
      predicates.binds.stateAbbr = inPredicates.state
    }
    if (inPredicates.status) {
      predicates.statements.push('status.statusStr = :statusStr')
      predicates.binds.statusStr = inPredicates.status
    }
    if (inPredicates.action) {
      predicates.statements.push('action.action = :action')
      predicates.binds.action = inPredicates.action
    }
    if (inPredicates.collectionId) {
      predicates.statements.push('ap.collectionId = :collectionId')
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
            stigs.revisions rev
            left join stigs.rev_group_map rg on rev.revId = rg.revId
            left join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId
            left join stigs.rules r2 on rgr.ruleId = r2.ruleId
          WHERE
            rev.stigId = :benchmarkId
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
            stigs.current_revs rev
            left join stigs.rev_group_map rg on rev.revId = rg.revId
            left join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId
            left join stigs.rules r2 on rgr.ruleId = r2.ruleId
          WHERE
            rev.stigId = :benchmarkId      
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
    // * Oracle doesn't have a BOOLEAN data type, so we must cast the columns 'done' and 'autoState'
    // * Oracle doesn't support a JSON type, so we parse string values from 'collections' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      record.done = record.done == 1 ? true : false
      record.autoState = record.autoState == 1 ? true : false
      if (inProjection.includes('collections')) {
         record.collections = record.collections == '[{}]' ? [] : JSON.parse(record.collections)
       }
      if (inProjection.includes('stigs')) {
         record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs)
       }
      if (inProjection.includes('ruleInfo')) {
        record.ruleInfo = JSON.parse(record.ruleInfo)
      }
      if (inProjection.includes('history')) {
        record.history = JSON.parse(record.history)
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
exports.importReviews = async function(body, elevate, file, userObject, response) {
  try {
    // let jobId = await dbUtils.insertJobRecord({
    //   userId: userObject.id,
    //   assetId: body.assetId,
    //   benchmarkId: body.benchmarkId,
    //   collectionId: body.collectionId,
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
    return (this.putReviews(result.reviews, elevate, userObject))
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
 * Return a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * returns AssetProjected
 **/
exports.getReview = async function(reviewId, projection, elevate, userObject) {
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
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * state ReviewState  (optional)
 * action ReviewAction  (optional)
 * status ReviewStatus  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * benchmarkId String Selects Reviews mapped to a STIG (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * collectionId Integer Selects Reviews mapped to a Collection (optional)
 * returns List
 **/
exports.getReviews = async function(projection, predicates, elevate, userObject) {
  try {
    let rows = await this.queryReviews(projection, predicates, elevate, userObject)
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
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReview = async function(projection, assetId, ruleId, body, elevate, userObject) {
  try {
    let values = {
      userId: userObject.id,
      stateId: dbUtils.REVIEW_STATE_ABBR[body.state].id,
      stateComment: body.stateComment,
      actionId: body.action ? dbUtils.REVIEW_ACTION_STR[body.action] : null,
      actionComment: body.actionComment || null,
      statusId: body.status ? dbUtils.REVIEW_STATUS_STR[body.status] : null,
      autoState: body.autoState? 1 : 0
    }

    let binds = {
      assetId: assetId,
      ruleId: ruleId
    }
    let sqlUpdate = `
      UPDATE
        stigman.reviews
      SET
        ${dbUtils.objectBindObject(values, binds)}
      WHERE
        assetId = :assetId and ruleId = :ruleId`
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sqlUpdate, binds, {autoCommit: true})
    let status = 'created'
    if (result.rowsAffected == 0) {
      let sqlInsert = `
        INSERT INTO stigman.reviews
        (assetId, ruleId, stateId, stateComment, actionId, actionComment, statusId, userId, autoState)
        VALUES
        (:assetId, :ruleId, :stateId, :stateComment, :actionId, :actionComment, :statusId, :userId, :autoState)
      `
      result = await connection.execute(sqlInsert, binds, {autoCommit: true})
      status = 'updated'
    }
    await connection.close()
    let rows = await this.queryReviews(projection, {
      assetId: assetId,
      ruleId: ruleId
    }, elevate, userObject)
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
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReviews = async function( body, elevate, userObject) {
  try {
    let sqlMerge = `
    MERGE INTO stigman.reviews r USING (
      SELECT 
        :assetId as ASSETID,
        :ruleId as RULEID,
        :stateId as STATEID,
        :stateComment as STATECOMMENT,
        :autoState AS AUTOSTATE,
        :actionId as ACTIONID,
        :actionComment AS ACTIONCOMMENT,
        :statusId AS STATUSID,
        :userId AS USERID
      FROM DUAL) i
      ON (r.assetId = i.assetId AND r.ruleId = i.ruleId)
      WHEN MATCHED THEN
        UPDATE SET
          r.STATEID = i.STATEID,
          r.STATECOMMENT = i.STATECOMMENT,
          r.AUTOSTATE = i.AUTOSTATE,
          r.ACTIONID = i.ACTIONID,
          r.ACTIONCOMMENT = i.ACTIONCOMMENT,
          r.STATUSID = i.STATUSID,
          r.USERID = i.USERID
      WHEN NOT MATCHED THEN
      INSERT (r.assetId, r.ruleId, r.stateId, r.stateComment, r.autoState, r.actionId, r.actionComment, r.statusId, r.userId)
      VALUES (i.assetId, i.ruleId, i.stateId, i.stateComment, i.autoState, i.actionId, i.actionComment, i.statusId, i.userId)
    `
    let binds = []
    let reviewsByStatus = await dbUtils.scrubReviewsByUser(body, elevate, userObject)
    reviewsByStatus.permitted.forEach(member => {
      let values = {
        assetId: member.assetId,
        ruleId: member.ruleId,
        stateId: dbUtils.REVIEW_STATE_ABBR[member.state].id,
        stateComment: member.stateComment,
        autoState: member.autoState? 1 : 0,
        actionId: member.action ? dbUtils.REVIEW_ACTION_STR[member.action] : null,
        actionComment: member.actionComment || null,
        statusId: member.status ? dbUtils.REVIEW_STATUS_STR[member.status] : 0,
        userId: userObject.id
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
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.patchReview = async function(projection, assetId, ruleId, body, elevate, userObject) {
  try {
    let values = {
      userId: userObject.id
    }
    if (body.state != undefined) {
      values.stateId = dbUtils.REVIEW_STATE_ABBR[body.state].id
    }
    if (body.stateComment != undefined) {
      values.stateComment = body.stateComment
    }
    if (body.action != undefined) {
      values.actionId = dbUtils.REVIEW_ACTION_STR[body.action]
    }
    if (body.actionComment != undefined) {
      values.actionComment = body.actionComment
    }
    if (body.status != undefined) {
      values.statusId = dbUtils.REVIEW_STATUS_STR[body.status]
    }
    if (body.autoState != undefined) {
      values.autoState = body.autoState ? 1 : 0
    }

    let binds = {
      assetId: assetId,
      ruleId: ruleId
    }
    let sqlUpdate = `
      UPDATE
        stigman.reviews
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
    }, elevate, userObject)
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

