const path = require('path')

const upMigration = [
  'ALTER TABLE review MODIFY COLUMN ruleId VARCHAR(255) NULL',
  'ALTER TABLE review ADD CONSTRAINT `FK_review_rule` FOREIGN KEY (ruleId) REFERENCES rule (ruleId) ON DELETE CASCADE ON UPDATE CASCADE'
]

const downMigration = [
  'ALTER TABLE review DROP FOREIGN KEY `FK_review_rule`',
  'ALTER TABLE review MODIFY COLUMN ruleId VARCHAR(45) NULL'
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

