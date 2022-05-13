const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `UPDATE review SET resultEngine = NULL`,
  `UPDATE review_history SET resultEngine = NULL`,

  `ALTER TABLE review ADD COLUMN reProduct VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.product")`,
  `ALTER TABLE review ADD INDEX idx_reProduct (reProduct)`,

  `ALTER TABLE review ADD COLUMN reType VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.type")`,
  `ALTER TABLE review ADD INDEX idx_reType (reType)`,

  `ALTER TABLE review ADD COLUMN reAuthority VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.overrides[0].authority")`,
  `ALTER TABLE review ADD INDEX idx_reAuthority (reAuthority)`,

  `ALTER TABLE review_history ADD COLUMN reProduct VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.product")`,
  `ALTER TABLE review_history ADD INDEX idx_reProduct (reProduct)`,

  `ALTER TABLE review_history ADD COLUMN reType VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.type")`,
  `ALTER TABLE review_history ADD INDEX idx_reType (reType)`,
  
  `ALTER TABLE review_history ADD COLUMN reAuthority VARCHAR(255) GENERATED ALWAYS AS (resultEngine->>"$.overrides[0].authority")`,
  `ALTER TABLE review_history ADD INDEX idx_reAuthority (reAuthority)`,

  `UPDATE review SET resultEngine = JSON_OBJECT('type','scap','product','scc', 'version', 'na') WHERE autoResult = 1`,
  `UPDATE review_history SET resultEngine = JSON_OBJECT('type','scap','product','scc', 'version', 'na') WHERE autoResult = 1`
]

const downMigration = [
  'ALTER TABLE review DROP COLUMN reProduct',
  'ALTER TABLE review DROP COLUMN reType',
  'ALTER TABLE review DROP COLUMN reAuthority',
  'ALTER TABLE review_history DROP COLUMN reProduct',
  'ALTER TABLE review_history DROP COLUMN reType',
  'ALTER TABLE review_history DROP COLUMN reAuthority'
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
