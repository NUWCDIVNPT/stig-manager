'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const User = require(`../service/${config.database.type}/UserService`)

module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.createUser(body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteUser = async function deleteUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let userId = req.swagger.params['userId'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.deleteUser(userId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUserObject = async function getUserObject (req, res, next) {
  try {
    writer.writeJson(res, req.userObject)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUserByUserId = async function getUserByUserId (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role == "IAO" || req.userObject.role == "Staff") {
      let userId = req.swagger.params['userId'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.getUserByUserId(userId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUsers = async function getUsers (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role == "IAO" || req.userObject.role == "Staff") {
      let projection = req.swagger.params['projection'].value
      let elevate = req.swagger.params['elevate'].value
      let role = req.swagger.params['role'].value
      let dept = req.swagger.params['dept'].value
      let canAdmin = req.swagger.params['canAdmin'].value
      let response = await User.getUsers(role, dept, canAdmin, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceUser = async function replaceUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role == "IAO" || req.userObject.role == "Staff") {
      let userId = req.swagger.params['userId'].value
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      if (! elevate ) {
        // Unelevated requests cannot change core properties
        let prohibited = ['username', 'dept', 'role', 'canAdmin']
        let hasProhibited = Object.keys(body).some((val) => prohibited.includes(val))
        if (hasProhibited) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
        }
      }
      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.updateUser = async function updateUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role == "IAO" || req.userObject.role == "Staff") {
      let userId = req.swagger.params['userId'].value
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      if (! elevate ) {
        // Unelevated requests cannot change core properties
        let prohibited = ['username', 'dept', 'role', 'canAdmin']
        let hasProhibited = Object.keys(body).some((val) => prohibited.includes(val))
        if (hasProhibited) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
        }
      }
      let response = await User.updateUser(userId, body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

