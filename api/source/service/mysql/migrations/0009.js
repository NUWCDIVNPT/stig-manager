const MigrationHandler = require('../migrationHandler')

const upMigration = [
  'ALTER TABLE review ADD COLUMN metadata JSON NOT NULL DEFAULT (JSON_OBJECT())'
]

const downMigration = [
  'ALTER TABLE review DROP COLUMN metadata'
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    migrationHandler.down(pool, __filename)
  }
}
