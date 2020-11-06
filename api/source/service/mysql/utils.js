const mysql = require('mysql2/promise');
const config = require('../../utils/config')
const retry = require('async-retry')
const Umzug = require('umzug')
const path = require('path')
const fs = require("fs")

let _this = this

module.exports.version = '0.6'
module.exports.testConnection = async function () {
  try {
    let [result] = await _this.pool.query('SHOW DATABASES')
    return JSON.stringify(result, null, 2)
  }
  catch (err) {
    // console.log(err.message)
    throw (err)
  }
}

function getPoolConfig() {
  const poolConfig = {
    connectionLimit : config.database.maxConnections,
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    database: config.database.schema,
    typeCast: function (field, next) {
      if (field.type == 'JSON') {
        return (JSON.parse(field.string())); 
      }
      if ((field.type === "BIT") && (field.length === 1)) {
        let bytes = field.buffer() || [0];
        return( bytes[ 0 ] === 1 );
      }
      return next();
    } 
  }
  if (config.database.password) {
    poolConfig.password = config.database.password
  }
  if (config.database.tls.ca_file || config.database.tls.cert_file || config.database.tls.key_file) {
    const sslConfig = {}
    if (config.database.tls.ca_file) {
      sslConfig.ca = fs.readFileSync(path.join(__dirname, '..', '..', 'tls', config.database.tls.ca_file))
    }
    if (config.database.tls.cert_file) {
      sslConfig.cert = fs.readFileSync(path.join(__dirname, '..', '..', 'tls', config.database.tls.cert_file))
    }
    if (config.database.tls.key_file) {
      sslConfig.key = fs.readFileSync(path.join(__dirname, '..', '..', 'tls', config.database.tls.key_file))
    }
    poolConfig.ssl = sslConfig
  }
  return poolConfig
}

module.exports.initializeDatabase = async function () {
  try {
    console.log('[DB] Initializing MySQL.')

    // Create the connection pool
    const poolConfig = getPoolConfig()
    _this.pool = mysql.createPool(poolConfig)
    // Set common session variables
    _this.pool.on('connection', function (connection) {
      connection.query('SET SESSION group_concat_max_len=10000000')
      // connection.query('SET SESSION sql_mode=’NO_AUTO_VALUE_ON_ZERO')
    })

    // Call the pool destruction methods on SIGTERM and SEGINT
    async function closePoolAndExit() {
      console.log('\nTerminating');
      try {
        await _this.pool.end()
        console.log('[DB] Pool closed');
        process.exit(0);
      } catch(err) {
        console.error(err.message);
        process.exit(1);
      }
    }   
    process.on('SIGTERM', closePoolAndExit)
    process.on('SIGINT', closePoolAndExit)

    // Preflight the pool every 5 seconds
    console.log('[DB] Attempting preflight connection.')
    let result = await retry(_this.testConnection, {
      retries: 24,
      factor: 1,
      minTimeout: 5 * 1000,
      maxTimeout: 5 * 1000,
      onRetry: (error) => {
        console.log(`[DB] ${error.message}`)
      }
    })
    console.log('[DB] Preflight connection succeeded.')

    // console.log(result)

    // Perform migrations
    const umzug = new Umzug({
      migrations: {
        path: path.join(__dirname, './migrations'),
        params: [_this.pool]
      },
      storage: path.join(__dirname, './migrations/lib/umzug-mysql-storage'),
      storageOptions: {
        pool: _this.pool
      }
    })

    if (config.database.revert) {
      const migrations = await umzug.executed()
      if (migrations.length) {
        console.log(`[DB] MySQL schema will revert the last migration and terminate.`)
        await umzug.down()
      } else {
        console.log('[DB] MySQL schema has no migrations to revert.')
      }
      console.log("Terminating")
      process.exit(1)
    }
    const migrations = await umzug.pending()
    if (migrations.length > 0) {
      console.log(`[DB] MySQL schema requires ${migrations.length} update${migrations.length > 1 ? 's' : ''}.`)
      await umzug.up()
      console.log('[DB] All migrations performed successfully')
    }
    else {
      console.log(`[DB] MySQL schema is up to date.`)
    }
    return migrations.length > 0 && migrations[0].file === '0000.js'

  }
  catch (err) {
    throw (err)
  }  
}

module.exports.parseRevisionStr = function (revisionStr) {
  let ro = {}
  if (revisionStr !== 'latest') {
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    ro.version = results[1]
    ro.release = results[2]
    ro.table = 'stig.revision'
    ro.table_alias = 'r'
    ro.predicates = ' and r.version = ? and r.release = ? '
  } else {
    ro.version = null
    ro.release = null
    ro.table = 'stig.current_rev'
    ro.table_alias = 'cr'
    ro.predicates = ''
  }
  return ro
}

// Returns Boolean
module.exports.userHasAssetStig = async function (assetId, benchmarkId, elevate, userObject) {
  try {
    let sql
    if (userObject.privileges.globalAccess) {
      return true
    } 
    else {
      sql = `select
        distinct sa.benchmarkId,
        sa.assetId
      from
        stig_asset_map sa
        left join asset a on sa.assetId = a.assetId
        left join collection_grant cg on a.collectionId = cg.collectionId
        left join user_stig_asset_map usa on sa.saId = usa.saId
      where
        cg.userId = ?
        and sa.benchmarkId = ?
        and sa.assetId = ?
        and (cg.accessLevel >= 2 or (cg.accessLevel = 1 and usa.userId = cg.userId))`

      let [rows] = await _this.pool.query(sql, [userObject.userId, benchmarkId, assetId])
      return rows.length > 0   
    }
  }
  catch (e) {
    throw (e)
  }
}

// Returns Boolean
// Called when a User's Colection grant is accessLevel 1
module.exports.userHasAssetRule = async function (assetId, ruleId, elevate, userObject) {
  try {
  }
  catch (e) {
    throw (e)
  }
}


// @param reviews Array List of Review objects
// @param elevate Boolean 
// @param userObject Object
module.exports.scrubReviewsByUser = async function(reviews, elevate, userObject) {
  try {
    const permitted = [], rejected = []
    if (userObject.privileges.globalAccess || elevate) {
      permitted = reviews
    }
    else {
      const sql = `SELECT
        CONCAT(sa.assetId, '-', rgr.ruleId) as permitted
      FROM
        collection_grant cg
        inner join asset a on cg.collectionId = a.collectionId
        inner join stig_asset_map sa on a.assetId = sa.assetId
        inner join revision rev on sa.benchmarkId = rev.benchmarkId
        inner join rev_group_map rg on rev.revId = rg.revId
        inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
      WHERE
        cg.userId = ?
        and cg.accessLevel != 1
      GROUP BY
        sa.assetId, rgr.ruleId
      UNION
      SELECT
        CONCAT(sa.assetId, '-', rgr.ruleId) as permitted
      FROM
        collection_grant cg
        inner join asset a on cg.collectionId = a.collectionId
        inner join stig_asset_map sa on a.assetId = sa.assetId
        inner join user_stig_asset_map usa on (sa.saId = usa.saId and cg.userId = usa.userId)
        inner join revision rev on sa.benchmarkId = rev.benchmarkId
        inner join rev_group_map rg on rev.revId = rg.revId
        inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
      WHERE
        cg.userId = ?
        and cg.accessLevel = 1
      GROUP BY
        sa.assetId, rgr.ruleId`
      let [rows] = await _this.pool.query(sql, [userObject.userId, userObject.userId])
      let allowedAssetRules = rows.map(r => r.permitted)
      reviews.forEach(review => {
        if (allowedAssetRules.includes(`${review.assetId}-${review.ruleId}`)) {
          permitted.push(review)
        }
        else {
          rejected.push(review)
        }
      })
    }
    return {
      permitted: permitted,
      rejected: rejected
    }
  }
  catch (e) {
    throw (e)
  }

}
module.exports.updateStatsAssetStig = async function(connection, options) {
  try {
    if (!connection) { throw ('Connection required')}
    // Handle optional predicates, 
    let predicates = []
    let binds = []
    let whereClause = ''

    if (options.rules && options.rules.length > 0) {
      predicates.push(`sa.benchmarkId IN (SELECT DISTINCT benchmarkId from current_group_rule where ruleId IN ?)`)
      binds.push( [options.rules] )
    }

    if (options.collectionId) {
      predicates.push('a.collectionId = ?')
      binds.push(options.collectionId)
    }
    if (options.assetId) {
      predicates.push('a.assetId = ?')
      binds.push(options.assetId)
    }
    if (options.benchmarkId) {
      predicates.push('sa.benchmarkId = ?')
      binds.push(options.benchmarkId)
    }
    if (predicates.length > 0) {
      whereClause = `where ${predicates.join(' and ')}`
    }

    const sqlSelect = `
      select
        sa.assetId,
        sa.benchmarkId,
        min(reviews.ts) as minTs,
        max(reviews.ts) as maxTs,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 0 THEN 1 ELSE 0 END) as savedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 0 THEN 1 ELSE 0 END) as savedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 1 THEN 1 ELSE 0 END) as submittedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 1 THEN 1 ELSE 0 END) as submittedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 2 THEN 1 ELSE 0 END) as rejectedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 2 THEN 1 ELSE 0 END) as rejectedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 3 THEN 1 ELSE 0 END) as acceptedManual,
        sum(CASE WHEN reviews.autoResult = 1  and reviews.statusId = 3 THEN 1 ELSE 0 END) as acceptedAuto,
        sum(CASE WHEN reviews.resultId=4 and r.severity='high' THEN 1 ELSE 0 END) as highCount,
        sum(CASE WHEN reviews.resultId=4 and r.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
        sum(CASE WHEN reviews.resultId=4 and r.severity='low' THEN 1 ELSE 0 END) as lowCount
      from
        asset a
        left join stig_asset_map sa using (assetId)
        left join current_group_rule cgr using (benchmarkId)
        left join rule r using (ruleId)
        left join stigman.review reviews on (r.ruleId=reviews.ruleId and reviews.assetId=sa.assetId)
      ${whereClause}
      group by
        sa.assetId,
        sa.benchmarkId`
    
    const sqlInsert = `
      insert into stats_asset_stig (
        minTs,
        maxTs,
        savedManual,
        savedAuto,
        submittedManual,
        submittedAuto,
        rejectedManual,
        rejectedAuto,
        acceptedManual,
        acceptedAuto,
        highCount,
        mediumCount,
        lowCount,
        assetId,
        benchmarkId
      ) VALUES (:minTs,:maxTs,:savedManual,:savedAuto,:submittedManual,:submittedAuto,
        :rejectedManual,:rejectedAuto,:acceptedManual,:acceptedAuto,:highCount,:mediumCount,:lowCount,:assetId,:benchmarkId)`

    const sqlUpdate = `
      update stats_asset_stig set  
        minTs = :minTs,
        maxTs = :maxTs,
        savedManual = :savedManual,
        savedAuto = :savedAuto,
        submittedManual = :submittedManual,
        submittedAuto = :submittedAuto,
        rejectedManual = :rejectedManual,
        rejectedAuto = :rejectedAuto,
        acceptedManual = :acceptedManual,
        acceptedAuto = :acceptedAuto,
        highCount = :highCount,
        mediumCount = :mediumCount,
        lowCount = :lowCount
      where
        assetId = :assetId
        and benchmarkId = :benchmarkId

    `
    const sqlUpsert = `
    insert into stats_asset_stig (
      assetId,
      benchmarkId,
      minTs,
      maxTs,
      savedManual,
      savedAuto,
      submittedManual,
      submittedAuto,
      rejectedManual,
      rejectedAuto,
      acceptedManual,
      acceptedAuto,
      highCount,
      mediumCount,
      lowCount)
    select * from (
      select
        sa.assetId,
        sa.benchmarkId,
        min(reviews.ts) as minTs,
        max(reviews.ts) as maxTs,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 0 THEN 1 ELSE 0 END) as savedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 0 THEN 1 ELSE 0 END) as savedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 1 THEN 1 ELSE 0 END) as submittedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 1 THEN 1 ELSE 0 END) as submittedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 2 THEN 1 ELSE 0 END) as rejectedManual,
        sum(CASE WHEN reviews.autoResult = 1 and reviews.statusId = 2 THEN 1 ELSE 0 END) as rejectedAuto,
        sum(CASE WHEN reviews.autoResult = 0 and reviews.statusId = 3 THEN 1 ELSE 0 END) as acceptedManual,
        sum(CASE WHEN reviews.autoResult = 1  and reviews.statusId = 3 THEN 1 ELSE 0 END) as acceptedAuto,
        sum(CASE WHEN reviews.resultId=4 and r.severity='high' THEN 1 ELSE 0 END) as highCount,
        sum(CASE WHEN reviews.resultId=4 and r.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
        sum(CASE WHEN reviews.resultId=4 and r.severity='low' THEN 1 ELSE 0 END) as lowCount
      from
        asset a
        left join stig_asset_map sa using (assetId)
        left join current_group_rule cgr using (benchmarkId)
        left join rule r using (ruleId)
        left join stigman.review reviews on (r.ruleId=reviews.ruleId and reviews.assetId=sa.assetId)
      ${whereClause}
      group by
        sa.assetId,
        sa.benchmarkId
    ) as stats
    on duplicate key update
        minTs = stats.minTs,
        maxTs = stats.maxTs,
        savedManual = stats.savedManual,
        savedAuto = stats.savedAuto,
        submittedManual = stats.submittedManual,
        submittedAuto = stats.submittedAuto,
        rejectedManual = stats.rejectedManual,
        rejectedAuto = stats.rejectedAuto,
        acceptedManual = stats.acceptedManual,
        acceptedAuto = stats.acceptedAuto,
        highCount = stats.highCount,
        mediumCount = stats.mediumCount,
        lowCount = stats.lowCount
    `
    const [stats] = await connection.query(sqlSelect, binds)
    if (stats.length > 0) {
      const [result] = await connection.query(sqlUpdate, stats[0])
      if (result.affectedRows == 0) {
        await connection.query(sqlInsert, stats[0])
      }
    }
    return true  
  }
  catch (err) {
    throw err
  }
}


module.exports.CONTEXT_ALL = 'all'
module.exports.CONTEXT_DEPT = 'department'
module.exports.CONTEXT_USER = 'user'
module.exports.REVIEW_RESULT_ID = { 
  1: {api: 'notchecked', ckl: 'Not_Reviewed', abbr: 'NC'},
  2: {api: 'notapplicable', ckl: 'Not_Applicable', abbr: 'NA'},
  3: {api: 'pass', ckl: 'NotAFinding', abbr: 'NF'},
  4: {api: 'fail', ckl: 'Open', abbr: 'O'}
}
module.exports.REVIEW_RESULT_API = { 
  'notapplicable': 2,
  'pass': 3,
  'fail': 4
}
module.exports.REVIEW_RESULT_CKL = { 
  'Not_Applicable': {id: 2},
  'NotAFinding': {id: 3},
  'Open': {id: 4}
}
module.exports.REVIEW_RESULT_ABBR = { 
  'NA': {id: 2},
  'NF': {id: 3},
  'O': {id: 4}
}
module.exports.REVIEW_ACTION_ID = { 
  1: 'remediate',
  2: 'mitigate',
  3: 'exception'
}
module.exports.REVIEW_ACTION_API = { 
  'remediate': 1,
  'mitigate': 2,
  'exception': 3
}
module.exports.REVIEW_STATUS_ID = { 
  0: 'saved',
  1: 'submitted',
  2: 'rejected',
  3: 'approved'
}
module.exports.REVIEW_STATUS_API = { 
  'saved': 0,
  'submitted': 1,
  'rejected': 2,
  'accepted': 3
}
module.exports.WRITE_ACTION = { 
  CREATE: 0,
  REPLACE: 1,
  UPDATE: 2
}
module.exports.USER_ROLE_ID = {
  2: {role: "IAWF", display: "IA Workforce"},
  3: {role: "IAO", display: "IA Officer"},
  4: {role: "Staff", display: "IA Staff"}
}
module.exports.USER_ROLE = {
  IAWF: {id: 2, display: "IA Workforce"},
  IAO: {id: 3, display: "IA Officer"},
  Staff: {id: 4, display: "IA Staff"}
}

