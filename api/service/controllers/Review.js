'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const Review = require(`../service/${config.database.type}/ReviewService`)

module.exports.createReview = async function createReview (req, res, next) {
  let body = req.swagger.params['body'].value
  let projection = req.swagger.params['projection'].value
  try {
    let response = await Review.createReview(body, projection, req.userObject)
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

module.exports.getReview = async function getReview (req, res, next) {
  let reviewId = req.swagger.params['reviewId'].value
  let projection = req.swagger.params['projection'].value
  let elevate = req.swagger.params['elevate'].value
  try {
    let response = await Review.getReview(reviewId, projection, elevate, req.userObject)
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getReviews = async function getReviews (req, res, next) {
  let projection = req.swagger.params['projection'].value
  let elevate = req.swagger.params['elevate'].value
  let state = req.swagger.params['state'].value
  let action = req.swagger.params['action'].value
  let status = req.swagger.params['status'].value
  let ruleId = req.swagger.params['ruleId'].value
  let benchmarkId = req.swagger.params['benchmarkId'].value
  let revisionStr = req.swagger.params['revisionStr'].value
  let assetId = req.swagger.params['assetId'].value
  let packageId = req.swagger.params['packageId'].value
  try {
    let response = await Review.getReviews(
      projection, elevate, state, action, 
      status, ruleId, benchmarkId, revisionStr, 
      assetId, packageId, req.userObject
    )
    writer.writeJson(res, response)
  }
  catch(err) {
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
