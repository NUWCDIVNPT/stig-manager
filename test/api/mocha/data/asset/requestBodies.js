//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.

export const requestBodies = {
    tempAssetPost: {
        name: "TempAsset",
        collectionId: "21",
        description: "",
        ip: "",
        noncomputing: true,
        mac: null,
        labelIds: [
            "755b8a28-9a68-11ec-b1bc-0242ac110002",
            "5130dc84-9a68-11ec-b1bc-0242ac110002"
        ],
        metadata: {
         testkey: "testvalue"
        },
        stigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    },
}
  

