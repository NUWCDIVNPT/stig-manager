const dbUtils = require('./utils')

module.exports.queryMetrics = async function ({
  inPredicates = {},
  userId,
  aggregation = 'unagg',
  style = 'detail',
  returnType = 'json'
}) {

  const predicates = {
    statements: [],
    binds: []
  }

  // CTE processing
  // This CTE retreives the granted Asset/STIG pairs for a single collection
  const cteProps = {
    columns: [
      'distinct c.collectionId',
      'sa.benchmarkId',
      'a.assetId',
      'sa.saId'
    ],
    joins: [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'inner join asset a on c.collectionId = a.collectionId and a.state = "enabled"',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ],
    predicates: {
      statements: [
        'c.collectionId = ?',
        '(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)'
      ],
      binds: [
        inPredicates.collectionId,
        inPredicates.collectionId,
        userId
      ]
    }
  }
  if (inPredicates.labelNames || inPredicates.labelIds || inPredicates.labelMatch) {
    cteProps.joins.push(
      'left join collection_label_asset_map cla on a.assetId = cla.assetId',
      'left join collection_label cl on cla.clId = cl.clId'
    )
    const labelPredicates = []
    if (inPredicates.labelNames) {
      labelPredicates.push('cl.name IN ?')
      if (aggregation === 'label')
        predicates.binds.push([inPredicates.labelNames])
      cteProps.predicates.binds.push([inPredicates.labelNames])
    }
    if (inPredicates.labelIds) {
      const uuidBinds = inPredicates.labelIds.map( uuid => dbUtils.uuidToSqlString(uuid))
      if (aggregation === 'label')
        predicates.binds.push([uuidBinds])
      cteProps.predicates.binds.push([uuidBinds])
      labelPredicates.push('cl.uuid IN ?')
    }
    if (inPredicates.labelMatch === 'null') {
      labelPredicates.push('cl.uuid IS NULL')
    }
    const labelPredicatesClause = `(${labelPredicates.join(' OR ')})`
    if (aggregation === 'label')
      predicates.statements.push(labelPredicatesClause)
    cteProps.predicates.statements.push(labelPredicatesClause)
  }
  if (inPredicates.assetIds) {
    cteProps.predicates.statements.push(
      'a.assetId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.assetIds])
  }
  if (inPredicates.benchmarkIds) {
    cteProps.predicates.statements.push(
      'sa.benchmarkId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.benchmarkIds])
  }

  const cteQuery = dbUtils.makeQueryString({
    columns: cteProps.columns,
    joins: cteProps.joins,
    predicates: cteProps.predicates
  })
  const ctes = [
    `granted as (select ? as collectionId, null as benchmarkId, null as assetId, null as saId
      union all ${cteQuery} )`
  ]

  // Main query
  const columns = returnType === 'csv' ? [...baseColsFlat[aggregation]] : [...baseCols[aggregation]]
  const joins = [
    'granted',
    'left join asset a on granted.assetId = a.assetId',
    'left join stig_asset_map sa on granted.saId = sa.saId',
    'left join default_rev dr on granted.collectionId = dr.collectionId and sa.benchmarkId = dr.benchmarkId',
    'left join revision rev on dr.revId = rev.revId',
    'left join stig on rev.benchmarkId = stig.benchmarkId'
  ]
  const groupBy = []
  const orderBy = []

  switch (aggregation) {
    case 'asset':
      predicates.statements.push('a.assetId IS NOT NULL')
      groupBy.push('a.assetId')
      orderBy.push('a.name')
      break
    case 'stig':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      groupBy.push('rev.revId', 'dr.revisionPinned')
      orderBy.push('rev.benchmarkId')
      break
    case 'collection':
      joins.push('left join collection c on granted.collectionId = c.collectionId')
      groupBy.push('c.collectionId')
      orderBy.push('c.name')
      break
    case 'label':
      predicates.statements.push('a.assetId IS NOT NULL')
      groupBy.push('cl.description', 'cl.color')
      joins.push(
        'left join collection_label_asset_map cla on a.assetId = cla.assetId',
        'left join collection_label cl on cla.clId = cl.clId'
      )
      groupBy.push('cl.uuid', 'cl.name')
      orderBy.push('cl.name')
      break
    case 'unagg':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      break
  }

  if (style === 'detail') {
    if (returnType === 'csv' && aggregation === 'unagg') {
      columns.push(...colsMetricsDetail)
    }
    else if (returnType === 'csv') {
      columns.push(...colsMetricsDetailAgg)
    }
    else {
      columns.push( aggregation === 'unagg' ? sqlMetricsDetail : sqlMetricsDetailAgg)
    }
  }
  else {
    if (returnType === 'csv' && aggregation === 'unagg') {
      columns.push(...colsMetricsSummary)
    }
    else if (returnType === 'csv') {
      columns.push(...colsMetricsSummaryAgg)
    }
    else {
      columns.push( aggregation === 'unagg' ? sqlMetricsSummary : sqlMetricsSummaryAgg)
    }
  }
  const query = dbUtils.makeQueryString({
    ctes,
    columns,
    joins,
    predicates,
    groupBy,
    orderBy
  })
  
  let [ rows ] = await dbUtils.pool.query(
    query, 
    [...cteProps.predicates.binds, ...predicates.binds]
  )
  return (rows || [])
}

module.exports.queryMetaMetrics = async function ({
  inPredicates = {},
  userId,
  aggregation = 'meta',
  style = 'detail',
  returnType = 'json'
}) {
  const predicates = {
    statements: [],
    binds: []
  }
  // CTE processing
  // This CTE retreives the granted Asset/STIG pairs across all collections (or the requested ones)
  const cteProps = {
    columns: [
      'distinct c.collectionId',
      'sa.benchmarkId',
      'a.assetId',
      'sa.saId'
    ],
    joins: [
      'collection c',
      'left join collection_grant cg on c.collectionId = cg.collectionId',
      'inner join asset a on c.collectionId = a.collectionId and a.state = "enabled"',
      'left join stig_asset_map sa on a.assetId = sa.assetId',
      'left join user_stig_asset_map usa on sa.saId = usa.saId'
    ],
    predicates: {
      statements: [
        '(cg.userId = ? AND CASE WHEN cg.accessLevel = 1 THEN usa.userId = cg.userId ELSE TRUE END)',
        'c.state = "enabled"'
      ],
      binds: [
        userId
      ]
    }
  }
  if (inPredicates.benchmarkIds) {
    cteProps.predicates.statements.push(
      'sa.benchmarkId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.benchmarkIds])
  }
  if (inPredicates.collectionIds) {
    cteProps.predicates.statements.push(
      'c.collectionId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.collectionIds])
  }
  if (inPredicates.revisionIds) {
    cteProps.joins.push(
      'left join default_rev dr on c.collectionId = dr.collectionId and sa.benchmarkId = dr.benchmarkId',
      'left join revision rev on dr.revId = rev.revId'
    )
    cteProps.predicates.statements.push(
      'rev.revId IN ?'
    )
    cteProps.predicates.binds.push([inPredicates.revisionIds])
  }
  const cteQuery = dbUtils.makeQueryString({
    columns: cteProps.columns,
    joins: cteProps.joins,
    predicates: cteProps.predicates
  })
  const ctes = [
    `granted as (${cteQuery})`
  ]
  // Main query
  const columns = returnType === 'csv' ? [...baseColsFlat[aggregation]] : [...baseCols[aggregation]]
  const joins = [
    'granted',
    'left join asset a on granted.assetId = a.assetId',
    'left join stig_asset_map sa on granted.saId = sa.saId',
    'left join default_rev dr on granted.collectionId = dr.collectionId and sa.benchmarkId = dr.benchmarkId',
    'left join revision rev on dr.revId = rev.revId',
    'left join stig on rev.benchmarkId = stig.benchmarkId'
  ]
  const groupBy = []
  const orderBy = []
  switch (aggregation) {
    case 'meta':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      break
    case 'collection':
      joins.push('left join collection c on granted.collectionId = c.collectionId')
      groupBy.push('c.collectionId')
      orderBy.push('c.name')
      break
    case 'metaStig':
      predicates.statements.push('sa.benchmarkId IS NOT NULL')
      groupBy.push('rev.revId')
      orderBy.push('rev.benchmarkId')
      break
  }
  if (style === 'detail') {
    if (returnType === 'csv') {
      columns.push(...colsMetricsDetailAgg)
    }
    else {
      columns.push(sqlMetricsDetailAgg)
    }
  }
  else { //style: 'summary'
    if (returnType === 'csv') {
      columns.push(...colsMetricsSummaryAgg)
    }
    else {
      columns.push(sqlMetricsSummaryAgg)
    }
  }
  const query = dbUtils.makeQueryString({
    ctes,
    columns,
    joins,
    predicates,
    groupBy,
    orderBy
  })

  let [rows, fields] = await dbUtils.pool.query(
    query, 
    [...cteProps.predicates.binds, ...predicates.binds]
  )
  return (rows || [])
}

const sqlMetricsDetail = `json_object(
  'assessments', rev.ruleCount,
  'assessmentsBySeverity', json_object(
    'low', rev.lowCount,
    'medium', rev.mediumCount,
    'high', rev.highCount
  ),
  'assessed', sa.pass + sa.fail + sa.notapplicable,
  'minTs', DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTouchTs', DATE_FORMAT(sa.maxTouchTs, '%Y-%m-%dT%H:%i:%sZ'),
  'findings', json_object(
    'low', sa.lowCount,
    'medium', sa.mediumCount,
    'high', sa.highCount
  ),
  'statuses', json_object(
    'saved', json_object('total',sa.saved,'resultEngine',sa.savedResultEngine),
    'submitted', json_object('total',sa.submitted,'resultEngine',sa.submittedResultEngine),
    'rejected', json_object('total',sa.rejected,'resultEngine',sa.rejectedResultEngine),
    'accepted', json_object('total',sa.accepted,'resultEngine',sa.acceptedResultEngine)
  ),
  'results', json_object(
    'notchecked', json_object('total',sa.notchecked,'resultEngine',sa.notcheckedResultEngine),
    'notapplicable', json_object('total',sa.notapplicable,'resultEngine',sa.notapplicableResultEngine),
    'pass', json_object('total',sa.pass,'resultEngine',sa.passResultEngine),
    'fail', json_object('total',sa.fail,'resultEngine',sa.failResultEngine),
    'unknown', json_object('total',sa.unknown,'resultEngine',sa.unknownResultEngine),
    'error', json_object('total',sa.error,'resultEngine',sa.errorResultEngine),
    'notselected', json_object('total',sa.notselected,'resultEngine',sa.notselectedResultEngine),
    'informational', json_object('total',sa.informational,'resultEngine',sa.informationalResultEngine),
    'fixed', json_object('total',sa.fixed,'resultEngine',sa.fixedResultEngine)
  )
) as metrics`
const sqlMetricsDetailAgg = `json_object(
  'assessments', coalesce(sum(rev.ruleCount),0),
  'assessmentsBySeverity', json_object(
    'low', coalesce(sum(rev.lowCount),0),
    'medium', coalesce(sum(rev.mediumCount),0),
    'high', coalesce(sum(rev.highCount),0)
  ),  
  'assessed', coalesce(sum(sa.pass + sa.fail + sa.notapplicable),0),
  'minTs', DATE_FORMAT(MIN(sa.minTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(MAX(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTouchTs', DATE_FORMAT(MAX(sa.maxTouchTs), '%Y-%m-%dT%H:%i:%sZ'),
  'findings', json_object(
    'low', coalesce(sum(sa.lowCount),0),
    'medium', coalesce(sum(sa.mediumCount),0),
    'high', coalesce(sum(sa.highCount),0)
  ),
  'statuses', json_object(
    'saved', json_object('total',coalesce(sum(sa.saved),0),'resultEngine',coalesce(sum(sa.savedResultEngine),0)),
    'submitted', json_object('total',coalesce(sum(sa.submitted),0),'resultEngine',coalesce(sum(sa.submittedResultEngine),0)),
    'rejected', json_object('total',coalesce(sum(sa.rejected),0),'resultEngine',coalesce(sum(sa.rejectedResultEngine),0)),
    'accepted', json_object('total',coalesce(sum(sa.accepted),0),'resultEngine',coalesce(sum(sa.acceptedResultEngine),0))
  ),
  'results', json_object(
    'notchecked', json_object('total',coalesce(sum(sa.notchecked),0),'resultEngine',coalesce(sum(sa.notcheckedResultEngine),0)),
    'notapplicable', json_object('total',coalesce(sum(sa.notapplicable),0),'resultEngine',coalesce(sum(sa.notapplicableResultEngine),0)),
    'pass', json_object('total',coalesce(sum(sa.pass),0),'resultEngine',coalesce(sum(sa.passResultEngine),0)),
    'fail', json_object('total',coalesce(sum(sa.fail),0),'resultEngine',coalesce(sum(sa.failResultEngine),0)),
    'unknown', json_object('total',coalesce(sum(sa.unknown),0),'resultEngine',coalesce(sum(sa.unknownResultEngine),0)),
    'error', json_object('total',coalesce(sum(sa.error),0),'resultEngine',coalesce(sum(sa.errorResultEngine),0)),
    'notselected', json_object('total',coalesce(sum(sa.notselected),0),'resultEngine',coalesce(sum(sa.notselectedResultEngine),0)),
    'informational', json_object('total',coalesce(sum(sa.informational),0),'resultEngine',coalesce(sum(sa.informationalResultEngine),0)),
    'fixed', json_object('total',coalesce(sum(sa.fixed),0),'resultEngine',coalesce(sum(sa.fixedResultEngine),0))
  )
) as metrics`
const sqlMetricsSummary = `json_object(
  'assessments', rev.ruleCount,
  'assessed', sa.pass + sa.fail + sa.notapplicable,
  'minTs', DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ'),
  'maxTouchTs', DATE_FORMAT(sa.maxTouchTs, '%Y-%m-%dT%H:%i:%sZ'),
  'results', json_object(
    'pass', sa.pass,
    'fail', sa.fail,
    'notapplicable', sa.notapplicable,
    'unassessed', sa.notchecked + sa.unknown + sa.error + sa.notselected + sa.informational + sa.fixed
  ),
  'statuses', json_object(
    'saved', sa.saved,
    'submitted', sa.submitted,
    'accepted', sa.accepted,
    'rejected', sa.rejected
  ),
  'findings', json_object(
    'low', sa.lowCount,
    'medium', sa.mediumCount,
    'high', sa.highCount
  )
) as metrics`
const sqlMetricsSummaryAgg = `json_object(
  'assessments', coalesce(sum(rev.ruleCount),0),
  'assessed', coalesce(sum(sa.pass + sa.fail + sa.notapplicable),0),
  'minTs', DATE_FORMAT(MIN(sa.minTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTs', DATE_FORMAT(MAX(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ'),
  'maxTouchTs', DATE_FORMAT(MAX(sa.maxTouchTs), '%Y-%m-%dT%H:%i:%sZ'),
  'results', json_object(
    'pass', coalesce(sum(sa.pass),0),
    'fail', coalesce(sum(sa.fail),0),
    'notapplicable', coalesce(sum(sa.notapplicable),0),
    'unassessed', coalesce(sum(sa.notchecked + sa.unknown + sa.error + sa.notselected + sa.informational + sa.fixed),0)
  ),
  'statuses', json_object(
    'saved', coalesce(sum(sa.saved),0),
    'submitted', coalesce(sum(sa.submitted),0),
    'accepted', coalesce(sum(sa.accepted),0),
    'rejected', coalesce(sum(sa.rejected),0)
  ),
  'findings', json_object(
    'low', coalesce(sum(sa.lowCount),0),
    'medium', coalesce(sum(sa.mediumCount),0),
    'high', coalesce(sum(sa.highCount),0)
  )
) as metrics`
const colsMetricsDetail = [
  `rev.ruleCount as assessments`,
  `rev.lowCount as assessmentsLow`,
  `rev.mediumCount as assessmentsMedium`,
  `rev.highCount as assessmentsHigh`,
  `sa.pass + sa.fail + sa.notapplicable as assessed`,
  `DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ') as minTs`,
  `DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ') as maxTs`,
  `DATE_FORMAT(sa.maxTouchTs, '%Y-%m-%dT%H:%i:%sZ') as maxTouchTs`,
  `sa.lowCount as low`,
  `sa.mediumCount as medium`,
  `sa.highCount as high`,
  `sa.saved`,
  `sa.savedResultEngine`,
  `sa.submitted`,
  `sa.submittedResultEngine`,
  `sa.accepted`,
  `sa.acceptedResultEngine`,
  `sa.rejected`,
  `sa.rejectedResultEngine`,
  `sa.pass`,
  `sa.passResultEngine`,
  `sa.fail`,
  `sa.failResultEngine`,
  `sa.notapplicable`,
  `sa.notapplicableResultEngine`,
  `sa.notchecked`,
  `sa.notcheckedResultEngine`,
  `sa.unknown`,
  `sa.unknownResultEngine`,
  `sa.error`,
  `sa.errorResultEngine`,
  `sa.notselected`,
  `sa.notselectedResultEngine`,
  `sa.informational`,
  `sa.informationalResultEngine`,
  `sa.fixed`,
  `sa.fixedResultEngine`,
]
const colsMetricsDetailAgg = [
  `coalesce(sum(rev.ruleCount),0) as assessments`,
  `coalesce(sum(rev.lowCount),0) as assessmentsLow`,
  `coalesce(sum(rev.mediumCount),0) as assessmentsMedium`,
  `coalesce(sum(rev.highCount),0) as assessmentsHigh`,
  `coalesce(sum(sa.pass + sa.fail + sa.notapplicable),0) as assessed`,
  `DATE_FORMAT(min(sa.minTs), '%Y-%m-%dT%H:%i:%sZ') as minTs`,
  `DATE_FORMAT(max(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ') as maxTs`,
  `DATE_FORMAT(max(sa.maxTouchTs), '%Y-%m-%dT%H:%i:%sZ') as maxTouchTs`,
  `coalesce(sum(sa.lowCount),0) as low`,
  `coalesce(sum(sa.mediumCount),0) as medium`,
  `coalesce(sum(sa.highCount),0) as high`,
  `coalesce(sum(sa.saved),0) as saved`,
  `coalesce(sum(sa.savedResultEngine),0) as savedResultEngine`,
  `coalesce(sum(sa.submitted),0) as submitted`,
  `coalesce(sum(sa.submittedResultEngine),0) as submittedResultEngine`,
  `coalesce(sum(sa.accepted),0) as accepted`,
  `coalesce(sum(sa.acceptedResultEngine),0) as acceptedResultEngine`,
  `coalesce(sum(sa.rejected),0) as rejected`,
  `coalesce(sum(sa.rejectedResultEngine),0) as rejectedResultEngine`,
  `coalesce(sum(sa.pass),0) as pass`,
  `coalesce(sum(sa.passResultEngine),0) as passResultEngine`,
  `coalesce(sum(sa.fail),0) as fail`,
  `coalesce(sum(sa.failResultEngine),0) as failResultEngine`,
  `coalesce(sum(sa.notapplicable),0) as notapplicable`,
  `coalesce(sum(sa.notapplicableResultEngine),0) as notapplicableResultEngine`,
  `coalesce(sum(sa.notchecked),0) as notchecked`,
  `coalesce(sum(sa.notcheckedResultEngine),0) as notcheckedResultEngine`,
  `coalesce(sum(sa.unknown),0) as unknown`,
  `coalesce(sum(sa.unknownResultEngine),0) as unknownResultEngine`,
  `coalesce(sum(sa.error),0) as error`,
  `coalesce(sum(sa.errorResultEngine),0) as errorResultEngine`,
  `coalesce(sum(sa.notselected),0) as notselected`,
  `coalesce(sum(sa.notselectedResultEngine),0) as notselectedResultEngine`,
  `coalesce(sum(sa.informational),0) as informational`,
  `coalesce(sum(sa.informationalResultEngine),0) as informationalResultEngine`,
  `coalesce(sum(sa.fixed),0) as fixed`,
  `coalesce(sum(sa.fixedResultEngine),0) as fixedResultEngine`
]
const colsMetricsSummary = [
  'rev.ruleCount as "assessments"', 
  'sa.pass + sa.fail + sa.notapplicable as "assessed"', 
  `DATE_FORMAT(sa.minTs, '%Y-%m-%dT%H:%i:%sZ') as minTs`,
  `DATE_FORMAT(sa.maxTs, '%Y-%m-%dT%H:%i:%sZ') as maxTs`, 
  `DATE_FORMAT(sa.maxTouchTs, '%Y-%m-%dT%H:%i:%sZ') as maxTouchTs`, 
  'sa.lowCount as "low"', 
  'sa.mediumCount as "medium"', 
  'sa.highCount as "high"', 
  'sa.pass as "pass"', 
  'sa.fail as "fail"', 
  'sa.notapplicable as "notapplicable"', 
  'sa.notchecked + sa.unknown + sa.error + sa.notselected + sa.informational + sa.fixed as "unassessed"', 
  'sa.saved as "saved"', 
  'sa.submitted as "submitted"', 
  'sa.accepted as "accepted"', 
  'sa.rejected as "rejected"'
]
const colsMetricsSummaryAgg = [
  'coalesce(sum(rev.ruleCount),0) as "assessments"', 
  'coalesce(sum(sa.pass + sa.fail + sa.notapplicable),0) as "assessed"', 
  `DATE_FORMAT(MIN(sa.minTs), '%Y-%m-%dT%H:%i:%sZ') as minTs`, 
  `DATE_FORMAT(MAX(sa.maxTs), '%Y-%m-%dT%H:%i:%sZ') as maxTs`, 
  `DATE_FORMAT(MAX(sa.maxTouchTs), '%Y-%m-%dT%H:%i:%sZ') as maxTouchTs`, 
  'coalesce(sum(sa.lowCount),0) as "low"', 
  'coalesce(sum(sa.mediumCount),0) as "medium"', 
  'coalesce(sum(sa.highCount),0) as "high"', 
  'coalesce(sum(sa.pass),0) as "pass"', 
  'coalesce(sum(sa.fail),0) as "fail"', 
  'coalesce(sum(sa.notapplicable),0) as "notapplicable"', 
  'coalesce(sum(sa.notchecked + sa.unknown + sa.error + sa.notselected + sa.informational + sa.fixed),0) as "unassessed"', 
  'coalesce(sum(sa.saved),0) as "saved"', 
  'coalesce(sum(sa.submitted),0) as "submitted"', 
  'coalesce(sum(sa.accepted),0) as "accepted"', 
  'coalesce(sum(sa.rejected),0) as "rejected"'
]
const sqlLabels = `coalesce(
  (select
    json_arrayagg(json_object(
      'labelId', BIN_TO_UUID(cl2.uuid,1),
      'name', cl2.name
      ))
  from
    collection_label_asset_map cla2
    left join collection_label cl2 on cla2.clId = cl2.clId
  where
    cla2.assetId = a.assetId),
  json_array()) as labels`
const sqlLabelsFlat = `(
  select  
    group_concat(cl2.name)
  from
    collection_label_asset_map cla2
    left join collection_label cl2 on cla2.clId = cl2.clId
  where
    cla2.assetId = a.assetId) as "labels"`
const baseCols = {
  unagg: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabels,
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END as revisionPinned',
  ],
  asset: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabels,
    'a.ip',
    'a.fqdn',
    'a.mac',
    'case when count(sa.benchmarkId) > 0 THEN json_arrayagg(sa.benchmarkId) ELSE json_array() END as benchmarkIds'
  ],
  collection: [
    'cast(c.collectionId as char) as collectionId',
    'c.name',
    'count(distinct a.assetId) as assets',
    'count(distinct sa.benchmarkId) as stigs',
    'count(sa.saId) as checklists'
  ],
  stig: [
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END as revisionPinned',
    'count(distinct a.assetId) as assets',
    'rev.ruleCount'
  ],
  label: [
    'BIN_TO_UUID(cl.uuid,1) as labelId',
    'cl.name',
    'cl.color',
    'cl.description',
    'count(distinct a.assetId) as assets'
  ],
  meta: [
    'count(distinct granted.collectionId) as collections',
    'count(distinct a.assetId) as assets',
    'count(distinct sa.benchmarkId) as stigs',
    'count(sa.saId) as checklists'
  ],
  metaStig: [
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'count(distinct granted.collectionId) as collections',
    'count(distinct a.assetId) as assets',
    'rev.ruleCount'
  ]
}
const baseColsFlat = {
  unagg: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabelsFlat,
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END as revisionPinned',
  ],
  asset: [
    'cast(a.assetId as char) as assetId',
    'a.name',
    sqlLabelsFlat,
    'group_concat(sa.benchmarkId) as benchmarkIds'
  ],
  collection: [
    'cast(c.collectionId as char) as collectionId',
    'c.name',
    'count(distinct a.assetId) as assets',
    'count(sa.saId) as checklists'
  ],
  stig: [
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'CASE WHEN dr.revisionPinned = 1 THEN CAST(true as json) ELSE CAST(false as json) END as revisionPinned',
    'count(distinct a.assetId) as assets',
    'rev.ruleCount'
  ],
  label: [
    'BIN_TO_UUID(cl.uuid,1) as labelId',
    'cl.name',
    'count(distinct a.assetId) as assets'
  ],
  meta: [
    'count(distinct granted.collectionId) as collections',
    'count(distinct a.assetId) as assets',
    'count(distinct sa.benchmarkId) as stigs',
    'count(sa.saId) as checklists'
  ],
  metaStig: [
    'rev.benchmarkId',
    'stig.title',
    'rev.revisionStr',
    'count(distinct granted.collectionId) as collections',
    'count(distinct a.assetId) as assets',
    'rev.ruleCount'
  ]
}