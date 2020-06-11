'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

const _this = this

/**
Generalized queries for package(s).
**/
exports.queryPackages = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  try {
    let context
    if (userObject.globalAccess || elevate) {
      context = dbUtils.CONTEXT_ALL
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      'p.packageId',
      'p.name',
      'p.workflow',
      'p.metadata'
    ]
    let joins = [
      'package p',
      'left join package_grant pg on p.packageId = pg.packageId',
      'left join asset a on p.packageId = a.packageId',
      'left join stig_asset_map sa on a.assetId = sa.assetId'
    ]

    // PROJECTIONS
    if (inProjection.includes('assets')) {
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when a.assetId is not null then 
                json_object(
                  'assetId', a.assetId, 
                  'name', a.name
                )
              else null end 
            order by a.name),
            ''),
        ']')
      as json) as "assets"`)
    }
    if (inProjection.includes('stigs')) {
      joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
      joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when cr.benchmarkId is not null then 
                json_object(
                  'benchmarkId', cr.benchmarkId, 
                  'lastRevisionStr', concat('V', cr.version, 'R', cr.release), 
                  'lastRevisionDate', cr.benchmarkDateSql,
                  'title', st.title)
              else null end 
            order by cr.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
    }
    if (inProjection.includes('grants')) {
      columns.push(`(select
      json_arrayagg(
        json_object(
          'user', json_object(
            'userId', user_data.userId,
            'username', user_data.username
            ),
          'accessLevel', accessLevel
        )
      )
      from package_grant left join user_data using (userId) where packageId = p.packageId) as "grants"`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if ( inPredicates.packageId ) {
      predicates.statements.push('p.packageId = ?')
      predicates.binds.push( inPredicates.packageId )
    }
    if ( inPredicates.name ) {
      predicates.statements.push('p.name LIKE ?')
      predicates.binds.push( `%${inPredicates.name}%` )
    }
    if ( inPredicates.workflow ) {
      predicates.statements.push('p.workflow = ?')
      predicates.binds.push( inPredicates.workflow )
    }
    if (context == dbUtils.CONTEXT_USER) {
      joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
      predicates.statements.push('(pg.userId = ? AND CASE WHEN pg.accessLevel = 1 THEN usa.userId = pg.userId ELSE TRUE END)')
      predicates.binds.push( userObject.userId, userObject.userId )
    }

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    sql += ' group by p.packageId, p.name, p.workflow, p.metadata'
    sql += ' order by p.name'
    
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdatePackage = async function(writeAction, packageId, body, projection, userObject) {
  // CREATE: packageId will be null
  // REPLACE/UPDATE: packageId is not null
  let connection // available to try, catch, and finally blocks
  try {
    const {grants, ...packageFields} = body
    // Stringify JSON values
    if ('metadata' in packageFields) {
      packageFields.metadata = JSON.stringify(packageFields.metadata)
    }
  
    // Connect to MySQL
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION');

    // Process scalar properties
    let binds =  { ...packageFields}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into packages
      let sqlInsert =
      `INSERT INTO
          package
          (name, workflow, metadata)
        VALUES
          (:name, :workflow, :metadata)`
      let [rows] = await connection.execute(sqlInsert, binds)
      packageId = rows.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into packages
        let sqlUpdate =
        `UPDATE
            package
          SET
            ?
          WHERE
            packageId = ?`
        await connection.query(sqlUpdate, [packageFields, packageId])
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process grants
    if (grants && writeAction !== dbUtils.WRITE_ACTION.CREATE) {
      // DELETE from package_grant
      let sqlDeleteGrants = 'DELETE FROM package_grant where packageId = ?'
      await connection.execute(sqlDeleteGrants, [packageId])
    }
    if (grants.length > 0) {
      // INSERT into package_grant
      let sqlInsertGrants = `
        INSERT INTO 
        package_grant (packageId, userId, accessLevel)
        VALUES
          ?`      
      let binds = grants.map(i => [packageId, i.userId, i.accessLevel])
      await connection.query(sqlInsertGrants, [binds])
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
      await connection.release()
    }
  }

  try {
    let row = await _this.getPackage(packageId, projection, true, userObject)
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
    let row = await _this.addOrUpdatePackage(dbUtils.WRITE_ACTION.CREATE, null, body, projection, userObject)
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
    let row = await _this.queryPackages(projection, { packageId: packageId }, elevate, userObject)
    let sqlDelete = `DELETE FROM package where packageId = ?`
    await dbUtils.pool.query(sqlDelete, [packageId])
    return (row[0])
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
    const joins = [
      'asset a',
      'left join stig_asset_map sa on a.assetId=sa.assetId',
      'left join current_rev rev on sa.benchmarkId=rev.benchmarkId',
      'left join rev_group_map rg on rev.revId=rg.revId',
      'left join `group` g on rg.groupId=g.groupId',
      'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join rule rules on rgr.ruleId=rules.ruleId',
      'left join (select distinct ruleId from rule_oval_map) scap on rgr.ruleId=scap.ruleId',
      'left join review r on (rgr.ruleId=r.ruleId and sa.assetId=r.assetId)'
    ]

    const predicates = {
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
      const results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      predicates.statements.push('rev.version = :version')
      predicates.statements.push('rev.release = :release')
      predicates.binds.version = results[1]
      predicates.binds.release = results[2]
    }

    // Access control
    if (!userObject.globalAccess) {
      const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
      if (packageGrant && packageGrant.accessLevel === 1) {
        predicates.statements.push(`a.assetId in (
          select
              sa.assetId
          from
              user_stig_asset_map usa 
              left join stig_asset_map sa on (usa.saId=sa.saId and sa.benchmarkId = :benchmarkId) 
          where
              usa.userId=:userId)`)
        predicates.binds.userId = userObject.userId
      }
    } 
  
    const sql = `
      select
        r.ruleId
        ,r.ruleTitle
        ,r.groupId
        ,r.groupTitle
        ,r.severity
        ,cast(r.autoCheckAvailable is true as json) as autoCheckAvailable
        ,json_object(
          'results', json_object(
            'pass', sum(CASE WHEN r.resultId = 3 THEN 1 ELSE 0 END),
            'fail', sum(CASE WHEN r.resultId = 4 THEN 1 ELSE 0 END),
            'notapplicable', sum(CASE WHEN r.resultId = 2 THEN 1 ELSE 0 END),
            'notchecked', sum(CASE WHEN r.resultId is null THEN 1 ELSE 0 END)
          ),
          'statuses', json_object(
            'saved', sum(CASE WHEN r.statusId = 0 THEN 1 ELSE 0 END),
            'submitted', sum(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END),
            'rejected', sum(CASE WHEN r.statusId = 2 THEN 1 ELSE 0 END),
            'accepted', sum(CASE WHEN r.statusId = 3 THEN 1 ELSE 0 END)
          )
        ) as counts
      from (
        select
          a.assetId
          ,rgr.ruleId
          ,rules.title as ruleTitle
          ,rules.severity
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
        ,r.autoCheckAvailable
      order by
        substring(r.groupId from 3) + 0
    `
    // Send query
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    const [rows] = await connection.query(sql, predicates.binds)
    // for (const row of rows) {
    //   row.autoCheckAvailable = row.autoCheckAvailable === 1 ? true : false
    // }
    return (rows.length > 0 ? rows : null)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, { message: err.message, stack: err.stack }))
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
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
    let rows = await _this.queryPackages(projection, {
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
exports.getPackages = async function(predicates, projection, elevate, userObject) {
  try {
    let rows = await _this.queryPackages(projection, predicates, elevate, userObject)
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
    let row = await _this.addOrUpdatePackage(dbUtils.WRITE_ACTION.REPLACE, packageId, body, projection, userObject)
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
    let row = await _this.addOrUpdatePackage(dbUtils.WRITE_ACTION.UPDATE, packageId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

