'use strict';

var writer = require('../utils/writer.js');
var config = require('../utils/config')
var STIG = require(`../service/${config.database.type}/STIGService`);

module.exports.addSTIG = function addSTIG (req, res, next, source) {
  STIG.addSTIG(source)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.deleteRevisionByString = function deleteRevisionByString (req, res, next, benchmarkId, revisionStr) {
  STIG.deleteRevisionByString(benchmarkId, revisionStr)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.deleteStigById = function deleteStigById (req, res, next, benchmarkId) {
  STIG.deleteStigById(benchmarkId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getCci = function getCci (req, res, next, cci) {
  STIG.getCci(cci)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getCcisByRevision = function getCcisByRevision (req, res, next, benchmarkId, revisionStr) {
  STIG.getCcisByRevision(benchmarkId, revisionStr)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getGroupByRevision = function getGroupByRevision (req, res, next, benchmarkId, revisionStr, groupId) {
  STIG.getGroupByRevision(benchmarkId, revisionStr, groupId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getGroupsByRevision = function getGroupsByRevision (req, res, next, benchmarkId, revisionStr, profile) {
  STIG.getGroupsByRevision(benchmarkId, revisionStr, profile)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getRevisionByString = function getRevisionByString (req, res, next, benchmarkId, revisionStr) {
  STIG.getRevisionByString(benchmarkId, revisionStr)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getRevisionsByBenchmarkId = function getRevisionsByBenchmarkId (req, res, next, benchmarkId) {
  STIG.getRevisionsByBenchmarkId(benchmarkId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getRuleByRuleId = function getRuleByRuleId (req, res, next, ruleId) {
  STIG.getRuleByRuleId(ruleId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getRulesByRevision = function getRulesByRevision (req, res, next, benchmarkId, revisionStr, profile) {
  STIG.getRulesByRevision(benchmarkId, revisionStr, profile)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getSTIGs = function getSTIGs (req, res, next, packageId, assetId, title, os) {
  STIG.getSTIGs(packageId, assetId, title, os)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};

module.exports.getStigById = function getStigById (req, res, next, benchmarkId) {
  STIG.getStigById(benchmarkId)
    .then(function (response) {
      writer.writeJson(res, response);
    })
    .catch(function (response) {
      writer.writeJson(res, response);
    });
};
