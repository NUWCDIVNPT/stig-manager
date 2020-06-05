'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const Asset = require(`./AssetService`);
const Package = require(`./PackageService`);
// const User = require(`./UserService`);
// const Reviews = require(`./ReviewService`);


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
    let {packages, departments, assets, users, reviews} = appdata

    let dml = {
      preload: [
      ],
      postload: [
      ],
      package: {
        sqlDelete: `DELETE FROM package`,
        sqlInsert: `INSERT INTO
        package (
          packageId,
          name, 
          emassId,
          reqRar,
          pocName,
          pocEmail,
          pocPhone 
        ) VALUES ?`,
        insertBinds: []
      },
      department: {
        sqlDelete: `DELETE FROM department`,
        sqlInsert: `INSERT INTO department (deptId, name) VALUES ?`,
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
          accessLevel,
          canAdmin
        ) VALUES ?`,
        insertBinds: []
      },
      asset: {
        sqlDelete: `DELETE FROM asset`,
        sqlInsert: `INSERT INTO asset (
          assetId,
          name,
          ip,
          deptId,
          packageId,
          nonnetwork
        ) VALUES ?`,
        insertBinds: []
      },
      stigAssetMap: {
        sqlDelete: `DELETE FROM stig_asset_map`,
        sqlInsert: `INSERT INTO stig_asset_map (
          assetId,
          benchmarkId,
          userIds
        ) VALUES ?`,
        insertBinds: []
      },
      userStigAssetMap: {
        sqlDelete: `DELETE FROM user_stig_asset_map`,
        // sqlInsert: `INSERT INTO stigman.user_stig_asset_map (
        //   userId,
        //   benchmarkId,
        //   assetId
        // ) VALUES ?`,
        sqlInsert: `INSERT INTO user_stig_asset_map
        (saId, userId)
        SELECT
        sa.saId,
        jt.userId
        FROM
        stig_asset_map sa,
          JSON_TABLE(
            sa.userIds,
            "$[*]"
            COLUMNS(
              userId INT(11) PATH "$"
            )
          ) AS jt`,
        insertBinds: [null] // dummy value so length > 0
      },
      reviewHistory: {
        sqlDelete: `DELETE FROM review_history`,
        sqlInsert: `INSERT INTO review_history (
          assetId,
          ruleId,
          activityType,
          columnName,
          oldValue,
          newValue,
          userId,
          ts
        ) VALUES ?`,
        insertBinds: []
      },
      review: {
        sqlDelete: `DELETE FROM review`,
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
        ) VALUES ?`,
        insertBinds: []
      }
    }

    // Process appdata object

    // Table: package
    for (const p of packages) {
      dml.package.insertBinds.push([
        p.packageId,
        p.name, 
        p.emassId,
        p.reqRar ? 1 : 0,
        p.pocName,
        p.pocEmail,
        p.pocPhone 
      ])
    }

    // Table: department
    for (const d of departments) {
      dml.department.insertBinds.push([
        d.deptId,
        d.name
      ])
    }

    // Table: user
    for (const u of users) {
      dml.userData.insertBinds .push([
        u.userId,
        u.username, 
        u.display,
        u.deptId,
        u.accessLevel,
        u.canAdmin ? 1 : 0
      ])
    }

    // Tables: assets, asset_package_map, stig_asset_map, user_stig_asset_map
    for (const asset of assets) {
      let { stigReviewers, ...assetFields} = asset
      dml.asset.insertBinds.push([
        assetFields.assetId,
        assetFields.name,
        assetFields.ip,
        assetFields.deptId,
        assetFields.packageId,
        assetFields.nonnetwork ? 1: 0
      ])
      let assetId = assetFields.assetId
      for (const sr of stigReviewers) {
        const userIds = []
        if (sr.userIds && sr.userIds.length > 0) {
          for (const userId of sr.userIds) {
            userIds.push(userId)
          }
        }
        dml.stigAssetMap.insertBinds.push([
          assetId,
          sr.benchmarkId,
          JSON.stringify(userIds)
        ])
      }
    }

    // Tables: review, review_history
    for (const review of reviews) {
      for (const h of review.history) {
        dml.reviewHistory.insertBinds.push([
          review.assetId,
          review.ruleId,
          h.activityType,
          h.columnName,
          h.oldValue,
          h.newValue,
          h.userId,
          new Date(h.ts)
        ])
      }
      dml.review.insertBinds.push([
        review.assetId,
        review.ruleId,
        dbUtils.REVIEW_RESULT_API[review.result],
        review.resultComment,
        review.action ? dbUtils.REVIEW_ACTION_API[review.action] : null,
        review.actionComment,
        review.userId,
        review.autoState ? 1 : 0,
        new Date(review.ts),
        review.rejectText,
        review.rejectUserId,
        review.status ? dbUtils.REVIEW_STATUS_API[review.status] : 0
      ])
    }

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

    // Connect to MySQL and start transaction
    connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')

    // // Preload
    // hrstart = process.hrtime() 
    // for (const sql of dml.preload) {
    //   console.log(sql)
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.preload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Deletes
    tableOrder = [
      'reviewHistory',
      'review',
      'userStigAssetMap',
      'stigAssetMap',
      'package',
      'asset',
      'userData',
      'department'
    ]
    for (const table of tableOrder) {
      hrstart = process.hrtime() 
      ;[result] = await connection.query(dml[table].sqlDelete)
      hrend = process.hrtime(hrstart)
      stats[table] = {}
      stats[table].delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }

    // Inserts
    tableOrder = [
      'package',
      'department',
      'userData',
      'asset',
      'stigAssetMap',
      'userStigAssetMap',
      'review',
      'reviewHistory'
    ]
    for (const table of tableOrder) {
      if (dml[table].insertBinds.length > 0) {
        hrstart = process.hrtime() 
        ;[result] = await connection.query(dml[table].sqlInsert, [dml[table].insertBinds])
        hrend = process.hrtime(hrstart)
        stats[table].insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }
    }
    
    // Commit
    hrstart = process.hrtime() 
    await connection.query('COMMIT')
    hrend = process.hrtime(hrstart)
    stats.commit = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // // Postload
    // hrstart = process.hrtime() 
    // for (const sql of dml.postload) {
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.postload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // Total time calculation
    hrend = process.hrtime(totalstart)
    stats.total = `TOTAL in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    return (stats)
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.query('ROLLBACK')
    }
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}
