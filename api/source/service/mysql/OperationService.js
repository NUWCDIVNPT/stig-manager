'use strict';
const dbUtils = require('./utils')
const config = require('../../utils/config')


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
  function dmlObjectFromAppData (appdata) {
    let {collections, assets, users, reviews} = appdata

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
        // sqlInsert: `INSERT INTO stigman.user_stig_asset_map (
        //   userId,
        //   benchmarkId,
        //   assetId
        // ) VALUES ?`,
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
          assetId,
          ruleId,
          activityType,
          columnName,
          oldValue,
          newValue,
          userId,
          ts
        ) VALUES ?`,
        insertBinds: []
      },
      review: {
        sqlDelete: `TRUNCATE review`,
        sqlInsert: `INSERT IGNORE INTO review (
          assetId,
          ruleId,
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
          metadata
        ) VALUES ?`,
        insertBinds: []
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
    
    // Tables: collection, collection_grant_map
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
    }


    // Tables: asset, stig_asset_map, user_stig_asset_map
    for (const asset of assets) {
      let { stigGrants, ...assetFields} = asset
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
        // const userIds = []
        // if (sr.userIds && sr.userIds.length > 0) {
        //   for (const userId of sr.userIds) {
        //     userIds.push(parseInt(userId) || null)
        //   }
        // }
        dml.stigAssetMap.insertBinds.push([
          parseInt(assetId) || null,
          sr.benchmarkId,
          JSON.stringify(sr.userIds)
        ])
      }
    }

    // Tables: review, review_history
    for (const review of reviews) {
      // for (const h of review.history) {
      //   dml.reviewHistory.insertBinds.push([
      //     review.assetId,
      //     review.ruleId,
      //     h.activityType,
      //     h.columnName,
      //     h.oldValue,
      //     h.newValue,
      //     h.userId,
      //     new Date(h.ts)
      //   ])
      // }
      dml.review.insertBinds.push([
        parseInt(review.assetId) || null,
        review.ruleId,
        dbUtils.REVIEW_RESULT_API[review.result],
        review.detail,
        review.comment,
        parseInt(review.userId) || null,
        review.autoState ? 1 : 0,
        new Date(review.ts),

        review.status?.text,
        parseInt(review.status?.user?.userId),
        dbUtils.REVIEW_STATUS_API[review.status?.label],
        new Date(review.status?.ts),
        JSON.stringify(review.metadata || {})
      ])
    }

    return dml
  }

  let connection
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('Starting import\n')
    let result, hrstart, hrend, tableOrder, dml, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    dml = dmlObjectFromAppData(appData)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write('Parsed appdata\n')

    // Connect to MySQL and start transaction
    connection = await dbUtils.pool.getConnection()
    await connection.query('SET FOREIGN_KEY_CHECKS=0')

    // Deletes
    tableOrder = [
      'reviewHistory',
      'review',
      'userStigAssetMap',
      'stigAssetMap',
      'collectionGrant',
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
      'collectionGrant',
      'asset',
      'stigAssetMap',
      'userStigAssetMap',
      'review',
      'reviewHistory'
    ]
    await connection.query('SET FOREIGN_KEY_CHECKS=1')
    for (const table of tableOrder) {
      if (dml[table].insertBinds.length > 0) {
        hrstart = process.hrtime()

        let i, j, bindchunk, chunk = 5000;
        for (i=0,j=dml[table].insertBinds.length; i<j; i+=chunk) {
          res.write(`Inserting: ${table} chunk: ${i}\n`)
          bindchunk = dml[table].insertBinds.slice(i,i+chunk);
          ;[result] = await connection.query(dml[table].sqlInsert, [bindchunk])
        }
        hrend = process.hrtime(hrstart)
        stats[table].insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }
    }

    // Stats
    res.write('Calculating status statistics\n')
    hrstart = process.hrtime();
    const statusStats = await dbUtils.updateStatsAssetStig( connection, {} )
    hrend = process.hrtime(hrstart)
    stats.stats = `${statusStats.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    // Commit
    hrstart = process.hrtime() 
    res.write(`Starting commit\n`)
    await connection.query('COMMIT')
    res.write(`Commit successful\n`)
    hrend = process.hrtime(hrstart)
    stats.commit = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // // Postload
    // hrstart = process.hrtime() 
    // for (const sql of dml.postload) {
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.postload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Total time calculation
    hrend = process.hrtime(totalstart)
    stats.total = `TOTAL in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    res.write(JSON.stringify(stats))
    res.end()

    // return (stats)
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
  const sqlInfoSchema = `SELECT
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
    TABLE_NAME`
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
      LEFT JOIN asset a on a.collectionId = c.collectionId
      LEFT JOIN stig_asset_map sa on sa.assetId = a.assetId 
    GROUP BY
      c.collectionId,
      c.name,
      a.assetId) as sub
    GROUP BY
      sub.collectionId
    ORDER BY
      sub.collectionId`

    await dbUtils.pool.query(sqlAnalyze)

    const [[schemaInfoArray], [variablesArray], [statusArray], [assetStig]] = await Promise.all([
      dbUtils.pool.query(sqlInfoSchema, [config.database.schema]),
      dbUtils.pool.query('show variables'),
      dbUtils.pool.query('show global status'),
      dbUtils.pool.query(sqlCollectionAssetStigs)
    ])

    const nameValuesReducer = (obj, item) => (obj[item.Variable_name] = item.Value, obj)
    const schemaReducer = (obj, item) => (obj[item.tableName] = item, obj)

    return ({
      dbInfo: {
        status: statusArray.reduce(nameValuesReducer ,{}),
        variables: variablesArray.reduce(nameValuesReducer ,{}),
        tables: schemaInfoArray.reduce(schemaReducer, {})
      },
      assetStig
    })
}
