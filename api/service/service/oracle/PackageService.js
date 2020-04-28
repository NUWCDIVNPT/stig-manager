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
    columns.push(`'[' || strdagg_param(param_array(
      CASE WHEN cr.stigId IS NOT NULL THEN json_object(
      KEY 'benchmarkId' VALUE cr.stigId, 
      KEY 'lastRevisionStr' VALUE 'V'||cr.version||'R'||cr.release,
      KEY 'lastRevisionDate' VALUE cr.benchmarkDateSql,
      KEY 'title' VALUE st.title ABSENT ON NULL) END, ',')) || ']' as "stigs"`)
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

exports.addOrUpdatePackage = async function(writeAction, packageId, body, projection, userObject) {
  // CREATE: packageId will be null
  // REPLACE/UPDATE: packageId is not null
  let connectVar // available to try, catch, and finally blocks
  try {
    // Extract or initialize non-scalar properties to separate variables
    let { assetIds, ...packageFields } = body
    assetIds = assetIds ? assetIds : []
    
    // Convert boolean scalar values to database values (true=1 or false=0)
    if ('reqRar' in packageFields) {
      packageFields.reqRar = packageFields.reqRar ? 1 : 0
    }
  
    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    connectVar = connection // make available to catch and finally blocks

    // Process scalar properties
    let binds = {}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      let defaults = {
        name: null,
        emassId: null,
        pocName: null,
        pocEmail: null,
        pocPhone: null,
        reqRar: 0
      }
      binds = { ...defaults, ...packageFields }
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE) {
      binds = { ...packageFields}
    }
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into packages
      let sqlInsert =
      `INSERT INTO
          stigman.packages
          (name, emassId, pocName, pocEmail, pocPhone, reqRar)
        VALUES
          (:name, :emassId, :pocName, :pocEmail, :pocPhone, :reqRar)
        RETURNING
          packageId into :packageId`
      binds.packageId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      packageId = result.outBinds.packageId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into packages
        let sqlUpdate =
        `UPDATE
            stigman.packages
          SET
            ${dbUtils.objectBindObject(packageFields, binds)}
          WHERE
            packageId = :packageId`
        binds.packageId = packageId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process assetIds
    if (writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      // DELETE from asset_package_map
      let sqlDeleteAssets = 'DELETE FROM stigman.asset_package_map where packageId = :packageId'
      await connection.execute(sqlDeleteAssets, [packageId])
    }
    if (assetIds.length > 0) {
      let sqlInsertAssets = `
        INSERT /*+ ignore_row_on_dupkey_index(asset_package_map(packageId, assetId)) */ INTO 
          stigman.asset_package_map (packageId,assetId)
        VALUES (:packageId, :assetId)`      
      let binds = assetIds.map(i => [packageId, i])
      // INSERT into asset_package_map
      await connection.executeMany(sqlInsertAssets, binds)
    }

    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    await connectVar.rollback()
    throw err
  }
  finally {
    if (typeof connectVar !== 'undefined') {
      await connectVar.close()
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
    let row = await this.addOrUpdatePackage(dbUtils.WRITE_ACTION.CREATE, null, body, projection, userObject)
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
exports.deletePackage = async function(packageId, projection, elevate, userObject) {
  try {
    let row = await this.queryPackages(projection, { packageId: packageId }, elevate, userObject)
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
 * Return the Checklist for the supplied Package and STIG 
 *
 * packageId Integer A path parameter that indentifies a Package
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns PackageChecklist
 **/
exports.getChecklistByPackageStig = async function (packageId, benchmarkId, revisionStr, userObject ) {
  try {
    // Commond binds
    let binds = {
      packageId: packageId,
      benchmarkId: benchmarkId
    }

    // Non-current revision
    if (revisionStr !== 'latest') {
      joins.splice(0, 1, 'stigs.revisions rev')
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
      binds.version = results[1]
      binds.release = results[2]
      let revId =  `${benchmarkId}-${results[1]}-${results[2]}`
    }

    // Non-staff access control
    let userAccessControlPredicate = ''
    if (userObject.role == "IAO") {
      userAccessControlPredicate = 'and ap.assetId in (select assetId from stigman.assets where dept=:dept)'
      binds.dept = userObject.dept
    } 
    else if (userObject.role != "Staff") { // CSWF
      userAccessControlPredicate = `and ap.assetId in (
        select
            sa.assetId
        from
            stigman.user_stig_asset_map usa 
            left join stigman.stig_asset_map sa on usa.saId=sa.saId
        where
            usa.userId=:userId)`
      binds.userId = userObject.id
    }
  
    let sql = `
      select
        r.ruleId as "ruleId"
        ,r.ruleTitle as "ruleTitle"
        ,r.groupId as "groupId"
        ,r.groupTitle as "groupTitle"
        ,r.severity as "severity"
        ,r.checkType as "checkType"
        ,sum(CASE WHEN r.stateId = 4 THEN 1 ELSE 0 END) as "oCnt"
        ,sum(CASE WHEN r.stateId = 3 THEN 1 ELSE 0 END) as "nfCnt"
        ,sum(CASE WHEN r.stateId = 2 THEN 1 ELSE 0 END) as "naCnt"
        ,sum(CASE WHEN r.stateId is null THEN 1 ELSE 0 END) as "nrCnt"
        ,sum(CASE WHEN r.statusId = 3 THEN 1 ELSE 0 END) as "approveCnt"
        ,sum(CASE WHEN r.statusId = 2 THEN 1 ELSE 0 END) as "rejectCnt"
        ,sum(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END) as "readyCnt"
      from (
        select
          ap.assetId
          ,rgr.ruleId
          ,rules.title as ruleTitle
          ,rules.severity
          ,rg.groupId
          ,g.title as groupTitle
          ,r.stateId
          ,r.statusId
          ,CASE WHEN ro.ruleId is null
            THEN 'Manual'
            ELSE 'SCAP'
          END	as checkType
        from
          stigman.asset_package_map ap
          left join stigman.stig_asset_map sa on ap.assetId=sa.assetId
          left join stigs.current_revs cr on sa.stigId=cr.stigId
          left join stigs.rev_group_map rg on cr.revId=rg.revId
          left join stigs.groups g on rg.groupId=g.groupId
          left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
          left join stigs.rules rules on rgr.ruleId=rules.ruleId
          left join stigs.rule_oval_map ro on rgr.ruleId=ro.ruleId
          left join stigman.reviews r on (rgr.ruleId=r.ruleId and sa.assetId=r.assetId)
        where
          ap.packageId=:packageId
          and cr.stigId=:benchmarkId
          ${userAccessControlPredicate}
        ) r
      group by
        r.ruleId
        ,r.ruleTitle
        ,r.severity
        ,r.groupId
        ,r.groupTitle
        ,r.checkType
      order by
        DECODE(substr(r.groupId,1,2),'V-',lpad(substr(r.groupId,3),6,'0'),r.groupId) asc
    `
    // Send query
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, binds, options)
    await connection.close()

    return (result.rows)
  }
  catch (e) {
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
 * Replace all properties of a Package
 *
 * body PackageAssign  (optional)
 * packageId Integer A path parameter that indentifies a Package
 * returns PackageInfo
 **/
exports.replacePackage = async function( packageId, body, projection, userObject) {
  try {
    let row = await this.addOrUpdatePackage(dbUtils.WRITE_ACTION.REPLACE, packageId, body, projection, userObject)
    return (row)
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
    let row = await this.addOrUpdatePackage(dbUtils.WRITE_ACTION.UPDATE, packageId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

