const config = require('../utils/config')
const MetricsService = require(`../service/MetricsService`)
const Collection = require('./Collection')
const Security = require('../utils/accessLevels')
const SmError = require('../utils/error')
const {stringify: csvStringify} = require('csv-stringify/sync')

async function getCollectionMetrics (req, res, next, {style, aggregation, firstRowOnly = false}) {
  try {
    const collectionId = Collection.getCollectionIdAndCheckPermission(req, Security.ACCESS_LEVEL.Restricted)
    const returnType = req.query.format || 'json'
    const inPredicates = {
      collectionId,
      labelNames: req.query.labelName,
      labelMatch: req.query.labelMatch,
      labelIds: req.query.labelId,
      assetIds: req.query.assetId,
      benchmarkIds: req.query.benchmarkId,
    }
    const rows = await MetricsService.queryMetrics({
      inPredicates,
      userId: req.userObject.userId,
      style,
      aggregation,
      returnType 
    })
    if (returnType === 'csv') {
      res.type('text/csv')
      res.send(csvStringify(rows, {header: true}))
    }
    else {
      res.json(firstRowOnly ? rows[0] : rows)
    }
  }
  catch (e) {
    next(e)
  }
}

async function getMetaMetrics (req, res, next, {style, aggregation, firstRowOnly = false}) {
  try {
    const returnType = req.query.format || 'json'
    const inPredicates = {
      collectionIds: req.query.collectionId,
      benchmarkIds: req.query.benchmarkId,
      revisionIds: req.query.revisionId
    }
    const rows = await MetricsService.queryMetaMetrics({
      inPredicates,
      userId: req.userObject.userId,
      style,
      aggregation,
      returnType 
    })
    if (returnType === 'csv') {
      res.type('text/csv')
      res.send(csvStringify(rows, {header: true}))
    }
    else {
      res.json(firstRowOnly ? rows[0] : rows)
    }
  }
  catch (e) {
    next(e)
  }
}


module.exports.getMetricsDetailByCollection = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'unagg'})
}
module.exports.getMetricsDetailByCollectionAggAsset = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'asset'})
}
module.exports.getMetricsDetailByCollectionAgg = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'collection', firstRowOnly: true})
}
module.exports.getMetricsDetailByCollectionAggLabel = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'label'})
}
module.exports.getMetricsDetailByCollectionAggStig = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'detail', aggregation: 'stig'})
}
module.exports.getMetricsSummaryByCollection = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'unagg'})
}
module.exports.getMetricsSummaryByCollectionAggAsset = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'asset'})
}
module.exports.getMetricsSummaryByCollectionAgg = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'collection', firstRowOnly: true})
}
module.exports.getMetricsSummaryByCollectionAggLabel = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'label'})
}
module.exports.getMetricsSummaryByCollectionAggStig = async function (req, res, next) {
  await getCollectionMetrics(req, res, next, {style: 'summary', aggregation: 'stig'})
}
module.exports.getMetricsDetailByMeta = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'detail', aggregation: 'meta', firstRowOnly: true})
}
module.exports.getMetricsDetailByMetaAggCollection = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'detail', aggregation: 'collection'})
}
module.exports.getMetricsDetailByMetaAggStig = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'detail', aggregation: 'metaStig'})
}
module.exports.getMetricsSummaryByMeta = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'summary', aggregation: 'meta', firstRowOnly: true})
}
module.exports.getMetricsSummaryByMetaAggCollection = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'summary', aggregation: 'collection'})
}
module.exports.getMetricsSummaryByMetaAggStig = async function (req, res, next) {
  await getMetaMetrics(req, res, next, {style: 'summary', aggregation: 'metaStig'})
}