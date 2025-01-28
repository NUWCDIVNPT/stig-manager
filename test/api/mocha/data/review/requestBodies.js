//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.
import reference from '../../referenceData.js'

export const requestBodies = {
  resetRule: {
    autoResult: false,
    comment: "",
    detail: "test\nvisible to lvl1\nhas history",
    metadata: {},
    result: 'notapplicable',
    status: 'submitted',
  }
}
