'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he');
const ROLE = require('../../utils/appRoles')

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection, inPredicates, elevate, userObject) {
  let context
  if (elevate) {
    context = dbUtils.CONTEXT_ALL
  }
  else {
    switch (userObject.role.roleId) {
      case ROLE.COMMAND:
        context = dbUtils.CONTEXT_ALL
        break
      case ROLE.DEPT:
        context = dbUtils.CONTEXT_DEPT
        break
      case ROLE.REVIEWER:
        context = dbUtils.CONTEXT_USER
        break
      case ROLE.GUEST:
        context = dbUtils.CONTEXT_GUEST
        break;
    }
  }

  let columns = [
    'a.ASSETID as "assetId"',
    'a.NAME as "name"',
    `json_object (
      KEY 'deptId' VALUE d.deptId,
      KEY 'name' VALUE d.name
    ) as "dept"`,
    'a.IP as "ip"',
    'a.NONNETWORK as "nonnetwork"'
  ]
  let joins = [
    'asset a',
    'left join department d on a.deptId = d.deptId',
    'left join asset_package_map ap on a.assetId=ap.assetId',
    'left join package p on ap.packageId=p.packageId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
    'left join user_stig_asset_map usa on sa.saId = usa.saId'
  ]

  // PROJECTIONS
  if (inProjection && inProjection.includes('packages')) {
    columns.push(`'[' || 
      listagg( distinct
        json_object(
          KEY 'packageId' VALUE p.packageId,
          KEY 'name' VALUE p.name
          ABSENT ON NULL
        ),','
      ) within group (order by p.name)
    || ']' as "packages"`)
  }
  if (inProjection && inProjection.includes('adminStats')) {
    columns.push(`json_object(
      KEY 'stigCount' VALUE COUNT(Distinct sa.saId),
      KEY 'stigAssignedCount' VALUE COUNT(Distinct usa.saId)
      ) as "adminStats"`)
  }
  if (inProjection && inProjection.includes('stigReviewers')) {
    columns.push(`(select
          replace(
              replace(
                  json_arrayagg(
                      json_object(
                          KEY 'benchmarkId' VALUE sa.benchmarkId,
                          KEY 'reviewers' VALUE json_arrayagg(
                              CASE WHEN u.userId IS NOT NULL THEN  json_object(
                                  KEY 'userId' VALUE u.userid,
                                  KEY 'username' VALUE u.username,
                                  KEY 'dept' VALUE json_object (
                                    KEY 'deptId' VALUE d.deptId,
                                    KEY 'name' VALUE d.name)
                                  ABSENT ON NULL
                              ) ELSE NULL END
                          ) FORMAT JSON
                      )
                  )
              , '"{', '{')
          , '}"', '}')
      FROM 
      stig_asset_map sa
      left join user_stig_asset_map usa on sa.saId = usa.saId
      left join user_data u on usa.userId = u.userid
      left join department d on u.deptId = d.deptId
      WHERE sa.assetId = a.assetId
      group by sa.benchmarkId) as "stigReviewers"`)
  }
  if (inProjection && inProjection.includes('reviewers')) {
    // This projection is specified by /stigs/{benchmarkId}/assets}
    // Subquery relies on :benchmarkId to be bound
    columns.push(`(select
        replace(
          replace(
            json_arrayagg(
              CASE WHEN u.id IS NOT NULL THEN json_object(
                  KEY 'userId' VALUE u.id,
                  KEY 'username' VALUE u.name
                  ABSENT ON NULL
              ) ELSE NULL END
            )
          , '"{', '{')
        , '}"', '}')  
      FROM 
        stig_asset_map sa
        left join user_stig_asset_map usa on sa.saId = usa.saId
        left join user_data u on usa.userId = u.id
      WHERE sa.assetId = a.assetId and sa.benchmarkId = :benchmarkId
      group by sa.benchmarkId) as "reviewers"`)
  }
  if (inProjection && inProjection.includes('stigs')) {
    joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
    joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
    columns.push(`'[' || 
      listagg ( distinct
        json_object(
          KEY 'benchmarkId' VALUE cr.benchmarkId, 
          KEY 'lastRevisionStr' VALUE CASE 
            WHEN cr.benchmarkId IS NOT NULL THEN 'V'||cr.version||'R'||cr.release END,
          KEY 'lastRevisionDate' VALUE CASE
            WHEN cr.benchmarkId IS NOT NULL THEN cr.benchmarkDateSql END,
          KEY 'title' VALUE st.title ABSENT ON NULL
        ),','
      ) within group (order by cr.benchmarkId)
      || ']' as "stigs"`)
  }

  // PREDICATES
  let predicates = {
    statements: [],
    binds: {}
  }
  if (inPredicates.assetId) {
    predicates.statements.push('a.assetId = :assetId')
    predicates.binds.assetId = inPredicates.assetId
  }
  if (inPredicates.packageId) {
    predicates.statements.push('ap.packageId = :packageId')
    predicates.binds.packageId = inPredicates.packageId
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('sa.benchmarkId = :benchmarkId')
    predicates.binds.benchmarkId = inPredicates.benchmarkId
  }
  if (inPredicates.deptId) {
    predicates.statements.push('a.deptId = :deptId')
    predicates.binds.deptId = inPredicates.deptId
  }
  if (context == dbUtils.CONTEXT_DEPT) {
    predicates.statements.push('a.deptId = :deptId')
    predicates.binds.deptId = userObject.dept.deptId
  } 
  else if (context == dbUtils.CONTEXT_USER) {
    predicates.statements.push('usa.userId = :userId')
    predicates.binds.userId = userObject.userId

  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' group by a.assetId, a.name, a.deptId, a.ip, a.nonnetwork, d.deptId, d.name'
  sql += ' order by a.name'
  
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // Process boolean and JSON fields for each row
    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      record.nonnetwork = record.nonnetwork == 1 ? true : false
      record.dept = JSON.parse(record.dept)
      if (inProjection && inProjection.includes('packages')) {
       // Check for "empty" arrays 
        record.packages = record.packages == '[{}]' ? [] : JSON.parse(record.packages) || []
      }
      if (inProjection && inProjection.includes('stigs')) {
        record.stigs = record.stigs == '[{}]' ? [] : JSON.parse(record.stigs) || []
      }
      if (inProjection && inProjection.includes('adminStats')) {
        record.adminStats = JSON.parse(record.adminStats) || {}
      }
      if (inProjection && inProjection.includes('stigReviewers')) {
        record.stigReviewers = JSON.parse(record.stigReviewers) || []
      }
      if (inProjection && inProjection.includes('reviewers')) {
        record.reviewers = JSON.parse(record.reviewers) || []
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }
}

exports.addOrUpdateAsset = async function (writeAction, assetId, body, projection, elevate, userObject) {
  let connection // available to try, catch, and finally blocks
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract non-scalar properties to separate variables
    let { stigReviewers, benchmarkIds, packageIds, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('nonnetwork')) {
      assetFields.nonnetwork = assetFields.nonnetwork ? 1 : 0
    }
    // Connect to Oracle
    let options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    connection = await oracledb.getConnection()

    // Process scalar properties
    let binds = { ...assetFields }
    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
    // INSERT into asset
    let sqlInsert =
      `INSERT INTO
          asset
          (name, ip, deptId, nonnetwork)
        VALUES
          (:name, :ip, :deptId, :nonnetwork)
        RETURNING
          assetId into :assetId`
      binds.assetId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
      let result = await connection.execute(sqlInsert, binds, options)
      assetId = result.outBinds.assetId[0]
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into asset
        let sqlUpdate =
          `UPDATE
              asset
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
    if (packageIds) {
      if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        // DELETE from asset_package_map
        let sqlDeletePackages = 'DELETE FROM asset_package_map where assetId = :assetId'
        await connection.execute(sqlDeletePackages, [assetId])
      }
      if (packageIds.length > 0) {
        let sqlInsertPackages = `
          INSERT INTO 
            asset_package_map (packageId,assetId)
          VALUES (:packageId, :assetId)`      
        let binds = packageIds.map(i => [i, assetId])
        // INSERT into asset_package_map
        await connection.executeMany(sqlInsertPackages, binds)
      }
    }

    // Process stigReviewers, spec requires for CREATE/REPLACE not for UPDATE
    // In all cases, the property value replaces the current mappings
    if (stigReviewers) {
      binds = {
        stigAsset: [],
        userStigAsset: []
      }
      if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        let sqlDeleteBenchmarks = 'DELETE FROM stig_asset_map WHERE assetId = :assetId'
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.execute(sqlDeleteBenchmarks, [assetId])
      }
      for (const stigReview of stigReviewers) {
        binds.stigAsset.push([stigReview.benchmarkId, assetId])
        for (const userId of stigReview.userIds) {
          binds.userStigAsset.push([userId, stigReview.benchmarkId, assetId])
        }
      }
      if (binds.stigAsset.length > 0) {
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
        INSERT INTO 
          stig_asset_map (benchmarkId, assetId)
        VALUES
          (:benchmarkId, :assetId)`
        let result = await connection.executeMany(sqlInsertBenchmarks, binds.stigAsset, options)
        if (binds.userStigAsset.length > 0) {
          // INSERT into user_stig_asset_map 
          let sqlInsertUserStigAsset = `INSERT INTO 
            user_stig_asset_map 
              (userId, saId)
            VALUES 
              (:userId, (SELECT saId from stig_asset_map WHERE benchmarkId=:benchmarkId and assetId=:assetId))`
          let result = await connection.executeMany(sqlInsertUserStigAsset, binds.userStigAsset, options)
        }
      }
    }
    // Commit the changes
    await connection.commit()
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

  // Fetch the new or updated Asset for the response
  try {
    let row = await this.getAsset(assetId, projection, elevate, userObject)
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
    'r.RULEID as "ruleId"',
    'r.TITLE as "ruleTitle"',
    'g.GROUPID as "groupId"',
    'g.TITLE as "groupTitle"',
    'r.SEVERITY as "severity"',
    `state.abbr as "result"`,
    `status.statusStr as "status"`,
    `review.autoState as "autoResult"`,
    `CASE WHEN ra.raId is null THEN 0 ELSE 1 END as "hasAttachment"`,
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
    END as "complete"`,
    `CASE
      WHEN scap.ruleId is null
      THEN 'Manual'
      ELSE 'SCAP'
    END as "checkType"`
  ]
  let joins = [
    'current_revs rev',
    'left join rev_group_map rg on rev.revId = rg.revId',
    'left join groups g on rg.groupId=g.groupId',
    'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
    'left join rule r on rgr.ruleId=r.ruleId',
    'left join severity_cat_map sc on r.severity=sc.severity',
    'left join review review on r.ruleId = review.ruleId and review.assetId = :assetId',
    'left join states state on review.stateId=state.stateId',
    'left join statuses status on review.statusId=status.statusId',
    'left join review_artifact_map ra on (ra.assetId=review.assetId and ra.ruleId=review.ruleId)',
    'left join (SELECT distinct ruleId FROM	rule_oval_map) scap on r.ruleId=scap.ruleId'
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
    predicates.statements.push('rev.benchmarkId = :benchmarkId')
    predicates.binds.benchmarkId = inPredicates.benchmarkId
  }
  if (inPredicates.revisionStr !== 'latest') {
    joins.splice(0, 1, 'revisions rev')
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
    for (const row of result.rows) {
      row.autoResult = row.autoResult === 1 ? true : false
      row.hasAttachment = row.hasAttachment === 1 ? true : false
      row.complete = row.complete === 1 ? true : false
    }
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
      sqlGetBenchmarkId = "select cr.benchmarkId, s.title, cr.revId, cr.description, cr.version, cr.release, cr.benchmarkDate from current_revs cr left join stigs s on cr.benchmarkId = s.benchmarkId where cr.benchmarkId = :1"
    }
    else {
      sqlGetBenchmarkId = "select r.benchmarkId,s.title, r.description, r.version, r.release, r.benchmarkDate from stigs s left join revisions r on s.benchmarkId=r.benchmarkId where r.revId = :1"
    }
    let sqlGetAsset = "select name, ip from asset where assetId = :assetId"
    let sqlGetCCI = "select controlnumber from rule_control_map where ruleId = :ruleId and controltype='CCI'"
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
      r.severityOverrideGuidance as "severityOverrideGuidance",
      NVL(rev.stateId,0) as "stateId",
      rev.stateComment as "stateComment",
      act.action as "action",
      rev.actionComment as "actionComment",
      to_char(rev.ts,'yyyy-mm-dd hh24:mi:ss') as "ts",
      listagg(rulectl.controlnumber, ',') within group (order by rulectl.controlnumber) as "ccis"
    from
      asset s
      left join rev_profile_group_map rpg on s.profile=rpg.profile
      left join groups g on rpg.groupId=g.groupId
      left join rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
      left join rev_group_rule_map rgr on rg.rgId=rgr.rgId
      left join rule r on rgr.ruleId=r.ruleId
      left join rule_check_map rc on r.ruleId=rc.ruleId
      left join rule_control_map rulectl on (r.ruleId = rulectl.ruleId and rulectl.controltype='CCI')
      left join check c on rc.checkId=c.checkId
      left join rule_fix_map rf on r.ruleId=rf.ruleId
      left join fix f on rf.fixId=f.fixId
      left join review rev on (r.ruleId=rev.ruleId and s.assetId=rev.assetId)
      left join action act on act.actionId=rev.actionId
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
      r.severityOverrideGuidance,
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
      ['Severity_Override_Guidance', 'severityOverrideGuidance' ]
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
exports.createAsset = async function(body, projection, elevate, userObject) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
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
exports.deleteAsset = async function(assetId, projection, elevate, userObject) {
  try {
    let row = await this.queryAssets(projection, {assetId: assetId}, elevate, userObject)
    let sqlDelete = `DELETE FROM asset where assetId = :assetId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [assetId], options)
    await connection.close()
    return (row)
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
exports.getAssets = async function(packageId, benchmarkId, deptId, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      packageId: packageId,
      benchmarkId: benchmarkId,
      deptId: deptId
    }, elevate, userObject)
    return (rows)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


exports.getAssetsByBenchmarkId = async function( benchmarkId, projection, elevate, userObject) {
  try {
    let rows = await this.queryAssets(projection, {
      benchmarkId: benchmarkId,
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
exports.updateAsset = async function( assetId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.UPDATE, assetId, body, projection, elevate, userObject)
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
exports.replaceAsset = async function( assetId, body, projection, elevate, userObject ) {
  try {
    let row = await this.addOrUpdateAsset(dbUtils.WRITE_ACTION.REPLACE, assetId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}