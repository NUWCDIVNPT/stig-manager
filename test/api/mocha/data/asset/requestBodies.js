//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.

import reference from "../../referenceData.js";

export const requestBodies = {
    tempAssetPost: {
        name: "TempAsset",
        collectionId: "21",
        description: "",
        ip: "",
        noncomputing: true,
        mac: null,
        labelIds: [
            reference.testCollection.fullLabelName,
            reference.testCollection.lvl1LabelName,
        ],
        metadata: {
         testkey: "testvalue"
        },
        stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    },
}
  

