const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const [cols] = await pool.query('SHOW COLUMNS FROM user_data')
  const colNames = cols.map(row => row.Field)
  const colStatements = []
  if (!colNames.includes('status')) {
    colStatements.push(`ALTER TABLE user_data ADD COLUMN status ENUM('available', 'unavailable') NOT NULL DEFAULT 'available' AFTER lastClaims`)
    colStatements.push(`ALTER TABLE user_data ADD INDEX INDEX_status (status ASC)`)
  }
  if (!colNames.includes('statusDate')) {
    colStatements.push(`ALTER TABLE user_data ADD COLUMN statusDate DATETIME NOT NULL DEFAULT (created) AFTER status`)
  }
  if (!colNames.includes('statusUser')) {
    colStatements.push(`ALTER TABLE user_data ADD COLUMN statusUser INT NULL DEFAULT NULL AFTER statusDate`)
  }
  if (colStatements.length === 0) {
    logger.writeInfo('mysql', 'migration', {status: 'skipped', name: migrationName })
    return
  }
  for (const statement of colStatements) {
    logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
    await pool.query(statement)
  }
}

module.exports = {
  up: async pool => {
    try {
      logger.writeInfo('mysql', 'migration', {status: 'start', direction: 'up', migrationName })
      await upFn(pool, migrationName)
      logger.writeInfo('mysql', 'migration', {status: 'finish', migrationName })
    }
    catch (e) {
      logger.writeError('mysql', 'migration', {status: 'error', migrationName, message: e.message })
      throw (e)
    }
  },
  down: () => {}
}
