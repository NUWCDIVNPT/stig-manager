'use strict';
const dbUtils = require('./utils')
const config = require('../../utils/config.js')
const MyController = require('../../controllers/Collection')

const _this = this

/**
Generalized queries for collection(s).
**/
exports.queryCollections = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) { 
    const context = elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    
    const queries = []

    let columns = [
      'CAST(c.collectionId as char) as collectionId',
      'c.name',
      'c.description',
      `JSON_MERGE_PATCH('${JSON.stringify(MyController.defaultSettings)}', c.settings) as settings`,
      'c.metadata'
    ]
    let joins = [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join asset a on c.collectionId = a.collectionId',
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
                  'assetId', CAST(a.assetId as char), 
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
                  'lastRevisionDate', date_format(cr.benchmarkDateSql,'%Y-%m-%d'),
                  'title', st.title,
                  'ruleCount', cr.ruleCount)
              else null end 
            order by cr.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
    }
    if (inProjection.includes('grants')) {
      columns.push(`(select
        coalesce(
          (select json_arrayagg(
            json_object(
              'user', json_object(
                'userId', CAST(user_data.userId as char),
                'username', user_data.username,
                'displayName', COALESCE(
                  JSON_UNQUOTE(JSON_EXTRACT(user_data.lastClaims, "$.${config.oauth.claims.name}")),
                  user_data.username)
                ),
              'accessLevel', accessLevel
            )
          )
          from collection_grant left join user_data using (userId) where collectionId = c.collectionId)
        ,  json_array()
        )
      ) as "grants"`)
    }
    if (inProjection.includes('owners')) {
      columns.push(`(select
        coalesce(
          (select json_arrayagg(
            json_object(
              'userId', CAST(user_data.userId as char),
              'username', user_data.username,
              'email', JSON_UNQUOTE(JSON_EXTRACT(user_data.lastClaims, "$.${config.oauth.claims.email}")), 
              'displayName', JSON_UNQUOTE(JSON_EXTRACT(user_data.lastClaims, "$.${config.oauth.claims.name}"))
            )
          )
          from collection_grant 
            left join user_data using (userId)
          where collectionId = c.collectionId and accessLevel = 4)
        ,  json_array()
        )
      ) as "owners"`)
    }
    if (inProjection.includes('labels')) {
      queries.push(_this.getCollectionLabels('all', userObject))
    }
    if (inProjection.includes('statistics')) {
      if (context == dbUtils.CONTEXT_USER) {
        joins.push('left join collection_grant cgstat on c.collectionId = cgstat.collectionId')
        columns.push(`(select
          json_object(
            'created', DATE_FORMAT(c.created, '%Y-%m-%dT%TZ'),
            'grantCount', CASE WHEN cg.accessLevel = 1 THEN 1 ELSE COUNT( distinct cgstat.cgId ) END,
            'assetCount', COUNT( distinct a.assetId ),
            'checklistCount', COUNT( distinct sa.saId )
          )
        ) as "statistics"`)
      }
      else {
        columns.push(`(select
          json_object(
            'created', DATE_FORMAT(c.created, '%Y-%m-%dT%TZ'),
            'grantCount', COUNT( distinct cg.cgId ),
            'assetCount', COUNT( distinct a.assetId ),
            'checklistCount', COUNT( distinct sa.saId )
          )
        ) as "statistics"`)
      }
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if ( inPredicates.collectionId ) {
      predicates.statements.push('c.collectionId = ?')
      predicates.binds.push( inPredicates.collectionId )
    }
    if ( inPredicates.name ) {
      let matchStr = '= ?'
      if ( inPredicates.nameMatch && inPredicates.nameMatch !== 'exact') {
        matchStr = 'LIKE ?'
        switch (inPredicates.nameMatch) {
          case 'startsWith':
            inPredicates.name = `${inPredicates.name}%`
            break
          case 'endsWith':
            inPredicates.name = `%${inPredicates.name}`
            break
          case 'contains':
            inPredicates.name = `%${inPredicates.name}%`
            break
        }
      }
      predicates.statements.push(`c.name ${matchStr}`)
      predicates.binds.push( inPredicates.name )
    }
    if ( inPredicates.metadata ) {
      for (const pair of inPredicates.metadata) {
        const [key, value] = pair.split(':')
        predicates.statements.push('JSON_CONTAINS(c.metadata, ?, ?)')
        predicates.binds.push( `"${value}"`,  `$.${key}`)
      }
    }
    if (context == dbUtils.CONTEXT_USER) {
      joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
      predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
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
    sql += ' group by c.collectionId, c.name, c.description, c.settings, c.metadata'
    sql += ' order by c.name'
    
    // perform concurrent labels query
    if (queries.length) {
      queries.push(dbUtils.pool.query(sql, predicates.binds))
      const results = await Promise.all(queries)

      const labelResults = results[0]
      const collectionResults = results[1][0]
      
      // transform labels into Map
      const labelMap = new Map()
      for (const labelResult of labelResults) {
        const {collectionId, ...label} = labelResult
        const existing = labelMap.get(collectionId)
        if (existing) {
          existing.push(label)
        }
        else {
          labelMap.set(collectionId, [label])
        }
      }
      for (const collectionResult of collectionResults) {
        collectionResult.labels = labelMap.get(collectionResult.collectionId) ?? []
      }

      return collectionResults
    }
    else {
      let [rows] = await dbUtils.pool.query(sql, predicates.binds)
      return (rows)  
    }
}

exports.queryFindings = async function (aggregator, inProjection = [], inPredicates = {}, userObject) {
  let columns, groupBy, orderBy
  switch (aggregator) {
    case 'ruleId':
      columns = [
        'ru.ruleId',
        'ru.title',
        'ru.severity',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'ru.ruleId',
        'ru.title',
        'ru.severity'
      ]
      orderBy = 'ru.ruleId'
      break
    case 'groupId':
      columns = [
        'g.groupId',
        'g.title',
        'g.severity',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'g.groupId',
        'g.title',
        'g.severity'
      ]
      orderBy = 'substring(g.groupId from 3) + 0'
      break
    case 'cci':
      columns = [
        'cci.cci',
        'cci.definition',
        'cci.apAcronym',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'cci.cci',
        'cci.definition',
        'cci.apAcronym'
      ]
      orderBy = 'cci.cci'
      break
  }
  let joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join asset a on c.collectionId = a.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'inner join current_group_rule cgr on sa.benchmarkId = cgr.benchmarkId',
    'inner join current_rev cr on sa.benchmarkId = cr.benchmarkId',
    'inner join review rv on (cgr.ruleId = rv.ruleId and a.assetId = rv.assetId and rv.resultId = 4)',
    'inner join `group` g on cgr.groupId = g.groupId',
    'inner join rule ru on rv.ruleId = ru.ruleId',
    'left join rule_cci_map rulecci on ru.ruleId = rulecci.ruleId',
    'left join cci on rulecci.cci = cci.cci'
  ]

  // PROJECTIONS
  
  // Not exposed in API, used internally
  if (inProjection.includes('rulesWithDiscussion')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'ruleId', ru.ruleId,
      'title', ru.title,
      'severity', ru.severity,
      'vulnDiscussion', ru.vulnDiscussion) order by ru.ruleId), ']') as json) as "rules"`)
  }
  // Not exposed in API, used internally
  if (inProjection.includes('stigsInfo')) {
    columns.push(`cast( concat( '[', group_concat(distinct json_object (
      'benchmarkId', cr.benchmarkId,
      'version', cr.version,
      'release', cr.release,
      'benchmarkDate', cr.benchmarkDate) order by cr.benchmarkId), ']') as json) as "stigsInfo"`)
  }
  if (inProjection.includes('rules')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'ruleId', ru.ruleId,
      'title', ru.title,
      'version', ru.version,
      'severity', ru.severity) order by ru.ruleId), ']') as json) as "rules"`)
  }
  if (inProjection.includes('groups')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'groupId', g.groupId,
      'title', g.title,
      'severity', g.severity) order by g.groupId), ']') as json) as "groups"`)
  }
  if (inProjection.includes('assets')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'assetId', CAST(a.assetId as char),
      'name', a.name) order by a.name), ']') as json) as "assets"`)
  }
  if (inProjection.includes('stigs')) {
    columns.push(`cast( concat( '[', group_concat(distinct concat('"',cgr.benchmarkId,'"')), ']' ) as json ) as "stigs"`)
  }
  if (inProjection.includes('ccis')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'cci', rulecci.cci,
      'definition', cci.definition,
      'apAcronym', cci.apAcronym) order by rulecci.cci), ']') as json) as "ccis"`)
  }


  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  
  // collectionId predicate is mandatory per API spec
  if ( inPredicates.collectionId ) {
    predicates.statements.push('c.collectionId = ?')
    predicates.binds.push( inPredicates.collectionId )
  }
  if ( inPredicates.assetId ) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push( inPredicates.assetId )
  }
  if ( inPredicates.acceptedOnly ) {
    predicates.statements.push('rv.statusId = ?')
    predicates.binds.push( 3 )
  }
  if ( inPredicates.benchmarkId ) {
    predicates.statements.push('cgr.benchmarkId = ?')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
  predicates.binds.push( userObject.userId, userObject.userId )
  
  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += '\nFROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += '\ngroup by ' + groupBy.join(',')
  sql += '\norder by ' + orderBy
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.queryStatus = async function (inPredicates = {}, userObject) {
  let columns = [
    `distinct cast(a.assetId as char) as assetId`,
    'a.name as assetName',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = a.assetId),
      json_array()
    ) as assetLabelIds`,
    'sa.benchmarkId',
    `json_object(
      'total', cr.ruleCount
    ) as rules`,
    'sa.minTs',
    'sa.maxTs',

    `json_object(
      'low', sa.lowCount,
      'medium', sa.mediumCount,
      'high', sa.highCount
    ) as findings`,

    `json_object(
      'saved', json_object(
        'total', sa.saved,
        'resultEngine', sa.savedResultEngine),
      'submitted', json_object(
        'total', sa.submitted,
        'resultEngine', sa.submittedResultEngine),
      'rejected', json_object(
        'total', sa.rejected,
        'resultEngine', sa.rejectedResultEngine),
      'accepted', json_object(
        'total', sa.accepted,
        'resultEngine', sa.acceptedResultEngine)
    ) as status`,     

    `json_object(
      'notchecked', json_object(
        'total', sa.notchecked ,
        'resultEngine', sa.notcheckedResultEngine),
      'notapplicable', json_object(
        'total', sa.notapplicable ,
        'resultEngine', sa.notapplicableResultEngine),
      'pass', json_object(
        'total', sa.pass,
        'resultEngine', sa.passResultEngine),
      'fail', json_object(
        'total', sa.fail,
        'resultEngine', sa.failResultEngine),
      'unknown', json_object(
        'total', sa.unknown,
        'resultEngine', sa.unknownResultEngine),
      'error', json_object(
        'total', sa.error ,
        'resultEngine', sa.errorResultEngine),
      'notselected', json_object(
        'total', sa.notselected,
        'resultEngine', sa.notselectedResultEngine),
      'informational', json_object(
        'total', sa.informational,
        'resultEngine', sa.informationalResultEngine),
      'fixed', json_object(
        'total', sa.fixed ,
        'resultEngine', sa.fixedResultEngine)               
    ) as result`               
  ]
  let joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join asset a on c.collectionId = a.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'left join current_rev cr on sa.benchmarkId = cr.benchmarkId',
  ]

  // PROJECTIONS

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  
  // collectionId predicate is mandatory per API spec
  if ( inPredicates.collectionId ) {
    predicates.statements.push('c.collectionId = ?')
    predicates.binds.push( inPredicates.collectionId )
  }
  if ( inPredicates.benchmarkIds ) {
    predicates.statements.push('sa.benchmarkId IN ?')
    predicates.binds.push( [inPredicates.benchmarkIds] )
  }
  if ( inPredicates.assetIds ) {
    predicates.statements.push('sa.assetId IN ?')
    predicates.binds.push( [inPredicates.assetIds] )
  }
  predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
  predicates.binds.push( userObject.userId, userObject.userId )
  
  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += '\nFROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += '\norder by a.name, sa.benchmarkId'
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.queryStigAssets = async function (inProjection = [], inPredicates = {}, userObject) {
  let columns = [
    'sa.benchmarkId',
    `json_object(
      'assetId', CAST(a.assetId as char),
      'name', a.name
    ) as asset`
  ]
  let joins = [
    'collection c',
    'left join asset a on c.collectionId = a.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
  ]
  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if ( inPredicates.collectionId ) {
    predicates.statements.push('c.collectionId = ?')
    predicates.binds.push( inPredicates.collectionId )
  } else {
    throw ( {status: 400, message: 'Missing required predicate: collectionId'} )
  }
  if ( inPredicates.userId ) {
    joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
    predicates.statements.push('usa.userId = ?')
    predicates.binds.push( inPredicates.userId )
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' order by sa.benchmarkId, a.name'
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.setStigAssetsByCollectionUser = async function(collectionId, userId, stigAssets, svcStatus = {}) {
  let connection // available to try, catch, and finally blocks
  try {
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION');
      const sqlDelete = `DELETE FROM 
        user_stig_asset_map
      WHERE
        userId = ?
        and saId IN (
          SELECT saId from stig_asset_map left join asset using (assetId) where asset.collectionId = ?
        )`
        await connection.execute(sqlDelete, [userId, collectionId])
      if (stigAssets.length > 0) {
        // Get saIds
        const bindsInsertSaIds = [ userId ]
        const predicatesInsertSaIds = []
        for (const stigAsset of stigAssets) {
          bindsInsertSaIds.push(stigAsset.benchmarkId, stigAsset.assetId)
          predicatesInsertSaIds.push('(benchmarkId = ? AND assetId = ?)')
        }
        let sqlInsertSaIds = `INSERT IGNORE INTO user_stig_asset_map (userId, saId) SELECT ?, saId FROM stig_asset_map WHERE `
        sqlInsertSaIds += predicatesInsertSaIds.join('\nOR\n')
        let [result] = await connection.execute(sqlInsertSaIds, bindsInsertSaIds)
      }
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw (err)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.addOrUpdateCollection = async function(writeAction, collectionId, body, projection, userObject, svcStatus = {}) {
  // CREATE: collectionId will be null
  // REPLACE/UPDATE: collectionId is not null
  let connection // available to try, catch, and finally blocks
  try {
    const {grants, labels, ...collectionFields} = body
    // Stringify JSON values
    if ('metadata' in collectionFields) {
      collectionFields.metadata = JSON.stringify(collectionFields.metadata)
    }
    // Merge default settings with any provided settings
    collectionFields.settings = JSON.stringify({...MyController.defaultSettings, ...collectionFields.settings})
  
    // Connect to MySQL
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION');

      // Process scalar properties
      let binds =  { ...collectionFields}
      if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
        // INSERT into collections
        let sqlInsert =
        `INSERT INTO
            collection
            (name, description, settings, metadata)
          VALUES
            (:name, :description, :settings, :metadata)`
        let [rows] = await connection.execute(sqlInsert, binds)
        collectionId = rows.insertId
      }
      else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
        if (Object.keys(binds).length > 0) {
          // UPDATE into collections
          let sqlUpdate =
          `UPDATE
              collection
            SET
              ?
            WHERE
              collectionId = ?`
          await connection.query(sqlUpdate, [collectionFields, collectionId])
        }
      }
      else {
        throw ( {status: 500, message: 'Invalid writeAction'} )
      }
  
      // Process grants
      if (grants && writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        // DELETE from collection_grant
        let sqlDeleteGrants = 'DELETE FROM collection_grant where collectionId = ?'
        await connection.execute(sqlDeleteGrants, [collectionId])
      }
      if (grants && grants.length > 0) {
        // INSERT into collection_grant
        let sqlInsertGrants = `
          INSERT INTO 
          collection_grant (collectionId, userId, accessLevel)
          VALUES
            ?`      
        let binds = grants.map(i => [collectionId, i.userId, i.accessLevel])
        await connection.query(sqlInsertGrants, [binds])
      }
  
      // Process labels
      if (labels && writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        // DELETE from collection_grant
        let sqlDeleteLabels = 'DELETE FROM collection_label where collectionId = ?'
        await connection.execute(sqlDeleteLabels, [collectionId])
      }
      if (labels && labels.length > 0) {
        // INSERT into collection_label
        let sqlInsertLabels = `
          INSERT INTO 
          collection_label (collectionId, name, description, color, uuid)
          VALUES
            ?`      
        const binds = labels.map(i => [collectionId, i.name, i.description, i.color, {
          toSqlString: function () {
            return `UUID_TO_BIN(UUID(),1)`
          }
        }])
        await connection.query(sqlInsertLabels, [binds])
      }
  
      // Commit the changes
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
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
  let row = await _this.getCollection(collectionId, projection, true, userObject)
  return row
}

/**
 * Create a Collection
 *
 * body CollectionAssign  (optional)
 * returns List
 **/
exports.createCollection = async function(body, projection, userObject, svcStatus = {}) {
  let row = await _this.addOrUpdateCollection(dbUtils.WRITE_ACTION.CREATE, null, body, projection, userObject, svcStatus)
  return (row)
}


/**
 * Delete a Collection
 *
 * collectionId Integer A path parameter that identifies a Collection
 * returns CollectionInfo
 **/
exports.deleteCollection = async function(collectionId, projection, elevate, userObject) {
  let row = await _this.queryCollections(projection, { collectionId: collectionId }, elevate, userObject)
  let sqlDelete = `DELETE FROM collection where collectionId = ?`
  await dbUtils.pool.query(sqlDelete, [collectionId])
  return (row[0])
}


/**
 * Return the Checklist for the supplied Collection and STIG 
 *
 * collectionId Integer A path parameter that identifies a Collection
 * benchmarkId String A path parameter that identifies a STIG
 * revisionStr String A path parameter that identifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns CollectionChecklist
 **/
exports.getChecklistByCollectionStig = async function (collectionId, benchmarkId, revisionStr, userObject ) {
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
      'left join review r on (rgr.ruleId=r.ruleId and sa.assetId=r.assetId)'
    ]

    const predicates = {
      statements: [
        'a.collectionId = :collectionId',
        'rev.benchmarkId = :benchmarkId'
      ],
      binds: {
        collectionId: collectionId,
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
    const collectionGrant = userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant && collectionGrant.accessLevel === 1) {
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
  
    const sql = `
      select
        r.ruleId
        ,r.ruleTitle
        ,r.groupId
        ,r.groupTitle
        ,r.version
        ,r.severity
        ,json_object(
          'results', json_object(
            'pass', sum(CASE WHEN r.resultId = 3 THEN 1 ELSE 0 END),
            'fail', sum(CASE WHEN r.resultId = 4 THEN 1 ELSE 0 END),
            'notapplicable', sum(CASE WHEN r.resultId = 2 THEN 1 ELSE 0 END),
            'other', sum(CASE WHEN r.resultId is null OR (r.resultId != 2 AND r.resultId != 3 AND r.resultId != 4) THEN 1 ELSE 0 END)
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
          ,rules.version
          ,rg.groupId
          ,g.title as groupTitle
          ,r.resultId
          ,r.statusId
        from
          ${joins.join('\n')}
        where
          ${predicates.statements.join(' and ')}
        group by
          a.assetId
          ,rgr.ruleId
          ,rules.title
          ,rules.severity
          ,rules.version
          ,rg.groupId
          ,g.title
          ,r.resultId
          ,r.statusId          
        ) r
      group by
        r.ruleId
        ,r.ruleTitle
        ,r.severity
        ,r.groupId
        ,r.groupTitle
        ,r.version
      order by
        substring(r.groupId from 3) + 0
    `
    // Send query
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    const [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Return a Collection
 *
 * collectionId Integer A path parameter that identifies a Collection
 * returns CollectionInfo
 **/
exports.getCollection = async function(collectionId, projection, elevate, userObject) {
  let rows = await _this.queryCollections(projection, {
    collectionId: collectionId
  }, elevate, userObject)
  return (rows[0])
}


/**
 * Return a list of Collections accessible to the user
 *
 * returns List
 **/
exports.getCollections = async function(predicates, projection, elevate, userObject) {
  let rows = await _this.queryCollections(projection, predicates, elevate, userObject)
  return (rows)
}

exports.getFindingsByCollection = async function( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projection, userObject ) {
  let rows = await _this.queryFindings(aggregator, projection, { 
    collectionId: collectionId,
    benchmarkId: benchmarkId,
    assetId: assetId,
    acceptedOnly: acceptedOnly
  }, userObject)
  return (rows)
}

exports.getStatusByCollection = async function( collectionId, assetIds, benchmarkIds, userObject ) {
  let rows = await _this.queryStatus({ 
    collectionId,
    benchmarkIds,
    assetIds
    }, userObject)
  return (rows)
}

exports.getStigAssetsByCollectionUser = async function (collectionId, userId, elevate, userObject) {
  let rows = await _this.queryStigAssets([], { 
    collectionId: collectionId,
    userId: userId
  }, userObject)
  return (rows)
}

exports.getStigsByCollection = async function( collectionId, labelIds, elevate, userObject ) {
  let columns = [
    'cr.benchmarkId',
    'concat("V", cr.version, "R", cr.release) as lastRevisionStr',
    `date_format(cr.benchmarkDateSql,'%Y-%m-%d') as lastRevisionDate`,
    'st.title',
    'cr.ruleCount',
    'COUNT(a.assetId) as assetCount',
    'SUM(sa.accepted) as acceptedCount',
    'SUM(sa.rejected) as rejectedCount',
    'SUM(sa.submitted) as submittedCount',
    'SUM(sa.saved) as savedCount',
    `LEAST(MIN(minTs), MIN(maxTs)) as minTs`,
    `GREATEST(MAX(minTs), MAX(maxTs)) as maxTs`
  ]

  let joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join asset a on c.collectionId = a.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join current_rev cr on sa.benchmarkId=cr.benchmarkId',
    'left join stig st on cr.benchmarkId=st.benchmarkId'
  ]

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  predicates.statements.push('c.collectionId = ?')
  predicates.binds.push( collectionId )

  if (labelIds?.length) {
    joins.push('inner join collection_label_asset_map cla on a.assetId = cla.assetId')
    predicates.statements.push('cla.clId IN (select clId from collection_label where uuid IN ?)')
    const uuidBinds = labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
    predicates.binds.push([uuidBinds])

  }

  joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
  predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
  predicates.binds.push( userObject.userId )
  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' group by cr.benchmarkId, cr.version, cr.release, cr.benchmarkDateSql, st.title, cr.ruleCount '
  sql += ' order by cr.benchmarkId'
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

/**
 * Replace all properties of a Collection
 *
 * body CollectionAssign  (optional)
 * collectionId Integer A path parameter that identifies a Collection
 * returns CollectionInfo
 **/
exports.replaceCollection = async function( collectionId, body, projection, userObject, svcStatus = {}) {
  let row = await _this.addOrUpdateCollection(dbUtils.WRITE_ACTION.REPLACE, collectionId, body, projection, userObject, svcStatus)
  return (row)
}

/**
 * Merge updates to a Collection
 *
 * body CollectionAssign  (optional)
 * collectionId Integer A path parameter that identifies a Collection
 * returns CollectionInfo
 **/
exports.updateCollection = async function( collectionId, body, projection, userObject, svcStatus = {}) {
  let row = await _this.addOrUpdateCollection(dbUtils.WRITE_ACTION.UPDATE, collectionId, body, projection, userObject, svcStatus)
  return (row)
}


exports.getCollectionMetadataKeys = async function ( collectionId ) {
  const binds = []
  let sql = `
    select
      JSON_KEYS(metadata) as keyArray
    from 
      collection
    where 
      collectionId = ?`
  binds.push(collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].keyArray : []
}

exports.getCollectionMetadata = async function ( collectionId ) {
  const binds = []
  let sql = `
    select
      metadata 
    from 
      collection
    where 
      collectionId = ?`
  binds.push(collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].metadata : {}
}

exports.patchCollectionMetadata = async function ( collectionId, metadata ) {
  const binds = []
  let sql = `
    update
      collection 
    set 
      metadata = JSON_MERGE_PATCH(metadata, ?)
    where 
      collectionId = ?`
  binds.push(JSON.stringify(metadata), collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.putCollectionMetadata = async function ( collectionId, metadata ) {
  const binds = []
  let sql = `
    update
      collection
    set 
      metadata = ?
    where 
      collectionId = ?`
  binds.push(JSON.stringify(metadata), collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return true
}

exports.getCollectionMetadataValue = async function ( collectionId, key ) {
  const binds = []
  let sql = `
    select
      JSON_EXTRACT(metadata, ?) as value
    from 
      collection
    where 
      collectionId = ?`
  binds.push(`$."${key}"`, collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.putCollectionMetadataValue = async function ( collectionId, key, value ) {
  const binds = []
  let sql = `
    update
      collection
    set 
      metadata = JSON_SET(metadata, ?, ?)
    where 
      collectionId = ?`
  binds.push(`$."${key}"`, value, collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

exports.deleteCollectionMetadataKey = async function ( collectionId, key ) {
  const binds = []
  let sql = `
    update
      collection
    set 
      metadata = JSON_REMOVE(metadata, ?)
    where 
      collectionId = ?`
  binds.push(`$."${key}"`, collectionId)
  let [rows] = await dbUtils.pool.query(sql, binds)
  return rows.length > 0 ? rows[0].value : ""
}

/*
Available only to level 3 or 4 users ("Manage" or "Owner")
Returns number of history entries deleted.
RetentionDate - Delete all review history entries prior to the specified date.
Asset Id - if provided, only delete entries for that asset.
*/
exports.deleteReviewHistoryByCollection = async function (collectionId, retentionDate, assetId) {
  let sql = `
    DELETE rh 
    FROM review_history rh 
      INNER JOIN review r on rh.reviewId = r.reviewId
      INNER JOIN asset a on r.assetId = a.assetId
    WHERE a.collectionId = :collectionId
      AND rh.touchTs < :retentionDate`

  if(assetId) {
    sql += ' AND a.assetId = :assetId'
  }

  let binds = {
    collectionId: collectionId,
    retentionDate: retentionDate,
    assetId: assetId
  }  

  let [rows] = await dbUtils.pool.query(sql, binds)
  let result = {
    HistoryEntriesDeleted: rows.affectedRows
  }
  return (result)
}

/*
GET /collections/{collectionId}/review-history
Available to level 2 and higher users with a grant to the collection.
Returns block of review history entries that fit criteria. Takes optional:
Start Date
End Date
(If no dates provided, return all history. If only one date, return block from that date to current, or that date to oldest, as appropriate)
Asset ID - only return history for this asset id
Rule ID - only return history for this rule id
status- only return history with this status
If rule and asset id provided, return that intersection.
*/
exports.getReviewHistoryByCollection = async function (collectionId, startDate, endDate, assetId, ruleId, status) {
  let binds = {
    collectionId: collectionId
  }
  
  let sql = `
select
CAST(innerQuery.assetId as char) as assetId,
	json_arrayagg(
		json_object(
			'ruleId', innerQuery.ruleId,
			'history', innerQuery.history
		)
	) as reviewHistories
from
	(select 
		a.assetId, 
		rv.ruleId, 
		json_arrayagg(
		  json_object(
        'ts', DATE_FORMAT(rh.ts, '%Y-%m-%dT%TZ'),
        'result', result.api,
        'detail', COALESCE(LEFT(rh.detail,32767), ''),
        'comment', COALESCE(LEFT(rh.comment,32767), ''),
        'autoResult', rh.autoResult = 1,
        'status', JSON_OBJECT(
          'label', status.api,
          'text', rh.statusText,
          'user', JSON_OBJECT(
            'userId', CAST(rh.statusUserId as char),
            'username', udStatus.username
          ),
          'ts', DATE_FORMAT(rh.statusTs, '%Y-%m-%dT%TZ')
        ),        
        'userId', CAST(rh.userId as char),
        'username', ud.username,
        'touchTs', DATE_FORMAT(rh.touchTs, '%Y-%m-%dT%TZ')

        )
		) as 'history'
	FROM
		review_history rh
		INNER JOIN review rv on rh.reviewId = rv.reviewId
		INNER JOIN user_data ud on rh.userId = ud.userId
    left join user_data udStatus on udStatus.userId=rh.statusUserId
		INNER JOIN result on rh.resultId = result.resultId
		INNER JOIN status on rh.statusId = status.statusId
		inner join asset a on a.assetId = rv.assetId
	WHERE
		rv.assetId = a.assetId
		and a.collectionId = :collectionId`

  if (startDate) {
    binds.startDate = startDate
    sql += " AND rh.touchTs >= :startDate"
  }

  if (endDate) {
    binds.endDate = endDate
    sql += " AND rh.touchTs <= :endDate"
  }

  if(ruleId) {
    binds.ruleId = ruleId
    sql += " AND rv.ruleId = :ruleId"
  }

  if(status) {
    binds.statusId = dbUtils.REVIEW_STATUS_API[status]
    sql += " AND rh.statusId = :statusId"
  }
  

  if(assetId) {
    binds.assetId = assetId
    sql += " AND a.assetId = :assetId"
  }

  sql += `
	group by
		rv.ruleId, a.assetID) innerQuery
group by
	innerQuery.assetId
  `

  let [rows] = await dbUtils.pool.query(sql, binds)
  return (rows)
}

/*
GET /collections/{collectionId}/review-history/stats
Available to level 2 and higher users with a grant to the collection.
Return some simple stats about the number/properties of history entries.
Uses same params as GET review-history, expecting stats to be scoped to whatever would be returned by that query.
Projection: asset - Break out statistics by Asset in the specified collection
*/
exports.getReviewHistoryStatsByCollection = async function (collectionId, startDate, endDate, assetId, ruleId, status, projection) {

  let binds = {
    collectionId: collectionId
  }

  let sql = 'SELECT COUNT(*) as collectionHistoryEntryCount, MIN(rh.touchTs) as oldestHistoryEntryDate'

  if (projection && projection.includes('asset')) {
    sql += `, coalesce(
      (SELECT json_arrayagg(
        json_object(
          'assetId', CAST(assetId as char) ,
          'historyEntryCount', historyEntryCount,
          'oldestHistoryEntry', oldestHistoryEntry
          )
        )
        FROM 
        (
          SELECT a.assetId, COUNT(*) as historyEntryCount, MIN(rh.touchTs) as oldestHistoryEntry
          FROM review_history rh
            INNER JOIN review rv on rh.reviewId = rv.reviewId
            INNER JOIN asset a on rv.assetId = a.assetId
          WHERE a.collectionId = :collectionId
          additionalPredicates
          GROUP BY a.assetId
        ) v
      ), json_array()
      ) as assetHistoryEntryCounts`
  }

  sql += `
    FROM review_history rh
      INNER JOIN review rv on rh.reviewId = rv.reviewId
      INNER JOIN asset a on rv.assetId = a.assetId
    WHERE a.collectionId = :collectionId
    additionalPredicates
  `

  let additionalPredicates = ""

  if (startDate) {
    binds.startDate = startDate
    additionalPredicates += " AND rh.touchTs >= :startDate"
  }

  if (endDate) {
    binds.endDate = endDate
    additionalPredicates += " AND rh.touchTs <= :endDate"
  }

  if(ruleId) {
    binds.ruleId = ruleId
    additionalPredicates += " AND rv.ruleId = :ruleId"
  }

  if(status) {
    binds.statusId = dbUtils.REVIEW_STATUS_API[status]
    additionalPredicates += ' AND rh.statusId = :statusId'
  }
  
  if(assetId) {
    binds.assetId = assetId
    additionalPredicates += " AND a.assetId = :assetId"
  }

  sql = sql.replace(/additionalPredicates/g, additionalPredicates)

  let [rows] = await dbUtils.pool.query(sql, binds)
  return (rows[0])
}

exports.getCollectionSettings = async function ( collectionId ) {
  let sql = `
    select
      JSON_MERGE_PATCH('${JSON.stringify(MyController.defaultSettings)}', settings) as settings
    from 
      collection
    where 
      collectionId = ?`
  let [rows] = await dbUtils.pool.query(sql, [collectionId])
  return rows.length > 0 ? rows[0].settings : undefined
}

exports.getCollectionLabels = async function (collectionId, userObject) {
  // this method is called by queryCollections() in this module, when that method's
  // request includes projection=labels. Only in that case can collectionId === 'all'
  const columns = [
    'BIN_TO_UUID(cl.uuid,1) labelId',
    'cl.name',
    'cl.description',
    'cl.color',
    'count(distinct cla.claId) as uses'
  ]
  const joins = [
    'collection_label cl', 
    'left join collection_grant cg_l on cl.collectionId = cg_l.collectionId',
    'left join asset a_l on cl.collectionId = a_l.collectionId',
    'left join stig_asset_map sa_l on a_l.assetId = sa_l.assetId',
    'left join user_stig_asset_map usa_l on sa_l.saId = usa_l.saId',
    'left join collection_label_asset_map cla on cla.clId = cl.clId and cla.assetId = a_l.assetId'
  ]
  const groups = [
    'cl.uuid',
    'cl.name',
    'cl.description',
    'cl.color'
  ]
  const predicates = {
    statements: [
      `(cg_l.userId = ? AND 
        CASE WHEN cg_l.accessLevel = 1 THEN 
          usa_l.userId = cg_l.userId
          AND cla.claId IS NOT NULL 
        ELSE 
          TRUE 
        END)`
    ],
    binds: [userObject.userId]
  }
  const order = [
    'cl.name'
  ]
  if (collectionId === 'all') {
    columns.push('CAST(cl.collectionId as char) as collectionId')
    groups.push('cl.collectionId')
    order.unshift('cl.collectionId')
  }
  else {
    predicates.statements.push('cl.collectionId = ?')
    predicates.binds.push(collectionId)
  }
  const sql = `SELECT
  ${columns.join(',\n')}
  FROM 
  ${joins.join('\n')}
  WHERE
  ${predicates.statements.join(' AND ')}
  GROUP BY
  ${groups.join(',\n')}
  ORDER BY
  ${order.join(',\n')}`
  const [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return rows
}

exports.createCollectionLabel = async function (collectionId, label) {
  let [resultInsert] = await dbUtils.pool.query(
    `INSERT INTO collection_label 
    (collectionId, name, description, color, uuid)
    VALUES (?, ?, ?, ?, UUID_TO_BIN(UUID(),1))`,
  [collectionId, label.name, label.description, label.color])

  const [resultGet] = await dbUtils.pool.query(
    `SELECT BIN_TO_UUID(uuid,1) as uuid from collection_label where clId = ?`,
    [resultInsert.insertId]
  )
  return resultGet[0].uuid
}

exports.getCollectionLabelById = async function (collectionId, labelId, userObject) {
  const [rows] = await dbUtils.pool.query(
    `select
    BIN_TO_UUID(cl.uuid,1) labelId,
    cl.name,
    cl.description,
    cl.color,
    count(distinct cla.claId) as uses
  from
    collection_label cl 
    left join collection_grant cg_l on cl.collectionId = cg_l.collectionId
    left join asset a_l on cl.collectionId = a_l.collectionId
    left join stig_asset_map sa_l on a_l.assetId = sa_l.assetId
    left join user_stig_asset_map usa_l on sa_l.saId = usa_l.saId
    left join collection_label_asset_map cla on cla.clId = cl.clId and cla.assetId = a_l.assetId
  where 
    cl.collectionId = ?
    and cl.uuid = UUID_TO_BIN(?,1) 
    and (cg_l.userId = ? AND 
      CASE WHEN cg_l.accessLevel = 1 THEN 
        usa_l.userId = cg_l.userId
        AND cla.claId IS NOT NULL 
      ELSE 
        TRUE 
      END)
  group by
    cl.uuid,
    cl.name,
    cl.description,
    cl.color`,
    [collectionId, labelId, userObject.userId])
  return rows[0]
}

exports.patchCollectionLabelById = async function (collectionId, labelId, label) {
  const [rows] = await dbUtils.pool.query(
    `UPDATE
      collection_label
    SET
      ?
    WHERE
      collectionId = ?
      and uuid = UUID_TO_BIN(?,1)`,
    [label, collectionId, labelId])
  return rows.affectedRows
}

exports.deleteCollectionLabelById = async function (collectionId, labelId) {
  const [rows] = await dbUtils.pool.query(
    `DELETE FROM
      collection_label
    WHERE
      collectionId = ?
      and uuid = UUID_TO_BIN(?,1)`,
    [collectionId, labelId])
  return rows.affectedRows
}

exports.getAssetsByCollectionLabelId = async function (collectionId, labelId, userObject) {
  const sqlGetAssets = `
select
  CAST(a.assetId as char) as assetId ,
  a.name
from
  collection_label cl 
  left join collection_grant cg on cl.collectionId = cg.collectionId
  left join asset a on cl.collectionId = a.collectionId
  left join stig_asset_map sa on a.assetId = sa.assetId
  left join user_stig_asset_map usa on sa.saId = usa.saId
  left join collection_label_asset_map cla on cla.clId = cl.clId and cla.assetId = a.assetId
where 
  cl.collectionId = ?
  and cl.uuid = UUID_TO_BIN(?,1)
  and (cg.userId = ? AND 
    CASE WHEN cg.accessLevel = 1 THEN 
      usa.userId = cg.userId
    ELSE 
      TRUE 
    END)
    and cla.claId IS NOT NULL 
group by
  a.assetId,
  a.name`
  const [rows] = await dbUtils.pool.query(
    sqlGetAssets,
    [collectionId, labelId, userObject.userId])
  return rows
}

exports.putAssetsByCollectionLabelId = async function (collectionId, labelId, assetIds, svcStatus = {}) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction() {
      await connection.query('START TRANSACTION')

      const sqlGetClId = `select clId from collection_label where uuid = UUID_TO_BIN(?,1)`
      const [clIdRows] = await connection.query( sqlGetClId, [ labelId ] )
      const clId = clIdRows[0].clId
  
      let sqlDelete = `
      DELETE FROM 
        collection_label_asset_map
      WHERE 
        clId = ?`
      if (assetIds.length > 0) {
        sqlDelete += ' and assetId NOT IN ?'
      }  
      await connection.query( sqlDelete, [ clId, [assetIds] ] )
      // Push any bind values
      const binds = []
      for (const assetId of assetIds) {
        binds.push([clId, assetId])
      }
      if (binds.length > 0) {
        let sqlInsert = `
        INSERT IGNORE INTO 
          collection_label_asset_map (clId, assetId)
        VALUES
          ?`
        await connection.query(sqlInsert, [ binds ])
      }
      // Commit the changes
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.getUnreviewedAssetsByCollection = async function (params) {
  const rows = await queryUnreviewedByCollection({ grouping: 'asset', ...params})
  return (rows)
}

exports.getUnreviewedRulesByCollection = async function (params) {
  const rows = await queryUnreviewedByCollection({ grouping: 'rule', ...params})
  return (rows)
}

async function queryUnreviewedByCollection ({
  grouping,
  collectionId,
  benchmarkId,
  assetId,
  ruleId,
  severities,
  labelIds,
  labelNames,
  projections,
  userObject
}) {
  let columns, groupBy, orderBy
  switch (grouping) {
    case 'asset':
      columns = [
        'CAST(a.assetId as char) as assetId',
        'a.name',
        `coalesce(
          (select
            json_arrayagg(json_object(
              'labelId', BIN_TO_UUID(cl2.uuid,1),
              'name', cl2.name
              ))
          from
            collection_label_asset_map cla2
            left join collection_label cl2 on cla2.clId = cl2.clId
          where
            cla2.assetId = a.assetId),
          json_array()) as labels`,
        `json_arrayagg(json_object(
          'result', result.api,
          'ruleId', rgr.ruleId,
          'groupId', rg.groupId,
          ${projections.includes('ruleTitle') ? "'ruleTitle', rule.title," : ''}
          ${projections.includes('groupTitle') ? "'groupTitle', `group`.title," : ''}
          'severity', rule.severity,
          'benchmarkId', cr.benchmarkId
        )) as unreviewed`       
      ]
      groupBy = [
        'a.assetId',
        'a.name'
      ]
      orderBy = [
        'a.name'
      ]
      break
    case 'rule':
      const projectionMap = projections.map( p => `${p === 'groupTitle' ? '`group`' : 'rule'}.${p}`)
      columns = [
        'rgr.ruleId',
        'rg.groupId',
        'cr.benchmarkId',
        'rule.severity',
        ...projectionMap,
        `json_arrayagg(json_object(
          'result', result.api,
          'assetId', CAST(a.assetId as char),
          'name', a.name,
          'labels', coalesce(
            (select
              json_arrayagg(json_object(
                'labelId', BIN_TO_UUID(cl2.uuid,1),
                'name', cl2.name
                ))
            from
              collection_label_asset_map cla2
              left join collection_label cl2 on cla2.clId = cl2.clId
            where
              cla2.assetId = a.assetId),
            json_array())
        )) as unreviewed`
      ]
      groupBy = [
        'rgr.ruleId',
        'rg.groupId',
        'cr.benchmarkId',
        'rule.severity',
        ...projectionMap
      ]
      orderBy = [
        'rgr.ruleId'
      ]
  }
  const joins = [
    'asset a',
    'left join collection_label_asset_map cla on cla.assetId = a.assetId',
    'left join collection_label cl on cla.clId = cl.clId',
    'left join collection_grant cg on a.collectionId = cg.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'left join current_rev cr on sa.benchmarkId = cr.benchmarkId',
    'left join rev_group_map rg on cr.revId = rg.revId',
    'left join `group` on rg.groupId = `group`.groupId',
	  'left join rev_group_rule_map rgr on rg.rgId = rgr.rgId',
    'left join rule on rgr.ruleId = rule.ruleId',
	  'left join review r on (a.assetId = r.assetId and rgr.ruleId = r.ruleId)',
    'left join result on r.resultId = result.resultId'
  ]
  const predicates = {
    statements: [
      'a.collectionId = ?',
      '(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)',
      '(r.reviewId is null or r.resultId not in (2,3,4))',
    ],
    binds: [collectionId, userObject.userId]
  }
  if (assetId) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push(assetId)
  }
  if (labelIds?.length) {
    predicates.statements.push('cl.uuid IN ?')
    const uuidBinds = labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
    predicates.binds.push([uuidBinds])
  }
  if (labelNames?.length) {
    predicates.statements.push('cl.name IN ?')
    predicates.binds.push([labelNames])
  }
  if (benchmarkId) {
    predicates.statements.push('cr.benchmarkId = ?')
    predicates.binds.push(benchmarkId)
  }
  if (ruleId) {
    predicates.statements.push('rgr.ruleId = ?')
    predicates.binds.push(ruleId)
  }
  if (severities?.length) {
    predicates.statements.push('rule.severity IN ?')
    predicates.binds.push([severities])
  }
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy})
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}