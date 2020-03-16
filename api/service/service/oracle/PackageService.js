'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for package(s).
**/
exports.queryPackages = async function (inProjection, inPredicates, elevate, userObject) {
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

exports.addOrUpdatePackage = async function(packageId, body, projection, userObject) {
  // ADD: packageId will be null
  // UPDATE: packageId is not null

  // Assign packageFields as body without assets
  const { assetIds, ...packageFields } = body
  let connection
  try {
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()
    // Does the body contain any fields from contact.contact?
    if (Object.keys(packageFields).length > 0 ) {
        if (packageId) {
          // Update an existing package
          let binds = []
          let sqlUpdate =
          `UPDATE
              stigman.packages
            SET
              ${dbUtils.objectBind(packageFields, binds)}
            WHERE
              packageId = :packageId`
          binds.push(packageId)
          await connection.execute(sqlUpdate, binds, options)
        } else {
          let sqlInsert =
          `INSERT INTO
              stigman.packages
              (name, emassId, pocName, pocEmail, pocPhone, reqRar, macClId)
            VALUES
              (:name, :emassId, :pocName, :pocEmail, :pocPhone, :reqRar, 5)
            RETURNING
              packageId into :packageId`
          let binds = [
            packageFields.name,
            packageFields.emassId,
            packageFields.pocName,
            packageFields.pocEmail,
            packageFields.pocPhone,
            packageFields.reqRar ? 1 : 0,
            { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
          ]
          let result = await connection.execute(sqlInsert, binds, options)
          packageId = result.outBinds[0][0]
        }           
    }
    // Does body contain a list of assetIds?
    if (body.assetIds) { // try just "assetIds"
        let sqlDeleteAssets = 'DELETE FROM stigman.asset_package_map where packageId = :packageId'
        let sqlInsertAssets = `
          INSERT INTO 
            stigman.asset_package_map (packageId,assetId)
          VALUES (:packageId, :assetId)`
        let resultDelete = await connection.execute(sqlDeleteAssets, [packageId])
        if (body.assetIds.length > 0) {
          let binds = body.assetIds.map(i => [packageId, i])
          await connection.executeMany(sqlInsertAssets, binds)
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
    let row = await this.getPackage(packageId, projection, true, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

/**
 * Create a Package
 *
 * body PackageAssign  (optional)
 * returns List
 **/
exports.createPackage = async function(body, projection, userObject) {
  try {
    let row = await this.addOrUpdatePackage(null, body, projection, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete a Package
 *
 * packageId Integer A path parameter that indentifies a Package
 * returns PackageInfo
 **/
exports.deletePackage = async function(packageId, projection, userObject) {
  try {
    let row = await this.queryPackages(projection, {packageId: packageId}, true, userObject)
    let sqlDelete = `DELETE FROM stigman.packages where packageId = :packageId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [packageId], options)
    await connection.close()
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a Package
 *
 * packageId Integer A path parameter that indentifies a Package
 * returns PackageInfo
 **/
exports.getPackage = async function(packageId, projection, elevate, userObject) {
  try {
    let rows = await this.queryPackages(projection, {
      packageId: packageId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Packages accessible to the user
 *
 * returns List
 **/
exports.getPackages = async function(projection, elevate, userObject) {
  try {
    let rows = await this.queryPackages(projection, {}, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Merge updates to a Package
 *
 * body PackageAssign  (optional)
 * packageId Integer A path parameter that indentifies a Package
 * returns PackageInfo
 **/
exports.updatePackage = async function( packageId, body, projection, userObject) {
  try {
    let row = await this.addOrUpdatePackage(packageId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

