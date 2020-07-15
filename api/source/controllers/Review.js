'use strict';

const writer = require('../utils/writer.js')
const Parsers = require('../utils/parsers.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)
const dbUtils = require(`../service/${config.database.type}/utils`)
const {promises: fs} = require('fs')

module.exports.importReviewsByAsset = async function importReviewsByAsset (req, res, next) {
  try {
    let reviewsRequested, reviews
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let body = req.swagger.params['body'].value

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      if (req.file) {
        let extension = req.file.originalname.substring(req.file.originalname.lastIndexOf(".")+1)
        if (extension != 'ckl' && extension != 'xml' && extension != 'zip') {
          throw (writer.respondWithCode ( 400, {message: `File extension .${extension} not supported`} ))
        }
        let assetId = parseInt(body.assetId)
        let data = await fs.readFile(req.file.path)
        let result
        switch (extension) {
          case 'ckl':
            result = await Parsers.reviewsFromCkl(data, assetId)
            break
          case 'xml':
            result = Parsers.reviewsFromScc(data, assetId)
            break
        }
        reviewsRequested = result.reviews
      }
      else {
        reviewsRequested = body
      }

      //TODO: Check individual rules for grants with accessLevel 1
      // let reviewsByStatus = await dbUtils.scrubReviewsByUser(reviewsRequested, false, req.userObject)
      let reviewsByStatus = {
        permitted: reviewsRequested,
        rejected: []
      }
      reviewsByStatus.errors = await Review.putReviewsByAsset(assetId, reviewsByStatus.permitted, req.userObject)
      writer.writeJson(res, reviewsByStatus)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
  finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path)
    }
  }
}

module.exports.deleteReviewByAssetRule = async function deleteReviewByAssetRule (req, res, next) {
try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      //TODO: For grants with accessLevel 1, check asset/rule is allowed
      let response = await Review.deleteReviewByAssetRule(assetId, ruleId, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportReviews = async function exportReviews (projection, userObject) {
  try {
    return await Review.getReviews(projection, {}, userObject )
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.getReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        ruleId: ruleId
      }, req.userObject)
      writer.writeJson(res, response[0])
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviewsByCollection = async function getReviewsByCollection (req, res, next) {
  try {
    let projection = req.swagger.params['projection'].value
    let collectionId = req.swagger.params['collectionId'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        ruleId: req.swagger.params['ruleId'].value,
        groupId: req.swagger.params['groupId'].value,
        cci: req.swagger.params['cci'].value,
        userId: req.swagger.params['userId'].value,
        assetId: req.swagger.params['assetId'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        revisionStr: req.swagger.params['revisionStr'].value,
      }, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviewsByAsset = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        revisionStr: req.swagger.params['revisionStr'].value,
      }, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.putReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let body = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      // TODO For accessLevel 1, check asset/rule
      // if (await dbUtils.userHasAssetRule(assetId, ruleId, false, req.userObject)) {
        let response = await Review.putReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        if (response.status === 'created') {
          writer.writeJson(res, response.row, 201)
        } else {
          writer.writeJson(res, response.row )
        }
      // }
      // else {
      //   throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
      // }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.putReviewsByAsset = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let reviews = req.swagger.params['body'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      // TODO For accessLevel 1, check asset/rules
      let response = await Review.putReviewsByAsset(assetId, reviews, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.patchReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.swagger.params['collectionId'].value
    let assetId = req.swagger.params['assetId'].value
    let ruleId = req.swagger.params['ruleId'].value
    let body = req.swagger.params['body'].value
    let projection = req.swagger.params['projection'].value
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      // TODO For accessLevel 1, check asset/rule
      // if (await dbUtils.userHasAssetRule(assetId, ruleId, false, req.userObject)) {
        let response = await Review.patchReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        writer.writeJson(res, response )
      // }
      // else {
      //   throw ( writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
      // }
    }
    else {
      throw (writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}