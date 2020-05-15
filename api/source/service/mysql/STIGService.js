'use strict';
const writer = require('../../utils/writer.js')
const dbUtils = require('./utils')

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates ) {
  try {
    let columns = [
      'b.benchmarkId',
      'b.title',
      `concat('V', cr.version, 'R', cr.release) as "lastRevisionStr"`,
      `date_format(cr.benchmarkDateSql,'%Y-%m-%d') as "lastRevisionDate"`
    ]
    let joins = [
      'stig.benchmark b',
      'left join stig.current_rev cr on b.benchmarkId = cr.benchmarkId'
    ]

    // PREDICATES
    let predicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.title) {
      predicates.statements.push("b.title LIKE CONCAT('%',?,'%')")
      predicates.binds.push( inPredicates.title )
    }
    if (inPredicates.benchmarkId) {
      predicates.statements.push('b.benchmarkId = ?')
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
    sql += ' order by b.benchmarkId'

    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows)
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
    binds: []
  }
  
  predicates.statements.push('r.benchmarkId = ?')
  predicates.binds.push(inPredicates.benchmarkId)
  
  if (inPredicates.revisionStr != 'latest') {
    joins = ['stig.revision r']
    let [results, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(inPredicates.revisionStr)
    predicates.statements.push('r.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('r.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['stig.current_rev r']
  }
  
  joins.push('left join stig.rev_group_map rg on r.revId = rg.revId')
  joins.push('left join stig.group g on rg.groupId = g.groupId')

  if (inPredicates.groupId) {
    predicates.statements.push('g.groupId = ?')
    predicates.binds.push(inPredicates.groupId)
  }

  // PROJECTIONS
  if (inProjection && inProjection.includes('rules')) {
    joins.push('left join stig.rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
    joins.push('left join stig.rule rule on rgr.ruleId = rule.ruleId' )
    columns.push(`json_arrayagg(json_object(
      'ruleId', rule.ruleId, 
      'version', rule.version, 
      'title', rule.title, 
      'severity', rule.severity)) as "rules"`)
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
  sql += ` order by substring(g.groupId from 3) + 0`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows)
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
    'r.ruleId',
    'r.title',
    'g.groupId',
    'g.title',
    'r.version',
    'r.severity'
  ]

  let groupBy = [
    'r.ruleId',
    'r.title',
    'g.groupId',
    'g.title',
    'r.version',
    'r.severity',
    'rgr.rgrId'
  ]

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('rev.benchmarkId = ?')
  predicates.binds.push(benchmarkId)
  
  if (revisionStr != 'latest') {
    joins = ['stig.revision rev']
    let [input, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    predicates.statements.push('rev.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('rev.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['stig.current_rev rev']
  }
  
  if (inPredicates && inPredicates.ruleId) {
    predicates.statements.push('rgr.ruleId = ?')
    predicates.binds.push(inPredicates.ruleId)
  }

  joins.push('left join stig.rev_group_map rg on rev.revId = rg.revId')
  joins.push('left join stig.group g on rg.groupId = g.groupId')
  joins.push('left join stig.rev_group_rule_map rgr on rg.rgId = rgr.rgId' )
  joins.push('left join stig.rule r on rgr.ruleId = r.ruleId' )

  // PROJECTIONS
  // Include extra columns for Rules with details OR individual Rule
  if ( inProjection && inProjection.includes('details') ) {
    columns.push(
      'r.version',
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
    groupBy.push(
      'r.version',
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
    columns.push(`(select json_arrayagg(json_object(
      'cci', rgrc.cci,
      'ap', cci.apAcronym,
      'control',  cr.indexDisa)) 
      from stig.rev_group_rule_cci_map rgrc 
      left join stig.cci cci on rgrc.cci = cci.cci
      left join stig.cci_reference_map cr on cci.cci = cr.cci
      where rgrc.rgrId = rgr.rgrId) as "ccis"`)
  }
  if ( inProjection && inProjection.includes('checks') ) {
    columns.push(`(select json_arrayagg(json_object(
      'checkId', rck.checkId,
      'content', chk.content))
      from stig.rev_group_rule_check_map rck left join stig.check chk on chk.checkId = rck.checkId
      where rck.rgrId = rgr.rgrId) as "checks"`)
  }
  if ( inProjection && inProjection.includes('fixes') ) {
    columns.push(`(select json_arrayagg(json_object(
      'fixId', rf.fixId,
      'text', fix.text))
      from stig.rev_group_rule_fix_map rf left join stig.fix fix on fix.fixId = rf.fixId
      where rf.rgrId = rgr.rgrId) as "fixes"`)
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
  sql += ` order by substring(r.ruleId from 4) + 0`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)
    for (let x = 0, l = rows.length; x < l; x++) {
      let record = rows[x]
      // remove keys with null value
      Object.keys(record).forEach(key => record[key] == null && delete record[key])
    }

    return (rows)
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
    'r.ruleId',
    'r.title',
    'r.version',
    'r.severity',
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
    'r.responsibility'
]

  let joins = [
    'stig.rule r'
  ]
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('r.ruleId = ?')
  predicates.binds.push(ruleId)
  
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
  sql += ` order by substring(r.ruleId from 4) + 0`

  try {
    let [rows, fields] = await dbUtils.pool.query(sql, predicates.binds)

    // For JSON.stringify(), remove keys with null value
    result.rows.toJSON = function () {
      for (let x = 0, l = this.length; x < l; x++) {
        let record = this[x]
        Object.keys(record).forEach(key => record[key] == null && delete record[key])
      }
      return this
    }
    return (rows)
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
    let rows = await this.getRevisionByString(benchmarkId, revisionStr, userObject)
    let [input, version, release] = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    let sqlDelete = `DELETE from stig.revision WHERE benchmarkId = ? and version = ? and release = ?`
    await dbUtils.pool.query(sqlDelete, [benchmarkId, version, release])
    return (rows[0])
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
    let rows = await this.queryStigs( {benchmarkId: benchmarkId}, userObject)
    let sqlDelete = `DELETE FROM stig.benchmark where benchmarkId = ?`
    await dbUtils.pool.query(sqlDelete, [benchmarkId])
    return (rows[0])
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
      ${ro.table_alias}.benchmarkId,
      concat('V', ${ro.table_alias}.version, 'R', ${ro.table_alias}.release) as "revisionStr",
      ${ro.table_alias}.version,
      ${ro.table_alias}.release,
      ${ro.table_alias}.benchmarkDateSql as "benchmarkDate",
      ${ro.table_alias}.status,
      ${ro.table_alias}.statusDate,
      ${ro.table_alias}.description
    FROM
      ${ro.table}  ${ro.table_alias}
    WHERE
      ${ro.table_alias}.benchmarkId = ?
      ${ro.predicates}
    ORDER BY
      ${ro.table_alias}.benchmarkDateSql desc
    `
    let binds = [benchmarkId]
    if (ro.version) {
      binds.push(ro.version, ro.release)
    }
    let [rows, fields] = await dbUtils.pool.query(sql, binds)
    return (rows[0])
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
      r.benchmarkId,
      concat('V', r.version, 'R', r.release) as "revisionStr",
      r.version,
      r.release,
      r.benchmarkDateSql as "benchmarkDate",
      r.status,
      r.statusDate,
      r.description
    FROM
      stig.revision r
    WHERE
      r.benchmarkId = ?
    ORDER BY
      r.benchmarkDateSql desc
    `
    let [rows, fields] = await dbUtils.pool.query(sql, [benchmarkId])
    return (rows)
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

