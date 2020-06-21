const oracledb = require('oracledb')
const config = require('../../utils/config')
const retry = require('async-retry')
const Umzug = require('umzug')
const path = require('path')


let _this = this

module.exports.version = '0.5.0'
module.exports.testConnection = async function () {
  let connection
  try {
    connection = await oracledb.getConnection()
    let result = await connection.execute('SELECT * FROM USER_USERS')
    console.log('Oracle pre-flight connection succeeded.')
    return JSON.stringify(result.rows, null, 2)
  }
  catch (err) {
    console.log(err.message)
    throw (err)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }
}

module.exports.initializeDatabase = function () {
  return new Promise((resolve, reject) => {
    // Try to create the connection pool
    oracledb.createPool({
      user: config.database.username,
      password: config.database.password,
      connectString: `${config.database.host}:${config.database.port}/${config.database.service}`
    }, async (error, pool) => {
      if (error) {
        // Could not create pool, invoke reject cb
        reject(error)
      }
      // Pool was created
      console.log('Oracle connection pool created')
      console.log('Attempting pre-flight connection to Oracle.')

      // Call the pool destruction methods on SIGTERM and SEGINT
      process.on('SIGTERM', closePoolAndExit)
      process.on('SIGINT', closePoolAndExit)

      // Preflight the pool
      let result = await retry(_this.testConnection, {})
      console.log(result)

      // Perform migrations
      const umzug = new Umzug({
        migrations: {
          path: path.join(__dirname, './migrations'),
          params: [_this.pool]
        },
        storage: path.join(__dirname, './migrations/lib/umzug-oracle-storage'),
        storageOptions: {}
      })
      const migrations = await umzug.pending()
      if (migrations.length > 0) {
        console.log(`Oracle schema requires ${migrations.length} update${migrations.length > 1 ? 's' : ''}.`)
        await umzug.up()
        console.log('All migrations performed successfully')
      }
      else {
        console.log(`Oracle schema is up to date.`)
      }
      // Initialize superuser, if applicable
      let connection
      try {
        connection = await oracledb.getConnection()
        let result = await connection.execute('SELECT COUNT(userId) as users FROM user_data')
        if (result.rows[0][0] === 0) {
          await connection.execute(
            'insert into user_data (username, display, deptId, accessLevel, canAdmin) VALUES (:1, :2, :3, :4, :5)',
            [config.init.superuser, 'Superuser', 1, 3, 1],
            {autoCommit: true}
          )
          console.log(`Mapped STIG Manager superuser => ${config.init.superuser}`)
          }
      }
      catch (err) {
        console.log(err)
      }
      finally {
        if (typeof connection !== 'undefined') {
          await connection.close()
        }
      }
      resolve(true)
    })
  })
}

async function closePoolAndExit() {
  console.log('\nTerminating');
  try {
    // Get the pool from the pool cache and close it when no
    // connections are in use, or force it closed after 10 seconds
    // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
    await oracledb.getPool().close(10);
    console.log('Pool closed');
    process.exit(0);
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}   


module.exports.getUserObject = async function (username) {
  let connection, sql, binds, options, result
  try {
    connection = await oracledb.getConnection()
    sql = `
      SELECT
        ud.userid as "userId",
        ud.username as "username",
        ud.display as "display",
        json_object(
          KEY 'deptId' VALUE d.deptId,
          KEY 'name' VALUE d.name
        ) as "dept",
        ud.accessLevel as "accessLevel",
        ud.canAdmin as "canAdmin"
      from 
        user_data ud
        left join department d on d.deptId = ud.deptId
      where
        UPPER(username)=UPPER(:0)
      `
    binds = [username]
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
    }
    result = await connection.execute(sql, binds, options)
    if (result.rows.length === 0) {
      throw new Error(`Account ${username} is not registered.`)
    }
    result.rows[0].canAdmin = result.rows[0].canAdmin == 1
    result.rows[0].dept = JSON.parse(result.rows[0].dept)
    return (result.rows[0])
  }
  catch (err) {
      throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }     
}

module.exports.objectBind = function (object, binds) {
  let sqlStubs = [], column
  for (const property in object) {
    if (property === 'accessLevel') { column === 'accessLevel'}
    sqlStubs.push(`${property} = :${property}`)
    binds.push(object[property])
  }
  return sqlStubs.join(',')
}

module.exports.objectBindObject = function (object, binds) {
  let sqlStubs = [], column
  for (const property in object) {
    if (property === 'accessLevel') { column === 'accessLevel'}
    sqlStubs.push(`${column||property} = :${property}`)
    binds[property] = (object[property])
  }
  return sqlStubs.join(',')
}

module.exports.parseRevisionStr = function (revisionStr) {
  let ro = {}
  if (revisionStr !== 'latest') {
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    ro.version = results[1]
    ro.release = results[2]
    ro.table = 'revision'
    ro.table_alias = 'r'
    ro.predicates = ' and r.version = :version and r.release = :release '
  } else {
    ro.version = null
    ro.release = null
    ro.table = 'current_rev'
    ro.table_alias = 'cr'
    ro.predicates = ''
  }
  return ro
}

module.exports.CONTEXT_ALL = 'all'
module.exports.CONTEXT_DEPT = 'department'
module.exports.CONTEXT_USER = 'user'
module.exports.CONTEXT_GUEST = 'guest'
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

// Returns Boolean
module.exports.userHasAssetStig = async function (assetId, benchmarkId, elevate, userObject) {
  try {
    let sql
    if (userObject.accessLevel === 3 || elevate ) {
      return true
    } 
    else if (userObject.accessLevel === 2) {
      sql = `
        SELECT
          a.assetId
        FROM
          asset a
        WHERE
          a.assetId = :assetId and a.deptId = :deptId
      `
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [assetId, userObject.dept.deptId])
      await connection.close()
      return result.rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          sa.benchmarkId
        FROM
          user_stig_asset_map usa
          inner join stig_asset_map sa on usa.saId = sa.saId
        WHERE
          usa.userId = :userId and assetId = :assetId and benchmarkId = :benchmarkId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.userId, assetId, benchmarkId])
      await connection.close()
      return result.rows.length > 0   
    }
  }
  catch (e) {
    throw (e)
  }
}


// @param reviews Array List of Review objects
// @param elevate Boolean 
// @param userObject Object
module.exports.scrubReviewsByUser = async function(reviews, elevate, userObject) {
  let connection
  try {
    let context, sql, permitted = [], forbidden = []
    if (userObject.accessLevel === 3 || elevate) {
      permitted = reviews
    } 
    else if (userObject.accessLevel === 2) {
      context = dbUtils.CONTEXT_DEPT
      sql = `
        SELECT
          a.assetId
        FROM
          asset a
        WHERE
          a.assetId = :assetId and a.deptId = :deptId
      `
      connection = await oracledb.getConnection()
      let allowedAssets = await connection.execute(sql, [assetId, userObject.dept.deptId])
      // result.rows has legal assetIds
      reviews.forEach(review => {
        if (allowedAssets.includes(review.assetId)) {
          permitted.push(review)
        }
        else {
          forbidden.push(review)
        }
      })
    } 
    else {
      sql = `
        SELECT
          sa.assetId || '-' || rgr.ruleId
        FROM
          user_stig_asset_map usa
          inner join stig_asset_map sa on usa.saId = sa.saId
          inner join revision rev on sa.benchmarkId = rev.benchmarkId
          inner join rev_group_map rg on rev.revId = rg.revId
          inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = :userId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.userId], {outFormat: oracledb.OUT_FORMAT_ARRAY})
      let allowedAssetRules = result.rows.flat() // Requires Node 12
      await connection.close()
      reviews.forEach(review => {
        if (allowedAssetRules.includes(`${review.assetId}-${review.ruleId}`)) {
          permitted.push(review)
        }
        else {
          forbidden.push(review)
        }
      })
    }
    return {
      permitted: permitted,
      forbidden: forbidden
    }

  }
  catch (e) {
    throw (e)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }

}

// Returns integer jobId
module.exports.insertJobRecord = async function (record) {
	let sql = `
	insert into imported_jobs (
    startTime ,userId	,source	,assetId ,benchmarkId
    ,collectionId ,filename ,filesize
	)
	VALUES
		(SYSDATE, :userId, :source, :assetId, :benchmarkId, :collectionId, :filename, :filesize)
	RETURNING
		jobId into :jobId
`
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    record.jobId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, record, options)
    jobId = result.outBinds.jobId[0]
    await connection.close()
    return jobId
  }
  catch (e) {
    throw (e)
  }
}
