const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `UPDATE collection
   SET settings = JSON_SET(settings, '$.history.maxReviews', 15)
   WHERE JSON_EXTRACT(settings, '$.history.maxReviews') = -1
      OR JSON_EXTRACT(settings, '$.history.maxReviews') > 15
  `
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

