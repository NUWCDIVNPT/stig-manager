const oracledb = require('oracledb')
const config = require('../../utils/config')

module.exports.initializeDatabase = function () {
  return new Promise((resolve, reject) => {
    // Try to create the connection pool
    oracledb.createPool({
      user: config.database.username,
      password: config.database.password,
      connectString: `${config.database.host}:${config.database.port}/${config.database.service}`
    }, (error, pool) => {
      if (error) {
        // Could not create pool, invoke reject cb
        reject(error)
      }
      // Pool was created
      console.log('Oracle connection pool created')

      // Call the pool destruction methods on SIGTERM and SEGINT
      process.on('SIGTERM', closePoolAndExit)
      process.on('SIGINT', closePoolAndExit)

      // Check if we can make a connection. Will recurse until success.
      testConnection()

      function testConnection() {
        console.log(`Testing Oracle connection to ${config.database.host}:${config.database.port}/${config.database.service}`)
        oracledb.getConnection((error, connection) => {
          if (error) {
            console.log(`Oracle connection failed. Retry in 5 seconds...`)
            setTimeout(testConnection, 5000)
            return
          }
          console.log(`Oracle connection succeeded.`)
          connection.close()
          resolve()
        })
      }
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
        ud.id as "id",
        ud.cn as "cn",
        ud.name as "name",
        ud.dept as "dept",
        r.role as "role",
        ud.canAdmin as "canAdmin"
      from 
        user_data ud
        left join roles r on r.id=ud.roleId
      where
        UPPER(cn)=UPPER(:0)
      `
    binds = [username]
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
    }
    result = await connection.execute(sql, binds, options)
    await connection.close()
    result.rows[0].canAdmin = result.rows[0].canAdmin == 1
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
module.exports.REVIEW_STATE_ID = { 
  1: {state: 'In Progress', abbr: 'IP'},
  2: {state: 'Not Applicable', abbr: 'NA'},
  3: {state: 'Not a Finding', abbr: 'NF'},
  4: {state: 'Open', abbr: 'O'}
}
module.exports.REVIEW_STATE_ABBR = { 
  'IP': {state: 'In Progress', id: 1},
  'NA': {state: 'Not Applicable', id: 2},
  'NF': {state: 'Not a Finding', id: 3},
  'O': {state: 'Open', id: 4}
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

// Returns Boolean
module.exports.userAllowedAssetRule = async function (assetId, ruleId, elevate, userObject) {
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
