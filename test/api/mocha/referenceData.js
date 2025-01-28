// This data represents components of the primary test Collections, Assets, etc. contained in the standard appdata.jsonl file without regard to access controls being exercised by the tests.  These Ids, etc. should be used to construct test case API requests. This data should only be used as expectations in cases where all test scenarios exercised are expected to return the same data. 

// The standard "testCollection" includes users named after the roles they have for that specific Collection, is used in most "GET" tests or tests not expected to change data that could alter expectations for subsequent tests. "scrapCollection" is used for tests that alter Collection data in some way.

const reference = {
  // collectionId: "21",
  // collectionName: "Test Collection",
  // collectionDescription: "This is a test collection",
  // collectionOwner: "admin",
  //
  // benchmark: "VPN_SRG_TEST",
  // checklistLength: 81,
  // revisionStr: "V1R1",
  // grantCheckUserId: "85",
  // lvl1ValidStigs: ["VPN_SRG_TEST"],
  // testAssetLvl1NoAccess: "62",

  // in appdata.jsonl
  deletedCollection: {
    collectionId: "93",
  },
  // in appdata.jsonl
  deletedAsset: {
    assetId: "247",
  },

  testCollection: {
    name: "Collection X",
    collectionId: "21",
    benchmark: "VPN_SRG_TEST",
    defaultRevision: "V1R1",
    pinRevision: "V1R0",
    collectionMetadataKey: "pocName",
    collectionMetadataValue: "poc2Patched",
    collectionOwnerID: "87",
    owners: ["87", "1", "45"],
    grantCheckUserId: "85",
    assetIds: ["29", "62", "42", "154"],
    assetsWithHistory: ["42", "154"],
    testAssetId: "42",
    ruleId: "SV-106179r1_rule",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    labelCount: 2,
    lvl1LabelName: "test-label-lvl1",
    lvl1Label: "5130dc84-9a68-11ec-b1bc-0242ac110002",
    lvl1LabelAssetIds: ["42"],
    lvl1ReadOnlyAssetId: "62",
    lvl1ReadOnlyAssetIds: ["62", "154"],
    fullLabelName: "test-label-full",
    fullLabel: "755b8a28-9a68-11ec-b1bc-0242ac110002",
    testGroup: {
      userGroupId: "1",
      name: "TestGroup",
      description: "TestGroup",
      users: ["lvl1"],
      roleId: 1,
      testCollectionGrantId: "32",
      defaultAccess: "none",
      acl: [
        {
          label: {
            name: "test-label-lvl1",
            color: "99CCFF",
            labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
          },
          access: "rw",
          benchmarkId: "VPN_SRG_TEST",
        },
        {
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          access: "r",
        },
        {
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          access: "r",
          benchmarkId: "VPN_SRG_TEST",
        },
      ]
    },
    labels: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002",
    ],
    labelsMap: {
      "test-label-full": "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "test-label-lvl1": "5130dc84-9a68-11ec-b1bc-0242ac110002",
    },

    allMetadata: [
      {
        key: "pocEmail",
        value: "pocEmail@email.com",
      },
      {
        key: "pocName",
        value: "poc2Patched",
      },
      {
        key: "pocPhone",
        value: "12342",
      },
      {
        key: "reqRar",
        value: "true",
      },
    ],
    reviewHistory: {
      assetId: "42",
      startDate: "1900-10-01",
      endDate: "2020-10-01",
      deletedEntriesByDate: 6,
      deletedEntriesByDateAsset: 4,
      ruleId: "SV-106179r1_rule",
      status: "submitted",
      rulesWithHistoryCnt: 2,
      reviewHistoryRuleCnt: 2,
      reviewHistoryTotalEntryCnt: 7,
      reviewHistory_endDateCnt: 6,
      reviewHistory_startAndEndDateCnt: 6,
      reviewHistory_startDateCnt: 2,
      reviewHistory_byStatusCnt: 3,
      reviewHistory_testAssetCnt: 5,
      reviewHistory_entriesByRuleIdCnt: 4,
    },
    assetsProjected: [
      {
        name: "ACHERNAR_Collection_X_asset",
        assetId: "29",
      },
      {
        name: "Collection_X_asset",
        assetId: "62",
      },
      {
        name: "Collection_X_lvl1_asset-1",
        assetId: "42",
      },
      {
        name: "Collection_X_lvl1_asset-2",
        assetId: "154",
      },
    ],
    grantsProjected: [
      {
        user: {
          userId: "86",
          username: "bizarroLvl1",
          displayName: "bizarroLvl1",
        },
        grantId: "1",
        roleId: 1,
      },
      {
        user: {
          userId: "21",
          username: "lvl2",
          displayName: "lvl2",
        },
        grantId: "3",
        roleId: 2,
      },
      {
        user: {
          userId: "44",
          username: "lvl3",
          displayName: "lvl3",
        },
        grantId: "4",
        roleId: 3,
      },
      {
        user: {
          userId: "87",
          username: "admin",
          displayName: "Admin Burke",
        },
        grantId: "5",
        roleId: 4,
      },
      {
        user: {
          userId: "1",
          username: "stigmanadmin",
          displayName: "STIGMAN Admin",
        },
        grantId: "6",
        roleId: 4,
      },
      {
        user: {
          userId: "45",
          username: "lvl4",
          displayName: "lvl4",
        },
        grantId: "7",
        roleId: 4,
      },
      {
        userGroup: {
          name: "TestGroup",
          description: "TestGroup",
          userGroupId: "1",
        },
        grantId: "32",
        roleId: 1,
      },
    ],
    ownersProjected: [
      {
        // email: null,
        userId: "87",
        username: "admin",
        displayName: "Admin Burke",
      },
      {
        // email: null,
        userId: "1",
        username: "stigmanadmin",
        displayName: "STIGMAN Admin",
      },
      {
        // email: null,
        userId: "45",
        username: "lvl4",
        displayName: null,
      },
    ],
    stigsProjected: [
      {
        ruleCount: 81,
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R0",
        benchmarkDate: "2010-07-19",
        revisionPinned: true,
      },
      {
        ruleCount: 287,
        benchmarkId: "Windows_10_STIG_TEST",
        revisionStr: "V1R23",
        benchmarkDate: "2020-06-17",
        revisionPinned: false,
      },
    ],
    statisticsProjected: {
      assetCount: 4,
      grantCount: 7,
      checklistCount: 6,
    },
    appinfo: {
      state: "enabled",
      assets: 4,
      assetsDisabled: 0,
      reviews: 17,
      reviewsDisabled: 0,
    },
    labelsProjected: [
      {
        name: "test-label-full",
        description: "",
        color: "FF99CC",
        uses: 2,
      },
      {
        name: "test-label-lvl1",
        description: "",
        color: "99CCFF",
        uses: 1,
      },
    ],
    usersProjected: [
      {
        user: {
          userId: "86",
          username: "bizarroLvl1",
          displayName: "bizarroLvl1",
        },
        grantees: [
          {
            userId: "86",
            username: "bizarroLvl1",
          },
        ],
        roleId: 1,
      },
      {
        user: {
          userId: "21",
          username: "lvl2",
          displayName: "lvl2",
        },
        grantees: [
          {
            userId: "21",
            username: "lvl2",
          },
        ],
        roleId: 2,
      },
      {
        user: {
          userId: "44",
          username: "lvl3",
          displayName: "lvl3",
        },
        grantees: [
          {
            userId: "44",
            username: "lvl3",
          },
        ],
        roleId: 3,
      },
      {
        user: {
          userId: "87",
          username: "admin",
          displayName: "Admin Burke",
        },
        grantees: [
          {
            userId: "87",
            username: "admin",
          },
        ],
        roleId: 4,
      },
      {
        user: {
          userId: "1",
          username: "stigmanadmin",
        },
        grantees: [
          {
            userId: "1",
            username: "stigmanadmin",
          },
        ],
        roleId: 4,
      },
      {
        user: {
          userId: "45",
          username: "lvl4",
          displayName: "lvl4",
        },
        grantees: [
          {
            userId: "45",
            username: "lvl4",
          },
        ],
        roleId: 4,
      },
      {
        user: {
          userId: "85",
          username: "lvl1",
          displayName: "lvl1",
        },
        grantees: [
          {
            name: "TestGroup",
            userGroupId: "1",
          },
        ],
        roleId: 1,
      },
    ]
  },
  deleteCollection: {
    collectionId_adminOnly: "84",
    collectionId: "85",
  },
  scrapCollection: {
    collectionId: "1",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST", "RHEL_7_STIG_TEST"],
    scrapLabel: "df4e6836-a003-11ec-b1bc-0242ac110002",
    collectionMetadataKey: "pocName",
    collectionMetadataValue: "poc2Patched",
  },

  // Reference Asset data

  testAssetLvl1NoAccess: "29",
  testAsset: {
    name: "Collection_X_lvl1_asset-1",
    assetId: "42",
    collectionId: "21",
    usersWithGrant: ["86", "85"],
    // benchmark: "VPN_SRG_TEST",
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    reviewCnt: 9,
    VPN_SRG_TEST_reviewCnt: 6,
    metadataKey: "testkey",
    metadataValue: "testvalue",
    ipaddress: "1.1.1.1",
    labels: [
      "755b8a28-9a68-11ec-b1bc-0242ac110002",
      "5130dc84-9a68-11ec-b1bc-0242ac110002",
    ],
    stats: {
      ruleCount: 368,
      stigCount: 2,
      savedCount: 2,
      acceptedCount: 0,
      rejectedCount: 0,
      submittedCount: 7,
    },
    testRuleId: "SV-106179r1_rule",
    freshRuleId: "SV-106195r1_rule",
    testRuleIdHistoryCount: 2,
    testRuleIdStig: "VPN_SRG_TEST",
    testRuleIdStigCount: 1,
    testBenchmarkReviews: 6,
    reviewRuleIds: [
      "SV-106179r1_rule",
      "SV-106181r1_rule",
      "SV-106183r1_rule",
      "SV-106185r1_rule",
      "SV-106187r1_rule",
      "SV-106189r1_rule",
      "SV-77813r6_rule",
      "SV-77811r1_rule",
      "SV-77809r3_rule",
    ],
  },
  scrapAsset: {
    assetId: "34",
    scrapBenchmark: "RHEL_7_STIG_TEST",
    metadataKey: "testkey",
    metadataValue: "testvalue",
    ruleCount: 612,
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST", "RHEL_7_STIG_TEST"],
    name: "test asset stigmanadmin",
  },
  testAssetNoStigs: {
    name: "ACHERNAR_Collection_X_asset",
    assetId: "29",
    collectionId: "21",
    labels: [],
    stigs: [],
    stats: {
      ruleCount: null,
      stigCount: 0,
      savedCount: null,
      acceptedCount: null,
      rejectedCount: null,
      submittedCount: null,
    },
  },
  testAssetNoMetadata: {
    collectionId: "21",
    assetId: "154",
  },

  //Reference User data
  allUserIds: ["87", "86", "82", "85", "21", "44", "45", "1", "22", "43"],
  lvl1User: {
    username: "lvl1",
    userId: "85",
    testCollectionGrantId: "34"
  },
  stigmanadmin: {
    username: "stigmanadmin",
    userId: "1",
  },
  wfTest: {
    username: "wf-test",
    userId: "22",
  },
  deleteUser: {
    username: "workforce-60",
    userId: "43",
  },
  adminBurke: {
    username: "admin",
    userId: "87",
    testCollectionGrantId: "5",
    testCollectionrole: 4,
  },
  scrapLvl1User: {
    userId: "86",
    username: "bizarroLvl1",
    testCollectionGrantId
    : "1",
  },

  //review data
  ruleId: "SV-106179r1_rule",
  ruleIdPinnedRev: "SV-106179r123456789_rule",
  reviewKeyChangeFile: "U_VPN_SRG_V2R3_Manual-xccdf-reviewKeyChange.xml",
  ruleIdLvl1NoAccess: "SV-77809r3_rule",
  writeStigPropsByCollectionStig: ["62", "42", "154"],
  reviewMatchString: "test",
  freshRuleId: "SV-106195r1_rule",
  testGroupId: "V-97041",
  reviewMetadataKey: "testkey",
  reviewMetadataValue: "testvalue",
  scrapRuleIdWindows10: "SV-77809r3_rule",

  //Reference Stig and Rule data
  benchmark: "VPN_SRG_TEST",
  revisionStr: "V1R1",
  checklistLength: 81,
  testBenchmarkAllRevisions: ["V1R1", "V1R0"],
  lvl1ValidStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
  scrapBenchmark: "RHEL_7_STIG_TEST",
  testStigfile: "U_VPN_SRG_V1R1_Manual-xccdf.xml",
  windowsBenchmark: "Windows_10_STIG_TEST",
  testStigfileNonLatest: "U_VPN_SRG_V1R0_Manual-xccdf.xml",
  rulesMatchingFingerprints:
    "U_VPN_SRG-OTHER_V1R1_twoRules-matchingFingerprints.xml",
  testRule: {
    ruleId: "SV-106179r1_rule",
    groupId: "V-97041",
    version: "SRG-NET-000019-VPN-000040",
  },
  testRuleNoMetadata: {
    ruleId: "SV-106191r1_rule",
  },

  vpnStigs: [
    "VPN_SRG_TEST",
    "VPN_SRG_OTHER",
    "VPN_SRG_Rule-fingerprint-match-test",
  ],
  allStigsForAdmin: [
    "A10_Networks_ADC_ALG_STIG",
    "AAA_Service_SRG",
    "Adobe_Acrobat_Pro_DC_Continuous_STIG",
    "RHEL_7_STIG_TEST",
    "VPN_SRG_OTHER",
    "VPN_SRG_Rule-fingerprint-match-test",
    "VPN_SRG_TEST",
    "Windows_10_STIG_TEST",
  ],
  testCci: {
    id: "000015",
    status: "draft",
  },
  stigmanadmin: {
    username: 'stigmanadmin',
    userId: '1'
  },
  // reviewMetadataKey: 'testkey',
  // reviewMetadataValue: 'testvalue',
}

export default reference
