//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.
import reference from '../../referenceData.js'
export const requestBodies = {
  scrapUser: {
      "username": "additionalTemp",
      "collectionGrants": [
          {
              "collectionId": reference.scrapCollection.collectionId,
              "roleId": 1
          }
      ]
  }
}
