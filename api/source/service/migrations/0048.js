const MigrationHandler = require('./lib/MigrationHandler')

// Drop the `status` priority from v_current_rev / v_latest_rev so the
// highest version+release wins regardless of DISA-assigned status
// (accepted, deprecated, draft). See issue #2051: DISA has been
// publishing "deprecated" revisions with newer rule content, and users
// expect those to surface as "latest".

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
            (r.version + 0) desc,
            (r.release + 0) desc
        ) AS rn
      from
        revision r
    ) rr
  where
    (rr.rn = 1)`

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

const upMigration = [
  newCurrentRev,
  newLatestRev,
  ...refreshCurrentRev,
  ...refreshDefaultRev
]

const downMigration = [
  oldCurrentRev,
  oldLatestRev,
  ...refreshCurrentRev,
  ...refreshDefaultRev
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}
