'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


const _this = this

/**
  Generalized queries for departments. Returns all departments
**/
exports.queryDepartments = async function (inProjection, inPredicates, elevate, userObject) {
  let connection
  try {
    let columns = [
      'd.deptId as "deptId"',
      'd.name as "name"'
    ]
    let joins = [
      'department d'
    ]

    // PROJECTIONS
    if (inProjection && inProjection.includes('assets')) {
      joins.push('left join asset a on d.deptId = a.deptId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when a.assetId is not null then 
                json_object(
                  'assetId', a.assetId, 
                  'name', a.name
                )
              else null end 
            order by a.name),
            ''),
        ']')
      as json) as "assets"`)
    }

    // PROJECTIONS
    if (inProjection && inProjection.includes('users')) {
      joins.push('left join user_data u on d.deptId = u.deptId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when u.userId is not null then 
                json_object(
                  'userId', u.userId, 
                  'username', u.username,
                  'accessLevel', u.accessLevel
                )
              else null end 
            order by u.username),
            ''),
        ']')
      as json) as "users"`)
    }

    // PREDICATES
    let predicates = {
      statements: [],
      binds: {}
    }
    if (inPredicates.deptId) {
      predicates.statements.push('d.deptId = :deptId')
      predicates.binds.deptId = inPredicates.deptId
    }
    if (!elevate && userObject.accessLevel === 2) {
      predicates.statements.push('d.deptId = :deptId')
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
    sql += ' group by d.deptId, d.name'
    sql += ' order by d.name'
    
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

exports.addOrUpdateDepartment = async function (writeAction, deptId, body, projection, elevate, userObject) {
  let connection // available to try, catch, and finally blocks
  try {
    // CREATE: identifier will be null
    // REPLACE: identifier is not null

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true

    let name = body.name
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
      // INSERT into user_data
      let sqlInsert =
        `INSERT INTO
            department
            ( name )
          VALUES
            (?)`
      let [rows] = await connection.query(sqlInsert, [name])
      deptId = rows.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              department
            SET
              name = ?
            WHERE
              deptId = ?`
        await connection.query(sqlUpdate, [name, assetId])
      }
    }
    else {
      throw('Invalid writeAction')
    }
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

  // Fetch the new or updated object for the response
  try {
    let row = await _this.getDepartment(deptId, projection, elevate, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}


/**
 * Create a Department
 *
 * returns DepartmentProjected
 **/
exports.createDepartment = async function(body, elevate, userObject) {
  try {
    let row = await _this.addOrUpdateDepartment(dbUtils.WRITE_ACTION.CREATE, null, body, {}, elevate, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete a Department
 *
 * deptId Department 
 * projection List Additional properties to include in the response.  (optional)
 * returns DepartmentProjected
 **/
exports.deleteDepartment = async function(deptId, projection, elevate, userObject) {
  let connection
  try {
    let row = await _this.getDepartment(deptId, projection, elevate, userObject)

    let sqlDelete = `DELETE FROM department where deptId = ?`
    await dbUtils.pool.query(sqlDelete, [deptId])
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a Department
 *
 * deptId Integer Selects a Department
 * projection List Additional properties to include in the response.  (optional)
 * returns UserProjected
 **/
exports.getDepartment = async function(deptId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryDepartments( projection, {
      deptId: deptId
    }, elevate, userObject)
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Departments accessible to the requester
 *
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * returns List of UserProjected
 **/
exports.getDepartments = async function( elevate, userObject ) {
  try {
    let rows = await _this.queryDepartments( [], {}, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceUser = async function( deptId, body, projection, elevate, userObject ) {
  try {
    let row = await _this.addOrUpdateUser(dbUtils.WRITE_ACTION.REPLACE, deptId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}
