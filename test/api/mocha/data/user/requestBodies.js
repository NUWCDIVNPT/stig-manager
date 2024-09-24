//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.
const reference = require('../../referenceData.js')
const requestBodies = {
  scrapUser: {
      "username": "additionalTemp",
      "collectionGrants": [
          {
              "collectionId": reference.scrapCollection.collectionId,
              "accessLevel": 1
          }
      ]
  }
}
module.exports = requestBodies
