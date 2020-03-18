'use strict';

var utils = require('../utils/writer.js');
var config = require('../utils/config')
var User = require(`../service/${config.database.type}/UserService`);

module.exports.createUser = function createUser (req, res, next, body, projection) {
  User.createUser(body, projection)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUsers = function getUsers (req, res, next, projection, elevate, role, packageId, benchmarkId, dept, canAdmin) {
  User.getUsers(projection, elevate, role, packageId, benchmarkId, dept, canAdmin)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
