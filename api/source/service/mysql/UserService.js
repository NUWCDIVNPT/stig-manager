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
      'CAST(ud.userId as char) as userId',
      'ud.username',
      'ud.display',
      'ud.email',
      'ud.metadata'
    ]
    let joins = [
      'user_data ud'
    ]
    let groupBy = [
      'ud.userId',
      'ud.username',
      'ud.display',
      'ud.email',
      'ud.metadata'
    ]

    // PROJECTIONS
    if (inProjection && inProjection.includes('privileges')) {
      columns.push(`json_object(
          'globalAccess', cast (ud.globalAccess is true as json),
          'canCreateCollection', cast (ud.canCreateCollection is true as json),
          'canAdmin', cast (ud.canAdmin is true as json)
        ) as privileges`)
      groupBy.push(
        'ud.globalAccess',
        'ud.canCreateCollection',
        'ud.canAdmin'
      )
    }

    if (inProjection && inProjection.includes('collectionGrants')) {
      joins.push('left join collection_grant pg on ud.userId = pg.userId')
      joins.push('left join collection p on pg.collectionId = p.collectionId')
      columns.push(`case when count(pg.pgId) > 0 then 
      json_arrayagg(
        json_object(
          'collection', json_object(
            'collectionId', CAST(pg.collectionId as char),
            'name', p.name
          ),
          'accessLevel', pg.accessLevel
        )
      ) else json_array() end as collectionGrants`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.userId) {
      predicates.statements.push('ud.userId = :userId')
      predicates.binds.userId = inPredicates.userId
    }
    if (inPredicates.username) {
      predicates.statements.push('ud.username = :username')
      predicates.binds.username = inPredicates.username
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
      await connection.release()
    }
  }
}

exports.addOrUpdateUser = async function (writeAction, userId, body, projection, elevate, userObject) {
  let connection 
  try {
    // CREATE: userId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let { collectionGrants, ...userFields } = body

    // Handle userFields.privileges object
    userFields.globalAccess = userFields.privileges.globalAccess ? 1 : 0
    userFields.canCreateCollection = userFields.privileges.canCreateCollection ? 1 : 0
    userFields.canAdmin = userFields.privileges.canAdmin ? 1 : 0
    delete userFields.privileges

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
            ( username, display, email, globalAccess, canCreateCollection, canAdmin, metadata)
          VALUES
            (:username, :display, :email, :globalAccess, :canCreateCollection, :canAdmin, :metadata)`
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
    if (collectionGrants) {
      if ( writeAction !== dbUtils.WRITE_ACTION.CREATE ) {
        // DELETE from collection_grant
        let sqlDeletePkgGrant = 'DELETE FROM collection_grant where userId = ?'
        await connection.query(sqlDeletePkgGrant, [userId])
      }
      if (grants.length > 0) {
        let sqlInsertPkgGrant = `
          INSERT INTO 
            collection_grant (userId, collectionId, accessLevel)
          VALUES
            ?`      
        binds = collectionGrants.map( grant => [userId, grant.collectionId, grant.accessLevel])
        // INSERT into collection_grant
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
exports.getUsers = async function(username, projection, elevate, userObject) {
  try {
    let rows = await _this.queryUsers( projection, {
      username: username
    }, elevate, userObject)
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

