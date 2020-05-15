'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const Asset = require(`./AssetService`);
const Package = require(`./PackageService`);
// const User = require(`./UserService`);
// const Reviews = require(`./ReviewService`);


/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getVersion = async function(userObject) {
  try {
    return (dbUtils.version)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceAppData = async function (includeStigs, userObject ) {
  
}

