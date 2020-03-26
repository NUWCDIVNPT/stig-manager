'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates ) {
  let columns = [
    's.STIGID as "benchmarkId"',
    's.TITLE as "title"',
    `'V' || cr.version || 'R' || cr.release as "lastRevisionStr"`,
    'cr.benchmarkDateSql as "lastRevisionDate"'
  ]
  let joins = [
    'stigs.stigs s',
    'left join stigs.current_revs cr on s.stigId = cr.stigId'
  ]

  // NO PROJECTIONS DEFINED
  // if (inProjection && inProjection.includes('assets')) {
  //   joins.push('left join stigman.stig_asset_map sa on s.stigId = sa.stigId' )
  //   joins.push('left join stigman.assets a on sa.assetId = a.assetId' )
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'assetId' VALUE a.assetId, 
  //     KEY 'name' VALUE a.name, 
  //     KEY 'dept' VALUE a.dept ABSENT ON NULL
  //     ), ',')) || ']' as "packages"`)
  // }
  // if (inProjection && inProjection.includes('packages')) {
  //   if (! inProjection.includes('assets')) {
  //     // Push dependent table
  //     joins.push('left join stigman.stig_asset_map sa on s.stigId = sa.stigId' )
  //   }
  //   joins.push('left join stigman.asset_package_map ap on sa.assetId = ap.assetId' )
  //   joins.push('left join stigman.packages p on ap.packageId = p.packageId' )
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'packageId' VALUE p.packageId, 
  //     KEY 'name' VALUE p.name ABSENT ON NULL
  //     ), ',')) || ']' as "stigs"`)
  // }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.title) {
    predicates.statements.push("s.title LIKE '%' || :title || '%'")
    predicates.binds.push( inPredicates.title )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('s.stigId = :benchmarkId')
    predicates.binds.push( inPredicates.benchmarkId )
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' order by s.stigId'

  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()
    return (result.rows)
  }
  catch (err) {
    throw err
  }  
}


/**
 * Import a new STIG
 *
 * source File An XCCDF file (optional)
 * returns STIG
 **/
exports.addSTIG = async function(source, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Deletes the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.deleteRevisionByString = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Deletes a STIG (*** and all revisions ***)
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.deleteStigById = async function(benchmarkId, userObject) {
  try {
    let row = await this.queryStigs( {benchmarkId: benchmarkId}, userObject)
    let sqlDelete = `DELETE FROM stigs.stigs where stigId = :benchmarkId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [benchmarkId], options)
    await connection.close()
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return data for the specified CCI
 *
 * cci String A path parameter that indentifies a CCI
 * returns List
 **/
exports.getCci = async function(cci, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of CCIs from a STIG revision
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getCcisByRevision = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the rules, checks and fixes for a Group from a specified revision of a STIG.
 * None
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * groupId String A path parameter that indentifies a Group
 * returns GroupObj
 **/
exports.getGroupByRevision = async function(benchmarkId, revisionStr, groupId, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the list of groups for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getGroupsByRevision = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return metadata for the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.getRevisionByString = async function(benchmarkId, revisionStr, userObject) {
  try {
    let ro = dbUtils.parseRevisionStr(revisionStr)
    let sql = 
    `SELECT
      ${ro.table_alias}.stigId as "benchmarkId",
      'V' || ${ro.table_alias}.version || 'R' || ${ro.table_alias}.release as "revisionStr",
      ${ro.table_alias}.version as "version",
      ${ro.table_alias}.release as "release",
      ${ro.table_alias}.benchmarkDateSql as "benchmarkDate",
      ${ro.table_alias}.status as "status",
      ${ro.table_alias}.statusDate as "statusDate",
      ${ro.table_alias}.description as "description"
    FROM
      ${ro.table}  ${ro.table_alias}
    WHERE
      ${ro.table_alias}.stigId = :benchmarkId
      ${ro.predicates}
    ORDER BY
      ${ro.table_alias}.benchmarkDateSql desc
    `
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let binds = [benchmarkId]
    if (ro.version) {
      binds.push(ro.version, ro.release)
    }
    let result = await connection.execute(sql, binds, options)
    await connection.close()
    return (result.rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of revisions for the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns List
 **/
exports.getRevisionsByBenchmarkId = async function(benchmarkId, userObject) {
  try {
    let sql = 
    `SELECT
      r.stigId as "benchmarkId",
      'V' || r.version || 'R' || r.release as "revisionStr",
      r.version as "version",
      r.release as "release",
      r.benchmarkDateSql as "benchmarkDate",
      r.status as "status",
      r.statusDate as "statusDate",
      r.description as "description"
    FROM
      stigs.revisions r
    WHERE
      r.stigId = :benchmarkId
    ORDER BY
      r.benchmarkDateSql desc
    `
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, [benchmarkId], options)
    await connection.close()
    return (result.rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the defintion and associated checks and fixes for the specified Rule
 *
 * ruleId String A path parameter that indentifies a Rule
 * returns Rule
 **/
exports.getRuleByRuleId = async function(ruleId, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return rule data for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getRulesByRevision = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of available STIGs
 *
 * title String A string found anywhere in a STIG title (optional)
 * returns List
 **/
exports.getSTIGs = async function(title, userObject) {
  try {
    let rows = await this.queryStigs( {
      title: title
    }, userObject )
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return properties of the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.getStigById = async function(benchmarkId, userObject) {
  try {
    let rows = await this.queryStigs( {
      benchmarkId: benchmarkId
    }, userObject )
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

