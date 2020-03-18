'use strict';
const oracledb = require('oracledb')
const utils = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection, inPredicates, elevate, userObject) {
  const STIGMAN_CONTEXT = { // TODO: Move this somewhere else for reuse?
    ALL: 'all',
    DEPT: 'department',
    USER: 'user'
  }
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = STIGMAN_CONTEXT.ALL
  } else if (userObject.role == "IAO") {
    context = STIGMAN_CONTEXT.DEPT
  } else {
    context = STIGMAN_CONTEXT.USER
  }

  let columns = [
    'a.ASSETID as "assetId"',
    'a.NAME as "name"',
    'a.DEPT as "dept"',
    'a.IP as "ip"',
    'a.NONNETWORK as "nonnetwork"',
    'a.SCANEXEMPT as "scanexempt"',
    'a.PROFILE as "profile"'
  ]
  let joins = [
    'stigman.assets a',
    'left join stigman.asset_package_map ap on a.assetId=ap.assetId',
    'left join stigman.packages p on ap.packageId=ap.packageId',
    'left join stigman.stig_asset_map sa on a.assetId = sa.assetId'
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('packages')) {
    // joins.push('left join stigman.asset_package_map ap on a.assetId=ap.assetId')
    // joins.push('left join stigman.packages p on ap.packageId=ap.packageId')
    columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'packageId' VALUE p.packageId, KEY 'name' VALUE p.name ABSENT ON NULL), ',')) || ']' as "packages"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
    joins.push('left join stigs.current_revs cr on sa.stigId=cr.stigId')
    joins.push('left join stigs.stigs st on cr.stigId=st.stigId')
    columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'benchmarkId' VALUE cr.stigId, KEY 'lastRevisionStr' VALUE 'V'||cr.version||'R'||cr.release, KEY 'title' VALUE st.title ABSENT ON NULL), ',')) || ']' as "stigs"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = :assetId')
    predicates.binds.push( inPredicates.assetId )
  }
  if (inPredicates.packageId) {
    predicates.statements.push('ap.packageId = :packageId')
    predicates.binds.push( inPredicates.packageId )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.stigId = :stigId')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  if (inPredicates.dept) {
    predicates.statements.push('a.dept = :dept')
    predicates.binds.push( inPredicates.dept )
  }
  if (context == STIGMAN_CONTEXT.DEPT) {
    predicates.statements.push('a.dept = :dept')
    predicates.binds.push( userObject.dept )
  } 
  else if (context == STIGMAN_CONTEXT.USER) {
    joins.push('left join stigman.user_stig_asset_map usa on sa.saId = usa.saId')
    predicates.statements.push('usa.userId = :userId')
    predicates.binds.push( userObject.id )

  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' group by a.assetId, a.name, a.dept, a.ip, a.nonnetwork, a.scanexempt, a.profile'
  sql += ' order by a.name'
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    //Oracle doesn't support a JSON type, so manually parse strings into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      if (inProjection && inProjection.includes('packages'))
       // Check for "empty" arrays 
        record['assets'] = record['assets'] == '[{}]' ? [] : JSON.parse(result.rows[x]["assets"])
      if (inProjection && inProjection.includes('stigs'))
        record['stigs'] = record['stigs'] == '[""]' ? [] : JSON.parse(result.rows[x]["stigs"])
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}


/**
 * Create an Asset
 *
 * body Asset  (optional)
 * returns Asset
 **/
exports.createAsset = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "scanexempt" : true,
  "assetId" : 0,
  "ip" : "ip",
  "profile" : "MAC-1_Classified",
  "assetName" : "assetName",
  "benchmarkIds" : [ "benchmarkIds", "benchmarkIds" ],
  "dept" : "dept",
  "nonnetwork" : true,
  "packageIds" : [ 6, 6 ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Delete an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns Asset
 **/
exports.deleteAsset = function(assetId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "scanexempt" : true,
  "assetId" : 0,
  "ip" : "ip",
  "profile" : "MAC-1_Classified",
  "assetName" : "assetName",
  "benchmarkIds" : [ "benchmarkIds", "benchmarkIds" ],
  "dept" : "dept",
  "nonnetwork" : true,
  "packageIds" : [ 6, 6 ]
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.getAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      assetId: assetId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Assets accessible to the user
 *
 * packageId Integer Selects Assets mapped to a Package (optional)
 * benchmarkId String Selects Assets mapped to a STIG (optional)
 * dept String Selects Assets exactly matching a department string (optional)
 * returns List
 **/
exports.getAssets = async function(packageId, benchmarkId, dept, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      packageId: packageId,
      benchmarkId: benchmarkId,
      dept: dept
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Merge updates to an Asset
 *
 * body Asset  (optional)
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.updateAsset = function(body,assetId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

