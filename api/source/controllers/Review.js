'use strict';

const writer = require('../utils/writer.js')
const Parsers = require('../utils/parsers.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)
const dbUtils = require(`../service/${config.database.type}/utils`)
const {promises: fs} = require('fs')

module.exports.importReviews = async function importReviews (req, res, next) {
  try {
    let reviewsRequested, reviews
    let body = req.swagger.params['body'].value
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

    // let reviewsByStatus = await dbUtils.scrubReviewsByUser(reviewsRequested, false, req.userObject)
    // reviewsByStatus.errors = await Review.putReviews(reviewsByStatus.permitted, req.userObject)

    let reviewsByStatus = {
      permitted: reviewsRequested,
      rejected: []
    }
    reviewsByStatus.errors = await Review.putReviews(reviewsByStatus.permitted, req.userObject)

    writer.writeJson(res, reviewsByStatus)
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
      if (response.status === 'created') {
        writer.writeJson(res, response.row, 201)
      } else {
        writer.writeJson(res, response.row )
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
