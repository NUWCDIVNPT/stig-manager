'use strict';
const dbUtils = require('./utils')
const {createHash} = require('node:crypto')

let _this = this

/**
Generalized queries for STIGs
**/
exports.queryStigs = async function ( inPredicates, inProjections, userObject, elevate = false ) {
  try {
    const ctes = []
    // cte_stig_collection is used for the base query (no projections)
    ctes.push(`cte_stig_collection AS (select
      sa.benchmarkId,
      cast(concat('[', group_concat(distinct concat('"',a.collectionId,'"')),']') as json) as collectionIds
      FROM
      stig_asset_map sa
      inner join asset a on a.assetId=sa.assetId and a.state = "enabled"
      inner join collection c on c.collectionId=a.collectionId and c.state = "enabled"
      ${elevate ? '' : `left join collection_grant cg on a.collectionId = cg.collectionId
      left join user_stig_asset_map usa on sa.saId = usa.saId
      where  (cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)`}
      group by sa.benchmarkId)`)

    // cte_stig is used for the base query (no projections)
    const cteStigColumns = [
      'b.benchmarkId',
      'b.title',
      `cr.status`,
      `concat('V', cr.version, 'R', cr.release) as "lastRevisionStr"`,
      `date_format(cr.benchmarkDateSql,'%Y-%m-%d') as "lastRevisionDate"`,
      `cr.ruleCount`,
      `coalesce(sc.collectionIds,json_array()) as collectionIds`,
      `JSON_ARRAYAGG(concat('V',revision.version,'R',revision.release)) OVER (PARTITION BY b.benchmarkId ORDER BY revision.benchmarkDateSql DESC) as revisionStrs`,
      `ROW_NUMBER() OVER (PARTITION BY b.benchmarkId ORDER BY revision.benchmarkDateSql ASC) as rownum`
    ]
    const cteStigJoins = [
      'stig b',
      'left join current_rev cr on b.benchmarkId = cr.benchmarkId',
      'left join cte_stig_collection sc on b.benchmarkId = sc.benchmarkId',
      'left join revision on b.benchmarkId = revision.benchmarkId',
    ]

    // PREDICATES
    let cteStigPredicates = {
      statements: [],
      binds: []
    }
    if (inPredicates.title) {
      cteStigPredicates.statements.push("b.title LIKE CONCAT('%',?,'%')")
      cteStigPredicates.binds.push( inPredicates.title )
    }
    if (inPredicates.benchmarkId) {
      cteStigPredicates.statements.push('b.benchmarkId = ?')
      cteStigPredicates.binds.push( inPredicates.benchmarkId )
    }

    // Main query columns, can be modified by projections
    const columns = [
      'benchmarkId',
      'title',
      '`status`',
      `lastRevisionStr`,
      `lastRevisionDate`,
      `ruleCount`,
      `revisionStrs`,
      `collectionIds`,
    ]

    if (inProjections.includes('revisions')) {
      // add cte_rev_collection, add revision objects to cteStigColumns, add joins to cteStigJoins
      ctes.push(`cte_rev_collection AS (select
        r.revId,
        cast(concat('[', group_concat(distinct concat('"',crm.collectionId,'"')),']') as json) as collectionIds
        from
        revision r
        inner join collection_rev_map crm using (revId)
        ${elevate ? '' : `left join collection_grant cg on crm.collectionId = cg.collectionId
        left join stig_asset_map sa on r.benchmarkId = sa.benchmarkId
        left join user_stig_asset_map usa on sa.saId = usa.saId
        where  (cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)`}
        group by r.revId)`)
      cteStigColumns.push(`JSON_ARRAYAGG(
        json_object(
          "benchmarkId", revision.benchmarkId,
          "revisionStr", concat('V',revision.version,'R',revision.release),
          "version", cast(revision.version as char),
          "release", revision.release,
          "benchmarkDate", revision.benchmarkDateSql,
          "status", revision.status,
          "statusDate", revision.statusDate,
          "ruleCount", revision .ruleCount,
          "collectionIds", coalesce(rc.collectionIds,json_array())
        )) OVER (PARTITION BY b.benchmarkId ORDER BY revision.benchmarkDateSql DESC) as revisions`)
      cteStigJoins.push('left join cte_rev_collection rc on revision.revId = rc.revId')
      columns.push('revisions')
    }

    ctes.push(`cte_stig AS (${dbUtils.makeQueryString({columns:cteStigColumns, joins:cteStigJoins, predicates:cteStigPredicates, orderBy:['b.benchmarkId']})})`)

    let binds
    if (elevate) {
      binds = cteStigPredicates.binds
    }
    else if (inProjections.includes('revisions')){
      binds = [userObject.userId, userObject.userId, ...cteStigPredicates.binds]
    }
    else {
      binds = [userObject.userId, ...cteStigPredicates.binds]
    }

    // CONSTRUCT MAIN QUERY
    const joins = ['cte_stig']
    const predicates = {
      statements: ['rownum = 1'],
      binds
    }

    const sql = dbUtils.makeQueryString({ctes, columns, joins, predicates})

    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
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
    'rgr.groupId as "groupId"',
    'rgr.groupTitle as "title"',
  ]

  const orderBy = ['substring(rgr.groupId from 3) + 0']
  const groupBy = ['rgr.groupId', 'rgr.groupTitle']

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  predicates.statements.push('r.benchmarkId = ?')
  predicates.binds.push(inPredicates.benchmarkId)
  
  if (inPredicates.revisionStr != 'latest') {
    joins = ['revision r']
    const {version, release} = dbUtils.parseRevisionStr(inPredicates.revisionStr)
    predicates.statements.push('r.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('r.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['current_rev r']
  }
  
  joins.push('inner join rev_group_rule_map rgr on r.revId = rgr.revId')

  if (inPredicates.groupId) {
    predicates.statements.push('rgr.groupId = ?')
    predicates.binds.push(inPredicates.groupId)
  }

  // PROJECTIONS
  if (inProjection?.includes('rules')) {
    columns.push(`json_arrayagg(json_object(
      'ruleId', rgr.ruleId, 
      'version', rgr.version, 
      'title', rgr.title, 
      'severity', rgr.severity)) as "rules"`)
  }

  // // CONSTRUCT MAIN QUERY
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})

  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows.length > 0 ? rows : null)
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
    'rgr.ruleId',
    'rgr.title',
    'rgr.groupId',
    'rgr.groupTitle',
    'rgr.version',
    'rgr.severity'
  ]

  let groupBy = [
    'rgr.ruleId',
    'rgr.title',
    'rgr.groupId',
    'rgr.groupTitle',
    'rgr.version',
    'rgr.severity',
    'rgr.rgrId'
  ]

  const orderBy =  ['substring(rgr.ruleId from 4) + 0']

  let joins
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('rev.benchmarkId = ?')
  predicates.binds.push(benchmarkId)
  
  if (revisionStr != 'latest') {
    joins = ['revision rev']
    const {version, release} = dbUtils.parseRevisionStr(revisionStr)
    predicates.statements.push('rev.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('rev.release = ?')
    predicates.binds.push(release)
  } else {
    joins = ['current_rev rev']
  }
  
  if (inPredicates?.ruleId) {
    predicates.statements.push('rgr.ruleId = ?')
    predicates.binds.push(inPredicates.ruleId)
  }

  joins.push('left join rev_group_rule_map rgr using (revId)' )

  // PROJECTIONS
  if ( inProjection?.includes('detail') ) {
    columns.push(`json_object(
      'weight', rgr.weight,
      'vulnDiscussion', rgr.vulnDiscussion,
      'falsePositives', rgr.falsePositives,
      'falseNegatives', rgr.falseNegatives,
      'documentable', rgr.documentable,
      'mitigations', rgr.mitigations,
      'severityOverrideGuidance', rgr.severityOverrideGuidance,
      'potentialImpacts', rgr.potentialImpacts,
      'thirdPartyTools', rgr.thirdPartyTools,
      'mitigationControl', rgr.mitigationControl,
      'responsibility', rgr.responsibility
    ) as detail`)
    groupBy.push(
      'rgr.version',
      'rgr.weight',
      'rgr.vulnDiscussion',
      'rgr.falsePositives',
      'rgr.falseNegatives',
      'rgr.documentable',
      'rgr.mitigations',
      'rgr.severityOverrideGuidance',
      'rgr.potentialImpacts',
      'rgr.thirdPartyTools',
      'rgr.mitigationControl',
      'rgr.responsibility',
      'rgr.iacontrols'
    )
  }

  if ( inProjection?.includes('ccis') ) {
    columns.push(`(select 
      coalesce
      (
        (select json_arrayagg(
          json_object(
            'cci', rgrcc.cci,
            'apAcronym', cci.apAcronym,
            'definition',  cci.definition,
            'control', cr.indexDisa
          )
        ) 
        from
          rev_group_rule_cci_map rgrcc 
          left join cci cci using (cci)
          left join cci_reference_map cr using (cci)
        where 
          rgrcc.rgrId = rgr.rgrId
        ), 
        json_array()
      )
    ) as "ccis"`)
  }
  if ( inProjection?.includes('check') ) {
    joins.push('left join check_content cc on rgr.checkDigest = cc.digest' )
    columns.push(`json_object(
      'system', rgr.checkSystem,
      'content', cc.content) as \`check\``)
    }
  if ( inProjection?.includes('fix') ) {
    joins.push('left join fix_text ft on rgr.fixDigest = ft.digest' )
    columns.push(`json_object(
      'fixref', rgr.fixref,
      'text', ft.text) as fix`)
  }

  // // CONSTRUCT MAIN QUERY
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})

  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
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
    'rgr.ruleId',
    'rgr.version',
    'rgr.title',
    'rgr.severity',
    'rgr.groupId',
    'rgr.groupTitle'
  ]
  
  let groupBy = [
    'rgr.rgrId'
  ]

  const orderBy = ['substring(rgr.ruleId from 4) + 0']

  let joins = [
    'rev_group_rule_map rgr'
  ]


  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('rgr.ruleId = ?')
  predicates.binds.push(ruleId)
  

  // PROJECTIONS
  if ( inProjection?.includes('detail') ) {
    columns.push(`json_object(
      'weight', rgr.weight,
      'vulnDiscussion', rgr.vulnDiscussion,
      'falsePositives', rgr.falsePositives,
      'falseNegatives', rgr.falseNegatives,
      'documentable', rgr.documentable,
      'mitigations', rgr.mitigations,
      'severityOverrideGuidance', rgr.severityOverrideGuidance,
      'potentialImpacts', rgr.potentialImpacts,
      'thirdPartyTools', rgr.thirdPartyTools,
      'mitigationControl', rgr.mitigationControl,
      'responsibility', rgr.responsibility
    ) as detail`)
    // let detailColumns = [
    //   'rgr.weight',
    //   'rgr.vulnDiscussion',
    //   'rgr.falsePositives',
    //   'rgr.falseNegatives',
    //   'rgr.documentable',
    //   'rgr.mitigations',
    //   'rgr.severityOverrideGuidance',
    //   'rgr.potentialImpacts',
    //   'rgr.thirdPartyTools',
    //   'rgr.mitigationControl',
    //   'rgr.responsibility'
    // ]
    // groupBy.push(...detailColumns)
  }

  if ( inProjection?.includes('ccis') ) {
    columns.push(`CASE WHEN count(rgrcc.cci) = 0 
    THEN json_array()
    ELSE CAST(CONCAT('[', GROUP_CONCAT(distinct json_object('cci', rgrcc.cci,'apAcronym',cci.apAcronym,'definition',cci.definition)), ']') as json) 
    END as ccis`)
    joins.push(
      'left join rev_group_rule_cci_map rgrcc using (rgrId)',
      'left join cci using (cci)'
    )
  }

  if ( inProjection?.includes('check') ) {
    columns.push(`json_object('system', rgr.checkSystem,'content', cc.content) as \`check\``)
    joins.push('left join check_content cc on rgr.checkDigest = cc.digest')
  }

  if ( inProjection?.includes('fix') ) {
    columns.push(`json_object('fixref', rgr.fixref,'text', ft.text) as fix`)
    joins.push('left join fix_text ft on rgr.fixDigest = ft.digest')
  }

  // CONSTRUCT MAIN QUERY
  const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy})

  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
    return (rows[0])
  }
  catch (err) {
    throw err
  }  
}


exports.insertManualBenchmark = async function (b, clobber, svcStatus = {}) {

  let connection
  try {
    const stats = {}
    let totalstart = process.hrtime() 

    const {ddl, dml} = queriesFromBenchmarkData(b) // defined below

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true

    // check if this revision exists
    const [revision] = await connection.query('select revId from revision where `benchmarkId` = ? and `version` = ? and `release` = ?', [
      dml.revision.binds.benchmarkId,
      dml.revision.binds.version,
      dml.revision.binds.release
    ])
    const gExistingRevision = revision?.[0]?.revId
    if (gExistingRevision && !clobber) {
      return {
        benchmarkId: dml.revision.binds.benchmarkId,
        revisionStr: `V${dml.revision.binds.version}R${dml.revision.binds.release}`,
        action: 'preserved'
      }
    }

    // create temporary tables outside the transaction
    for (const tempTable of Object.keys(ddl)) {
      await connection.query(ddl[tempTable].drop)
      await connection.query(ddl[tempTable].create)
    }

    async function transaction() {
      let result, hrstart, hrend, action = 'inserted'
      await connection.query('START TRANSACTION')

      // purge any exitsing records for this revision so we can replace
      if (gExistingRevision) {
        hrstart = process.hrtime()
        await connection.query('DELETE FROM revision WHERE revId = ?', [gExistingRevision])
        const cleanupDml = [
          "DELETE FROM check_content WHERE digest NOT IN (select checkDigest from rev_group_rule_map)",
          "DELETE FROM fix_text WHERE digest NOT IN (select digest from rev_group_rule_map)"
        ]
        for (const query of cleanupDml) {
          await connection.query(query)
        }
        hrend = process.hrtime(hrstart)
        stats.delRev = `${hrend[0]}s  ${hrend[1] / 1000000}ms`
        action = 'replaced'
      }

      // insert new records for this revision
      const queryOrder = [
        'stig',
        'revision',
        'tempRuleCci',
        'checkContent',
        'fixText',
        'revGroupRuleMap',
        'revGroupRuleCciMap',
        'ruleVersionCheckDigest'
      ]

      for (const query of queryOrder) {
        hrstart = process.hrtime()
        if (Array.isArray(dml[query].binds)) {
          if (dml[query].binds.length === 0) { continue }
          ;[result] = await connection.query(dml[query].sql, [dml[query].binds])
        }
        else {
          ;[result] = await connection.query(dml[query].sql, dml[query].binds)
        }
        hrend = process.hrtime(hrstart)
        stats[query] = `${result.affectedRows} in ${hrend[0]}s  ${hrend[1] / 1000000}ms`
      }

      // Update current_rev
      hrstart = process.hrtime()
      let sqlDeleteCurrentRev = 'DELETE from current_rev where benchmarkId = ?'
      let sqlUpdateCurrentRev = `INSERT INTO current_rev (
        revId,
        benchmarkId,
        \`version\`, 
        \`release\`, 
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount)
        SELECT 
          revId,
          benchmarkId,
          \`version\`,
          \`release\`,
          benchmarkDate,
          benchmarkDateSql,
          status,
          statusDate,
          description,
          active,
          groupCount,
          lowCount,
          mediumCount,
          highCount,
          checkCount,
          fixCount
        FROM
          v_current_rev
        WHERE
          v_current_rev.benchmarkId = ?`
      ;[result] = await connection.query(sqlDeleteCurrentRev, [dml.stig.binds.benchmarkId])
      ;[result] = await connection.query(sqlUpdateCurrentRev, [dml.stig.binds.benchmarkId])
      hrend = process.hrtime(hrstart)
      stats.current_rev = `${hrend[0]}s  ${hrend[1] / 1000000}ms`

      // Stats
      hrstart = process.hrtime()
      await dbUtils.updateDefaultRev(connection, {
        benchmarkId: dml.stig.binds.benchmarkId
      })
      await dbUtils.updateStatsAssetStig(connection, {
        benchmarkId: dml.stig.binds.benchmarkId
      })
      hrend = process.hrtime(hrstart)
      stats.statistics = `${hrend[0]}s  ${hrend[1] / 1000000}ms`

      await connection.commit()
      hrend = process.hrtime(totalstart)
      stats.totalTime = `Completed in ${hrend[0]}s  ${hrend[1] / 1000000}ms`

      return {
        benchmarkId: dml.revision.binds.benchmarkId,
        revisionStr: `V${dml.revision.binds.version}R${dml.revision.binds.release}`,
        action
      }
    }
    return await dbUtils.retryOnDeadlock(transaction, svcStatus)
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

  function queriesFromBenchmarkData(b) {
    const tempFlag = true
    const ddl = {
      tempRuleCci: {
        drop: 'drop table if exists temp_rule_cci',
        create: `CREATE${tempFlag ? ' TEMPORARY' : ''} TABLE temp_rule_cci (
          ruleId varchar(255) NOT NULL,
          cci varchar(20))`
      }
    }
    const dml = {
      stig: {
        sql: "insert into stig (title, benchmarkId) VALUES (:title, :benchmarkId) as new on duplicate key update stig.title = new.title"
      },
      revision: {
        sql: `insert into revision (
  revId, 
  benchmarkId, 
  \`version\`, 
  \`release\`, 
  benchmarkDate, 
  benchmarkDateSql, 
  status, 
  statusDate, 
  description,
  groupCount,
  checkCount,
  fixCount,
  lowCount,
  mediumCount,
  highCount
) VALUES (
  :revId, 
  :benchmarkId, 
  :version, 
  :release, 
  :benchmarkDate, 
  STR_TO_DATE(:benchmarkDateSql, '%Y-%m-%d'),
  :status, 
  :statusDate, 
  :description,
  :groupCount,
  :checkCount,
  :fixCount,
  :lowCount,
  :mediumCount,
  :highCount)`,
      },
      checkContent: {
        sql: `insert ignore into check_content (content) VALUES ?`,
        binds: []
      },
      fixText: {
        sql: `insert ignore into fix_text (\`text\`) VALUES ?`,
        binds: []
      },
      tempRuleCci: {
        sql: `insert ignore into temp_rule_cci (ruleId, cci) VALUES ?`,
        binds: []
      },
      revGroupRuleMap: {
        sql: `INSERT INTO rev_group_rule_map (
          revId,
          groupId, groupTitle, groupSeverity,
          ruleId, \`version\`, title, severity, weight, vulnDiscussion, 
          falsePositives, falseNegatives, documentable, mitigations, 
          severityOverrideGuidance, potentialImpacts, thirdPartyTools, mitigationControl,
          responsibility, iaControls, checkSystem, checkDigest, fixref, fixDigest)
          VALUES ?`,
        binds: []
      },
      revGroupRuleCciMap: {
        sql: `INSERT INTO rev_group_rule_cci_map (rgrId, cci)
          SELECT 
            rgr.rgrId,
            tt.cci
          FROM
            rev_group_rule_map rgr
            inner join temp_rule_cci tt using (ruleId)
          WHERE 
            rgr.revId = :revId`
      },
      ruleVersionCheckDigest: {
        sql: `INSERT INTO rule_version_check_digest (ruleId, \`version\`, checkDigest)
        with currentRuleVersionCheckDigest as (
        select
          rgr.ruleId,
          rgr.version,
          rgr.checkDigest,
          rev.benchmarkDateSql,
          rev.revId,
          ROW_NUMBER() OVER (PARTITION BY rgr.ruleId ORDER BY rev.benchmarkDateSql DESC) as rowNum
        from
          rev_group_rule_map rgr
          left join revision rev using (revId)
        where
          rgr.checkDigest is not null
          and rev.benchmarkId = ?
        )
        select
          ruleId,
          \`version\`,
          checkDigest
        from
          currentRuleVersionCheckDigest crvcd 
        where
          rowNum = 1
        ON DUPLICATE KEY UPDATE
          \`version\`=crvcd.version,
          checkDigest=crvcd.checkDigest`,
        binds: []
      }
    }

    let { revision, ...benchmarkBinds } = b
    // QUERY: stig
    dml.stig.binds = benchmarkBinds
    delete dml.stig.binds.scap

    let { groups, ...revisionBinds } = revision
    delete revisionBinds.revisionStr
    revisionBinds.benchmarkId = benchmarkBinds.benchmarkId
    revisionBinds.revId = `${revisionBinds.benchmarkId}-${revisionBinds.version}-${revisionBinds.release}`
    revisionBinds.benchmarkDateSql = revisionBinds.benchmarkDate8601
    delete revisionBinds.benchmarkDate8601
    revisionBinds.lowCount = revisionBinds.mediumCount = revisionBinds.highCount = 0
    // QUERY: revision
    dml.revision.binds = revisionBinds

    let ruleCount = 0
    let checkCount = 0
    let fixCount = 0
    for (const group of groups) {
      let { rules, ...groupBinds } = group

      let groupSeverity
      for (const rule of rules) {
        ruleCount++
        let { checks, fixes, idents, ...ruleBinds } = rule
        // Group severity calculation
        if (!groupSeverity) {
          groupSeverity = ruleBinds.severity
        }
        else if (groupSeverity !== ruleBinds.severity) {
          groupSeverity = 'mixed'
        }
        checkCount += checks.length
        fixCount += fixes.length
        const checkSystem = checks.map( check => check.system).join(',')
        const checkContent = checks.map( check => check.content).join('\n\n-----AND-----\n\n')
        const checkDigest = createHash('sha256').update(checkContent).digest()
        const fixref = fixes.map( fix => fix.fixref).join(',')
        const fixText = fixes.map( fix => fix.text).join('\n\n-----AND-----\n\n')
        const fixDigest = createHash('sha256').update(fixText).digest()

        // QUERY: checkContent
        dml.checkContent.binds.push([checkContent])

        // QUERY: fixText
        dml.fixText.binds.push([fixText])
        
        // QUERY: revGroupRuleMap
        dml.revGroupRuleMap.binds.push([
          revisionBinds.revId,
          groupBinds.groupId,
          groupBinds.title,
          ruleBinds.severity, // groupSeverity hack
          ruleBinds.ruleId,
          ruleBinds.version,
          ruleBinds.title,
          ruleBinds.severity,
          ruleBinds.weight,
          ruleBinds.vulnDiscussion,
          ruleBinds.falsePositives,
          ruleBinds.falseNegatives,
          ruleBinds.documentable,
          ruleBinds.mitigations,
          ruleBinds.severityOverrideGuidance,
          ruleBinds.potentialImpacts,
          ruleBinds.thirdPartyTools,
          ruleBinds.mitigationControl,
          ruleBinds.responsibility,
          ruleBinds.iaControls,
          checkSystem,
          checkDigest,
          fixref,
          fixDigest
        ])
        
        for (const ident of idents) {
          if (ident.system === 'http://iase.disa.mil/cci' || ident.system === 'http://cyber.mil/cci') {
            dml.tempRuleCci.binds.push([
              rule.ruleId,
              ident.ident.replace('CCI-', '')])
          }
        }
      }

      // QUERY: rev_group_rule_cci_map
      dml.revGroupRuleCciMap.binds = { revId: revisionBinds.revId }
    }

    dml.revision.binds.groupCount = groups.length
    dml.revision.binds.checkCount = checkCount
    dml.revision.binds.fixCount = fixCount

    // add rule severity counts to the revision binds. groupRule[7] is the location of the severity value
    dml.revGroupRuleMap.binds.reduce((binds, groupRule) => {
      const prop = `${groupRule[7]}Count`
      binds[prop] = (binds[prop] ?? 0) + 1
      return binds
    }, dml.revision.binds)

    // QUERY: ruleVersionCheckDigest
    dml.ruleVersionCheckDigest.binds.push(benchmarkBinds.benchmarkId)

    return {ddl, dml}
  }
}

/**
 * Deletes the specified revision of a STIG
 *
 * benchmarkId String A path parameter that identifies a STIG
 * revisionStr String A path parameter that identifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.deleteRevisionByString = async function(benchmarkId, revisionStr, svcStatus = {}) {

  let dmls = [
    "DELETE from collection_rev_map where revId = (SELECT revId FROM revision WHERE benchmarkId = :benchmarkId and `version` = :version and `release` = :release)",
    "DELETE FROM revision WHERE benchmarkId = :benchmarkId and `version` = :version and `release` = :release",
    "DELETE FROM check_content WHERE digest NOT IN (select checkDigest from rev_group_rule_map)",
    "DELETE FROM fix_text WHERE digest NOT IN (select fixDigest from rev_group_rule_map)",
    "DELETE FROM rule_version_check_digest WHERE ruleId NOT IN (select DISTINCT ruleId from rev_group_rule_map)"
]
  let currentRevDmls = [
    "DELETE from current_rev where benchmarkId = :benchmarkId",
    `INSERT INTO current_rev (
        revId,
        benchmarkId,
        \`version\`, 
        \`release\`, 
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount)
      SELECT 
        revId,
        benchmarkId,
        \`version\`,
        \`release\`,
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        lowCount,
        mediumCount,
        highCount,
        checkCount,
        fixCount
      FROM
        v_current_rev
      WHERE
        v_current_rev.benchmarkId = :benchmarkId`,
    "DELETE FROM stig WHERE benchmarkId NOT IN (select benchmarkId FROM current_rev)"
  ]

  let connection;
  try {
    const {version, release} = dbUtils.parseRevisionStr(revisionStr)
    let binds = {
      benchmarkId: benchmarkId,
      version: version,
      release: release,
      revId: `${benchmarkId}-${version}-${release}`
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    
    async function transaction () {
      await connection.query('START TRANSACTION')

      // note if this is the current revision
      const [crRows] = await connection.query('SELECT * FROM current_rev WHERE benchmarkId = :benchmarkId and `version` = :version and `release` = :release', binds)
      const wasCurrentRev = !!crRows.length
      // note if this revision is used to calculate stats
      const [drRows] = await connection.query('SELECT collectionId FROM default_rev WHERE benchmarkId = :benchmarkId and revId = :revId', binds)
      const wasDefaultRev = !!drRows.length

      // re-materialize current_rev if we're deleting the current revision
      if (wasCurrentRev) {
        dmls = dmls.concat(currentRevDmls)
      }
  
      for (const sql of dmls) {
       await connection.query(sql, binds)
      }

      // re-calculate review statistics and repopulate default_rev from view if we've affected default_rev
      if (wasDefaultRev) {
        const collectionIds = drRows.map( row => row.collectionId)
        await dbUtils.updateDefaultRev( connection, {collectionIds, benchmarkId})
        await dbUtils.updateStatsAssetStig( connection, {collectionIds, benchmarkId})
      }
  
      await connection.commit()
    }
    
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
  }
  catch(err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Deletes a STIG (*** and all revisions ***)
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.deleteStigById = async function(benchmarkId, userObject, svcStatus = {}) {

  let dmls = [
    "DELETE from stig where benchmarkId = :benchmarkId",
    "DELETE from current_rev where benchmarkId = :benchmarkId",
    "DELETE from collection_rev_map where benchmarkId = :benchmarkId",
    "DELETE from default_rev where benchmarkId = :benchmarkId",
    "DELETE FROM check_content WHERE digest NOT IN (select checkDigest from rev_group_rule_map)",
    "DELETE FROM fix_text WHERE digest NOT IN (select fixDigest from rev_group_rule_map)",
    "DELETE FROM rule_version_check_digest WHERE ruleId NOT IN (select DISTINCT ruleId from rev_group_rule_map)"
  ]

  let connection;

  try {
    let rows = await _this.queryStigs( {benchmarkId: benchmarkId}, [], userObject)

    let binds = {
      benchmarkId: benchmarkId
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION')

      for (const sql of dmls) {
        await connection.query(sql, binds)
      }
   
      await dbUtils.updateStatsAssetStig( connection, {benchmarkId})
   
      await connection.commit()  
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return (rows[0])
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}


/**
 * Return data for the specified CCI
 *
 * cci String A path parameter that indentifies a CCI
 * returns List
 **/
exports.getCci = async function(cci, inProjection, userObject) {
  let columns = [
    'c.cci', 
    'c.status', 
    'c.publishdate', 
    'c.contributor', 
    'c.type', 
    'c.definition'
  ]

  const orderBy = ['c.cci']

  let joins = [
    'cci c '
  ]
  
  let predicates = {
    statements: [],
    binds: []
  }
  
  // PREDICATES
  predicates.statements.push('c.cci = ?')
  predicates.binds.push(cci)

  if ( inProjection?.includes('emassAp') ) {
    columns.push(`case when c.apAcronym is null then null else json_object("apAcronym", c.apAcronym, "implementation", c.implementation, "assessmentProcedure", c.assessmentProcedure) END  as "emassAp"`)
  }

  if ( inProjection?.includes('references') ) {
    columns.push(`(select 
      coalesce
      (
        (
          select json_arrayagg (json_object(
            'creator', crm.creator,
            'title', crm.title,
            'version', crm.version,
            'location', crm.location,
            'indexDisa', crm.indexDisa,
            'textRefNist', crm.textRefNist,
            'parentControl', crm.parentControl
          ))
          from cci_reference_map crm
          where crm.cci = c.cci
        ), 
        json_array()
      )
    ) as "references"`)
  }

  if ( inProjection?.includes('stigs') ) {
    columns.push(`(select 
      coalesce
      (
        (
          select json_arrayagg(stig)
          from
          (
            select distinct json_object(
              'benchmarkId', rv.benchmarkId,
              'revisionStr', concat('V', rv.version, 'R', rv.release)
          ) as stig
          from cci ci
            left join rev_group_rule_cci_map rgrcc using (cci)
            left join rev_group_rule_map rgr using (rgrId)
            left join revision rv using (revId)
          where ci.cci = c.cci and benchmarkId is not null
          ) as agg), 
        json_array()
      )
    ) as "stigs"`)
  }

  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})

  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)

    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} ) 
  }
  // finally{}
}


/**
 * Return a list of CCIs from a STIG revision
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns List
 **/
exports.getCcisByRevision = async function(benchmarkId, revisionStr, userObject) {
  let columns = [
    'c.cci',
    'c.type',
    `COALESCE((
      SELECT JSON_ARRAYAGG(JSON_OBJECT(
        "creator", crm.creator,
        "title", crm.title,
        "version", crm.version,
        "location", crm.location,
        "indexDisa", crm.indexDisa,
        "textRefNist", crm.textRefNist,
        "parentControl", crm.parentControl
      ))
      FROM cci_reference_map crm
      WHERE crm.cci = c.cci
    ), JSON_ARRAY()) AS "references"`
  ]

  const orderBy = ['c.cci']

  let joins = []
  let predicates = {
    statements: [],
    binds: []
  }
  
  predicates.statements.push('r.benchmarkId = ?')
  predicates.binds.push(benchmarkId)
  
  if (revisionStr != 'latest') {
    joins = ['revision r']

    const {version, release} = dbUtils.parseRevisionStr(revisionStr)
    predicates.statements.push('r.version = ?')
    predicates.binds.push(version)
    predicates.statements.push('r.release = ?')
    predicates.binds.push(release)
  } 
  else {
    joins = ['current_rev r']
  }
  
  joins.push('LEFT JOIN rev_group_rule_map rgr using (revId)')
  joins.push('INNER JOIN rev_group_rule_cci_map rgrcc using (rgrId)')
  joins.push('LEFT JOIN cci c using (cci)')
  // joins.push('LEFT JOIN cci_reference_map crm using (cci)')

  // CONSTRUCT MAIN QUERY
  const sql = dbUtils.makeQueryString({columns, joins, predicates, orderBy})
  
  try {
    let [rows] = await dbUtils.pool.query(sql, predicates.binds)
    return rows
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
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
    let rows = await _this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr,
      groupId: groupId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
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
    let rows = await _this.queryGroups( projection, {
      benchmarkId: benchmarkId,
      revisionStr: revisionStr
    })
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return metadata for the specified revision of a STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * revisionStr String A path parameter that indentifies a STIG revision [ V{version_num}R{release_num} | 'latest' ]
 * returns Revision
 **/
exports.getRevisionByString = async function(benchmarkId, revisionStr, userObject, elevate = false) {
  try {
    const ro = dbUtils.parseRevisionStr(revisionStr)
    const sql = 
    `WITH cte_rev_collection AS (select
        r.revId,
        cast(concat('[', group_concat(distinct concat('"',crm.collectionId,'"')),']') as json) as collectionIds
        from
        revision r
        inner join collection_rev_map crm using (revId)
        ${elevate ? '' : `left join collection_grant cg on crm.collectionId = cg.collectionId
        left join stig_asset_map sa on r.benchmarkId = sa.benchmarkId
        left join user_stig_asset_map usa on sa.saId = usa.saId
        where  (cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)`}
        group by r.revId)
    SELECT
      ${ro.table_alias}.benchmarkId,
      concat('V', ${ro.table_alias}.version, 'R', ${ro.table_alias}.release) as "revisionStr",
      cast(${ro.table_alias}.version as char) as version,
      ${ro.table_alias}.release,
      date_format(${ro.table_alias}.benchmarkDateSql,'%Y-%m-%d') as "benchmarkDate",
      ${ro.table_alias}.status,
      ${ro.table_alias}.statusDate,
      ${ro.table_alias}.ruleCount,
      coalesce(rc.collectionIds,json_array()) as collectionIds
    FROM
      ${ro.table} ${ro.table_alias}
      left join cte_rev_collection rc on ${ro.table_alias}.revId = rc.revId
    WHERE
      ${ro.table_alias}.benchmarkId = ?
      ${ro.predicates}
    ORDER BY
      ${ro.table_alias}.benchmarkDateSql desc
    `
    const binds = elevate ? [benchmarkId] : [userObject.userId, benchmarkId]
    if (ro.version) {
      binds.push(ro.version, ro.release)
    }
    const [rows] = await dbUtils.pool.query(sql, binds)
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return a list of revisions for the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns List
 **/
exports.getRevisionsByBenchmarkId = async function(benchmarkId, userObject, elevate = false) {
  try {
    let sql = 
    `WITH cte_rev_collection AS (select
        r.revId,
        cast(concat('[', group_concat(distinct concat('"',crm.collectionId,'"')),']') as json) as collectionIds
        from
        revision r
        inner join collection_rev_map crm using (revId)
        ${elevate ? '' : `left join collection_grant cg on crm.collectionId = cg.collectionId
        left join stig_asset_map sa on r.benchmarkId = sa.benchmarkId
        left join user_stig_asset_map usa on sa.saId = usa.saId
        where  (cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)`}
        group by r.revId)
    SELECT
      r.benchmarkId,
      concat('V', r.version, 'R', r.release) as "revisionStr",
      CAST(r.version as char) as version,
      r.release,
      date_format(r.benchmarkDateSql,'%Y-%m-%d') as "benchmarkDate",
      r.status,
      r.statusDate,
      r.ruleCount,
      coalesce(rc.collectionIds,json_array()) as collectionIds
    FROM
      revision r
      left join cte_rev_collection rc on r.revId = rc.revId
    WHERE
      r.benchmarkId = ?
    ORDER BY
      r.benchmarkDateSql desc`
    const binds = elevate ? [benchmarkId] : [userObject.userId, benchmarkId]
    let [rows] = await dbUtils.pool.query(sql, binds)
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
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
    let rows = await _this.queryRules( ruleId, projection )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
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
    let rows = await _this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {
      ruleId: ruleId
    })
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
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
    let rows = await _this.queryBenchmarkRules( benchmarkId, revisionStr, projection, {} )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return a list of available STIGs
 *
 * title String A string found anywhere in a STIG title (optional)
 * returns List
 **/
exports.getSTIGs = async function(title, projection, userObject, elevate) {
  try {
    let rows = await _this.queryStigs( {
      title: title
    }, projection, userObject, elevate )
    return (rows)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}


/**
 * Return properties of the specified STIG
 *
 * benchmarkId String A path parameter that indentifies a STIG
 * returns STIG
 **/
exports.getStigById = async function(benchmarkId, userObject, elevate) {
  try {
    let rows = await _this.queryStigs( {
      benchmarkId: benchmarkId
    }, ['revisions'], userObject, elevate )
    return (rows[0])
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.getRevisionStrsByBenchmarkId = async function (benchmarkId) {
  try {
    const sql = `SELECT
      concat('V', r.version, 'R', r.release) as "revisionStr"
    FROM
      revision r
    WHERE
      r.benchmarkId = ?`
    const [rows] = await dbUtils.pool.query(sql, [benchmarkId])
    return rows.map( row => row.revisionStr)
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}

exports.getRevisionStrsByBenchmarkIds = async function (benchmarkIds) {
  try {
    const sql = `SELECT
      r.benchmarkId,
      json_arrayagg(concat('V', r.version, 'R', r.release)) as "revisionStrs"
    FROM
      revision r
    WHERE
      r.benchmarkId IN ?
    GROUP BY
      r.benchmarkId`
    const [rows] = await dbUtils.pool.query(sql, [[benchmarkIds]])
    const returnObj = {}
    for (const row of rows) {
      returnObj[row.benchmarkId] = row.revisionStrs
    }
    return returnObj
  }
  catch(err) {
    throw ( {status: 500, message: err.message, stack: err.stack} )
  }
}
