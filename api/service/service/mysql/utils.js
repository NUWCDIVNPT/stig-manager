const mysql = require('mysql2/promise');
const config = require('../../utils/config')

module.exports.version = '0.6'

module.exports.initializeDatabase = function () {
  let pool = mysql.createPool({
    connectionLimit : 10,
    host            : config.database.host,
    port            : config.database.port,
    user            : config.database.username,
    password        : config.database.password,
    typeCast: function (field, next) {
      if (field.type == 'JSON') {
        return (JSON.parse(field.string())); 
      }
      return next();
    } 
  })
  module.exports.pool = pool
}

module.exports.getUserObject = async function (username) {
  let connection, sql, binds
  try {
    connection = await this.pool.getConnection()
    sql = `
      SELECT
        ud.id,
        ud.cn,
        ud.name,
        ud.dept,
        r.role,
        ud.canAdmin
      from 
        stigman.user_data ud
        left join stigman.role r on r.id=ud.roleId
      where
        UPPER(cn)=UPPER(?)
      `
    binds = [username]
    const [result, fields] = await connection.query(sql, binds)
    connection.release()
    result[0].canAdmin = result[0].canAdmin == 1
    return (result[0])
  }
  catch (err) {
    throw err
  }
  finally {
    connection.release()
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

