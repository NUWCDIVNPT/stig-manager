'use strict';

const writer = require('../utils/writer.js')
const {promises: fs} = require('fs')
const config = require('../utils/config')
const Operation = require(`../service/${config.database.type}/OperationService`)
const Asset = require(`../service/${config.database.type}/AssetService`)
const Package = require(`../service/${config.database.type}/PackageService`)
const User = require(`../service/${config.database.type}/UserService`)
const Review = require(`../service/${config.database.type}/ReviewService`)

module.exports.getVersion = async function getVersion (req, res, next) {
  try {
    let dbVersion = await Operation.getVersion()
    let response = {
      apiVersion: config.apiVersion,
      dataService: {
        type: config.database.type,
        version: dbVersion
      }
    }
    writer.writeJson(res, response)
  }
  catch(err) {
    writer.writeJson(res, err)
  }
}

module.exports.getAppData = async function getAppData (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    if ( elevate ) {
      let options = req.swagger.params['options'].value

      let packages = await Package.queryPackages( [], {}, elevate, req.userObject)

      let users = await User.queryUsers( [], {}, elevate, req.userObject)

      let assets = await Asset.queryAssets( ['packages','stigReviewers'], {}, elevate, req.userObject)
      assets.forEach(asset => {
        asset.packageIds = asset.packages.map( p => p.packageId )
        delete asset.packages
        asset.stigReviewers = asset.stigReviewers.map( s => ({
          benchmarkId: s.benchmarkId,
          userIds: s.reviewers.map( r => r.userId )
        }))
      })

      let reviews = await Review.queryReviews(['history'], {}, elevate, req.userObject)
      reviews.forEach(r => {
        ['stateId','statusId','actionId','assetName','username','done'].forEach(k => delete r[k])
        r.history.forEach(h => delete h.username)
      })      
      let response = {
        packages: packages,
        users: users,
        assets: assets,
        reviews: reviews
      }
      writer.writeJsonFile(res, response, 'stig-manager-appdata.json')
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}

module.exports.replaceAppData = async function replaceAppData (req, res, next) {
  try {
    let elevate = req.swagger.params['elevate'].value
    let appdata
    if ( elevate ) {
      if (req.file && req.file.mimetype === 'application/json') {
        let data = await fs.readFile(req.file.path)
        appdata = JSON.parse(data)
      }
      else {
        appdata = req.swagger.params['body'].value
      }
      let options = req.swagger.params['options'].value
      let response = await Operation.replaceAppData(options, appdata, req.userObject )
      writer.writeJson(res, response)
    }
    else {
      writer.writeJson(res, writer.respondWithCode ( 403, {message: `User has insufficient privilege to complete this request.`} ) )
    }
  }
  catch (err) {
    writer.writeJson(res, err)
  }
}
