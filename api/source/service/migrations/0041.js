const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `CREATE VIEW enabled_asset AS SELECT * FROM asset WHERE state = 'enabled'`,
  `CREATE VIEW enabled_collection AS SELECT * FROM collection WHERE state = 'enabled'`,
  `CREATE INDEX idx_collectionId_state ON asset (collectionId, state)`
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

