import reference from '../../referenceData.js'
export const iterations = [
  {
    name: 'label_rw',
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
    response: [
     {
       access: "rw",
       asset: {
         name: reference.testAsset.name,
         assetId: reference.testAsset.assetId,
       },
       benchmarkId: reference.benchmark,
       aclSources: [
         {
           aclRule: {
             label: {
               name: reference.testCollection.fullLabelName,
               labelId: reference.testCollection.fullLabel,
             },
             access: "rw",
           },
            grantee: {
            userGroupId: "1",
            name: "TestGroup",
            roleId: 1,
          },
         },
       ],
     },
     {
       access: "rw",
       asset: {
         name: reference.testAsset.name,
         assetId: reference.testAsset.assetId,
       },
       benchmarkId: reference.windowsBenchmark,
       aclSources: [
         {
           aclRule: {
             label: {
               name: reference.testCollection.fullLabelName,
               labelId: reference.testCollection.fullLabel,
             },
             access: "rw",
           },
            grantee: {
            userGroupId: "1",
            name: "TestGroup",
            roleId: 1,
          },
         },
       ],
     },
     {
       access: "rw",
       asset: {
         name: "Collection_X_asset",
         assetId: "62",
       },
       benchmarkId: reference.testCollection.benchmark,
       aclSources: [
         {
           aclRule: {
             label: {
               name: reference.testCollection.fullLabelName,
               labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
             },
             access: "rw",
           },
            grantee: {
            userGroupId: "1",
            name: "TestGroup",
            roleId: 1,
          },
         },
       ],
     },
     {
       access: "rw",
       asset: {
         name: "Collection_X_asset",
         assetId: "62",
       },
       benchmarkId: reference.windowsBenchmark,
       aclSources: [
         {
           aclRule: {
             label: {
               name: reference.testCollection.fullLabelName,
               labelId: reference.testCollection.fullLabel,
             },
             access: "rw",
           },
            grantee: {
            userGroupId: "1",
            name: "TestGroup",
            roleId: 1,
          },
         },
       ],
     },
    ]
  },
  {
    name: 'label_r',
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  name: "TestGroup",
                  userGroupId: "1",
                  roleId: 1,
                },
              },
            ],
          },
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
              },
            ],
          },
          {
            access: "r",
            asset: {
              name: "Collection_X_asset",
              assetId: "62",
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                  },
                  access: "r",
                },
                grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
              },
            ],
          },
          {
            access: "r",
            asset: {
              name: "Collection_X_asset",
              assetId: "62",
            },
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
              },
            ],
          },
        ]
  },
  {
    name: 'label_none',
    put:[{"labelId":reference.testCollection.fullLabel,"access":"none"}],
    response: []
  },
  {
    name: 'benchmark_rw',
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'benchmark_r',
    put:[{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]

  },
  {
    name: 'benchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"}],
    response: []


  },
  {
    name: 'asset_rw',

    put: [{"assetId":reference.testAsset.assetId,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'asset_r',
    put: [{"assetId":reference.testAsset.assetId,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'asset_none',
    put: [{"assetId":reference.testAsset.assetId,"access":"none"}],
    response: []
  },
  {
    name: 'assetBenchmark_rw',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
            },
          },
        ],
      }
    ]

  },
  {
    name: 'assetBenchmark_r',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "r",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  name: "TestGroup",
                  userGroupId: "1",
                  roleId: 1,
                },
              },
            ],
          }
        ]

  },
  {
    name: 'assetBenchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}],
    response: []
  },
  {
    name: 'labelBenchmark_rw',
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"}],
        response: [
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "rw",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  name: "TestGroup",
                  userGroupId: "1",
                  roleId: 1,
                },
              },
            ],
          },
          {
            access: "rw",
            asset: {
              name: "Collection_X_asset",
              assetId: "62",
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "rw",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  name: "TestGroup",
                  userGroupId: "1",
                  roleId: 1,
                },
              },
            ],
          }
        ]
  },
  {
    name: 'labelBenchmark_r',
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset", 
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'labelBenchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"}],
    response: []
  },
  {
    name: 'asset_rw_asset_rw',
    put:[{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"rw"}],
    response: [
    {
      access: "rw",
      asset: {
        name: reference.testAsset.name,
        assetId: reference.testAsset.assetId,
      },
      benchmarkId: reference.testCollection.benchmark,
      aclSources: [
        {
          aclRule: {
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            access: "rw",
          },
          grantee: {
            name: "TestGroup",
            userGroupId: "1",
            roleId: 1,
          },
        },
      ],
    },
    {
      access: "rw",
      asset: {
        name: reference.testAsset.name,
        assetId: reference.testAsset.assetId,
      },
      benchmarkId: reference.windowsBenchmark,
      aclSources: [
        {
          aclRule: {
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            access: "rw",
          },
          grantee: {
            name: "TestGroup",
            userGroupId: "1",
            roleId: 1,
          },
        },
      ],
    },
    {
      access: "rw",
      asset: {
        name: "Collection_X_lvl1_asset-2",
        assetId: "154",
      },
      benchmarkId: reference.windowsBenchmark,
      aclSources: [
        {
          aclRule: {
            asset: {
              name: "Collection_X_lvl1_asset-2",
              assetId: "154",
            },
            access: "rw",
          },
          grantee: {
            name: "TestGroup",
            userGroupId: "1",
            roleId: 1,
          },
        },
      ],
    },
    {
      access: "rw",
      asset: {
        name: "Collection_X_lvl1_asset-2",
        assetId: "154",
      },
      benchmarkId: reference.testCollection.benchmark,
      aclSources: [
        {
          aclRule: {
            asset: {
              name: "Collection_X_lvl1_asset-2",
              assetId: "154",
            },
            access: "rw",
          },
          grantee: {
            name: "TestGroup",
            userGroupId: "1",
            roleId: 1,
          },
        },
      ],
    }
    ]
  },
  {
    name: 'asset_rw_asset_r',
    put: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'asset_rw_asset_none',
    put: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"none"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: 'asset_r_asset_r',
    put: [{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"154","access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: 'assetBenchmark_rw_label_rw',
    put:[{"benchmarkId":reference.windowsBenchmark,"assetId":"62","access":"rw"},{"labelId":reference.testCollection.lvl1Label,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62"
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62"
              },
              access: "rw",
              benchmarkId: reference.windowsBenchmark
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: 'assetBenchmark_rw_label_r',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ]
      }
    ]
  },
  {
    name: "assetBenchark_r_label_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ]
      }
    ]
  },
  {
    name: "assetBenchmark_none_label_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        "access": "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "assetBenchmark_none_label_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        "access": "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "assetBenchmark_rw_benchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  { 
    name: "assetBenchmark_rw_benchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  { 
    name: "assetBenchmark_r_benchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"r"},{"benchmarkId":reference.benchmark,"access":"rw"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },

      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  { 
    name: "assetBenchmark_r_benchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  { 
    name: "assetBenchmark_none_benchmark_r",
    put: [{"benchmarkId":reference.windowsBenchmark, "assetId":"42","access":"none"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "assetBenchmark_rw_assetBenchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "assetBenchmark_rw_assetBenchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "assetBenchmark_r_assetBenchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.testCollection.benchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: reference.testAsset.name,
                assetId: reference.testAsset.assetId,
              },
              benchmarkId: reference.windowsBenchmark,
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "label_rw_benchmark_rw",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_benchmark_r",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_benchmark_none",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"none"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_none_benchmark_r",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_r_benchmark_r",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_asset_rw",
    // 154 is not in the label we are adding it on
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"154","access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "rw",
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
    
      },
    ]
  },
  {
    name: "label_rw_asset_r",
    // 62 is in label should be made to r
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"62","access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_asset_none",
    // 62 is in label should gone now
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"62","access":"none"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_r_asset_rw",
    // 62 is in label should be made to rw all else is r
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"62","access":"rw"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",

            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_r_asset_none",
    // removes 62
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"62","access":"none"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_r_asset_r",
    // all read
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_label_rw",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          }
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources:  [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          }
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
     ]
  },
  {
    name: "label_rw_label_r",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          }
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources:  [
          {
            aclRule: {
              label: {
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          }
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
     ]
  },
  {
    name: "label_rw_label_none",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"none"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              label: {
                name: reference.testCollection.fullLabelName,
                labelId: reference.testCollection.fullLabel,
              },
              access: "rw",
            },
            grantee: {
              userGroupId: "1",
              name: "TestGroup",
              roleId: 1,
            },
          },
        ],
      },
     ]
  },
  {
    name: "label_none_label_r",
    // no asssets cuz all in label full
    put: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"}],
    response: [
    ]
  },
  {
    name: "benchmark_rw_asset_r",
    // test asset is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}],
      response: [
        {
          access: "r",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "rw",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "rw",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        }
    ]
  },
  {
    name: "benchmark_rw_asset_none",
    // test asset is removes
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      response: [
        {
          access: "rw",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "rw",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "rw",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        }
    ]
  },
  {
    name: "benchmark_r_asset_rw",
    // test asset is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
      response: [
        {
          access: "r",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "rw",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        }
    ]
  },
  {
    name: "benchmark_r_asset_r",
    // test asset is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"}],
      response: [
        {
          access: "r",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            }
          ],
        },
        {
          access: "r",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-1",
                  assetId: "42",
                },
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        },
        {
          access: "r",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                benchmarkId: reference.testCollection.benchmark,
                access: "r",
              },
               grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
            },
          ],
        }
    ]
  },
  {
    name: "benchmark_none_asset_r",
    // test asset is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"r"}],
      response: [
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "benchmark_rw_benchmark_rw",
     // asset stig for both 
    put:  [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "benchmark_rw_benchmark_r",
     // asset stig for both 
    put:  [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.windowsBenchmark,
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "benchmark_rw_benchmark_none",
     // asset stig for both 
    put:  [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
    response: [
      {
        access: "rw",
        asset: {
          name: reference.testAsset.name,
          assetId: reference.testAsset.assetId,
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
              benchmarkId: reference.testCollection.benchmark,
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_label_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}], // doesnt do anything, tie at asset 42 but same access
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_label_r",
  // collsion at asset 42 rw wins becauselabel+ bnechmark is more accurate
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], 
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_r_label_rw",
    //label bechmark wins at asset 42 VPN for rw 
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], 
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_r_label_r",
   // does nothing all r
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], 
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_r_label_none",
   // tie at asset 42 and labelBNenchmark wins so we wiill only return that 
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"none"}], 
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "labelBenchmark_none_label_rw",
   // labelBencahark none wins so we will remove intersection of assets which is asset 42 with VPN
    put:[{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_benchmark_rw",
    // adds benchmark + labelBenchmark the bnechmarks added will be asset 62 and 42 cuz they have VPN test stig 
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_benchmark_r",
    // collsion on the asset not in the label, resolve to read 
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response:
    [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_benchmark_none",
    // gives just the two assets in the labels as rw like the bnechmark doenst apply
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"none"}],
    response:
    [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "labelBenchmark_r_benchmark_r",
    // gives just the two assets in the labels as rw like the bnechmark doenst apply
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response:
    [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_none_benchmark_r",
    // gives just the two assets in the labels as rw like the bnechmark doenst apply
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response:
    [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_none_asset_none",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"none"}],
    response: []
  },
  {
    name: "labelBenchmark_rw_asset_rw",
    // adds asset to labelBenchamark 154 is not in label 
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"154","access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_asset_r",
    // changes just the asset windows to r test asset vpn stgarts rw cuz labelBenchmark beats just asset
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_asset_none",
    // all rw for Vpn because the label benchmark wins!
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_r_asset_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_none_asset_rw",
    // none wins besides windows stig
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      }
    ]
  },
  {
    name: "labelBenchmark_rw_assetBenchmark_rw",
    // adds asset benchmark its not in the label
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":"154","access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_assetBenchmark_r",
    // adds asset benchmark its not in the label
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}], // changes asset to r,
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_assetBenchmark_none",
    // adds asset benchmark its not in the label
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}], // remvoe asset
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_r_assetBenchmark_rw",
    // asset 62 is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}], // changes asset to r,
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_none_assetBenchmark_r",
    // asset 62 is r
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}], // changes asset to r,
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_labelBenchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "labelBenchmark_rw_labelBenchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {

      name: "labelBenchmark_r_labelBenchmark_r",
      put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
      response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
              benchmarkId: "Windows_10_STIG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]

  },
  {

    name: "labelBenchmark_r_labelBenchmark_none",
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"none"}],
    response: [
    {
      access: "r",
      asset: {
        name: "Collection_X_lvl1_asset-1",
        assetId: "42",
      },
      benchmarkId: "VPN_SRG_TEST",
      aclSources: [
        {
          aclRule: {
            label: {
              name: "test-label-lvl1",
              labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
            },
            access: "r",
            benchmarkId: "VPN_SRG_TEST",
          },
          grantee: {
            name: "TestGroup",
            userGroupId: "1",
            roleId: 1,
          },
        },
      ],
    },
  ]

  },
  {
    name: "label_rw_benchmark_r_asset_none",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"none"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "assetBenchmark_none_label_rw_benchmark_r",
    put: [{"assetId":reference.testAsset.assetId, benchmarkId: reference.testCollection.benchmark,"access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
    response:[
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "assetBenchmark_r_benchmark_none_asset_rw",
    put: [{"assetId":reference.testAsset.assetId, benchmarkId: reference.testCollection.benchmark,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"none"},{"assetId":"154","access":"rw"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_rw_asset_r_asset_r",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"62","access":"r"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "label_r_benchmark_rw_benchmark_none",
    put: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
    response: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-full",
                labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
              },
              access: "r",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
  {
    name: "assetBenchmark_rw_asset_rw_asset_rw",
    put: [{"assetId":reference.testAsset.assetId, benchmarkId: reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"rw"}],
    response: [
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-1",
                assetId: "42",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "rw",
            },
             grantee: {
                  userGroupId: "1",
                  name: "TestGroup",
                  roleId: 1,
                },
          },
        ],
      },
    ]
  },
]
