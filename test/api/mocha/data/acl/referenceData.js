// This data represents components of the primary test Collections, Assets, etc. contained in the standard appData.json file without regard to access controls being exercised by the tests.  These Ids, etc. should be used to construct test case API requests. This data should only be used as expectations in cases where all test scenarios exercised are expected to return the same data. 

// The standard "testCollection" includes users named after the roles they have for that specific Collection, is used in most "GET" tests or tests not expected to change data that could alter expectations for subsequent tests. "scrapCollection" is used for tests that alter Collection data in some way.

const reference = {
  collectionId: "21",
  collectionName: "Test Collection",
  collectionDescription: "This is a test collection",
  collectionOwner: "admin",
  collectionOwnerID: "87",
  benchmark: "VPN_SRG_TEST",
  pinRevision: "V1R0",
  checklistLength: 81,
  revisionStr: "V1R1",
  grantCheckUserId: "85",
  testCollection: {
    name: "Collection X",
    collectionId: "21",
    benchmark: "VPN_SRG_TEST",
    defaultRevision: "V1R1",    
    pinRevision: "V1R0",    
    collectionMetadataKey: "pocName",
    collectionMetadataValue: "poc2Patched",
    owners: ["87", "1", "45"],
    assetIds: ["29", "62", "42", "154"],
    assetsWithHistory: ["42", "154"],
    testAssetId: "42",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    labelCount: 2,
    lvl1LabelName: "test-label-lvl1",
    lvl1Label: "5130dc84-9a68-11ec-b1bc-0242ac110002",
    fullLabel: "755b8a28-9a68-11ec-b1bc-0242ac110002",
    fullLabelName: "test-label-full",
    testGroup: {
      userGroupId: 1,
      grantId: 32,
      users: ["lvl1"]
    },
    labels: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002"
    ],
    labelsMap: {
      "test-label-full": "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "test-label-lvl1": "5130dc84-9a68-11ec-b1bc-0242ac110002"
    },
    allMetadata: [
      {
        key: "pocEmail",
        value: "pocEmail@email.com"
      },
      {
        key: "pocName",
        value: "poc2Patched"
      },
      {
        key: "pocPhone",
        value: "12342"
      },
      {
        key: "reqRar",
        value: "true"
      }
    ],
    reviewHistory: {
      assetId: "42",
      startDate: "1900-10-01",
      endDate: "2020-10-01",
      deletedEntriesByDate: 6,
      deletedEntriesByDateAsset: 4,
      ruleId: "SV-106179r1_rule",
      status: "submitted"
    },
    rulesWithHistoryCnt: 2,
    reviewHistoryRuleCnt: 2,
    reviewHistoryTotalCnt: 7,
    reviewHistory_endDateCnt: 6,
    reviewHistory_startAndEndDateCnt: 2,
    reviewHistory_startDateCnt: 2,
    reviewHistory_byStatusCnt: 3,
    reviewHistory_testAssetCnt: 5,
    reviewHistory_ruleIdCnt: 4,
    assetsProjected: [
      {
        name: "ACHERNAR_Collection_X_asset",
        assetId: "403",
      },
      {
        name: "Collection_X_asset",
        assetId: "405",
      },
      {
        name: "Collection_X_lvl1_asset-1",
        assetId: "404",
      },
      {
        name: "Collection_X_lvl1_asset-2",
        assetId: "406",
      },
    ],
    grantsProjected: [
      {
        user: {
          userId: "86",
          username: "bizarroLvl1",
          displayName: "bizarroLvl1"
          },
        roleId: 1
      },
      {
        user: {
          userId: "85",
          username: "lvl1",
          displayName: "lvl1"
        },
        roleId: 1
      },
      {
        user: {
          userId: "21",
          username: "lvl2",
          displayName: "lvl2"
        },
        roleId: 2
      },
      {
        user: {
          userId: "44",
          username: "lvl3",
          displayName: "lvl3"
        },
        roleId: 3
      },
      {
        user: {
          userId: "87",
          username: "admin",
          displayName: "Admin Burke"
        },
        roleId: 4
      },
      {
        user: {
          userId: "1",
          username: "stigmanadmin",
          displayName: "STIGMAN Admin"
        },
        roleId: 4
      },
      {
        user: {
          userId: "45",
          username: "lvl4",
          displayName: "lvl4"
        },
        roleId: 4
      }
    ],
    ownersProjected: [
      {
        email: "admin@admin.com",
        userId: "87",
        username: "admin",
        displayName: "Admin Burke"
      },
      {
        email: null,
        userId: "1",
        username: "stigmanadmin",
        displayName: "STIGMAN Admin"
      },
      {
        email: null,
        userId: "45",
        username: "lvl4",
        displayName: null
      }
    ],
    stigsProjected: [
      {
        ruleCount: 81,
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R0",
        benchmarkDate: "2010-07-19",
        revisionPinned: true
      },
      {
        ruleCount: 287,
        benchmarkId: "Windows_10_STIG_TEST",
        revisionStr: "V1R23",
        benchmarkDate: "2020-06-17",
        revisionPinned: false
      }
    ],
    statisticsProjected: {
      assetCount: 4,
      grantCount: 7,
      checklistCount: 6
    },
    labelsProjected: [
      {
        name: "test-label-full",
        description: "",
        color: "FF99CC",
        uses: 2
      },
      {
        name: "test-label-lvl1",
        description: "",
        color: "99CCFF",
        uses: 1
      }
    ]
  },
  deleteCollection: {
    collectionId_adminOnly: "84",
    collectionId: "85"
  },
  scrapCollection: {
    collectionId: "1",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST", "RHEL_7_STIG_TEST"],
    scrapLabel: "df4e6836-a003-11ec-b1bc-0242ac110002",
    collectionMetadataKey: "pocName",
    collectionMetadataValue: "poc2Patched"
  },
  scrapLvl1User: {
    userId: "86",
    username: "bizarroLvl1"
  },
  scrapAsset: {
    assetId: "34",
    scrapBenchmark: "RHEL_7_STIG_TEST",
    metadataKey: "testkey",
    metadataValue: "testvalue"
  },
  testAsset: {
    name: "Collection_X_lvl1_asset-1",
    assetId: "42",
    collectionId: "21",
    usersWithGrant: ["86,85"],
    benchmark: "VPN_SRG_TEST",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    metadataKey: "testkey",
    metadataValue: "testvalue",
    labels: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002"
    ]
  },
  testRuleIdVPN: "SV-106179r1_rule",
  testRuleIdWin: "SV-77809r3_rule",
};

export default reference