const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()

  // webPreferences column exists on user_data
  const [cols] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'user_data'
      AND COLUMN_NAME = 'webPreferences'`)
      
  // If it does not exist, create the webPreferences column
  if (cols[0].count === 0) {
    const addWebPreferencesColumn = `
      ALTER TABLE user_data ADD COLUMN webPreferences JSON NOT NULL DEFAULT ('{"darkMode": true, "lastWhatsNew": "2000-01-01"}')`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: addWebPreferencesColumn })
    await connection.query(addWebPreferencesColumn)
  }
  
  await connection.release()
}

module.exports = {
  up: async (pool) => {
    try {
      logger.writeInfo('mysql', 'migration', { status: 'start', direction: 'up', migrationName })
      await upFn(pool, migrationName)
      logger.writeInfo('mysql', 'migration', { status: 'finish', migrationName })
    } catch (e) {
      logger.writeError('mysql', 'migration', { status: 'error', migrationName, message: e.message })
      throw e
    }
  },
  down: () => {}
}