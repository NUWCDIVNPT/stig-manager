'use strict';


/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getVersion = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "nearest-tag" : "nearest-tag",
  "commit" : "commit",
  "branch" : "branch"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

