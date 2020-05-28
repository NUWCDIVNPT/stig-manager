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
    console.log('Oracle preflight connection succeeded.')
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
            'insert into user_data (username, display, roleId, canAdmin) VALUES (:1, :2, :3, :4)',
            [config.init.superuser, 'Superuser', 4, 1],
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
        json_object(
          KEY 'roleId' VALUE r.roleId,
          KEY 'name' VALUE r.display
        ) as "role",
        ud.canAdmin as "canAdmin"
      from 
        user_data ud
        left join department d on d.deptId = ud.deptId
        left join role r on r.roleid = ud.roleId
      where
        UPPER(username)=UPPER(:0)
      `
    binds = [username]
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
    }
    result = await connection.execute(sql, binds, options)
    await connection.close()
    result.rows[0].canAdmin = result.rows[0].canAdmin == 1
    result.rows[0].dept = JSON.parse(result.rows[0].dept)
    result.rows[0].role = JSON.parse(result.rows[0].role)
    return (result.rows[0])
  }
  catch (err) {
      throw err
  }     
}

module.exports.objectBind = function (object, binds) {
  let sqlStubs = []
  for (const property in object) {
    sqlStubs.push(`${property} = :${property}`)
    binds.push(object[property])
  }
  return sqlStubs.join(',')
}

module.exports.objectBindObject = function (object, binds) {
  let sqlStubs = []
  for (const property in object) {
    sqlStubs.push(`${property} = :${property}`)
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
    ro.table = 'stigs.revisions'
    ro.table_alias = 'r'
    ro.predicates = ' and r.version = :version and r.release = :release '
  } else {
    ro.version = null
    ro.release = null
    ro.table = 'stigs.current_revs'
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
  1: {result: 'In Progress', abbr: 'IP'},
  2: {result: 'Not Applicable', abbr: 'NA'},
  3: {result: 'Not a Finding', abbr: 'NF'},
  4: {result: 'Open', abbr: 'O'}
}
module.exports.REVIEW_RESULT_ABBR = { 
  'IP': {result: 'In Progress', id: 1},
  'NA': {result: 'Not Applicable', id: 2},
  'NF': {result: 'Not a Finding', id: 3},
  'O': {result: 'Open', id: 4}
}
module.exports.REVIEW_ACTION_ID = { 
  1: 'Remediate',
  2: 'Mitigate',
  3: 'Exception'
}
module.exports.REVIEW_ACTION_STR = { 
  'Remediate': 1,
  'Mitigate': 2,
  'Exception': 3
}
module.exports.REVIEW_STATUS_ID = { 
  0: 'saved',
  1: 'submitted',
  2: 'rejected',
  3: 'approved'
}
module.exports.REVIEW_STATUS_STR = { 
  'saved': 0,
  'submitted': 1,
  'ready': 1,
  'rejected': 2,
  'approved': 3
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
module.exports.userHasAssetRule = async function (assetId, ruleId, elevate, userObject) {
  try {
    let context, sql
    if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
      return true
    } else if (userObject.role == "IAO") {
      context = dbUtils.CONTEXT_DEPT
      sql = `
        SELECT
          a.assetId
        FROM
          stigman.assets a
        WHERE
          a.assetId = :assetId and a.dept = :dept
      `
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [assetId, userObject.dept])
      await connection.close()
      return result.rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          rgr.ruleId
        FROM
          stigman.user_stig_asset_map usa
          inner join stigman.stig_asset_map sa on usa.saId = sa.saId
          inner join stigs.revisions rev on sa.stigId = rev.stigId
          inner join stigs.rev_group_map rg on rev.revId = rg.revId
          inner join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = :userId and assetId = :assetId and ruleId = :ruleId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.id, assetId, ruleId])
      await connection.close()
      return result.rows.length > 0   
    }
  }
  catch (e) {
    throw (e)
  }
}

// Returns Boolean
module.exports.userHasAssetStig = async function (assetId, benchmarkId, elevate, userObject) {
  try {
    let sql
    if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
      return true
    } else if (userObject.role == "IAO") {
      sql = `
        SELECT
          a.assetId
        FROM
          stigman.assets a
        WHERE
          a.assetId = :assetId and a.dept = :dept
      `
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [assetId, userObject.dept])
      await connection.close()
      return result.rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          sa.stigId
        FROM
          stigman.user_stig_asset_map usa
          inner join stigman.stig_asset_map sa on usa.saId = sa.saId
        WHERE
          usa.userId = :userId and assetId = :assetId and stigId = :benchmarkId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.id, assetId, benchmarkId])
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
  try {
    let context, sql, permitted = [], rejected = []
    if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
      permitted = reviews
    } 
    else if (userObject.role == "IAO") {
      context = dbUtils.CONTEXT_DEPT
      sql = `
        SELECT
          a.assetId
        FROM
          stigman.assets a
        WHERE
          a.assetId = :assetId and a.dept = :dept
      `
      let connection = await oracledb.getConnection()
      let allowedAssets = await connection.execute(sql, [assetId, userObject.dept])
      await connection.close()
      // result.rows has legal assetIds
      reviews.forEach(review => {
        if (allowedAssets.includes(review.assetId)) {
          permitted.push(review)
        }
        else {
          rejected.push(review)
        }
      })
    } 
    else {
      sql = `
        SELECT
          sa.assetId || '-' || rgr.ruleId
        FROM
          stigman.user_stig_asset_map usa
          inner join stigman.stig_asset_map sa on usa.saId = sa.saId
          inner join stigs.revisions rev on sa.stigId = rev.stigId
          inner join stigs.rev_group_map rg on rev.revId = rg.revId
          inner join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = :userId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.id], {outFormat: oracledb.OUT_FORMAT_ARRAY})
      let allowedAssetRules = result.rows.flat() // Requires Node 12
      await connection.close()
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

// Returns integer jobId
module.exports.insertJobRecord = async function (record) {
	let sql = `
	insert into imported_jobs (
    startTime ,userId	,source	,assetId ,stigId
    ,packageId ,filename ,filesize
	)
	VALUES
		(SYSDATE, :userId, :source, :assetId, :benchmarkId, :packageId, :filename, :filesize)
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
