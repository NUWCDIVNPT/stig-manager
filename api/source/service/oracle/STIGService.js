'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates ) {
  let columns = [
    's.benchmarkId as "benchmarkId"',
    's.TITLE as "title"',
    `'V' || cr.version || 'R' || cr.release as "lastRevisionStr"`,
    `to_char(cr.benchmarkDateSql,'yyyy-mm-dd') as "lastRevisionDate"`
  ]
  let joins = [
    'stig s',
    'left join current_rev cr on s.benchmarkId = cr.benchmarkId'
  ]

  // NO PROJECTIONS DEFINED

  // PREDICATES
  let predicates = {
    statements: [],
    binds: []
  }
  if (inPredicates.title) {
    predicates.statements.push("s.title LIKE '%' || :title || '%'")
    predicates.binds.push( inPredicates.title )
  }
  if (inPredicates.benchmarkId) {
    predicates.statements.push('s.benchmarkId = :benchmarkId')
    predicates.binds.push( inPredicates.benchmarkId )
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  sql += ' order by s.benchmarkId'

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


/**
Generalized queries for Groups
**/
exports.queryGroups = async function ( inProjection, inPredicates ) {
  let columns = [
    'g.groupId as "groupId"',
    'g.title as "title"',
  ]

  let joins
  let predicates = {
    statements: [],
    binds: {}
  }
  
  predicates.statements.push('r.benchmarkId = :benchmarkId')
  predicates.binds.benchmarkId = inPredicates.benchmarkId
  
  if (inPredicates.revisionStr != 'latest') {
    joins = ['revision r']
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
    let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
    predicates.statements.push('r.revId = :revId')
    predicates.binds.revId = revId
  } else {
    joins = ['current_rev r']
  }
  
  joins.push('left join rev_group_map rg on r.revId = rg.revId')
  joins.push('left join groups g on rg.groupId = g.groupId')

  if (inPredicates.groupId) {
    predicates.statements.push('g.groupId = :groupId')
    predicates.binds.groupId = inPredicates.groupId
  }

  // PROJECTIONS
  if (inProjection && inProjection.includes('rules')) {
    joins.push('left join rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    joins.push('left join rule r on rgr.ruleId = r.ruleId' )
    columns.push(`json_arrayagg (
      json_object(
        KEY 'ruleId' VALUE r.ruleId, 
        KEY 'version' VALUE r.version, 
        KEY 'title' VALUE r.title, 
        KEY 'severity' VALUE r.severity ABSENT ON NULL
      )
    ) as "rules"`)
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  if (inProjection && inProjection.includes('rules')) {
    sql += "\nGROUP BY g.groupId, g.title\n"
  }  
  sql += ` order by DECODE(substr(g.groupId,1,2),'V-',lpad(substr(g.groupId,3),6,'0'),g.groupId) asc`

  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()
    if (inProjection && inProjection.includes('rules')) {
      // Post-process each row, unfortunately.
      // * Oracle doesn't support a JSON type, so we parse string values from 'rules' into objects
      for (let x = 0, l = result.rows.length; x < l; x++) {
        let record = result.rows[x]
        // Handle packages
        if (record.rules) {
        // Check for "empty" arrays 
          record.rules = record.rules == '[{}]' ? [] : JSON.parse(record.rules)
        }
      }
    }
    return (result.rows)
  }
  catch (err) {
    throw err
  }  
}


/**
Generalized queries for Rules associated with a STIG
For specific Rule, allow for projections with Check and Fixes
**/
exports.queryBenchmarkRules = async function ( benchmarkId, revisionStr, inProjection, inPredicates ) {
  let connection
  try {

    let columns = [
      'r.ruleId as "ruleId"',
      'r.title as "title"',
      'g.groupId as "groupId"',
      'g.title as "groupTitle"',
      'r.version as "version"',
      'r.severity as "severity"'
    ]

    let groupBy = [
      'rev.revId',
      'r.ruleId',
      'r.title',
      'g.groupId',
      'g.title',
      'r.version',
      'r.severity'
    ]

    let joins
    let predicates = {
      statements: [],
      binds: {}
    }
    
    // PREDICATES
    predicates.statements.push('rev.benchmarkId = :benchmarkId')
    predicates.binds.benchmarkId = benchmarkId
    
    if (revisionStr != 'latest') {
      joins = ['revision rev']
      let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
      let revId =  `${benchmarkId}-${results[1]}-${results[2]}`
      predicates.statements.push('rev.revId = :revId')
      predicates.binds.revId = revId
    } else {
      joins = ['current_rev rev']
    }
    
    if (inPredicates && inPredicates.ruleId) {
      predicates.statements.push('r.ruleId = :ruleId')
      predicates.binds.ruleId = inPredicates.ruleId
    }

    joins.push('left join rev_group_map rg on rev.revId = rg.revId')
    joins.push('left join groups g on rg.groupId = g.groupId')
    joins.push('left join rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    joins.push('left join rule r on rgr.ruleId = r.ruleId' )

    // PROJECTIONS
    // Include extra columns for Rules with details OR individual Rule
    if ( inProjection && inProjection.includes('details') ) {
      columns.push(
        'r.weight as "weight"',
        'r.vulnDiscussion as "vulnDiscussion"',
        'r.falsePositives as "falsePositives"',
        'r.falseNegatives as "falseNegatives"',
        'r.documentable as "documentable"',
        'r.mitigations as "mitigations"',
        'r.severityOverrideGuidance as "severityOverrideGuidance"',
        'r.potentialImpacts as "potentialImpacts"',
        'r.thirdPartyTools as "thirdPartyTools"',
        'r.mitigationControl as "mitigationControl"',
        'r.responsibility as "responsibility"',
        'r.iacontrols as "iacontrols"'
      )
      groupBy.push(
        'r.weight',
        'r.vulnDiscussion',
        'r.falsePositives',
        'r.falseNegatives',
        'r.documentable',
        'r.mitigations',
        'r.severityOverrideGuidance',
        'r.potentialImpacts',
        'r.thirdPartyTools',
        'r.mitigationControl',
        'r.responsibility',
        'r.iacontrols'
      )
    }

    if ( inProjection && inProjection.includes('cci') ) {
      columns.push(`(select
        json_arrayagg(
          json_object(
            KEY 'cci' VALUE cci.cci,
            KEY 'apAcronym' VALUE  cci.apAcronym,
            KEY 'control' VALUE  cr.textRefNist ABSENT ON NULL
          )
        ) 
        from
          rev_group_map rg
          left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
          left join rev_group_rule_cci_map rgrc on rgr.rgrId = rgrc.rgrId 
          left join cci cci on rgrc.cci = cci.cci
          left join cci_reference_map cr on cci.cci = cr.cci
        where
          rg.revId = rev.revId
          and rg.groupId = g.groupId 
          and rgr.ruleId = r.ruleId) as "ccis"`)
    }
    if ( inProjection && inProjection.includes('checks') ) {
      columns.push(`(select
        json_arrayagg(
          json_object(
            KEY 'checkId' VALUE rck.checkId,
            KEY 'content' VALUE convert(chk.content, 'UTF8') 
            ABSENT ON NULL returning VARCHAR2(32000)
          )
        returning VARCHAR2(32000))
        from
          rev_group_map rg
          left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
          left join rev_group_rule_check_map rck on rgr.rgrId = rck.rgrId
          left join checks chk on chk.checkId = rck.checkId
        where
          rg.revId = rev.revId
          and rg.groupId = g.groupId 
          and rgr.ruleId = r.ruleId) as "checks"`)
    }
    if ( inProjection && inProjection.includes('fixes') ) {
      columns.push(`(select
        json_arrayagg(
          json_object(
            KEY 'fixId' VALUE rf.fixId,
            KEY 'text' VALUE fix.text 
            ABSENT ON NULL returning VARCHAR2(32000)
          )
        returning VARCHAR2(32000) )
        from
          rev_group_map rg
          left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
          left join rev_group_rule_fix_map rf on rgr.rgrId = rf.rgrId
          left join fix on fix.fixId = rf.fixId
        where
          rg.revId = rev.revId
          and rg.groupId = g.groupId 
          and rgr.ruleId = r.ruleId) as "fixes"`)
    }


    // CONSTRUCT MAIN QUERY
    let sql = 'SELECT '
    sql+= columns.join(",\n")
    sql += ' FROM '
    sql+= joins.join(" \n")
    if (predicates.statements.length > 0) {
      sql += "\nWHERE " + predicates.statements.join(" and ")
    }
    if (inProjection && inProjection.includes('cci')) {
      sql += "\nGROUP BY " + groupBy.join(", ") + "\n"
    }  
    sql += ` order by r.ruleId`

    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }

    connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)

    for (let x = 0, l = result.rows.length; x < l; x++) {
      let record = result.rows[x]
      // parse projected columns
      if (inProjection && inProjection.includes('cci')) {
        record.ccis = record.ccis ? JSON.parse(record.ccis) : []
        record.ccis.sort()
      }
      if (inProjection && inProjection.includes('checks')) {
        record.checks = record.checks ? JSON.parse(record.checks) : []
        record.checks.sort((a,b) => {
          let c = 0
          if (a.checkId > b.checkId) { c= 1 }
          if (a.checkId < b.checkId) { c = -1 }
          return c
        })
      }
      if (inProjection && inProjection.includes('fixes')) {
        record.fixes = record.fixes ? JSON.parse(record.fixes) : []
        record.fixes.sort((a,b) => {
          let c = 0
          if (a.fixId > b.fixId) { c= 1 }
          if (a.fixId < b.fixId) { c = -1 }
          return c
        })
      }
      // remove keys with null value
      Object.keys(record).forEach(key => record[key] == null && delete record[key])
    }

    return (result.rows)
  }
  catch (err) {
    throw err
  }  
  finally {
    if (typeof connection !== 'undefinied') {
      await connection.close()
    }
  }
}


/**
Generalized queries for a single Rule, optionally with Check and Fix
**/
exports.queryRules = async function ( ruleId, inProjection ) {
  let columns = [
    'r.ruleId as "ruleId"',
    'r.title as "title"',
    'r.version as "version"',
    'r.severity as "severity"',
    'r.weight as "weight"',
    'r.vulnDiscussion as "vulnDiscussion"',
    'r.falsePositives as "falsePositives"',
    'r.falseNegatives as "falseNegatives"',
    'r.documentable as "documentable"',
    'r.mitigations as "mitigations"',
    'r.securityOverrideGuidance as "securityOverrideGuidance"',
    'r.potentialImpacts as "potentialImpacts"',
    'r.thirdPartyTools as "thirdPartyTools"',
    'r.mitigationControl as "mitigationControl"',
    'r.responsibility as "responsibility"'
]

  let joins = [
    'rule r'
  ]
  let predicates = {
    statements: [],
    binds: {}
  }
  
  // PREDICATES
  predicates.statements.push('r.ruleId = :ruleId')
  predicates.binds.ruleId = ruleId
  
  // PROJECTIONS
  // Include extra columns for Rules with details OR individual Rule
  if ( inProjection && inProjection.includes('cci') ) {
  }

  // CONSTRUCT MAIN QUERY
  let sql = 'SELECT '
  sql+= columns.join(",\n")
  sql += ' FROM '
  sql+= joins.join(" \n")
  if (predicates.statements.length > 0) {
    sql += "\nWHERE " + predicates.statements.join(" and ")
  }
  // if (inProjection && inProjection.includes('rules')) {
  //   sql += "\nGROUP BY g.groupId, g.title\n"
  // }  
  sql += ` order by r.ruleId`

  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }

    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

    // For JSON.stringify(), remove keys with null value
    result.rows.toJSON = function () {
      for (let x = 0, l = this.length; x < l; x++) {
        let record = this[x]
        Object.keys(record).forEach(key => record[key] == null && delete record[key])
      }
      return this
    }

    return (result.rows)
  }
  catch (err) {
    throw err
  }  
}

exports.insertManualBenchmark = async function (b) {
  function dmlObjectFromBenchmarkData (b) {
    let dml = {
      stig: {
        sql: "insert /*+ ignore_row_on_dupkey_index(stig(benchmarkId)) */ into stig (title, benchmarkId) VALUES (:title, :benchmarkId)",
      },
      revision: {
        sql: `insert /*+ ignore_row_on_dupkey_index(revision(revId)) */ into revision (
          revId, 
          benchmarkId, 
          version, 
          release, 
          benchmarkDate, 
          benchmarkDateSql, 
          status, 
          statusDate, 
          description
        ) VALUES (
          :revId, 
          :benchmarkId, 
          :version, 
          :release, 
          :benchmarkDate, 
          TO_DATE(:benchmarkDateSql,'yyyy-mm-dd'), 
          :status, 
          :statusDate, 
          :description
        )`,
      },
      groups: {
        sql: "INSERT /*+ ignore_row_on_dupkey_index(groups(groupId)) */ into groups (groupId, title) VALUES (:groupId, :title)",
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            groupId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            title: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255}
          }
        }
      },
      fix: {
        sql: "insert /*+ ignore_row_on_dupkey_index(fix(fixId)) */ into fix (fixId,text) VALUES (:fixId, :text)",
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            fixId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            text: {type: oracledb.DB_TYPE_CLOB, maxSize: 64000}
          }
        }

      },
      checks: {
        sql: "insert /*+ ignore_row_on_dupkey_index(checks(checkId)) */ into checks (checkId,content) VALUES (:checkId, :content)",
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            checkId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            content: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 32000}
          }
        }
      },
      rule: {
        sql: `
        insert  /*+ ignore_row_on_dupkey_index(rule(ruleId)) */ into rule (
          ruleId,
          version
          ,title
          ,severity
          ,weight
          ,vulnDiscussion
          ,falsePositives
          ,falseNegatives
          ,documentable
          ,mitigations
          ,severityOverrideGuidance
          ,potentialImpacts
          ,thirdPartyTools
          ,mitigationControl
          ,responsibility
          ,iaControls
        ) VALUES (
          :ruleId,
          :version
          ,:title
          ,:severity
          ,:weight
          ,:vulnDiscussion
          ,:falsePositives
          ,:falseNegatives
          ,:documentable
          ,:mitigations
          ,:severityOverrideGuidance
          ,:potentialImpacts
          ,:thirdPartyTools
          ,:mitigationControl
          ,:responsibility
          ,:iaControls
        )`,
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            ruleId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            version: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            title: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            severity: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            weight: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            vulnDiscussion: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 32000},
            falsePositives: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            falseNegatives: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            documentable: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
            mitigations: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            severityOverrideGuidance: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            potentialImpacts: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            thirdPartyTools: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
            mitigationControl: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 32000},
            responsibility: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            iacontrols: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255}
          }
        }

      },
      revGroupMap: {
        sql: "insert /*+ ignore_row_on_dupkey_index(rev_group_map(groupId, revId)) */ into rev_group_map (revId, groupId) VALUES (:revId, :groupId)",
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            revId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            groupId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
          }
        }
      },
      revGroupRuleMap: {
        sql: `insert /*+ ignore_row_on_dupkey_index(rev_group_rule_map(ruleId, rgId)) */ into rev_group_rule_map (rgId, ruleId) VALUES (
          (SELECT rgId from rev_group_map where revId = :revId and groupId = :groupId), :ruleId)`,
        binds: []
      },
      revGroupRuleCheckMap: {
        sql: `insert /*+ ignore_row_on_dupkey_index(rev_group_rule_check_map(rgrId, checkId)) */ into rev_group_rule_check_map (rgrId, checkId) VALUES (
          (SELECT
            rgrId
          from
            rev_group_rule_map 
          where
            rgId = (SELECT rgId from rev_group_map where revId = :revId and groupId = :groupId) 
            and ruleId = :ruleId
          ), 
          :checkId)`,
        binds: []
      },
      revGroupRuleFixMap: {
        sql: `insert /*+ ignore_row_on_dupkey_index(rev_group_rule_fix_map(rgrId, fixId)) */ into rev_group_rule_fix_map (rgrId, fixId) VALUES (
          (
            SELECT
              rgrId
            from
              rev_group_rule_map 
            where
              rgId = (SELECT rgId from rev_group_map where revId = :revId and groupId = :groupId) 
              and ruleId = :ruleId
          ),
          :fixId)`,
        binds: []
      },
      revGroupRuleCciMap: {
        sql: `insert /*+ ignore_row_on_dupkey_index(rev_group_rule_cci_map(rgrId, cci)) */ into rev_group_rule_cci_map (rgrId, cci) VALUES (
          (
            SELECT
              rgrId
            from
              rev_group_rule_map 
            where
              rgId = (SELECT rgId from rev_group_map where revId = :revId and groupId = :groupId) 
              and ruleId = :ruleId
          ),
          :cci)`,
        binds: []
      }
    }

    let {revision, ...benchmarkBinds} = b
    // TABLE: STIG
    dml.stig.binds = benchmarkBinds
    // TODO: handle SCAP benchmark, indicated by boolean property: scap
    delete dml.stig.binds.scap

    let {groups, ...revisionBinds} = revision
    delete revisionBinds.revisionStr
    revisionBinds.benchmarkId = benchmarkBinds.benchmarkId
    revisionBinds.revId = `${revisionBinds.benchmarkId}-${revisionBinds.version}-${revisionBinds.release}`
    revisionBinds.benchmarkDateSql = revisionBinds.benchmarkDate8601
    delete revisionBinds.benchmarkDate8601
    // TABLE: REVISION
    dml.revision.binds = revisionBinds
    delete dml.revision.binds.releaseInfo

    groups.forEach( group => {
      let {rules, ...groupBinds} = group
      delete groupBinds.description
      // TABLE: GROUPS
      dml.groups.binds.push(groupBinds)
      // TABLE: REV_GROUP_MAP
      dml.revGroupMap.binds.push({
          revId: revisionBinds.revId,
          groupId: group.groupId
      })
      rules.forEach(rule => {
        let {checks, fixes, idents, ...ruleBinds} = rule
        // TABLE: REV_GROUP_RULE_MAP
        dml.revGroupRuleMap.binds.push({
          revId: revisionBinds.revId,
          groupId: group.groupId,
          ruleId: rule.ruleId
        })
        // TABLE: RULE
        dml.rule.binds.push(ruleBinds)
        if (checks) { // Some STIGS (Network_Devices_STIG_V8R23, U_Traditional_Security_V1R2) have no checks (!)
          checks.forEach(check => {
            // TABLE: CHECKS
            dml.checks.binds.push(check)
            // TABLE: REV_GROUP_RULE_CHECK_MAP
            dml.revGroupRuleCheckMap.binds.push({
              revId: revisionBinds.revId,
              groupId: group.groupId,
              ruleId: rule.ruleId,
              checkId: check.checkId
            })
          })
        }

        fixes.forEach(fix => {
          // TABLE: FIXES
          dml.fix.binds.push(fix)
          // TABLE: REV_GROUP_RULE_FIX_MAP
          dml.revGroupRuleFixMap.binds.push({
            revId: revisionBinds.revId,
            groupId: group.groupId,
            ruleId: rule.ruleId,
            fixId: fix.fixId
          })
        })

        idents.forEach(ident => {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            // TABLE: REV_GROUP_RULE_CCI_MAP
            dml.revGroupRuleCciMap.binds.push({
              revId: revisionBinds.revId,
              groupId: group.groupId,
              ruleId: rule.ruleId,
              cci: ident.ident.replace('CCI-','')
            })
          }
        })
      })
    })

    return dml
  }

  let connection
  try {
    let result, hrstart, hrend, tableOrder, dml, stats = {}
    let totalstart = process.hrtime() 

    hrstart = process.hrtime() 
    dml = dmlObjectFromBenchmarkData(b)
    hrend = process.hrtime(hrstart)
    stats.dmlObject = `Built in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false
    }

    tableOrder = [
      'stig',
      'revision',
      'groups',
      'rule',
      'checks',
      'fix',
      'revGroupMap',
      'revGroupRuleMap',
      'revGroupRuleCheckMap',
      'revGroupRuleFixMap',
      'revGroupRuleCciMap'
    ]

    for (const table of tableOrder) {
      hrstart = process.hrtime()
      if (Array.isArray(dml[table].binds)) {
        if (dml[table].binds.length === 0) { continue }
        result = await connection.executeMany(dml[table].sql, dml[table].binds, dml[table].options || {})
      }
      else {
        result = await connection.execute(dml[table].sql, dml[table].binds, dml[table].options || {})
      }
      hrend = process.hrtime(hrstart)
      stats[table] = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }
    
    hrend = process.hrtime(totalstart)
    stats.totalTime = `Completed in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // await connection.rollback()
    await connection.commit()
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

/**
 * Deletes the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.deleteRevisionByString = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Deletes a STIG (*** and all revisions ***)
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.deleteStigById = async function(benchmarkId, userObject) {
  try {
    let row = await this.queryStigs( {benchmarkId: benchmarkId}, userObject)
    let sqlDelete = `DELETE FROM stig where benchmarkId = :benchmarkId`
    let connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    await connection.execute(sqlDelete, [benchmarkId], options)
    await connection.close()
    return (row)
  }
  catch (err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return data for the specified CCI
 *
 * cci String A path parameter that indentifies a CCI
 * returns List
 **/
exports.getCci = async function(cci, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of CCIs from a STIG revision
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getCcisByRevision = async function(benchmarkId, revisionStr, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the rules, checks and fixes for a Group from a specified revision of a STIG.
 * None
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * groupId String A path parameter that indentifies a Group
 * returns GroupObj
 **/
exports.getGroupByRevision = async function(benchmarkId, revisionStr, groupId, projection, userObject) {
  try {
    let rows = await this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr,
      groupId: groupId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the list of groups for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getGroupsByRevision = async function(benchmarkId, revisionStr, projection, userObject) {
  try {
    let rows = await this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr
    })
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return metadata for the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.getRevisionByString = async function(benchmarkId, revisionStr, userObject) {
  try {
    let ro = dbUtils.parseRevisionStr(revisionStr)
    let sql = 
    `SELECT
      ${ro.table_alias}.benchmarkId as "benchmarkId",
      'V' || ${ro.table_alias}.version || 'R' || ${ro.table_alias}.release as "revisionStr",
      ${ro.table_alias}.version as "version",
      ${ro.table_alias}.release as "release",
      ${ro.table_alias}.benchmarkDateSql as "benchmarkDate",
      ${ro.table_alias}.status as "status",
      ${ro.table_alias}.statusDate as "statusDate",
      ${ro.table_alias}.description as "description"
    FROM
      ${ro.table}  ${ro.table_alias}
    WHERE
      ${ro.table_alias}.benchmarkId = :benchmarkId
      ${ro.predicates}
    ORDER BY
      ${ro.table_alias}.benchmarkDateSql desc
    `
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let binds = [benchmarkId]
    if (ro.version) {
      binds.push(ro.version, ro.release)
    }
    let result = await connection.execute(sql, binds, options)
    await connection.close()
    return (result.rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of revisions for the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns List
 **/
exports.getRevisionsByBenchmarkId = async function(benchmarkId, userObject) {
  try {
    let sql = 
    `SELECT
      r.benchmarkId as "benchmarkId",
      'V' || r.version || 'R' || r.release as "revisionStr",
      r.version as "version",
      r.release as "release",
      r.benchmarkDateSql as "benchmarkDate",
      r.status as "status",
      r.statusDate as "statusDate",
      r.description as "description"
    FROM
      revision r
    WHERE
      r.benchmarkId = :benchmarkId
    ORDER BY
      r.benchmarkDateSql desc
    `
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, [benchmarkId], options)
    await connection.close()
    return (result.rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return the defintion and associated checks and fixes for the specified Rule
 *
 * ruleId String A path parameter that indentifies a Rule
 * returns Rule
 **/
exports.getRuleByRuleId = async function(ruleId, projection, userObject) {
  try {
    let rows = await this.queryRules( ruleId, projection )
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return rule data for the specified Rule in a revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getRuleByRevision = async function(benchmarkId, revisionStr, ruleId, projection, userObject) {
  try {
    let rows = await this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {
      ruleId: ruleId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return rule data for the specified revision of a STIG.
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getRulesByRevision = async function(benchmarkId, revisionStr, projection, userObject) {
  try {
    let rows = await this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {} )
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return a list of available STIGs
 *
 * title String A string found anywhere in a STIG title (optional)
 * returns List
 **/
exports.getSTIGs = async function(title, userObject) {
  try {
    let rows = await this.queryStigs( {
      title: title
    }, userObject )
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}


/**
 * Return properties of the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.getStigById = async function(benchmarkId, userObject) {
  try {
    let rows = await this.queryStigs( {
      benchmarkId: benchmarkId
    }, userObject )
    return (rows[0])
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
  }
}

