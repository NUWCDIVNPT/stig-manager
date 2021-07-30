'use strict';

const Parsers = require('../utils/parsers.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)

module.exports.postReviewsByAsset = async function postReviewsByAsset (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let reviewsRequested = req.body

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      //Check each reviewed rule against grants and stig assignments
      const userRules = await Review.getRulesByAssetUser( assetId, req.userObject )
      const permitted = [], rejected = []
      let errors
      for (const review of reviewsRequested) {
        if (userRules.has(review.ruleId)) {
          permitted.push(review)
        }
        else {
          rejected.push(review)
        }
      }
      if (permitted.length > 0) {
         errors = await Review.putReviewsByAsset(assetId, permitted, req.userObject)
      }
      res.json({
        permitted,
        rejected,
        errors
      })
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.deleteReviewByAssetRule = async function deleteReviewByAssetRule (req, res, next) {
try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.deleteReviewByAssetRule(assetId, ruleId, projection, req.userObject)
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to delete the review of this rule."} )
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
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        ruleId: ruleId
      }, req.userObject)
      // res.json(response[0])
      // res.status(typeof response === 'undefined' ? 204 : 200).json(response[0])
      res.status(response.length == 0 ? 204 : 200).json(response[0])

    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch(err) {
    next(err)
  }
}

module.exports.getReviewsByCollection = async function getReviewsByCollection (req, res, next) {
  try {
    let projection = req.query.projection
    let collectionId = req.params.collectionId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        result: req.query.result,
        action: req.query.action,
        status: req.query.status,
        rules: req.query.rules || 'current-mapped',
        ruleId: req.query.ruleId,
        groupId: req.query.groupId,
        cci: req.query.cci,
        userId: req.query.userId,
        assetId: req.query.assetId,
        benchmarkId: req.query.benchmarkId,
        metadata: req.query.metadata
      }, req.userObject)
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

module.exports.getReviewsByAsset = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      let response = await Review.getReviews( projection, {
        collectionId: collectionId,
        assetId: assetId,
        rules: req.query.rules || 'current-mapped',
        result: req.query.result,
        action: req.query.action,
        status: req.query.status,
        benchmarkId: req.query.benchmarkId,
        metadata: req.query.metadata
      }, req.userObject )
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

module.exports.putReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let body = req.body
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.putReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        if (response.status === 'created') {
          res.status(201).json(response.row)
        } else {
          res.json(response.row)
        }
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to put a review of this rule."} )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let body = req.body
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.patchReviewByAssetRule( projection, assetId, ruleId, body, req.userObject)
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."} )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadata( assetId, ruleId, req.userObject)
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."} )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let metadata = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        await Review.patchReviewMetadata( assetId, ruleId, metadata)
        let response = await Review.getReviewMetadata( assetId, ruleId)
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putReviewMetadata = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let body = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        await Review.putReviewMetadata( assetId, ruleId, body)
        let response = await Review.getReviewMetadata( assetId, ruleId)
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadataKeys = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadataKeys( assetId, ruleId, req.userObject)
        if (!response)  throw ( {status: 404, message: `metadata keys not found`} )
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadataValue = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.getReviewMetadataValue( assetId, ruleId, key, req.userObject)
        if (!response)  throw ( {status: 404, message: `metadata key not found`} )
        res.json(response)
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putReviewMetadataValue = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    let value = req.body
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.putReviewMetadataValue( assetId, ruleId, key, value)
        res.status(204).send()
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}


module.exports.deleteReviewMetadataKey = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant || req.userObject.privileges.globalAccess ) {
      const userHasRule = await Review.checkRuleByAssetUser( ruleId, assetId, req.userObject )
      if (userHasRule) {
        let response = await Review.deleteReviewMetadataKey( assetId, ruleId, key, req.userObject)
        res.status(204).send()
      }
      else {
        throw ( {status: 403, message: "User has insufficient privilege to patch the review of this rule."}  )
      }
    }
    else {
      throw( {status: 403, message: "User has insufficient privilege to complete this request."} )
    }
  }
  catch (err) {
    next(err)
  }  
}

