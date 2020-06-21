'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for collection(s).
**/
exports.queryCollections = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'p.COLLECTIONID as "collectionId"',
    'p.NAME as "name"',
    'p.EMASSID as "emassId"',
    'p.POCNAME as "pocName"',
    'p.POCEMAIL as "pocEmail"',
    'p.POCPHONE as "pocPhone"',
    'p.REQRAR as "reqRar"'
  ]
  let joins = [
    'stigman.collections p',
    'left join stigman.asset_collection_map ap on p.collectionId=ap.collectionId',
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
  if (inPredicates.collectionId) {
    predicates.statements.push('p.collectionId = :collectionId')
    predicates.binds.push( inPredicates.collectionId )
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
  sql += ' group by p.collectionId, p.name, p.emassid, p.pocname, p.pocemail, p.pocphone, p.reqrar'
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

exports.addOrUpdateCollection = async function(writeAction, collectionId, body, projection, userObject) {
  // CREATE: collectionId will be null
  // REPLACE/UPDATE: collectionId is not null
  let connection // available to try, catch, and finally blocks
  try {
    // Extract non-scalar properties to separate variables
    let { assetIds, ...collectionFields } = body
    
    // Convert boolean scalar values to database values (true=1 or false=0)
    if ('reqRar' in collectionFields) {
      collectionFields.reqRar = collectionFields.reqRar ? 1 : 0
    }
  
    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()

    // Process scalar properties
    let binds = { ...collectionFields}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into collections
      let sqlInsert =
      `INSERT INTO
          stigman.collections
          (name, emassId, pocName, pocEmail, pocPhone, reqRar)
        VALUES
          (:name, :emassId, :pocName, :pocEmail, :pocPhone, :reqRar)
        RETURNING
          collectionId into :collectionId`
      binds.collectionId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      collectionId = result.outBinds.collectionId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into collections
        let sqlUpdate =
        `UPDATE
            stigman.collections
          SET
            ${dbUtils.objectBindObject(collectionFields, binds)}
          WHERE
            collectionId = :collectionId`
        binds.collectionId = collectionId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process assetIds
    if (assetIds && writeAction !== dbUtils.WRITE_ACTION.CREATE) {
      // DELETE from asset_collection_map
      let sqlDeleteAssets = 'DELETE FROM stigman.asset_collection_map where collectionId = :collectionId'
      await connection.execute(sqlDeleteAssets, [collectionId])
    }
    if (assetIds.length > 0) {
      // INSERT into asset_collection_map
      let sqlInsertAssets = `
        INSERT INTO 
          stigman.asset_collection_map (collectionId,assetId)
        VALUES (:collectionId, :assetId)`      
      let binds = assetIds.map(i => [collectionId, i])
      await connection.executeMany(sqlInsertAssets, binds)
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
    let row = await this.getCollection(collectionId, projection, true, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

/**
 * Create a Collection
 *
 * body CollectionAssign  (optional)
 * returns List
 **/
exports.createCollection = async function(body, projection, userObject) {
  try {
    let row = await this.addOrUpdateCollection(dbUtils.WRITE_ACTION.CREATE, null, body, projection, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete a Collection
 *
 * collectionId Integer A path parameter that indentifies a Collection
 * returns CollectionInfo
 **/
exports.deleteCollection = async function(collectionId, projection, elevate, userObject) {
  try {
    let row = await this.queryCollections(projection, { collectionId: collectionId }, elevate, userObject)
    let sqlDelete = `DELETE FROM stigman.collections where collectionId = :collectionId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [collectionId], options)
    await connection.close()
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the Checklist for the supplied Collection and STIG 
 *
 * collectionId Integer A path parameter that indentifies a Collection
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns CollectionChecklist
 **/
exports.getChecklistByCollectionStig = async function (collectionId, benchmarkId, revisionStr, userObject ) {
  let connection
  try {
    let joins = [
      'stigman.asset_collection_map ap',
      'left join stigman.stig_asset_map sa on ap.assetId=sa.assetId',
      'left join stigs.current_revs rev on sa.stigId=rev.stigId',
      'left join stigs.rev_group_map rg on rev.revId=rg.revId',
      'left join stigs.groups g on rg.groupId=g.groupId',
      'left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join stigs.rules rules on rgr.ruleId=rules.ruleId',
      'left join stigs.rule_oval_map ro on rgr.ruleId=ro.ruleId',
      'left join stigman.reviews r on (rgr.ruleId=r.ruleId and sa.assetId=r.assetId)'
    ]

    let predicates = {
      statements: [
        'ap.collectionId = :collectionId',
        'rev.stigId = :benchmarkId'
      ],
      binds: {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      }
    }

    // Non-current revision
    if (revisionStr !== 'latest') {
      joins.splice(2, 1, 'left join stigs.revisions rev on sa.stigId=rev.stigId')
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      predicates.statements.push('rev.version = :version')
      predicates.statements.push('rev.release = :release')
      predicates.binds.version = results[1]
      predicates.binds.release = results[2]
    }

    // Non-staff access control
    if (userObject.role === "IAO") {
      predicates.statements.push('ap.assetId in (select assetId from stigman.assets where dept=:dept)')
      predicates.binds.dept = userObject.dept
    } 
    else if (userObject.role === "IAWF") {
      predicates.statements.push(`ap.assetId in (
        select
            sa.assetId
        from
            stigman.user_stig_asset_map usa 
            left join stigman.stig_asset_map sa on usa.saId=sa.saId
        where
            usa.userId=:userId)`)
      predicates.binds.userId = userObject.id
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
 * Return a Collection
 *
 * collectionId Integer A path parameter that indentifies a Collection
 * returns CollectionInfo
 **/
exports.getCollection = async function(collectionId, projection, elevate, userObject) {
  try {
    let rows = await this.queryCollections(projection, {
      collectionId: collectionId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Collections accessible to the user
 *
 * returns List
 **/
exports.getCollections = async function(projection, elevate, userObject) {
  try {
    let rows = await this.queryCollections(projection, {}, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Replace all properties of a Collection
 *
 * body CollectionAssign  (optional)
 * collectionId Integer A path parameter that indentifies a Collection
 * returns CollectionInfo
 **/
exports.replaceCollection = async function( collectionId, body, projection, userObject) {
  try {
    let row = await this.addOrUpdateCollection(dbUtils.WRITE_ACTION.REPLACE, collectionId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Merge updates to a Collection
 *
 * body CollectionAssign  (optional)
 * collectionId Integer A path parameter that indentifies a Collection
 * returns CollectionInfo
 **/
exports.updateCollection = async function( collectionId, body, projection, userObject) {
  try {
    let row = await this.addOrUpdateCollection(dbUtils.WRITE_ACTION.UPDATE, collectionId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

