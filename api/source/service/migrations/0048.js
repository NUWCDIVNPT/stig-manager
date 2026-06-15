const path = require('path')
const MigrationHandler = require('./lib/MigrationHandler')
const logger = require('../../utils/logger')
const dbUtils = require('../utils')

// Re-rank v_current_rev / v_latest_rev so non-draft revisions
// (accepted, deprecated, sunset, etc.) all compete on version+release
// for "latest". Only `draft` is held back. See issue #2051: DISA has
// been publishing "deprecated" revisions with newer rule content, and
// users expect those to surface as "latest" -- but `draft` revisions
// should still be considered preliminary and never promoted unless
// nothing else exists.
//
// Also redefines v_default_rev on enabled_asset instead of asset. See
// issue #1780: disabled assets retain stig_asset_map rows, and those
// rows were re-inserting default_rev pairs for benchmarks no longer
// assigned to any enabled asset in the collection. The rematerialization
// below corrects existing default_rev data for both changes.

const newCurrentRev = `ALTER VIEW v_current_rev AS
  select
  rr.revId AS revId,
  rr.benchmarkId AS benchmarkId,
  rr.\`version\` AS \`version\`,
  rr.\`release\` AS \`release\`,
  rr.benchmarkDate AS benchmarkDate,
  rr.benchmarkDateSql AS benchmarkDateSql,
  rr.status AS status,
  rr.statusDate AS statusDate,
  rr.marking AS marking,
  rr.description AS description,
  rr.active AS active,
  rr.groupCount AS groupCount,
  rr.ruleCount AS ruleCount,
  rr.lowCount AS lowCount,
  rr.mediumCount AS mediumCount,
  rr.highCount AS highCount,
  rr.checkCount AS checkCount,
  rr.fixCount AS fixCount from (select r.revId AS revId,
  r.benchmarkId AS benchmarkId,
  r.\`version\` AS \`version\`,
  r.\`release\` AS \`release\`,
  r.benchmarkDate AS benchmarkDate,
  r.benchmarkDateSql AS benchmarkDateSql,
  r.status AS status,
  r.statusDate AS statusDate,
  r.marking AS marking,
  r.description AS description,
  r.active AS active,
  r.groupCount AS groupCount,
  r.ruleCount AS ruleCount,
  r.lowCount AS lowCount,
  r.mediumCount AS mediumCount,
  r.highCount AS highCount,
  r.checkCount AS checkCount,
  r.fixCount AS fixCount,
  row_number() OVER (PARTITION BY r.benchmarkId ORDER BY
  field(r.status,'draft') asc,
  (r.\`version\` + 0) desc,
  (r.\`release\` + 0) desc )  AS rn from revision r) rr where (rr.rn = 1)`

const newLatestRev = `ALTER VIEW v_latest_rev AS
  select
    rr.revId AS revId,
    rr.benchmarkId AS benchmarkId,
    concat('V',rr.version,'R',rr.release) as revisionStr
  from
    (
      select
        r.revId,
        r.benchmarkId,
        r.version,
        r.release,
        row_number() OVER (
          PARTITION BY r.benchmarkId
          ORDER BY
            field(r.status, 'draft') asc,
            (r.version + 0) desc,
            (r.release + 0) desc
        ) AS rn
      from
        revision r
    ) rr
  where
    (rr.rn = 1)`

const newDefaultRev = `ALTER VIEW v_default_rev AS
  select distinct
    a.collectionId AS collectionId,
    sa.benchmarkId AS benchmarkId,
    case when crm.revId is not null then crm.revId else cr.revId end AS revId,
    case when crm.revId is not null then 1 else 0 end AS revisionPinned
  from
    enabled_asset a
    join stig_asset_map sa on a.assetId = sa.assetId
    left join current_rev cr on sa.benchmarkId = cr.benchmarkId
    left join collection_rev_map crm on sa.benchmarkId = crm.benchmarkId and a.collectionId = crm.collectionId`

const oldCurrentRev = `ALTER VIEW v_current_rev AS
  select
  rr.revId AS revId,
  rr.benchmarkId AS benchmarkId,
  rr.\`version\` AS \`version\`,
  rr.\`release\` AS \`release\`,
  rr.benchmarkDate AS benchmarkDate,
  rr.benchmarkDateSql AS benchmarkDateSql,
  rr.status AS status,
  rr.statusDate AS statusDate,
  rr.marking AS marking,
  rr.description AS description,
  rr.active AS active,
  rr.groupCount AS groupCount,
  rr.ruleCount AS ruleCount,
  rr.lowCount AS lowCount,
  rr.mediumCount AS mediumCount,
  rr.highCount AS highCount,
  rr.checkCount AS checkCount,
  rr.fixCount AS fixCount from (select r.revId AS revId,
  r.benchmarkId AS benchmarkId,
  r.\`version\` AS \`version\`,
  r.\`release\` AS \`release\`,
  r.benchmarkDate AS benchmarkDate,
  r.benchmarkDateSql AS benchmarkDateSql,
  r.status AS status,
  r.statusDate AS statusDate,
  r.marking AS marking,
  r.description AS description,
  r.active AS active,
  r.groupCount AS groupCount,
  r.ruleCount AS ruleCount,
  r.lowCount AS lowCount,
  r.mediumCount AS mediumCount,
  r.highCount AS highCount,
  r.checkCount AS checkCount,
  r.fixCount AS fixCount,
  row_number() OVER (PARTITION BY r.benchmarkId ORDER BY field(r.status,
  'draft',
  'accepted') desc,
  (r.\`version\` + 0) desc,
  (r.\`release\` + 0) desc )  AS rn from revision r) rr where (rr.rn = 1)`

const oldLatestRev = `ALTER VIEW v_latest_rev AS
  select
    rr.revId AS revId,
    rr.benchmarkId AS benchmarkId,
    concat('V',rr.version,'R',rr.release) as revisionStr
  from
    (
      select
        r.revId,
        r.benchmarkId,
        r.version,
        r.release,
        row_number() OVER (
          PARTITION BY r.benchmarkId
          ORDER BY
            field(r.status, 'draft', 'accepted') desc,
            (r.version + 0) desc,
            (r.release + 0) desc
        ) AS rn
      from
        revision r
    ) rr
  where
    (rr.rn = 1)`

const oldDefaultRev = `ALTER VIEW v_default_rev AS
  select distinct
    a.collectionId AS collectionId,
    sa.benchmarkId AS benchmarkId,
    case when crm.revId is not null then crm.revId else cr.revId end AS revId,
    case when crm.revId is not null then 1 else 0 end AS revisionPinned
  from
    asset a
    join stig_asset_map sa on a.assetId = sa.assetId
    left join current_rev cr on sa.benchmarkId = cr.benchmarkId
    left join collection_rev_map crm on sa.benchmarkId = crm.benchmarkId and a.collectionId = crm.collectionId`

const refreshCurrentRev = [
  `DELETE FROM current_rev`,
  `INSERT INTO current_rev (
    revId,
    benchmarkId,
    \`version\`,
    \`release\`,
    benchmarkDate,
    benchmarkDateSql,
    status,
    statusDate,
    marking,
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
      marking,
      description,
      active,
      groupCount,
      lowCount,
      mediumCount,
      highCount,
      checkCount,
      fixCount
    FROM
      v_current_rev`
]

const refreshDefaultRev = [
  `DELETE FROM default_rev`,
  `INSERT INTO default_rev(collectionId, benchmarkId, revId, revisionPinned)
    SELECT collectionId, benchmarkId, revId, revisionPinned FROM v_default_rev`
]

const upStatements = [
  newCurrentRev,
  newLatestRev,
  newDefaultRev,
  ...refreshCurrentRev,
  ...refreshDefaultRev
]

const downMigration = [
  oldCurrentRev,
  oldLatestRev,
  oldDefaultRev,
  ...refreshCurrentRev,
  ...refreshDefaultRev
]

const migrationHandler = new MigrationHandler([], downMigration)

module.exports = {
  up: async (pool) => {
    const migrationName = path.basename(__filename, '.js')
    let connection
    try {
      logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'up', name: migrationName})
      connection = await pool.getConnection()
      // Defensive: a pool-borrowed connection may have namedPlaceholders left
      // enabled from a prior service call, which breaks stored-procedure
      // bodies containing `:label` syntax if a replay ever hits one.
      connection.config.namedPlaceholders = false

      // Snapshot pre-migration default_rev so we can identify which benchmarks
      // had their resolved revId shift once the new views are in effect.
      // Temporary tables survive pool release, so drop any leftover from a
      // failed prior attempt that returned this connection to the pool.
      await connection.query('DROP TEMPORARY TABLE IF EXISTS old_default_rev')
      await connection.query(`CREATE TEMPORARY TABLE old_default_rev AS
        SELECT collectionId, benchmarkId, revId FROM default_rev`)

      for (const statement of upStatements) {
        logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement})
        await connection.query(statement)
      }

      // Benchmarks whose default_rev.revId changed for any non-pinned
      // collection. The INNER JOIN keeps only (collectionId, benchmarkId)
      // pairs present in both snapshots; pinned rows keep their revId so
      // they never satisfy `o.revId <> n.revId`. Pairs dropped by the
      // v_default_rev change (benchmarks held only by disabled assets)
      // are intentionally ignored -- they have no enabled-asset stats
      // to recompute.
      const [affectedRows] = await connection.query(`
        SELECT DISTINCT o.benchmarkId AS benchmarkId
        FROM old_default_rev o
        INNER JOIN default_rev n
          ON o.collectionId = n.collectionId AND o.benchmarkId = n.benchmarkId
        WHERE o.revId <> n.revId`)

      await connection.query('DROP TEMPORARY TABLE old_default_rev')

      for (const {benchmarkId} of affectedRows) {
        logger.writeInfo('mysql', 'migration', {status: 'recompute stats', name: migrationName, benchmarkId})
        await dbUtils.updateStatsAssetStig(connection, {benchmarkId})
      }
    }
    catch (e) {
      logger.writeError('mysql', 'migration', {status: 'error', name: migrationName, message: e.message})
      throw e
    }
    finally {
      if (connection) await connection.release()
      logger.writeInfo('mysql', 'migration', {status: 'finish', name: migrationName})
    }
  },
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}
