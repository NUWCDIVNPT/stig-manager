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
    'p.PACKAGEID as "packageId"',
    'p.NAME as "packageName"',
    'p.EMASSID as "emassId"',
    'p.POCNAME as "pocName"',
    'p.POCEMAIL as "pocEmail"',
    'p.POCPHONE as "pocPhone"',
    'p.REQRAR as "reqRar"'
  ]
  let joins = [
    'stigman.packages p',
    'left join stigman.asset_package_map ap on p.packageId=ap.packageId',
    'left join stigman.assets a on ap.assetId = a.assetId',
    'left join stigman.stig_asset_map sa on a.assetId = sa.assetId'
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('assets')) {
    columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'assetId' VALUE a.assetId, KEY 'assetName' VALUE a.name ABSENT ON NULL), ',')) || ']' as "assets"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
      columns.push(`'[' || strdagg_param(param_array('"' || sa.stigId || '"', ',')) || ']' as "stigs"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.packageId) {
    predicates.statements.push('p.packageId = :packageId')
    predicates.binds.push( inPredicates.packageId )
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
  sql += ' group by p.packageId, p.name, p.emassid, p.pocname, p.pocemail, p.pocphone, p.reqrar'
  
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
      if (inProjection && inProjection.includes('assets'))
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
exports.getAsset = function(assetId) {
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


/**
 * Return a list of Assets accessible to the user
 *
 * packageId Integer Selects Assets mapped to a Package (optional)
 * dept String Selects Assets exactly matching a department string (optional)
 * returns List
 **/
exports.getAssets = function(packageId,dept) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
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

