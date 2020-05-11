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
  //     ), ',')) || ']' as "packages"`)
  // }
  // if (inProjection && inProjection.includes('packages')) {
  //   if (! inProjection.includes('assets')) {
  //     // Push dependent table
  //     joins.push('left join stigman.stig_asset_map sa on s.stigId = sa.stigId' )
  //   }
  //   joins.push('left join stigman.asset_package_map ap on sa.assetId = ap.assetId' )
  //   joins.push('left join stigman.packages p on ap.packageId = p.packageId' )
  //   columns.push(`'[' || strdagg_param(param_array(json_object(
  //     KEY 'packageId' VALUE p.packageId, 
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
        // Handle packages
        if (record.rules) {
        // Check for "empty" arrays 
          record.rules = record.rules == '[{}]' ? [] : JSON.parse(record.rules)
          // Sort by package name
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
    let result, fields, hrstart, hrend
    let stats = {}

    let dml = {
      benchmark: {
        sql: "insert ignore into stig.benchmark (title, benchmarkId) VALUES (:title, :benchmarkId)"
      },
      revision: {
        sql: `insert ignore into stig.revision (
          revId, 
          benchmarkId, 
          \`version\`, 
          \`release\`, 
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
          STR_TO_DATE(:benchmarkDateSql, '%Y-%m-%d'),
          :status, 
          :statusDate, 
          :description
        )`,
      },
      group: {
        sql: "INSERT ignore into stig.group (groupId, title) VALUES ?",
        binds: []
      },
      fix: {
        sql: "insert ignore into stig.fix (fixId, text) VALUES ?",
        binds: []
      },
      check: {
        sql: "insert ignore into stig.check (checkId, content) VALUES ?",
        binds: []
      },
      rule: {
        sql: `
        insert ignore into stig.rule (
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
        ) VALUES ?`,
        binds: []
      },
      revGroupMap: {
        sql: "insert ignore into stig.rev_group_map (revId, groupId, rules) VALUES ?",
        binds: []
      },
      revGroupRuleMap: {
        sql: `INSERT IGNORE INTO stig.rev_group_rule_map
        (rgId, ruleId, checks, fixes, ccis)
        SELECT 
        rg.rgId,
        tt.ruleId,
        tt.checks,
        tt.fixes,
        tt.ccis
        FROM
        stig.rev_group_map rg,
           JSON_TABLE(
           rg.rules,
           "$[*]"
           COLUMNS(
             ruleId VARCHAR(255) PATH "$.ruleId",
               checks JSON PATH "$.checks",
               fixes JSON PATH "$.fixes",
               ccis JSON PATH "$.ccis"
           )
           ) AS tt
        WHERE rg.revId = ?`
      },
      revGroupRuleCciMap: {
        sql: `INSERT IGNORE INTO stig.rev_group_rule_cci_map
        (rgrId, cci)
        SELECT 
          rgr.rgrId,
          tt.cci
        FROM
          stig.rev_group_map rg,
          stig.rev_group_rule_map rgr,
          JSON_TABLE(
            rgr.ccis,
            "$[*]" COLUMNS(
				      cci VARCHAR(60) PATH "$"
			      )
          ) AS tt
		    WHERE 
          rg.revId = ?
          AND rg.rgId=rgr.rgId`
      },
      revGroupRuleCheckMap: {
        sql: `INSERT IGNORE INTO stig.rev_group_rule_check_map
        (rgrId, checkId)
        SELECT 
          rgr.rgrId,
          tt.checkId
        FROM
          stig.rev_group_map rg,
          stig.rev_group_rule_map rgr,
          JSON_TABLE(
            rgr.checks,
            "$[*]" COLUMNS(
				      checkId VARCHAR(255) PATH "$"
			      )
          ) AS tt
		    WHERE 
          rg.revId = ?
          AND rg.rgId=rgr.rgId`
      },
      revGroupRuleFixMap: {
        sql: `INSERT IGNORE INTO stig.rev_group_rule_fix_map
        (rgrId, fixId)
        SELECT 
          rgr.rgrId,
          tt.fixId
        FROM
          stig.rev_group_map rg,
          stig.rev_group_rule_map rgr,
          JSON_TABLE(
            rgr.fixes,
            "$[*]" COLUMNS(
				      fixId VARCHAR(255) PATH "$"
			      )
          ) AS tt
		    WHERE 
          rg.revId = ?
          AND rg.rgId=rgr.rgId`
      },
    }

    // Collect the bind values
    hrstart = process.hrtime()
    let totalstart = hrstart

    let {revision, ...benchmarkBinds} = b
    // TABLE: benchmark
    dml.benchmark.binds = benchmarkBinds

    let {groups, ...revisionBinds} = revision
    delete revisionBinds.revisionStr
    revisionBinds.benchmarkId = benchmarkBinds.benchmarkId
    revisionBinds.revId = `${revisionBinds.benchmarkId}-${revisionBinds.version}-${revisionBinds.release}`
    revisionBinds.benchmarkDateSql = revisionBinds.benchmarkDate8601
    delete revisionBinds.benchmarkDate8601
    // TABLE: revision
    dml.revision.binds = revisionBinds

    groups.forEach( group => {
      let {rules, ...groupBinds} = group
      // TABLE: group
      dml.group.binds.push([
        groupBinds.groupId, 
        groupBinds.title
      ])
      let ruleMap = []
      let identsMap = []

      rules.forEach(rule => {
        let {checks, fixes, idents, ...ruleBinds} = rule
        // TABLE: rule
        dml.rule.binds.push([
          ruleBinds.ruleId,
          ruleBinds.version,
          ruleBinds.title,
          ruleBinds.severity,
          ruleBinds.weight,
          ruleBinds.vulnDiscusssion,
          ruleBinds.falsePositives,
          ruleBinds.falseNegatives,
          ruleBinds.documentable,
          ruleBinds.mitigations,
          ruleBinds.securityOverrideGuidance,
          ruleBinds.potentialImpacts,
          ruleBinds.thirdPartyTools,
          ruleBinds.mitigationControl,
          ruleBinds.responsibility,
          ruleBinds.iaControls          
        ])
        if (checks) {
          checks.forEach(check => {
            // TABLE: check
            dml.check.binds.push([
              check.checkId,
              check.content
            ])
          })
        }

        fixes.forEach(fix => {
          // TABLE: fix
          dml.fix.binds.push([
            fix.fixId,
            fix.text
          ])
        })

        idents.forEach(ident => {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            identsMap.push(ident.ident.replace('CCI-',''))
          }
        })

        // JSON for rev_group_map.rules
        ruleMap.push({
          ruleId: rule.ruleId,
          checks: checks ? checks.map(c=>c.checkId) : null,
          fixes: fixes ? fixes.map(f=>f.fixId) : null,
          ccis: identsMap
        })
  
      }) // end rules.forEach


      // TABLE: rev_group_map
      dml.revGroupMap.binds.push([
        revisionBinds.revId,
        group.groupId,
        JSON.stringify(ruleMap)
      ])

      // TABLE: rev_group_rule_map
      dml.revGroupRuleMap.binds = revisionBinds.revId
      // TABLE: rev_group_rule_cci_map
      dml.revGroupRuleCciMap.binds = revisionBinds.revId
      // TABLE: rev_group_rule_check_map
      dml.revGroupRuleCheckMap.binds = revisionBinds.revId
      // TABLE: rev_group_rule_fix_map
      dml.revGroupRuleFixMap.binds = revisionBinds.revId
      
    }) // end groups.forEach

    // INSERT into MySQL
    let pp = dbUtils.pool
    connection = await pp.getConnection()
    connection.config.namedPlaceholders = true

    hrend = process.hrtime(hrstart)
    stats.binds = `Completed in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime()
    ;[result, fields] = await connection.execute(dml.benchmark.sql, dml.benchmark.binds)
    hrend = process.hrtime(hrstart)
    stats.stigs = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
  
    hrstart = process.hrtime() 
    ;[result, fields] = await connection.execute(dml.revision.sql, dml.revision.binds)
    hrend = process.hrtime(hrstart)
    stats.revisions = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.group.sql, [dml.group.binds])
    hrend = process.hrtime(hrstart)
    stats.groups = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime()
    ;[result, fields] = await connection.query(dml.rule.sql, [dml.rule.binds])
    hrend = process.hrtime(hrstart)
    stats.rules = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.check.sql, [dml.check.binds])
    hrend = process.hrtime(hrstart)
    stats.checks = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.fix.sql, [dml.fix.binds])
    hrend = process.hrtime(hrstart)
    stats.fixes = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.revGroupMap.sql, [dml.revGroupMap.binds])
    hrend = process.hrtime(hrstart)
    stats.revGroup = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.revGroupRuleMap.sql, [dml.revGroupRuleMap.binds])
    hrend = process.hrtime(hrstart)
    stats.revGroupRule = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
    
    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.revGroupRuleCciMap.sql, [dml.revGroupRuleCciMap.binds])
    hrend = process.hrtime(hrstart)
    stats.revGroupRuleCci = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.revGroupRuleCheckMap.sql, [dml.revGroupRuleCheckMap.binds])
    hrend = process.hrtime(hrstart)
    stats.revGroupRuleCheck = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

    hrstart = process.hrtime() 
    ;[result, fields] = await connection.query(dml.revGroupRuleFixMap.sql, [dml.revGroupRuleFixMap.binds])
    hrend = process.hrtime(hrstart)
    stats.revGroupRuleFix = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

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
      await connection.release()
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

