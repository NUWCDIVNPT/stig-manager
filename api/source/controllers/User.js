'use strict';

const writer = require('../utils/writer.js')
const config = require('../utils/config')
const ROLE = require('../utils/appRoles')
const User = require(`../service/${config.database.type}/UserService`)
const Asset = require(`../service/${config.database.type}/AssetService`)

module.exports.createUser = async function createUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.createUser(body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.deleteUser = async function deleteUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate) {
      let userId = req.swagger.params['userId'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.deleteUser(userId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )    
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUserObject = async function getUserObject (req, res, next) {
  try {
    writer.writeJson(res, req.userObject)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUserByUserId = async function getUserByUserId (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role.roleId >= ROLE.DEPT) {
      let userId = req.swagger.params['userId'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.getUserByUserId(userId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getUsers = async function getUsers (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role.roleId >= ROLE.DEPT) {
      let projection = req.swagger.params['projection'].value
      let elevate = req.swagger.params['elevate'].value
      let roleId = req.swagger.params['roleId'].value
      let deptId = req.swagger.params['deptId'].value
      let canAdmin = req.swagger.params['canAdmin'].value
      let response = await User.getUsers(roleId, deptId, canAdmin, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceUser = async function replaceUser (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate ) {
      let userId = req.swagger.params['userId'].value
      let body = req.swagger.params['body'].value
      let projection = req.swagger.params['projection'].value
      let response = await User.replaceUser(userId, body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

// User.updateUser() restrictions:
// For all roles, members of stigReviews must describe an existing StigAsset mapping
// Elevated:     Unrestricted changes
// ROLE.COMMAND: Change display and all members of stigReviews
// ROLE.DEPT:    Change display and some members of stigReviews
//               Can remove any existing member from stigReviews
//               Can retain any existing member from stigReviews
//               New member of stigReviews must include a departmental asset
module.exports.updateUser = async function updateUser (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    if (elevate || req.userObject.role.roleId >= ROLE.DEPT) {
      const userId = req.swagger.params['userId'].value
      const body = req.swagger.params['body'].value
      const projection = req.swagger.params['projection'].value
      if (! elevate ) { // Unelevated ROLE.COMMAND or ROLE.DEPT
        // Unelevated requests cannot change core properties
        const prohibited = ['username', 'deptId', 'roleId', 'canAdmin']
        const hasProhibited = Object.keys(body).some((val) => prohibited.includes(val))
        if (hasProhibited) {
          writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
          return
        }
        if (req.userObject.role.roleId === ROLE.DEPT && body.stigReviews) {
          // Unelevated ROLE.DEPT is setting items of stigReviews
          // Get the assets ROLE.DEPT can configure
          const allowedAssets = await Asset.getAssets( null, null, null, null, elevate, req.userObject )
          const allowedAssetIds = allowedAssets.map(a => a.assetId)
          // Get this User's current record with stigReviews
          const currentUserState = await User.getUserByUserId(userId, ['stigReviews'], elevate, req.userObject)
          
          // Function to check if a stigReview item can be added by this ROLE.DEPT
          const isAllowedStigReview = (stigReview) => {
            // Does stigReview include a departmental asset?
            const assetAllowed = allowedAssetIds.includes(stigReview.assetId)            
            if (assetAllowed) { return true }
            // Does stigReview match an existing non-departmental asset/STIG item?
            const existingItem = currentUserState.stigReviews.some(item => {
              item.benchmarkId === stigReview.benchmarkId && item.assetId === stigReview.assetId
            })
            return existingItem
          }
          
          // Check if each item of stigReview is permitted
          const allowed = body.stigReviews.every(isAllowedStigReview)
          if (! allowed) {
            writer.writeJson(res, writer.respondWithCode ( 403, {message: `Attempted to set a prohibited item of stigReviews`} ) )
            return
          }
        }
      }
      const response = await User.updateUser(userId, body, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) ) 
    }
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

