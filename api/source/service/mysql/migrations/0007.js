const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  'SET FOREIGN_KEY_CHECKS=0',
  'ALTER TABLE stig MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE stig_asset_map MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE current_group_rule MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE current_rev MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE revision MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE rule_oval_map MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'ALTER TABLE stats_asset_stig MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs',
  'SET FOREIGN_KEY_CHECKS=1'
]

const downMigration = [
  'SET FOREIGN_KEY_CHECKS=0',
  'ALTER TABLE stig MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE stig_asset_map MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE current_group_rule MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE current_rev MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE revision MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE rule_oval_map MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'ALTER TABLE stats_asset_stig MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_ci',
  'SET FOREIGN_KEY_CHECKS=1'
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
