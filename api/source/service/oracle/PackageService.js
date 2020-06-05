'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')



/**
Generalized queries for package(s).
**/
exports.queryPackages = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if ( userObject.accessLevel === 3 || elevate ) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.accessLevel === 2) {
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
    'package p',
    'left join asset a on p.packageId = a.packageId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join department d on a.deptId = d.deptId'
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('assets')) {
    columns.push(`'[' || 
      listagg ( distinct (
        CASE WHEN a.assetId IS NOT NULL THEN
          json_object(
            KEY 'assetId' VALUE a.assetId, 
            KEY 'name' VALUE a.name, 
            KEY 'dept' VALUE json_object (
              KEY 'deptId' VALUE d.deptId,
              KEY 'name' VALUE d.name) ABSENT ON NULL
          )
        END ), ','
      ) within group (order by a.name)
      || ']' as "assets"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
    joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
    joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
    columns.push(`'[' || 
      listagg ( distinct (
        CASE WHEN cr.benchmarkId IS NOT NULL THEN 
          json_object(
            KEY 'benchmarkId' VALUE cr.benchmarkId, 
            KEY 'lastRevisionStr' VALUE 'V'||cr.version||'R'||cr.release,
            KEY 'lastRevisionDate' VALUE cr.benchmarkDateSql,
            KEY 'title' VALUE st.title ABSENT ON NULL
          ) 
        END ), ','
      ) within group (order by cr.benchmarkId)
      || ']' as "stigs"`)
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
    predicates.statements.push('a.deptId = :deptId')
    predicates.binds.push( userObject.dept.deptId )
  } 
  else if (context == dbUtils.CONTEXT_USER) {
    joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
    predicates.statements.push('usa.userId = :userId')
    predicates.binds.push( userObject.userId )

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
      if (inProjection && inProjection.includes('assets')) {
        // Check for "empty" arrays 
        record.assets = record.assets == '[{}]' ? [] : JSON.parse(record.assets) || []
      }
      // Handle 'stigs'
      if (inProjection && inProjection.includes('stigs')) {
        record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs) || []
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdatePackage = async function(writeAction, packageId, packageFields, projection, userObject) {
  // CREATE: packageId will be null
  // REPLACE/UPDATE: packageId is not null
  let connection // available to try, catch, and finally blocks
  try {
    
    // Convert boolean scalar values to database values (true=1 or false=0)
    if ('reqRar' in packageFields) {
      packageFields.reqRar = packageFields.reqRar ? 1 : 0
    }
  
    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()

    // Process scalar properties
    let binds = { ...packageFields}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into packages
      let sqlInsert =
      `INSERT INTO
          package
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
            package
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

    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    await connection.rollback()
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
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
    let sqlDelete = `DELETE FROM package where packageId = :packageId`
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
  let connection
  try {
    let joins = [
      'asset a',
      'left join stig_asset_map sa on a.assetId=sa.assetId',
      'left join current_rev rev on sa.benchmarkId=rev.benchmarkId',
      'left join rev_group_map rg on rev.revId=rg.revId',
      'left join groups g on rg.groupId=g.groupId',
      'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join rule on rgr.ruleId=rule.ruleId',
      'left join (select distinct ruleId from rule_oval_map) scap on rgr.ruleId=scap.ruleId',
      'left join review r on (rgr.ruleId=r.ruleId and sa.assetId=r.assetId)'
    ]

    let predicates = {
      statements: [
        'a.packageId = :packageId',
        'rev.benchmarkId = :benchmarkId'
      ],
      binds: {
        packageId: packageId,
        benchmarkId: benchmarkId
      }
    }

    // Non-current revision
    if (revisionStr !== 'latest') {
      joins.splice(2, 1, 'left join revision rev on sa.benchmarkId=rev.benchmarkId')
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      predicates.statements.push('rev.version = :version')
      predicates.statements.push('rev.release = :release')
      predicates.binds.version = results[1]
      predicates.binds.release = results[2]
    }

    // Non-staff access control
    if (userObject.accessLevel === 2) {
      predicates.statements.push('a.assetId in (select assetId from asset where dept=:dept)')
      predicates.binds.dept = userObject.dept.deptId
    } 
    else if (userObject.accessLevel === 1) {
      predicates.statements.push(`a.assetId in (
        select
            sa.assetId
        from
            user_stig_asset_map usa 
            left join stig_asset_map sa on usa.saId=sa.saId
        where
            usa.userId=:userId)`)
      predicates.binds.userId = userObject.userId
    }
  
    let sql = `
      select
        r.ruleId as "ruleId"
        ,r.ruleTitle as "ruleTitle"
        ,r.groupId as "groupId"
        ,r.groupTitle as "groupTitle"
        ,r.severity as "severity"
        ,r.checkType as "checkType"
        ,sum(CASE WHEN r.resultId = 4 THEN 1 ELSE 0 END) as "oCnt"
        ,sum(CASE WHEN r.resultId = 3 THEN 1 ELSE 0 END) as "nfCnt"
        ,sum(CASE WHEN r.resultId = 2 THEN 1 ELSE 0 END) as "naCnt"
        ,sum(CASE WHEN r.resultId is null THEN 1 ELSE 0 END) as "nrCnt"
        ,sum(CASE WHEN r.statusId = 3 THEN 1 ELSE 0 END) as "approveCnt"
        ,sum(CASE WHEN r.statusId = 2 THEN 1 ELSE 0 END) as "rejectCnt"
        ,sum(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END) as "readyCnt"
      from (
        select
          a.assetId
          ,rgr.ruleId
          ,rule.title as ruleTitle
          ,rule.severity
          ,rg.groupId
          ,g.title as groupTitle
          ,r.resultId
          ,r.statusId
          ,CASE WHEN scap.ruleId is null THEN 0 ELSE 1 END as "autoCheckAvailable"
        from
          ${joins.join('\n')}
        where
          ${predicates.statements.join(' and ')}
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
    connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    for (const row of result.rows) {
      row.autoCheckAvailable = row.autoCheckAvailable === 1 ? true : false
    }

    return (result.rows.length > 0 ? result.rows : null)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
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

