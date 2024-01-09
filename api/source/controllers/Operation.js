const writer = require('../utils/writer.js')
const config = require('../utils/config')
const OperationService = require(`../service/OperationService`)
const Asset = require(`./Asset`)
const Collection = require(`./Collection`)
const User = require(`./User`)
const Review = require(`./Review`)
const JSZip = require("jszip");
const {JSONPath} = require('jsonpath-plus')
const SmError = require('../utils/error.js')

module.exports.getConfiguration = async function getConfiguration (req, res, next) {
  try {
    let dbConfigs = await OperationService.getConfiguration()
    let version = {version: config.version}
    let commit = {commit: config.commit}
    let response = { ...version, ...commit, ...dbConfigs }
    res.json(response)
  }
  catch(err) {
    next(err)
  }
}

module.exports.setConfigurationItem = async function setConfigurationItem (req, res, next) {
  try {
    //TODO: Implement
  }
  catch(err) {
    next(err)
  }
}

module.exports.getAppData = async function getAppData (req, res, next) {
  try {
    let elevate = req.query.elevate
    if ( elevate ) {
      let collections = await Collection.exportCollections( ['grants', 'labels', 'stigs'], elevate, req.userObject )
      for (const collection of collections) {
          for (const grant of collection.grants) {
            grant.userId = grant.user.userId
            delete grant.user
          }
      }
      let users = await User.exportUsers( ['statistics'], elevate, req.userObject)
      let assets = await Asset.exportAssets( ['stigGrants'], elevate, req.userObject)
      assets.forEach(asset => {
        asset.collectionId = asset.collection.collectionId
        delete asset.collection
        asset.stigGrants = asset.stigGrants.map( s => ({
          benchmarkId: s.benchmarkId,
          userIds: s.users.map( r => r.userId )
        }))
      })
      let reviews = await Review.exportReviews(true)
      let response = {
        users: users,
        collections: collections,
        assets: assets,
        reviews: reviews
      }
      let zip = new JSZip()
      zip.file("stig-manager-appdata.json", JSON.stringify(response))
      let buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: "DEFLATE",
        compressionOptions: {
            level: 3
        }
      })
      writer.writeInlineFile(res, buffer, 'stig-manager-appdata.json.zip', 'application/zip')
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.replaceAppData = async function replaceAppData (req, res, next) {
  try {
    req.noCompression = true
    let elevate = req.query.elevate
    let appdata
    if ( elevate ) {
      if (req.file && (req.file.mimetype === 'application/json' || req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') ) {
        let data = req.file.buffer
        if (req.file.mimetype === 'application/zip' || req.file.mimetype === 'application/x-zip-compressed') {
          let zipIn = new JSZip()
          let contents = await zipIn.loadAsync(data)
          let fns = Object.keys(contents.files)
          if (fns.length > 1) {
            throw new SmError.UnprocessableError('ZIP archive has too many files.')
          }
          let fn = fns[0]
          data = await contents.files[fn].async("nodebuffer")
        }
        appdata = JSON.parse(data)
      }
      else {
        appdata = req.body
      }
      let options = []
      await OperationService.replaceAppData(options, appdata, req.userObject, res )
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getDefinition = async function getDefinition (req, res, next) {
  try {
    let jsonpath = req.query.jsonpath
    if (jsonpath) {
      res.json(JSONPath(jsonpath, config.definition))
    }
    else {
      res.json(config.definition)
    }
  }
  catch (err) {
    next(err)
  }
}

module.exports.getDetails = async function getDetails (req, res, next) {
  try {
    let elevate = req.query.elevate
    if ( elevate ) {
      const response = await OperationService.getDetails()
      res.json(response)
    }
    else {
      throw new SmError.PrivilegeError()
    }
  }
  catch (err) {
    next(err)
  }
}
