const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const [cols] = await pool.query('SHOW COLUMNS FROM stig_asset_map')
  const colNames = cols.map(row => row.Field)
  const colStatements = []
  if (colNames.includes('resultEngines')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN resultEngines`)
  }
  if (colNames.includes('users')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN users`)
  }
  if (colNames.includes('statusUsers')) {
    colStatements.push(`ALTER TABLE stig_asset_map DROP COLUMN statusUsers`)
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

