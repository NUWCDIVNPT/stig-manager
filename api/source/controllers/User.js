'use strict';

const config = require('../utils/config')
const UserService = require(`../service/UserService`)
const AssetService = require(`../service/AssetService`)
const CollectionService = require(`../service/CollectionService`)
const SmError = require('../utils/error')
/*  */
module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.query.elevate
    if (elevate) {
      let body = req.body
      let projection = req.query.projection

      if (body.hasOwnProperty('collectionGrants') ) {
        // Verify each grant for a valid collectionId
        let requestedIds = body.collectionGrants.map( g => g.collectionId )
        let availableCollections = await CollectionService.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw new SmError.UnprocessableError('One or more collectionIds are invalid.')
        }
      }
      try {
        let response = await UserService.createUser(body, projection, elevate, req.userObject, res.svcStatus)
        res.status(201).json(response)
      }
      catch (err) {
        // This is MySQL specific, should abstract
        if (err.code === 'ER_DUP_ENTRY') {
          throw new SmError.UnprocessableError('Duplicate name exists.')
        }
        else {
          throw err
        }
      }
    }
    else {
     throw new SmError.PrivilegeError()    
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
      let userData = await UserService.getUserByUserId(userId, ['statistics'], elevate, req.userObject)
      if (userData?.statistics?.lastAccess) {
        // User has accessed the system, so we need to reject the request
        throw new SmError.UnprocessableError('User has accessed the system. Use PATCH to remove collection grants or configure Authentication provider to reject user entirely.')
      }
      let response = await UserService.deleteUser(userId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()    
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.exportUsers = async function exportUsers (projection, elevate, userObject) {
  if (elevate) {
    return await UserService.getUsers(null, null, projection, elevate, userObject )
  }
  else {
    throw new SmError.PrivilegeError()    
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
      let response = await UserService.getUserByUserId(userId, projection, elevate, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()    
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
      throw new SmError.PrivilegeError()
    }
    let response = await UserService.getUsers( username, usernameMatch, projection, elevate, req.userObject)
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
        let availableCollections = await CollectionService.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw new SmError.UnprocessableError('One or more collectionIds are invalid.')
        }
      }

      let response = await UserService.replaceUser(userId, body, projection, elevate, req.userObject, res.svcStatus)
      res.json(response)
    }
    else {
     throw new SmError.PrivilegeError()    
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
        let availableCollections = await CollectionService.getCollections({}, [], elevate, req.userObject)
        let availableIds = availableCollections.map( c => c.collectionId)
        if (! requestedIds.every( id => availableIds.includes(id) ) ) {
          throw new SmError.UnprocessableError('One or more collectionIds are invalid.')
        }
      }

      let response = await UserService.replaceUser(userId, body, projection, elevate, req.userObject, res.svcStatus)
      res.json(response)
    }
    else {
     throw new SmError.PrivilegeError()    
    }
  }
  catch(err) {
    next(err)
  }
}

/* c8 ignore start */
module.exports.setUserData = async function setUserData (username, fields) {
  try {
    await UserService.setUserData(username, fields)
    return await UserService.getUserByUsername(username)
  }
  catch (e) {
    next(err)

  }
}
/* c8 ignore end */