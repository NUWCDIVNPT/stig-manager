const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // table: review
  `DROP VIEW IF EXISTS v_current_group_rule`,

  // table: review_history
  `DROP TABLE IF EXISTS current_group_rule`
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

