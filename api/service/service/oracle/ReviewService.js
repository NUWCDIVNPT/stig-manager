'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for review(s).
**/
exports.queryReviews = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'DISTINCT r.REVIEWID as "reviewId"',
    'r.assetId as "assetId"',
    'asset.name as "assetName"',
    'r.ruleId as "ruleId"',
    'r.stateId as "stateId"',
    'r.stateComment as "stateComment"',
    'r.actionId as "actionId"',
    'r.actionComment as "actionComment"',
    'r.statusId as "statusId"',
    'r.ts as "ts"',
    'r.autoState as "autoState"',
    'r.userId as "userId"',
    'ud.name as "username"',
    'r.rejectText as "rejectText"',
    'r.rejectUserId as "rejectUserId"'
  ]
  let joins = [
    'stigman.reviews r',
    'left join stigman.states state on r.stateId = state.stateId',
    'left join stigman.statuses status on r.statusId = status.statusId',
    'left join stigman.actions action on r.actionId = action.actionId',
    'left join stigman.user_data ud on r.userId = ud.id',
    'left join stigman.assets asset on r.assetId = asset.assetId',
    'left join stigman.asset_package_map ap on asset.assetId = ap.assetId'
  ]

  // // PROJECTIONS
  // if (inProjection && inProjection.includes('assets')) {
  //   columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'assetId' VALUE a.assetId, KEY 'name' VALUE a.name, KEY 'dept' VALUE a.dept ABSENT ON NULL), ',')) || ']' as "assets"`)
  // }
  // if (inProjection && inProjection.includes('stigs')) {
  //   joins.push('left join stigs.current_revs cr on sa.stigId=cr.stigId')
  //   joins.push('left join stigs.stigs st on cr.stigId=st.stigId')
  //   // Issue: API spec says to use lastRevisionStr, not revId
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'benchmarkId' VALUE cr.stigId, 
  //     KEY 'lastRevisionStr' VALUE CASE 
  //       WHEN cr.stigId IS NOT NULL THEN 'V'||cr.version||'R'||cr.release END,
  //     KEY 'lastRevisionDate' VALUE CASE
  //       WHEN cr.stigId IS NOT NULL THEN cr.benchmarkDateSql END,
  //     KEY 'title' VALUE st.title ABSENT ON NULL), ',')) || ']' as "stigs"`)
  // }

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
      'left join stigman.asset_package_map ap on ap.assetId = sa.assetId',
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
    if (inPredicates.packageId) {
      aclPredicates.push('ap.packageId = :packageId')
      predicates.binds.packageId = inPredicates.packageId
      // Delete property so it is not processed by later code
      delete inPredicates.packageId
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
  sql += ' order by r.reviewId'
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // // Post-process each row, unfortunately.
    // // * Oracle doesn't have a BOOLEAN data type, so we must cast the column 'reqRar'
    // // * Oracle doesn't support a JSON type, so we parse string values from 'assets' and 'stigs' into objects
    // for (let x = 0, l = result.rows.length; x < l; x++) {
    //   let record = result.rows[x]
    //   // Handle 'reqRar'
    //   record.reqRar = record.reqRar == 1 ? true : false
    //   // Handle 'assests'
    //   if (record.assets) {
    //     // Check for "empty" arrays 
    //     record.assets = record.assets == '[{}]' ? [] : JSON.parse(record.assets)
    //     // Sort by asset name
    //     record.assets.sort((a,b) => {
    //       let c = 0
    //       if (a.name > b.name) { c= 1 }
    //       if (a.name < b.name) { c = -1 }
    //       return c
    //     })
    //   }
    //   // Handle 'stigs'
    //   if (record.stigs) {
    //     record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs)
    //     // Sort by benchmarkId
    //     record.stigs.sort((a,b) => {
    //       let c = 0
    //       if (a.benchmarkId > b.benchmarkId) { c = 1 }
    //       if (a.benchmarkId < b.benchmarkId) { c = -1 }
    //       return c
    //     })
    //   }
    // }

    return (result.rows)
  }
  catch (err) {
    throw err
  }
}


/**
 * Create a Review
 *
 * body Review 
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.createReview = async function(body, projection, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
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
 * packageId Integer Selects Reviews mapped to a Package (optional)
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
      actionComment: body.actionComment,
      statusId: body.submit ? 1 : 0,
      autoState: body.autoState? 1 : 0
    }
    values.actionId = body.action ? dbUtils.REVIEW_STATE_ABBR[body.action] : null

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
    if (result.rowsAffected == 0) {
      let sqlInsert = `
        INSERT INTO stigman.reviews
        (assetId, ruleId, stateId, stateComment, actionId, actionComment, statusId, userId)
        VALUES
        (:assetId, :ruleId, :stateId, :stateComment, :actionId, :actionComment, :statusId, :userId)
      `
      result = await connection.execute(sqlInsert, binds, {autoCommit: true})
    }
    await connection.close()
    let rows = await this.queryReviews(projection, {
      assetId: assetId,
      ruleId: ruleId
    }, elevate, userObject)
    return (rows[0])
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
      values.actionId = dbUtils.REVIEW_STATE_ABBR[body.action]
    }
    if (body.actionComment != undefined) {
      values.actionComment = body.actionComment
    }
    if (body.submit != undefined) {
      values.statusId = body.submit ? 1 : 0
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

