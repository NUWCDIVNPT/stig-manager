'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

let _this = this

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
      'ud.userId as "userId"',
      'ud.username as "username"',
      'ud.display as "display"',
      `json_object (
        KEY 'deptId' VALUE d.deptId,
        KEY 'name' VALUE d.name
      ) as "dept"`,
      'ud.accessLevel as "accessLevel"',
      'ud.canAdmin as "canAdmin"'
    ]
    let joins = [
      'user_data ud',
      'left join department d on ud.deptId = d.deptId'
    ]

    // PROJECTIONS
    if (inProjection && inProjection.includes('stigReviews')) {
      columns.push(`(select
        json_arrayagg( 
            json_object(
                KEY 'benchmarkId' VALUE sa.benchmarkId,
                KEY 'asset' VALUE json_object(
                  KEY 'assetId' VALUE a.assetid,
                  KEY 'name' VALUE a.name,
                  KEY 'dept' VALUE json_object (
                    KEY 'deptId' VALUE a.deptId,
                    KEY 'name' VALUE d.name)
                  ABSENT ON NULL
                )
            )
          order by sa.benchmarkId, a.name returning varchar2(32000)
        )
      FROM 
          stig_asset_map sa
          left join asset a on sa.assetId = a.assetId
          left join department d on a.deptId = d.deptId
          left join user_stig_asset_map usa on sa.saId = usa.saId
      where usa.userId = ud.userid
      group by usa.userId) as "stigReviews"`)
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
  
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast columns 'nonnetwork' and 'scanexempt'
    // * Oracle doesn't support a JSON type, so we parse string values from 'collections' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      record.canAdmin = record.canAdmin == 1 ? true : false
      record.dept = JSON.parse(record.dept)
      if (inProjection && inProjection.includes('stigReviews')) {
       // Check for "empty" arrays 
        record.stigReviews = record.stigReviews ? JSON.parse(record.stigReviews) : []
      }
    }
    return (result.rows)
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

    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()

    // Process scalar properties
    let binds = {...userFields}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into user_data
      let sqlInsert =
        `INSERT INTO
            user_data
            ( username, display, deptId, accessLevel, canAdmin)
          VALUES
            (:username, :display, :deptId, :accessLevel, :canAdmin)
          RETURNING
            userid into :userId`
      binds = {...userFields}
      binds.userId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      userId = result.outBinds.userId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              user_data
            SET
              ${dbUtils.objectBindObject(userFields, binds)}
            WHERE
              userid = :userId`
        binds.userId = userId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process stigReviews if present
    if ( stigReviews || writeAction === dbUtils.WRITE_ACTION.CREATE || writeAction === dbUtils.WRITE_ACTION.REPLACE ) {
      // DELETE from user_stig_asset_map
      let sqlDeleteStigAssets = 'DELETE FROM user_stig_asset_map where userId = :userId'
      await connection.execute(sqlDeleteStigAssets, [userId])
    }
    if (stigReviews.length > 0) {
      let sqlInsertStigAssets = `
        INSERT INTO 
          user_stig_asset_map (userId, saId)
        VALUES (:userId, (SELECT saId from stig_asset_map WHERE benchmarkId = :benchmarkId and assetId = :assetId))`      
      let binds = stigReviews.map(i => [userId, i.benchmarkId, i.assetId])
      // INSERT into user_stig_asset_map
      await connection.executeMany(sqlInsertStigAssets, binds)
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
      await connection.close()
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
    let sqlDelete = `DELETE FROM user_data where userId = :userId`
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
 * accessLevel UserLevel  (optional)
 * dept String Selects Users exactly matching a department string (optional)
 * canAdmin Boolean Selects Users matching the condition (optional)
 * returns List of UserProjected
 **/
exports.getUsers = async function(accessLevel, deptId, canAdmin, projection, elevate, userObject) {
  try {
    let rows = await this.queryUsers( projection, {
      accessLevel: accessLevel,
      deptId: deptId,
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

