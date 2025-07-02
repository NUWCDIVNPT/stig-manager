const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()

  // drop isEnabled from asset if it exists
  const [assetCol] = await connection.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset'
      AND COLUMN_NAME = 'isEnabled'
  `)

  if (assetCol[0].count === 1) {
    const dropIndex = `DROP INDEX INDEX_NAME_COLLECTION_ENABLED ON asset`
    const dropAsset = `ALTER TABLE asset DROP COLUMN isEnabled`

    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropIndex })
    await connection.query(dropIndex)

    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropAsset })
    await connection.query(dropAsset)
  }

  // drop isEnabled from collection if it exists
  const [collectionCol] = await connection.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'collection'
      AND COLUMN_NAME = 'isEnabled'
  `)

  if (collectionCol[0].count === 1) {
    const dropIndex = `DROP INDEX index2 ON collection`
    const dropCollection = `ALTER TABLE collection DROP COLUMN isEnabled`

    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropIndex })
    await connection.query(dropIndex)

    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropCollection })
    await connection.query(dropCollection)
  }

  // create or replace new views
  const createEnabledAssetView = `CREATE OR REPLACE VIEW enabled_asset AS SELECT * FROM asset WHERE state = 'enabled'`
  const createEnabledCollectionView = `CREATE OR REPLACE VIEW enabled_collection AS SELECT * FROM collection WHERE state = 'enabled'`

  logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledAssetView })
  await connection.query(createEnabledAssetView)

  logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledCollectionView })
  await connection.query(createEnabledCollectionView)

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
