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
    'r.REVIEWID as "reviewId"',
    'r.assetId as "assetId"',
    'r.ruleId as "ruleId"',
    'state.abbr as "state"',
    'r.stateComment as "stateComment"',
    'r.autoState as "autoState"',
    'action.action as "action"',
    'r.actionComment as "actionComment"',
    'r.reqDoc as "reqDoc"',
    'status.statusStr as "status"',
    'r.userId as "userId"',
    'r.ts as "ts"',
    'r.rejectText as "rejectText"',
    'r.rejectUserId as "rejectUserId"',
  ]
  let joins = [
    'stigman.reviews r',
    'left join stigman.states state on r.stateId = state.stateId',
    'left join stigman.statuses status on r.statusId = status.statusId',
    'left join stigman.actions action on r.actionId = action.actionId'
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
  if (context === dbUtils.CONTEXT_USER) {
    predicates.statements.push('r.userId = :userId')
    predicates.binds.userId = userObject.id
  }
  if (context === dbUtils.CONTEXT_DEPT) {
    joins.push('left join stigman.assets asset on r.assetId=asset.assetId')
    predicates.statements.push('asset.dept = :dept')
    predicates.binds.dept = userObject.dept
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
exports.getReviews = async function(projection, elevate, state, action, status, ruleId, benchmarkId, revisionStr, assetId, packageId, userObject) {
  try {
    let rows = await this.queryReviews(projection, {
      state: state,
      action: action,
      status: status,
      ruleId: ruleId,
      benchmarkId: benchmarkId,
      revisionStr: revisionStr,
      assetId: assetId,
      packageid: packageId
    }, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
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

