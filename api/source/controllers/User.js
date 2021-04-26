'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const User = require(`../service/${config.database.type}/UserService`)
const Asset = require(`../service/${config.database.type}/AssetService`)
const Collection = require(`../service/${config.database.type}/CollectionService`)

module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more collectionIds are invalid.`} ) )    
        }
      }
      try {
        let response = await User.createUser(body, projection, elevate, req.userObject)
        writer.writeJson(res, response)
      }
      catch (err) {
        // This is MySQL specific, should abstract with an SmError
        if (err.code === 'ER_DUP_ENTRY') {
          try {
            let response = await User.getUsers(body.username, body.usernameMatch, projection, elevate, req.userObject)
            throw (writer.respondWithCode( 400, {
              code: 400,
              message: `Duplicate name`,
              data: response[0]
            }))
          } finally {}
        }
        else {
          throw err
        }
      }
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
    if (elevate) {
      return await User.getUsers(null, null, projection, elevate, userObject )
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
    let username = req.swagger.params['username'].value
    let usernameMatch = req.swagger.params['username-match'].value
    let projection = req.swagger.params['projection'].value
    if ( !elevate && projection && projection.length > 0) {
      throw( writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
    let response = await User.getUsers( username, usernameMatch, projection, elevate, req.userObject)
    writer.writeJson(res, response)
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

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more collectionIds are invalid.`} ) )    
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

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( writer.respondWithCode ( 400, {message: `One or more collectionIds are invalid.`} ) )    
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

/* c8 ignore start */
module.exports.setUserData = async function setUserData (username, fields) {
  try {
    await User.setUserData(username, fields)
    return await User.getUserByUsername(username)
  }
  catch (e) {
    writer.writeJson(res, err)

  }
}
/* c8 ignore end */