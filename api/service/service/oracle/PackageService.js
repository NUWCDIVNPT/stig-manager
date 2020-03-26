'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for package(s).
**/
exports.queryPackages = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'p.PACKAGEID as "packageId"',
    'p.NAME as "name"',
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
    columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'assetId' VALUE a.assetId, KEY 'name' VALUE a.name, KEY 'dept' VALUE a.dept ABSENT ON NULL), ',')) || ']' as "assets"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
    joins.push('left join stigs.current_revs cr on sa.stigId=cr.stigId')
    joins.push('left join stigs.stigs st on cr.stigId=st.stigId')
    // Issue: API spec says to use lastRevisionStr, not revId
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
  if (inPredicates.packageId) {
    predicates.statements.push('p.packageId = :packageId')
    predicates.binds.push( inPredicates.packageId )
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
  sql += ' group by p.packageId, p.name, p.emassid, p.pocname, p.pocemail, p.pocphone, p.reqrar'
  sql += ' order by p.name'
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast the column 'reqRar'
    // * Oracle doesn't support a JSON type, so we parse string values from 'assets' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      // Handle 'reqRar'
      record.reqRar = record.reqRar == 1 ? true : false
      // Handle 'assests'
      if (record.assets) {
        // Check for "empty" arrays 
        record.assets = record.assets == '[{}]' ? [] : JSON.parse(record.assets)
        // Sort by asset name
        record.assets.sort((a,b) => {
          let c = 0
          if (a.name > b.name) { c= 1 }
          if (a.name < b.name) { c = -1 }
          return c
        })
      }
      // Handle 'stigs'
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

    // result.rows.toJSON = function() {
    //   for (let x = 0, l = this.length; x < l; x++) {
    //     let record = this[x]
    //     record.reqRar = record.reqRar == 1 ? true : false
    //     if (record.assets) {
    //       record.assets = record.assets == '[{}]' ? [] : JSON.parse(record.assets)
    //       record.assets.sort((a,b) => {
    //         let c = 0
    //         if (a.name > b.name) { c= 1}
    //         if (a.name < b.name) { c = -1}
    //         return c
    //       })
    //     }
    //   }
    //   return this
    // }

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
  
  // Pre-process reqRar
  if (packageFields.hasOwnProperty('reqRar')) {
    packageFields.reqRar = packageFields.reqRar ? 1 : 0
  }
  
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
              (name, emassId, pocName, pocEmail, pocPhone, reqRar)
            VALUES
              (:name, :emassId, :pocName, :pocEmail, :pocPhone, :reqRar)
            RETURNING
              packageId into :packageId`
          let binds = [
            packageFields.name,
            packageFields.emassId,
            packageFields.pocName,
            packageFields.pocEmail,
            packageFields.pocPhone,
            packageFields.reqRar,
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

