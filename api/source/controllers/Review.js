'use strict';

const config = require('../utils/config')
const ReviewService = require(`../service/ReviewService`)
const CollectionService = require(`../service/CollectionService`)
const Collection = require(`./Collection`)
const SmError = require('../utils/error')
const Security = require('../utils/roles')
const dbUtils = require('../service/utils')

const _this = this

module.exports.postReviewsByAsset = async function postReviewsByAsset (req, res, next) {
  try {
    const { collectionId } = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const assetId = req.params.assetId
    const reviews = req.body
    const result = await ReviewService.putReviewsByAsset({
      assetId,
      reviews,
      collectionId, 
      userId: req.userObject.userId,
      grant: req.userObject.grants[collectionId],
      svcStatus: res.svcStatus
    })
    res.json(result)
  }
  catch(err) {
    next(err)
  }
}

module.exports.deleteReviewByAssetRule = async function deleteReviewByAssetRule (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let projections = req.query.projection
    
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant, checkWritable: true})
    if (userHasRule) {
      let response = await ReviewService.deleteReviewByAssetRule({assetId, ruleId, projections, grant, svcStatus: res.svcStatus})
      res.status(response ? 200 : 204).json(response)
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
  return await ReviewService.exportReviews(includeHistory)
} 

module.exports.getReviewByAssetRule = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let projections = req.query.projection
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    
    let response = await ReviewService.getReviews({
      projections, 
      filter: {
        collectionId,
        assetId: assetId,
        ruleId: ruleId
      },
      grant,
      userObject: req.userObject
    })
    // res.json(response[0])
    // res.status(typeof response === 'undefined' ? 204 : 200).json(response[0])
    res.status(response.length == 0 ? 204 : 200).json(response[0])
  }
  catch(err) {
    next(err)
  }
}

module.exports.getReviewsByCollection = async function getReviewsByCollection (req, res, next) {
  try {
    let projections = req.query.projection
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)

    let response = await ReviewService.getReviews({
      projections,
      filter: {
        collectionId,
        result: req.query.result,
        status: req.query.status,
        rules: req.query.rules || 'default-mapped',
        ruleId: req.query.ruleId,
        groupId: req.query.groupId,
        cci: req.query.cci,
        userId: req.query.userId,
        assetId: req.query.assetId,
        benchmarkId: req.query.benchmarkId,
        metadata: req.query.metadata
      },
      grant,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.getReviewsByAsset = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let projections = req.query.projection
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    
    let response = await ReviewService.getReviews({
      projections,
      filter: {
        collectionId,
        assetId: assetId,
        rules: req.query.rules || 'default-mapped',
        result: req.query.result,
        status: req.query.status,
        benchmarkId: req.query.benchmarkId,
        metadata: req.query.metadata
      },
      grant,
      userObject: req.userObject
    })
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.putReviewByAssetRule = async function (req, res, next) {
  try {
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const {assetId, ruleId} = {...req.params}
    const review = {...req.body, ruleId}
    const projections = req.query.projection
    const result = await ReviewService.putReviewsByAsset({
      assetId,
      reviews: [review],
      collectionId, 
      userId: req.userObject.userId,
      grant: req.userObject.grants[collectionId],
      svcStatus: res.svcStatus
    })
    if (result.rejected.length) {
      throw new SmError.PrivilegeError(result.rejected[0].reason)
    }
    const rows =  await ReviewService.getReviews({
      projections,
      filter: {assetId, ruleId},
      grant,
      userObject: req.userObject
    })
    res.status(result.affected.inserted > 0 ? 201 : 200).json(rows[0])
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchReviewByAssetRule = async function (req, res, next) {
  try {
    if (Object.hasOwn(req.body, 'resultEngine') && !Object.hasOwn(req.body, 'result')) {
      throw new SmError.UnprocessableError('Request body with resultEngine must include a result')
    }
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const {assetId, ruleId} = {...req.params}
    const currentReviews =  await ReviewService.getReviews({
      filter: {assetId, ruleId},
      grant,
      userObject: req.userObject
    })
    if (currentReviews.length === 0) {
      throw new SmError.NotFoundError('Review must exist to be patched')
    }
    const review = {...req.body, ruleId}
    const projections = req.query.projection
    const result = await ReviewService.putReviewsByAsset({
      assetId,
      reviews: [review],
      collectionId, 
      userId: req.userObject.userId,
      grant: req.userObject.grants[collectionId],
      svcStatus: res.svcStatus
    })
    if (result.rejected.length) {
      throw new SmError.PrivilegeError(result.rejected[0].reason)
    }
    const rows =  await ReviewService.getReviews({
      projections,
      filter: {assetId, ruleId},
      grant,
      userObject: req.userObject
    })
    res.json(rows[0])
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadata = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant})
    if (userHasRule) {
      let response = await ReviewService.getReviewMetadata( assetId, ruleId, req.userObject)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.patchReviewMetadata = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let metadata = req.body
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant, checkWritable: true})
    if (userHasRule) {
      await ReviewService.patchReviewMetadata( assetId, ruleId, metadata)
      let response = await ReviewService.getReviewMetadata( assetId, ruleId)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putReviewMetadata = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let body = req.body
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant, checkWritable: true})
    if (userHasRule) {
      await ReviewService.putReviewMetadata( assetId, ruleId, body)
      let response = await ReviewService.getReviewMetadata( assetId, ruleId)
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to put the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadataKeys = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant})
    if (userHasRule) {
      let response = await ReviewService.getReviewMetadataKeys( assetId, ruleId, req.userObject)
      if (!response) {
        throw new SmError.NotFoundError('metadata keys not found')
      }
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.getReviewMetadataValue = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant})
    if (userHasRule) {
      let response = await ReviewService.getReviewMetadataValue( assetId, ruleId, key, req.userObject)
      if (!response) {
        throw new SmError.NotFoundError('metadata key not found')
      }
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.putReviewMetadataValue = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    let value = req.body
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant, checkWritable: true})
    if (userHasRule) {
      await ReviewService.putReviewMetadataValue( assetId, ruleId, key, value)
      res.status(204).send()
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.deleteReviewMetadataKey = async function (req, res, next) {
  try {
    let assetId = req.params.assetId
    let ruleId = req.params.ruleId
    let key = req.params.key
    const {collectionId, grant} = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const userHasRule = await ReviewService.checkRuleByAssetUser({ruleId, assetId, collectionId, grant: grant, checkWritable: true})
    if (userHasRule) {
      await ReviewService.deleteReviewMetadataKey( assetId, ruleId, key, req.userObject)
      res.status(204).send()
    }
    else {
      throw new SmError.PrivilegeError('User has insufficient privilege to patch the review of this rule.')
    }
  }
  catch (err) {
    next(err)
  }  
}

module.exports.postReviewBatch = async function (req, res, next) {
  try {
  
    const { collectionId, grant } = await Collection.getCollectionInfoAndCheckPermission(req, Security.ROLES.Restricted)
    const collectionSettings = await CollectionService.getCollectionSettings(collectionId)
    const historySettings = collectionSettings.history
    const statusSettings = collectionSettings.status
    const userId = req.userObject.userId
  
    let {source, assets, rules, action, updateFilters, dryRun = false} = req.body
    // normalize status property
    if (typeof source.review.status === 'string') {
      source.review.status = {
        label: source.review.status,
        text: null
      }
    }
    // reject unpermitted accept/reject
    if (source.review.status?.label === 'accepted' || source.review.status?.label === 'rejected') {
      if (!statusSettings.canAccept) {
        throw new SmError.PrivilegeError('Reviews cannot be accepted/rejected in this Collection') 
      }
      if (grant.roleId < statusSettings.minAcceptGrant) {
        throw new SmError.PrivilegeError('User cannot accept/reject Reviews in this Collection') 
      }
    }
    // validate action
    if (!source.review.result && (action === 'insert' || action === 'merge')) {
      throw new SmError.UnprocessableError('Cannot insert a NULL result')
    }
    // default action if missing
    if (!action) {
      action = source.review.result ? 'merge' : 'update'
    }

    // are grant checks required
    let skipGrantCheck = false
    if (assets.benchmarkIds && rules.benchmarkIds && assets.benchmarkIds.length === rules.benchmarkIds.length) {
      skipGrantCheck = assets.benchmarkIds.every( i => rules.benchmarkIds.includes(i)) &&
        rules.benchmarkIds.every( i => assets.benchmarkIds.includes(i))
    }

    const result = await ReviewService.postReviewBatch({
      source, 
      assets, 
      rules,
      action,
      updateFilters,
      dryRun,
      collectionId, 
      userId,
      grant,
      svcStatus: res.svcStatus,
      historyMaxReviews: historySettings.maxReviews,
      skipGrantCheck
    })
    res.json(result)
  }
  catch (err) {
    next(err)
  }
}

