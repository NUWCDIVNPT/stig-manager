'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')


/**
 * Return version information
 *
 * returns ApiVersion
 **/
exports.getVersion = async function(userObject) {
  try {
    return (dbUtils.version)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

exports.replaceAppData = async function (importOpts, appData, userObject ) {
  function dmlObjectFromAppData (appdata) {
    let {packages, assets, users, reviews} = appdata
    let dml = {
      preload: [
        'ALTER TABLE REVIEW MODIFY CONSTRAINT PK_REVIEW DISABLE',
        'ALTER TABLE REVIEW MODIFY CONSTRAINT UK_REVIEW_2 DISABLE',
        'ALTER TABLE REVIEW_HISTORY MODIFY CONSTRAINT PK_RH DISABLE',
        `ALTER TABLE REVIEW DISABLE ALL TRIGGERS`,
        `ALTER TABLE ASSET DISABLE ALL TRIGGERS`,
        // 'ALTER INDEX UK_ACTION_ACTIONID UNUSABLE',
        // 'ALTER INDEX IDX_ASSET_4 UNUSABLE',
        // 'ALTER INDEX IDX_ASSET_1 UNUSABLE',
        // 'ALTER INDEX IDX_ASSET_2 UNUSABLE',
        // 'ALTER INDEX IDX_ASSET_3 UNUSABLE',
        // 'ALTER INDEX IDX_APM_2 UNUSABLE',
        // 'ALTER INDEX IDX_APM_4 UNUSABLE',
        // 'ALTER INDEX IDX_APM_1 UNUSABLE',
        // 'ALTER INDEX IDX_APM_3 UNUSABLE',
        // 'ALTER INDEX IDX_CCI_1 UNUSABLE',
        // 'ALTER INDEX IDX_CCI_2 UNUSABLE',
        // 'ALTER INDEX IDX_CRM_1 UNUSABLE',
        // 'ALTER INDEX IDX_CRM_2 UNUSABLE',
        // 'ALTER INDEX IDX_CHECKS_1 UNUSABLE',
        // 'ALTER INDEX IDX_DEPT_1 UNUSABLE',
        // 'ALTER INDEX IDX_DEPT_2 UNUSABLE',
        // 'ALTER INDEX IDX_FIX_1 UNUSABLE',
        // 'ALTER INDEX IDX_GROUPS UNUSABLE',
        // 'ALTER INDEX IDX_PACKAGE_1 UNUSABLE',
        // 'ALTER INDEX IDX_PRENTRY_1 UNUSABLE',
        // 'ALTER INDEX IDX_PRENTRY_3 UNUSABLE',
        // 'ALTER INDEX IDX_PRENTRY_2 UNUSABLE',
        // 'ALTER INDEX IDX_REJECT_STRING_1 UNUSABLE',
        // 'ALTER INDEX IDX_RESULT_1 UNUSABLE',
        // 'ALTER INDEX IDX_REVIEW_4 UNUSABLE',
        // 'ALTER INDEX IDX_REVIEW_1 UNUSABLE',
        // 'ALTER INDEX IDX_REVIEW_3 UNUSABLE',
        // 'ALTER INDEX IDX_REVIEW_5 UNUSABLE',
        // 'ALTER INDEX IDX_REVIEW_2 UNUSABLE',
        // 'ALTER INDEX IDX_RH_2 UNUSABLE',
        // 'ALTER INDEX IDX_RH_3 UNUSABLE',
        // 'ALTER INDEX IDX_RH_4 UNUSABLE',
        // 'ALTER INDEX IDX_RH_5 UNUSABLE',
        // 'ALTER INDEX IDX_RH_1 UNUSABLE',
        // 'ALTER INDEX IDX_RRSM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RRSM_1 UNUSABLE',
        // 'ALTER INDEX IDX_REVISION_2 UNUSABLE',
        // 'ALTER INDEX IDX_REVISION_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGM_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RGM_3 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM2_2 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM2_3 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM2_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM_3 UNUSABLE',
        // 'ALTER INDEX IDX_RGRCM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RGRFM_3 UNUSABLE',
        // 'ALTER INDEX IDX_RGRFM_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGRFM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RGRM_1 UNUSABLE',
        // 'ALTER INDEX IDX_RGRM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RGRM_3 UNUSABLE',
        // 'ALTER INDEX IDX_RXM_2 UNUSABLE',
        // 'ALTER INDEX IDX_RXM_1 UNUSABLE',
        // 'ALTER INDEX IDX_ROLE_1 UNUSABLE',
        // 'ALTER INDEX IDX_RULE_1 UNUSABLE',
        // 'ALTER INDEX PRIMARY_15 UNUSABLE',
        // 'ALTER INDEX INDEX_2_3 UNUSABLE',
        // 'ALTER INDEX INDEX_3_2 UNUSABLE',
        // 'ALTER INDEX PRIMARY_17 UNUSABLE',
        // 'ALTER INDEX INDEX_2_5 UNUSABLE',
        // 'ALTER INDEX IDX_SCM_1 UNUSABLE',
        // 'ALTER INDEX IDX_SAS_3 UNUSABLE',
        // 'ALTER INDEX IDX_SAS_1 UNUSABLE',
        // 'ALTER INDEX IDX_SAS_2 UNUSABLE',
        // 'ALTER INDEX IDX_STATUS_1 UNUSABLE',
        // 'ALTER INDEX IDX_STIG_2 UNUSABLE',
        // 'ALTER INDEX IDX_STIG_1 UNUSABLE',
        // 'ALTER INDEX IDX_SAM_3 UNUSABLE',
        // 'ALTER INDEX IDX_SAM_2 UNUSABLE',
        // 'ALTER INDEX IDX_SAM_1 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_4 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_3 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_1 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_2 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_5 UNUSABLE',
        // 'ALTER INDEX IDX_USER_DATA_6 UNUSABLE',
        // 'ALTER INDEX IDX_USAM_2 UNUSABLE',
        // 'ALTER INDEX IDX_USAM_3 UNUSABLE',
        // 'ALTER INDEX IDX_USAM_1 UNUSABLE'
      ],
      postload: [
        // 'ALTER INDEX UK_ACTION_ACTIONID REBUILD ONLINE',
        // 'ALTER INDEX IDX_ASSET_4 REBUILD ONLINE',
        // 'ALTER INDEX IDX_ASSET_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_ASSET_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_ASSET_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_APM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_APM_4 REBUILD ONLINE',
        // 'ALTER INDEX IDX_APM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_APM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_CCI_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_CCI_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_CRM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_CRM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_CHECKS_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_DEPT_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_DEPT_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_FIX_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_GROUPS REBUILD ONLINE',
        // 'ALTER INDEX IDX_PACKAGE_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_PRENTRY_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_PRENTRY_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_PRENTRY_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REJECT_STRING_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RESULT_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVIEW_4 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVIEW_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVIEW_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVIEW_5 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVIEW_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RH_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RH_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RH_4 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RH_5 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RH_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RRSM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RRSM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVISION_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_REVISION_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM2_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM2_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM2_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRCM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRFM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRFM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRFM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RGRM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RXM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RXM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_ROLE_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_RULE_1 REBUILD ONLINE',
        // 'ALTER INDEX PRIMARY_15 REBUILD ONLINE',
        // 'ALTER INDEX INDEX_2_3 REBUILD ONLINE',
        // 'ALTER INDEX INDEX_3_2 REBUILD ONLINE',
        // 'ALTER INDEX PRIMARY_17 REBUILD ONLINE',
        // 'ALTER INDEX INDEX_2_5 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SCM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAS_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAS_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAS_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_STATUS_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_STIG_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_STIG_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_SAM_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_4 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_1 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_5 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USER_DATA_6 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USAM_2 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USAM_3 REBUILD ONLINE',
        // 'ALTER INDEX IDX_USAM_1 REBUILD ONLINE',
        `ALTER TABLE ASSET_PACKAGE_MAP MODIFY APID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE ASSET MODIFY ASSETID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE PACKAGE MODIFY PACKAGEID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE REVIEW MODIFY REVIEWID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE STATS_ASSET_STIG MODIFY ID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE STIG_ASSET_MAP MODIFY SAID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE USER_DATA MODIFY USERID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE USER_STIG_ASSET_MAP MODIFY ID GENERATED BY DEFAULT ON NULL AS IDENTITY (START WITH LIMIT VALUE)`,
        `ALTER TABLE REVIEW ENABLE ALL TRIGGERS`,
        `ALTER TABLE ASSET ENABLE ALL TRIGGERS`,
        'ALTER TABLE REVIEW MODIFY CONSTRAINT PK_REVIEW ENABLE',
        'ALTER TABLE REVIEW MODIFY CONSTRAINT UK_REVIEW_2 ENABLE',
        'ALTER TABLE REVIEW_HISTORY MODIFY CONSTRAINT PK_RH ENABLE'
      ],
      package: {
        sqlDelete: `DELETE FROM package`,
        sqlInsert: `INSERT INTO
        package (
          packageId,
          NAME, 
          EMASSID,
          REQRAR,
          POCNAME,
          POCEMAIL,
          POCPHONE 
        ) VALUES (
          :packageId, :name, :emassId, :reqRar, :pocName, :pocEmail, :pocPhone
        )`,
        insertBinds: []
      },
      userData: {
        sqlDelete: `DELETE FROM user_data`,
        sqlInsert: `INSERT INTO
        user_data (
          userId,
          username, 
          display,
          deptId,
          roleId,
          canAdmin
        ) VALUES (
          :userId, :username, :display, :deptId, :roleId, :canAdmin
        )`,
        insertBinds: []
      },
      asset: {
        sqlDelete: `DELETE FROM asset`,
        sqlInsert: `INSERT INTO asset (
          assetId,
          name,
          ip,
          deptId,
          nonnetwork
        ) VALUES (
          :assetId, :name, :ip, :deptId, :nonnetwork
        )`,
        insertBinds: []
      },
      assetPackageMap: {
        sqlDelete: `DELETE FROM asset_package_map`,
        sqlInsert: `INSERT INTO asset_package_map (
          assetId,
          packageId
        ) VALUES (
          :assetId, :packageId
        )`,
        insertBinds: []
      },
      stigAssetMap: {
        sqlDelete: `DELETE FROM stig_asset_map`,
        sqlInsert: `INSERT INTO stig_asset_map (
          assetId,
          benchmarkId
        ) VALUES (
          :assetId, :benchmarkId
        )`,
        insertBinds: []
      },
      userStigAssetMap: {
        sqlDelete: `DELETE FROM user_stig_asset_map`,
        sqlInsert: `INSERT INTO user_stig_asset_map (
          userId,
          saId
        ) VALUES (
          :userId,
          (SELECT saId from stig_asset_map WHERE benchmarkId=:benchmarkId and assetId=:assetId)
        )`,
        insertBinds: []
      },
      reviewHistory: {
        sqlDelete: `TRUNCATE TABLE review_history`,
        sqlInsert: `INSERT INTO review_history (
          assetId,
          ruleId,
          activityType,
          columnName,
          oldValue,
          newValue,
          userId,
          ts
        ) VALUES (
          :assetId, :ruleId, :activityType, :columnName, :oldValue, :newValue, :userId, :ts
        )`,
        insertBinds: [],
        bindDefs: {
          assetId: {type: oracledb.DB_TYPE_NUMBER},
          ruleId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
          activityType: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
          columnName: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
          oldValue: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 32766},
          newValue: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 32766},
          userId: {type: oracledb.DB_TYPE_NUMBER},
          ts: {type: oracledb.DB_TYPE_DATE}
        }
      },
      review: {
        sqlDelete: `TRUNCATE TABLE review`,
        sqlInsert: `INSERT INTO review (
          assetId,
          ruleId,
          resultId,
          resultComment,
          actionId,
          actionComment,
          userId,
          autoResult,
          ts,
          rejectText,
          rejectUserId,
          statusId
        ) VALUES (
          :assetId, :ruleId, :result, :resultComment, :action, :actionComment,
          :userId, :autoResult, :ts, :rejectText, :rejectUserId, :status
        )`,
        // sqlInsert: `INSERT INTO stigman.reviews (
        //   assetId,
        //   ruleId
        // ) VALUES (
        //   :assetId, :ruleId
        // )`,
        insertBinds: []
      }
    }

    // Process appdata object

    // PACKAGES
    for (const p of packages) {
      p.reqRar = p.reqRar ? 1 : 0
    }
    dml.package.insertBinds = packages

    // USER_DATA
    for (const u of users) {
      u.canAdmin = u.canAdmin ? 1 : 0
    }
    dml.userData.insertBinds = users

    // ASSETS, ASSET_PACAKGE_MAP, STIG_ASSET_MAP, USER_STIG_ASSET_MAP
    for (const asset of assets) {
      let { packageIds, stigReviewers, ...assetFields} = asset
      let assetId = assetFields.assetId
      assetFields.nonnetwork = assetFields.nonnetwork ? 1: 0
      dml.asset.insertBinds.push(assetFields)
      for (const packageId of packageIds) {
        dml.assetPackageMap.insertBinds.push([assetId, packageId])
      }
      for (const sr of stigReviewers) {
        dml.stigAssetMap.insertBinds.push({
          assetId: assetId,
          benchmarkId: sr.benchmarkId
        })
        if (sr.userIds && sr.userIds.length > 0) {
          for (const userId of sr.userIds) {
            dml.userStigAssetMap.insertBinds.push({
              userId: userId,
              benchmarkId: sr.benchmarkId,
              assetId: assetId
            })
          }
        }
      }
    }

    // REVIEWS, REVIEWS_HISTORY
    for (const review of reviews) {
      review.autoResult = review.autoResult ? 1 : 0
      review.result = dbUtils.REVIEW_RESULT_ABBR[review.result].id
      review.action = review.action ? dbUtils.REVIEW_ACTION_STR[review.action] : null
      review.status = review.status ? dbUtils.REVIEW_STATUS_STR[review.status] : 0
      review.ts = new Date(review.ts)
      delete review.reviewId
      for (const h of review.history) {
        h.ts = new Date(h.ts)
        h.assetId = review.assetId
        h.ruleId = review.ruleId
        dml.reviewHistory.insertBinds.push(h)
      }
      delete review.history
    }
    dml.review.insertBinds = reviews

    return dml
  }

  let connection
  try {
    let result, hrstart, hrend, tableOrder, dml, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    dml = dmlObjectFromAppData(appData)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Connect to Oracle, has transaction by default
    connection = await oracledb.getConnection()

    // Preload
    hrstart = process.hrtime() 
    for (const sql of dml.preload) {
      console.log(sql)
      result = await connection.execute(sql)
    }
    hrend = process.hrtime(hrstart)
    stats.preload = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Deletes
    tableOrder = [
      'reviewHistory',
      'review',
      'userStigAssetMap',
      'stigAssetMap',
      'assetPackageMap',
      'package',
      'asset',
      'userData'
    ]
    for (const table of tableOrder) {
      hrstart = process.hrtime() 
      result = await connection.execute(dml[table].sqlDelete)
      hrend = process.hrtime(hrstart)
      stats[table] = {}
      stats[table].delete = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }

    // Inserts
    tableOrder = [
      'package',
      'userData',
      'asset',
      'assetPackageMap',
      'stigAssetMap',
      'userStigAssetMap',
      'review',
      'reviewHistory'
    ]
    for (const table of tableOrder) {
      if (dml[table].insertBinds.length > 0) {
        hrstart = process.hrtime() 
        result = await connection.executeMany(dml[table].sqlInsert, dml[table].insertBinds)
        hrend = process.hrtime(hrstart)
        stats[table].insert = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }
    }

    // Commit
    hrstart = process.hrtime() 
    connection.commit()
    hrend = process.hrtime(hrstart)
    stats.commit = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Postload
    hrstart = process.hrtime() 
    for (const sql of dml.postload) {
      result = await connection.execute(sql)
    }
    hrend = process.hrtime(hrstart)
    stats.postload = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Total time calculation
    hrend = process.hrtime(totalstart)
    stats.total = `TOTAL in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    return (stats)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.close()
    }
  }
}
