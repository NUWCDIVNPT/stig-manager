const path = require('path')

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

module.exports = {
  up: async (pool) => {
    let connection
    try {
      let migrationName = path.basename(__filename, '.js')
      console.log(`[DB] Running migration ${migrationName} UP`)
      connection = await pool.getConnection()
      for (const statement of upMigration) {
        console.log(`[DB] Execute: ${statement}`)
        connection.query(statement)
      }
    }
    catch (e) {
      console.log(`[DB] Migration failed: ${e.message}`)
      throw (e)
    }
    finally {
      await connection.release()
    }
  },
  down: async (pool) => {
    let connection
    try {
      let migrationName = path.basename(__filename, '.js')
      console.log(`[DB] Running migration ${migrationName} DOWN`)
      connection = await pool.getConnection()
      for (const statement of downMigration) {
        console.log(`[DB] Execute: ${statement}`)
        connection.query(statement)
      }
      await connection.release()
    }
    catch (e) {
      console.log(`[DB] Migration failed: ${e.message}`)
      throw (e)
    }
    finally {
      await connection.release()
    }
  }
}

