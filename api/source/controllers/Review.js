'use strict';

const Parsers = require('../utils/parsers.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)
const Collection = require(`../service/${config.database.type}/CollectionService`)
const SmError = require('../utils/error')

const _this = this

function isReviewSubmittable ( fieldSettings, review ) {
  if (review.result !== 'pass' && review.result !== 'fail' && review.result !== 'notapplicable') return false

  if (fieldSettings.detail.required === 'always' 
    && !review.detail) return false

  if (fieldSettings.detail.required === 'findings' 
    && review.result === 'fail'
    && !review.detail) return false

  if (fieldSettings.comment.required === 'always'
    && (!review.comment)) return false

  if (fieldSettings.comment.required === 'findings'
    && review.result === 'fail'
    && (!review.comment)) return false

  return true
}

function normalizeReview ( review ) {
  if (typeof review.status === 'string') {
    review.status = {
      label: review.status,
      text: null
    }
  }
  if ((review.result && review.resultEngine === undefined) || review.resultEngine === null) {
    // How this object's resultEngine property affects the resultEngine field in the database:
    // A zero value instructs the service to set resultEngine = NULL
    // A null value instructs the service to retain the existing resultEngine field
    review.resultEngine = 0
  }
  return review
}

async function normalizeAndValidateReviews( reviews, collectionId, assetId, userObject ) {
  const userRules = await Review.getRulesByAssetUser( assetId, userObject )
  const collectionSettings = await Collection.getCollectionSettings(collectionId)
  const fieldSettings = collectionSettings.fields
  const statusSettings = collectionSettings.status
  const historySettings = collectionSettings.history
  const collectionGrant = userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
  const permitted = [], rejected = []
  for (const review of reviews) {
    if (userRules.has(review.ruleId)) {
      normalizeReview(review)
      if (!review.status || review.status.label === 'saved') {
        permitted.push(review)
      }
      else {
        if (isReviewSubmittable(fieldSettings, review)) {
          if (review.status.label !== 'submitted') {
            if (statusSettings.canAccept === true && collectionGrant.accessLevel >= statusSettings.minAcceptGrant) {
              permitted.push(review)
            }
            else {
              rejected.push({
                ruleId: review.ruleId,
                reason: `Requested status is not permitted by Collection Review status settings`
              })
            }
          }
          else {
            permitted.push(review)
          }
        }
        else {
          rejected.push({
            ruleId: review.ruleId,
            reason: 'Requested status is not consistent with Collection Review field settings'
          })
        }
      }
    }
    else {
      rejected.push({
        ruleId: review.ruleId,
        reason: 'Cannot post reviews for this ruleId'
      })
    }
  }
  return {permitted, rejected, statusSettings, fieldSettings, historySettings}
}

module.exports.postReviewsByAsset = async function postReviewsByAsset (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let reviewsRequested = req.body

    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant ) {
      const {permitted, rejected, statusSettings, historySettings} = await normalizeAndValidateReviews(reviewsRequested, collectionId, assetId, req.userObject)
      let affected = { updated: 0, inserted: 0 }
      if (permitted.length > 0) {
        affected = await Review.putReviewsByAsset({
          assetId,
          reviews: permitted,
          userObject: req.userObject,
          resetCriteria: statusSettings.resetCriteria,
          svcStatus: res.svcStatus,
          maxHistory: historySettings.maxReviews
        })
      }
      res.json({
        rejected,
        affected
      })
    }
    else {
      throw new SmError.PrivilegeError()
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
        let response = await Review.deleteReviewByAssetRule(assetId, ruleId, projection, req.userObject, res.svcStatus)
        res.status(response ? 200 : 204).json(response)
      }
      else {
        throw new SmError.PrivilegeError()
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

module.exports.exportReviews = async function exportReviews (includeHistory) {
  return await Review.exportReviews(includeHistory)
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
      throw new SmError.PrivilegeError()
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
      throw new SmError.PrivilegeError()
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
        status: req.query.status,
        benchmarkId: req.query.benchmarkId,
        metadata: req.query.metadata
      }, req.userObject )
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

module.exports.putReviewByAssetRule = async function (req, res, next) {
  try {
    let collectionId = req.params.collectionId
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let review = req.body
    let projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant ) {
      review.assetId = assetId
      review.ruleId = ruleId
      const {permitted, rejected, statusSettings, historySettings} = await normalizeAndValidateReviews([review], collectionId, assetId, req.userObject)
      if (permitted.length > 0) {
        const affected = await Review.putReviewsByAsset({
          assetId,
          reviews: permitted,
          userObject: req.userObject,
          resetCriteria: statusSettings.resetCriteria,
          tryInsert: true,
          svcStatus: res.svcStatus,
          maxHistory: historySettings.maxReviews
        })
        const rows =  await Review.getReviews(projection, {
          assetId: assetId,
          ruleId: ruleId
        }, req.userObject)
        
        if (affected.inserted > 0) {
          res.status(201).json(rows[0])
        } else {
          res.json(rows[0])
        }
      }
      else {
        throw new SmError.PrivilegeError(rejected[0].reason)
      }
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchReviewByAssetRule = async function (req, res, next) {
  try {
    const collectionId = req.params.collectionId
    const assetId = req.params.assetId
    const ruleId = req.params.ruleId
    const incomingReview = {...req.body, ruleId}
    const projection = req.query.projection
    const collectionGrant = req.userObject.collectionGrants.find( g => g.collection.collectionId === collectionId )
    if ( collectionGrant) {
      const currentReviews =  await Review.getReviews([], { assetId, ruleId }, req.userObject)
      if (currentReviews.length === 0) {
        throw new SmError.NotFoundError('Review must exist to be patched')
      }
      normalizeReview(incomingReview)
      const review = { ...currentReviews[0], ...incomingReview }
      if (currentReviews[0].resultEngine && incomingReview.result != currentReviews[0].result) {
        review.resultEngine = null
      }
      const {permitted, rejected, statusSettings, historySettings} = await normalizeAndValidateReviews([review], collectionId, assetId, req.userObject)
      if (permitted.length > 0) {
        await Review.putReviewsByAsset( {
          assetId,
          reviews: [incomingReview],
          userObject: req.userObject,
          resetCriteria: statusSettings.resetCriteria,
          tryInsert: false,
          svcStatus: res.svcStatus,
          maxHistory: historySettings.maxReviews
        })
        const rows =  await Review.getReviews(projection, { assetId, ruleId }, req.userObject)
        res.json(rows[0])
      }
      else {
        throw new SmError.PrivilegeError(rejected[0].reason)
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
        
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        if (!response) {
          throw new SmError.NotFoundError('metadata keys not found')
        }
        res.json(response)
      }
      else {
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        if (!response) {
          throw new SmError.NotFoundError('metadata key not found')
        }
        res.json(response)
      }
      else {
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
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
        throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
      }
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }  
}

