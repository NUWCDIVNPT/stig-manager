const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  'ALTER TABLE review ADD COLUMN metadata JSON NOT NULL DEFAULT (JSON_OBJECT())'
]

const downMigration = [
  'ALTER TABLE review DROP COLUMN metadata'
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
