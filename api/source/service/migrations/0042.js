const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE revision ADD COLUMN marking VARCHAR(10) DEFAULT NULL AFTER statusDate`,
  `ALTER TABLE current_rev ADD COLUMN marking VARCHAR(10) DEFAULT NULL AFTER statusDate`,
  `ALTER VIEW v_current_rev AS
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
]

const downMigration = [
  `ALTER TABLE revision DROP COLUMN marking`,
  `ALTER TABLE current_rev DROP COLUMN marking`
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
