'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config')
const logger = require('../utils/logger')
const klona = require('../utils/klona')
const os = require('node:os')

/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getConfiguration = async function() {
  try {
    let sql = `SELECT * from config`
    let [rows] = await dbUtils.pool.query(sql)
    let config = {}
    for (const row of rows) {
      config[row.key] = row.value
    }
    return (config)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.setConfigurationItem = async function (key, value) {
  try {
    let sql = 'INSERT INTO config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)'
    await dbUtils.pool.query(sql, [key, value])
    return (true)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }

}

exports.replaceAppData = async function (importOpts, appData, userObject, res ) {
  function queriesFromBenchmarkData(appdata) {
    let {collections, assets, users, reviews} = appdata

    const tempFlag = true
    const ddl = {
      tempReview: {
        drop: 'drop table if exists temp_review',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_review (
          assetId INT,
          ruleId VARCHAR(45),
          resultId INT,
          detail MEDIUMTEXT,
          comment MEDIUMTEXT,
          userId INT,
          autoResult INT,
          ts DATETIME,
          statusId INT,
          statusText VARCHAR(511),
          statusUserId INT,
          statusTs DATETIME,
          metadata JSON,
          resultEngine JSON
        )`
      }
    }
    let dml = {
      preload: [
      ],
      postload: [
      ],
      collection: {
        sqlDelete: `DELETE FROM collection`,
        sqlInsert: `INSERT INTO
        collection (
          collectionId,
          name,
          settings,
          metadata 
        ) VALUES ?`,
        insertBinds: []
      },
      collectionLabel: {
        sqlDelete: `DELETE FROM collection_label`,
        sqlInsert: `INSERT INTO
        collection_label (
          collectionId,
          name,
          description,
          color,
          uuid
        ) VALUES ?`,
        insertBinds: []
      },
      userData: {
        sqlDelete: `DELETE FROM user_data`,
        sqlInsert: `INSERT INTO
        user_data (
          userId,
          username, 
          lastAccess,
          lastClaims
        ) VALUES ?`,
        insertBinds: []
      },
      collectionGrant: {
        sqlDelete: `DELETE FROM collection_grant`,
        sqlInsert: `INSERT INTO
        collection_grant (
          collectionId,
          userId,
          accessLevel
        ) VALUES ?`,
        insertBinds: []
      },
      collectionPins: {
        sqlDelete: `DELETE FROM collection_rev_map`,
        sqlInsert: `INSERT INTO
        collection_rev_map (
          collectionId,
          benchmarkId,
          revId
        ) VALUES ?`,
        insertBinds: []
      },      
      asset: {
        sqlDelete: `DELETE FROM asset`,
        sqlInsert: `INSERT INTO asset (
          assetId,
          collectionId,
          name,
          description,
          ip,
          noncomputing,
          metadata
        ) VALUES ?`,
        insertBinds: []
      },
      assetLabel: {
        sqlDelete: `DELETE FROM collection_label_asset_map`,
        sqlInsert: `INSERT INTO collection_label_asset_map (
          assetId,
          clId
        ) 
        SELECT
          jt.assetId,
          cl.clId
        FROM
          JSON_TABLE(
            ?,
            '$[*]' COLUMNS(
              assetId INT PATH '$.assetId',
              collectionId INT PATH '$.collectionId',
              NESTED PATH '$.labelIds[*]' COLUMNS ( labelId VARCHAR(36) PATH '$')
            )
          ) as jt
          INNER JOIN collection_label cl on cl.collectionId = jt.collectionId and cl.uuid = UUID_TO_BIN(jt.labelId,1)`,
        insertBinds: []
      },
      stigAssetMap: {
        sqlDelete: `DELETE FROM stig_asset_map`,
        sqlInsert: `INSERT INTO stig_asset_map (
          assetId,
          benchmarkId,
          userIds
        ) VALUES ?`,
        insertBinds: []
      },
      userStigAssetMap: {
        sqlDelete: `DELETE FROM user_stig_asset_map`,
        sqlInsert: `INSERT INTO user_stig_asset_map
        (saId, userId)
        SELECT
        sa.saId,
        jt.userId
        FROM
        stig_asset_map sa,
          JSON_TABLE(
            sa.userIds,
            "$[*]"
            COLUMNS(
              userId INT(11) PATH "$"
            )
          ) AS jt`,
        insertBinds: [null] // dummy value so length > 0
      },
      reviewHistory: {
        sqlDelete: `DELETE FROM review_history`,
        sqlInsert: `INSERT INTO review_history (
            reviewId,
            ruleId,
            resultId,
            detail,
            comment,
            autoResult,
            ts,
            userId,
            statusId,
            statusText,
            statusUserId,
            statusTs,
            touchTs
          )
          SELECT
            r.reviewId,
            jt.ruleId,
            jt.resultId,
            jt.detail,
            jt.comment,
            jt.autoResult,
            jt.ts,
            jt.userId,
            jt.statusId,
            jt.statusText,
            jt.statusUserId,
            jt.statusTs,
            jt.touchTs
          FROM
            JSON_TABLE(
              ?,
              "$[*]"
              COLUMNS(
                assetId INT PATH "$.assetId",
                ruleId VARCHAR(45) PATH "$.ruleId",
                resultId INT PATH "$.resultId",
                detail MEDIUMTEXT PATH "$.detail",
                comment MEDIUMTEXT PATH "$.comment",
                autoResult INT PATH "$.autoResult",
                ts DATETIME PATH "$.ts",
                userId INT PATH "$.userId",
                statusId INT PATH "$.statusId",
                statusText VARCHAR(511) PATH "$.statusText",
                statusUserId INT PATH "$.statusUserId",
                statusTs DATETIME PATH "$.statusTs",
                touchTs DATETIME PATH "$.touchTs",
                resultEngine JSON PATH "$.resultEngine"
              )
            ) as jt
            LEFT JOIN rule_version_check_digest rvcd ON jt.ruleId = rvcd.ruleId
            LEFT JOIN review r ON (jt.assetId = r.assetId and rvcd.version = r.version and rvcd.checkDigest = r.checkDigest)`,
        insertBinds: []
      },
      tempReview: {
        sqlInsert: `INSERT IGNORE INTO temp_review(
          assetId,
          ruleId,
          resultId,
          detail,
          comment,
          userId,
          autoResult,
          ts,
          statusId,
          statusText,
          statusUserId,
          statusTs,
          metadata,
          resultEngine
        ) VALUES ?`,
        insertBinds: []
      },
      review: {
        sqlDelete: `TRUNCATE review`,
        sqlInsert: `INSERT IGNORE INTO review (
          assetId,
          ruleId,
          \`version\`,
          checkDigest,
          resultId,
          detail,
          comment,
          userId,
          autoResult,
          ts,
          statusText,
          statusUserId,
          statusId,
          statusTs,
          metadata,
          resultEngine
        )
        SELECT 
          jt.assetId,
          jt.ruleId,
          rvcd.version,
          rvcd.checkDigest,
          jt.resultId,
          jt.detail,
          jt.comment,
          jt.userId,
          jt.autoResult,
          jt.ts,
          jt.statusText,
          jt.statusUserId,
          jt.statusId,
          jt.statusTs,
          jt.metadata,
          jt.resultEngine
        FROM
        temp_review jt
        LEFT JOIN rule_version_check_digest rvcd ON (jt.ruleId = rvcd.ruleId)`,
        insertBinds: [null] // dummy value so length > 0
      }
    }

    // Process appdata object

    // Table: user_data
    for (const u of users) {
      dml.userData.insertBinds.push([
        parseInt(u.userId) || null,
        u.username, 
        u.statistics.lastAccess,
        JSON.stringify(u.statistics.lastClaims)
      ])
    }
    
    // Tables: collection, collection_grant_map, collection_label
    for (const c of collections) {
      dml.collection.insertBinds.push([
        parseInt(c.collectionId) || null,
        c.name,
        JSON.stringify(c.settings),
        JSON.stringify(c.metadata)
      ])
      for (const grant of c.grants) {
        dml.collectionGrant.insertBinds.push([
          parseInt(c.collectionId) || null,
          parseInt(grant.userId) || null,
          grant.accessLevel
        ])
      }
      for (const label of c.labels) {
        dml.collectionLabel.insertBinds.push([
          parseInt(c.collectionId),
          label.name,
          label.description,
          label.color,
          dbUtils.uuidToSqlString(label.labelId)
        ])
      }
        for (const pin of c.stigs ?? []) {
          if (pin.revisionPinned){
            const {version, release} = dbUtils.parseRevisionStr(pin.revisionStr)
            dml.collectionPins.insertBinds.push([
              parseInt(c.collectionId),
              pin.benchmarkId,
              pin.benchmarkId + "-" + version + "-" + release
            ])
          }
        }
    }

    // Tables: asset, collection_label_asset_maps, stig_asset_map, user_stig_asset_map
    const assetLabels = []
    for (const asset of assets) {
      let { stigGrants, labelIds, ...assetFields} = asset
      dml.asset.insertBinds.push([
        parseInt(assetFields.assetId) || null,
        parseInt(assetFields.collectionId) || null,
        assetFields.name,
        assetFields.description,
        assetFields.ip,
        assetFields.noncomputing ? 1: 0,
        JSON.stringify(assetFields.metadata)
      ])
      let assetId = assetFields.assetId
      for (const sr of stigGrants) {
        sr.userIds = sr.userIds.map( u => parseInt(u))
        dml.stigAssetMap.insertBinds.push([
          parseInt(assetId) || null,
          sr.benchmarkId,
          JSON.stringify(sr.userIds)
        ])
      }
      if (labelIds?.length > 0) {
        assetLabels.push({
          assetId: parseInt(assetFields.assetId),
          collectionId: parseInt(assetFields.collectionId),
          labelIds
        })  
      }
    }
    dml.assetLabel.insertBinds.push(JSON.stringify(assetLabels))

    // Tables: review, review_history
    const historyRecords = []
    for (const review of reviews) {
      for (const h of review.history) {
        historyRecords.push({
          assetId: parseInt(review.assetId),
          ruleId: review.ruleId,
          resultId: dbUtils.REVIEW_RESULT_API[h.result],
          detail: h.detail,
          comment: h.comment,
          autoResult: h.autoResult ? 1 : 0,
          ts: new Date(h.ts),
          userId: parseInt(h.userId),
          statusId: dbUtils.REVIEW_STATUS_API[h.status.label],
          statusText: h.statusText,
          statusUserId: parseInt(h.status.userId ?? h.status.user?.userId),
          statusTs: new Date(h.status.ts),
          touchTs: new Date(h.touchTs),
          resultEngine: JSON.stringify(h.resultEngine)
        })
      }
      dml.tempReview.insertBinds.push([
        parseInt(review.assetId),
        review.ruleId,
        dbUtils.REVIEW_RESULT_API[review.result],
        review.detail,
        review.comment,
        parseInt(review.userId),
        review.autoResult ? 1 : 0,
        new Date(review.ts),
        dbUtils.REVIEW_STATUS_API[review.status?.label],
        review.status?.text,
        parseInt(review.status.userId ?? review.status.user?.userId),
        new Date(review.status?.ts),
        JSON.stringify(review.metadata || {}),
        review.resultEngine ? JSON.stringify(review.resultEngine) : null
      ])
    }
    dml.reviewHistory.insertBinds = JSON.stringify(historyRecords)
    return {ddl, dml}
  }

  let connection
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.write('Starting import\n')
    let result, hrstart, hrend, tableOrder, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    // dml = dmlObjectFromAppData(appData)
    const {ddl, dml} = queriesFromBenchmarkData(appData)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write('Parsed appdata\n')

    // Connect to MySQL
    connection = await dbUtils.pool.getConnection()
    await connection.query('SET FOREIGN_KEY_CHECKS=0')

    // create temporary tables
    for (const tempTable of Object.keys(ddl)) {
      await connection.query(ddl[tempTable].drop)
      await connection.query(ddl[tempTable].create)
    }

    // Deletes
    tableOrder = [
      'reviewHistory',
      'review',
      'userStigAssetMap',
      'stigAssetMap',
      'collectionGrant',
      'assetLabel',
      'collectionLabel',
      'collectionPins',
      'collection',
      'asset',
      'userData',
    ]
    for (const table of tableOrder) {
      res.write(`Deleting: ${table}\n`)
      hrstart = process.hrtime() 
      ;[result] = await connection.query(dml[table].sqlDelete)
      hrend = process.hrtime(hrstart)
      stats[table] = {}
      stats[table].delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }

    // Inserts

  
    tableOrder = [
      'userData',
      'collection',
      'collectionLabel',
      'collectionGrant',
      'asset',
      'assetLabel',
      'stigAssetMap',
      'userStigAssetMap',
      'tempReview',
      'review',
      'reviewHistory'
    ]

    if (dml.collectionPins?.insertBinds?.length > 0) {
      tableOrder.push('collectionPins')
    }

    stats.tempReview = {}
    await connection.query('SET FOREIGN_KEY_CHECKS=1')
    for (const table of tableOrder) {
      if (dml[table].insertBinds.length > 0) {
        hrstart = process.hrtime()
        if (typeof dml[table].insertBinds === 'string') { // reviewHistory
          ;[result] = await connection.query(dml[table].sqlInsert, [dml[table].insertBinds])
        }
        else {
          let i, j, bindchunk, chunk = 5000
          for (i=0,j=dml[table].insertBinds.length; i<j; i+=chunk) {
            res.write(`Inserting: ${table} chunk: ${i}\n`)
            bindchunk = dml[table].insertBinds.slice(i,i+chunk)
            ;[result] = await connection.query(dml[table].sqlInsert, [bindchunk])
          } 
        }
        hrend = process.hrtime(hrstart)
        stats[table].insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }
    }
    res.write(`Commit successful\n`)

        // Stats
        res.write('Calculating status statistics\n')
        hrstart = process.hrtime()
        let statsConn = await dbUtils.pool.getConnection()
        await dbUtils.updateDefaultRev( statsConn, {} )
        const statusStats = await dbUtils.updateStatsAssetStig( statsConn, {} )
        await statsConn.release()
        hrend = process.hrtime(hrstart)
        stats.stats = `${statusStats.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    

    // Total time calculation
    hrend = process.hrtime(totalstart)
    stats.total = `TOTAL in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write(JSON.stringify(stats))
    res.end()

    return (stats)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.query('ROLLBACK')
    }
    res.write(err.message)
    res.end()
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.getAppInfo = async function() {
  const schema = 'stig-manager-appinfo-v1.0'
  const sqlAnalyze = `ANALYZE TABLE collection, asset, review, review_history, user`
  const sqlInfoSchema = `
  SELECT
    TABLE_NAME as tableName,
    TABLE_ROWS as tableRows,
    TABLE_COLLATION as tableCollation,
    AVG_ROW_LENGTH as avgRowLength,
    DATA_LENGTH as dataLength,
    INDEX_LENGTH as indexLength,
    AUTO_INCREMENT as autoIncrement,
    CREATE_TIME as createTime,
    UPDATE_TIME as updateTime
  FROM
    information_schema.TABLES
  WHERE
    TABLE_SCHEMA = ?
    and TABLE_TYPE='BASE TABLE'
  ORDER BY
    TABLE_NAME`
  const sqlCollectionAssetStigs = `
  SELECT
    CAST(sub.collectionId as char) as collectionId,
    sum(case when sub.assetId is not null and sub.stigAssetCnt = 0 then 1 else 0 end) as range00,
    sum(case when sub.stigAssetCnt >= 1 and sub.stigAssetCnt <= 5 then 1 else 0 end) as range01to05,
    sum(case when sub.stigAssetCnt >= 6 and sub.stigAssetCnt <= 10 then 1 else 0 end) as range06to10,
    sum(case when sub.stigAssetCnt >= 11 and sub.stigAssetCnt <= 15 then 1 else 0 end) as range11to15,
    sum(case when sub.stigAssetCnt >= 16 then 1 else 0 end) as range16plus
  FROM
  (SELECT
    c.collectionId,
    c.name,
    a.assetId,
    COUNT(sa.assetId) as stigAssetCnt
  FROM
    collection c
    LEFT JOIN asset a on a.collectionId = c.collectionId and a.state = "enabled"
    LEFT JOIN stig_asset_map sa on sa.assetId = a.assetId 
  GROUP BY
    c.collectionId,
    c.name,
    a.assetId) as sub
  GROUP BY
    sub.collectionId
  ORDER BY
    sub.collectionId
  `
  const sqlCountsByCollection = `
  SELECT
    cast(c.collectionId as char) as collectionId,
    c.name,
    c.state,
    c.settings,
	  count(distinct if(a.state = "enabled", a.assetId, null)) as assets,
    count(distinct if(a.state = "disabled", a.assetId, null)) as assetsDisabled,
    count(distinct if(a.state = "enabled", sa.benchmarkId, null)) as uniqueStigs,
    sum(if(a.state = "enabled" and sa.saId, 1, 0)) as stigAssignments,
    sum(if(a.state = "enabled",rev.ruleCount,0)) as rules,
    sum(if(a.state = "enabled", (sa.pass + sa.fail + sa.notapplicable + sa.notchecked + sa.notselected + sa.informational + sa.fixed + sa.unknown + sa.error), 0)) as reviews,
    sum(if(a.state = "disabled", (sa.pass + sa.fail + sa.notapplicable + sa.notchecked + sa.notselected + sa.informational + sa.fixed + sa.unknown + sa.error), 0)) as reviewsDisabled
  FROM
    collection c
    left join asset a on c.collectionId = a.collectionId
    left join stig_asset_map sa on a.assetId = sa.assetId
    left join default_rev dr on c.collectionId = dr.collectionId and sa.benchmarkId = dr.benchmarkId
    left join revision rev on dr.revId = rev.revId
  GROUP BY
    c.collectionId
  ORDER BY
    c.collectionId
  `
  const sqlLabelCountsByCollection = `
  SELECT
    cast(c.collectionId as char) as collectionId,
    count(distinct cl.clId) as collectionLabels,
    count(distinct clam.assetId) as labeledAssets,
    count(distinct clam.claId) as assetLabels
  FROM
    collection c
    left join collection_label cl on cl.collectionId = c.collectionId
    left join collection_label_asset_map clam on clam.clId = cl.clId
    left join asset a on clam.assetId = a.assetId and a.state = "enabled"
  GROUP BY
    c.collectionId
  `  
  const sqlAclUserCountsByCollection = `
    with ctePerUser as (select
      a.collectionId, 
      json_object(
      'userId', usam.userId, 
      'ruleCounts', json_object(
        'rw', count(usam.saId),
        'r', 0,
        'none', 0
      ), 
      'uniqueAssets', count(distinct if(a.state = 'enabled', sam.assetId, null)),
      'uniqueAssetsDisabled', count(distinct if(a.state = 'disabled', sam.assetId, null)),
      'uniqueStigs', count(distinct if(a.state = 'enabled', sam.benchmarkId, null)),
      'uniqueStigsDisabled', count(distinct if(a.state = 'disabled', sam.benchmarkId, null)),
      'role', 
        case when cg.accessLevel = 1 then 'restricted' else 
          case when cg.accessLevel = 2 then 'full' else
            case when cg.accessLevel = 3 then 'manage' else
              case when cg.accessLevel = 4 then 'owner'
              end
            end
          end
        end
      ) as perUser
    from 
      user_stig_asset_map usam
      left join stig_asset_map sam on sam.saId=usam.saId
      left join asset a on a.assetId = sam.assetId
      left join collection_grant cg on usam.userId = cg.userId and a.collectionId = cg.collectionId
    group by
      usam.userId, a.collectionId)
    select 
      collectionId, 
      json_arrayagg(perUser) as aclCounts
    from 
      ctePerUser
    group by 
      collectionId
  `
  const sqlGrantCounts = `
  SELECT 
    collectionId,
    SUM(CASE WHEN accessLevel = 1 THEN 1 ELSE 0 END) AS restricted,
    SUM(CASE WHEN accessLevel = 2 THEN 1 ELSE 0 END) AS full,
    SUM(CASE WHEN accessLevel = 3 THEN 1 ELSE 0 END) AS manage,
    SUM(CASE WHEN accessLevel = 4 THEN 1 ELSE 0 END) AS owner
  FROM 
    collection_grant
  GROUP BY 
    collectionId
  ORDER BY 
    collectionId
  `
  const sqlUserInfo = `
  select 
    ud.userId,
    ud.username,
    ud.created, 
    ud.lastAccess,
    coalesce(
      JSON_EXTRACT(ud.lastClaims, "$.${config.oauth.claims.privilegesPath}"),
      json_array()
    ) as privileges,
    json_object(
		  "restricted", sum(case when cg.accessLevel = 1 then 1 else 0 end),
      "full", sum(case when cg.accessLevel = 2 then 1 else 0 end),
		  "manage", sum(case when cg.accessLevel = 3 then 1 else 0 end),
      "owner", sum(case when cg.accessLevel = 4 then 1 else 0 end)
	  ) as roles
  from 
    user_data ud
    left join collection_grant cg using (userId)
  group by
	  ud.userId
  `
  const sqlMySqlVersion = `SELECT VERSION() as version`

  const mySqlVariablesOnly = [
    'innodb_buffer_pool_size',
    'innodb_log_buffer_size',
    'innodb_log_file_size',
    'tmp_table_size',
    'key_buffer_size',
    'max_heap_table_size',
    'temptable_max_mmap',
    'sort_buffer_size',
    'read_buffer_size',
    'read_rnd_buffer_size',
    'join_buffer_size',
    'binlog_cache_size',
    'tmp_table_size',
    'innodb_buffer_pool_instances' ,  
    'innodb_io_capacity' , 
    'innodb_io_capacity_max' ,  
    'innodb_flush_sync' ,  
    'innodb_io_capacity_max' ,  
    'innodb_lock_wait_timeout',
    'version',
    'version_compile_machine',
    'version_compile_os',
    'long_query_time'
  ]
  const sqlMySqlVariablesValues = `
  SELECT 
    variable_name,
    variable_value as value
    FROM 
    performance_schema.global_variables
  WHERE 
    variable_name IN (${mySqlVariablesOnly.map(v => `'${v}'`).join(',')})
    ORDER by variable_name
  `
  const mySqlStatusOnly = [
  'Bytes_received',
  'Bytes_sent',
  'Handler_commit',
  'Handler_update',
  'Handler_write',
  'Innodb_buffer_pool_bytes_data',
  'Innodb_row_lock_waits',
  'Innodb_rows_read',
  'Innodb_rows_updated',
  'Innodb_rows_inserted',
  'Innodb_row_lock_time_avg',
  'Innodb_row_lock_time_max',
  'Created_tmp_files',
  'Created_tmp_tables',
  'Max_used_connections',
  'Open_tables',
  'Opened_tables',
  'Queries',
  'Select_full_join',
  'Slow_queries',
  'Table_locks_immediate',
  'Table_locks_waited',
  'Threads_created',
  'Uptime'
  ]
  const sqlMySqlStatusValues = `
  SELECT 
    variable_name,
    variable_value as value
  FROM 
    performance_schema.global_status
  WHERE 
    variable_name IN (
        ${mySqlStatusOnly.map( v => `'${v}'`).join(',')}
    )
  ORDER by variable_name
  `
  await dbUtils.pool.query(sqlAnalyze)
  const [schemaInfoArray] = await dbUtils.pool.query(sqlInfoSchema, [config.database.schema])
  const tables = createObjectFromKeyValue(schemaInfoArray, "tableName")

  const rowCountQueries = []
  for (const table in tables) {
    rowCountQueries.push(dbUtils.pool.query(`SELECT "${table}" as tableName, count(*) as rowCount from ${table}`))
  }

  let [
    [assetStigByCollection],
    [countsByCollection],
    [labelCountsByCollection],
    [aclUserCountsByCollection],
    [grantCountsByCollection],
    [userInfo],
    [mySqlVersion],
    [mySqlVariables],
    [mySqlStatus],
    rowCountResults
  ] = await Promise.all([
    dbUtils.pool.query(sqlCollectionAssetStigs),
    dbUtils.pool.query(sqlCountsByCollection),
    dbUtils.pool.query(sqlLabelCountsByCollection),
    dbUtils.pool.query(sqlAclUserCountsByCollection),
    dbUtils.pool.query(sqlGrantCounts),
    dbUtils.pool.query(sqlUserInfo),
    dbUtils.pool.query(sqlMySqlVersion),
    dbUtils.pool.query(sqlMySqlVariablesValues),
    dbUtils.pool.query(sqlMySqlStatusValues),
    Promise.all(rowCountQueries)
  ])

  for (const result of rowCountResults) {
    tables[result[0][0].tableName].rowCount = result[0][0].rowCount
  }

  // remove strings from user privileges array that are not meaningful to stigman
  const stigmanPrivs = ['admin', 'create_collection']
  for (const user of userInfo ) {
    user.privileges = user.privileges.filter(v => stigmanPrivs.includes(v))
  }

  //count privilege assignments and break out by lastAccess time periods
  const userPrivilegeCounts = breakOutPrivilegeUsage(userInfo)

  //create working copy of operational stats
  const requests = klona(logger.requestStats)

  requests.operationIds = sortObjectByKeys(requests.operationIds)

  // Create objects keyed by collectionId from arrays of objects
  countsByCollection = createObjectFromKeyValue(countsByCollection, "collectionId")
  labelCountsByCollection = createObjectFromKeyValue(labelCountsByCollection, "collectionId")
  assetStigByCollection = createObjectFromKeyValue(assetStigByCollection, "collectionId")
  aclUserCountsByCollection = createObjectFromKeyValue(aclUserCountsByCollection, "collectionId")
  grantCountsByCollection = createObjectFromKeyValue(grantCountsByCollection, "collectionId")

  // Bundle "byCollection" stats together by collectionId
  for(const collectionId in countsByCollection) {
    if (assetStigByCollection[collectionId]) {
      countsByCollection[collectionId].assetStigRanges = assetStigByCollection[collectionId]
    }
    if (aclUserCountsByCollection[collectionId]) {
      countsByCollection[collectionId].aclCounts = {
        users: createObjectFromKeyValue(aclUserCountsByCollection[collectionId].aclCounts, "userId"),
        groups: {}
      }
    }
    else {
      countsByCollection[collectionId].aclCounts = {
        users: {},
        groups: {}
      }
    }
    if (grantCountsByCollection[collectionId]) {
      countsByCollection[collectionId].grantCounts = grantCountsByCollection[collectionId]
    }
    else {
      countsByCollection[collectionId].grantCounts = {
        restricted: 0,
        full: 0,
        manage: 0,
        owner: 0
      }
    }    
    if (labelCountsByCollection[collectionId]) {
      countsByCollection[collectionId].labelCounts = labelCountsByCollection[collectionId]
    }
  }

  const returnObj = {
    date: new Date().toISOString(),
    schema,
    version: config.version,
    collections: countsByCollection,
    requests,
    users: {
      userInfo: createObjectFromKeyValue(userInfo, "userId", null),
      userPrivilegeCounts
    },
    mysql: {
      version: mySqlVersion[0].version,
      tables,
      variables: createObjectFromKeyValue(mySqlVariables, "variable_name", "value"),
      status: createObjectFromKeyValue(mySqlStatus, "variable_name", "value")
    },
    nodejs: getNodeValues()
  }
  return returnObj

  // Reduce an array of objects to a single object, using the value of one property as keys
  // and either assigning the rest of the object or the value of a second property as the value.
  function createObjectFromKeyValue(data, keyPropertyName, valuePropertyName = null, includeKey = false) {
    return data.reduce((acc, item) => {
      const { [keyPropertyName]: key, ...rest } = item
      acc[key] = valuePropertyName ? item[valuePropertyName] : includeKey ? item : rest
      return acc
    }, {})
  }

  function sortObjectByKeys(obj) {
    // Create a new object and add properties in sorted order
    const sortedObj = {}
    for (const key of Object.keys(obj).sort()) {
      sortedObj[key] = obj[key]
    }
    return sortedObj
  }

  function breakOutPrivilegeUsage(userInfo) {
    let privilegeCounts = {
      overall: {none:0},
      activeInLast30Days: {none:0},
      activeInLast90Days: {none:0}
    }
    
    // Calculate the timestamps for 30 and 90 days ago
    const currentTime = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60)
    const ninetyDaysAgo = currentTime - (90 * 24 * 60 * 60)
    const updateCounts = (categoryCounts, userPrivs) => {
      if (userPrivs.length === 0) {
        categoryCounts.none++
      }
      for (const privilege of userPrivs) {
        categoryCounts[privilege] = categoryCounts[privilege] ? categoryCounts[privilege] + 1 : 1
      }
    }

    for (const user of userInfo) {
      updateCounts(privilegeCounts.overall, user.privileges)
      // Update counts for the last 30 and 90 days based on lastAccess
      if (user.lastAccess >= ninetyDaysAgo) {
        updateCounts(privilegeCounts.activeInLast90Days, user.privileges)
      }
      if (user.lastAccess >= thirtyDaysAgo) {
        updateCounts(privilegeCounts.activeInLast30Days, user.privileges)
      }
    }
    return privilegeCounts
  }

  function getNodeValues() {
    const {environmentVariables, header, resourceUsage} = process.report.getReport()
    
    const environment = {}
    for (const [key, value] of Object.entries(environmentVariables)) {
      if (/^(NODE|STIGMAN)_/.test(key)) {
        environment[key] = key === 'STIGMAN_DB_PASSWORD' ? '***' : value
      }
    }
    const {platform, arch, nodejsVersion, cpus, osMachine, osName, osRelease} = header
    for (let x = 0; x < cpus.length; x++) {
      cpus[x] = {model: cpus[x].model, speed: cpus[x].speed}
    }
    const loadAverage = os.loadavg().join(', ')

    const memory = process.memoryUsage()
    memory.maxRss = resourceUsage.maxRss
    return {
      version: nodejsVersion.substring(1),
      uptime: process.uptime(),
      os: {
        platform,
        arch,
        osMachine,
        osName,
        osRelease,
        loadAverage
      },
      environment,
      memory,
      cpus
    }
  }
}

