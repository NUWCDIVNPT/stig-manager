const path = require('path')

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

