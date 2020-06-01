'use strict';

var writer = require('../utils/writer.js')
var config = require('../utils/config')
var Package = require(`../service/${config.database.type}/PackageService`)

module.exports.createPackage = async function createPackage (req, res, next) {
  try {
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    let body = req.swagger.params['body'].value
    if ( elevate || req.userObject.accessLevel === 3 ) {
      let response = await Package.createPackage( body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }  
}

module.exports.deletePackage = async function deletePackage (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel === 3) {
      let packageId = req.swagger.params['packageId'].value
      let projection = req.swagger.params['projection'].value
      let response = await Package.deletePackage(packageId, projection, elevate, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getChecklistByPackageStig = async function getChecklistByPackageStig (req, res, next) {
  try {
    let packageId = req.swagger.params['packageId'].value
    let benchmarkId = req.swagger.params['benchmarkId'].value
    let revisionStr = req.swagger.params['revisionStr'].value
    let response = await Package.getChecklistByPackageStig(packageId, benchmarkId, revisionStr, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getPackage = async function getPackage (req, res, next) {
  try {
    let packageId = req.swagger.params['packageId'].value
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Package.getPackage(packageId, projection, elevate, req.userObject )
    writer.writeJson(res, response)
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.getPackages = async function getPackages (req, res, next) {
  try {
    let projection = req.swagger.params['projection'].value
    let elevate = req.swagger.params['elevate'].value
    let response = await Package.getPackages(projection, elevate, req.userObject)
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
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel === 3 ) {
      let packageId = req.swagger.params['packageId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.body
      let response = await Package.replacePackage(packageId, body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}


module.exports.updatePackage = async function updatePackage (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate || req.userObject.accessLevel === 3 ) {
      let packageId = req.swagger.params['packageId'].value
      let projection = req.swagger.params['projection'].value
      let body = req.body
      let response = await Package.updatePackage(packageId, body, projection, req.userObject)
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: "User has insufficient privilege to complete this request."} ) )
    }    
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}
