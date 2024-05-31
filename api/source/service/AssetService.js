'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config')
const uuid = require('uuid')

let _this = this

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  const columns = [
    'CAST(a.assetId as char) as assetId',
    'a.name',
    'a.fqdn',
    `json_object (
      'collectionId', CAST(c.collectionId as char),
      'name', c.name
    ) as "collection"`,
    'a.description',
    'a.ip',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = a.assetId),
      json_array()
    ) as labelIds`,
    'a.mac',
    'a.noncomputing',
    'a.metadata'
  ]
  const joins = [
    'asset a',
    'left join collection c on a.collectionId = c.collectionId',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId'
  ]

  // PROJECTIONS
  if (inProjection.includes('statusStats')) {
    columns.push(`(select json_object(
      'stigCount', COUNT(saStatusStats.benchmarkId),
      'ruleCount', SUM(rStatusStats.ruleCount),
      'acceptedCount', SUM(saStatusStats.accepted),
      'rejectedCount', SUM(saStatusStats.rejected),
      'submittedCount', SUM(saStatusStats.submitted),
      'savedCount', SUM(saStatusStats.saved),
      'minTs', DATE_FORMAT(LEAST(MIN(saStatusStats.minTs), MIN(saStatusStats.maxTs)),'%Y-%m-%dT%H:%i:%sZ'),
      'maxTs', DATE_FORMAT(GREATEST(MAX(saStatusStats.minTs), MAX(saStatusStats.maxTs)),'%Y-%m-%dT%H:%i:%sZ')
      )
      from
		    stig_asset_map saStatusStats
        left join asset aStatusStats using (assetId)
        left join default_rev drStatusStats on (saStatusStats.benchmarkId = drStatusStats.benchmarkId and aStatusStats.collectionId = drStatusStats.collectionId)
        left join revision rStatusStats on drStatusStats.revId = rStatusStats.revId
	    where
        FIND_IN_SET(saStatusStats.saId, GROUP_CONCAT(sa.saId))
      ) as "statusStats"`)
  }
  if (inProjection.includes('stigGrants')) {
    columns.push(`(select
      CASE WHEN COUNT(byStig.stigAssetUsers) > 0 THEN json_arrayagg(byStig.stigAssetUsers) ELSE json_array() END
    from
      (select
        json_object('benchmarkId', r.benchmarkId, 'users',
        -- empty array on null handling 
        case when count(r.users) > 0 then json_arrayagg(r.users) else json_array() end ) as stigAssetUsers
      from
      (select
        sa.benchmarkId,
        -- if no user, return null instead of object with null property values
        case when ud.userId is not null then
          json_object(
            'userId', CAST(ud.userId as char), 
            'username', ud.username
          ) 
        else NULL end as users
        FROM 
          stig_asset_map sa
          left join user_stig_asset_map usa on sa.saId = usa.saId
          left join user_data ud on usa.userId = ud.userId
        WHERE
        sa.assetId = a.assetId) as r
      group by r.benchmarkId) as byStig) as "stigGrants"`)
  }
  if ( inProjection.includes('reviewers')) {
    // This projection is only available for endpoint /stigs/{benchmarkId}/assets
    // Subquery relies on predicate :benchmarkId being set
    columns.push(`(select
        case when count(u.userId > 0) then json_arrayagg(
        -- if no user, return null instead of object with null property values
        case when u.userId is not null then json_object('userId', CAST(u.userId as char), 'username', u.username) else NULL end) 
        else json_array() end as reviewers
      FROM 
        stig_asset_map sa
        left join user_stig_asset_map usa on sa.saId = usa.saId
        left join user u on usa.userId = u.userId
      WHERE
        sa.assetId = a.assetId and sa.benchmarkId = :benchmarkId) as "reviewers"`)
  }
  if (inProjection.includes('stigs')) {
    //TODO: If benchmarkId is a predicate in main query, this incorrectly only shows that STIG
    joins.push('left join default_rev dr on (sa.benchmarkId=dr.benchmarkId and a.collectionId = dr.collectionId)')
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

    // joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
    // joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
    // columns.push(`cast(
    //   concat('[', 
    //     coalesce (
    //       group_concat(distinct 
    //         case when cr.benchmarkId is not null then 
    //           json_object(
    //             'benchmarkId', cr.benchmarkId, 
    //             'lastRevisionStr', concat('V', cr.version, 'R', cr.release), 
    //             'lastRevisionDate', date_format(cr.benchmarkDateSql,'%Y-%m-%d'),
    //             'title', st.title,
    //             'ruleCount', cr.ruleCount,
    //             'revisionStrs', (select json_arrayagg(concat('V', rev2.version, 'R', rev2.release)) from revision rev2 where rev2.benchmarkId = cr.benchmarkId ))
    //         else null end 
    //   order by cr.benchmarkId),
    //       ''),
    //   ']')
    // as json) as "stigs"`)
  }

  // PREDICATES
  const predicates = {
    statements: [
      `a.state = "enabled"`,
      `c.state = "enabled"`
    ],
    binds: []
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push(inPredicates.assetId)
  }
  if (inPredicates.labels?.labelNames || inPredicates.labels?.labelIds || inPredicates.labels?.labelMatch) {
    joins.push(
      'left join collection_label_asset_map cla2 on a.assetId = cla2.assetId',
      'left join collection_label cl2 on cla2.clId = cl2.clId'
    )
    const labelPredicates = []
    if (inPredicates.labels.labelIds) {
      labelPredicates.push('cl2.uuid IN ?')
      const uuidBinds = inPredicates.labels.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (inPredicates.labels.labelNames) {
      labelPredicates.push('cl2.name IN ?')
      predicates.binds.push([inPredicates.labels.labelNames])
    }
    if (inPredicates.labels.labelMatch === 'null') {
      labelPredicates.push('cl2.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    predicates.statements.push(labelPredicatesClause)
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
    predicates.statements.push(`a.name ${matchStr}`)
    predicates.binds.push(inPredicates.name)
  }
  if (inPredicates.collectionId) {
    predicates.statements.push('a.collectionId = ?')
    predicates.binds.push(inPredicates.collectionId)
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push(inPredicates.benchmarkId)
  }
  if ( inPredicates.metadata ) {
    for (const pair of inPredicates.metadata) {
      const [key, value] = pair.split(':')
      predicates.statements.push('JSON_CONTAINS(a.metadata, ?, ?)')
      predicates.binds.push( `"${value}"`,  `$.${key}`)
    }
  }
  predicates.statements.push('cg.userId = ?')
  predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
  predicates.binds.push(userObject.userId)

  const groupBy = [
    'a.assetId'
  ]
  const orderBy = []

  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.queryStigsByAsset = async function (inPredicates = {}, elevate = false, userObject) {
  const columns = [
    'distinct sa.benchmarkId', 
    `concat('V', rev.version, 'R', rev.release) as revisionStr`, 
    `date_format(rev.benchmarkDateSql,'%Y-%m-%d') as revisionDate`,
    'rev.ruleCount as ruleCount'
  ]
  const joins = [
    'asset a',
    'left join collection c on a.collectionId = c.collectionId',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId',
    'inner join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)',
    'left join revision rev on dr.revId = rev.revId'
  ]
  // PREDICATES
  const predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push( inPredicates.assetId )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  predicates.statements.push('cg.userId = ?')
  predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
  predicates.binds.push( userObject.userId )
  const orderBy = ['sa.benchmarkId']

  // CONSTRUCT MAIN QUERY
  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})

  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.queryUsersByAssetStig = async function (inPredicates = {}, elevate = false, userObject) {
  const columns = [
    'CAST(ud.userId as char) as userId',
    'ud.username'
  ]
  const joins = [
    'asset a',
    'inner join collection c on a.collectionId = c.collectionId',
    'inner join collection_grant cg on c.collectionId = cg.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'inner join user_stig_asset_map usa on sa.saId = usa.saId',
    'inner join user_data ud on usa.userId = ud.userId',
  ]
  // PREDICATES
  const predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push( inPredicates.assetId )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  if (inPredicates.userId) {
    predicates.statements.push('usa.userId = ?')
    predicates.binds.push( inPredicates.userId )
  }
  predicates.statements.push('cg.userId = ?')
  predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
  predicates.binds.push( userObject.userId )
  const orderBy = ['ud.userId']

  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.addOrUpdateAsset = async function ( {writeAction, assetId, body, projection, currentCollectionId, transferring, userObject, svcStatus = {}} ) {
  let connection
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let binds
    let { stigs, labelIds, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('noncomputing')) {
      assetFields.noncomputing = assetFields.noncomputing ? 1 : 0
    }
    if (assetFields.hasOwnProperty('metadata')) {
      assetFields.metadata = JSON.stringify(assetFields.metadata)
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION')

      // Process scalar properties
      binds = { ...assetFields}
  
      if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
        // INSERT into assets
        let sqlInsert =
          `INSERT INTO
              asset
              (name, fqdn, ip, mac, description, collectionId, noncomputing, metadata)
            VALUES
              (:name, :fqdn, :ip, :mac, :description, :collectionId, :noncomputing, :metadata)`
        let [rows] = await connection.query(sqlInsert, binds)
        assetId = rows.insertId
        currentCollectionId = assetFields.collectionId
      }
      else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
        if (Object.keys(binds).length > 0) {
          // UPDATE into assets
          let sqlUpdate =
            `UPDATE
                asset
              SET
                ?
              WHERE
                assetId = ?`
          await connection.query(sqlUpdate, [assetFields, assetId])
          if (transferring) {
            let sqlDeleteRestrictedUsers = 
              `DELETE user_stig_asset_map FROM user_stig_asset_map INNER JOIN stig_asset_map USING (saId) WHERE stig_asset_map.assetId = ?`
            await connection.query(sqlDeleteRestrictedUsers, [assetId])
            
            const sqlGetAssetLabels = `SELECT name, description, color FROM collection_label_asset_map inner join collection_label using (clId) WHERE assetId = ?`
            const [assetLabels] = await connection.query(sqlGetAssetLabels, [assetId])
            
            const sqlDeleteLabels = `DELETE FROM collection_label_asset_map WHERE assetId = ?`
            await connection.query(sqlDeleteLabels, [assetId])

            if (assetLabels.length) {
              const sqlGetCollectionLabels = `SELECT clId, name, description, color FROM collection_label WHERE collectionId = ?`
              const [collectionLabels] = await connection.query(sqlGetCollectionLabels, [transferring.newCollectionId])
              const collectionLabelNames = collectionLabels.reduce( (a,v) => {a[v.name] = v; return a}, {})
              
              for (const assetLabel of assetLabels) {
                if (collectionLabelNames[assetLabel.name]) {
                  await connection.query(`INSERT into collection_label_asset_map (assetId, clId) VALUES (?,?)`, [assetId, collectionLabelNames[assetLabel.name].clId])
                }
                else {
                  const [resultInsert] = await connection.query(`INSERT INTO collection_label (collectionId, name, description, color, uuid) VALUES (?, ?, ?, ?, UUID_TO_BIN(UUID(),1))`, 
                  [transferring.newCollectionId, assetLabel.name, assetLabel.description, assetLabel.color])
                  const clId = resultInsert.insertId
                  await connection.query(`INSERT into collection_label_asset_map (assetId, clId) VALUES (?,?)`, [assetId, clId])
                }
              } 
            }
          }
        }
      }
      else {
        throw('Invalid writeAction')
      }
  
      // Process stigs, spec requires for CREATE/REPLACE not for UPDATE
      if (stigs) {
        if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
          let sqlDeleteBenchmarks = `
            DELETE FROM 
              stig_asset_map
            WHERE 
              assetId = ?`
          if (stigs.length > 0) {
            sqlDeleteBenchmarks += ` and benchmarkId NOT IN ?`
          }
          // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
          await connection.query(sqlDeleteBenchmarks, [ assetId, [stigs] ])
        }
        if (stigs.length > 0) {
          // Map bind values
          let stigAssetMapBinds = stigs.map( benchmarkId => [benchmarkId, assetId])
          // INSERT into stig_asset_map
          let sqlInsertBenchmarks = `
            INSERT IGNORE INTO 
              stig_asset_map (benchmarkId, assetId)
            VALUES
              ?`
          await connection.query(sqlInsertBenchmarks, [stigAssetMapBinds])
        }
      }
  
      // Process labelIds, spec requires for CREATE/REPLACE not for UPDATE
      if (labelIds) {
        if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
          let sqlDeleteLabels = `
            DELETE FROM 
              collection_label_asset_map
            WHERE 
              assetId = ?`
          await connection.query(sqlDeleteLabels, [ assetId ])
        }
        if (labelIds.length > 0) {      
          let uuidBinds = labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
          // INSERT into stig_asset_map
          let sqlInsertLabels = `
            INSERT INTO collection_label_asset_map (assetId, clId) 
              SELECT
                ?,
                clId
              FROM
                collection_label
              WHERE
                uuid IN (?) and collectionId = ?`
          await connection.query(sqlInsertLabels, [assetId, uuidBinds, assetFields.collectionId])
        }
      }

      if (stigs || transferring) {
        await dbUtils.pruneCollectionRevMap(connection)
        if (transferring) {
          await dbUtils.updateDefaultRev(connection, {collectionIds: [transferring.oldCollectionId, transferring.newCollectionId]})
        }
        else {
          await dbUtils.updateDefaultRev(connection, {collectionId: currentCollectionId})
        }
        await dbUtils.updateStatsAssetStig( connection, {assetId} ) 
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

  // Fetch the new or updated Asset for the response
  try {
    let row = await _this.getAsset(assetId, projection, false, userObject)
    return row
  }
  catch (err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }  
}

exports.queryChecklist = async function (inProjection, inPredicates, elevate, userObject) {
  let connection
  try {
    const columns = [
      'CAST(:assetId as char) as "assetId"',
      'rgr.ruleId',
      'rgr.title as "ruleTitle"',
      'rgr.version',
      'rgr.groupId',
      'rgr.groupTitle',
      'rgr.severity',
      `result.api as "result"`,
      `CASE WHEN review.resultEngine = 0 THEN NULL ELSE review.resultEngine END as resultEngine`,
      `review.autoResult`,
      `status.api as "status"`,
      `review.statusTs`,
      `review.ts`,
      `review.touchTs`
    ]
    const joins = [
      'current_rev rev',
      'left join rev_group_rule_map rgr using (revId)',
      'left join rule_version_check_digest rvcd using (ruleId)',
      'left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = :assetId)',
      'left join result on review.resultId=result.resultId',
      'left join status on review.statusId=status.statusId',
      'left join asset a on review.assetId=a.assetId and a.state = "enabled"'
    ]
    const predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.assetId) {
      predicates.binds.assetId = inPredicates.assetId
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('rev.benchmarkId = :benchmarkId')
      predicates.binds.benchmarkId = inPredicates.benchmarkId
    }
    if (inPredicates.revisionStr !== 'latest') {
      joins.splice(0, 1, 'revision rev')
      const {version, release} = dbUtils.parseRevisionStr(inPredicates.revisionStr)
      const revId =  `${inPredicates.benchmarkId}-${version}-${release}`
      predicates.statements.push('rev.revId = :revId')
      predicates.binds.revId = revId
    }
    const groupBy = [
      'rgr.rgrId',
      'result.api',
      'review.reviewId',
      'status.api',
    ]
    const orderBy = [
      'substring(rgr.groupId from 3) + 0'
    ]

    const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy}) 
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true

    let [rows] = await connection.query( sql, predicates.binds )
    return (rows)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.queryStigAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  const columns = [
    'DISTINCT CAST(a.assetId as char) as assetId',
    'a.name',
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
    'CAST(a.collectionId as char) as collectionId'
  ]
  const joins = [
    'collection c',
    'left join collection_grant cg on c.collectionId = cg.collectionId',
    'inner join asset a on c.collectionId = a.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId'
  ]
  // PROJECTIONS
  if (inProjection.includes('restrictedUserAccess')) {
    joins.push('left join user_data ud on usa.userId = ud.userId')
    columns.push(`cast(
      concat('[', 
        coalesce (
          group_concat(distinct 
            case when ud.userId is not null then 
              json_object(
                'userId', cast(ud.userId as char), 
                'username', ud.username)
            else null end 
          order by ud.username),
          ''),
      ']')
    as json) as "restrictedUserAccess"`)
  }
  // PREDICATES
  const predicates = {
    statements: [
      'a.state = "enabled"'
    ],
    binds: []
  }
  if (inPredicates.collectionId) {
    // Mandatory by OpenAPI spec
    predicates.statements.push('c.collectionId = ?')
    predicates.binds.push( inPredicates.collectionId )
  }
  if (inPredicates.benchmarkId) {
    // Mandatory by OpenAPI spec
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  if (inPredicates.labels?.labelNames || inPredicates.labels?.labelIds || inPredicates.labels?.labelMatch) {
    joins.push(
      'left join collection_label_asset_map cla2 on a.assetId = cla2.assetId',
      'left join collection_label cl2 on cla2.clId = cl2.clId'
    )
    const labelPredicates = []
    if (inPredicates.labels.labelIds) {
      labelPredicates.push('cl2.uuid IN ?')
      const uuidBinds = inPredicates.labels.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (inPredicates.labels.labelNames) {
      labelPredicates.push('cl2.name IN ?')
      predicates.binds.push([inPredicates.labels.labelNames])
    }
    if (inPredicates.labels.labelMatch === 'null') {
      labelPredicates.push('cl2.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    predicates.statements.push(labelPredicatesClause)
  }
  predicates.statements.push('cg.userId = ?')
  predicates.statements.push('CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END')
  predicates.binds.push( userObject.userId )
  const groupBy = [ 'a.assetId', 'a.name', 'a.collectionId' ]
  const orderBy = [ 'a.name' ]

  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})  
  let [rows] = await dbUtils.pool.query(sql, predicates.binds)
  return (rows)
}

exports.cklFromAssetStigs = async function cklFromAssetStigs (assetId, stigs, elevate, userObject) {
  let connection
  try {
    let revisionStrResolved // Will hold specific revision string value, as opposed to "latest" 
    const xmlJs = {
      CHECKLIST: {
        ASSET: {
          ROLE: 'None',
          ASSET_TYPE: 'Computing',
          MARKING: config.settings.setClassification,
          HOST_NAME: null,
          HOST_IP: null,
          HOST_MAC: null,
          HOST_GUID: null,
          HOST_FQDN: null,
          TECH_AREA: null,
          TARGET_KEY: '2777',
          WEB_OR_DATABASE: 'false',
          WEB_DB_SITE: null,
          WEB_DB_INSTANCE: null
        },
        STIGS: {
          iSTIG: []
        }
      }
    }

    const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from asset where assetId = ? and asset.state = 'enabled'"
    const sqlGetChecklist =`SELECT 
      rgr.groupId,
      rgr.severity,
      rgr.groupTitle,
      rgr.ruleId,
      rgr.title as "ruleTitle",
      rgr.weight,
      rgr.version,
      rgr.vulnDiscussion,
      rgr.iaControls,
      rgr.falsePositives,
      rgr.falseNegatives,
      rgr.documentable,
      rgr.mitigations,
      rgr.potentialImpacts,
      rgr.thirdPartyTools,
      rgr.mitigationControl,
      rgr.responsibility,
      rgr.severityOverrideGuidance,
      result.ckl as "result",
      LEFT(review.detail,32767) as "detail",
      LEFT(review.comment,32767) as "comment",
      cc.content as "checkContent",
      ft.text as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_rule_map rgr on rev.revId = rgr.revId 
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      left join severity_cat_map sc on rgr.severity = sc.severity 
      
      left join rev_group_rule_cci_map rgrcc on rgr.rgrId = rgrcc.rgrId

      left join check_content cc on rgr.checkDigest = cc.digest

      left join fix_text ft on rgr.fixDigest = ft.digest

      left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 

    WHERE
      rev.revId = ?
    GROUP BY
      rgr.rgrId,
      result.ckl,
      review.detail,
      review.comment
    order by
      substring(rgr.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // ASSET
    const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    xmlJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset[0].metadata.cklHostName ? resultGetAsset[0].metadata.cklHostName : resultGetAsset[0].name
    xmlJs.CHECKLIST.ASSET.HOST_FQDN = resultGetAsset[0].fqdn
    xmlJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset[0].ip
    xmlJs.CHECKLIST.ASSET.HOST_MAC = resultGetAsset[0].mac
    xmlJs.CHECKLIST.ASSET.ASSET_TYPE = resultGetAsset[0].noncomputing ? 'Non-Computing' : 'Computing'
    xmlJs.CHECKLIST.ASSET.ROLE = resultGetAsset[0].metadata.cklRole ?? 'None'
    xmlJs.CHECKLIST.ASSET.TECH_AREA = resultGetAsset[0].metadata.cklTechArea ?? null
    xmlJs.CHECKLIST.ASSET.WEB_OR_DATABASE = resultGetAsset[0].metadata.cklHostName ?  'true' : 'false'
    xmlJs.CHECKLIST.ASSET.WEB_DB_SITE = resultGetAsset[0].metadata.cklWebDbSite ?? null
    xmlJs.CHECKLIST.ASSET.WEB_DB_INSTANCE = resultGetAsset[0].metadata.cklWebDbInstance ?? null
    
    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    for (const stigItem of stigs) {
      const revisionStr = stigItem.revisionStr || 'latest'
      revisionStrResolved = revisionStr
      const benchmarkId = stigItem.benchmarkId
      
      let sqlGetBenchmarkId
      if (revisionStr === 'latest') {
        sqlGetBenchmarkId = `select
          cr.benchmarkId, 
          s.title, 
          cr.revId, 
          cr.description, 
          cr.version, 
          cr.release, 
          cr.benchmarkDate
        from
          current_rev cr 
          left join stig s on cr.benchmarkId = s.benchmarkId
        where
          cr.benchmarkId = ?`
      }
      else {
        sqlGetBenchmarkId = `select
          r.benchmarkId,
          s.title,
          r.description,
          r.version,
          r.release,
          r.benchmarkDate
        from 
          stig s 
          left join revision r on s.benchmarkId=r.benchmarkId
        where
          r.revId = ?`  
      }
      // Calculate revId
      let resultGetBenchmarkId, revId
      if (revisionStr === 'latest') {
        ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
        revId = resultGetBenchmarkId[0].revId
        revisionStrResolved = `V${resultGetBenchmarkId[0].version}R${resultGetBenchmarkId[0].release}`
      }
      else {
        const {version, release} = dbUtils.parseRevisionStr(revisionStr)
        revId =  `${benchmarkId}-${version}-${release}`
        ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
      }
  
      const stig = resultGetBenchmarkId[0]
      const siDataRefs = [
        { SID_NAME: 'version', SID_DATA: stig.version },
        { SID_NAME: 'classification' },
        { SID_NAME: 'customname' },
        { SID_NAME: 'stigid', SID_DATA: stig.benchmarkId },
        { SID_NAME: 'description', SID_DATA: stig.description },
        { SID_NAME: 'filename', SID_DATA: 'stig-manager-oss' },
        { SID_NAME: 'releaseinfo', SID_DATA: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`},
        { SID_NAME: 'title', SID_DATA: stig.title },
        { SID_NAME: 'uuid', SID_DATA: '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
        { SID_NAME: 'notice', SID_DATA: 'terms-of-use' },
        { SID_NAME: 'source', }
      ]
      const iStigJs = {
        STIG_INFO:
          {
            SI_DATA: []
          },
        VULN: []
      }
      const siDataArray = iStigJs.STIG_INFO.SI_DATA
      for (const siDatum of siDataRefs) {
        siDataArray.push(siDatum)
      }
  
      // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
      const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])
  
      const stigDataRef = [
        ['Vuln_Num', 'groupId' ],
        ['Severity',  'severity' ],
        ['Weight',  'weight' ],
        ['Group_Title',  'groupTitle' ],
        ['Rule_ID',  'ruleId' ],
        ['Rule_Ver',  'version' ],
        ['Rule_Title',  'ruleTitle' ],
        ['Vuln_Discuss',  'vulnDiscussion' ],
        ['IA_Controls',  'iaControls' ],
        ['Check_Content',  'checkContent' ],
        ['Fix_Text',  'fixText' ],
        ['False_Positives',  'falsePositives' ],
        ['False_Negatives',  'falseNegatives' ],
        ['Documentable', 'documentable' ],
        ['Mitigations', 'mitigations' ],
        ['Potential_Impact', 'potentialImpacts' ],
        ['Third_Party_Tools', 'thirdPartyTools' ],
        ['Mitigation_Control', 'mitigationControl' ],
        ['Responsibility', 'responsibility' ],
        ['Security_Override_Guidance', 'severityOverrideGuidance' ] 
        // STIGViewer bug requires using Security_Override_Guidance instead of Severity_Override_Guidance
      ]
  
      // let vulnArray = xmlJs.CHECKLIST.STIGS.iSTIG.VULN
      const vulnArray = iStigJs.VULN
      for (const r of resultGetChecklist) {
        const vulnObj = {
          STIG_DATA: [],
          STATUS: r.result || 'Not_Reviewed',
          FINDING_DETAILS: r.detail,
          COMMENTS: r.comment,
          SEVERITY_OVERRIDE: null,
          SEVERITY_JUSTIFICATION: null
        }
        for (const stigDatum of stigDataRef) {
          vulnObj.STIG_DATA.push({
            VULN_ATTRIBUTE: stigDatum[0],
            ATTRIBUTE_DATA: r[stigDatum[1]]
          })
        }
        // STIGRef
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: 'STIGRef',
          ATTRIBUTE_DATA: `${stig.title} :: Version ${stig.version}, Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`
        })
        // CCI_REFs
        if (r.ccis) {
          const ccis = r.ccis.split(',')
          for (const cci of ccis) {
            vulnObj.STIG_DATA.push({
              VULN_ATTRIBUTE: 'CCI_REF',
              ATTRIBUTE_DATA: `CCI-${cci}`
            })
          }
        }
        vulnArray.push(vulnObj)        
      }
      xmlJs.CHECKLIST.STIGS.iSTIG.push(iStigJs)
    }
    return ({assetName: resultGetAsset[0].name, xmlJs, revisionStrResolved})
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

}

exports.cklbFromAssetStigs = async function cklbFromAssetStigs (assetId, stigs) {
  let connection
  try {
    let revisionStrResolved // Will hold specific revision string value, as opposed to "latest"
    const createdAt = new Date().toISOString()
    const cklb = {
      title: '',
      id: uuid.v1(),
      active: false,
      mode: 1,
      has_path: true,
      target_data: {
        target_type: '',
        host_name: '',
        ip_address: '',
        mac_address: '',
        fqdn: '',
        comments: '',
        role: '',
        is_web_database: false,
        technology_area: '',
        web_db_site: '',
        web_db_instance: ''
      },
      stigs: []
    }

    const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from asset where assetId = ? and asset.state = 'enabled'"
    const sqlGetChecklist =`SELECT 
      rgr.groupId,
      rgr.severity,
      rgr.groupTitle,
      rgr.ruleId,
      rgr.title as "ruleTitle",
      rgr.weight,
      rgr.version,
      rgr.vulnDiscussion,
      rgr.iaControls,
      rgr.falsePositives,
      rgr.falseNegatives,
      rgr.documentable,
      rgr.mitigations,
      rgr.potentialImpacts,
      rgr.thirdPartyTools,
      rgr.mitigationControl,
      rgr.responsibility,
      rgr.severityOverrideGuidance,
      result.cklb as "result",
      LEFT(review.detail,32767) as "detail",
      LEFT(review.comment,32767) as "comment",
      review.ts as "createdAt",
      review.touchTs as "updatedAt",
      cc.content as "checkContent",
      ft.text as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_rule_map rgr on rev.revId = rgr.revId 
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      left join severity_cat_map sc on rgr.severity = sc.severity 
      
      left join rev_group_rule_cci_map rgrcc on rgr.rgrId = rgrcc.rgrId

      left join check_content cc on rgr.checkDigest = cc.digest

      left join fix_text ft on rgr.fixDigest = ft.digest

      left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 

    WHERE
      rev.revId = ?
    GROUP BY
      rgr.rgrId,
      result.cklb,
      review.reviewId
    order by
      substring(rgr.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // cklb.target_data
    const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    cklb.target_data.host_name = resultGetAsset[0].metadata.cklHostName ? resultGetAsset[0].metadata.cklHostName : resultGetAsset[0].name
    cklb.target_data.fqdn = resultGetAsset[0].fqdn ?? ''
    cklb.target_data.ip_address = resultGetAsset[0].ip ?? ''
    cklb.target_data.mac_address = resultGetAsset[0].mac ?? ''
    cklb.target_data.target_type = resultGetAsset[0].noncomputing ? 'Non-Computing' : 'Computing'
    cklb.target_data.role = resultGetAsset[0].metadata.cklRole ?? 'None'
    cklb.target_data.technology_area = resultGetAsset[0].metadata.cklTechArea ?? ''
    cklb.target_data.is_web_database = !!resultGetAsset[0].metadata.cklHostName
    cklb.target_data.web_db_site = resultGetAsset[0].metadata.cklWebDbSite ?? ''
    cklb.target_data.web_db_instance = resultGetAsset[0].metadata.cklWebDbInstance ?? ''
    
    // cklb.stigs
    for (const stigItem of stigs) {
      const revisionStr = stigItem.revisionStr || 'latest'
      revisionStrResolved = revisionStr
      const benchmarkId = stigItem.benchmarkId
      
      let sqlGetBenchmarkId
      if (revisionStr === 'latest') {
        sqlGetBenchmarkId = `select
          cr.benchmarkId, 
          s.title, 
          cr.revId, 
          cr.description, 
          cr.version, 
          cr.release, 
          cr.benchmarkDate,
          cr.ruleCount
        from
          current_rev cr 
          left join stig s on cr.benchmarkId = s.benchmarkId
        where
          cr.benchmarkId = ?`
      }
      else {
        sqlGetBenchmarkId = `select
          r.benchmarkId,
          s.title,
          r.description,
          r.version,
          r.release,
          r.benchmarkDate,
          r.ruleCount
        from 
          stig s 
          left join revision r on s.benchmarkId=r.benchmarkId
        where
          r.revId = ?`  
      }
      // Calculate revId
      let resultGetBenchmarkId, revId
      if (revisionStr === 'latest') {
        ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
        revId = resultGetBenchmarkId[0].revId
        revisionStrResolved = `V${resultGetBenchmarkId[0].version}R${resultGetBenchmarkId[0].release}`
      }
      else {
        const {version, release} = dbUtils.parseRevisionStr(revisionStr)
        revId =  `${benchmarkId}-${version}-${release}`
        ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
      }
  
      const stig = resultGetBenchmarkId[0]
      const stigUuid = uuid.v1()
      const stigObj = {
        stig_name: stig.title,
        display_name: stig.title.replace(' Security Technical Implementation Guide', ''),
        stig_id: stig.benchmarkId,
        version: stig.version,
        release_info: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`,
        uuid: stigUuid,
        reference_identifier: '0000',
        size: stig.ruleCount,
        rules: []
      }

      // cklb.stigs[x].rules
      const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])  
      for (const row of resultGetChecklist) {
        const rule = {
          uuid: uuid.v1(),
          stig_uuid: stigUuid,
          target_key: null,
          stig_ref: null,
          group_id: row.groupId,
          rule_id: row.ruleId.replace('_rule', ''),
          rule_id_src: row.ruleId,
          weight: row.weight,
          classification: config.settings.setClassification,
          severity: row.severity,
          rule_version: row.version,
          group_title: row.groupTitle,
          rule_title: row.ruleTitle,
          fix_text: row.fixText,
          false_positives: row.falsePositives,
          false_negatives: row.falseNegatives,
          discussion: row.vulnDiscussion,
          check_content: row.checkContent,
          documentable: row.documentable,
          mitigations: row.mitigations,
          potential_impacts: row.potentialImpacts,
          third_party_tools: row.thirdPartyTools,
          mitigation_control: row.mitigationControl,
          responsibility: row.responsibility,
          security_override_guidance: row.severityOverrideGuidance,
          ia_controls: row.iaControls,
          check_content_ref: {
            href: '',
            name: 'M'
          },
          legacy_ids: [],
          group_tree: [
            {
              id: row.groupId,
              title: row.groupTitle,
              description: '<GroupDescription></GroupDescription>'
            }
          ],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          STIGUuid: stigUuid,
          status: row.result || 'not_reviewed',
          overrides: {},
          comments: row.comment ?? '',
          finding_details: row.detail ?? ''
        }

        // CCI_REFs
        rule.ccis = row.ccis ? row.ccis.split(',').map( cci => `CCI-${cci}`) : []
        stigObj.rules.push(rule)
      }
      cklb.stigs.push(stigObj)
    }
    return ({assetName: resultGetAsset[0].name, cklb, revisionStrResolved})
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.xccdfFromAssetStig = async function (assetId, benchmarkId, revisionStr = 'latest', includeCheckContent = true) {
    // queries and query methods
  const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from asset where assetId = ?"
  const sqlGetChecklist =`SELECT 
    rgr.groupId,
    rgr.groupTitle,
    rgr.ruleId,
    rgr.title as "ruleTitle",
    rgr.severity,
    rgr.weight,
    rgr.version,
    rgr.checkSystem,
    cc.content as "checkContent",
    result.api as "result",
    review.ts,
    LEFT(review.detail,32767) as "detail",
    LEFT(review.comment,32767) as "comment",
    review.resultEngine
  FROM
    revision rev 
    left join rev_group_rule_map rgr on rev.revId = rgr.revId 
    left join check_content cc on rgr.checkDigest = cc.digest
    left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
    left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)

    left join result on review.resultId = result.resultId 
    left join status on review.statusId = status.statusId 
  WHERE
    rev.revId = ?
  order by
    substring(rgr.groupId from 3) + 0 asc
  `
  async function getBenchmarkRevision(connection, benchmarkId, revisionStr) {
    let revisionStrResolved
    // Benchmark, calculate revId
    const sqlGetRevision = revisionStr === 'latest' ?
      `select
        cr.benchmarkId, 
        s.title, 
        cr.revId, 
        cr.description, 
        cr.version, 
        cr.release, 
        cr.benchmarkDate,
        cr.status,
        cr.statusDate
      from
        current_rev cr 
        left join stig s on cr.benchmarkId = s.benchmarkId
      where
        cr.benchmarkId = ?`
    :
    `select
        r.benchmarkId,
        s.title,
        r.revId,
        r.description,
        r.version,
        r.release,
        r.benchmarkDate,
        r.status,
        r.statusDate
      from 
        stig s 
        left join revision r on s.benchmarkId=r.benchmarkId
      where
        r.revId = ?`  

    let result, revId
    if (revisionStr === 'latest') {
      ;[result] = await connection.query(sqlGetRevision, [benchmarkId])
      revId = result[0].revId
      revisionStrResolved = `V${result[0].version}R${result[0].release}`
    }
    else {
      const {version, release} = dbUtils.parseRevisionStr(revisionStr)
      revId = `${benchmarkId}-${version}-${release}`
      ;[result] = await connection.query(sqlGetRevision, [revId])
      revisionStrResolved = revisionStr
    }
    result[0].revisionStr = revisionStrResolved
    return result[0]
  }

  function prefixObjectProperties(prefix, obj) {
    for (const k in obj)
      {
          if (typeof obj[k] == "object" && obj[k] !== null) {
            prefixObjectProperties(prefix, obj[k])
          }
          if (!Array.isArray(obj)) {
            obj[`${prefix}:${k}`] = obj[k]
            delete obj[k] 
          }
      }
  }

  function generateTargetFacts({metadata, ...assetFields}) {
    const fact = []
    for (const field in assetFields) {
      if (assetFields[field]) {
        fact.push({
          '@_name': `tag:stig-manager@users.noreply.github.com,2020:asset:${field}`,
          '@_type': 'string',
          '#text': assetFields[field]
        })  
      }
    }
    const re = /^urn:/
    for (const key in metadata) {
      if (re.test(key)) {
        fact.push({
          '@_name': key,
          '@_type': 'string',
          '#text': metadata[key] || ''
        })
      }
      else {
        fact.push({
          '@_name': `tag:stig-manager@users.noreply.github.com,2020:asset:metadata:${encodeURI(key)}`,
          '@_type': 'string',
          '#text': metadata[key] || ''
        })
      }
    }
    return {fact}
  }

  // reuse a connection for multiple SELECT queries
  const connection = await dbUtils.pool.getConnection()
  // target
  const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
  // benchmark
  const revision = await getBenchmarkRevision(connection, benchmarkId, revisionStr)
  // checklist
  const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revision.revId])
  // release connection
  await connection.release()


  // scaffold xccdf object
  const xmlJs = {
    Benchmark: {
      "@_xmlns": "http://checklists.nist.gov/xccdf/1.2",
      "@_xmlns:dc": "http://purl.org/dc/elements/1.1/",
      "@_xmlns:sm": "http://github.com/nuwcdivnpt/stig-manager",
      "@_id": `xccdf_mil.disa.stig_benchmark_${revision.benchmarkId}`,
      "status": {
        "@_date": revision.statusDate,
        "#text": revision.status
      },
      "title": revision.title,
      "description": revision.description,
      "version": revision.revisionStr,
      "metadata": {
        "dc:creator": "DISA",
        "dc:publisher": "STIG Manager OSS"
      },
      "Group": [],
      TestResult: {
        "@_id": `xccdf_mil.navy.nuwcdivnpt.stig-manager_testresult_${revision.benchmarkId}`,
        "@_test-system": `cpe:/a:nuwcdivnpt:stig-manager:${config.version}`,
        "@_end-time": new Date().toISOString(),
        "@_version": "1.0",
        "title": "",
        "target": resultGetAsset[0].name,
        "target-address": resultGetAsset[0].ip,
        "target-facts": generateTargetFacts(resultGetAsset[0]),
        "rule-result": [],
        "score": "1.0"
      } 
    }
  }  

  // iterate through checklist query results
  for (const r of resultGetChecklist) {
    xmlJs["Benchmark"]["Group"].push({
      "@_id": `xccdf_mil.disa.stig_group_${r.groupId}`,
      "title": r.groupTitle,
      "Rule": {
        "@_id": `xccdf_mil.disa.stig_rule_${r.ruleId}`,
        "@_weight": r.weight,
        "@_severity": r.severity || undefined,
        "title": r.ruleTitle,
        "check": {
          "@_system": r.checkId,
          "check-content": r.checkContent
        }
      }
    })
    if (r.resultEngine) {
      prefixObjectProperties('sm', r.resultEngine)
    }
    xmlJs["Benchmark"]["TestResult"]["rule-result"].push({
      result: r.result || "notchecked",
      "@_idref": `xccdf_mil.disa.stig_rule_${r.ruleId}`,
      "@_time": r.ts?.toISOString(),
      "check": {
        "@_system": r.checkId,
        "check-content": {
          "sm:detail": r.detail || undefined,
          "sm:comment": r.comment || undefined,
          "sm:resultEngine": r.resultEngine || undefined
        }
      }
    })
  }
  return ({assetName: resultGetAsset[0].name, xmlJs, revisionStrResolved: revision.revisionStr})
}

exports.createAsset = async function({body, projection, elevate, userObject, svcStatus = {}}) {
  return _this.addOrUpdateAsset({
    writeAction: dbUtils.WRITE_ACTION.CREATE,
    body, projection, elevate, userObject, svcStatus
  })
}

exports.deleteAsset = async function(assetId, projection, elevate, userObject) {
  const rows = await _this.queryAssets(projection, {assetId: assetId}, elevate, userObject)
  const sqlDelete = `UPDATE asset SET state = "disabled", stateDate = NOW(), stateUserId = ? where assetId = ?`
  await dbUtils.pool.query(sqlDelete, [userObject.userId, assetId])
  // changes above might have affected need for records in collection_rev_map 
  await dbUtils.pruneCollectionRevMap()
  await dbUtils.updateDefaultRev(null, {})
  return (rows[0])
}

exports.deleteAssets = async function(assetIds, userObject) {
  const sqlDelete = `UPDATE asset SET state = "disabled", stateDate = NOW(), stateUserId = ? where assetId IN ?`
  await dbUtils.pool.query(sqlDelete, [userObject.userId, [assetIds]])
  // changes above might have affected need for records in collection_rev_map 
  await dbUtils.pruneCollectionRevMap()
  await dbUtils.updateDefaultRev(null, {})
}

exports.attachStigToAsset = async function( {assetId, benchmarkId, collectionId, elevate, userObject, svcStatus = {}} ) {

  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      const sqlInsert = `INSERT IGNORE INTO stig_asset_map (assetId, benchmarkId) VALUES (?, ?)`
      const resultInsert = await connection.query(sqlInsert, [assetId, benchmarkId])
      if (resultInsert[0].affectedRows != 0) {
        // Inserted a new row, so update stats and default rev
        await dbUtils.updateDefaultRev(connection, {
          collectionId: collectionId,
          benchmarkId: benchmarkId
        })        
        await dbUtils.updateStatsAssetStig(connection, {
          assetId: assetId,
          benchmarkId: benchmarkId
        })

      }   
      await connection.commit()  
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    //Transaction complete, now get the updated stig_asset_map rows
    const rows = await _this.queryStigsByAsset( {
      assetId: assetId
    }, elevate, userObject)
    return (rows)          
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

exports.removeStigFromAsset = async function (assetId, benchmarkId, elevate, userObject ) {
  const sqlDelete = `DELETE FROM stig_asset_map where assetId = ? and benchmarkId = ?`
  await dbUtils.pool.query(sqlDelete, [assetId, benchmarkId])
  const rows = await _this.queryStigsByAsset( {
    assetId: assetId
  }, elevate, userObject)
  // changes above might have affected need for records in collection_rev_map 
  await dbUtils.pruneCollectionRevMap()
  await dbUtils.updateDefaultRev(null, {})
  return (rows)
}

exports.removeStigsFromAsset = async function (assetId, elevate, userObject ) {
  const sqlDelete = `DELETE FROM stig_asset_map where assetId = ?`
  await dbUtils.pool.query(sqlDelete, [assetId])
  const rows = await _this.queryStigsByAsset( {assetId: assetId}, elevate, userObject)
  // changes above might have affected need for records in collection_rev_map 
  await dbUtils.pruneCollectionRevMap()
  await dbUtils.updateDefaultRev(null, {})
  return (rows)
}

exports.deleteAssetStigGrant = async function (assetId, benchmarkId, userId, elevate, userObject ) {
  // TODO
}

exports.getAsset = async function(assetId, projection, elevate, userObject) {
  const rows = await _this.queryAssets(projection, {
    assetId: assetId
  }, elevate, userObject)
  return (rows[0])
}

exports.getAssets = async function(collectionId, labels, name, nameMatch, benchmarkId, metadata, projection, elevate, userObject) {
  const rows = await _this.queryAssets(projection, {
    collectionId,
    labels,
    name,
    nameMatch,
    benchmarkId,
    metadata
  }, elevate, userObject)
  return (rows)
}

exports.getStigsByAsset = async function (assetId, elevate, userObject ) {
  const rows = await _this.queryStigsByAsset({
    assetId: assetId
  }, elevate, userObject)
  return (rows)
}

exports.getUsersByAssetStig = async function (assetId, benchmarkId, elevate, userObject ) {
  const rows = await _this.queryUsersByAssetStig({
    assetId: assetId,
    benchmarkId: benchmarkId
  }, elevate, userObject)
  return (rows)
}

exports.getChecklistByAssetStig = async function(assetId, benchmarkId, revisionStr, format, elevate, userObject) {
  switch (format) {
    case 'json':
      const rows = await _this.queryChecklist(null, {
        assetId: assetId,
        benchmarkId: benchmarkId,
        revisionStr: revisionStr
      }, elevate, userObject)
      return (rows)
    case 'ckl':
      const cklObject = await _this.cklFromAssetStigs(assetId, [{benchmarkId, revisionStr}], elevate, userObject)
      return (cklObject)
    case 'cklb':
      const cklbObject = await _this.cklbFromAssetStigs(assetId, [{benchmarkId, revisionStr}], elevate, userObject)
      return (cklbObject)
    case 'xccdf':
      const xccdfObject = await _this.xccdfFromAssetStig(assetId, benchmarkId, revisionStr)
      return (xccdfObject)
  }
}

exports.getChecklistByAsset = async function(assetId, benchmarks, format, elevate, userObject) {
  switch (format) {
    case 'ckl':
      let cklObject = await _this.cklFromAssetStigs(assetId, benchmarks, elevate, userObject)
      return (cklObject)
    case 'cklb':
      let cklbObject = await _this.cklbFromAssetStigs(assetId, benchmarks, elevate, userObject)
      return (cklbObject)
    }
}

exports.getAssetsByStig = async function( collectionId, benchmarkId, labels, projection, elevate, userObject) {
  const rows = await _this.queryStigAssets(projection, {
    collectionId,
    benchmarkId,
    labels
  }, elevate, userObject)
  return (rows)
}

exports.attachAssetsToStig = async function(collectionId, benchmarkId, assetIds, projection, elevate, userObject, svcStatus = {}) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')

      let sqlDeleteBenchmarks = `
      DELETE stig_asset_map FROM 
        stig_asset_map
        left join asset on stig_asset_map.assetId = asset.assetId
      WHERE
        asset.collectionId = ?
        and stig_asset_map.benchmarkId = ?`
      if (assetIds.length > 0) {
        sqlDeleteBenchmarks += ' and stig_asset_map.assetId NOT IN ?'
      }  
      // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
      await connection.query( sqlDeleteBenchmarks, [ collectionId, benchmarkId, [assetIds] ] )
      
      // Push any bind values
      let binds = []
      assetIds.forEach( assetId => {
        binds.push([benchmarkId, assetId])
      })
      if (binds.length > 0) {
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
        INSERT IGNORE INTO 
          stig_asset_map (benchmarkId, assetId)
        VALUES
          ?`
        await connection.query(sqlInsertBenchmarks, [ binds ])
      }

      await dbUtils.updateDefaultRev(connection, {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      })
      await dbUtils.updateStatsAssetStig( connection, {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      })

      // changes above might have affected need for records in collection_rev_map 
      await dbUtils.pruneCollectionRevMap(connection)

      // Commit the changes
      await connection.commit()
    }
    return await dbUtils.retryOnDeadlock(transaction, svcStatus)
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

exports.updateAsset = async function( {assetId, body, projection, transferring, userObject, svcStatus = {}} ) {
  return _this.addOrUpdateAsset({
    writeAction: dbUtils.WRITE_ACTION.UPDATE,
    assetId, body, projection, transferring, userObject, svcStatus
  })
}

exports.getAssetMetadataKeys = async function ( assetId ) {
  const sql = `
    select
      JSON_KEYS(metadata) as keyArray
    from 
      asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  return rows.length > 0 ? rows[0].keyArray : []
}

exports.getAssetMetadata = async function ( assetId ) {
  const sql = `
    select
      metadata 
    from 
      asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  return rows.length > 0 ? rows[0].metadata : {}
}

exports.patchAssetMetadata = async function ( assetId, metadata ) {
  const sql = `
    update
      asset 
    set 
      metadata = JSON_MERGE_PATCH(metadata, ?)
    where 
      assetId = ?`
  await dbUtils.pool.query(sql, [JSON.stringify(metadata), assetId])
  return true
}

exports.putAssetMetadata = async function ( assetId, metadata ) {
  const sql = `
    update
      asset
    set 
      metadata = ?
    where 
      assetId = ?`
  await dbUtils.pool.query(sql, [JSON.stringify(metadata), assetId])
  return true
}

exports.getAssetMetadataValue = async function ( assetId, key ) {
  const sql = `
    select
      JSON_EXTRACT(metadata, ?) as value
    from 
      asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, assetId])
  return rows.length > 0 ? rows[0].value : ""
}

exports.putAssetMetadataValue = async function ( assetId, key, value ) {
  const sql = `
    update
      asset
    set 
      metadata = JSON_SET(metadata, ?, ?)
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, value, assetId])
  return rows.length > 0 ? rows[0].value : ""
}

exports.deleteAssetMetadataKey = async function ( assetId, key ) {
  const sql = `
    update
      asset
    set 
      metadata = JSON_REMOVE(metadata, ?)
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, assetId])
  return rows.length > 0 ? rows[0].value : ""
}