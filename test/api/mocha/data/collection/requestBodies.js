//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.

import reference from '../../referenceData.js'

export const requestBodies = {
  updateCollection: {
    metadata: {
      pocName: 'poc2Patched',
      pocEmail: 'pocEmail@email.com',
      pocPhone: '12342',
      reqRar: 'true'
    },
    grants: [
      {
        userId: '1',
        roleId: 4
      },
      {
        userId: '21',
        roleId: 1
      },
      {
        userId: '44',
        roleId: 3
      },
      {
        userId: '45',
        roleId: 4
      },
      {
        userGroupId: '1',
        roleId: 1
      },
      {
        userId: '87',
        roleId: 4
      }
    ]
  },
  patchCollectionLabelById: {
    name: 'test-label-full',
    description: 'test label patched',
    color: 'aa34cc'
  },
  replaceCollection: {
    name: 'SetAllProperties',
    description: 'test',
    settings: {
      fields: {
        detail: {
          enabled: 'always',
          required: 'findings'
        },
        comment: {
          enabled: 'always',
          required: 'findings'
        }
      },
      status: {
        canAccept: true,
        minAcceptGrant: 2,
        resetCriteria: 'result'
      }
    },
    metadata: {
      pocName: 'poc2Patched',
      pocEmail: 'pocEmail@email.com',
      pocPhone: '12342',
      reqRar: 'true'
    },
    labels: [
      {
        name: 'TEST',
        description: 'Collection label description',
        color: 'ffffff'
      }
    ],
    grants: [
      {
        userId: '1',
        roleId: 4
      },
      {
        userId: '21',
        roleId: 2
      },
      {
        userId: '44',
        roleId: 3
      },
      {
        userId: '45',
        roleId: 4
      },
      {
        userId: '87',
        roleId: 4
      },
      {
        userGroupId: '1',
        roleId: 1
      }
    ]
  },
  createCollection: {
    name: 'TEST',
    description: 'Collection TEST description',
    settings: {
      fields: {
        detail: {
          enabled: 'always',
          required: 'findings'
        },
        comment: {
          enabled: 'always',
          required: 'findings'
        }
      },
      status: {
        canAccept: true,
        minAcceptGrant: 2,
        resetCriteria: 'result'
      },
      history: {
        maxReviews: 11
      }
    },
    metadata: {
      pocName: 'poc2Put',
      pocEmail: 'pocEmailPut@email.com',
      pocPhone: '12342',
      reqRar: 'true'
    },
    grants: [
      {
        userId: '1',
        roleId: 4
      }
    ],
    labels: [
      {
        name: 'TEST',
        description: 'Collection label description',
        color: 'ffffff'
      }
    ]
  },
  createCollectionWithTestGroup: {
    name: 'TEST',
    description: 'Collection TEST description',
    settings: {
      fields: {
        detail: {
          enabled: 'always',
          required: 'findings'
        },
        comment: {
          enabled: 'always',
          required: 'findings'
        }
      },
      status: {
        canAccept: true,
        minAcceptGrant: 2,
        resetCriteria: 'result'
      },
      history: {
        maxReviews: 11
      }
    },
    metadata: {
      pocName: 'poc2Put',
      pocEmail: 'pocEmailPut@email.com',
      pocPhone: '12342',
      reqRar: 'true'
    },
    grants: [
      {
        userGroupId: '1',
        roleId: 2
      }
    ],
    labels: [
      {
        name: 'TEST',
        description: 'Collection label description',
        color: 'ffffff'
      }
    ]
  },
  writeStigPropsByCollectionStig: {
    defaultRevisionStr: 'V1R1',
    assetIds: ['62', '42', '154']
  },
  resetTestCollection: {
    name: 'Collection X',
    description: null,
    settings: {
      fields: {
        detail: {
          enabled: 'always',
          required: 'always'
        },
        comment: {
          enabled: 'always',
          required: 'findings'
        }
      },
      status: {
        canAccept: true,
        minAcceptGrant: 3,
        resetCriteria: 'result'
      },
      history: {
        maxReviews: 5
      }
    },
    metadata: {
      pocName: 'true',
      pocEmail: 'pocEmailPut@email.com',
      pocPhone: '12342',
      reqRar: 'true'
    },
    grants: [
      {
        userId: '1',
        roleId: 4
      },
      {
        userId: '45',
        roleId: 4
      },
      {
        userId: '87',
        roleId: 4
      },
      {
        userId: '44',
        roleId: 3
      },
      {
        userId: '21',
        roleId: 2
      },
      {
        userGroupId: '1',
        roleId: 1
      },
      {
        userId: '86',
        roleId: 1
      }
    ],
    labels: [
      {
        name: 'test-label-full',
        description: '',
        color: 'FF99CC'
      },
      {
        name: 'test-label-lvl1',
        description: '',
        color: '99CCFF'
      }
    ]
  },
  recreateCollectionLabel: {
    name: 'testLabel',
    description: 'test label',
    color: 'FF99CC'
  },
  postGrantsByCollection: [
    {
      userId: reference.lvl1User.userId,
      roleId: 2
    },
    {
      userGroupId: reference.testCollection.testGroup.userGroupId,
      roleId: 2
    }
  ],
  postOwners: [
    {
      userId: reference.wfTest.userId,
      roleId: 4
    }
  ],
  putGroupAcl: [
    {
      assetId: '62',
      access: 'rw'
    },
    {
      benchmarkId: 'VPN_SRG_TEST',
      access: 'rw'
    }
  ],
  postArchiveBenchmarkRevision: [
    {
      assetId: reference.testAsset.assetId,
      stigs: [
        {
          benchmarkId: reference.benchmark,
          revisionStr: reference.revisionStr
        },
      ]
    }
  ],
  postArchiveBenchmarkRevisionLvl1NoAccess: [
    {
      assetId: reference.testAssetLvl1NoAccess,
      stigs: [
        {
          benchmarkId: reference.benchmark,
          revisionStr: reference.revisionStr
        },
      ]
    }
  ],
  postArchiveBenchmark: [
    {
      assetId: reference.testAsset.assetId,
      stigs: [
      reference.benchmark,
      ]
    }
  ],
  postArchiveDefault: [
    {
      assetId: reference.testAsset.assetId,
    }
  ]
}
