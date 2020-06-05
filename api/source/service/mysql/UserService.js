'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
Generalized queries for users
**/
exports.queryUsers = async function (inProjection, inPredicates, elevate, userObject) {
  let connection
  try {
    let context
    if (elevate) {
      context = dbUtils.CONTEXT_ALL
    }
    else {
      switch (userObject.accessLevel) {
        case 3:
          context = dbUtils.CONTEXT_ALL
          break
        case 2:
          context = dbUtils.CONTEXT_DEPT
          break
        case 1:
          context = dbUtils.CONTEXT_USER
          break
        case ROLE.GUEST:
          context = dbUtils.CONTEXT_GUEST
          break;
      }
    }

    let columns = [
      'ud.userId',
      'ud.username',
      'ud.display',
      `json_object (
        'deptId', d.deptId,
        'name', d.name
      ) as "dept"`,
      'ud.accessLevel',
      'ud.canAdmin'
    ]
    let joins = [
      'user_data ud',
      'left join department d on ud.deptId = d.deptId'
    ]

    // PROJECTIONS
    if (inProjection && inProjection.includes('stigReviews')) {
      columns.push(`(with cte as 
        (select
          json_arrayagg( 
            json_object(
              'benchmarkId', sa.benchmarkId,
              'asset', json_object(
                'assetId', a.assetid,
                'name', a.name,
                'dept', json_object (
                  'deptId', a.deptId,
                  'name', d.name
                )
              )
            )
          ) OVER (partition by userId ORDER BY benchmarkId desc, a.name desc)  as stigReviews,
          ROW_NUMBER() OVER (partition by userId ORDER BY benchmarkId, a.name) as rn
        FROM 
          stig_asset_map sa
          left join asset a on sa.assetId = a.assetId
          left join department d on a.deptId = d.deptId
          inner join user_stig_asset_map usa on sa.saId = usa.saId
          WHERE usa.userId = ud.userId
        )
        SELECT COALESCE ((SELECT stigReviews from cte where rn = 1), json_array())) as "stigReviews"`)
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
    if (inPredicates.accessLevel) {
      predicates.statements.push('ud.accessLevel = :accessLevel')
      predicates.binds.accessLevel = inPredicates.accessLevel
    }
    if (inPredicates.deptId) {
      predicates.statements.push('ud.deptId = :deptId')
      predicates.binds.deptId = inPredicates.deptId
    }
    if (inPredicates.canAdmin) {
      predicates.statements.push('ud.canAdmin = :canAdmin')
      predicates.binds.canAdmin = inPredicates.canAdmin ? 1 : 0
    }
    if (context == dbUtils.CONTEXT_DEPT) {
      predicates.statements.push('ud.deptId = :deptId')
      predicates.binds.deptId = userObject.dept.deptId
    } 

    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
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
    let { stigReviews, ...userFields } = body
    stigReviews = stigReviews ? stigReviews : []

    // Convert boolean value to database value (true=1 or false=0)
    if ('canAdmin' in userFields) {
      userFields.canAdmin = userFields.canAdmin ? 1 : 0
    }

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
            ( username, display, deptId, accessLevel, canAdmin)
          VALUES
            (:username, :display, :deptId, :accessLevel, :canAdmin)`
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

    // Process stigReviews if present
    if ( stigReviews || writeAction === dbUtils.WRITE_ACTION.CREATE || writeAction === dbUtils.WRITE_ACTION.REPLACE ) {
      // DELETE from user_stig_asset_map
      let sqlDeleteStigAssets = 'DELETE FROM user_stig_asset_map where userId = ?'
      await connection.query(sqlDeleteStigAssets, [userId])
    }
    if (stigReviews.length > 0) {
      let sqlInsertStigAssets = `
        INSERT INTO 
          user_stig_asset_map (userId, saId)
        VALUES (?, (SELECT saId from stig_asset_map WHERE benchmarkId = ? and assetId = ?))`      
      let binds = stigReviews.map(i => [userId, i.benchmarkId, i.assetId])
      // INSERT into asset_package_map
      connection.prepare(sqlInsertStigAssets)
      for (const values of binds) {
        await connection.execute(sqlInsertStigAssets, values)
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
    let row = await this.getUserByUserId(userId, projection, elevate, userObject)
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
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
    return (row)
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
 * returns UserProjected
 **/
exports.deleteUser = async function(userId, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers(projection, {userId: userId}, elevate, userObject)
    let sqlDelete = `DELETE FROM stigman.user_data where id = :userId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [userId], options)
    await connection.close()
    return (rows[0])
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
    let rows = await this.queryUsers( projection, {
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
exports.getUsers = async function(role, dept, canAdmin, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers( projection, {
      role: role,
      dept: dept,
      canAdmin: canAdmin
    }, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.REPLACE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.updateUser = async function( userId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateUser(dbUtils.WRITE_ACTION.UPDATE, userId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

