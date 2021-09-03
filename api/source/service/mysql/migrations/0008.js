const MigrationHandler = require('../migrationHandler')

const upMigration = [
  'ALTER TABLE asset MODIFY COLUMN name VARCHAR(255) NOT NULL',
  'ALTER TABLE asset MODIFY COLUMN ip VARCHAR(255) NULL DEFAULT NULL',
  'ALTER TABLE asset MODIFY COLUMN mac VARCHAR(255) NULL DEFAULT NULL'
]

const downMigration = [
  'ALTER TABLE asset MODIFY COLUMN name VARCHAR(45) NOT NULL',
  'ALTER TABLE asset MODIFY COLUMN ip VARCHAR(45) NULL DEFAULT NULL',
  'ALTER TABLE asset MODIFY COLUMN mac VARCHAR(17) NULL DEFAULT NULL'
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
