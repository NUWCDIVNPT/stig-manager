'use strict';

var utils = require('../utils/writer.js');
var config = require('../utils/config')
var Version = require(`../service/${config.database.type}/VersionService`);

module.exports.getVersion = function getVersion (req, res, next) {
  Version.getVersion()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
