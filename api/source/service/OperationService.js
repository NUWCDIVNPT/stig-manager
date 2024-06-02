'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config')
const CollectionService = require(`./CollectionService`)


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
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
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
          let i, j, bindchunk, chunk = 5000;
          for (i=0,j=dml[table].insertBinds.length; i<j; i+=chunk) {
            res.write(`Inserting: ${table} chunk: ${i}\n`)
            bindchunk = dml[table].insertBinds.slice(i,i+chunk);
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
        hrstart = process.hrtime();
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

exports.getDetails = async function() {
  const sqlAnalyze = `ANALYZE TABLE
  collection, asset, review, review_history, user`
  const sqlInfoSchema = `
  SELECT
    TABLE_NAME as tableName,
    TABLE_ROWS as tableRows,
    TABLE_COLLATION as tableCollation,
    AVG_ROW_LENGTH as avgRowLength,
    DATA_LENGTH as dataLength,
    MAX_DATA_LENGTH as maxDataLength,
    INDEX_LENGTH as indexLength,
    AUTO_INCREMENT as autoIncrement,
    CREATE_TIME as createTime,
    UPDATE_TIME as updateTime
  FROM
    information_schema.TABLES
  WHERE
    TABLE_SCHEMA = ?
  ORDER BY
    TABLE_NAME
    `
  const sqlCollectionAssetStigs = `
    SELECT
      CAST(sub.collectionId as char) as collectionId,
      sum(case when sub.assetId then 1 else 0 end) as assetCnt,
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


      const sqlDisabledCollectionCount = `
      select 
        c.collectionId,
        count(distinct a.assetId) as assetCnt,
        count(r.reviewId) as reviewCnt,
        count(rh.historyId) as historyCnt
      from 
        collection c
      left join asset a on a.collectionId = c.collectionId
      left join review r on r.assetId = a.assetId
      left join review_history rh on rh.reviewId = r.reviewId
      where 
        c.state = "disabled"
      group by 
        c.collectionId
      `

      // const sqlDisabledAssetsInEnabledCollections = `
      // select 
      //   c.collectionId,
      //   count(distinct a.assetId) as disabledAssetCnt,
      //   count(r.reviewId) as reviewCnt,
      //   count(rh.historyId) as historyCnt
      // from 
      //   collection c
      // left join asset a on a.collectionId = c.collectionId
      // left join review r on r.assetId = a.assetId
      // left join review_history rh on rh.reviewId = r.reviewId
      // where 
      //   a.state = "disabled" and 
      //   c.state = "enabled"
      // group by 
      //   c.collectionId
      // `

      
      const sqlCountsByCollection = `
      SELECT
      -- row_number() over (order by c.collectionId) as collectionItem,
      cast(c.collectionId as char) as collectionId,
      c.state,
      count(distinct a.assetId) as assetsTotal,
      count( distinct 
        if(a.state = "disabled", a.assetId, null)
        ) 
        as assetsDisabled,
      count(distinct sa.benchmarkId) as uniqueStigs,
      count(sa.saId) as stigAssignments,
      coalesce(sum(rev.ruleCount),0) 
        as ruleCnt,
      coalesce(
          sum(sa.pass + sa.fail + sa.notapplicable + sa.notchecked + sa.notselected + sa.informational + sa.fixed + sa.unknown + sa.error),0) 
          as reviewCntTotal,
      coalesce(
        sum(if(a.state = "disabled", (sa.pass + sa.fail + sa.notapplicable + sa.notchecked + sa.notselected + sa.informational + sa.fixed + sa.unknown + sa.error), 0)))
        as reviewCntDisabled
      FROM
        collection c
        left join asset a on c.collectionId = a.collectionId 
        left join stig_asset_map sa on a.assetId = sa.assetId
        left join default_rev dr on c.collectionId = dr.collectionId and sa.benchmarkId = dr.benchmarkId
        left join revision rev on dr.revId = rev.revId
        left join stig on rev.benchmarkId = stig.benchmarkId
      GROUP BY
        c.collectionId
      ORDER BY
        c.collectionId
      `


      // const sqlOverallHistoryCnt = `
      // select 
      //   count(distinct rh.historyId) as reviewHistoryCnt
      // from
      //   review_history rh
      // `



    const sqlOrphanedReviews = `
    SELECT count(distinct r.ruleId)
    FROM 
     review r 
    where 
        r.ruleId not in (select ruleId from rule_version_check_digest)
    `

    await dbUtils.pool.query(sqlAnalyze)

    // const [[schemaInfoArray], [assetStig], [disabledCollections], [disabledAssetsInEnabledCollections], [countsByCollection],[overallTotals]] = await Promise.all([
    //   dbUtils.pool.query(sqlInfoSchema, [config.database.schema]),
    //   dbUtils.pool.query(sqlCollectionAssetStigs),
    //   dbUtils.pool.query(sqlDisabledCollectionCount),
    //   dbUtils.pool.query(sqlDisabledAssetsInEnabledCollections),
    //   dbUtils.pool.query(sqlCountsByCollection),
    //   dbUtils.pool.query(sqlOverallTotals)

    // ])

    const [schemaInfoArray] = await dbUtils.pool.query(sqlInfoSchema, [config.database.schema]);
    const [assetStig] = await dbUtils.pool.query(sqlCollectionAssetStigs);
    const [disabledCollections] = await dbUtils.pool.query(sqlDisabledCollectionCount);
    // const [disabledAssetsInEnabledCollections] = await dbUtils.pool.query(sqlDisabledAssetsInEnabledCollections);
    const [countsByCollection] = await dbUtils.pool.query(sqlCountsByCollection);
    // const [overallHistoryCnt] = await dbUtils.pool.query(sqlOverallHistoryCnt);
    const [orphanedReviews] = await dbUtils.pool.query(sqlOrphanedReviews);



    // call reviewHistoryStatsByCollection for each collection:
    // let elevate = true;
    // const collections = await CollectionService.getCollections({}, '', elevate)
    // let collectionIds = collections.map(collection => collection.collectionId);
    // let reviewHistoryStatsResults = []
    // for (const collection of collectionIds) {
    //   let stats = await CollectionService.getReviewHistoryStatsByCollection(collection)
    //   reviewHistoryStatsResults.push(
    //     {
    //       collectionId: collection, 
    //       historyEntryCount: stats.collectionHistoryEntryCount,
    //       oldestHistoryEntry: stats.oldestHistoryEntryDate
    //     })
    // }
    // // let reviewHistoryStatsResult = await CollectionService.getReviewHistoryStatsByCollection(collections[0].collectionId)
    // // // res.json(reviewHistoryStatsresult)

    // let endDate = '2021-01-01'
    // let reviewHistoryStatsOld = await CollectionService.getReviewHistoryStatsByCollection(11,endDate)




    // const nameValuesReducer = (obj, item) => (obj[item.Variable_name] = item.Value, obj)
    const schemaReducer = (obj, item) => (obj[item.tableName] = item, obj)

    return ({
      dbInfo: {
        tables: schemaInfoArray.reduce(schemaReducer, {})
      },
      assetStig,
      disabledCollections,
      // disabledAssetsInEnabledCollections,
      // reviewHistoryStatsResults,
      // reviewHistoryStatsOld,
      countsByCollection,
      // overallHistoryCnt,
      orphanedReviews      
    })
}
