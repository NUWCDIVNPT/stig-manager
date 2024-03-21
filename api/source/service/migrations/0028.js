const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // table: review
  `ALTER TABLE review MODIFY COLUMN statusText VARCHAR(512)`,

  // table: review_history
  `ALTER TABLE review_history MODIFY COLUMN statusText VARCHAR(512)`
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

