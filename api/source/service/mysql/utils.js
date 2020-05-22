const mysql = require('mysql2/promise');
const config = require('../../utils/config')
const retry = require('async-retry')
const Umzug = require('umzug')
const path = require('path')

let _this = this

module.exports.version = '0.6'
module.exports.testConnection = async function () {
  try {
    let [result] = await _this.pool.query('SHOW DATABASES')
    console.log('MySQL preflight connection succeeded.')
    return JSON.stringify(result, null, 2)
  }
  catch (err) {
    console.log(err.message)
    throw (err)
  }
}

module.exports.initializeDatabase = async function () {
  try {
    // Create the connection pool
    _this.pool = mysql.createPool({
      connectionLimit : 10,
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
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
    })
    // Set common session variables
    _this.pool.on('connection', function (connection) {
      connection.query('SET SESSION group_concat_max_len=10000000')
    })

    // Call the pool destruction methods on SIGTERM and SEGINT
    async function closePoolAndExit() {
      console.log('\nTerminating');
      try {
        await _this.pool.end()
        console.log('Pool closed');
        process.exit(0);
      } catch(err) {
        console.error(err.message);
        process.exit(1);
      }
    }   
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
      storage: path.join(__dirname, './migrations/lib/umzug-mysql-storage'),
      storageOptions: {
        pool: _this.pool
      }
    })
    const migrations = await umzug.pending()
    if (migrations.length > 0) {
      console.log(`MySQL schema requires ${migrations.length} update${migrations.length > 1 ? 's' : ''}.`)
      await umzug.up()
      console.log('All migrations performed successfully')
    }
    else {
      console.log(`MySQL schema is up to date.`)
    }

    // Initialize superuser, if applicable
    let [rows] = await _this.pool.query('SELECT COUNT(userId) as users FROM user')
    if (rows[0].users === 0) {
      await _this.pool.query(
        'insert into user (username, display, roleId, canAdmin) VALUES (?, ?, ?, ?)',
        [config.init.superuser, 'Superuser', 4, 1]
      )
      console.log(`Mapped STIG Manager superuser => ${config.init.superuser}`)
    }
  }
  catch (err) {
    throw (err)
  }  
}

module.exports.getUserObject = async function (username) {
  let sql, binds
  try {    
    sql = `
      SELECT
        ud.userId as id,
        ud.username as cn,
        ud.display as name,
        ud.dept,
        r.role,
        ud.canAdmin
      from 
        stigman.user ud
        left join stigman.role r on r.id=ud.roleId
      where
        UPPER(username)=UPPER(?)
      `
    binds = [username]
    const [rows] = await _this.pool.query(sql, binds)
    return (rows[0])
  }
  catch (err) {
    throw err
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
module.exports.userHasAssetRule = async function (assetId, ruleId, elevate, userObject) {
  try {
    let context, sql
    if (userObject.role == 'Staff' || elevate) {
      return true
    } else if (userObject.role == "IAO") {
      context = dbUtils.CONTEXT_DEPT
      sql = `
        SELECT
          a.assetId
        FROM
          asset a
        WHERE
          a.assetId = ? and a.dept = ?
      `
      let [rows] = await _this.pool.query(sql, [assetId, userObject.dept])
      return rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          rgr.ruleId
        FROM
          user_stig_asset_map usa
          inner join stig_asset_map sa on (usa.assetId = sa.assetId and usa.benchmarkId = sa.benchmarkId)
          inner join revision rev on sa.benchmarkId = rev.benchmarkId
          inner join rev_group_map rg on rev.revId = rg.revId
          inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = ? and assetId = ? and ruleId = ?`
      let [rows] = await _this.pool.query(sql, [userObject.id, assetId, ruleId])
      return rows.length > 0   
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
    if (userObject.role == 'Staff' || elevate) {
      return true
    } else if (userObject.role == "IAO") {
      sql = `
        SELECT
          a.assetId
        FROM
          asset a
        WHERE
          a.assetId = ? and a.dept = ?
      `
      let [rows] = await _this.pool.query(sql, [assetId, userObject.dept])
      return rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          sa.benchmarkId
        FROM
          user_stig_asset_map usa
          inner join stig_asset_map sa on (usa.assetId = sa.assetId and usa.benchmarkId = sa.benchmarkId)
        WHERE
          usa.userId = ? and assetId = ? and benchmarkId = ?`
      let [rows] = await _this.pool.query(sql, [userObject.id, assetId, benchmarkId])
      return rows.length > 0   
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
          asset a
        WHERE
          a.assetId = ? and a.dept = ?
      `
      let [allowedAssets] = await _this.pool.query(sql, [assetId, userObject.dept])
      // allowedAssets has permitted assetIds
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
          CONCAT(sa.assetId, '-', rgr.ruleId) as permitted
        FROM
          user_stig_asset_map usa
          inner join stig_asset_map sa on (usa.assetId = sa.assetId and usa.benchmarkId = sa.benchmarkId)
          inner join revision rev on sa.benchmarkId = rev.benchmarkId
          inner join rev_group_map rg on rev.revId = rg.revId
          inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = ?`
      let [rows] = await _this.pool.query(sql, [userObject.id])
      let allowedAssetRules = rows.map(r => r.permitted)
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

