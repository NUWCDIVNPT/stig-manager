'use strict';

const writer = require('../utils/writer.js')
const {promises: fs} = require('fs')
const config = require('../utils/config')
const Operation = require(`../service/${config.database.type}/OperationService`)
const Asset = require(`./Asset`)
const Department = require(`./Department`)
const Package = require(`./Package`)
const User = require(`./User`)
const Review = require(`./Review`)

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
      let departments = await Department.exportDepartments(elevate, req.UserObject)
      let packages = await Package.exportPackages( [], elevate, req.userObject )
      let users = await User.exportUsers( [], elevate, req.userObject)
      users.forEach(user => {
        user.deptId = user.dept.deptId
        delete user.dept
      })
      let assets = await Asset.exportAssets( ['packages','stigReviewers'], elevate, req.userObject)
      assets.forEach(asset => {
        asset.packageIds = asset.packages.map( p => p.packageId )
        delete asset.packages
        asset.deptId = asset.dept.deptId
        delete asset.dept
        asset.stigReviewers = asset.stigReviewers.map( s => ({
          benchmarkId: s.benchmarkId,
          userIds: s.reviewers.map( r => r.userId )
        }))
      })
      let reviews = await Review.exportReviews(['history'], req.userObject)
      reviews.forEach(r => {
        ['assetName','username','reviewComplete'].forEach(k => delete r[k])
        r.history.forEach(h => delete h.username)
      })      
      let response = {
        packages: packages,
        departments: departments,
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
      let options = []
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
