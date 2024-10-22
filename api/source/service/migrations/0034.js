const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE asset ADD INDEX idx_state (state ASC)`,
  `ALTER TABLE collection ADD INDEX idx_state (state ASC)`
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

