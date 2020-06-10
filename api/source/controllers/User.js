'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const User = require(`../service/${config.database.type}/UserService`)
const Asset = require(`../service/${config.database.type}/AssetService`)
const Package = require(`../service/${config.database.type}/PackageService`)

module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value

      if (body.hasOwnProperty('grants') ) {
        // Verify each grant for a valid packageId
        let requestedPkgIds = body.grants.map( g => g.packageId )
        let availablePkgIds = await Package.getPackages([], elevate, req.userObject)
        if (! requestedPkgIds.every( id => availablePkgIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more packageIds are invalid.`} ) )    
        }
      }

      let response = await User.createUser(body, projection, elevate, req.userObject)
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
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportUsers = async function exportUsers (projection, elevate, userObject) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      return await User.getUsers(null, null, null, projection, elevate, userObject )
    }
    else {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch (err) {
    throw (err)
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
    if ( elevate ) {
      let userId = req.swagger.params['userId'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.getUserByUserId(userId, projection, elevate, req.userObject)
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

module.exports.getUsers = async function getUsers (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate ) {
      let projection = req.swagger.params['projection'].value
      let response = await User.getUsers( projection, elevate, req.userObject)
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

module.exports.replaceUser = async function replaceUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let userId = req.swagger.params['userId'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value

      if (body.hasOwnProperty('grants') ) {
        // Verify each grant for a valid packageId
        let requestedPkgIds = body.grants.map( g => g.packageId )
        let availablePkgIds = await Package.getPackages([], elevate, req.userObject)
        if (! requestedPkgIds.every( id => availablePkgIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more packageIds are invalid.`} ) )    
        }
      }

      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
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

module.exports.updateUser = async function updateUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let userId = req.swagger.params['userId'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value

      if (body.hasOwnProperty('grants') ) {
        // Verify each grant for a valid packageId
        let requestedPkgIds = body.grants.map( g => g.packageId )
        let availablePkgIds = await Package.getPackages([], elevate, req.userObject)
        if (! requestedPkgIds.every( id => availablePkgIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more packageIds are invalid.`} ) )    
        }
      }

      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
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

