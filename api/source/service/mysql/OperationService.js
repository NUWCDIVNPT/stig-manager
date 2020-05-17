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
    let {packages, assets, users, reviews} = appdata

    let dml = {
      preload: [
      ],
      postload: [
      ],
      package: {
        sqlDelete: `DELETE FROM stigman.package`,
        sqlInsert: `INSERT INTO
        stigman.package (
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
      user: {
        sqlDelete: `DELETE FROM stigman.user`,
        sqlInsert: `INSERT INTO
        stigman.user (
          userId,
          username, 
          display,
          dept,
          roleId,
          canAdmin
        ) VALUES ?`,
        insertBinds: []
      },
      asset: {
        sqlDelete: `DELETE FROM stigman.asset`,
        sqlInsert: `INSERT INTO stigman.asset (
          assetId,
          name,
          ip,
          dept,
          nonnetwork
        ) VALUES ?`,
        insertBinds: []
      },
      assetPackageMap: {
        sqlDelete: `DELETE FROM stigman.asset_package_map`,
        sqlInsert: `INSERT INTO stigman.asset_package_map (
          assetId,
          packageId
        ) VALUES ?`,
        insertBinds: []
      },
      stigAssetMap: {
        sqlDelete: `DELETE FROM stigman.stig_asset_map`,
        sqlInsert: `INSERT INTO stigman.stig_asset_map (
          assetId,
          benchmarkId
        ) VALUES ?`,
        insertBinds: []
      },
      userStigAssetMap: {
        sqlDelete: `DELETE FROM stigman.user_stig_asset_map`,
        sqlInsert: `INSERT INTO stigman.user_stig_asset_map (
          userId,
          benchmarkId,
          assetId
        ) VALUES ?`,
        insertBinds: []
      },
      reviewHistory: {
        sqlDelete: `DELETE FROM stigman.review_history`,
        sqlInsert: `INSERT INTO stigman.review_history (
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
        sqlDelete: `DELETE FROM stigman.review`,
        sqlInsert: `INSERT INTO stigman.review (
          assetId,
          ruleId,
          stateId,
          stateComment,
          actionId,
          actionComment,
          userId,
          autoState,
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

    // Table: user
    for (const u of users) {
      dml.user.insertBinds .push([
        u.userId,
        u.username, 
        u.display,
        u.dept,
        dbUtils.USER_ROLE[u.role].id,
        u.canAdmin ? 1 : 0
      ])
    }

    // Tables: assets, asset_package_map, stig_asset_map, user_stig_asset_map
    for (const asset of assets) {
      let { packageIds, stigReviewers, ...assetFields} = asset
      dml.asset.insertBinds.push([
        assetFields.assetId,
        assetFields.name,
        assetFields.ip,
        assetFields.dept,
        assetFields.nonnetwork ? 1: 0
      ])
      let assetId = assetFields.assetId
      for (const packageId of packageIds) {
        dml.assetPackageMap.insertBinds.push([assetId, packageId])
      }
      for (const sr of stigReviewers) {
        dml.stigAssetMap.insertBinds.push([
          assetId,
          sr.benchmarkId
        ])
        if (sr.userIds && sr.userIds.length > 0) {
          for (const userId of sr.userIds) {
            dml.userStigAssetMap.insertBinds.push([
              userId,
              sr.benchmarkId,
              assetId
            ])
          }
        }
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
        dbUtils.REVIEW_STATE_ABBR[review.state].id,
        review.stateComment,
        review.action ? dbUtils.REVIEW_ACTION_STR[review.action] : null,
        review.actionComment,
        review.userId,
        review.autoState ? 1 : 0,
        new Date(review.ts),
        review.rejectText,
        review.rejectUserId,
        review.status ? dbUtils.REVIEW_STATUS_STR[review.status] : 0
      ])
    }

    return dml
  }

  let connection
  try {
    let result, hrstart, hrend, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    let dml = dmlObjectFromAppData(appData)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    connection = await dbUtils.pool.getConnection()
    await connection.query('START TRANSACTION')
    await connection.query('SET autocommit=0')

    // hrstart = process.hrtime() 
    // for (const sql of dml.preload) {
    //   console.log(sql)
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.preload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.reviewHistory.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.reviewsHistory = {}
    stats.reviewsHistory.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.review.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.reviews = {}
    stats.reviews.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.userStigAssetMap.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.userStigAssetMap = {}
    stats.userStigAssetMap.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result]= await connection.query(dml.stigAssetMap.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.stigAssetMap = {}
    stats.stigAssetMap.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.assetPackageMap.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.assetPackageMap = {}
    stats.assetPackageMap.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.package.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.packages = {}
    stats.packages.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.asset.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.assets = {}
    stats.assets.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.user.sqlDelete)
    hrend = process.hrtime(hrstart)
    stats.users = {}
    stats.users.delete = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    
    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.package.sqlInsert, [dml.package.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.packages.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.user.sqlInsert, [dml.user.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.users.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.asset.sqlInsert, [dml.asset.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.assets.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.assetPackageMap.sqlInsert, [dml.assetPackageMap.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.assetPackageMap.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.stigAssetMap.sqlInsert, [dml.stigAssetMap.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.stigAssetMap.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.userStigAssetMap.sqlInsert, [dml.userStigAssetMap.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.userStigAssetMap.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.review.sqlInsert, [dml.review.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.reviews.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result] = await connection.query(dml.reviewHistory.sqlInsert, [dml.reviewHistory.insertBinds])
    hrend = process.hrtime(hrstart)
    stats.reviewsHistory.insert = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`


    hrstart = process.hrtime() 
    await connection.query('COMMIT')
    hrend = process.hrtime(hrstart)
    stats.commit = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // hrstart = process.hrtime() 
    // for (const sql of dml.postload) {
    //   ;[result] = await connection.execute(sql)
    // }
    // hrend = process.hrtime(hrstart)
    // stats.postload = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

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
