'use strict';
const oracledb = require('oracledb')
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates ) {
  let columns = [
    's.STIGID as "benchmarkId"',
    's.TITLE as "title"',
    `'V' || cr.version || 'R' || cr.release as "lastRevisionStr"`,
    `to_char(cr.benchmarkDateSql,'yyyy-mm-dd') as "lastRevisionDate"`
  ]
  let joins = [
    'stigs.stigs s',
    'left join stigs.current_revs cr on s.stigId = cr.stigId'
  ]

  // NO PROJECTIONS DEFINED
  // if (inProjection && inProjection.includes('assets')) {
  //   joins.push('left join stigman.stig_asset_map sa on s.stigId = sa.stigId' )
  //   joins.push('left join stigman.assets a on sa.assetId = a.assetId' )
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'assetId' VALUE a.assetId, 
  //     KEY 'name' VALUE a.name, 
  //     KEY 'dept' VALUE a.dept ABSENT ON NULL
  //     ), ',')) || ']' as "collections"`)
  // }
  // if (inProjection && inProjection.includes('collections')) {
  //   if (! inProjection.includes('assets')) {
  //     // Push dependent table
  //     joins.push('left join stigman.stig_asset_map sa on s.stigId = sa.stigId' )
  //   }
  //   joins.push('left join stigman.asset_collection_map ap on sa.assetId = ap.assetId' )
  //   joins.push('left join stigman.collections p on ap.collectionId = p.collectionId' )
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'collectionId' VALUE p.collectionId, 
  //     KEY 'name' VALUE p.name ABSENT ON NULL
  //     ), ',')) || ']' as "stigs"`)
  // }

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
    predicates.statements.push('s.stigId = :benchmarkId')
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
  sql += ' order by s.stigId'

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
  
  predicates.statements.push('r.stigId = :benchmarkId')
  predicates.binds.benchmarkId = inPredicates.benchmarkId
  
  if (inPredicates.revisionStr != 'latest') {
    joins = ['stigs.revisions r']
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
    let revId =  `${inPredicates.benchmarkId}-${results[1]}-${results[2]}`
    predicates.statements.push('r.revId = :revId')
    predicates.binds.revId = revId
  } else {
    joins = ['stigs.current_revs r']
  }
  
  joins.push('left join stigs.rev_group_map rg on r.revId = rg.revId')
  joins.push('left join stigs.groups g on rg.groupId = g.groupId')

  if (inPredicates.groupId) {
    predicates.statements.push('g.groupId = :groupId')
    predicates.binds.groupId = inPredicates.groupId
  }

  // PROJECTIONS
  if (inProjection && inProjection.includes('rules')) {
    joins.push('left join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    joins.push('left join stigs.rules r on rgr.ruleId = r.ruleId' )
    columns.push(`'[' || strdagg_param(param_array(json_object(
      KEY 'ruleId' VALUE r.ruleId, 
      KEY 'version' VALUE r.version, 
      KEY 'title' VALUE r.title, 
      KEY 'severity' VALUE r.severity ABSENT ON NULL
      ), ',')) || ']' as "rules"`)
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
        // Handle collections
        if (record.rules) {
        // Check for "empty" arrays 
          record.rules = record.rules == '[{}]' ? [] : JSON.parse(record.rules)
          // Sort by collection name
          record.rules.sort((a,b) => {
            let c = 0
            if (a.ruleId > b.ruleId) { c= 1 }
            if (a.ruleId < b.ruleId) { c = -1 }
            return c
          })
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
  let columns = [
    'r.ruleId as "ruleId"',
    'r.title as "title"',
    'g.groupId as "groupId"',
    'g.title as "groupTitle"',
    'r.version as "version"',
    'r.severity as "severity"'
  ]

  let groupBy = [
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
  predicates.statements.push('r.stigId = :benchmarkId')
  predicates.binds.benchmarkId = benchmarkId
  
  if (revisionStr != 'latest') {
    joins = ['stigs.revisions r']
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    let revId =  `${benchmarkId}-${results[1]}-${results[2]}`
    predicates.statements.push('r.revId = :revId')
    predicates.binds.revId = revId
  } else {
    joins = ['stigs.current_revs r']
  }
  
  if (inPredicates && inPredicates.ruleId) {
    predicates.statements.push('r.ruleId = :ruleId')
    predicates.binds.ruleId = inPredicates.ruleId
  }

  joins.push('left join stigs.rev_group_map rg on r.revId = rg.revId')
  joins.push('left join stigs.groups g on rg.groupId = g.groupId')
  joins.push('left join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
  joins.push('left join stigs.rules r on rgr.ruleId = r.ruleId' )

  // PROJECTIONS
  // Include extra columns for Rules with details OR individual Rule
  if ( inProjection && inProjection.includes('details') ) {
    columns.push(
      'r.version as "version"',
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
      'r.responsibility as "responsibility"',
      'r.iacontrols as "iacontrols"'
    )
    groupBy.push(
      'r.version',
      'r.weight',
      'r.vulnDiscussion',
      'r.falsePositives',
      'r.falseNegatives',
      'r.documentable',
      'r.mitigations',
      'r.securityOverrideGuidance',
      'r.potentialImpacts',
      'r.thirdPartyTools',
      'r.mitigationControl',
      'r.responsibility',
      'r.iacontrols'
    )
  }

  if ( inProjection && inProjection.includes('cci') ) {
    columns.push(`(select json_arrayagg(json_object(
      KEY 'cci' VALUE rc.controlnumber,
      KEY 'ap' VALUE  cci.apacronym,
      KEY 'control' VALUE  TRIM(cc.control) || ' ' || cc.textref ABSENT ON NULL)) 
      from stigs.rule_control_map rc 
      left join iacontrols.cci cci on rc.controlnumber = cci.cci
      left join iacontrols.cci_control_map cc on rc.controlnumber = cc.cci
      where rc.ruleId = r.ruleId) as "ccis"`)
  }
  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`(select json_arrayagg(json_object(
      KEY 'checkId' VALUE rck.checkId,
      KEY 'content' VALUE convert(chk.content, 'UTF8') ABSENT ON NULL))
      from stigs.rule_check_map rck left join stigs.checks chk on chk.checkId = rck.checkId
      where rck.ruleId = r.ruleId) as "checks"`)
  }
  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`(select json_arrayagg(json_object(
      KEY 'fixId' VALUE rf.fixId,
      KEY 'text' VALUE fix.text ABSENT ON NULL))
      from stigs.rule_fix_map rf left join stigs.fixes fix on fix.fixId = rf.fixId
      where rf.ruleId = r.ruleId) as "fixes"`)
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

  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    }

    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, predicates.binds, options)
    await connection.close()

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
    'stigs.rules r'
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
  let connection
  try {
    let result, hrstart, hrend
    let stats = {}

    let dml = {
      stigs: {
        sql: "insert /*+ ignore_row_on_dupkey_index(stigs(stigId)) */ into stigs.stigs (title, stigId) VALUES (:title, :benchmarkId)"
      },
      revisions: {
        sql: `insert /*+ ignore_row_on_dupkey_index(revisions(revId)) */ into stigs.revisions (
          revId, 
          stigId, 
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
        sql: "INSERT /*+ ignore_row_on_dupkey_index(groups(groupId)) */ into stigs.groups (groupId, title) VALUES (:groupId, :title)",
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
      fixes: {
        sql: "insert /*+ ignore_row_on_dupkey_index(fixes(fixId)) */ into stigs.fixes (fixId,text) VALUES (:fixId, :text)",
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
        sql: "insert /*+ ignore_row_on_dupkey_index(checks(checkId)) */ into stigs.checks (checkId,content) VALUES (:checkId, :content)",
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
      rules: {
        sql: `
        insert  /*+ ignore_row_on_dupkey_index(rules(ruleId)) */ into stigs.rules (
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
          ,securityOverrideGuidance
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
        // sql: "insert /*+ ignore_row_on_dupkey_index(rule_group_map(revId, groupId)) */ into stigs.rev_group_map (revId, groupId) VALUES (:revId, :groupId) RETURNING rgId into :rgId",
        sql: "insert /*+ ignore_row_on_dupkey_index(rev_group_map(groupId, revId)) */ into stigs.rev_group_map (revId, groupId) VALUES (:revId, :groupId)",
        binds: [],
        options: {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          autoCommit: false,
          bindDefs: {
            revId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            groupId: {type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
            // rgId: {dir: oracledb.BIND_OUT, type: oracledb.DB_TYPE_NUMBER}
          }
        }
      },
      revGroupRuleMap: {
        sql: `insert /*+ ignore_row_on_dupkey_index(rev_group_rule_map(ruleId, rgId)) */ into stigs.rev_group_rule_map (rgId, ruleId) VALUES (
          (SELECT rgId from stigs.rev_group_map where revId = :revId and groupId = :groupId), :ruleId)`,
        binds: []
      },
      ruleCheckMap: {
        sql: "insert /*+ ignore_row_on_dupkey_index(rule_check_map(ruleId, checkId)) */ into stigs.rule_check_map (ruleId, checkId) VALUES (:ruleId, :checkId)",
        binds: []
      },
      ruleFixMap: {
        sql: "insert /*+ ignore_row_on_dupkey_index(rule_fix_map(ruleId, fixId)) */ into stigs.rule_fix_map (ruleId, fixId) VALUES (:ruleId, :fixId)",
        binds: []
      },
      ruleControlMap: {
        sql: "insert /*+ ignore_row_on_dupkey_index(rule_control_map(ruleId, controlnumber)) */ into stigs.rule_control_map (ruleId, controlnumber, controltype) VALUES (:ruleId, :cci, 'CCI')",
        binds: []
      },
      currentRevs: {
        sql: `insert into stigs.current_revs 
        select 
          revId,
          stigId,
          version,
          release,
          benchmarkDate,
          benchmarkDateSql,
          status,
          statusDate,
          description,
          active
        from (
          SELECT
          revId,
          stigId,
          version,
          release,
          benchmarkDate,
          benchmarkDateSql,
          status,
          statusDate,
          description,
          active
            ,ROW_NUMBER() OVER (PARTITION BY stigId ORDER BY version+0 desc, release+0 desc) AS rn
          FROM
            stigs.revisions
        )
        where rn = 1
        `
      },
      currentGroupRules: {
        sql: `insert into stigs.current_group_rules
        SELECT rg.groupId,
          rgr.ruleId,
          s.stigId
        from
          stigs.stigs s
          left join stigs.current_revs cr on cr.stigId=s.stigId
          left join stigs.rev_group_map rg on rg.revId=cr.revId
          left join stigs.rev_group_rule_map rgr on rgr.rgId=rg.rgId
        where
          cr.revId is not null
        order by
          rg.groupId,rgr.ruleId,s.stigId`
      }
    }

    connection = await oracledb.getConnection()
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: false
    }

    // Collect the bind values
    hrstart = process.hrtime()
    let totalstart = hrstart

    let {revision, ...benchmarkBinds} = b
    // TABLE: STIGS
    dml.stigs.binds = benchmarkBinds
    // TODO: handle SCAP benchmark
    delete dml.stigs.binds.scap

    let {groups, ...revisionBinds} = revision
    delete revisionBinds.revisionStr
    revisionBinds.benchmarkId = benchmarkBinds.benchmarkId
    revisionBinds.revId = `${revisionBinds.benchmarkId}-${revisionBinds.version}-${revisionBinds.release}`
    revisionBinds.benchmarkDateSql = revisionBinds.benchmarkDate8601
    delete revisionBinds.benchmarkDate8601
    // TABLE: REVISIONS
    dml.revisions.binds = revisionBinds
    delete dml.revisions.binds.releaseInfo

    groups.forEach(async group => {
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
        // TABLE: REV_GROUP_RULE_MAP (rgId placeholder)
        dml.revGroupRuleMap.binds.push({
          revId: revisionBinds.revId,
          groupId: group.groupId,
          ruleId: rule.ruleId
        })
        // TABLE: RULES
        dml.rules.binds.push(ruleBinds)
        // dml.rules.binds.push({
        //   ruleId: {val: ruleBinds.ruleId, type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
        //   version: {val: ruleBinds.version, type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
        //   title: {val: ruleBinds.title, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   severity: {val: ruleBinds.severity, type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
        //   weight: {val: ruleBinds.weight, type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
        //   vulnDiscussion: {val: ruleBinds.vulnDiscussion, type: oracledb.DB_TYPE_VARCHAR, maxSize: 32000},
        //   falsePositives: {val: ruleBinds.falsePositives, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   falseNegatives: {val: ruleBinds.falseNegatives, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   documentable: {val: ruleBinds.documentable, type: oracledb.DB_TYPE_VARCHAR, maxSize: 45},
        //   mitigations: {val: ruleBinds.mitigations, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   severityOverrideGuidance: {val: ruleBinds.severityOverrideGuidance, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   potentialImpacts: {val: ruleBinds.potentialImpacts, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   thirdPartyTools: {val: ruleBinds.thirdPartyTools, type: oracledb.DB_TYPE_VARCHAR, maxSize: 4000},
        //   mitigationControl: {val: ruleBinds.mitigationControl, type: oracledb.DB_TYPE_VARCHAR, maxSize: 32000},
        //   responsibility: {val: ruleBinds.responsibility, type: oracledb.DB_TYPE_VARCHAR, maxSize: 255},
        //   iacontrols: {val: ruleBinds.iacontrols, type: oracledb.DB_TYPE_VARCHAR, maxSize: 255}

        // })

        checks.forEach(check => {
          // TABLE: CHECKS
          dml.checks.binds.push(check)
          // TABLE: RULE_CHECK_MAP
          dml.ruleCheckMap.binds.push({
            ruleId: rule.ruleId,
            checkId: check.checkId
          })
        })

        fixes.forEach(fix => {
          // TABLE: FIXES
          dml.fixes.binds.push(fix)
          // TABLE: RULE_FIX_MAP
          dml.ruleFixMap.binds.push({
            ruleId: rule.ruleId,
            fixId: fix.fixId
          })
        })

        idents.forEach(ident => {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            // TABLE: RULE_CONTROL_MAP
            dml.ruleControlMap.binds.push({
              ruleId: rule.ruleId,
              cci: ident.ident
            })
          }
        })
      })
    })

    hrend = process.hrtime(hrstart)
    stats.binds = `Completed in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.execute(dml.stigs.sql, dml.stigs.binds)
    hrend = process.hrtime(hrstart)
    stats.stigs = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
  
    hrstart = process.hrtime() 
    result = await connection.execute(dml.revisions.sql, dml.revisions.binds)
    hrend = process.hrtime(hrstart)
    stats.revisions = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.groups.sql, dml.groups.binds, dml.groups.options)
    hrend = process.hrtime(hrstart)
    stats.groups = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // for (let x=0,l=dml.rules.binds.length; x<l; x++) {
    //   let bind = dml.rules.binds[x]
    //   console.log(bind.ruleId)
    //   result = await connection.execute(dml.rules.sql, bind, dml.rules.options)
    // }

    hrstart = process.hrtime()
    result = await connection.executeMany(dml.rules.sql, dml.rules.binds, dml.rules.options)
    hrend = process.hrtime(hrstart)
    stats.rules = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.checks.sql, dml.checks.binds, dml.checks.options)
    hrend = process.hrtime(hrstart)
    stats.checks = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.fixes.sql, dml.fixes.binds, dml.fixes.options)
    hrend = process.hrtime(hrstart)
    stats.fixes = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.ruleCheckMap.sql, dml.ruleCheckMap.binds)
    hrend = process.hrtime(hrstart)
    stats.ruleCheck = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.ruleFixMap.sql, dml.ruleFixMap.binds)
    hrend = process.hrtime(hrstart)
    stats.ruleFix = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    if (dml.ruleControlMap.binds && dml.ruleControlMap.binds.length > 0) {
      hrstart = process.hrtime()
      result = await connection.executeMany(dml.ruleControlMap.sql, dml.ruleControlMap.binds)
      hrend = process.hrtime(hrstart)
      stats.ccis = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    }

    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.revGroupMap.sql, dml.revGroupMap.binds, dml.revGroupMap.options)
    hrend = process.hrtime(hrstart)
    stats.revGroup = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    hrstart = process.hrtime() 
    result = await connection.executeMany(dml.revGroupRuleMap.sql, dml.revGroupRuleMap.binds)
    hrend = process.hrtime(hrstart)
    stats.revGroupRule = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    
    // // CURRENT tables
    // hrstart = process.hrtime() 
    // result = await connection.execute('DELETE from stigs.current_revs')
    // hrend = process.hrtime(hrstart)
    // stats.deleteCurrentRevs = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    
    // hrstart = process.hrtime() 
    // result = await connection.execute('DELETE from stigs.current_group_rules')
    // hrend = process.hrtime(hrstart)
    // stats.deleteCurrentGroupRules = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    // hrstart = process.hrtime() 
    // result = await connection.execute(dml.currentRevs.sql)
    // hrend = process.hrtime(hrstart)
    // stats.currentRevs = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    // hrstart = process.hrtime() 
    // result = await connection.execute(dml.currentGroupRules.sql)
    // hrend = process.hrtime(hrstart)
    // stats.currentGroupRules = `${result.rowsAffected} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
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
 * Import a new STIG
 *
 * source File An XCCDF file (optional)
 * returns STIG
 **/
exports.addSTIG = async function(source, userObject) {
  try {
    let rows = await this.METHOD()
    return (rows)
  }
  catch(err) {
    throw ( writer.respondWithCode ( 500, {message: err.message,stack: err.stack} ) )
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
    let sqlDelete = `DELETE FROM stigs.stigs where stigId = :benchmarkId`
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
    return (rows)
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
      ${ro.table_alias}.stigId as "benchmarkId",
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
      ${ro.table_alias}.stigId = :benchmarkId
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
      r.stigId as "benchmarkId",
      'V' || r.version || 'R' || r.release as "revisionStr",
      r.version as "version",
      r.release as "release",
      r.benchmarkDateSql as "benchmarkDate",
      r.status as "status",
      r.statusDate as "statusDate",
      r.description as "description"
    FROM
      stigs.revisions r
    WHERE
      r.stigId = :benchmarkId
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

