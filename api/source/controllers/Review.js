'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)
const dbUtils = require(`../service/${config.database.type}/utils`)

module.exports.importReviews = async function importReviews (req, res, next) {
  try {
    let extension = req.file.originalname.substring(req.file.originalname.lastIndexOf(".")+1)
    if (extension != 'ckl' && extension != 'xml' && extension != 'zip') {
      throw (writer.respondWithCode ( 400, {message: `File extension .${extension} not supported`} ))
    }
    let body = req.swagger.params['body'].value
    let response = await Review.importReviews(body, req.file, req.userObject, res)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteReview = async function deleteReview (req, res, next) {
  let reviewId = req.swagger.params['reviewId'].value
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.deleteReview(reviewId, projection, req.userObject)
    writer.writeJson(res, response)
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
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.getReviews( projection,
      {
        assetId: req.swagger.params['assetId'].value,
        ruleId: req.swagger.params['ruleId'].value
      }, req.userObject)
    writer.writeJson(res, response[0])
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviews = async function getReviews (req, res, next) {
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.getReviews( projection, {
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        ruleId: req.swagger.params['ruleId'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        revisionStr: req.swagger.params['revisionStr'].value,
        assetId: req.swagger.params['assetId'].value,
        packageId: req.swagger.params['packageId'].value
      }, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviewsByAssetId = async function (req, res, next) {
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.getReviews( projection, {
        result: req.swagger.params['result'].value,
        action: req.swagger.params['action'].value,
        status: req.swagger.params['status'].value,
        benchmarkId: req.swagger.params['benchmarkId'].value,
        revisionStr: req.swagger.params['revisionStr'].value,
        assetId: req.swagger.params['assetId'].value
      }, req.userObject )
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.putReview = async function (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let assetId = req.swagger.params['assetId'].value
  let ruleId = req.swagger.params['ruleId'].value
  let body = req.swagger.params['body'].value
  try {
    if (await dbUtils.userHasAssetRule(assetId, ruleId, false, req.userObject)) {
      let response = await Review.putReview( projection, assetId, ruleId, body, req.userObject)
      if (response.status === 'updated') {
        writer.writeJson(res, response.row)
      } else {
        writer.writeJson(res, writer.respondWithCode ( 201, response.row ))
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

module.exports.putReviews = async function (req, res, next) {
  let body = req.swagger.params['body'].value
  try {
    let response = await Review.putReviews(body, req.userObject)
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.patchReview = async function (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let assetId = req.swagger.params['assetId'].value
  let ruleId = req.swagger.params['ruleId'].value
  let body = req.swagger.params['body'].value
  try {
    if (await dbUtils.userHasAssetRule(assetId, ruleId, false, req.userObject)) {
      let response = await Review.patchReview( projection, assetId, ruleId, body, req.userObject)
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

module.exports.updateReview = async function updateReview (req, res, next) {
  let reviewId = req.swagger.params['reviewId'].value
  let body = req.swagger.params['body'].value
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.updateReview(reviewId, body, projection, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}
