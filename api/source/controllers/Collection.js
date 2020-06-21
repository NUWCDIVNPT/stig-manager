'use strict';

var writer = require('../utils/writer.js')
var config = require('../utils/config')
var Collection = require(`../service/${config.database.type}/CollectionService`)

module.exports.createCollection = async function createCollection (req, res, next) {
  try {
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    const body = req.swagger.params['body'].value
    if ( elevate || req.userObject.canCreateCollection ) {
      const response = await Collection.createCollection( body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.deleteCollection = async function deleteCollection (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const collectionId = req.swagger.params['collectionId'].value
    const projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if (elevate || (collectionGrant && collectionGrant.accessLevel === 4)) {
      const response = await Collection.deleteCollection(collectionId, projection, elevate, req.userObject)
      writer.writeJson (res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const revisionStr = req.swagger.params['revisionStr'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if ( collectionGrant || req.userObject.globalAccess ) {
      const response = await Collection.getChecklistByCollectionStig(collectionId, benchmarkId, revisionStr, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getCollection = async function getCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if (collectionGrant || req.userObject.globalAccess || elevate ) {
      const response = await Collection.getCollection(collectionId, projection, elevate, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getCollections = async function getCollections (req, res, next) {
  try {
    const projection = []
    const elevate = req.swagger.params['elevate'].value
    const name = req.swagger.params['name'].value
    const workflow = req.swagger.params['workflow'].value
    const response = await Collection.getCollections({
      name: name,
      workflow: workflow
    }, projection, elevate, req.userObject)
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const elevate = req.swagger.params['elevate'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if (collectionGrant || req.userObject.globalAccess || elevate ) {
      const response = await Collection.getStigsByCollection( collectionId, elevate, req.userObject )
      writer.writeJson(res, response)
      }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}



module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await Collection.getCollections( {}, projection, elevate, userObject )
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.replaceCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const collectionId = req.swagger.params['collectionId'].value
    const projection = req.swagger.params['projection'].value
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      const response = await Collection.replaceCollection(collectionId, body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}


module.exports.updateCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const collectionId = req.swagger.params['collectionId'].value
    const projection = req.swagger.params['projection'].value
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collectionId === collectionId )
    if ( elevate || (collectionGrant && collectionGrant.accessLevel >= 3) ) {
      let response = await Collection.replaceCollection(collectionId, body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}
