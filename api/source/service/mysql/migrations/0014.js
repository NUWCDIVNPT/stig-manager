const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE review ADD COLUMN resultEngine JSON DEFAULT NULL, ALGORITHM=INSTANT`,
  `ALTER TABLE review_history ADD COLUMN resultEngine JSON DEFAULT NULL, ALGORITHM=INSTANT`,
  `UPDATE review SET resultEngine = JSON_OBJECT('type','scap','product','scc') WHERE autoResult = 1`,
  `UPDATE review_history SET resultEngine = JSON_OBJECT('type','scap','product','scc') WHERE autoResult = 1`
]

const downMigration = [
  `ALTER TABLE review DROP COLUMN resultEngine`,
  `ALTER TABLE review_history DROP COLUMN resultEngine`
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
