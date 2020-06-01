'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const Department = require(`../service/${config.database.type}/DepartmentService`)

module.exports.createDepartment = async function createDepartment (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let response = await Department.createDepartment(body, elevate, req.userObject)
      writer.writeJson(res, response, 201)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteDepartment = async function deleteDepartment (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let deptId = req.swagger.params['deptId'].value
      // TODO: Only allow Department having no mapped Assets or Users
      let response = await Department.deleteDepartment(deptId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportDepartments = async function exportDepartments ( elevate, userObject ) {
  try {
    let departments =  await Department.getDepartments( elevate, userObject )
    return departments
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getDepartment = async function getDepartment (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.accessLevel >= 2) {
      let deptId = req.swagger.params['deptId'].value
      if (req.userObject.accessLevel === 2 && !elevate) {
        if (deptId !== req.userObject.dept.deptId) {
          throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`}))
        }
      }
      let projection = req.swagger.params['projection'].value
      let response = await Department.getDepartment(deptId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getDepartments = async function getDepartments (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.accessLevel >= 2) {
      let elevate = req.swagger.params['elevate'].value
      let response = await Department.getDepartments( elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceDepartment = async function replaceDepartment (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate ) {
      let deptId = req.swagger.params['deptId'].value
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      let response = await Department.replaceDepartment(deptId, body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
