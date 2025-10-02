const Importer = require('./lib/mysql-import.js')
const logger = require('../../utils/logger')
const path = require('path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()

  try {
    // Truncate tables to remove all existing CCI data
    const truncateCci = 'TRUNCATE TABLE `cci`'
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: 'TRUNCATE cci' })
    await connection.query(truncateCci)

    const truncateCciRefMap = 'TRUNCATE TABLE `cci_reference_map`'
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: 'TRUNCATE cci_reference_map' })
    await connection.query(truncateCciRefMap)

    // Import Rev 5 CCI data from the current directory
    const sqlFile = path.join(__dirname, 'sql', 'current', '31-rev5-cci-data.sql')
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, file: '31-rev5-cci-data.sql' })
    const importer = new Importer(pool)
    await importer.import(sqlFile)

  } finally {
    await connection.release()
  }
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