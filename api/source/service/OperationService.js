'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config')
const {privilegeGetter} = require('../utils/auth')
const logger = require('../utils/logger')
const _ = require('lodash')
const BJSON = require('../utils/buffer-json')
const { Readable, Transform } = require("node:stream")
const { pipeline } = require("node:stream/promises")
const zlib = require("node:zlib")


/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getConfiguration = async function() {
  const sql = `SELECT * from config`
  const [rows] = await dbUtils.pool.query(sql)
  const config = {}
  for (const row of rows) {
    config[row.key] = row.value
  }
  return (config)
}

exports.setConfigurationItem = async function (key, value) {
  const sql = 'INSERT INTO config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)'
  await dbUtils.pool.query(sql, [key, value])
  return (true)
}

/**
 * getAppData - streams GZip compressed JSONL records to the response. The JSONL are either
 * data records from a MySQL table (always an array) or metadata records (always an object).
 * 
 * @param {import('express').Response} res express response
 * @returns {undefined}
 * @example Abbreviated example of JSONL which is streamed compressed to the response:
 *  {"version":"1.4.13","commit":{"branch":"na","sha":"na","tag":"na","describe":"na"},"date":"2024-08-18T15:29:16.784Z","lastMigration":33}\n
    {"tables":[{"table":"stig","rowCount":4}, ... ], "totalRows": 4}\n
    {"table":"stig","columns":"`benchmarkId`, `title`","rowCount":4}\n
    ["RHEL_7_STIG_TEST","Red Hat Enterprise Linux 7 Security Technical Implementation Guide"]\n
    ["VPN_SRG_TEST","Virtual Private Network (VPN) Security Requirements Guide"]\n
    ["VPN_SRG_Rule-fingerprint-match-test","Virtual Private Network (VPN) Security Requirements Guide - replaced"]\n
    ["Windows_10_STIG_TEST","Windows 10 Security Technical Implementation Guide"]\n ...
 */
exports.getAppData = async function (res) {
  /** @type {string[]} tables to exclude from the appdata file */
  const excludedTables = [
    '_migrations', 
    'status', 
    'result',
    'severity_cat_map', 
    'cci', 
    'cci_reference_map', 
    'config'
  ]

  /** @type {zlib.Gzip} transform stream to compress JSONL records and write to the response */
  const gzip = zlib.createGzip()
  gzip.pipe(res)
  gzip.setMaxListeners(Infinity)
  
  // Write metadata record {version, commit, date, lastMigration}
  const {version, commit, lastMigration} = config
  gzip.write(JSON.stringify({version, commit, date: new Date(), lastMigration}) + '\n')
   
  // Execute SQL to retrieve a list of tables and their non-generated columns. The query binds
  // to the schema name and the excluded tables.
  /** @type {Array.<Array.<{table:string, columns:string[]}>} */
  const [tableRows] = await dbUtils.pool.query(`SELECT
    TABLE_NAME as \`table\`,
    json_arrayagg(CONCAT('\`',COLUMN_NAME,'\`')) as columns
  FROM
    INFORMATION_SCHEMA.COLUMNS 
  where
    TABLE_SCHEMA=? 
    and TABLE_NAME IN (select TABLE_NAME FROM INFORMATION_SCHEMA.TABLES where TABLE_SCHEMA=? and TABLE_TYPE='BASE TABLE')
    and TABLE_NAME not in (?)
    and EXTRA NOT LIKE '% GENERATED'
  group by
    TABLE_NAME`, [config.database.schema, config.database.schema, excludedTables])

  /**
   * @type {Object.<string, {columns:string, rowCount?:number}>} object pivoted from tableRows[]
   * @example
   * '{
        "asset": {
          "columns": "`assetId`,`name`,`fqdn`, ... "
        },
        "check_content": {
          "columns": "`ccId`,`content`"
        },
        "collection": {
          "columns": "`collectionId`,`name`,`description`, ... "
        }
      }'
   */
  const tableMetadata = tableRows.reduce((acc, value) => {
    acc[value.table] = {columns:value.columns.join(',')}
    return acc
  }, {})


  /** @type {string[]} */
  const tableNames = Object.keys(tableMetadata)

  /** @type {number} incremented by the row count of each table */
  let totalRows = 0

  /** @type {{table:string, rowCount:number}[]} */
  let tables = []

  // Select and handle the row count for each table. 
  for (const table of tableNames) {
    const [row] = await dbUtils.pool.query(`select count(*) as cnt from ${table}`)
    const rowCount = row[0].cnt
    tableMetadata[table].rowCount = rowCount
    tables.push({table, rowCount})
    totalRows += rowCount
  }

  // Write metadata record {tables, totalRows}
  gzip.write(JSON.stringify({tables, totalRows}) + '\n')

  for (const table of tableNames) {
    // create readable stream using the non-promise interface of dbUtils.pool.pool
    // select all rows for non-generated columns in table
    // perform custom type casting of fields to JS
    /** @type {Readable} */
    const queryStream = dbUtils.pool.pool.query({
      sql: `select ${tableMetadata[table].columns} from ${table}`,
      rowsAsArray: true,
      typeCast: function (field, next) {
         // BIT fields returned as boolean
        if ((field.type === "BIT") && (field.length === 1)) {
          let bytes = field.buffer() || [0]
          return (bytes[0] === 1)
        }
         // Designated fields returned as original MySQL strings
        if (field.type === 'JSON' || field.type === 'DATETIME' || field.type === 'DATE') {
          return (field.string("utf8"))
        }
        return next()
      }
     }).stream()

    // Write metadata record {table, columns, rowCount}
    gzip.write(JSON.stringify({table, ...tableMetadata[table]}) + '\n')

    /** @type {Transform} writes a JSONL data record for each tuple of row data*/
    const bjson = new Transform({
      objectMode: true,
      transform: (data, encoding, cb) => {
        // BSJON supports stringify() and parse() of Buffer values
        cb(null, BJSON.stringify(data) + '\n')
      }
    })

    // pipeline writes data records [field, field, ...] to gzip, ends without closing gzip
    await pipeline(queryStream, bjson, gzip, { end: false })
  }

  // ending gzip will also end the response
  gzip.end()
}

/**
 * replaceAppData - process a file created by getAppData() and execute SQL queries with progress messages
 * 
 * @param {Buffer} bufferGz - buffer with file content
 * @param {function(Object)} progressCb - optional, argument is an object with progress status
 * @returns {undefined}
 */
exports.replaceAppData = async function (bufferGz, progressCb = () => {}) {
  /**
   * ParseJSONLStream - Transform chunks of JSONL records into individual parsed AppData records (N:1).
   * @extends Transform
   */
  class ParseJSONLStream extends Transform {
    /**
     * @param {Object} param
     * @param {function(string):any} param.jsonParser - function for JSON parsing, default JSON.parse()
     * @param {string} param.separator - character separating JSONL records, default '\n'
     */
    constructor({jsonParser = JSON.parse, separator = '\n'} = {}) {
      super({objectMode: true})
      Object.assign(this, {separator, jsonParser})
  
      /** @type {RegExp} RegExp for .split() that includes any trailing separator */
      this.splitRegExp = new RegExp(`(?<=${separator})`)
  
      /** @type {string} holds incoming chunk prefaced by any partial record from previous transform */
      this.buffer = '' 
    }

    /**
     * @param {Buffer} chunk - buffer from Gunzip that can span multiple JSONL records
     * @param {string} encoding - usually 'utf8'
     * @param {function()} cb - signals completion
     */
    _transform(chunk, encoding, cb) {
      this.buffer += chunk.toString(encoding)
      
      /** @type {string[]} list of JSONL, last item might be truncated or partial */
      const candidates = this.buffer.split(this.splitRegExp)
      /** @type {number} index of last candidates[] item */
      const lastIndex = candidates.length - 1

      // clear buffer for the next _transform() or _flush()
      this.buffer = ''
  
      /** index @type {number} */
      /** candidate @type {string} */
      for (const [index, candidate] of candidates.entries()) {
        if (index === lastIndex && !candidate.endsWith(this.separator)) {
          // this is the last candidate and there's no trailing separator
          // initialize buffer for next _transform() or _flush()
          this.buffer = candidate
        }
        else {
          try {
            // if parsable, write parsed value
            this.push(this.jsonParser(candidate))
          }
          // swallow any parse error
          catch {}
        }
      }
      cb()
    }
    /** @param {function()} cb signals completion */
    _flush(cb) {
      try {
        // if what's left in the buffer is parsable, write parsed value
        if (this.buffer) this.push(this.jsonParser(this.buffer))
      }
      // swallow any parse error
      catch {}
      cb()
    }
  }
    /**
   * AppDataQueryStream - Transform AppData records into an SQL query object (N:1)
   * @extends Transform
   */
  class AppDataQueryStream extends Transform {
    /**
     * @param {Object} param
     * @param {number} param.maxValues - maximum number of values for an insert query.
     * @param {function(Object): any} param.onTablesFn - called when record {tables, ...} is read
     * @param {function(Object): any} param.onMigrationFn - called when record {..., lastMigration} is read
     */
    constructor({maxValues = 10000, onTablesFn = new Function(), onMigrationFn = new Function()}) {
      super({objectMode: true})
      Object.assign(this, { maxValues, onTablesFn, onMigrationFn })
      
      /** @type {null|Object} the last metadata record encountered */
      this.currentMetadata = null
      
      /** @type {Array} values for an insert query */
      this.currentBinds = []
    }

    /**
     * @param {Buffer} chunk a single AppData record
     * @param {string} encoding usually 'utf8'
     * @param {function()} cb signals completion
     */
    _transform(chunk, encoding, cb) {
      if (Array.isArray(chunk)) {
        this.currentBinds.push(chunk)
        if (this.currentBinds.length === this.maxValues || this.currentBinds.length === 0) {
          this.push(this.formatCurrentQuery())
          this.currentBinds = []
        }
      }
      else if (chunk.lastMigration) {
        try {
          this.onMigrationFn(chunk)
        }
        catch (e) {
          cb(e)
          return
        }
      }
      else if (chunk.table){
        if (this.currentMetadata) { 
          this.push(this.formatCurrentQuery())
        }
        this.currentMetadata = chunk
        this.currentBinds = []
        this.push(this.formatCurrentQuery())
      }
      else if (chunk.tables) {
        try {
          this.onTablesFn(chunk)
        }
        catch (e) {
          cb(e)
          return
        }
      }
      else {
        this.currentMetadata = null
      }
      cb()
    }
    
    /** @param {function()} cb signals completion */
    _flush(cb) {
      this.push(this.formatCurrentQuery())
      cb()
    }

    /** 
     * Creates an object with an SQL insert or truncate statement that operates
     * on the current table and any current binds
     * @returns {{table:string, sql:string, valueCount:number}} */
    formatCurrentQuery() {
      const sqlInsert = this.currentBinds.length
        ? `insert into ${this.currentMetadata.table}(${this.currentMetadata.columns}) values ?`
        : `truncate ${this.currentMetadata.table}`
      return {
        table: this.currentMetadata.table,
        sql: dbUtils.pool.format(sqlInsert, [this.currentBinds]),
        valueCount: this.currentBinds.length
      }
    }
  }

  /** 
   * @param {any} record expected to be AppData metadata {..., lastMigration}
   * @returns {undefined}
   * @throws {Error}
   */
  function onMigrationFn(record) {
    if (record.lastMigration !== config.lastMigration)
      throw new Error(`Appdata migration v${record.lastMigration} not equal to v${config.lastMigration}`)
  }
  
  /** @type {import('mysql2/promise').PoolConnection} */
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    await connection.query('SET FOREIGN_KEY_CHECKS=0')
    const gunzip = zlib.createGunzip()
    const jsonl = new ParseJSONLStream({jsonParser: BJSON.parse})
    const queries = new AppDataQueryStream({maxValues: 10000, onTablesFn: progressCb, onMigrationFn})
    pipeline(Readable.from(bufferGz), gunzip, jsonl, queries)
    let seq = 0
    for await (const data of queries) {
      await connection.query(data.sql)
      seq++
      progressCb({seq, table: data.table, valueCount: data.valueCount})
    }
    progressCb({status: 'success', legacyStatus: 'Commit successful'})

  }
  catch (err) {
    progressCb({status: 'fail', error: err.message})
    return undefined
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.query('SET FOREIGN_KEY_CHECKS=1')
      connection.release()
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

  const sqlCountsByCollection = `
  SELECT
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
  GROUP BY
    c.collectionId
  ORDER BY
    c.collectionId
  `

  const sqlLabelCountsByCollection = `
  SELECT
    cast(c.collectionId as char) as collectionId,
    count(distinct cl.clId) as collectionLabelCount,
    count(distinct clam.assetId) as labeledAssetCount,
    count(distinct clam.claId) as assetLabelCount
  FROM
    collection c
    left join collection_label cl on cl.collectionId = c.collectionId
    left join collection_label_asset_map clam on clam.clId = cl.clId
  GROUP BY
    c.collectionId
  `  
  const sqlRestrictedGrantCountsByCollection = `
  select 
    collectionId, 
    json_arrayagg(perUser) as restrictedUserGrantCounts
  from 
    (select
      a.collectionId, 
      json_object('user', usam.userId, 'stigAssetCount', count(usam.saId), 'uniqueAssets', count(distinct sam.assetId)) as perUser
    from 
      user_stig_asset_map usam
      left join stig_asset_map sam on sam.saId=usam.saId
      left join asset a on a.assetId = sam.assetId
    group by
      userId, collectionId)
    as sub
  group by 
    sub.collectionId
`

  const sqlGrantCounts = `
  SELECT 
    collectionId,
    SUM(CASE WHEN accessLevel = 1 THEN 1 ELSE 0 END) AS accessLevel1,
    SUM(CASE WHEN accessLevel = 2 THEN 1 ELSE 0 END) AS accessLevel2,
    SUM(CASE WHEN accessLevel = 3 THEN 1 ELSE 0 END) AS accessLevel3,
    SUM(CASE WHEN accessLevel = 4 THEN 1 ELSE 0 END) AS accessLevel4
  FROM 
    collection_grant
  GROUP BY 
    collectionId
  ORDER BY 
    collectionId
  `
  
  const sqlUserInfo = `
  select 
    userId, 
    lastAccess,
    JSON_UNQUOTE(lastClaims) as lastClaims
  from 
    stigman.user_data
  `
  const sqlOrphanedReviews = `
  SELECT 
    count(distinct r.ruleId) as uniqueOrphanedRules
  FROM 
    review r 
  where 
    r.ruleId not in (select ruleId from rule_version_check_digest)
  `

  const sqlMySqlVersion = `SELECT VERSION() as version`

  const mysqlVarsInMbOnly = [
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
    'tmp_table_size'
  ]

  const mySqlVariablesRawOnly = [
    'innodb_buffer_pool_instances' ,  
    'innodb_io_capacity' , 
    'innodb_io_capacity_max' ,  
    'innodb_flush_sync' ,  
    'innodb_io_capacity_max' ,  
    'innodb_lock_wait_timeout'
  ]

  const sqlMySqlVariablesInMb = `
  SELECT 
    variable_name,
    ROUND(variable_value / (1024 * 1024), 2) AS value
  FROM 
    performance_schema.global_variables
  WHERE 
    variable_name IN (
      ${mysqlVarsInMbOnly.map( v => `'${v}'`).join(',')}
    )
  ORDER by variable_name
  `  
  const sqlMySqlVariablesRawValues = `
  SELECT 
    variable_name,
    variable_value as value
    FROM 
    performance_schema.global_variables
  WHERE 
    variable_name IN (
        ${mysqlVarsInMbOnly.map( v => `'${v}'`).join(',')},
        ${mySqlVariablesRawOnly.map( v => `'${v}'`).join(',')}
    )
    ORDER by variable_name
  `

const mySqlStatusRawOnly = [
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

  const sqlMySqlStatusRawValues = `
  SELECT 
    variable_name,
    variable_value as value
  FROM 
    performance_schema.global_status
  WHERE 
    variable_name IN (
        ${mySqlStatusRawOnly.map( v => `'${v}'`).join(',')}
    )
  ORDER by variable_name
  `

  await dbUtils.pool.query(sqlAnalyze)

  const [schemaInfoArray] = await dbUtils.pool.query(sqlInfoSchema, [config.database.schema])
  let [assetStigByCollection] = await dbUtils.pool.query(sqlCollectionAssetStigs)
  let [countsByCollection] = await dbUtils.pool.query(sqlCountsByCollection)
  let [labelCountsByCollection] = await dbUtils.pool.query(sqlLabelCountsByCollection)
  let [restrictedGrantCountsByCollection] = await dbUtils.pool.query(sqlRestrictedGrantCountsByCollection)
  let [grantCountsByCollection] = await dbUtils.pool.query(sqlGrantCounts)
  const [orphanedReviews] = await dbUtils.pool.query(sqlOrphanedReviews)
  let [userInfo] = await dbUtils.pool.query(sqlUserInfo)
  const [mySqlVersion] = await dbUtils.pool.query(sqlMySqlVersion)
  let [mySqlVariablesInMb] = await dbUtils.pool.query(sqlMySqlVariablesInMb)
  let [mySqlVariablesRaw] = await dbUtils.pool.query(sqlMySqlVariablesRawValues)
  let [mySqlStatusRaw] = await dbUtils.pool.query(sqlMySqlStatusRawValues)

  // remove lastClaims, replace non-stigman roles with "other"
  userInfo = cleanUserData(userInfo)
  //count role assignments and break out by lastAccess time periods
  let userPrivilegeCounts = breakOutRoleUsage(userInfo)

  //create working copy of operational stats
  let operationalStats = _.cloneDeep(logger.overallOpStats)

  // Obfuscate client names in stats if configured (default == true)
  if (config.settings.obfuscateClientsInOptStats == "true") {
    operationalStats = obfuscateClients(operationalStats)
  }

  operationalStats.operationIdStats = sortObjectByKeys(operationalStats.operationIdStats)

  for (const key in mySqlVariablesInMb){
    mySqlVariablesInMb[key].value = `${mySqlVariablesInMb[key].value}M`
  }

  // Create objects keyed by collectionId from arrays of objects
  countsByCollection = createObjectFromKeyValue(countsByCollection, "collectionId")
  labelCountsByCollection = createObjectFromKeyValue(labelCountsByCollection, "collectionId")
  assetStigByCollection = createObjectFromKeyValue(assetStigByCollection, "collectionId")
  restrictedGrantCountsByCollection = createObjectFromKeyValue(restrictedGrantCountsByCollection, "collectionId")
  grantCountsByCollection = createObjectFromKeyValue(grantCountsByCollection, "collectionId")

//Bundle "byCollection" stats together by collectionId
  for(let collectionId in countsByCollection) {
    // Add assetStig data to countsByCollection 
    if (assetStigByCollection[collectionId]) {
      countsByCollection[collectionId].assetStigByCollection = assetStigByCollection[collectionId]
    }
    // Add restrictedGrant data to countsByCollection
    if (restrictedGrantCountsByCollection[collectionId]) {
      countsByCollection[collectionId].restrictedGrantCountsByUser = restrictedGrantCountsByCollection[collectionId].restrictedUserGrantCounts
      countsByCollection[collectionId].restrictedGrantCountsByUser = createObjectFromKeyValue(countsByCollection[collectionId].restrictedGrantCountsByUser, "user")
    }
    else {
      countsByCollection[collectionId].restrictedGrantCountsByUser = 0
    }
    // Add grant data to countsByCollection
    if (grantCountsByCollection[collectionId]) {
      countsByCollection[collectionId].grantCounts = grantCountsByCollection[collectionId]
    }
    else {
      countsByCollection[collectionId].grantCounts = 0
    }    
    // Add labelCounts data to countsByCollection
    if (labelCountsByCollection[collectionId]) {
      countsByCollection[collectionId].labelCounts = labelCountsByCollection[collectionId]
    }
  }
  

  return ({
    dateGenerated: new Date().toISOString(),
    stigmanVersion: config.version,
    stigmanCommit: config.commit,
    dbInfo: {
      tables: createObjectFromKeyValue(schemaInfoArray, "tableName"),
    },
    countsByCollection,
    uniqueRuleCountOfOrphanedReviews: orphanedReviews[0].uniqueOrphanedRules,
    userInfo: createObjectFromKeyValue(userInfo, "userId"),
    userPrivilegeCounts,
    operationalStats,
    nodeUptime: getNodeUptime(),
    nodeMemoryUsageInMb: getNodeMemoryUsage(),
    mySqlVersion: mySqlVersion[0].version,
    mySqlVariablesInMb: createObjectFromKeyValue(mySqlVariablesInMb, "variable_name", "value"),
    mySqlVariablesRaw: createObjectFromKeyValue(mySqlVariablesRaw, "variable_name", "value"),
    mySqlStatusRaw: createObjectFromKeyValue(mySqlStatusRaw, "variable_name", "value")
  })
}

// Reduce an array of objects to a single object, using the value of one property as keys
// and either assigning the rest of the object or the value of a second property as the value.
function createObjectFromKeyValue(data, keyPropertyName, valuePropertyName = null) {
  return data.reduce((acc, item) => {
    const { [keyPropertyName]: key, ...rest } = item
    acc[key] = valuePropertyName ? item[valuePropertyName] : rest
    return acc
  }, {})
}

function obfuscateClients(operationalStats) {
  const obfuscationMap = {}
  let obfuscatedCounter = 1

  function getObfuscatedKey(client) {
    if (client === "unknown") {
      return client
    }
    if (!obfuscationMap[client]) {
      obfuscationMap[client] = `client${obfuscatedCounter++}`
    }
    return obfuscationMap[client]
  }

  const operationIdStats = operationalStats.operationIdStats

  for (const operationId in operationIdStats) {
    if (operationIdStats[operationId].clients) {
      const clients = operationIdStats[operationId].clients
      const newClients = {}
      
      for (const clientName in clients) {
        const obfuscatedName = getObfuscatedKey(clientName)
        newClients[obfuscatedName] = clients[clientName]
      }
      
      operationIdStats[operationId].clients = newClients
    }
  }

  return operationalStats
}

function sortObjectByKeys(obj) {
  // Extract property names and sort them
  const sortedKeys = Object.keys(obj).sort()
  // Create a new object and add properties in sorted order
  const sortedObj = {}
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key]
  }
  return sortedObj
}

function breakOutRoleUsage(userInfo) {
  let roleCounts = {
    overall: {},
    activeInLast30Days: {},
    activeInLast90Days: {}
  }
  
  // Calculate the timestamps for 30 and 90 days ago
  const currentTime = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = currentTime - (30 * 24 * 60 * 60)
  const ninetyDaysAgo = currentTime - (90 * 24 * 60 * 60)
  
  userInfo.forEach(user => {
      // Function to update counts
      const updateCounts = (roleCounts, roles) => {
        roles.forEach(role => {
          if (roleCounts[role]) {
            roleCounts[role]++
          } else {
            roleCounts[role] = 1
          }
        })
      }
      // Update overall counts
      updateCounts(roleCounts.overall, user.roles)
      // Update counts for the last 30 and 90 days based on lastAccess
      if (user.lastAccess >= ninetyDaysAgo) {
        updateCounts(roleCounts.activeInLast90Days, user.roles)
      }
      if (user.lastAccess >= thirtyDaysAgo) {
        updateCounts(roleCounts.activeInLast30Days, user.roles)
      }
    }
  )
  return roleCounts
}  

// Replace non-stigman roles with "other"
function replaceRoles(roles) {
  return roles.map(role => (role !== 'admin' && role !== 'create_collection') ? 'other' : role)
}

// Clean up user info
function cleanUserData(userInfo) {
  return userInfo.map(user => {
    if (user.lastClaims) {
      user.roles = replaceRoles(privilegeGetter(JSON.parse(user.lastClaims)))
      delete user.lastClaims
    }
    return user
  })
}

function getNodeUptime() {
  let uptime = process.uptime()
  let days = Math.floor(uptime / 86400)
  uptime %= 86400
  let hours = Math.floor(uptime / 3600)
  uptime %= 3600
  let minutes = Math.floor(uptime / 60)
  let seconds = Math.floor(uptime % 60)
  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`
}

function getNodeMemoryUsage() {
  const memoryData = process.memoryUsage()
  const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100}`
  return {
      rss: `${formatMemoryUsage(memoryData.rss)}`, //Resident Set Size - total memory allocated for the process execution
      heapTotal: `${formatMemoryUsage(memoryData.heapTotal)}`, // total size of the allocated heap
      heapUsed: `${formatMemoryUsage(memoryData.heapUsed)}`, // actual memory used during the execution
      external: `${formatMemoryUsage(memoryData.external)}` // V8 external memory
  }
}
