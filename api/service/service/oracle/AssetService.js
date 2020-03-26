'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'a.ASSETID as "assetId"',
    'a.NAME as "name"',
    'a.DEPT as "dept"',
    'a.IP as "ip"',
    'a.NONNETWORK as "nonnetwork"',
    'a.SCANEXEMPT as "scanexempt"'
  ]
  let joins = [
    'stigman.assets a',
    'left join stigman.asset_package_map ap on a.assetId=ap.assetId',
    'left join stigman.packages p on ap.packageId=p.packageId',
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
    columns.push(`'[' || strdagg_param(param_array(json_object(
      KEY 'benchmarkId' VALUE cr.stigId, 
      KEY 'lastRevisionStr' VALUE CASE 
        WHEN cr.stigId IS NOT NULL THEN 'V'||cr.version||'R'||cr.release END,
      KEY 'lastRevisionDate' VALUE CASE
        WHEN cr.stigId IS NOT NULL THEN cr.benchmarkDateSql END,
      KEY 'title' VALUE st.title ABSENT ON NULL), ',')) || ']' as "stigs"`)
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
  if (context == dbUtils.CONTEXT_DEPT) {
    predicates.statements.push('a.dept = :dept')
    predicates.binds.push( userObject.dept )
  } 
  else if (context == dbUtils.CONTEXT_USER) {
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
  sql += ' group by a.assetId, a.name, a.dept, a.ip, a.nonnetwork, a.scanexempt'
  sql += ' order by a.name'
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast columns 'nonnetwork' and 'scanexempt'
    // * Oracle doesn't support a JSON type, so we parse string values from 'packages' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      // Handle booleans
      record.nonnetwork = record.nonnetwork == 1 ? true : false
      record.scanexempt = record.scanexempt == 1 ? true : false
      // Handle packages
      if (record.packages) {
       // Check for "empty" arrays 
        record.packages = record.packages == '[{}]' ? [] : JSON.parse(record.packages)
        // Sort by package name
        record.packages.sort((a,b) => {
          let c = 0
          if (a.name > b.name) { c= 1 }
          if (a.name < b.name) { c = -1 }
          return c
        })
      }
      // Handle stigs 
      if (record.stigs) {
        record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs)
        // Sort by benchmarkId
        record.stigs.sort((a,b) => {
          let c = 0
          if (a.benchmarkId > b.benchmarkId) { c = 1 }
          if (a.benchmarkId < b.benchmarkId) { c = -1 }
          return c
        })
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdateAsset = async function (assetId, body, projection, userObject) {
  // ADD: assetId will be null
  // UPDATE: assetId is not null

  // Assign assetFields as body without benchmarkIds or packageIds
  const { benchmarkIds, packageIds, ...assetFields } = body

  // Pre-process booleans
  if (assetFields.hasOwnProperty('nonnetwork')) {
    assetFields.nonnetwork = assetFields.nonnetwork ? 1 : 0
  }
  if (assetFields.hasOwnProperty('scanexempt')) {
    assetFields.scanexempt = assetFields.scanexempt ? 1 : 0
  }

  let connection
  try {
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()
    // Add or update asset
    if (Object.keys(assetFields).length > 0 ) {
        if (assetId) {
          // Update an existing asset
          let binds = []
          let sqlUpdate =
          `UPDATE
              stigman.assets
            SET
              ${dbUtils.objectBind(assetFields, binds)}
            WHERE
              assetId = :assetId`
          binds.push(assetId)
          await connection.execute(sqlUpdate, binds, options)
        } else {
          // Insert an asset
          let sqlInsert =
          `INSERT INTO
              stigman.assets
              (name, ip, dept, nonnetwork, scanexempt)
            VALUES
              (:name, :ip, :dept, :nonnetwork, :scanexempt)
            RETURNING
              assetId into :assetId`
          let binds = [
            assetFields.name,
            assetFields.ip,
            assetFields.dept,
            assetFields.nonnetwork,
            assetFields.scanexempt,
            { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
          ]
          let result = await connection.execute(sqlInsert, binds, options)
          assetId = result.outBinds[0][0]
        }           
    }
    // Does body contain a list of packageIds?
    if (packageIds) {
      let sqlDeletePackages = 'DELETE FROM stigman.asset_package_map where assetId = :assetId'
      let sqlInsertPackages = `
        INSERT INTO 
          stigman.asset_package_map (packageId,assetId)
        VALUES (:packageId, :assetId)`
      await connection.execute(sqlDeletePackages, [assetId])
      if (packageIds.length > 0) {
        let binds = packageIds.map(i => [i, assetId])
        await connection.executeMany(sqlInsertPackages, binds)
      }
    }
    // Does body contain a list of benchmarkIds?
    if (benchmarkIds) {
      let sqlDeleteBenchmarks = 'DELETE FROM stigman.stig_asset_map where assetId = :assetId'
      let sqlInsertBenchmarks = `
        INSERT INTO 
          stigman.stig_asset_map (stigId,assetId)
        VALUES (:benchmarkId, :assetId)`
      await connection.execute(sqlDeleteBenchmarks, [assetId])
      if (benchmarkIds.length > 0) {
        let binds = benchmarkIds.map(i => [i, assetId])
        await connection.executeMany(sqlInsertBenchmarks, binds)
      }
  }
await connection.commit()
  }
  catch (err) {
    throw err
  }
  finally {
    if (connection) {
      await connection.close()
    }
  }

  try {
    let row = await this.getAsset(assetId, projection, true, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}

/**
 * Create an Asset
 *
 * body Asset  (optional)
 * returns Asset
 **/
exports.createAsset = async function(body, projection, userObject) {
  try {
    let row = await this.addOrUpdateAsset(null, body, projection, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns Asset
 **/
exports.deleteAsset = async function(assetId) {
  try {
    let sqlDelete = `DELETE FROM stigman.assets where assetId = :assetId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [assetId], options)
    await connection.close()
    return
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
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
exports.updateAsset = async function( assetId, body, projection, userObject ) {
  try {
    let row = await this.addOrUpdateAsset(assetId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}