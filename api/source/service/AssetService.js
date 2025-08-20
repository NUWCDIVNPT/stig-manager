'use strict';
const dbUtils = require('./utils')
const config = require('../utils/config')
const uuid = require('uuid')

let _this = this

/**
Generalized queries for asset(s).
**/
exports.queryAssets = async function ({projections = [], filter = {}, grant = {}}) {
  const ctes = []
  const columns = [
    'CAST(a.assetId as char) as assetId',
    'a.name',
    'a.fqdn',
    `json_object (
      'collectionId', CAST(c.collectionId as char),
      'name', c.name
    ) as "collection"`,
    'a.description',
    'a.ip',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = a.assetId),
      json_array()
    ) as labelIds`,
    'a.mac',
    'a.noncomputing',
    'a.metadata'
  ]
  const joins = [
    'enabled_asset a',
    'left join enabled_collection c on a.collectionId = c.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId'
  ]
  if (grant.roleId === 1) {
    ctes.push(dbUtils.cteAclEffective({grantIds: grant.grantIds}))
    joins.push('inner join cteAclEffective cae on sa.saId = cae.saId')
  }

    // PROJECTIONS
    if (projections.includes('statusStats')) {
      columns.push(`(select json_object(
        'stigCount', COUNT(saStatusStats.benchmarkId),
        'ruleCount', SUM(rStatusStats.ruleCount),
        'acceptedCount', SUM(saStatusStats.accepted),
        'rejectedCount', SUM(saStatusStats.rejected),
        'submittedCount', SUM(saStatusStats.submitted),
        'savedCount', SUM(saStatusStats.saved),
        'minTs', DATE_FORMAT(LEAST(MIN(saStatusStats.minTs), MIN(saStatusStats.maxTs)),'%Y-%m-%dT%H:%i:%sZ'),
        'maxTs', DATE_FORMAT(GREATEST(MAX(saStatusStats.minTs), MAX(saStatusStats.maxTs)),'%Y-%m-%dT%H:%i:%sZ')
        )
        from
          stig_asset_map saStatusStats
          left join enabled_asset aStatusStats using (assetId)
          left join default_rev drStatusStats on (saStatusStats.benchmarkId = drStatusStats.benchmarkId and aStatusStats.collectionId = drStatusStats.collectionId)
          left join revision rStatusStats on drStatusStats.revId = rStatusStats.revId
        where
          FIND_IN_SET(saStatusStats.saId, GROUP_CONCAT(sa.saId))
        ) as "statusStats"`)
    }

    if (projections.includes('stigs')) {
      //iterate: If benchmarkId is a predicate in main query, this incorrectly only shows that STIG
      joins.push('left join default_rev dr on (sa.benchmarkId=dr.benchmarkId and a.collectionId = dr.collectionId)')
      joins.push('left join revision on dr.revId = revision.revId')
      columns.push(`cast(
        concat('[', 
          coalesce (
            group_concat(distinct 
              case when sa.benchmarkId is not null then 
                json_object(
                  'benchmarkId', sa.benchmarkId, 
                  'revisionStr', revision.revisionStr, 
                  'benchmarkDate', date_format(revision.benchmarkDateSql,'%Y-%m-%d'),
                  'revisionPinned', CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END, 
                  'ruleCount', revision.ruleCount)
              else null end 
            order by sa.benchmarkId),
            ''),
        ']')
      as json) as "stigs"`)
    }

      // PREDICATES
  const predicates = {
    statements: [],
    binds: []
  }
  if (filter.assetId) {
    predicates.statements.push('a.assetId = ?')
    predicates.binds.push(filter.assetId)
  }
  
  if (filter.assetIds && filter.assetIds.length > 0) {
    predicates.statements.push(`a.assetId IN ?`)
    predicates.binds.push([filter.assetIds])
  }
  if (filter.labels?.labelNames || filter.labels?.labelIds || filter.labels?.labelMatch) {
    joins.push(
      'left join collection_label_asset_map cla2 on a.assetId = cla2.assetId',
      'left join collection_label cl2 on cla2.clId = cl2.clId'
    )
    const labelPredicates = []
    if (filter.labels.labelIds) {
      labelPredicates.push('cl2.uuid IN ?')
      const uuidBinds = filter.labels.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (filter.labels.labelNames) {
      labelPredicates.push('cl2.name IN ?')
      predicates.binds.push([filter.labels.labelNames])
    }
    if (filter.labels.labelMatch === 'null') {
      labelPredicates.push('cl2.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    predicates.statements.push(labelPredicatesClause)
  }
  if ( filter.name ) {
    let matchStr = '= ?'
    if ( filter.nameMatch && filter.nameMatch !== 'exact') {
      matchStr = 'LIKE ?'
      switch (filter.nameMatch) {
        case 'startsWith':
          filter.name = `${filter.name}%`
          break
        case 'endsWith':
          filter.name = `%${filter.name}`
          break
        case 'contains':
          filter.name = `%${filter.name}%`
          break
      }
    }
    predicates.statements.push(`a.name ${matchStr}`)
    predicates.binds.push(filter.name)
  }
  if (filter.collectionId) {
    predicates.statements.push('a.collectionId = ?')
    predicates.binds.push(filter.collectionId)
  }
  if (filter.benchmarkId) {
    predicates.statements.push('sa.benchmarkId = ?')
    predicates.binds.push(filter.benchmarkId)
  }
  if (filter.metadata ) {
    for (const pair of filter.metadata) {
      const [key, value] = pair.split(/:(.*)/s)
      predicates.statements.push('JSON_CONTAINS(a.metadata, ?, ?)')
      predicates.binds.push( JSON.stringify(value), `$.${key}`)
    }
  }

  const groupBy = [
    'a.assetId'
  ]
  const orderBy = []

  const sql = dbUtils.makeQueryString({ctes, columns, joins, predicates, groupBy, orderBy, format: true})
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.queryChecklist = async function (inPredicates) {
  let connection
  try {
    const columns = [
      'CAST(:assetId as char) as "assetId"',
      'rgr.ruleId',
      'rgr.title as "ruleTitle"',
      'rgr.version',
      'rgr.groupId',
      'rgr.groupTitle',
      'rgr.severity',
      `result.api as "result"`,
      `CASE WHEN review.resultEngine = 0 THEN NULL ELSE review.resultEngine END as resultEngine`,
      `review.autoResult`,
      `status.api as "status"`,
      `review.statusTs`,
      `review.ts`,
      `review.touchTs`
    ]
    const joins = [
      'current_rev rev',
      'left join rev_group_rule_map rgr using (revId)',
      'left join rule_version_check_digest rvcd using (ruleId)',
      'left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = :assetId)',
      'left join result on review.resultId=result.resultId',
      'left join status on review.statusId=status.statusId',
      'left join enabled_asset a on review.assetId=a.assetId'
    ]
    const predicates = {
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
      const {version, release} = dbUtils.parseRevisionStr(inPredicates.revisionStr)
      const revId =  `${inPredicates.benchmarkId}-${version}-${release}`
      predicates.statements.push('rev.revId = :revId')
      predicates.binds.revId = revId
    }
    const groupBy = [
      'rgr.rgrId',
      'result.api',
      'review.reviewId',
      'status.api',
    ]
    const orderBy = [
      'substring(rgr.groupId from 3) + 0'
    ]

    const sql = dbUtils.makeQueryString({columns, joins, predicates, groupBy, orderBy}) 
    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true

    let [rows] = await connection.query( sql, predicates.binds )
    return (rows)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.cklFromAssetStigs = async function cklFromAssetStigs (assetId, stigs) {
  let connection
  try {
    let revisionStrResolved // Will hold specific revision string value, as opposed to "latest" 
    const xmlJs = {
      CHECKLIST: {
        ASSET: {
          ROLE: 'None',
          ASSET_TYPE: 'Computing',
          MARKING: null,
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
          iSTIG: []
        }
      }
    }

    const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from enabled_asset where assetId = ?"
    const sqlGetChecklist =`SELECT 
      rgr.groupId,
      rgr.severity,
      rgr.groupTitle,
      rgr.ruleId,
      rgr.title as "ruleTitle",
      rgr.weight,
      rgr.version,
      rgr.vulnDiscussion,
      rgr.iaControls,
      rgr.falsePositives,
      rgr.falseNegatives,
      rgr.documentable,
      rgr.mitigations,
      rgr.potentialImpacts,
      rgr.thirdPartyTools,
      rgr.mitigationControl,
      rgr.responsibility,
      rgr.severityOverrideGuidance,
      result.ckl as "result",
      LEFT(review.detail,32767) as "detail",
      LEFT(review.comment,32767) as "comment",
      cc.content as "checkContent",
      ft.text as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_rule_map rgr on rev.revId = rgr.revId 
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      left join severity_cat_map sc on rgr.severity = sc.severity 
      
      left join rev_group_rule_cci_map rgrcc on rgr.rgrId = rgrcc.rgrId

      left join check_content cc on rgr.checkDigest = cc.digest

      left join fix_text ft on rgr.fixDigest = ft.digest

      left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 

    WHERE
      rev.revId = ?
    GROUP BY
      rgr.rgrId,
      result.ckl,
      review.detail,
      review.comment
    order by
      substring(rgr.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // ASSET
    const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    xmlJs.CHECKLIST.ASSET.HOST_NAME = resultGetAsset[0].metadata.cklHostName ? resultGetAsset[0].metadata.cklHostName : resultGetAsset[0].name
    xmlJs.CHECKLIST.ASSET.HOST_FQDN = resultGetAsset[0].fqdn
    xmlJs.CHECKLIST.ASSET.HOST_IP = resultGetAsset[0].ip
    xmlJs.CHECKLIST.ASSET.HOST_MAC = resultGetAsset[0].mac
    xmlJs.CHECKLIST.ASSET.ASSET_TYPE = resultGetAsset[0].noncomputing ? 'Non-Computing' : 'Computing'
    xmlJs.CHECKLIST.ASSET.ROLE = resultGetAsset[0].metadata.cklRole ?? 'None'
    xmlJs.CHECKLIST.ASSET.TECH_AREA = resultGetAsset[0].metadata.cklTechArea ?? null
    xmlJs.CHECKLIST.ASSET.WEB_OR_DATABASE = resultGetAsset[0].metadata.cklHostName ?  'true' : 'false'
    xmlJs.CHECKLIST.ASSET.WEB_DB_SITE = resultGetAsset[0].metadata.cklWebDbSite ?? null
    xmlJs.CHECKLIST.ASSET.WEB_DB_INSTANCE = resultGetAsset[0].metadata.cklWebDbInstance ?? null
    
    // CHECKLIST.STIGS.iSTIG.STIG_INFO.SI_DATA
    const markings = []
    for (const stigItem of stigs) {
      const revisionStr = stigItem.revisionStr || 'latest'
      revisionStrResolved = revisionStr
      const benchmarkId = stigItem.benchmarkId
      
      let sqlGetBenchmarkId
      if (revisionStr === 'latest') {
        sqlGetBenchmarkId = `select
          cr.benchmarkId, 
          s.title, 
          cr.revId, 
          cr.description, 
          cr.version, 
          cr.release, 
          cr.benchmarkDate,
          cr.marking
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
          r.benchmarkDate,
          r.marking
        from 
          stig s 
          left join revision r on s.benchmarkId=r.benchmarkId
        where
          r.revId = ?`  
      }
      // Calculate revId
      let resultGetBenchmarkId, revId
      if (revisionStr === 'latest') {
        ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
        revId = resultGetBenchmarkId[0].revId
        revisionStrResolved = `V${resultGetBenchmarkId[0].version}R${resultGetBenchmarkId[0].release}`
      }
      else {
        const {version, release} = dbUtils.parseRevisionStr(revisionStr)
        revId =  `${benchmarkId}-${version}-${release}`
        ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
      }
  
      const stig = resultGetBenchmarkId[0]
      // Set the marking
      if (stig.marking) {
        markings.push(stig.marking)
      }
      const siDataRefs = [
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
      const iStigJs = {
        STIG_INFO:
          {
            SI_DATA: []
          },
        VULN: []
      }
      const siDataArray = iStigJs.STIG_INFO.SI_DATA
      for (const siDatum of siDataRefs) {
        siDataArray.push(siDatum)
      }
  
      // CHECKLIST.STIGS.iSTIG.STIG_INFO.VULN
      const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])
  
      const stigDataRef = [
        ['Vuln_Num', 'groupId' ],
        ['Severity',  'severity' ],
        ['Weight',  'weight' ],
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
  
      // let vulnArray = xmlJs.CHECKLIST.STIGS.iSTIG.VULN
      const vulnArray = iStigJs.VULN
      for (const r of resultGetChecklist) {
        const vulnObj = {
          STIG_DATA: [],
          STATUS: r.result || 'Not_Reviewed',
          FINDING_DETAILS: r.detail,
          COMMENTS: r.comment,
          SEVERITY_OVERRIDE: null,
          SEVERITY_JUSTIFICATION: null
        }
        for (const stigDatum of stigDataRef) {
          vulnObj.STIG_DATA.push({
            VULN_ATTRIBUTE: stigDatum[0],
            ATTRIBUTE_DATA: r[stigDatum[1]]
          })
        }
        // STIGRef
        vulnObj.STIG_DATA.push({
          VULN_ATTRIBUTE: 'STIGRef',
          ATTRIBUTE_DATA: `${stig.title} :: Version ${stig.version}, Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`
        })
        // CCI_REFs
        if (r.ccis) {
          const ccis = r.ccis.split(',')
          for (const cci of ccis) {
            vulnObj.STIG_DATA.push({
              VULN_ATTRIBUTE: 'CCI_REF',
              ATTRIBUTE_DATA: `CCI-${cci}`
            })
          }
        }
        vulnArray.push(vulnObj)        
      }
      xmlJs.CHECKLIST.STIGS.iSTIG.push(iStigJs)
    }
    // calculate the marking for this checklist
    let marking = config.settings.setClassification === 'NONE' ? 'U' : config.settings.setClassification
    if (marking === 'U' || marking === 'CUI') {
      const sortedMarkings = markings.toSorted((a, b) => a.localeCompare(b)) // because CUI, FOUO, U sort alphabetically
      marking = sortedMarkings[0] || 'U'
    }
    return ({assetName: resultGetAsset[0].name, xmlJs, revisionStrResolved, marking})
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }

}

exports.cklbFromAssetStigs = async function cklbFromAssetStigs (assetId, stigs) {
  let connection
  try {
    let revisionStrResolved // Will hold specific revision string value, as opposed to "latest"
    const cklb = {
      title: '',
      id: uuid.v1(),
      active: false,
      mode: 1,
      has_path: true,
      target_data: {
        target_type: '',
        host_name: '',
        ip_address: '',
        mac_address: '',
        fqdn: '',
        comments: '',
        role: '',
        is_web_database: false,
        technology_area: '',
        web_db_site: '',
        web_db_instance: ''
      },
      stigs: []
    }

    const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from enabled_asset where assetId = ?"
    const sqlGetChecklist =`SELECT 
      rgr.groupId,
      rgr.severity,
      rgr.groupTitle,
      rgr.ruleId,
      rgr.title as "ruleTitle",
      rgr.weight,
      rgr.version,
      rgr.vulnDiscussion,
      rgr.iaControls,
      rgr.falsePositives,
      rgr.falseNegatives,
      rgr.documentable,
      rgr.mitigations,
      rgr.potentialImpacts,
      rgr.thirdPartyTools,
      rgr.mitigationControl,
      rgr.responsibility,
      rgr.severityOverrideGuidance,
      result.cklb as "result",
      LEFT(review.detail,32767) as "detail",
      LEFT(review.comment,32767) as "comment",
      review.ts as "createdAt",
      review.touchTs as "updatedAt",
      cc.content as "checkContent",
      ft.text as "fixText",
      group_concat(rgrcc.cci ORDER BY rgrcc.cci) as "ccis"
    FROM
      revision rev 
      left join rev_group_rule_map rgr on rev.revId = rgr.revId 
      left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
      left join severity_cat_map sc on rgr.severity = sc.severity 
      
      left join rev_group_rule_cci_map rgrcc on rgr.rgrId = rgrcc.rgrId

      left join check_content cc on rgr.checkDigest = cc.digest

      left join fix_text ft on rgr.fixDigest = ft.digest

      left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)
      left join result on review.resultId = result.resultId 
      left join status on review.statusId = status.statusId 

    WHERE
      rev.revId = ?
    GROUP BY
      rgr.rgrId,
      result.cklb,
      review.reviewId
    order by
      substring(rgr.groupId from 3) + 0 asc
    `
    connection = await dbUtils.pool.getConnection()

    // cklb.target_data
    const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
    cklb.target_data.host_name = resultGetAsset[0].metadata.cklHostName ? resultGetAsset[0].metadata.cklHostName : resultGetAsset[0].name
    cklb.target_data.fqdn = resultGetAsset[0].fqdn ?? ''
    cklb.target_data.ip_address = resultGetAsset[0].ip ?? ''
    cklb.target_data.mac_address = resultGetAsset[0].mac ?? ''
    cklb.target_data.target_type = resultGetAsset[0].noncomputing ? 'Non-Computing' : 'Computing'
    cklb.target_data.role = resultGetAsset[0].metadata.cklRole ?? 'None'
    cklb.target_data.technology_area = resultGetAsset[0].metadata.cklTechArea ?? ''
    cklb.target_data.is_web_database = !!resultGetAsset[0].metadata.cklHostName
    cklb.target_data.web_db_site = resultGetAsset[0].metadata.cklWebDbSite ?? ''
    cklb.target_data.web_db_instance = resultGetAsset[0].metadata.cklWebDbInstance ?? ''
    
    // cklb.stigs
    const markings = []
    for (const stigItem of stigs) {
      const revisionStr = stigItem.revisionStr || 'latest'
      revisionStrResolved = revisionStr
      const benchmarkId = stigItem.benchmarkId
      
      let sqlGetBenchmarkId
      if (revisionStr === 'latest') {
        sqlGetBenchmarkId = `select
          cr.benchmarkId, 
          s.title, 
          cr.revId, 
          cr.description, 
          cr.version, 
          cr.release, 
          cr.benchmarkDate,
          cr.ruleCount,
          cr.marking
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
          r.benchmarkDate,
          r.ruleCount,
          r.marking
        from 
          stig s 
          left join revision r on s.benchmarkId=r.benchmarkId
        where
          r.revId = ?`  
      }
      // Calculate revId
      let resultGetBenchmarkId, revId
      if (revisionStr === 'latest') {
        ;[resultGetBenchmarkId] = await connection.query(sqlGetBenchmarkId, [benchmarkId])
        revId = resultGetBenchmarkId[0].revId
        revisionStrResolved = `V${resultGetBenchmarkId[0].version}R${resultGetBenchmarkId[0].release}`
      }
      else {
        const {version, release} = dbUtils.parseRevisionStr(revisionStr)
        revId =  `${benchmarkId}-${version}-${release}`
        ;[resultGetBenchmarkId] = await connection.execute(sqlGetBenchmarkId, [revId])
      }
  
      const stig = resultGetBenchmarkId[0]
      // Set the marking
      if (stig.marking) {
        markings.push(stig.marking)
      }

      const stigUuid = uuid.v1()
      const stigObj = {
        stig_name: stig.title,
        display_name: stig.title.replace(' Security Technical Implementation Guide', ''),
        stig_id: stig.benchmarkId,
        version: `${stig.version}`,
        release_info: `Release: ${stig.release} Benchmark Date: ${stig.benchmarkDate}`,
        uuid: stigUuid,
        reference_identifier: '0000',
        size: stig.ruleCount,
        rules: []
      }

      // cklb.stigs[x].rules
      const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revId])  
      for (const row of resultGetChecklist) {
        const rule = {
          uuid: uuid.v1(),
          stig_uuid: stigUuid,
          target_key: null,
          stig_ref: null,
          group_id: row.groupId,
          rule_id: row.ruleId.replace('_rule', ''),
          rule_id_src: row.ruleId,
          weight: row.weight,
          classification: config.settings.setClassification,
          severity: row.severity,
          rule_version: row.version,
          group_title: row.groupTitle,
          rule_title: row.ruleTitle,
          fix_text: row.fixText,
          false_positives: row.falsePositives,
          false_negatives: row.falseNegatives,
          discussion: row.vulnDiscussion,
          check_content: row.checkContent,
          documentable: row.documentable,
          mitigations: row.mitigations,
          potential_impacts: row.potentialImpacts,
          third_party_tools: row.thirdPartyTools,
          mitigation_control: row.mitigationControl,
          responsibility: row.responsibility,
          security_override_guidance: row.severityOverrideGuidance,
          ia_controls: row.iaControls,
          check_content_ref: {
            href: '',
            name: 'M'
          },
          legacy_ids: [],
          group_tree: [
            {
              id: row.groupId,
              title: row.groupTitle,
              description: '<GroupDescription></GroupDescription>'
            }
          ],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          STIGUuid: stigUuid,
          status: row.result || 'not_reviewed',
          overrides: {},
          comments: row.comment ?? '',
          finding_details: row.detail ?? ''
        }

        // CCI_REFs
        rule.ccis = row.ccis ? row.ccis.split(',').map( cci => `CCI-${cci}`) : []
        stigObj.rules.push(rule)
      }
      cklb.stigs.push(stigObj)
    }

    // calculate the marking for this checklist
    let marking = config.settings.setClassification === 'NONE' ? 'U' : config.settings.setClassification
    if (marking === 'U' || marking === 'CUI') {
      const sortedMarkings = markings.toSorted((a, b) => a.localeCompare(b)) // because CUI, FOUO, U sort alphabetically
      marking = sortedMarkings[0] || 'U'
    }

    return ({assetName: resultGetAsset[0].name, cklb, revisionStrResolved, marking})
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.xccdfFromAssetStig = async function (assetId, benchmarkId, revisionStr = 'latest') {
    // queries and query methods
  const sqlGetAsset = "select name, fqdn, ip, mac, noncomputing, metadata from enabled_asset where assetId = ?"
  const sqlGetChecklist =`SELECT 
    rgr.groupId,
    rgr.groupTitle,
    rgr.ruleId,
    rgr.title as "ruleTitle",
    rgr.severity,
    rgr.weight,
    rgr.version,
    rgr.checkSystem,
    cc.content as "checkContent",
    result.api as "result",
    review.ts,
    LEFT(review.detail,32767) as "detail",
    LEFT(review.comment,32767) as "comment",
    review.resultEngine
  FROM
    revision rev 
    left join rev_group_rule_map rgr on rev.revId = rgr.revId 
    left join check_content cc on rgr.checkDigest = cc.digest
    left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
    left join review on (rvcd.version = review.version and rvcd.checkDigest = review.checkDigest and review.assetId = ?)

    left join result on review.resultId = result.resultId 
    left join status on review.statusId = status.statusId 
  WHERE
    rev.revId = ?
  order by
    substring(rgr.groupId from 3) + 0 asc
  `
  async function getBenchmarkRevision(connection, benchmarkId, revisionStr) {
    let revisionStrResolved
    // Benchmark, calculate revId
    const sqlGetRevision = revisionStr === 'latest' ?
      `select
        cr.benchmarkId, 
        s.title, 
        cr.revId, 
        cr.description, 
        cr.version, 
        cr.release, 
        cr.benchmarkDate,
        cr.status,
        cr.statusDate,
        cr.marking
      from
        current_rev cr 
        left join stig s on cr.benchmarkId = s.benchmarkId
      where
        cr.benchmarkId = ?`
    :
    `select
        r.benchmarkId,
        s.title,
        r.revId,
        r.description,
        r.version,
        r.release,
        r.benchmarkDate,
        r.status,
        r.statusDate,
        r.marking
      from 
        stig s 
        left join revision r on s.benchmarkId=r.benchmarkId
      where
        r.revId = ?`  

    let result
    if (revisionStr === 'latest') {
      ;[result] = await connection.query(sqlGetRevision, [benchmarkId])
      revisionStrResolved = `V${result[0].version}R${result[0].release}`
    }
    else {
      const {version, release} = dbUtils.parseRevisionStr(revisionStr)
      const revId = `${benchmarkId}-${version}-${release}`
      ;[result] = await connection.query(sqlGetRevision, [revId])
      revisionStrResolved = revisionStr
    }
    result[0].revisionStr = revisionStrResolved
    return result[0]
  }

  function prefixObjectProperties(prefix, obj) {
    for (const k in obj)
      {
          if (typeof obj[k] == "object" && obj[k] !== null) {
            prefixObjectProperties(prefix, obj[k])
          }
          if (!Array.isArray(obj)) {
            obj[`${prefix}:${k}`] = obj[k]
            delete obj[k] 
          }
      }
  }

  function generateTargetFacts({metadata, ...assetFields}) {
    const fact = []
    for (const field in assetFields) {
      if (assetFields[field]) {
        fact.push({
          '@_name': `tag:stig-manager@users.noreply.github.com,2020:asset:${field}`,
          '@_type': 'string',
          '#text': assetFields[field]
        })  
      }
    }
    for (const key in metadata) {
      if (key.startsWith('urn:')) {
        fact.push({
          '@_name': key,
          '@_type': 'string',
          '#text': metadata[key] || ''
        })
      }
      else {
        fact.push({
          '@_name': `tag:stig-manager@users.noreply.github.com,2020:asset:metadata:${encodeURI(key)}`,
          '@_type': 'string',
          '#text': metadata[key] || ''
        })
      }
    }
    return {"cdf:fact": fact}
  }

  // reuse a connection for multiple SELECT queries
  const connection = await dbUtils.pool.getConnection()
  // target
  const [resultGetAsset] = await connection.query(sqlGetAsset, [assetId])
  // benchmark
  const revision = await getBenchmarkRevision(connection, benchmarkId, revisionStr)
  // checklist
  const [resultGetChecklist] = await connection.query(sqlGetChecklist, [assetId, revision.revId])
  // release connection
  await connection.release()

  // scaffold xccdf object with cdf namespace on all base elements
  const xmlJs = {
    "cdf:Benchmark": {
      "@_xmlns:cdf": "http://checklists.nist.gov/xccdf/1.2",
      "@_xmlns:dc": "http://purl.org/dc/elements/1.1/",
      "@_xmlns:sm": "http://github.com/nuwcdivnpt/stig-manager",
      "@_id": `xccdf_mil.disa.stig_benchmark_${revision.benchmarkId}`,
      "cdf:status": {
        "@_date": revision.statusDate,
        "#text": revision.status
      },
      "cdf:title": revision.title,
      "cdf:description": revision.description,
      "cdf:platform": {
        "@_idref": "cpe:2.3:a:disa:stig"
      },      
      "cdf:version": revision.revisionStr,  
      "cdf:metadata": {
        "dc:creator": "DISA",
        "dc:publisher": "STIG Manager OSS"
      },
      "cdf:Group": [],
      "cdf:TestResult": {
        "@_id": `xccdf_mil.navy.nuwcdivnpt.stig-manager_testresult_${revision.benchmarkId}`,
        "@_test-system": `cpe:/a:nuwcdivnpt:stig-manager:${config.version}`,
        "@_end-time": new Date().toISOString(),
        "@_version": "1.0",
        "cdf:title": "",
        "cdf:target": resultGetAsset[0].name,
        "cdf:target-address": resultGetAsset[0].ip,
        "cdf:target-facts": generateTargetFacts(resultGetAsset[0]),
        "cdf:rule-result": [],
        "cdf:score": "1.0"
      } 
    }
  }  

  // iterate through checklist query results
  for (const r of resultGetChecklist) {
    xmlJs["cdf:Benchmark"]["cdf:Group"].push({
      "@_id": `xccdf_mil.disa.stig_group_${r.groupId}`,
      "cdf:title": r.groupTitle,
      "cdf:Rule": {
        "@_id": `xccdf_mil.disa.stig_rule_${r.ruleId}`,
        "@_weight": r.weight,
        "@_severity": r.severity || undefined,
        "cdf:title": r.ruleTitle,
        "cdf:check": {
          "@_system": r.checkSystem,
          "cdf:check-content": r.checkContent
        }
      }
    })
    if (r.resultEngine) {
      prefixObjectProperties('sm', r.resultEngine)
    }
    xmlJs["cdf:Benchmark"]["cdf:TestResult"]["cdf:rule-result"].push({
      "cdf:result": r.result || "notchecked",
      "@_idref": `xccdf_mil.disa.stig_rule_${r.ruleId}`,
      "@_time": r.ts?.toISOString(),
      "cdf:check": {
        "@_system": r.checkSystem,
        "cdf:check-content": {
          "sm:detail": r.detail || undefined,
          "sm:comment": r.comment || undefined,
          "sm:resultEngine": r.resultEngine || undefined
        }
      }
    })
  }
  let marking = config.settings.setClassification === 'NONE' ? 'U' : config.settings.setClassification
  if (marking === 'U' || marking === 'CUI') {
    marking = revision.marking || 'U' // if marking is not set, use U
  }
  return ({assetName: resultGetAsset[0].name, xmlJs, revisionStrResolved: revision.revisionStr, marking})
}

exports.createAssets = async function({ assets, collectionId, svcStatus = {} }) {
  let insertedAssetIds = []

  async function transactionFn(connection) {
    await connection.query('DROP TEMPORARY TABLE IF EXISTS temp_assets')

    // create temp table to hold incoming assets
    const createTempTableSQL = `
        CREATE TEMPORARY TABLE temp_assets (
            tempId INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            fqdn VARCHAR(255),
            ip VARCHAR(255),
            mac VARCHAR(255),
            description TEXT,
            collectionId INT,
            noncomputing TINYINT,
            metadata JSON,
            benchmarkIds JSON,
            labelNames JSON,
            assetId INT NULL
        );`

    await connection.query(createTempTableSQL)

    const assetsJson = JSON.stringify(assets)

    const insertTempAssetsSQL = `
      INSERT INTO temp_assets (name, fqdn, ip, mac, description, collectionId, noncomputing, metadata, benchmarkIds, labelNames)
      SELECT name, fqdn, ip, mac, description, collectionId, noncomputing, metadata, benchmarkIds, labelNames
      FROM JSON_TABLE(?, '$[*]'
          COLUMNS (
              name VARCHAR(255) PATH '$.name',
              fqdn VARCHAR(255) PATH '$.fqdn',
              ip VARCHAR(255) PATH '$.ip',
              mac VARCHAR(255) PATH '$.mac',
              description TEXT PATH '$.description',
              collectionId INT PATH '$.collectionId',
              noncomputing TINYINT PATH '$.noncomputing',
              metadata JSON PATH '$.metadata',
              benchmarkIds JSON PATH '$.stigs',
              labelNames JSON PATH '$.labelNames'
          )
      ) AS jt`

    await connection.query(insertTempAssetsSQL, [assetsJson]);

    // insert into asset table
    const insertAssetsSQL = `
        INSERT INTO asset (name, fqdn, ip, mac, description, collectionId, noncomputing, metadata)
        SELECT name, fqdn, ip, mac, description, collectionId, noncomputing, metadata
        FROM temp_assets;`
    await connection.query(insertAssetsSQL)

    // update temp table with create assets assetIds
    const updateTempWithAssetIdsSQL = `
        UPDATE temp_assets t
        INNER JOIN enabled_asset a
            ON a.name = t.name
            AND a.collectionId = t.collectionId
        SET t.assetId = a.assetId;`
    await connection.query(updateTempWithAssetIdsSQL)


    const insertStigsSQL = `
        INSERT INTO stig_asset_map (benchmarkId, assetId)
        SELECT jt.benchmarkId, t.assetId
        FROM temp_assets t
        INNER JOIN JSON_TABLE(t.benchmarkIds, '$[*]'
            COLUMNS (benchmarkId VARCHAR(255) PATH '$')
        ) AS jt
        WHERE t.benchmarkIds IS NOT NULL;`

    const [stigInsertResult] = await connection.query(insertStigsSQL)

    const didInsertStigs = stigInsertResult.affectedRows > 0

    // not sure abnout this left hoin ior not 
    const insertLabelsSQL = `
        INSERT INTO collection_label_asset_map (assetId, clId)
        SELECT t.assetId, cl.clId
        FROM temp_assets t
        INNER JOIN JSON_TABLE(t.labelNames, '$[*]'
            COLUMNS (labelName VARCHAR(255) PATH '$')
        ) AS labels
        LEFT JOIN collection_label cl
            ON cl.name = labels.labelName
            AND cl.collectionId = t.collectionId
        WHERE t.labelNames IS NOT NULL;`
    await connection.query(insertLabelsSQL)

    // get assetIds of newly created assets
    const [newAssets] = await connection.query('SELECT assetId FROM temp_assets')
    insertedAssetIds = newAssets.map(asset => asset.assetId)

    // if assets with stig assignment inserted, update default rev and collection revision map
    if (didInsertStigs) {
        await dbUtils.pruneCollectionRevMap(connection)
        await dbUtils.updateDefaultRev(connection, { collectionId: parseInt(collectionId) })
    }
  }
  await dbUtils.retryOnDeadlock2({ transactionFn, statusObj: svcStatus })
  return insertedAssetIds
}

exports.deleteAsset = async function(assetId, userId, svcStatus) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      const sqlDelete = `UPDATE asset SET state = "disabled", stateDate = NOW(), stateUserId = ? where assetId = ?`
      await connection.query(sqlDelete, [userId, assetId])
      // changes above might have affected need for records in collection_rev_map
      await dbUtils.pruneCollectionRevMap(connection)
      await dbUtils.updateDefaultRev(connection, {})
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return true
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

exports.deleteAssets = async function(assetIds, userId, svcStatus) {
  let connection
  try{
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      const sqlDelete = `UPDATE asset SET state = "disabled", stateDate = NOW(), stateUserId = ? where assetId IN ?`
      await connection.query(sqlDelete, [userId, [assetIds]])
      // changes above might have affected need for records in collection_rev_map 
      await dbUtils.pruneCollectionRevMap(connection)
      await dbUtils.updateDefaultRev(connection, {})
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
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

exports.attachStigToAsset = async function ({assetId, benchmarkId, grant, svcStatus = {}}) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      const sqlInsert = `INSERT IGNORE INTO stig_asset_map (assetId, benchmarkId) VALUES (?, ?)`
      const resultInsert = await connection.query(sqlInsert, [assetId, benchmarkId])
      if (resultInsert[0].affectedRows != 0) {
        // Inserted a new row, so update stats and default rev
        await dbUtils.updateDefaultRev(connection, {
          collectionId: grant.collectionId,
          benchmarkId
        })        
        await dbUtils.updateStatsAssetStig(connection, {
          assetId,
          benchmarkId
        })

      }   
      await connection.commit()  
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return true        
  }
  catch (err) {
    if (typeof connection !== 'undefined') {
      await connection.rollback()
    }
    throw (err)
  }
  finally {
    if (typeof connection !== 'undefined') {
      await connection.release()
    }
  }
}

exports.removeStigFromAsset = async function ({assetId, benchmarkId, grant, svcStatus} ) {
  let connection
  try{
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      connection.query('START TRANSACTION')
      const sqlDelete = `DELETE FROM stig_asset_map where assetId = ? and benchmarkId = ?`
      await connection.query(sqlDelete, [assetId, benchmarkId])
      // changes above might have affected need for records in collection_rev_map
      await dbUtils.pruneCollectionRevMap(connection)
      await dbUtils.updateDefaultRev(connection, {})
      await connection.commit()
      return true
    }
    return dbUtils.retryOnDeadlock(transaction, svcStatus)
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

exports.removeStigsFromAsset = async function (assetId, grant, svcStatus) {
  let connection

  try{
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')
      const sqlDelete = `DELETE FROM stig_asset_map where assetId = ?`
      await connection.query(sqlDelete, [assetId])
      
      // changes above might have affected need for records in collection_rev_map
      await dbUtils.pruneCollectionRevMap(connection)
      await dbUtils.updateDefaultRev(connection, {collectionId: grant.collectionId})
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return true
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

exports.getAsset = async function({assetId, projections, grant}) {
  const rows = await _this.queryAssets({
    projections, 
    filter: {assetId},
    grant})
  return (rows[0])
}

exports.doesAssetExist = async function (assetId) {
  const sql = `SELECT assetId FROM enabled_asset WHERE assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  return rows.length > 0
}

exports.getAssets = async function({filter, projections, grant}) {
 return _this.queryAssets({
    filter,
    projections,
    grant
  })
}

exports.getStigsByAssetSlow = async function ({assetId, grant}) {
  const ctes = []
  const columns = [
    'distinct sa.benchmarkId', 
    `concat('V', rev.version, 'R', rev.release) as revisionStr`, 
    `date_format(rev.benchmarkDateSql,'%Y-%m-%d') as revisionDate`,
    'rev.ruleCount as ruleCount'
  ]
  const joins = [
    'enabled_asset a',
    'left join enabled_collection c on a.collectionId = c.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)',
    'left join revision rev on dr.revId = rev.revId'
  ]
  if (grant.roleId === 1) {
    ctes.push(dbUtils.cteAclEffective({grantIds: grant.grantIds}))
    joins.push('inner join cteAclEffective cae on sa.saId = cae.saId')
  }

  // PREDICATES
  const predicates = {
    statements: ['a.assetId = ?'],
    binds: [assetId]
  }
  const orderBy = ['sa.benchmarkId']

  const sql = dbUtils.makeQueryString({ctes, columns, joins, predicates, orderBy, format: true})
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.getStigsByAsset = async function ({assetId, grant}) {
  const ctes = []
  const columns = [
    'distinct sa.benchmarkId', 
    `concat('V', rev.version, 'R', rev.release) as revisionStr`, 
    `date_format(rev.benchmarkDateSql,'%Y-%m-%d') as revisionDate`,
    'rev.ruleCount as ruleCount'
  ]
  const joins = [
    'enabled_asset a',
    'left join enabled_collection c on a.collectionId = c.collectionId',
    'inner join stig_asset_map sa on a.assetId = sa.assetId',
    'left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)',
    'left join revision rev on dr.revId = rev.revId'
  ]
  if (grant.roleId === 1) {
    ctes.push(dbUtils.cteAclEffective({grantIds: grant.grantIds}))
    joins.push('inner join cteAclEffective cae on sa.saId = cae.saId')
  }

  // PREDICATES
  const predicates = {
    statements: ['a.assetId = ?'],
    binds: [assetId]
  }
  const orderBy = ['sa.benchmarkId']

  const sql = dbUtils.makeQueryString({ctes, columns, joins, predicates, orderBy, format: true})
  let [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.getChecklistByAssetStig = async function(assetId, benchmarkId, revisionStr, format) {
  switch (format) {
    case 'json':
    case 'json-access': {
      return _this.queryChecklist({
        assetId,
        benchmarkId,
        revisionStr
      })
    }
    case 'ckl': 
      return _this.cklFromAssetStigs(assetId, [{benchmarkId, revisionStr}])
    case 'cklb':
      return _this.cklbFromAssetStigs(assetId, [{benchmarkId, revisionStr}])
    case 'xccdf':
      return _this.xccdfFromAssetStig(assetId, benchmarkId, revisionStr)
  }
}

exports.getChecklistByAsset = async function(assetId, benchmarks, format) {
  switch (format) {
    case 'ckl':
      return _this.cklFromAssetStigs(assetId, benchmarks)
    case 'cklb':
      return _this.cklbFromAssetStigs(assetId, benchmarks)
    }
}

exports.getAssetsByStig = async function({collectionId, benchmarkId, labels, grant}) {
  const ctes = []
  const columns = [
    'DISTINCT CAST(a.assetId as char) as assetId',
    'a.name',
    'coalesce(any_value(cae.access), "rw") as access',
    `coalesce(
      (select
        json_arrayagg(BIN_TO_UUID(cl.uuid,1))
      from
        collection_label_asset_map cla
        left join collection_label cl on cla.clId = cl.clId
      where
        cla.assetId = a.assetId),
      json_array()
    ) as assetLabelIds`,
    'CAST(a.collectionId as char) as collectionId'
  ]
  const joins = [
    'enabled_collection c',
    'inner join enabled_asset a on c.collectionId = a.collectionId',
    'left join stig_asset_map sa on a.assetId = sa.assetId',
  ]
  ctes.push(dbUtils.cteAclEffective({grantIds: grant.grantIds}))
  joins.push(`${grant.roleId === 1 ? 'inner' : 'left'} join cteAclEffective cae on sa.saId = cae.saId`)

  // PREDICATES
  const predicates = {
    statements: [
      'c.collectionId = ?',
      'sa.benchmarkId = ?'
    ],
    binds: [collectionId, benchmarkId]
  }
  if (labels?.labelNames || labels?.labelIds || labels?.labelMatch) {
    joins.push(
      'left join collection_label_asset_map cla2 on a.assetId = cla2.assetId',
      'left join collection_label cl2 on cla2.clId = cl2.clId'
    )
    const labelPredicates = []
    if (labels.labelIds) {
      labelPredicates.push('cl2.uuid IN ?')
      const uuidBinds = labels.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      predicates.binds.push([uuidBinds])
    }
    if (labels.labelNames) {
      labelPredicates.push('cl2.name IN ?')
      predicates.binds.push([labels.labelNames])
    }
    if (labels.labelMatch === 'null') {
      labelPredicates.push('cl2.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    predicates.statements.push(labelPredicatesClause)
  }
  const groupBy = ['a.assetId']
  const orderBy = [ 'a.name' ]

  const sql = dbUtils.makeQueryString({ctes, columns, joins, predicates, groupBy, orderBy, format: true})  
  const [rows] = await dbUtils.pool.query(sql)
  return (rows)
}

exports.attachAssetsToStig = async function(collectionId, benchmarkId, assetIds, svcStatus = {}) {
  let connection
  try {
    connection = await dbUtils.pool.getConnection()
    async function transaction () {
      await connection.query('START TRANSACTION')

      let sqlDeleteBenchmarks = `
      DELETE stig_asset_map FROM 
        stig_asset_map
        left join enabled_asset a on stig_asset_map.assetId = a.assetId
      WHERE
        a.collectionId = ?
        and stig_asset_map.benchmarkId = ?`
      if (assetIds.length > 0) {
        sqlDeleteBenchmarks += ' and stig_asset_map.assetId NOT IN ?'
      }  
      // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
      await connection.query( sqlDeleteBenchmarks, [ collectionId, benchmarkId, [assetIds] ] )
      
      // Push any bind values
      let binds = []
      assetIds.forEach( assetId => {
        binds.push([benchmarkId, assetId])
      })
      if (binds.length > 0) {
        // INSERT into stig_asset_map
        let sqlInsertBenchmarks = `
        INSERT IGNORE INTO 
          stig_asset_map (benchmarkId, assetId)
        VALUES
          ?`
        await connection.query(sqlInsertBenchmarks, [ binds ])
      }

      // changes above might have affected need for records in collection_rev_map 
      await dbUtils.pruneCollectionRevMap(connection)

      await dbUtils.updateDefaultRev(connection, {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      })
      await dbUtils.updateStatsAssetStig( connection, {
        collectionId: collectionId,
        benchmarkId: benchmarkId
      })

  

      // Commit the changes
      await connection.commit()
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
}

exports.updateAsset = async function( {assetId, body, currentCollectionId, transferring, svcStatus = {}} ) {
  let connection
  try {
    // Extract or initialize non-scalar properties to separate variables
    let binds
    let { stigs, labelNames, ...assetFields } = body

    // Convert boolean scalar values to database values (true=1 or false=0)
    if (assetFields.hasOwnProperty('noncomputing')) {
      assetFields.noncomputing = assetFields.noncomputing ? 1 : 0
    }
    if (assetFields.hasOwnProperty('metadata')) {
      assetFields.metadata = JSON.stringify(assetFields.metadata)
    }

    connection = await dbUtils.pool.getConnection()
    connection.config.namedPlaceholders = true
    async function transaction () {
      await connection.query('START TRANSACTION')

      // Process scalar properties
      binds = { ...assetFields}
      assetFields.collectionId ??=  currentCollectionId

      if (Object.keys(binds).length > 0) {
        // UPDATE into assets
        let sqlUpdate =
          `UPDATE
              asset
            SET
              ?
            WHERE
              assetId = ?`
        await connection.query(sqlUpdate, [assetFields, assetId])
        if (transferring) {
          await connection.query(
            `DELETE FROM collection_grant_acl WHERE assetId = ?`,
            [assetId]
          )  
          const sqlGetAssetLabels = `SELECT name, description, color FROM collection_label_asset_map inner join collection_label using (clId) WHERE assetId = ?`
          const [assetLabels] = await connection.query(sqlGetAssetLabels, [assetId])
          
          const sqlDeleteLabels = `DELETE FROM collection_label_asset_map WHERE assetId = ?`
          await connection.query(sqlDeleteLabels, [assetId])

          if (assetLabels.length) {
            const sqlGetCollectionLabels = `SELECT clId, name, description, color FROM collection_label WHERE collectionId = ?`
            const [collectionLabels] = await connection.query(sqlGetCollectionLabels, [transferring.newCollectionId])
            const collectionLabelNames = collectionLabels.reduce( (a,v) => {a[v.name] = v; return a}, {})
            
            for (const assetLabel of assetLabels) {
              if (collectionLabelNames[assetLabel.name]) {
                await connection.query(`INSERT into collection_label_asset_map (assetId, clId) VALUES (?,?)`, [assetId, collectionLabelNames[assetLabel.name].clId])
              }
              else {
                const [resultInsert] = await connection.query(`INSERT INTO collection_label (collectionId, name, description, color, uuid) VALUES (?, ?, ?, ?, UUID_TO_BIN(UUID(),1))`, 
                [transferring.newCollectionId, assetLabel.name, assetLabel.description, assetLabel.color])
                const clId = resultInsert.insertId
                await connection.query(`INSERT into collection_label_asset_map (assetId, clId) VALUES (?,?)`, [assetId, clId])
              }
            } 
          }
        }
      }
      if (stigs) {
        let sqlDeleteBenchmarks = `
          DELETE FROM 
            stig_asset_map
          WHERE 
            assetId = ?`
        if (stigs.length > 0) {
          sqlDeleteBenchmarks += ` and benchmarkId NOT IN ?`
        }
        // DELETE from stig_asset_map, which will cascade into user_stig_aset_map
        await connection.query(sqlDeleteBenchmarks, [ assetId, [stigs] ])
        if (stigs.length > 0) {
          // Map bind values
          let stigAssetMapBinds = stigs.map( benchmarkId => [benchmarkId, assetId])
          // INSERT into stig_asset_map
          let sqlInsertBenchmarks = `
            INSERT IGNORE INTO 
              stig_asset_map (benchmarkId, assetId)
            VALUES
              ?`
          await connection.query(sqlInsertBenchmarks, [stigAssetMapBinds])
        }
      }
  
      // Process labelIds, spec requires for CREATE/REPLACE not for UPDATE
      if (labelNames) {
        let sqlDeleteLabels = `
          DELETE FROM 
            collection_label_asset_map
          WHERE 
            assetId = ?`
        await connection.query(sqlDeleteLabels, [ assetId ])
        if (labelNames.length > 0) {      
          // INSERT into stig_asset_map
          let sqlInsertLabels = `
            INSERT INTO collection_label_asset_map (assetId, clId) 
              SELECT
                ?,
                clId
              FROM
                collection_label
              WHERE
                name IN (?) and collectionId = ?`
          await connection.query(sqlInsertLabels, [assetId, labelNames, assetFields.collectionId])
        }
      }

      if (stigs || transferring) {
        await dbUtils.pruneCollectionRevMap(connection)
        if (transferring) {
          await dbUtils.updateDefaultRev(connection, {collectionIds: [transferring.oldCollectionId, transferring.newCollectionId]})
        }
        else {
          await dbUtils.updateDefaultRev(connection, {collectionId: currentCollectionId})
        }
        await dbUtils.updateStatsAssetStig( connection, {assetId} ) 
      }
      // Commit the changes
      await connection.commit()
    }
    await dbUtils.retryOnDeadlock(transaction, svcStatus)
    return assetId
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

exports.getAssetMetadataKeys = async function ( assetId ) {
  const sql = `
    select
      JSON_KEYS(metadata) as keyArray
    from 
      enabled_asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  return rows.length > 0 ? rows[0].keyArray : []
}

exports.getAssetMetadata = async function ( assetId ) {
  const sql = `
    select
      metadata 
    from 
      enabled_asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [assetId])
  return rows.length > 0 ? rows[0].metadata : {}
}

exports.patchAssetMetadata = async function ( assetId, metadata ) {
  const sql = `
    update
      asset
    set 
      metadata = JSON_MERGE_PATCH(metadata, ?)
    where 
      assetId = ?`
  await dbUtils.pool.query(sql, [JSON.stringify(metadata), assetId])
  return true
}

exports.putAssetMetadata = async function ( assetId, metadata ) {
  const sql = `
    update
      asset
    set 
      metadata = ?
    where 
      assetId = ?`
  await dbUtils.pool.query(sql, [JSON.stringify(metadata), assetId])
  return true
}

exports.getAssetMetadataValue = async function ( assetId, key ) {
  const sql = `
    select
      JSON_EXTRACT(metadata, ?) as value
    from 
      enabled_asset
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, assetId])
  return rows.length > 0 ? rows[0].value : ""
}

exports.putAssetMetadataValue = async function ( assetId, key, value ) {
  const sql = `
    update
      asset
    set 
      metadata = JSON_SET(metadata, ?, ?)
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, value, assetId])
  return rows.length > 0 ? rows[0].value : ""
}

exports.deleteAssetMetadataKey = async function ( assetId, key ) {
  const sql = `
    update
      asset
    set 
      metadata = JSON_REMOVE(metadata, ?)
    where 
      assetId = ?`
  const [rows] = await dbUtils.pool.query(sql, [`$."${key}"`, assetId])
  return rows.length > 0 ? rows[0].value : ""
}