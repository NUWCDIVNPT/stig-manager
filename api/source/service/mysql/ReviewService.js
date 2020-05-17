'use strict';
const writer = require('../../utils/writer.js')
const parsers = require('../../utils/parsers.js')
const dbUtils = require('./utils')


/**
Generalized queries for review(s).
**/
exports.queryReviews = async function (inProjection = [], inPredicates = {}, elevate, userObject) {

}


/**
 * Import a Review
 *
 * body Review 
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.importReviews = async function(body, elevate, file, userObject, response) {

}


/**
 * Delete a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.deleteReview = async function(reviewId, projection, userObject) {
}


/**
 * Return a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * returns AssetProjected
 **/
exports.getReview = async function(reviewId, projection, elevate, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Reviews accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * state ReviewState  (optional)
 * action ReviewAction  (optional)
 * status ReviewStatus  (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * benchmarkId String Selects Reviews mapped to a STIG (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * packageId Integer Selects Reviews mapped to a Package (optional)
 * returns List
 **/
exports.getReviews = async function(projection, predicates, elevate, userObject) {
  try {
    let rows = await this.queryReviews(projection, predicates, elevate, userObject)
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Create or update a complete Review
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReview = async function(projection, assetId, ruleId, body, elevate, userObject) {

}


/**
 * Create or update a complete Review
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.putReviews = async function( body, elevate, userObject) {

}


/**
 * Merge update a Review, if it exists
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * ruleId String Selects Reviews of a Rule (optional)
 * assetId String Selects Reviews mapped to an Asset (optional)
 * body Object The Review content (required)
 * returns Review
 **/
exports.patchReview = async function(projection, assetId, ruleId, body, elevate, userObject) {

}


/**
 * Merge updates to a Review
 *
 * reviewId Integer A path parameter that indentifies a Review
 * body AssetAssign 
 * projection List Additional properties to include in the response.  (optional)
 * returns ReviewProjected
 **/
exports.updateReview = async function(reviewId, body, projection, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

