'use strict';

var writer = require('../utils/writer')
var config = require('../utils/config')
var Collection = require(`../service/${config.database.type}/CollectionService`)
var Serialize = require(`../utils/serializers`)

module.exports.createCollection = async function createCollection (req, res, next) {
  try {
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    const body = req.swagger.params['body'].value
    if ( elevate || req.userObject.privileges.canCreateCollection ) {
      try {
        const response = await Collection.createCollection( body, projection, req.userObject)
        writer.writeJson(res, response)
      }
      catch (err) {
        // This is MySQL specific, should abstract with an SmError
        if (err.code === 'ER_DUP_ENTRY') {
          try {
            let response = await Collection.getCollections({
              name: body.name
            }, projection, elevate, req.userObject )
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
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
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

module.exports.exportCollections = async function exportCollections (projection, elevate, userObject) {
  try {
    return await Collection.getCollections( {}, projection, elevate, userObject )
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getChecklistByCollectionStig = async function getChecklistByCollectionStig (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const revisionStr = req.swagger.params['revisionStr'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
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
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess || elevate ) {
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
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    const name = req.swagger.params['name'].value
    const nameMatch = req.swagger.params['name-match'].value
    const workflow = req.swagger.params['workflow'].value
    const metadata = req.swagger.params['metadata'].value
    const response = await Collection.getCollections({
      name: name,
      nameMatch: nameMatch,
      workflow: workflow,
      metadata: metadata
    }, projection, elevate, req.userObject)
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getFindingsByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const aggregator = req.swagger.params['aggregator'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const assetId = req.swagger.params['assetId'].value
    const acceptedOnly = req.swagger.params['acceptedOnly'].value
    const projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, projection, req.userObject )
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

module.exports.getPoamByCollection = async function getFindingsByCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const aggregator = req.swagger.params['aggregator'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const assetId = req.swagger.params['assetId'].value
    const acceptedOnly = req.swagger.params['acceptedOnly'].value
    const defaults = {
      date: req.swagger.params['date'].value,
      office: req.swagger.params['office'].value,
      status: req.swagger.params['status'].value
    }
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getFindingsByCollection( collectionId, aggregator, benchmarkId, assetId, acceptedOnly, 
        [
          'rulesWithDiscussion',
          'groups',
          'assets',
          'stigsInfo',
          'ccis'
        ], req.userObject )
      
      const po = Serialize.poamObjectFromFindings(response, defaults)
      const xlsx = await Serialize.xlsxFromPoamObject(po)
      let collectionName
      if (!collectionGrant && req.userObject.privileges.globalAccess) {
        const response = await Collection.getCollection(collectionId, [], false, req.userObject )
        collectionName = response.name
      }
      else {
        collectionName = collectionGrant.collection.name
      }
      writer.writeInlineFile( res, xlsx, `POAM-${collectionName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    else {
      throw( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getStatusByCollection = async function getStatusByCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const assetId = req.swagger.params['assetId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getStatusByCollection( collectionId, assetId, benchmarkId, req.userObject )
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

module.exports.getStigAssetsByCollectionUser = async function getStigAssetsByCollectionUser (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const userId = req.swagger.params['userId'].value
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const response = await Collection.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )
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

module.exports.getStigsByCollection = async function getStigsByCollection (req, res, next) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if (collectionGrant || req.userObject.privileges.globalAccess ) {
      const response = await Collection.getStigsByCollection( collectionId, false, req.userObject )
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

module.exports.replaceCollection = async function updateCollection (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const collectionId = req.swagger.params['collectionId'].value
    const projection = req.swagger.params['projection'].value
    const body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
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

module.exports.setStigAssetsByCollectionUser = async function setStigAssetsByCollectionUser (req, res) {
  try {
    const collectionId = req.swagger.params['collectionId'].value
    const userId = req.swagger.params['userId'].value
    const stigAssets = req.swagger.params['body'].value
    
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant && collectionGrant.accessLevel >= 3 ) {
      const collectionResponse = await Collection.getCollection(collectionId, ['grants'], false, req.userObject )
      if (collectionResponse.grants.filter( grant => grant.accessLevel === 1 && grant.user.userId === userId).length > 0) {
        const setResponse = await Collection.setStigAssetsByCollectionUser(collectionId, userId, stigAssets, req.userObject ) 
        const getResponse = await Collection.getStigAssetsByCollectionUser(collectionId, userId, req.userObject )    
        writer.writeJson(res, getResponse)
      }
      else {
        throw( writer.respondWithCode ( 404, {message: "User not found in this Collection with accessLevel === 1."} ) )
      }
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
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
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
