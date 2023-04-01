const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
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
      v_current_rev`
]

const downMigration = [
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
