'use strict';

const config = require('../utils/config')
const User = require(`../service/${config.database.type}/UserService`)
const Asset = require(`../service/${config.database.type}/AssetService`)
const Collection = require(`../service/${config.database.type}/CollectionService`)

module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.query.elevate
    if (elevate) {
      let body = req.body
      let projection = req.query.projection

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( {status: 400, message: `One or more collectionIds are invalid.`} )
        }
      }
      try {
        let response = await User.createUser(body, projection, elevate, req.userObject)
        res.status(201).json(response)
      }
      catch (err) {
        // This is MySQL specific, should abstract
        if (err.code === 'ER_DUP_ENTRY') {
          // try {
            let response = await User.getUsers(body.username, body.usernameMatch, projection, elevate, req.userObject)
            throw ({
              status: 400, 
              message: `Duplicate name`,
              data: response[0]
            })
          // } finally {}
        }
        else {
          throw err
        }
      }
    }
    else {
     throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.deleteUser = async function deleteUser (req, res, next) {
  try {
    let elevate = req.query.elevate
    if (elevate) {
      let userId = req.params.userId
      let projection = req.query.projection
      let response = await User.deleteUser(userId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.exportUsers = async function exportUsers (projection, elevate, userObject) {
  try {
    if (elevate) {
      return await User.getUsers(null, null, projection, elevate, userObject )
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getUserObject = async function getUserObject (req, res, next) {
  try {
    res.json(req.userObject)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getUserByUserId = async function getUserByUserId (req, res, next) {
  try {
    let elevate = req.query.elevate
    if ( elevate ) {
      let userId = req.params.userId
      let projection = req.query.projection
      let response = await User.getUserByUserId(userId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.getUsers = async function getUsers (req, res, next) {
  try {
    let elevate = req.query.elevate
    let username = req.query.username
    let usernameMatch = req.query['username-match']
    let projection = req.query.projection
    if ( !elevate && projection && projection.length > 0) {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
    let response = await User.getUsers( username, usernameMatch, projection, elevate, req.userObject)
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.replaceUser = async function replaceUser (req, res, next) {
  try {
    let elevate = req.query.elevate
    let userId = req.params.userId
    if (elevate) {
      let body = req.body
      let projection = req.query.projection

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( {status:400, message: `One or more collectionIds are invalid.`} ) 
        }
      }

      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
     throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.updateUser = async function updateUser (req, res, next) {
  try {
    let elevate = req.query.elevate
    let userId = req.params.userId
    if (elevate) {
      let body = req.body
      let projection = req.query.projection

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await Collection.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw( {status: 400, message: `One or more collectionIds are invalid.`} )   
        }
      }

      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
     throw( {status: 403, message: "User has insufficient privilege to complete this request."} )    
    }
  }
  catch(err) {
    next(err)
  }
}

/* c8 ignore start */
module.exports.setUserData = async function setUserData (username, fields) {
  try {
    await User.setUserData(username, fields)
    return await User.getUserByUsername(username)
  }
  catch (e) {
    next(err)

  }
}
/* c8 ignore end */