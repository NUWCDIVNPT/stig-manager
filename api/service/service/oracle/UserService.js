'use strict';


/**
 * Create a User
 *
 * body UserAssign  (optional)
 * projection List Additional properties to include in the response.  (optional)
 * returns List
 **/
exports.createUser = function(body,projection) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Return a list of Users accessible to the requester
 *
 * projection List Additional properties to include in the response.  (optional)
 * elevate Boolean Elevate the user context for this request if user is permitted (canAdmin) (optional)
 * role UserRole  (optional)
 * packageId Integer Selects Users mapped to a Package (optional)
 * benchmarkId String Selects Users mapped to a STIG (optional)
 * dept String Selects Users exactly matching a department string (optional)
 * canAdmin Boolean Selects Users matching the condition (optional)
 * returns List
 **/
exports.getUsers = function(projection,elevate,role,packageId,benchmarkId,dept,canAdmin) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ "", "" ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

