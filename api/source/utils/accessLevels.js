
// Needed to look up the property when retrieving the values from the database
module.exports.getKeyByValue = (obj, value) => 
        Object.keys(obj).find(key => obj[key] === value);

module.exports.ACCESS_LEVEL = { 
    'Restricted': 1,
    'Full': 2,
    'Manage': 3,
    'Owner': 4
}
