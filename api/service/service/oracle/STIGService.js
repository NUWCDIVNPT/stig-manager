'use strict';


/**
 * Import a new STIG
 *
 * source byte[]  (optional)
 * returns STIG
 **/
exports.addSTIG = function(source) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "lastRevisionDate" : "lastRevisionDate",
  "title" : "title",
  "benchmarkId" : "benchmarkId",
  "lastRevisionStr" : "lastRevisionStr"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Deletes the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.deleteRevisionByString = function(benchmarkId,revisionStr) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "statusDate" : "statusDate",
  "revisionStr" : "revisionStr",
  "release" : "release",
  "description" : "description",
  "benchmarkDate" : "benchmarkDate",
  "version" : "version",
  "benchmarkId" : "benchmarkId",
  "status" : "status"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Deletes a STIG (*** and all revisions ***)
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.deleteStigById = function(benchmarkId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "lastRevisionDate" : "lastRevisionDate",
  "title" : "title",
  "benchmarkId" : "benchmarkId",
  "lastRevisionStr" : "lastRevisionStr"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return data for the specified CCI
 *
 * cci String A path parameter that indentifies a CCI
 * returns List
 **/
exports.getCci = function(cci) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "defintion" : "defintion",
  "contributor" : "contributor",
  "references" : [ {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  }, {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  } ],
  "cci" : "cci",
  "publishdate" : "publishdate",
  "type" : "type",
  "current_revisions" : [ {
    "statusDate" : "statusDate",
    "revisionStr" : "revisionStr",
    "release" : "release",
    "description" : "description",
    "benchmarkDate" : "benchmarkDate",
    "version" : "version",
    "benchmarkId" : "benchmarkId",
    "status" : "status"
  }, {
    "statusDate" : "statusDate",
    "revisionStr" : "revisionStr",
    "release" : "release",
    "description" : "description",
    "benchmarkDate" : "benchmarkDate",
    "version" : "version",
    "benchmarkId" : "benchmarkId",
    "status" : "status"
  } ],
  "status" : "status"
}, {
  "defintion" : "defintion",
  "contributor" : "contributor",
  "references" : [ {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  }, {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  } ],
  "cci" : "cci",
  "publishdate" : "publishdate",
  "type" : "type",
  "current_revisions" : [ {
    "statusDate" : "statusDate",
    "revisionStr" : "revisionStr",
    "release" : "release",
    "description" : "description",
    "benchmarkDate" : "benchmarkDate",
    "version" : "version",
    "benchmarkId" : "benchmarkId",
    "status" : "status"
  }, {
    "statusDate" : "statusDate",
    "revisionStr" : "revisionStr",
    "release" : "release",
    "description" : "description",
    "benchmarkDate" : "benchmarkDate",
    "version" : "version",
    "benchmarkId" : "benchmarkId",
    "status" : "status"
  } ],
  "status" : "status"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return a list of CCIs from a STIG revision
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getCcisByRevision = function(benchmarkId,revisionStr) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "references" : [ {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  }, {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  } ],
  "cci" : "cci",
  "type" : "type"
}, {
  "references" : [ {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  }, {
    "parentControl" : "parentControl",
    "creator" : "creator",
    "indexDisa" : "indexDisa",
    "textRefNist" : "textRefNist",
    "location" : "location",
    "title" : "title",
    "version" : "version"
  } ],
  "cci" : "cci",
  "type" : "type"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return the rules, checks and fixes for a Group from a specified revision of a STIG.
 * None
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * groupId String A path parameter that indentifies a Group
 * returns GroupObj
 **/
exports.getGroupByRevision = function(benchmarkId,revisionStr,groupId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "groupId" : "groupId",
  "profiles" : [ "MAC-1_Classified", "MAC-1_Classified" ],
  "rules" : [ {
    "severity" : "severity",
    "vulnDiscussion" : "vulnDiscussion",
    "thirdPartyTools" : "thirdPartyTools",
    "falseNegatives" : "falseNegatives",
    "documentable" : "documentable",
    "cci" : [ "cci", "cci" ],
    "weight" : "weight",
    "falsePositives" : "falsePositives",
    "potentialImpacts" : "potentialImpacts",
    "title" : "title",
    "version" : "version",
    "mitigations" : "mitigations",
    "fixes" : [ {
      "text" : "text",
      "fixId" : "fixId"
    }, {
      "text" : "text",
      "fixId" : "fixId"
    } ],
    "mitigationControl" : "mitigationControl",
    "checks" : [ {
      "checkId" : "checkId",
      "content" : "content"
    }, {
      "checkId" : "checkId",
      "content" : "content"
    } ],
    "responsibility" : "responsibility",
    "securityOverrideGuidance" : "securityOverrideGuidance",
    "ruleId" : "ruleId"
  }, {
    "severity" : "severity",
    "vulnDiscussion" : "vulnDiscussion",
    "thirdPartyTools" : "thirdPartyTools",
    "falseNegatives" : "falseNegatives",
    "documentable" : "documentable",
    "cci" : [ "cci", "cci" ],
    "weight" : "weight",
    "falsePositives" : "falsePositives",
    "potentialImpacts" : "potentialImpacts",
    "title" : "title",
    "version" : "version",
    "mitigations" : "mitigations",
    "fixes" : [ {
      "text" : "text",
      "fixId" : "fixId"
    }, {
      "text" : "text",
      "fixId" : "fixId"
    } ],
    "mitigationControl" : "mitigationControl",
    "checks" : [ {
      "checkId" : "checkId",
      "content" : "content"
    }, {
      "checkId" : "checkId",
      "content" : "content"
    } ],
    "responsibility" : "responsibility",
    "securityOverrideGuidance" : "securityOverrideGuidance",
    "ruleId" : "ruleId"
  } ],
  "title" : "title"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return the list of groups for the specified revision of a STIG.
 * Can optionally specify profile filters.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * profile List Filter by profile (optional)
 * returns GroupList
 **/
exports.getGroupsByRevision = function(benchmarkId,revisionStr,profile) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "groupId" : "groupId",
  "profiles" : [ "MAC-1_Classified", "MAC-1_Classified" ],
  "rules" : [ {
    "ruleId" : "ruleId",
    "title" : "title",
    "version" : "version"
  }, {
    "ruleId" : "ruleId",
    "title" : "title",
    "version" : "version"
  } ],
  "title" : "title"
}, {
  "groupId" : "groupId",
  "profiles" : [ "MAC-1_Classified", "MAC-1_Classified" ],
  "rules" : [ {
    "ruleId" : "ruleId",
    "title" : "title",
    "version" : "version"
  }, {
    "ruleId" : "ruleId",
    "title" : "title",
    "version" : "version"
  } ],
  "title" : "title"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return metadata for the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.getRevisionByString = function(benchmarkId,revisionStr) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "statusDate" : "statusDate",
  "revisionStr" : "revisionStr",
  "release" : "release",
  "description" : "description",
  "benchmarkDate" : "benchmarkDate",
  "version" : "version",
  "benchmarkId" : "benchmarkId",
  "status" : "status"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return a list of revisions for the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns List
 **/
exports.getRevisionsByBenchmarkId = function(benchmarkId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "statusDate" : "statusDate",
  "revisionStr" : "revisionStr",
  "release" : "release",
  "description" : "description",
  "benchmarkDate" : "benchmarkDate",
  "version" : "version",
  "benchmarkId" : "benchmarkId",
  "status" : "status"
}, {
  "statusDate" : "statusDate",
  "revisionStr" : "revisionStr",
  "release" : "release",
  "description" : "description",
  "benchmarkDate" : "benchmarkDate",
  "version" : "version",
  "benchmarkId" : "benchmarkId",
  "status" : "status"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return the defintion and associated checks and fixes for the specified Rule
 *
 * ruleId String A path parameter that indentifies a Rule
 * returns Rule
 **/
exports.getRuleByRuleId = function(ruleId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "severity" : "severity",
  "vulnDiscussion" : "vulnDiscussion",
  "thirdPartyTools" : "thirdPartyTools",
  "falseNegatives" : "falseNegatives",
  "documentable" : "documentable",
  "cci" : [ "cci", "cci" ],
  "weight" : "weight",
  "falsePositives" : "falsePositives",
  "potentialImpacts" : "potentialImpacts",
  "title" : "title",
  "version" : "version",
  "mitigations" : "mitigations",
  "fixes" : [ {
    "text" : "text",
    "fixId" : "fixId"
  }, {
    "text" : "text",
    "fixId" : "fixId"
  } ],
  "mitigationControl" : "mitigationControl",
  "checks" : [ {
    "checkId" : "checkId",
    "content" : "content"
  }, {
    "checkId" : "checkId",
    "content" : "content"
  } ],
  "responsibility" : "responsibility",
  "securityOverrideGuidance" : "securityOverrideGuidance",
  "ruleId" : "ruleId"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return rule data for the specified revision of a STIG.
 * Can optionally specify profile filters.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * profile List Filter by profile (optional)
 * returns List
 **/
exports.getRulesByRevision = function(benchmarkId,revisionStr,profile) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "severity" : "severity",
  "vulnDiscussion" : "vulnDiscussion",
  "thirdPartyTools" : "thirdPartyTools",
  "falseNegatives" : "falseNegatives",
  "documentable" : "documentable",
  "cci" : [ "cci", "cci" ],
  "weight" : "weight",
  "falsePositives" : "falsePositives",
  "potentialImpacts" : "potentialImpacts",
  "title" : "title",
  "version" : "version",
  "mitigations" : "mitigations",
  "fixes" : [ {
    "text" : "text",
    "fixId" : "fixId"
  }, {
    "text" : "text",
    "fixId" : "fixId"
  } ],
  "mitigationControl" : "mitigationControl",
  "checks" : [ {
    "checkId" : "checkId",
    "content" : "content"
  }, {
    "checkId" : "checkId",
    "content" : "content"
  } ],
  "responsibility" : "responsibility",
  "securityOverrideGuidance" : "securityOverrideGuidance",
  "ruleId" : "ruleId"
}, {
  "severity" : "severity",
  "vulnDiscussion" : "vulnDiscussion",
  "thirdPartyTools" : "thirdPartyTools",
  "falseNegatives" : "falseNegatives",
  "documentable" : "documentable",
  "cci" : [ "cci", "cci" ],
  "weight" : "weight",
  "falsePositives" : "falsePositives",
  "potentialImpacts" : "potentialImpacts",
  "title" : "title",
  "version" : "version",
  "mitigations" : "mitigations",
  "fixes" : [ {
    "text" : "text",
    "fixId" : "fixId"
  }, {
    "text" : "text",
    "fixId" : "fixId"
  } ],
  "mitigationControl" : "mitigationControl",
  "checks" : [ {
    "checkId" : "checkId",
    "content" : "content"
  }, {
    "checkId" : "checkId",
    "content" : "content"
  } ],
  "responsibility" : "responsibility",
  "securityOverrideGuidance" : "securityOverrideGuidance",
  "ruleId" : "ruleId"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return a list of available STIGs
 *
 * packageId Integer Package identifier (optional)
 * assetId Integer Asset identifier (optional)
 * title String A string found anywhere in a STIG title (optional)
 * os String An operating system TOE (optional)
 * returns List
 **/
exports.getSTIGs = function(packageId,assetId,title,os) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "lastRevisionDate" : "lastRevisionDate",
  "title" : "title",
  "benchmarkId" : "benchmarkId",
  "lastRevisionStr" : "lastRevisionStr"
}, {
  "lastRevisionDate" : "lastRevisionDate",
  "title" : "title",
  "benchmarkId" : "benchmarkId",
  "lastRevisionStr" : "lastRevisionStr"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return properties of the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.getStigById = function(benchmarkId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "lastRevisionDate" : "lastRevisionDate",
  "title" : "title",
  "benchmarkId" : "benchmarkId",
  "lastRevisionStr" : "lastRevisionStr"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

