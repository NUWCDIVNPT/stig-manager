'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')
const J2X = require("fast-xml-parser").j2xParser
const he = require('he');

let _this = this

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function (inProjection = [], inPredicates = {}, elevate = false, userObject) {
  let connection
  try {
    let context
    if (elevate) {
      context = dbUtils.CONTEXT_ALL
    }
    else {
      switch (userObject.accessLevel) {
        case 3:
          context = dbUtils.CONTEXT_ALL
          break
        case 2:
          context = dbUtils.CONTEXT_DEPT
          break
        case 1:
          context = dbUtils.CONTEXT_USER
          break
      }
    }

    let columns = [
      'a.assetId',
      'a.name',
      `json_object (
        'deptId', d.deptId,
        'name', d.name
      ) as "dept"`,
      `json_object (
        'packageId', p.packageId,
        'name', d.name
      ) as "package"`,
      'a.ip',
      'a.nonnetwork'
    ]
    let joins = [
      'asset a',
      'left join department d on a.deptId = d.deptId',
      'left join package p on a.packageId = p.packageId',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ]

    // PROJECTIONS
    if (inProjection.includes('adminStats')) {
      columns.push(`json_object(
        'stigCount', COUNT(distinct sa.saId),
        'stigAssignedCount', COUNT(distinct usa.saId)
        ) as "adminStats"`)
    }
    if (inProjection.includes('stigReviewers') && context !== dbUtils.CONTEXT_USER) {
      // A bit more complex than the Oracle query because we can't use nested json_arrayagg's
      columns.push(`(select
        json_arrayagg(byStig.stigAssetUsers) as stigReviewers 
      from
        (select
          json_object('benchmarkId', r.benchmarkId, 'reviewers',
          -- empty array on null handling 
          case when count(r.reviewers) > 0 then json_arrayagg(r.reviewers) else json_array() end ) as stigAssetUsers
        from
        (select
          sa.benchmarkId,
          -- if no user, return null instead of object with null property values
          case when ud.userId is not null then
            json_object(
              'userId', ud.userId, 
              'username', ud.username, 
              'dept', json_object(
                'deptId', d.deptId,
                'name', d.name
              )
            ) 
          else NULL end as reviewers
          FROM 
            stig_asset_map sa
            left join user_stig_asset_map usa on sa.saId = usa.saId
            left join user_data ud on usa.userId = ud.userId
            left join department d on ud.deptId = d.deptId
          WHERE
          sa.assetId = a.assetId) as r
        group by r.benchmarkId) as byStig) as "stigReviewers"`)
    }
    if ( inProjection.includes('reviewers') && context !== dbUtils.CONTEXT_USER) {
      // This projection is only available for endpoint /stigs/{benchmarkId}/assets
      // Subquery relies on predicate :benchmarkId being set
      columns.push(`(select
          case when count(u.userId > 0) then json_arrayagg(
          -- if no user, return null instead of object with null property values
          case when u.userId is not null then json_object('userId', u.userId, 'username', u.username, 'dept', u.dept) else NULL end) 
          else json_array() end as reviewers
        FROM 
          stig_asset_map sa
          left join user_stig_asset_map usa on sa.saId = usa.saId
          left join user u on usa.userId = u.userId
        WHERE
          sa.assetId = a.assetId and sa.benchmarkId = :benchmarkId) as "reviewers"`)
    }
    if (inProjection.includes('stigs')) {
      //TODO: If benchmarkId is a predicate in main query, this incorrectly only shows that STIG
      joins.push('left join current_rev cr on sa.benchmarkId=cr.benchmarkId')
      joins.push('left join stig st on cr.benchmarkId=st.benchmarkId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when cr.benchmarkId is not null then 
                json_object(
                  'benchmarkId', cr.benchmarkId, 
                  'lastRevisionStr', concat('V', cr.version, 'R', cr.release), 
                  'lastRevisionDate', cr.benchmarkDateSql,
                  'title', st.title)
              else null end 
        order by cr.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
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
      predicates.statements.push('a.packageId = :packageId')
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
    sql += ' group by a.assetId, a.name, a.deptId, a.packageId, a.ip, a.nonnetwork, p.packageId, p.name, d.deptId, d.name'
    sql += ' order by a.name'
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let [rows] = await connection.query(sql, predicates.binds)
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.addOrUpdateAsset = async function (writeAction, assetId, body, projection, elevate, userObject) {
  let connection
  try {
    // CREATE: assetId will be null
    // REPLACE/UPDATE: assetId is not null

    // Extract or initialize non-scalar properties to separate variables
    let { stigReviewers, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('nonnetwork')) {
      assetFields.nonnetwork = assetFields.nonnetwork ? 1 : 0
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    await connection.query('START TRANSACTION');

    // Process scalar properties
    let binds = { ...assetFields}

    if (writeAction === dbUtils.WRITE_ACTION.CREATE) {
    // INSERT into assets
    let sqlInsert =
      `INSERT INTO
          asset
          (name, ip, deptId, packageId, nonnetwork)
        VALUES
          (:name, :ip, :deptId, :packageId, :nonnetwork)`
      let [rows] = await connection.query(sqlInsert, binds)
      assetId = rows.insertId
    }
    else if (writeAction === dbUtils.WRITE_ACTION.UPDATE || writeAction === dbUtils.WRITE_ACTION.REPLACE) {
      if (Object.keys(binds).length > 0) {
        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              asset
            SET
              ?
            WHERE
              assetId = ?`
        await connection.execute(sqlUpdate, [assetFields, assetId])
      }
    }
    else {
      throw('Invalid writeAction')
    }

    // Process stigReviewers, spec requires for CREATE/REPLACE not for UPDATE
    if (stigReviewers) {
      let binds = {
        stigAsset: [],
        userStigAsset: []
      }
      if (writeAction !== dbUtils.WRITE_ACTION.CREATE) {
        let sqlDeleteBenchmarks = 'DELETE FROM stig_asset_map WHERE assetId = ?'
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.execute(sqlDeleteBenchmarks, [assetId])
      }
      // Push any bind values
      stigReviewers.forEach( e => {
        binds.stigAsset.push([e.benchmarkId, assetId])
          e.userIds.forEach(userId => {
            binds.userStigAsset.push([userId, e.benchmarkId, assetId])
          })
      })
      if (binds.stigAsset.length > 0) {
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
        INSERT INTO 
          stigman.stig_asset_map (benchmarkId, assetId)
        VALUES
          ?`
        await connection.query(sqlInsertBenchmarks, [binds.stigAsset])
        if (binds.userStigAsset.length > 0) {
          // INSERT into user_stig_asset_map 
          let sqlInsertUserStigAsset = `INSERT INTO 
            stigman.user_stig_asset_map 
              (userId, benchmarkId, assetId)
            VALUES 
              ?`
          await connection.query(sqlInsertUserStigAsset, [binds.userStigAsset])
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
      await connection.release()
    }
  }

  // Fetch the new or updated Asset for the response
  try {
    let row = await _this.getAsset(assetId, projection, elevate, userObject)
    return row
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }  
}

exports.queryChecklist = async function (inProjection, inPredicates, elevate, userObject) {
  let connection
  try {
    let context
    if (userObject.accessLevel === 3 || elevate) {
      context = dbUtils.CONTEXT_ALL
    } else if (userObject.accessLevel === 2) {
      context = dbUtils.CONTEXT_DEPT
    } else {
      context = dbUtils.CONTEXT_USER
    }

    let columns = [
      ':assetId as "assetId"',
      'g.groupId',
      'r.ruleId',
      'g.title as "groupTitle"',
      'r.title as "ruleTitle"',
      'r.severity',
      `CASE WHEN scap.ruleId is null THEN 0 ELSE 1 END as "autoCheckAvailable"`,
      `result.api as "result"`,
      `review.autoResult as "autoResult"`,
      `status.api as "status"`,
      `CASE
        WHEN review.ruleId is null
        THEN 0
        ELSE
          CASE WHEN review.resultId != 4
          THEN
            CASE WHEN review.resultComment != ' ' and review.resultComment is not null
              THEN 1
              ELSE 0 END
          ELSE
            CASE WHEN review.actionId is not null and review.actionComment is not null and review.actionComment != ' '
              THEN 1
              ELSE 0 END
          END
      END as "reviewComplete"`
    ]
    let joins = [
      'current_rev rev',
      'left join rev_group_map rg on rev.revId = rg.revId',
      'left join `group` g on rg.groupId=g.groupId',
      'left join rev_group_rule_map rgr on rg.rgId=rgr.rgId',
      'left join rule r on rgr.ruleId=r.ruleId',
      // 'left join severity_cat_map sc on r.severity=sc.severity',
      'left join review on r.ruleId = review.ruleId and review.assetId = :assetId',
      'left join result on review.resultId=result.resultId',
      'left join status on review.statusId=status.statusId',
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
      joins.splice(0, 1, 'revision rev')
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
    sql += `\norder by substring(g.groupId from 3) + 0`
  
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    let formatted = connection.format(sql, predicates.binds)

    // let [rows] = await connection.query(sql, predicates.binds)
    let [rows] = await connection.query({
      sql: sql, 
      typeCast: (field, next) => {
        if ((field.type === "BIT") && (field.length === 1)) {
          let bytes = field.buffer() || [0];
          return( bytes[ 0 ] === 1 );
        }
        if (field.name === 'autoResult' || field.name === 'reviewComplete' || field.name === 'autoCheckAvailable') {
          return field.string() === '1'
        }
        return next()
      },
      values: predicates.binds
    })
    return (rows)
  }
  catch (err) {
    throw err
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.cklFromAssetStig = async function cklFromAssetStig (assetId, benchmarkId, revisionStr, elevate, userObject) {
  let connection
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
      sqlGetBenchmarkId = `select
        cr.benchmarkId, 
        s.title, 
        cr.revId, 
        cr.description, 
        cr.version, 
        cr.release, 
        cr.benchmarkDate
      from
        current_rev cr 
        left join stig s on cr.benchmarkId = s.benchmarkId
      where
        cr.benchmarkId = ?`
    }
    else {
      sqlGetBenchmarkId = `select
        r.benchmarkId,
        s.title,
        r.description,
        r.version,
        r.release,
        r.benchmarkDate
      from 
        stig s 
        left join revision r on s.benchmarkId=r.benchmarkId
      where
        r.revId = ?`  
    }

    let sqlGetAsset = "select name, ip from asset where assetId = ?"
    let sqlGetChecklist =`SELECT 
      g.groupId,
      r.severity,
      g.title as "groupTitle",
      r.ruleId,
      r.title as "ruleTitle",
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl as "result",
      review.resultComment,
      action.en as "action",
      review.actionComment,
      MAX(c.content) as "checkContent",
      MAX(fix.text) as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_map rg on rev.revId = rg.revId 
      left join \`group\` g on rg.groupId = g.groupId 

      left join rev_group_rule_map rgr on rg.rgId = rgr.rgId 
      left join rule r on rgr.ruleId = r.ruleId 
      left join severity_cat_map sc on r.severity = sc.severity 
      
      left join rev_group_rule_cci_map rgrcc on rgr.rgrId = rgrcc.rgrId 

      left join rev_group_rule_check_map rgrc on rgr.rgrId = rgrc.rgrId
      left join \`check\` c on rgrc.checkId = c.checkId

      left join rev_group_rule_fix_map rgrf on rgr.rgrId = rgrf.rgrId
      left join fix on rgrf.fixId = fix.fixId

      left join review on r.ruleId = review.ruleId and review.assetId = ?
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 
      left join action on review.actionId = action.actionId                                     

    WHERE
      rev.revId = ?
    GROUP BY
      g.groupId,
      r.severity,
      g.title,
      r.ruleId,
      r.title,
      r.weight,
      r.version,
      r.vulnDiscussion,
      r.iaControls,
      r.falsePositives,
      r.falseNegatives,
      r.documentable,
      r.mitigations,
      r.potentialImpacts,
      r.thirdPartyTools,
      r.mitigationControl,
      r.responsibility,
      r.severityOverrideGuidance,
      result.ckl,
      review.resultComment,
      action.en,
      review.actionComment
    order by
      substring(g.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // ASSET
    let [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    cklJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset[0].name
    cklJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset[0].ip

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    // Calculate revId
    let resultGetBenchmarkId, revId
    if (revisionStr === 'latest') {
      ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
      revId = resultGetBenchmarkId[0].revId
    }
    else {
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      revId =  `${benchmarkId}-${results[1]}-${results[2]}`
      ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
    }

    let stig = resultGetBenchmarkId[0]
    let siDataRefs = [
      { SID_NAME: 'version', SID_DATA: stig.version },
      { SID_NAME: 'classification' },
      { SID_NAME: 'customname' },
      { SID_NAME: 'stigid', SID_DATA: stig.benchmarkId },
      { SID_NAME: 'description', SID_DATA: stig.description },
      { SID_NAME: 'filename', SID_DATA: 'stig-manager-oss' },
      { SID_NAME: 'releaseinfo', SID_DATA: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`},
      { SID_NAME: 'title', SID_DATA: stig.title },
      { SID_NAME: 'uuid', SID_DATA: '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
      { SID_NAME: 'notice', SID_DATA: 'terms-of-use' },
      { SID_NAME: 'source', }
    ]
    let siDataArray = cklJs.CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    siDataRefs.forEach(siDatum => {
      siDataArray.push(siDatum)
    })

    // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
    let [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])

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
      ['Security_Override_Guidance', 'severityOverrideGuidance' ] 
      // STIGViewer bug requires using Security_Override_Guidance instead of Severity_Override_Guidance
    ]

    let vulnArray = cklJs.CHECKLIST.STIGS.iSTIG.VULN
    resultGetChecklist.forEach( r => {
      let vulnObj = {
        STIG_DATA: [],
        STATUS: r.result || 'Not_Reviewed',
        FINDING_DETAILS: r.resultComment,
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
      if (r.ccis) {
        let ccis = r.ccis.split(',')
        ccis.forEach( cci=> {
          vulnObj.STIG_DATA.push({
            VULN_ATTRIBUTE: 'CCI_REF',
            ATTRIBUTE_DATA: `CCI-${cci}`
          })
        })
        vulnArray.push(vulnObj)
      }
    })

    let defaultOptions = {
      attributeNamePrefix : "@_",
      attrNodeName: "@", //default is false
      textNodeName : "#text",
      ignoreAttributes : true,
      cdataTagName: "__cdata", //default is false
      cdataPositionChar: "\\c",
      format: true,
      indentBy: "  ",
      supressEmptyNode: false,
      tagValueProcessor: a => {
        return a ? he.encode(a.toString(), { useNamedReferences: false}) : a 
      },// default is a=>a
      attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})// default is a=>a
  };
  
    const j2x = new J2X(defaultOptions)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!--STIG Manager :: 3.0-->\n'
    xml += j2x.parse(cklJs)
    return (xml)

  }
  catch (e) {
    throw (e)
  }
  finally {
    if (typeof connection !== 'undefinied') {
      await connection.close()
    }
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
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.CREATE, null, body, projection, elevate, userObject)
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
    let rows = await _this.queryAssets(projection, {assetId: assetId}, elevate, userObject)
    let sqlDelete = `DELETE FROM asset where assetId = ?`
    await dbUtils.pool.query(sqlDelete, [assetId])
    return (rows[0])
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
    let rows = await _this.queryAssets(projection, {
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
    let rows = await _this.queryAssets(projection, {
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


exports.getAssetsByBenchmarkId = async function( benchmarkId, projection, elevate, userObject) {
  try {
    let rows = await _this.queryAssets(projection, {
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
        let rows = await _this.queryChecklist(null, {
          assetId: assetId,
          benchmarkId: benchmarkId,
          revisionStr: revisionStr
        }, elevate, userObject)
        return (rows)
      case 'ckl':
        let xml = await _this.cklFromAssetStig(assetId,benchmarkId, revisionStr, elevate, userObject)
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
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.UPDATE, assetId, body, projection, elevate, userObject)
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
    let row = await _this.addOrUpdateAsset(dbUtils.WRITE_ACTION.REPLACE, assetId, body, projection, elevate, userObject)
    return (row)
  } 
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}