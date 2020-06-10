'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

const _this = this

/**
Generalized queries for users
**/
exports.queryUsers = async function (inProjection, inPredicates, elevate, userObject) {
  let connection
  try {
    let columns = [
      'ud.userId',
      'ud.username',
      'ud.display',
      'ud.email',
      'ud.globalAccess',
      'ud.canCreatePackage',
      'ud.canAdmin'
    ]
    let joins = [
      'user_data ud'
    ]
    let groupBy = [
      'ud.userId',
      'ud.username',
      'ud.display',
      'ud.email',
      'ud.globalAccess',
      'ud.canCreatePackage',
      'ud.canAdmin'
    ]

    // PROJECTIONS
    if (inProjection && inProjection.includes('grants')) {
      joins.push('left join package_grant pg on ud.userId = pg.userId')
      joins.push('left join package p on pg.packageId = p.packageId')
      columns.push(`case when count(pg.pgId) > 0 then 
      json_arrayagg(
        json_object(
          'package', json_object(
            'packageId', pg.packageId,
            'name', p.name
          ),
          'accessLevel', pg.accessLevel
        )
      ) else json_array() end as grants`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.userId) {
      predicates.statements.push('ud.userid = :userId')
      predicates.binds.userId = inPredicates.userId
    }

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(',\n')
    sql += ' FROM '
    sql+= joins.join(' \n')
    if (predicates.statements.length > 0) {
      sql += '\nWHERE ' + predicates.statements.join(' and ')
    }
    sql += '\nGROUP BY ' + groupBy.join(',\n')
    sql += ' order by ud.username'
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
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

exports.addOrUpdateUser = async function (writeAction, userId, body, projection, elevate, userObject) {
  let connection 
  try {
    // CREATE: userId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let { grants, ...userFields } = body

    // Convert boolean values to database value (true=1 or false=0)
    userFields.globalAccess = userFields.globalAccess ? 1 : 0
    userFields.canCreatePackage = userFields.canCreatePackage ? 1 : 0
    userFields.canAdmin = userFields.canAdmin ? 1 : 0

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION');

    // Process scalar properties
    let binds
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into user_data
      binds = {...userFields}
      let sqlInsert =
        `INSERT INTO
            user_data
            ( username, display, globalAccess, canCreatePackage, canAdmin)
          VALUES
            (:username, :display, :globalAccess, :canCreatePackage, :canAdmin)`
      let [result] = await connection.query(sqlInsert, binds)
      userId = result.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      binds = {
        userId: userId,
        values: userFields
      }
      if (Object.keys(binds.values).length > 0) {
        let sqlUpdate =
          `UPDATE
              user_data
            SET
              :values
            WHERE
              userid = :userId`
        await connection.query(sqlUpdate, binds)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process grants if present
    if (grants) {
      if ( writeAction !== dbUtils.WRITE_ACTION.CREATE ) {
        // DELETE from package_grant
        let sqlDeletePkgGrant = 'DELETE FROM package_grant where userId = ?'
        await connection.query(sqlDeletePkgGrant, [userId])
      }
      if (grants.length > 0) {
        let sqlInsertPkgGrant = `
          INSERT INTO 
            package_grant (userId, packageId, accessLevel)
          VALUES
            ?`      
        binds = grants.map( grant => [userId, grant.packageId, grant.accessLevel])
        // INSERT into package_grant
        await connection.execute(sqlInsertPkgGrant, binds)
      }
    }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    await connection.rollback()
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

  // Fetch the new or updated User for the response
  try {
    let row = await _this.getUserByUserId(userId, projection, elevate, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}


/**
 * Create a User
 *
 * body UserAssign 
 * projection List Additional properties to include in the response.  (optional)
 * returns List
 **/
exports.createUser = async function(body, projection, elevate, userObject) {
  try {
    let row = await _this.addOrUpdateUser(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete a User
 *
 * projection List Additional properties to include in the response.  (optional)
 * returns UserProjected
 **/
exports.deleteUser = async function(userId, projection, elevate, userObject) {
  try {
    let row = await _this.queryUsers(projection, { userId: userId }, elevate, userObject)
    let sqlDelete = `DELETE FROM user_data where userId = ?`
    await dbUtils.pool.query(sqlDelete, [userId])
    return (row[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a User
 *
 * userId Integer Selects a User
 * projection List Additional properties to include in the response.  (optional)
 * returns UserProjected
 **/
exports.getUserByUserId = async function(userId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryUsers( projection, {
      userId: userId
    }, elevate, userObject)
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Users accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * role UserRole  (optional)
 * dept String Selects Users exactly matching a department string (optional)
 * canAdmin Boolean Selects Users matching the condition (optional)
 * returns List of UserProjected
 **/
exports.getUsers = async function(projection, elevate, userObject) {
  try {
    let rows = await _this.queryUsers( projection, {}, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await _this.addOrUpdateUser(dbUtils.WRITE_ACTION.REPLACE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.updateUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await _this.addOrUpdateUser(dbUtils.WRITE_ACTION.UPDATE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

