'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const ROLE = require('../../utils/appRoles')

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
      columns.push(`
      json_arrayagg( 
        json_object(
          KEY 'assetId' VALUE a.assetId,
          KEY 'name' VALUE a.name
          ABSENT ON NULL)
      order by a.name returning varchar2(32000)) as "assets"`)
    }

    // PROJECTIONS
    if (inProjection && inProjection.includes('users')) {
      joins.push('left join user_data u on d.deptId = u.deptId')
      joins.push('left join role on u.roleId = role.roleId')
      columns.push(`json_arrayagg( 
        json_object(
          KEY 'userId' VALUE u.userId,
          KEY 'username' VALUE u.username,
          KEY 'role' VALUE json_object(
            KEY 'roleId' VALUE role.roleId,
            KEY 'name' VALUE role.name
          )
        )
        order by u.username returning varchar2(32000)) as "users"`)
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
    if (!elevate && userObject.role.roleId === ROLE.DEPT) {
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
    
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)

    // Post-process each row.
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      if (inProjection && inProjection.includes('assets')) {
        record.assets = record.assets ? JSON.parse(record.assets) : []
      }
      if (inProjection && inProjection.includes('users')) {
        record.users = record.users ? JSON.parse(record.users) : []
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

exports.addOrUpdateDepartment = async function (writeAction, deptId, body, projection, elevate, userObject) {
  let connection // available to try, catch, and finally blocks
  try {
    // CREATE: identifier will be null
    // REPLACE: identifier is not null

    // // Extract or initialize non-scalar properties to separate variables
    // let { stigReviews, ...userFields } = body
    // stigReviews = stigReviews ? stigReviews : []

    // // Convert boolean value to database value (true=1 or false=0)
    // if ('canAdmin' in userFields) {
    //   userFields.canAdmin = userFields.canAdmin ? 1 : 0
    // }

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
            department
            ( name )
          VALUES
            (:name)
          RETURNING
            deptId into :deptId`
      binds = body
      binds.deptId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      deptId = result.outBinds.deptId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              department
            SET
              ${dbUtils.objectBindObject(body, binds)}
            WHERE
              deptId = :deptId`
        binds.deptId = deptId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
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
    let sqlDelete = `DELETE FROM department where deptId = :deptId`
    
    connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [deptId], options)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
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
