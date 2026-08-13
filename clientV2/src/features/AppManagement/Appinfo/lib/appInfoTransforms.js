export const CURRENT_APP_INFO_SCHEMA = 'stig-manager-appinfo-v1.1'

export function transformPreviousSchemas(input) {
  // JSON.parse can produce null or non-object primitives from a well-formed file
  if (input === null || typeof input !== 'object') {
    return false
  }
  if (input.schema === 'stig-manager-appinfo-v1.1') {
    return input
  }
  // Before v1.1 (rbac-2), only "restricted" grants were reported, so the counts that get transformed here will not be directly comparable to v1.1 counts.
  if (input.schema === 'stig-manager-appinfo-v1.0') {
    return transformPreviousSchemas(transformV1_0(input))
  }
  // first version of appInfo had "stigmanVersion" property instead of "version"
  if (input.stigmanVersion) {
    return transformPreviousSchemas(transformV0_0(input))
  }
  // if neither version nor stigmanVersion, not a supported file.
  else {
    return false
  }

  function transformV1_0(input) {
    // shifts aclCount.users to aclCount.grants, creates grantId from userId and adds grantee object
    function transformCountsByCollection(collections) {
      const o = {}
      for (const id in collections) {
        const { aclCounts, grantCounts, ...keep } = collections[id]

        const grants = {}
        for (const grantId in aclCounts.users) {
          grants[grantId] = {
            grantId,
            grantee: {
              userId: grantId,
              userGroupId: null,
            },
            ...aclCounts.users[grantId],
          }
        }

        o[id] = {
          grants,
          roleCounts: grantCounts,
          ...keep,
        }
      }
      return o
    }

    const v1_1 = {
      date: input.date,
      schema: 'stig-manager-appinfo-v1.1',
      version: input.version,
      collections: transformCountsByCollection(input.collections),
      requests: input.requests,
      users: input.users,
      groups: {},
      mysql: input.mysql,
      nodejs: input.nodejs,
    }

    return v1_1
  }

  function transformV0_0(input) {
    // renames properties "assetStigByCollection" and "restrictedGrantCountsByUser"
    function transformCountsByCollection(i) {
      const o = {}
      const padLength = Object.keys(i).at(-1)?.length
      for (const id in i) {
        const {
          assetStigByCollection,
          restrictedGrantCountsByUser,
          assetsTotal,
          assetsDisabled,
          ruleCnt,
          reviewCntTotal,
          reviewCntDisabled,
          labelCounts,
          ...keep
        } = i[id]

        // rename restrictedGrantCountsByUser properties to match aclCounts schema
        for (const userId in restrictedGrantCountsByUser) {
          restrictedGrantCountsByUser[userId].ruleCounts = {
            rw: restrictedGrantCountsByUser[userId].stigAssetCount,
            r: 0,
            none: 0,
          }
          delete restrictedGrantCountsByUser[userId].stigAssetCount
        }

        // rename grantCounts properties
        const grantCounts = {
          restricted: keep.grantCounts.accessLevel1,
          full: keep.grantCounts.accessLevel2,
          manage: keep.grantCounts.accessLevel3,
          owner: keep.grantCounts.accessLevel4,
        }
        delete keep.grantCounts

        // rename labelCounts properties
        labelCounts.collectionLabels = labelCounts.collectionLabelCount
        delete labelCounts.collectionLabelCount
        labelCounts.labeledAssets = labelCounts.labeledAssetCount
        delete labelCounts.labeledAssetCount
        labelCounts.assetLabels = labelCounts.assetLabelCount
        delete labelCounts.assetLabelCount

        o[id] = {
          name: id.padStart(padLength, '0'),
          assets: assetsTotal - assetsDisabled,
          assetsDisabled,
          rules: ruleCnt,
          reviews: reviewCntTotal - reviewCntDisabled,
          reviewsDisabled: reviewCntDisabled,
          ...keep,
          assetStigRanges: transformAssetStigByCollection(assetStigByCollection),
          aclCounts: {
            users: restrictedGrantCountsByUser || {},
          },
          grantCounts,
          labelCounts,
          settings: {
            fields: {
              detail: {
                enabled: null,
                required: null,
              },
              comment: {
                enabled: null,
                required: null,
              },
            },
            status: {
              canAccept: null,
              resetCriteria: null,
              minAcceptGrant: null,
            },
          },
        }
      }
      return o
    }

    // renames property "roles" and removes the string "other"
    function transformUserInfo(i) {
      const o = {}
      const padLength = Object.keys(i).at(-1)?.length
      for (const id in i) {
        const { roles, ...keep } = i[id]
        o[id] = {
          username: id.padStart(padLength, '0'),
          ...keep,
          privileges: roles?.filter(v => v !== 'other') || [],
          roles: {
            restricted: null,
            full: null,
            manage: null,
            owner: null,
          },
        }
      }
      return o
    }

    // remove counts of the "other" string
    function transformUserPrivilegeCounts(i) {
      for (const category in i) {
        delete i[category].other
      }
      return i
    }

    // add count of privilege "none" to each category
    // must be called after transforming userInfo
    function addNoPrivilegeCount(i) {
      const dataTime = Math.floor(new Date(i.dateGenerated) / 1000)
      const thirtyDaysAgo = dataTime - (30 * 24 * 60 * 60)
      const ninetyDaysAgo = dataTime - (90 * 24 * 60 * 60)

      i.userPrivilegeCounts.overall.none = 0
      i.userPrivilegeCounts.activeInLast90Days.none = 0
      i.userPrivilegeCounts.activeInLast30Days.none = 0

      for (const userId in i.userInfo) {
        const user = i.userInfo[userId]
        if (user.privileges.length === 0) {
          i.userPrivilegeCounts.overall.none++
          // Update counts for the last 30 and 90 days based on lastAccess
          if (user.lastAccess >= ninetyDaysAgo) {
            i.userPrivilegeCounts.activeInLast90Days.none++
          }
          if (user.lastAccess >= thirtyDaysAgo) {
            i.userPrivilegeCounts.activeInLast30Days.none++
          }
        }
      }
    }

    function transformAssetStigByCollection(i) {
      i.range00 = i.assetCnt - (i.range01to05 + i.range06to10 + i.range11to15 + i.range16plus)
      delete i.assetCnt
      return i
    }

    const { operationIdStats, ...requestsKeep } = input.operationalStats
    for (const opId in operationIdStats) {
      operationIdStats[opId].errors = {}
    }

    input.userInfo = transformUserInfo(input.userInfo)
    addNoPrivilegeCount(input)
    transformUserPrivilegeCounts(input.userPrivilegeCounts)

    function parseNodeUptimeString(uptimeString) {
      const values = uptimeString.match(/\d+/g)
      return (Number.parseInt(values[0]) * 86400)
        + (Number.parseInt(values[1]) * 3600)
        + (Number.parseInt(values[2]) * 60)
        + Number.parseInt(values[3])
    }

    const v1_0 = {
      date: input.dateGenerated,
      schema: 'stig-manager-appinfo-v1.0',
      version: input.stigmanVersion,
      collections: transformCountsByCollection(input.countsByCollection),
      requests: {
        ...requestsKeep,
        operationIds: operationIdStats,
      },
      users: {
        userInfo: input.userInfo,
        userPrivilegeCounts: input.userPrivilegeCounts,
      },
      mysql: {
        version: input.mySqlVersion,
        tables: input.dbInfo.tables,
        variables: input.mySqlVariablesRaw,
        status: input.mySqlStatusRaw,
      },
      nodejs: {
        version: 'v0.0.0',
        uptime: parseNodeUptimeString(input.nodeUptime),
        os: {},
        environment: {},
        memory: input.nodeMemoryUsageInMb,
        cpus: [],
      },
    }

    return v1_0
  }
}
