const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: collection
  `ALTER TABLE collection ADD COLUMN enabled TINYINT NOT NULL DEFAULT 1`,

  // table: asset
  `ALTER TABLE asset ADD COLUMN enabled TINYINT NOT NULL DEFAULT 1`,

  // table: user_data
  `ALTER TABLE user_data ADD COLUMN enabled TINYINT NOT NULL DEFAULT 1`,

  // table: review
  `ALTER TABLE review ADD COLUMN enabled TINYINT NOT NULL DEFAULT 1`,

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
