'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config.js')
const MyController = require('../controllers/Collection')

const _this = this

/**
Generalized queries for collection(s).
**/
exports.queryCollections = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) { 
    const context = elevate ? dbUtils.CONTEXT_ALL : dbUtils.CONTEXT_USER
    
    const queries = []

    const groupBy = []
    const orderBy = []

    const columns = [
      'CAST(c.collectionId as char) as collectionId',
      'c.name',
      'c.description',
      `JSON_MERGE_PATCH('${JSON.stringify(MyController.defaultSettings)}', c.settings) as settings`,
      'c.metadata'
    ]
    const joins = [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'left join asset a on c.collectionId = a.collectionId and a.state = "enabled"',
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
      joins.push('left join default_rev dr on (sa.benchmarkId=dr.benchmarkId and c.collectionId = dr.collectionId)')
      joins.push('left join revision on dr.revId = revision.revId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when sa.benchmarkId is not null then 
                json_object(
                  'benchmarkId', sa.benchmarkId, 
                  'revisionStr', revision.revisionStr, 
                  'benchmarkDate', date_format(revision.benchmarkDateSql,'%Y-%m-%d'),
                  'revisionPinned', CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END, 
                  'ruleCount', revision.ruleCount)
              else null end 
            order by sa.benchmarkId),
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
      statements: [`c.state = "enabled"`],
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

    groupBy.push('c.collectionId, c.name, c.description, c.settings, c.metadata')
    orderBy.push('c.name')

    const sql = dbUtils.makeQueryString({columns, joins, predicates,groupBy, orderBy})

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
        'rgr.ruleId',
        'rgr.title',
        'rgr.severity',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'rgr.rgrId'
      ]
      orderBy = ['rgr.ruleId']
      break
    case 'groupId':
      columns = [
        'rgr.groupId',
        'rgr.groupTitle as title',
        'rgr.severity',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'rgr.rgrId'
      ]
      orderBy = ['substring(rgr.groupId from 3) + 0']
      break
    case 'cci':
      columns = [
        'cci.cci',
        'cci.definition',
        'cci.apAcronym',
        'count(distinct a.assetId) as assetCount'
      ]
      groupBy = [
        'cci.cci'
      ]
      orderBy = ['cci.cci']
      break
  }
  let joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'inner join asset a on (c.collectionId = a.collectionId and a.state = "enabled")',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and c.collectionId = dr.collectionId)',
    'left join rev_group_rule_map rgr on dr.revId = rgr.revId',
    'left join rev_group_rule_cci_map rgrcc using (rgrId)',
    'left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId',
    'inner join review rv on (rvcd.version = rv.version and rvcd.checkDigest = rv.checkDigest and a.assetId = rv.assetId and rv.resultId = 4)',
    'left join cci on rgrcc.cci = cci.cci'
  ]

  // PROJECTIONS
  
  // Not exposed in API, used internally
  if (inProjection.includes('rulesWithDiscussion')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'ruleId', rgr.ruleId,
      'title', rgr.title,
      'severity', rgr.severity,
      'vulnDiscussion', rgr.vulnDiscussion) order by rgr.ruleId), ']') as json) as "rules"`)
  }
  // Not exposed in API, used internally
  // if (inProjection.includes('stigsInfo')) {
  //   columns.push(`cast( concat( '[', group_concat(distinct json_object (
  //     'benchmarkId', dr.benchmarkId,
  //     'version', dr.version,
  //     'release', dr.release,
  //     'benchmarkDate', dr.benchmarkDate) order by dr.benchmarkId), ']') as json) as "stigsInfo"`)
  // }
  if (inProjection.includes('rules')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'ruleId', rgr.ruleId,
      'title', rgr.title,
      'version', rgr.version,
      'severity', rgr.severity) order by rgr.ruleId), ']') as json) as "rules"`)
  }
  if (inProjection.includes('groups')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'groupId', rgr.groupId,
      'title', rgr.groupTitle,
      'severity', rgr.groupSeverity) order by rgr.groupId), ']') as json) as "groups"`)
  }
  if (inProjection.includes('assets')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'assetId', CAST(a.assetId as char),
      'name', a.name) order by a.name), ']') as json) as "assets"`)
  }
  if (inProjection.includes('stigs')) {
    joins.push('left join revision on dr.revId = revision.revId')
    columns.push(`cast(
      concat('[', 
        coalesce (
          group_concat(distinct 
            case when revision.benchmarkId is not null then 
              json_object(
                'benchmarkId', revision.benchmarkId, 
                'revisionStr', revision.revisionStr, 
                'benchmarkDate', date_format(revision.benchmarkDateSql,'%Y-%m-%d'),
                'revisionPinned', CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END, 
                'ruleCount', revision.ruleCount)
            else null end 
          order by revision.benchmarkId),
          ''),
      ']')
    as json) as "stigs"`)

    // columns.push(`cast( concat( '[', group_concat(distinct concat('"',dr.benchmarkId,'"')), ']' ) as json ) as "stigs"`)
  }
  if (inProjection.includes('ccis')) {
    columns.push(`cast(concat('[', 
    coalesce(
      group_concat(distinct 
      case when cci.cci is not null
      then json_object(
        'cci', cci.cci,
        'definition', cci.definition,
        'apAcronym', cci.apAcronym)
      else null end order by cci.cci),
      ''),
    ']') as json) as "ccis"`)
  }


  // PREDICATES
  let predicates = {
    statements: ['c.state = "enabled"'],
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
    predicates.statements.push('dr.benchmarkId = ?')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
  predicates.binds.push( userObject.userId, userObject.userId )
  
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})
  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.queryStatus = async function (inPredicates = {}, userObject) {

  let orderBy = ['a.name', 'sa.benchmarkId']

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
    'inner join asset a on c.collectionId = a.collectionId and a.state = "enabled" ',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'left join current_rev cr on sa.benchmarkId = cr.benchmarkId',
  ]

  // PROJECTIONS

  // PREDICATES
  let predicates = {
    statements: ['c.state = "enabled"'],
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
  
  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})
  
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
    statements: [
      'c.state = "enabled"',
      'a.state = "enabled"'
    ],
    binds: []
  }

  let orderBy = ['sa.benchmarkId', 'a.name']

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

  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})

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
        const bindsInsertSaIds = [userId, collectionId]
        const predicatesInsertSaIds = []
        for (const stigAsset of stigAssets) {
          bindsInsertSaIds.push(stigAsset.benchmarkId, stigAsset.assetId)
          predicatesInsertSaIds.push('(sa.benchmarkId = ? AND sa.assetId = ?)')
        }
        let sqlInsertSaIds = `INSERT IGNORE INTO user_stig_asset_map (userId, saId) 
        SELECT 
          ?,
          sa.saId
        FROM
          stig_asset_map sa
          inner join asset a on (sa.assetId = a.assetId and a.collectionId = ? and a.isEnabled = 1)
        WHERE `
        sqlInsertSaIds += predicatesInsertSaIds.join('\nOR\n')
        await connection.execute(sqlInsertSaIds, bindsInsertSaIds)
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
  const row = await _this.queryCollections(projection, { collectionId: collectionId }, elevate, userObject)
  const sqlDelete = `UPDATE collection SET state = "disabled", stateDate = NOW(), stateUserId = ? where collectionId = ?`
  await dbUtils.pool.query(sqlDelete, [userObject.userId, collectionId])
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

    const groupBy = ['rgr.rgrId']
    const orderBy = ['rgr.ruleId']

    const columns = [
          `rgr.ruleId
      ,rgr.title as ruleTitle
      ,rgr.severity
      ,rgr.\`version\`
      ,rgr.groupId
      ,rgr.groupTitle
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
      ,json_object(
        'ts', json_object(
          'min', DATE_FORMAT(MIN(r.ts),'%Y-%m-%dT%H:%i:%sZ'),
          'max', DATE_FORMAT(MAX(r.ts),'%Y-%m-%dT%H:%i:%sZ')
        ),
        'statusTs', json_object(
          'min', DATE_FORMAT(MIN(r.statusTs),'%Y-%m-%dT%H:%i:%sZ'),
          'max', DATE_FORMAT(MAX(r.statusTs),'%Y-%m-%dT%H:%i:%sZ')
        ),
        'touchTs', json_object(
          'min', DATE_FORMAT(MIN(r.touchTs),'%Y-%m-%dT%H:%i:%sZ'),
          'max', DATE_FORMAT(MAX(r.touchTs),'%Y-%m-%dT%H:%i:%sZ')
        )
      ) as timestamps`
    ]

    const joins = [
      'asset a',
      'left join stig_asset_map sa using (assetId)',
      'left join current_rev rev using (benchmarkId)',
      'left join rev_group_rule_map rgr using (revId)',
      'left join rule_version_check_digest rvcd using (ruleId)',
      'left join review r on (rvcd.version=r.version and rvcd.checkDigest=r.checkDigest and sa.assetId=r.assetId)'
    ]

    const predicates = {
      statements: [
        'a.collectionId = :collectionId',
        'rev.benchmarkId = :benchmarkId',
        'a.state = "enabled"'
      ],
      binds: {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      }
    }

    // Non-current revision
    if (revisionStr !== 'latest') {
      joins.splice(2, 1, 'left join revision rev on sa.benchmarkId=rev.benchmarkId')
      const {version, release} = dbUtils.parseRevisionStr(revisionStr)
      predicates.statements.push('rev.version = :version')
      predicates.statements.push('rev.release = :release')
      predicates.binds.version = version
      predicates.binds.release = release
    }

    // Access control
    const collectionGrant = userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant?.accessLevel === 1) {
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
  
    const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})

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

exports.getStigAssetsByCollectionUser = async function (collectionId, userId, elevate, userObject) {
  let rows = await _this.queryStigAssets([], { 
    collectionId: collectionId,
    userId: userId
  }, userObject)
  return (rows)
}

exports.getStigsByCollection = async function( {collectionId, labelIds, labelNames, labelMatch, userObject, benchmarkId, projections} ) {
  const columns = [
    'sa.benchmarkId',
    'stig.title',
    'revision.revisionStr',
    `date_format(revision.benchmarkDateSql,'%Y-%m-%d') as benchmarkDate`,
    'CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END as revisionPinned',
    'revision.ruleCount',
    'count(sa.assetId) as assetCount'
  ]

  const groupBy = ['sa.benchmarkId', 'revision.revId', 'dr.revisionPinned', 'stig.benchmarkId']
  const orderBy = ['sa.benchmarkId']

  const joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join asset a on c.collectionId = a.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and c.collectionId = dr.collectionId)',
    'left join revision on dr.revId = revision.revId',
    'left join stig on revision.benchmarkId = stig.benchmarkId'
  ]

  // PREDICATES
  const predicates = {
    statements: [
      'a.state = "enabled"'
    ],
    binds: []
  }
  predicates.statements.push('c.collectionId = ?')
  predicates.binds.push( collectionId )

  if (labelIds || labelNames || labelMatch) {
    joins.push(
      'left join collection_label_asset_map cla2 on a.assetId = cla2.assetId',
      'left join collection_label cl2 on cla2.clId = cl2.clId'
    )
    const labelPredicates = []
    if (labelIds) {
      labelPredicates.push('cl2.uuid IN ?')
      const uuidBinds = labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (labelNames) {
      labelPredicates.push('cl2.name IN ?')
      predicates.binds.push([labelNames])
    }
    if (labelMatch === 'null') {
      labelPredicates.push('cl2.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    predicates.statements.push(labelPredicatesClause)
  }
  if (benchmarkId) {
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push( benchmarkId )
  }
  if (projections?.includes('assets')) {
    columns.push(`cast(concat('[', group_concat(distinct json_object (
      'assetId', CAST(a.assetId as char),
      'name', a.name) order by a.name), ']') as json) as "assets"`)
  }

  joins.push('left join user_stig_asset_map usa on sa.saId = usa.saId')
  predicates.statements.push('(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)')
  predicates.binds.push( userObject.userId )

  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})
  
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
  await dbUtils.pool.query(sql, binds)
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
  await dbUtils.pool.query(sql, binds)
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

  const columns = [
    `CAST(innerQuery.assetId as char) as assetId,
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
            'ruleId', rh.ruleId,
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
        ) as history`
  ]

  const joins = [
    'review_history rh',
		'INNER JOIN review rv on rh.reviewId = rv.reviewId',
		'INNER JOIN user_data ud on rh.userId = ud.userId',
    'left join user_data udStatus on udStatus.userId=rh.statusUserId',
		'INNER JOIN result on rh.resultId = result.resultId',
		'INNER JOIN status on rh.statusId = status.statusId',
		'inner join asset a on a.assetId = rv.assetId and a.state = "enabled"'
  ]

  let predicates = {
    statements: ['rv.assetId = a.assetId',
		'a.collectionId = ?'],
    binds: [collectionId] 
  }
  let groupBy = []

  if (startDate) {
   predicates.binds.push(startDate)
   predicates.statements.push('rh.touchTs >= ?')
  }

  if (endDate) {
    predicates.binds.push(endDate)
    predicates.statements.push('rh.touchTs <= ?')
  }

  if(ruleId) {
    predicates.binds.push(ruleId)
    predicates.statements.push('rv.ruleId = ?')
  }

  if(status) {
    predicates. binds.push(dbUtils.REVIEW_STATUS_API[status])
    predicates.statements.push('rh.statusId = ?')
  }

  if(assetId) {
    predicates.binds.push(assetId)
    predicates.statements.push('a.assetId = ?')
  }
  
  groupBy.push('rv.ruleId', 'a.assetId ) innerQuery\nGROUP BY\n innerQuery.assetId')
  let sql = dbUtils.makeQueryString({columns, joins, predicates,groupBy })
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)

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
  
  // If there is a response and the request included the asset projection
  if (projection?.includes('asset')) {
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
      INNER JOIN asset a on rv.assetId = a.assetId and a.state = 'enabled'
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
    'left join collection_label_asset_map cla on cla.clId = cl.clId and cla.assetId = a_l.assetId and a_l.state = "enabled"'
  ]
  const groupBy = [
    'cl.uuid',
    'cl.name',
    'cl.description',
    'cl.color'
  ]
  const predicates = {
    statements: [
      // 'a_l.state = "enabled"',
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
  const orderBy = [
    'cl.name'
  ]
  if (collectionId === 'all') {
    columns.push('CAST(cl.collectionId as char) as collectionId')
    groupBy.push('cl.collectionId')
    orderBy.unshift('cl.collectionId')
  }
  else {
    predicates.statements.push('cl.collectionId = ?')
    predicates.binds.push(collectionId)
  }

  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})
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
    left join asset a_l on cl.collectionId = a_l.collectionId and a_l.state = "enabled"
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
  left join asset a on cl.collectionId = a.collectionId and a.state = "enabled"
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
          'groupId', rgr.groupId,
          ${projections.includes('ruleTitle') ? "'ruleTitle', rgr.title," : ''}
          ${projections.includes('groupTitle') ? "'groupTitle', rgr.title," : ''}
          'severity', rgr.severity,
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
      const projectionMap = projections.map( p => `${p === 'groupTitle' ? 'rgr.groupTitle' : 'rgr.title'}`)
      columns = [
        'rgr.ruleId',
        'rgr.groupId',
        'cr.benchmarkId',
        'rgr.severity',
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
        'rgr.groupId',
        'cr.benchmarkId',
        'rgr.severity',
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
	  'left join rev_group_rule_map rgr on cr.revId = rgr.revId',
    'left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId',
	  'left join review r on (a.assetId = r.assetId and rvcd.version = r.version and rvcd.checkDigest = r.checkDigest)',
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
    predicates.statements.push('rgr.severity IN ?')
    predicates.binds.push([severities])
  }
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy})
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.writeStigPropsByCollectionStig = async function ({collectionId, benchmarkId, defaultRevisionStr, assetIds, svcStatus = {}}) {
  let connection
  try {
    let version, release
    if (defaultRevisionStr) {
      if (defaultRevisionStr !== 'latest') {
        ;({version, release} = dbUtils.parseRevisionStr(defaultRevisionStr))
      }
    }
    connection = await dbUtils.pool.getConnection()
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  
    async function transaction () {
      await connection.query('START TRANSACTION')
      if (defaultRevisionStr === 'latest' || assetIds?.length === 0) {
        await connection.query('DELETE FROM collection_rev_map WHERE collectionId = ? and benchmarkId = ?', [collectionId, benchmarkId])
      }
      else if (defaultRevisionStr && defaultRevisionStr !== 'latest') {
        const [revisions] = await connection.query('SELECT revId FROM revision WHERE benchmarkId = ? and `version` = ? and `release` = ?', [benchmarkId, version, release])
        if (revisions[0]?.revId) {
          await connection.query(`INSERT INTO collection_rev_map (collectionId, benchmarkId, revId)
          VALUES (?, ?, ?) AS new ON DUPLICATE KEY UPDATE revId = new.revId`, [collectionId, benchmarkId, revisions[0].revId])
        }
      }  
      if (assetIds) {
        let sqlDeleteStigAsset = `
        DELETE stig_asset_map FROM 
          stig_asset_map
          left join asset on stig_asset_map.assetId = asset.assetId
        WHERE
          asset.collectionId = ?
          and stig_asset_map.benchmarkId = ?${assetIds.length > 0 ? ' and stig_asset_map.assetId NOT IN ?': ''}`
        
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.query( sqlDeleteStigAsset, [ collectionId, benchmarkId, [assetIds] ] )
        
        if (assetIds.length) {
          const binds = assetIds.map( assetId => [benchmarkId, assetId])
          // INSERT into stig_asset_map
          const sqlInsertBenchmarks = `INSERT IGNORE INTO stig_asset_map (benchmarkId, assetId) VALUES ?`
          await connection.query(sqlInsertBenchmarks, [ binds ])
        }
      }
      await dbUtils.updateDefaultRev(connection, {collectionId, benchmarkId})
      await dbUtils.updateStatsAssetStig(connection, {collectionId, benchmarkId})
      await connection.commit()
    }  
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.doesCollectionIncludeAssets = async function ({collectionId, assetIds}) {
  try {
    const sql = `select jt.assetId, a.collectionId
    from 
    JSON_TABLE(
      ?,
      "$[*]"
      COLUMNS(
        assetId INT(11) PATH "$"
      ) ) AS jt
    left join asset a using (assetId)
    where a.collectionId != ? or a.collectionId is null or a.state != "enabled"`

    const [rows] = await dbUtils.pool.query(sql, [JSON.stringify(assetIds), collectionId])
    return rows.length === 0
  }
  catch (e) {
    return false
  }
}

exports.doesCollectionIncludeStig = async function ({collectionId, benchmarkId}) {
  try {
    const [rows] = await dbUtils.pool.query(
      `select distinct sam.benchmarkId from asset a inner join stig_asset_map sam using (assetId) where a.collectionId = ? and a.state = "enabled"`,
      [collectionId]
    )
    return rows.some(i => i.benchmarkId === benchmarkId)
  }
  catch (e) {
    return false
  }
}

exports.cloneCollection = async function ({collectionId, userObject, name, description, options, svcStatus = {}, progressCb = () => {}}) {
  let connection, progressJson
  try {
    const sql = {
      cloneCollection: {
        query: `INSERT INTO collection (name, description, settings, metadata, state) SELECT @name,@description,settings, metadata, "cloning" from collection WHERE collectionId = @srcCollectionId`,
        startText: 'Creating core properties',
        finishText: 'Creating core properties'
      },
      selectLastInsertId: {
        query: 'SELECT last_insert_id() into @destCollectionId',
        startText: 'Creating core properties',
        finishText: 'Created core properties'
      },
      cloneGrants: {
        query: `INSERT INTO collection_grant (collectionId, userId, accessLevel) SELECT @destCollectionId, userId, accessLevel FROM collection_grant where collectionId = @srcCollectionId`,
        startText: 'Creating Grants',
        finishText: 'Creating Grants'
      },
      insertOwnerGrant: {
        query: `INSERT INTO collection_grant (collectionId, userId, accessLevel) VALUES (@destCollectionId, @userId, 4) ON DUPLICATE KEY UPDATE accessLevel = 4`,
        startText: 'Creating Grants',
        finishText: 'Created Grants'
      },
      cloneLabels: {
        query: `INSERT INTO collection_label (collectionId, name, description, color, uuid) SELECT @destCollectionId,name,description,color,UUID_TO_BIN(UUID(),1) FROM collection_label where collectionId = @srcCollectionId`,
        startText: 'Creating Labels',
        finishText: 'Created Labels'
      },
      cloneAssets: {
        query: `INSERT INTO asset (name, fqdn, collectionId, ip, mac, description, noncomputing, metadata) SELECT name,fqdn,@destCollectionId,ip,mac,description,noncomputing,metadata from asset where state = "enabled" and collectionId = @srcCollectionId`,
        startText: 'Creating Assets',
        finishText: 'Creating Assets'
      },
      dropAssetMap: {
        query: `DROP TEMPORARY TABLE IF EXISTS t_assetid_map`,
        startText: 'Creating Assets',
        finishText: 'Creating Assets'
      },
      createAssetMap: {
        query: `CREATE TEMPORARY TABLE t_assetid_map SELECT a1.assetId as srcAssetId, a2.assetId as destAssetId FROM asset a1 left join asset a2 on (a1.collectionId =  @srcCollectionId and a1.name = a2.name and a1.state = "enabled") WHERE a2.collectionId = @destCollectionId`,
        startText: 'Creating Assets',
        finishText: 'Created Assets'
      },
      dropLabelMap: {
        query: `DROP TEMPORARY TABLE IF EXISTS t_clid_map`,
        startText: 'Creating Asset/Label mappings',
        finishText: 'Creating Asset/Label mappings'
      },
      createLabelMap: {
        query: `CREATE TEMPORARY TABLE t_clid_map SELECT cl1.clId as srcClId, cl2.clId as destClId FROM collection_label cl1 left join collection_label cl2 on (cl1.collectionId = @srcCollectionId and cl1.name = cl2.name) WHERE cl2.collectionId = @destCollectionId`,
        startText: 'Creating Asset/Label mappings',
        finishText: 'Creating Asset/Label mappings'
      },
      cloneAssetLabels: {
        query: `INSERT INTO collection_label_asset_map (assetId, clId) SELECT am.destAssetId,cm.destClId FROM collection_label_asset_map cla INNER JOIN t_clid_map cm on cla.clId = cm.srcClId INNER JOIN t_assetid_map am on cla.assetId = am.srcAssetId`,
        startText: 'Creating Asset/Label mappings',
        finishText: 'Created Asset/Label mappings'
      },
      cloneStigMappingsWithReviews: {
        query: `INSERT INTO stig_asset_map (benchmarkId, assetId, minTs, maxTs, saved, savedResultEngine, submitted, submittedResultEngine, rejected, rejectedResultEngine, accepted, acceptedResultEngine, highCount, mediumCount, lowCount, notchecked, notcheckedResultEngine, notapplicable, notapplicableResultEngine, pass, passResultEngine, fail, failResultEngine, unknown, unknownResultEngine, error, errorResultEngine, notselected, notselectedResultEngine, informational, informationalResultEngine, fixed, fixedResultEngine, maxTouchTs) SELECT benchmarkId, am.destAssetId, minTs, maxTs, saved, savedResultEngine, submitted, submittedResultEngine, rejected, rejectedResultEngine, accepted, acceptedResultEngine, highCount, mediumCount, lowCount, notchecked, notcheckedResultEngine, notapplicable, notapplicableResultEngine, pass, passResultEngine, fail, failResultEngine, unknown, unknownResultEngine, error, errorResultEngine, notselected, notselectedResultEngine, informational, informationalResultEngine, fixed, fixedResultEngine, maxTouchTs FROM stig_asset_map sa INNER JOIN t_assetid_map am on sa.assetId = am.srcAssetId`,
        startText: 'Creating Asset/STIG mappings with Metrics',
        finishText: 'Created Asset/STIG mappings with Metrics'
      },
      cloneStigMappingsWithoutReviews: {
        query: `INSERT INTO stig_asset_map (benchmarkId, assetId) SELECT benchmarkId, am.destAssetId FROM stig_asset_map sa INNER JOIN t_assetid_map am on sa.assetId = am.srcAssetId`,
        startText: 'Creating Asset/STIG mappings',
        finishText: 'Created Asset/STIG mappings'
      },
      cloneRestrictedUserGrants: {
        query: `INSERT INTO user_stig_asset_map (userId, saId) SELECT usa.userId, sa2.saId FROM stig_asset_map sa1 inner join user_stig_asset_map usa on sa1.saId = usa.saId inner join t_assetid_map am on sa1.assetId = am.srcAssetId inner join stig_asset_map sa2 on (am.destAssetId = sa2.assetId and sa1.benchmarkId = sa2.benchmarkId)`,
        startText: 'Creating Restricted User Grants',
        finishText: 'Created Restricted User Grants'
      },
      cloneRevisionsMatchSource: {
        query: `INSERT INTO collection_rev_map (collectionId, benchmarkId, revId) SELECT @destCollectionId, benchmarkId, revId FROM collection_rev_map where collectionId = @srcCollectionId`,
        startText: 'Creating Revision pins',
        finishText: 'Creating Revision pins'
      },
      cloneRevisionsSourceDefaults: {
        query: `INSERT INTO collection_rev_map (collectionId, benchmarkId, revId) SELECT @destCollectionId, benchmarkId, revId FROM default_rev where collectionId = @srcCollectionId`,
        startText: 'Creating Revision pins',
        finishText: 'Creating Revision pins'
      },
      insertDefaultRev: {
        query: `INSERT INTO default_rev(collectionId, benchmarkId, revId, revisionPinned) SELECT collectionId, benchmarkId, revId, revisionPinned FROM v_default_rev WHERE collectionId = @destCollectionId`,
        startText: 'Creating Revision pins',
        finishText: 'Created Revision pins'
      },

      countReviewIds: {
        query: `SELECT count(seq) as reviewCount from t_reviewId_list`,
        startText: 'Creating Reviews',
        finishText: 'Creating Reviews'
      },
      dropReviewIdList: {
        query: `DROP TEMPORARY TABLE IF EXISTS t_reviewId_list`,
        startText: 'Creating Reviews',
        finishText: 'Creating Reviews'
      },
      createReviewIdList: {
        query: `CREATE TEMPORARY TABLE t_reviewId_list (seq INT AUTO_INCREMENT PRIMARY KEY)
      SELECT r.reviewId, am.destAssetId FROM asset a inner join t_assetid_map am on a.assetId = am.srcAssetId inner join review r on am.srcAssetId = r.assetId `,
      startText: 'Creating Reviews',
      finishText: 'Creating Reviews'
      },
      
      cloneReviews: {
        query: `INSERT INTO review (assetId, ruleId, resultId, detail, comment, autoResult, ts, userId, statusId, statusText, statusUserId, statusTs, metadata, resultEngine, version, checkDigest)
        SELECT rl.destAssetId, r.ruleId, r.resultId, r.detail, r.comment, r.autoResult, r.ts, r.userId, r.statusId, r.statusText, r.statusUserId, r.statusTs, r.metadata, r.resultEngine, r.version, r.checkDigest
        FROM
        t_reviewId_list rl
        left join review r using (reviewId)
        WHERE
        rl.seq >= ? and rl.seq <= ?`,
        startText: 'Creating Reviews',
        finishText: 'Created Reviews'
      },

      enableCollection: `UPDATE collection SET state = "enabled" WHERE collectionId = @destCollectionId`
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = false
    connection.query('set @srcCollectionId = ?, @userId = ?, @name = ?, @description = ?', [
      parseInt(collectionId),
      parseInt(userObject.userId),
      name,
      description
    ])

    const collectionQueries = ['cloneCollection', 'selectLastInsertId']
    const reviewQueries = []

    if (options.grants) {
      collectionQueries.push('cloneGrants')
    }
    collectionQueries.push('insertOwnerGrant')

    if (options.labels) {
      collectionQueries.push('cloneLabels')
    }

    if (options.assets) {
      collectionQueries.push('cloneAssets', 'dropAssetMap', 'createAssetMap')
      if (options.labels) {
        collectionQueries.push('dropLabelMap', 'createLabelMap', 'cloneAssetLabels')
      }
      if (options.stigMappings !== 'none') {
        collectionQueries.push(options.stigMappings === 'withReviews' ? 'cloneStigMappingsWithReviews' : 'cloneStigMappingsWithoutReviews')
        if (options.grants) {
          collectionQueries.push('cloneRestrictedUserGrants')
        }
        collectionQueries.push(options.pinRevisions === 'matchSource' ? 'cloneRevisionsMatchSource' : 'cloneRevisionsSourceDefaults')
        collectionQueries.push('insertDefaultRev')
      }
      if (options.stigMappings === 'withReviews') {
        reviewQueries.push('dropReviewIdList', 'createReviewIdList', 'cloneReviews')
      }
    }

    async function transactionCollection () {
      const stage = 'collection'
      const stepCount = collectionQueries.length + 1
      progressJson = {stage, stepCount, step: 0}

      await connection.query('START TRANSACTION')

      for (const query of collectionQueries) {
        progressJson.step++
        progressJson.stepName = query
        progressJson.status = 'running'
        progressJson.message = sql[query].startText
        progressCb(progressJson) 

        await connection.query(sql[query].query)
      }

      progressJson.step++
      progressJson.stepName = 'commit'
      progressJson.status = 'running'
      progressJson.message = 'Saving Collection'
      progressCb(progressJson) 

      await connection.commit()

      progressJson.status = 'finished'
      progressJson.message = 'Saved Collection'
      progressCb(progressJson) 
    }

    async function transactionReviews () {
      const stage = 'reviews'
      const stepCount = reviewQueries.length + 1
      progressJson = {stage, stepCount, step: 0}

      await connection.query('START TRANSACTION')
      for (const query of reviewQueries) {
        progressJson.stepName = query
        progressJson.step++
        progressJson.message = sql[query].startText

        if (query === 'cloneReviews') {
          let offset = 1
          const chunkSize = 10000

          let [result] = await connection.query(sql.countReviewIds.query)

          progressJson.status = 'running'
          progressJson.reviewsTotal = result[0].reviewCount
          progressJson.reviewsCopied = 0
          progressCb(progressJson) 

          do {
            [result] = await connection.query(sql[query].query, [offset, offset + chunkSize - 1])
            if (result.affectedRows != 0) {
              progressJson.reviewsCopied += result.affectedRows
              progressCb(progressJson) 
            }
            offset += chunkSize
          } while (result.affectedRows != 0)
        }
        else {
          progressJson.status = 'running'
          progressCb(progressJson)
          await connection.query(sql[query].query)
        }
      }
      progressJson.step++
      progressJson.stepName = 'commit'
      progressJson.status = 'running'
      progressCb(progressJson) 

      await connection.commit()

      progressJson.status = 'finished'
      progressCb(progressJson) 
    }

    await dbUtils.retryOnDeadlock(transactionCollection, svcStatus)
    await dbUtils.retryOnDeadlock(transactionReviews, svcStatus)
    await connection.query(sql.enableCollection)
    const [rows] = await connection.query(`SELECT @destCollectionId as destCollectionId`)
    return rows[0]
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    progressJson.status = 'error'
    if (err.message.match(/Duplicate entry .* for key 'collection.index[2|3]'/)) {
      progressJson.message = 'The requested Collection name is unavailable'
    }
    else {
      progressJson.message = 'Unhandled error'
      progressJson.error = err
      progressJson.stack = err?.stack
    }
    progressCb(progressJson)
    return null
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.exportToCollection = async function ({srcCollectionId, dstCollectionId, assetStigArguments, userObject, svcStatus = {}, progressCb = () => {}}) {
  let connection, progressJson
  try {
    const sql = {
      dropArg: {
        query: `drop temporary table if exists t_arg`,
        runningText: 'Preparing data'
      },
      createArg: {
        query: `create temporary table t_arg (
          assetId INT,
          assetName VARCHAR(255),
          benchmarkId VARCHAR(255),
          revisionStr VARCHAR(255),
          UNIQUE INDEX (assetId, benchmarkId, revisionStr),
          INDEX (assetName)
        )
        select * from
        json_table(
          @json, 
          "$[*]"
          COLUMNS(
          assetId INT path "$.assetId",
            assetName VARCHAR(255) path "$.assetName",
            nested path "$.stigs[*]" COLUMNS(
              benchmarkId VARCHAR(255) path "$.benchmarkId",
              revisionStr VARCHAR(255) path "$.revisionStr"
            )
          )
        ) as arg`,
        runningText: 'Preparing data'
      },
      dropCollectionSetting: {
        query: `drop temporary table if exists t_collection_setting`,
        runningText: 'Preparing data'
      },
      createCollectionSetting: {
        query: `create temporary table t_collection_setting
        SELECT 
          c.settings->>"$.fields.detail.required" as detailRequired,
          c.settings->>"$.fields.comment.required" as commentRequired,
          c.settings->>"$.status.canAccept" as canAccept,
          c.settings->>"$.status.resetCriteria" as resetCriteria,
          c.settings->>"$.status.minAcceptGrant" as minAcceptGrant,
          c.settings->>"$.history.maxReviews" as historyMax
        FROM
          collection c
        where
          collectionId = @dstCollectionId`,
          runningText: 'Preparing data'
      },
      dropSrcReviewId: {
        query: `drop temporary table if exists t_src_reviewId`,
        runningText: 'Preparing data'
      },
      createSrcReviewId: {
        query: `create temporary table t_src_reviewId (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT UNIQUE )
        select
          r.reviewId
        from
          t_arg
          left join revision rev on (t_arg.benchmarkId collate utf8mb4_0900_as_cs = rev.benchmarkId and t_arg.revisionStr = rev.revisionStr)
          left join rev_group_rule_map rgr on (rev.revId = rgr.revId)
          left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
          inner join review r on (rvcd.version = r.version and rvcd.checkDigest = r.checkDigest and t_arg.assetId = r.assetId)`,
          runningText: 'Preparing data'
      },
      countSrcReviewId: {
        query: `select count(*) as total from t_src_reviewId`,
        runningText: 'Preparing data'
      },
      insertAsset: {
        query: `INSERT into asset (name, fqdn, collectionId, ip, mac, description, noncomputing, metadata, state, stateDate, stateUserId)
        SELECT
          srcAsset.name,
          srcAsset.fqdn,
          @dstCollectionId,
          srcAsset.ip,
          srcAsset.mac,
          srcAsset.description,
          srcAsset.noncomputing,
          srcAsset.metadata,
          'enabled',
          NOW(),
          @userId
        FROM
          t_arg
          left join asset srcAsset on (t_arg.assetId = srcAsset.assetId and srcAsset.isEnabled = 1)
          left join asset dstAsset on (t_arg.assetName = dstAsset.name and dstAsset.collectionId = @dstCollectionId and dstAsset.isEnabled = 1)
        WHERE
          dstAsset.assetId is null
        GROUP BY
          t_arg.assetId`,
        runningText: "Preparing Assets"
      },
      dropAssetIdMap: {
        query: `drop temporary table if exists t_assetId_map`,
        runningText: "Preparing Assets"
      },
      createAssetIdMap: {
        query: `create temporary table t_assetId_map (
          srcAssetId INT,
          dstAssetId INT,
          INDEX (srcAssetId),
          INDEX (dstAssetId)
        )
        select
          srcAsset.assetId as srcAssetId,
          dstAsset.assetId as dstAssetId
        from
          t_arg
          inner join asset srcAsset on (t_arg.assetId = srcAsset.assetId)
          inner join asset dstAsset on (t_arg.assetName = dstAsset.name and dstAsset.collectionId = @dstCollectionId)
        group by
          srcAsset.assetId, dstAsset.assetId`,
          runningText: "Preparing Assets"
      },
      insertStigAssetMap: {
        query: `INSERT into stig_asset_map (assetId, benchmarkId)
        select
          a.assetId,
          t_arg.benchmarkId
        from
          t_arg
          left join asset a on (t_arg.assetName = a.name and a.collectionId = @dstCollectionId and a.isEnabled = 1)
          left join stig_asset_map sa on (t_arg.benchmarkId collate utf8mb4_0900_as_cs = sa.benchmarkId and a.assetId = sa.assetId)
        where
          sa.saId is null`,
          runningText: "Preparing Assets"
      },
      selectStigAssetMap: {
        query: `select
          sa.saId
        from
          t_arg
          left join asset a on (t_arg.assetName = a.name and a.collectionId = @dstCollectionId and a.isEnabled = 1)
          left join stig_asset_map sa on (t_arg.benchmarkId collate utf8mb4_0900_as_cs = sa.benchmarkId and a.assetId = sa.assetId)`
      },
      deleteDefaultRev: {
        query: `DELETE FROM default_rev where collectionId = @dstCollectionId`,
        runningText: "Preparing Assets"
      },
      insertDefaultRev: {
        query: `INSERT INTO default_rev(collectionId, benchmarkId, revId, revisionPinned) SELECT collectionId, benchmarkId, revId, revisionPinned FROM v_default_rev where collectionId = @dstCollectionId`,
        finishText: 'Created Asset/STIG maps',
        runningText: "Preparing Assets"
      },
      dropIncomingReview: {
        query: `drop temporary table if exists t_incoming_review`,
        runningText: `Preparing reviews`,
        finishText: `Preparing reviews`
      },
      createIncomingReview: {
        query: `create temporary table t_incoming_review
        select
          dstReview.reviewId,
          t_assetId_map.dstAssetId as assetId,
          srcReview.version,
          srcReview.checkDigest,
          srcReview.ruleId,
          srcReview.resultId,
          srcReview.detail, 
          srcReview.comment, 
          srcReview.resultEngine, 
          srcReview.metadata,
          UTC_TIMESTAMP() as ts,
          @userId as userId,
          CASE WHEN dstReview.reviewId is null or rStatusReset.reviewId is not null
            THEN 0
            ELSE dstReview.statusId
          END as statusId,	
          CASE WHEN dstReview.reviewId is null
            THEN ''
            ELSE
              CASE WHEN rStatusReset.reviewId is not null
                THEN 'Status reset due to a Review change or Collection setting'
                ELSE dstReview.statusText
            END
          END as statusText,	
          CASE WHEN dstReview.reviewId is null or rStatusReset.reviewId is not null
            THEN UTC_TIMESTAMP()
          ELSE dstReview.statusTs
          END as statusTs,	
          CASE WHEN dstReview.reviewId is null or rStatusReset.reviewId is not null
            THEN @userId
          ELSE dstReview.statusUserId
           END as statusUserId	
        from
          t_src_reviewId
          left join t_collection_setting on true
          inner join review srcReview on (t_src_reviewId.reviewId = srcReview.reviewId)
          left join t_assetId_map on (srcReview.assetId = t_assetId_map.srcAssetId)
          left join review dstReview on (srcReview.version = dstReview.version and srcReview.checkDigest = dstReview.checkDigest and t_assetId_map.dstAssetId = dstReview.assetId) 
          left join review rChangedResult on (
            dstReview.reviewId = rChangedResult.reviewId 
            and 0 != rChangedResult.statusId
            and srcReview.resultId != rChangedResult.resultId
          )
          left join review rChangedAny on (
            dstReview.reviewId  = rChangedAny.reviewId 
            and 0 != rChangedAny.statusId
            and (srcReview.resultId != rChangedAny.resultId or srcReview.detail != rChangedAny.detail or srcReview.comment != rChangedAny.comment)
          )
          left join review rStatusReset on (
            dstReview.reviewId = rStatusReset.reviewId and (
              (t_collection_setting.resetCriteria = 'result' and rChangedResult.reviewId is not null)
            or (t_collection_setting.resetCriteria = 'any' and rChangedAny.reviewId is not null)
            or (t_collection_setting.detailRequired = 'always' and srcReview.detail = '')
            or (t_collection_setting.commentRequired = 'always' and srcReview.comment = '')
            or (t_collection_setting.detailRequired = 'findings' and srcReview.resultId = 4 and srcReview.detail = '')
            or (t_collection_setting.commentRequired = 'findings' and srcReview.resultId = 4 and srcReview.comment = '')
            )
          )
        where
          t_src_reviewId.seq >= ? and t_src_reviewId.seq <= ?`,
        runningText: `Preparing reviews`,
        finishText: `Preparing reviews`
      },
      countIncomingReview: {
        query: `select sum(reviewId is null) as inserted, sum(reviewId is not null) as updated from t_incoming_review`,
        runningText: `Preparing reviews`,

      },
      pruneHistory: {
        query: `with historyRecs AS (
          select
            rh.historyId,
            ROW_NUMBER() OVER (PARTITION BY r.assetId, r.version, r.checkDigest ORDER BY rh.historyId DESC) as rowNum
          from
            review_history rh
            inner join t_incoming_review r using (reviewId)
          )
        delete review_history
        FROM 
           review_history
           left join historyRecs on review_history.historyId = historyRecs.historyId 
        WHERE 
           historyRecs.rowNum > ((select historyMax from t_collection_setting) - 1)`,
           runningText: `Preparing reviews`,
           finishText: `Preparing reviews`
      },
      insertHistory: {
        query: `INSERT INTO review_history (
            reviewId,
            ruleId,
            resultId,
            detail,
            comment,
            autoResult,
            ts,
            userId,
            statusText,
            statusUserId,
            statusTs,
            statusId,
            touchTs,
            resultEngine)
          SELECT 
            r.reviewId,
            r.ruleId,
            r.resultId,
            LEFT(r.detail,32767) as detail,
            LEFT(r.comment,32767) as comment,
            r.autoResult,
            r.ts,
            r.userId,
            r.statusText,
            r.statusUserId,
            r.statusTs,
            r.statusId,
            r.touchTs,
            r.resultEngine
          FROM
            review r
            inner join t_incoming_review using (reviewId)`,
          runningText: `Preparing reviews`,
          finishText: `Prepared reviews`
      },
      upsertReview: {
        query: `insert into review (reviewId, assetId, version, checkDigest, ruleId, resultId, detail, comment, resultEngine, metadata, ts, userId, statusId, statusText, statusTs, statusUserId)
        select * from t_incoming_review as r
        on duplicate key update
          ruleId = r.ruleId,
          resultId = r.resultId,
          detail = r.detail,
          comment = r.comment,
          ts = r.ts,
          userId = r.userId,
          statusId = r.statusId,
          statusText = r.statusText,
          statusUserId = r.statusUserId,
          statusTs = r.statusTs,
          metadata = r.metadata,
          resultEngine = r.resultEngine`
      }
    }
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = false
    connection.query('set @srcCollectionId = ?, @dstCollectionId = ?, @userId = ?, @json = ?',
    [parseInt(srcCollectionId), parseInt(dstCollectionId), parseInt(userObject.userId), JSON.stringify(assetStigArguments)])
    const prepQueries = ['dropArg', 'createArg', 'dropCollectionSetting', 'createCollectionSetting', 'dropSrcReviewId', 'createSrcReviewId']
    const assetQueries = ['insertAsset', 'dropAssetIdMap', 'createAssetIdMap', 'insertStigAssetMap', 'deleteDefaultRev', 'insertDefaultRev']
    const reviewExportQueries = ['pruneHistory', 'insertHistory', 'upsertReview']
    const counts = {
      assetsCreated: 0,
      stigsMapped: 0,
      reviewsInserted: 0,
      reviewsUpdated: 0
    }

    async function transaction () {
      progressJson = {
        stage: 'prepare',
        stepCount: prepQueries.length,
        step: 0
      }

      await connection.query('START TRANSACTION')
      for (const query of prepQueries) {
        progressJson.step++
        progressJson.stepName = query
        progressJson.status = 'running'
        progressJson.message = sql[query].runningText
        progressCb(progressJson) 
        await connection.query(sql[query].query)
      }

      progressJson.stage = 'assets'
      progressJson.stepCount = assetQueries.length
      progressJson.step = 0
      for (const query of assetQueries) {
        progressJson.step++
        progressJson.stepName = query
        progressJson.status = 'running'
        progressJson.message = sql[query].runningText
        progressCb(progressJson)

        const [result] = await connection.query(sql[query].query)
        if (query === 'insertAsset') {
          counts.assetsCreated = result.affectedRows
        }
        if (query === 'insertStigAssetMap') {
          counts.stigsMapped = result.affectedRows
        }
      }

      const [count] = await connection.query(sql.countSrcReviewId.query)
      let offset = 1
      const chunkSize = 10000
      let result

      progressJson = {
        stage: 'reviews',
        status: 'running',
        reviewsTotal: count[0].total,
        reviewsExported: 0
      }
      progressCb(progressJson)
      do {
        await connection.query(sql.dropIncomingReview.query)
        ;[result] = await connection.query(sql.createIncomingReview.query, [offset, offset + chunkSize - 1])
        if (result.affectedRows != 0) {
          const [count] = await connection.query(sql.countIncomingReview.query)
          counts.reviewsInserted += count[0].inserted
          counts.reviewsUpdated += count[0].updated
          for (const query of reviewExportQueries) {
            await connection.query(sql[query].query)
          }
          progressJson.reviewsExported += result.affectedRows
          progressCb(progressJson) 
        }
        offset += chunkSize
      } while (result.affectedRows != 0)

      const [saIdResult]  = await connection.query(sql.selectStigAssetMap.query)
      progressJson = {
        stage: 'metrics',
        status: 'running',
        metricsTotal: saIdResult.length,
        metricsUpdated: 0
      }
      progressCb(progressJson)
      const increment = 1000
      for (let i = 0; i < saIdResult.length; i+=increment) {
        const saIds = saIdResult.slice(i, i + increment).map(row => row.saId)
        await dbUtils.updateStatsAssetStig(connection, {saIds})
        progressJson.metricsUpdated += saIds.length
        progressCb(progressJson)
      }

      progressJson = {
        stage: 'commit',
        status: 'running'
      }
      progressCb(progressJson) 
      await connection.commit()

      progressCb({
        stage: 'result',
        counts
      }) 
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    progressJson.status = 'error'
    progressJson.message = 'Unhandled error'
    progressJson.error = err
    progressJson.stack = err?.stack
    progressCb({progressJson})
    return null
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}
