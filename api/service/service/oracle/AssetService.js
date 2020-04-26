'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he');

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    'a.ASSETID as "assetId"',
    'a.NAME as "name"',
    'a.DEPT as "dept"',
    'a.IP as "ip"',
    'a.NONNETWORK as "nonnetwork"',
    'a.SCANEXEMPT as "scanexempt"'
  ]
  let joins = [
    'stigman.assets a',
    'left join stigman.asset_package_map ap on a.assetId=ap.assetId',
    'left join stigman.packages p on ap.packageId=p.packageId',
    'left join stigman.stig_asset_map sa on a.assetId = sa.assetId',
    'left join stigman.user_stig_asset_map usa on sa.saId = usa.saId'
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('packages')) {
    columns.push(`'[' || strdagg_param(param_array(json_object(KEY 'packageId' VALUE p.packageId, KEY 'name' VALUE p.name ABSENT ON NULL), ',')) || ']' as "packages"`)
  }
  if (inProjection && inProjection.includes('adminStats')) {
    columns.push(`json_object(
      KEY 'stigCount' VALUE COUNT(Distinct sa.saId),
      KEY 'stigAssignedCount' VALUE COUNT(Distinct usa.saId)
      ) as "adminStats"`)
  }
  if (inProjection && inProjection.includes('stigReviewers') && context !== dbUtils.CONTEXT_USER) {
    columns.push(`(select
          replace(
              replace(
                  json_arrayagg(
                      json_object(
                          KEY 'benchmarkId' VALUE sa.stigId,
                          KEY 'reviewers' VALUE json_arrayagg(
                              CASE WHEN u.id IS NOT NULL THEN  json_object(
                                  KEY 'userId' VALUE u.id,
                                  KEY 'name' VALUE u.name
                                  ABSENT ON NULL
                              ) ELSE NULL END
                          ) FORMAT JSON
                      )
                  )
              , '"{', '{')
          , '}"', '}')
      FROM 
      stigman.stig_asset_map sa
      left join stigman.user_stig_asset_map usa on sa.saId = usa.saId
      left join stigman.user_data u on usa.userId = u.id
      WHERE sa.assetId = a.assetId
      group by sa.stigId) as "stigReviewers"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
    joins.push('left join stigs.current_revs cr on sa.stigId=cr.stigId')
    joins.push('left join stigs.stigs st on cr.stigId=st.stigId')
    columns.push(`'[' || strdagg_param(param_array(json_object(
      KEY 'benchmarkId' VALUE cr.stigId, 
      KEY 'lastRevisionStr' VALUE CASE 
        WHEN cr.stigId IS NOT NULL THEN 'V'||cr.version||'R'||cr.release END,
      KEY 'lastRevisionDate' VALUE CASE
        WHEN cr.stigId IS NOT NULL THEN cr.benchmarkDateSql END,
      KEY 'title' VALUE st.title ABSENT ON NULL), ',')) || ']' as "stigs"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = :assetId')
    predicates.binds.push( inPredicates.assetId )
  }
  if (inPredicates.packageId) {
    predicates.statements.push('ap.packageId = :packageId')
    predicates.binds.push( inPredicates.packageId )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.stigId = :stigId')
    predicates.binds.push( inPredicates.benchmarkId )
  }
  if (inPredicates.dept) {
    predicates.statements.push('a.dept = :dept')
    predicates.binds.push( inPredicates.dept )
  }
  if (context == dbUtils.CONTEXT_DEPT) {
    predicates.statements.push('a.dept = :dept')
    predicates.binds.push( userObject.dept )
  } 
  else if (context == dbUtils.CONTEXT_USER) {
    predicates.statements.push('usa.userId = :userId')
    predicates.binds.push( userObject.id )

  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' group by a.assetId, a.name, a.dept, a.ip, a.nonnetwork, a.scanexempt'
  sql += ' order by a.name'
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // Post-process each row, unfortunately.
    // * Oracle doesn't have a BOOLEAN data type, so we must cast columns 'nonnetwork' and 'scanexempt'
    // * Oracle doesn't support a JSON type, so we parse string values from 'packages' and 'stigs' into objects
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      // Handle booleans
      record.nonnetwork = record.nonnetwork == 1 ? true : false
      record.scanexempt = record.scanexempt == 1 ? true : false
      // Handle packages
      if ('packages' in record) {
       // Check for "empty" arrays 
        record.packages = record.packages == '[{}]' ? [] : JSON.parse(record.packages) || []
        // Sort by package name
        record.packages.sort((a,b) => {
          let c = 0
          if (a.name > b.name) { c= 1 }
          if (a.name < b.name) { c = -1 }
          return c
        })
      }
      // Handle stigs 
      if ('stigs' in record) {
        record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs) || []
        // Sort by benchmarkId
        record.stigs.sort((a,b) => {
          let c = 0
          if (a.benchmarkId > b.benchmarkId) { c = 1 }
          if (a.benchmarkId < b.benchmarkId) { c = -1 }
          return c
        })
      }
      // Handle adminStats 
      if ('adminStats' in record) {
        record.adminStats = JSON.parse(record.adminStats) || {}
      }
      // Handle stigReviewers 
      if ('stigReviewers' in record) {
        record.stigReviewers = JSON.parse(record.stigReviewers) || []
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdateAsset = async function (writeAction, assetId, body, projection, userObject) {
  let connectVar // available to try, catch, and finally blocks
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let { stigReviewers, benchmarkIds, packageIds, ...assetFields } = body
    stigReviewers = stigReviewers ? stigReviewers : []
    benchmarkIds = benchmarkIds ? benchmarkIds : []
    packageIds = packageIds ? packageIds : []

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('nonnetwork')) {
      assetFields.nonnetwork = assetFields.nonnetwork ? 1 : 0
    }
    if (assetFields.hasOwnProperty('scanexempt')) {
      assetFields.scanexempt = assetFields.scanexempt ? 1 : 0
    }

    // Connect to Oracle
    let connection
      let options = {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      }
    connection = await oracledb.getConnection()
    connectVar = connection // make available to catch and finally blocks

    // Process scalar properties
    let binds = {}
    if (writeAction === dbUtils.WRITE_ACTION.CREATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      let defaults = {
        name: null,
        ip: null,
        dept: null,
        nonnetwork: 0,
        scanexempt: 0
      }
      binds = { ...defaults, ...assetFields }
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE) {
      binds = { ...assetFields}
    }
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
    // INSERT into assets
    let sqlInsert =
      `INSERT INTO
          stigman.assets
          (name, ip, dept, nonnetwork, scanexempt)
        VALUES
          (:name, :ip, :dept, :nonnetwork, :scanexempt)
        RETURNING
          assetId into :assetId`
      binds.assetId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      assetId = result.outBinds.assetId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              stigman.assets
            SET
              ${dbUtils.objectBindObject(assetFields, binds)}
            WHERE
              assetId = :assetId`
        binds.assetId = assetId
        await connection.execute(sqlUpdate, binds, options)
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process packageIds if present
    if (writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      // DELETE from asset_package_map
      let sqlDeletePackages = 'DELETE FROM stigman.asset_package_map where assetId = :assetId'
      await connection.execute(sqlDeletePackages, [assetId])
    }
    if (packageIds.length > 0) {
      let sqlInsertPackages = `
        INSERT /*+ ignore_row_on_dupkey_index(asset_package_map(packageId, assetId)) */ INTO 
          stigman.asset_package_map (packageId,assetId)
        VALUES (:packageId, :assetId)`      
      let binds = packageIds.map(i => [i, assetId])
      // INSERT into asset_package_map
      await connection.executeMany(sqlInsertPackages, binds)
    }

    // Process benchmarkIds and/or stigReviewers
    if (writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      let sqlDeleteBenchmarks = 'DELETE FROM stigman.stig_asset_map where assetId = :assetId'
      // DELETE from stig_asset_map, will cascade into user_stig_aset_map
      await connection.execute(sqlDeleteBenchmarks, [assetId])
    }
    let sqlInsertBenchmarks = `
      INSERT /*+ ignore_row_on_dupkey_index(stig_asset_map(stigId, assetId)) */ INTO 
        stigman.stig_asset_map (stigId,assetId)
      VALUES
        (:benchmarkId, :assetId)
      `
    let benchmarkBinds = []
    let stigReviewersBenchmarkBinds = []
    let userStigAssetBinds = [] 
    if (benchmarkIds.length > 0) {
      // Bind stig_asset_map values from the request.benchmarkIds
      benchmarkBinds = benchmarkIds.map(i => [i, assetId])
    }
    if (stigReviewers.length > 0) {
      // Bind stig_asset_map values from request.stigReviewers.benchmarkId
      stigReviewersBenchmarkBinds = stigReviewers.map(i => [i.benchmarkId, assetId])
      // Bind any user_stig_asset_map values
      stigReviewers.forEach( e => {
        if (e.userIds && e.userIds.length > 0) {
          e.userIds.forEach(userId => {
            userStigAssetBinds.push({
              userId: userId,
              benchmarkId: e.benchmarkId,
              assetId: assetId
            })
          })
        }
      })
    }
    // Reassign binds as an Array
    binds = [...benchmarkBinds, ...stigReviewersBenchmarkBinds]
    if (binds.length > 0) {
      // INSERT into stig_asset_map
      let result = await connection.executeMany(sqlInsertBenchmarks, binds, options)
    }
    if (userStigAssetBinds.length > 0) {
      // INSERT into user_stig_asset_map 
      let sqlInsertUserStigAsset = `INSERT /*+ ignore_row_on_dupkey_index(user_stig_asset_map(userId, saId)) */ INTO 
        stigman.user_stig_asset_map 
          (userId, saId)
        VALUES 
          (:userId, (SELECT saId from stigman.stig_asset_map WHERE stigId=:benchmarkId and assetId=:assetId))`
      let result = await connection.executeMany(sqlInsertUserStigAsset, userStigAssetBinds, options)
    }
    // Commit the changes
    await connection.commit()
  }
  catch (err) {
    await connectVar.rollback()
    throw err
  }
  finally {
    if (typeof connectVar !== 'undefined') {
      await connectVar.close()
    }
  }

  // Fetch the new or updated Asset for the response
  try {
    let row = await this.getAsset(assetId, projection, true, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}

exports.queryChecklist = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
    context = dbUtils.CONTEXT_ALL
  } else if (userObject.role == "IAO") {
    context = dbUtils.CONTEXT_DEPT
  } else {
    context = dbUtils.CONTEXT_USER
  }

  let columns = [
    ':assetId as "assetId"',
    'g.GROUPID as "groupId"',
    'r.RULEID as "ruleId"',
    'g.TITLE as "groupTitle"',
    'r.TITLE as "ruleTitle"',
    'sc.CAT as "cat"',
    'r.DOCUMENTABLE as "documentable"',
    `NVL(state.abbr,'') as "stateAbbr"`,
    `NVL(review.statusId,0) as "statusId"`,
    `NVL(review.autoState,0) as "autoState"`,
    `CASE WHEN ra.raId is null THEN 0 ELSE 1 END as "hasAttach"`,
    `CASE
      WHEN review.ruleId is null
      THEN 0
      ELSE
        CASE WHEN review.stateId != 4
        THEN
          CASE WHEN review.stateComment != ' ' and review.stateComment is not null
            THEN 1
            ELSE 0 END
        ELSE
          CASE WHEN review.actionId is not null and review.actionComment is not null and review.actionComment != ' '
            THEN 1
            ELSE 0 END
        END
    END as "done"`,
    `CASE
      WHEN scap.ruleId is null
      THEN 'Manual'
      ELSE 'SCAP'
    END as "checkType"`
  ]
  let joins = [
    'stigs.current_revs rev',
    'left join stigs.rev_group_map rg on rev.revId = rg.revId',
    'left join stigs.groups g on rg.groupId=g.groupId',
    'left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId',
    'left join stigs.rules r on rgr.ruleId=r.ruleId',
    'left join stigs.severity_cat_map sc on r.severity=sc.severity',
    'left join reviews review on r.ruleId = review.ruleId and review.assetId = :assetId',
    'left join states state on review.stateId=state.stateId',
    'left join review_artifact_map ra on (ra.assetId=review.assetId and ra.ruleId=review.ruleId)',
    'left join (SELECT distinct ruleId FROM	stigs.rule_oval_map) scap on r.ruleId=scap.ruleId'
  ]
  // PREDICATES
  let predicates = {
    statements: [],
    binds: {}
  }
  if (inPredicates.assetId) {
    predicates.binds.assetId = inPredicates.assetId
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('rev.stigId = :benchmarkId')
    predicates.binds.benchmarkId = inPredicates.benchmarkId
  }
  if (inPredicates.revisionStr !== 'latest') {
    joins.splice(0, 1, 'stigs.revisions rev')
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
    let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
    predicates.statements.push('rev.revId = :revId')
    predicates.binds.revId = revId
  }
  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += `\norder by DECODE(substr(g.groupId,1,2),'V-',lpad(substr(g.groupId,3),6,'0'),g.groupId) asc`
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    return (result.rows)
  }
  catch (err) {
    throw err
  }


}

exports.cklFromAssetStig = async function cklFromAssetStig (assetId, benchmarkId, revisionStr, elevate, userObject) {
  try {
    let cklJs = {
      CHECKLIST: {
        ASSET: {
          ROLE: 'None',
          ASSET_TYPE: 'Computing',
          HOST_NAME: null,
          HOST_IP: null,
          HOST_MAC: null,
          HOST_GUID: null,
          HOST_FQDN: null,
          TECH_AREA: null,
          TARGET_KEY: '2777',
          WEB_OR_DATABASE: 'false',
          WEB_DB_SITE: null,
          WEB_DB_INSTANCE: null
        },
        STIGS: {
          iSTIG: {
            STIG_INFO:
              {
                SI_DATA: []
              },
            VULN: []
          }
        }
      }
    }
    let sqlGetBenchmarkId
    if (revisionStr === 'latest') {
      sqlGetBenchmarkId = "select cr.stigId, s.title, cr.revId, cr.description, cr.version, cr.release, cr.benchmarkDate from stigs.current_revs cr left join stigs.stigs s on cr.stigId = s.stigId where cr.stigId = :1"
    }
    else {
      sqlGetBenchmarkId = "select r.stigId,s.title, r.description, r.version, r.release, r.benchmarkDate from stigs.stigs s left join stigs.revisions r on s.stigId=r.stigId where r.revId = :1"
    }
    let sqlGetAsset = "select name,profile,ip from stigman.assets where assetId = :assetId"
    let sqlGetCCI = "select controlnumber from stigs.rule_control_map where ruleId = :ruleId and controltype='CCI'"
    let sqlGetResults = `
    select
      g.groupId as "groupId",
      r.severity as "severity",
      g.title as "groupTitle",
      r.ruleId as "ruleId",
      r.title as "ruleTitle",
      r.weight as "weight",
      r.version as "version",
      r.vulnDiscussion as "vulnDiscussion",
      r.iaControls as "iaControls",
    --  The two lines below are hacks that only display a subset of the content and fix texts.
    --  We should be doing some type of concatenation
      MAX(c.content) as "checkContent",
      MAX(to_char(substr(f.text,0,3999))) as "fixText",
      r.falsePositives as "falsePositives",
      r.falseNegatives as "falseNegatives",
      r.documentable as "documentable",
      r.mitigations as "mitigations",
      r.potentialImpacts as "potentialImpacts",
      r.thirdPartyTools as "thirdPartyTools",
      r.mitigationControl as "mitigationControl",
      r.responsibility as "responsibility",
      r.securityOverrideGuidance as "securityOverrideGuidance",
      NVL(rev.stateId,0) as "stateId",
      rev.stateComment as "stateComment",
      act.action as "action",
      rev.actionComment as "actionComment",
      to_char(rev.ts,'yyyy-mm-dd hh24:mi:ss') as "ts",
      listagg(rulectl.controlnumber, ',') within group (order by rulectl.controlnumber) as "ccis"
    from
      assets s
      left join stigs.rev_profile_group_map rpg on s.profile=rpg.profile
      left join stigs.groups g on rpg.groupId=g.groupId
      left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
      left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
      left join stigs.rules r on rgr.ruleId=r.ruleId
      left join stigs.rule_check_map rc on r.ruleId=rc.ruleId
      left join stigs.rule_control_map rulectl on (r.ruleId = rulectl.ruleId and rulectl.controltype='CCI')
      left join stigs.checks c on rc.checkId=c.checkId
      left join stigs.rule_fix_map rf on r.ruleId=rf.ruleId
      left join stigs.fixes f on rf.fixId=f.fixId
      left join reviews rev on (r.ruleId=rev.ruleId and s.assetId=rev.assetId)
      left join actions act on act.actionId=rev.actionId
    where
      s.assetId = :assetId
      and rg.revId = :revId
    group by
      g.groupId,
      r.severity,
      g.title,
      r.ruleId,
      r.title,
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
    --	c.content,
    --	to_char(substr(f.text,0,8000)),
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.securityOverrideGuidance,
      rev.stateId,
      rev.stateComment,
      act.action,
      rev.actionComment,
      rev.ts,
      rg.groupId
    order by
      DECODE(substr(g.groupId,1,2),'V-',lpad(substr(g.groupId,3),6,'0'),g.groupId) asc
    `

    // Fetch data
    let oracleOptions = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()

    // ASSET
    let resultGetAsset = await connection.execute(sqlGetAsset, {assetId: assetId}, oracleOptions)
    cklJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset.rows[0].NAME
    cklJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset.rows[0].IP

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    // Calculate revId
    let resultGetBenchmarkId, revId
    if (revisionStr === 'latest') {
      resultGetBenchmarkId = await connection.execute(sqlGetBenchmarkId, [benchmarkId], oracleOptions)
      revId = resultGetBenchmarkId.rows[0].REVID
    }
    else {
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      revId =  `${benchmarkId}-${results[1]}-${results[2]}`
      resultGetBenchmarkId = await connection.execute(sqlGetBenchmarkId, [revId], oracleOptions)
    }

    let stig = resultGetBenchmarkId.rows[0]
    let siDataRefs = [
      { SID_NAME: 'version', SID_DATA: stig.VERSION },
      { SID_NAME: 'classification' },
      { SID_NAME: 'customname' },
      { SID_NAME: 'stigid', SID_DATA: stig.STIGID },
      { SID_NAME: 'description', SID_DATA: stig.DESCRIPTION },
      { SID_NAME: 'filename', SID_DATA: 'stig-manager-oss' },
      { SID_NAME: 'releaseinfo', SID_DATA: `Release: ${stig.RELEASE} Benchmark Date: ${stig.BENCHMARKDATE}`},
      { SID_NAME: 'title', SID_DATA: stig.TITLE },
      { SID_NAME: 'uuid', SID_DATA: '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
      { SID_NAME: 'notice', SID_DATA: 'terms-of-use' },
      { SID_NAME: 'source', }
    ]
    let siDataArray = cklJs.CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    siDataRefs.forEach(siDatum => {
      siDataArray.push(siDatum)
    })

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
    let resultGetResults = await connection.execute(sqlGetResults, {assetId: assetId, revId: revId}, oracleOptions)
    await connection.close()

    let stigDataRef = [
      ['Vuln_Num', 'groupId' ],
      ['Severity',  'severity' ],
      ['Group_Title',  'groupTitle' ],
      ['Rule_ID',  'ruleId' ],
      ['Rule_Ver',  'version' ],
      ['Rule_Title',  'ruleTitle' ],
      ['Vuln_Discuss',  'vulnDiscussion' ],
      ['IA_Controls',  'iaControls' ],
      ['Check_Content',  'checkContent' ],
      ['Fix_Text',  'fixText' ],
      ['False_Positives',  'falsePositives' ],
      ['False_Negatives',  'falseNegatives' ],
      ['Documentable', 'documentable' ],
      ['Mitigations', 'mitigations' ],
      ['Potential_Impact', 'potentialImpacts' ],
      ['Third_Party_Tools', 'thirdPartyTools' ],
      ['Mitigation_Control', 'mitigationControl' ],
      ['Responsibility', 'responsibility' ],
      ['Security_Override_Guidance', 'securityOverrideGuidance' ]
      // ['Check_Content_Ref', 'securityOverrideGuidance' ]
      // ['Class', 'securityOverrideGuidance' ]
      // ['STIGRef', 'securityOverrideGuidance' ]
      // ['STIG_UUID', 'securityOverrideGuidance' ]
      // ['CCI_REF', 'securityOverrideGuidance' ]
    ]
    let stateStrings = ['Not_Reviewed', 'Not_Reviewed', 'Not_Applicable', 'NotAFinding', 'Open']

    let vulnArray = cklJs.CHECKLIST.STIGS.iSTIG.VULN
    resultGetResults.rows.forEach( r => {
      let vulnObj = {
        STIG_DATA: [],
        STATUS: stateStrings[r.stateId],
        FINDING_DETAILS: r.stateComment,
        COMMENTS: r.action ? `${r.action}: ${r.actionComment}` : null,
        SEVERITY_OVERRIDE: null,
        SEVERITY_JUSTIFICATION: null
      }
      stigDataRef.forEach(stigDatum => {
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: stigDatum[0],
          ATTRIBUTE_DATA: r[stigDatum[1]]
        })
      })
      // CCI_REFs
      let ccis = r.ccis.split(',')
      ccis.forEach( cci=> {
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: 'CCI_REF',
          ATTRIBUTE_DATA: cci
        })
      })
      vulnArray.push(vulnObj)
    })

    let defaultOptions = {
      attributeNamePrefix : "@_",
      attrNodeName: "@", //default is false
      textNodeName : "#text",
      ignoreAttributes : true,
      cdataTagName: "__cdata", //default is false
      cdataPositionChar: "\\c",
      format: false,
      indentBy: "  ",
      supressEmptyNode: false,
      tagValueProcessor: a => {
        return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
      },// default is a=>a
      attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})// default is a=>a
  };
  
    const j2x = new J2X(defaultOptions)
    let xml = j2x.parse(cklJs)
    return (xml)

  }
  catch (e) {
    throw (e)
  }
}

/**
 * Create an Asset
 *
 * body Asset  (optional)
 * returns Asset
 **/
exports.createAsset = async function(body, projection, userObject) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.CREATE, null, body, projection, userObject)
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Delete an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns Asset
 **/
exports.deleteAsset = async function(assetId) {
  try {
    let sqlDelete = `DELETE FROM stigman.assets where assetId = :assetId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [assetId], options)
    await connection.close()
    return
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return an Asset
 *
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.getAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      assetId: assetId
    }, elevate, userObject)
  return (rows[0])
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of Assets accessible to the user
 *
 * packageId Integer Selects Assets mapped to a Package (optional)
 * benchmarkId String Selects Assets mapped to a STIG (optional)
 * dept String Selects Assets exactly matching a department string (optional)
 * returns List
 **/
exports.getAssets = async function(packageId, benchmarkId, dept, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      packageId: packageId,
      benchmarkId: benchmarkId,
      dept: dept
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the Checklist for the supplied Asset and STIG
 *
 * assetId Integer A path parameter that indentifies an Asset
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getChecklistByAssetStig = async function(assetId, benchmarkId, revisionStr, format, elevate, userObject) {
  try {
    switch (format) {
      case 'json':
        let rows = await this.queryChecklist(null, {
          assetId: assetId,
          benchmarkId: benchmarkId,
          revisionStr: revisionStr
        }, elevate, userObject)
        return (rows)
      case 'ckl':
        let xml = await this.cklFromAssetStig(assetId,benchmarkId, revisionStr, elevate, userObject)
        return (xml)
    }
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Merge updates to an Asset
 *
 * body Asset  (optional)
 * projection
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.updateAsset = async function( assetId, body, projection, userObject ) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.UPDATE, assetId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

/**
 * Replace an Asset
 *
 * body Asset
 * projection
 * assetId Integer A path parameter that indentifies an Asset
 * returns AssetDetail
 **/
exports.replaceAsset = async function( assetId, body, projection, userObject ) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.REPLACE, assetId, body, projection, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}