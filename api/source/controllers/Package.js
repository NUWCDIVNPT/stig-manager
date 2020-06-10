'use strict';

var writer = require('../utils/writer.js')
var config = require('../utils/config')
var Package = require(`../service/${config.database.type}/PackageService`)

module.exports.createPackage = async function createPackage (req, res, next) {
  try {
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    const body = req.swagger.params['body'].value
    if ( elevate || req.userObject.canCreatePackage ) {
      const response = await Package.createPackage( body, projection, req.userObject)
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

module.exports.deletePackage = async function deletePackage (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const packageId = req.swagger.params['packageId'].value
    const projection = req.swagger.params['projection'].value
    const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
    if (elevate || (packageGrant && packageGrant.accessLevel === 4)) {
      const response = await Package.deletePackage(packageId, projection, elevate, req.userObject)
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

module.exports.getChecklistByPackageStig = async function getChecklistByPackageStig (req, res, next) {
  try {
    const packageId = req.swagger.params['packageId'].value
    const benchmarkId = req.swagger.params['benchmarkId'].value
    const revisionStr = req.swagger.params['revisionStr'].value
    const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
    if ( packageGrant || req.userObject.globalAccess ) {
      const response = await Package.getChecklistByPackageStig(packageId, benchmarkId, revisionStr, req.userObject )
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

module.exports.getPackage = async function getPackage (req, res, next) {
  try {
    const packageId = req.swagger.params['packageId'].value
    const projection = req.swagger.params['projection'].value
    const elevate = req.swagger.params['elevate'].value
    const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
    if (packageGrant || req.userObject.globalAccess || elevate ) {
      const response = await Package.getPackage(packageId, projection, elevate, req.userObject )
      // if (response.hasOwnProperty('grants') && packageGrant.accessLevel < 3) {
      //   response.grants = response.grants.filter(g => g.userId === req.userObject.userId)
      // }
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

module.exports.getPackages = async function getPackages (req, res, next) {
  try {
    const projection = []
    const elevate = req.swagger.params['elevate'].value
    const response = await Package.getPackages(projection, elevate, req.userObject)
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.exportPackages = async function exportPackages (projection, elevate, userObject) {
  try {
    return await Package.getPackages( projection, elevate, userObject )
  }
  catch (err) {
    throw (err)
  }
} 

module.exports.replacePackage = async function updatePackage (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const packageId = req.swagger.params['packageId'].value
    const projection = req.swagger.params['projection'].value
    const body = req.body
    const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
    if ( elevate || (packageGrant && packageGrant.accessLevel >= 3) ) {
      const response = await Package.replacePackage(packageId, body, projection, req.userObject)
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


module.exports.updatePackage = async function updatePackage (req, res, next) {
  try {
    const elevate = req.swagger.params['elevate'].value
    const packageId = req.swagger.params['packageId'].value
    const projection = req.swagger.params['projection'].value
    const body = req.body
    const packageGrant = req.userObject.packageGrants.find( g => g.packageId === packageId )
    if ( elevate || (packageGrant && packageGrant.accessLevel >= 3) ) {
      let response = await Package.replacePackage(packageId, body, projection, req.userObject)
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
