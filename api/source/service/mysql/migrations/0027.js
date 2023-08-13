const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE result 
  ADD COLUMN cklb VARCHAR(32) NOT NULL AFTER ckl`,
  `UPDATE result set cklb = 'not_reviewed' where resultId in (1, 5, 6, 7, 8)`,
  `UPDATE result set cklb = 'not_applicable' where resultId = 2`,
  `UPDATE result set cklb = 'not_a_finding' where resultId in (3, 9)`,
  `UPDATE result set cklb = 'open' where resultId = 4`
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

