const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()

  // drop indexes that use virtual isEnabled column

  // check if the indexes exist before dropping them
  const [assetIndexExists] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset'
      AND INDEX_NAME = 'INDEX_NAME_COLLECTION_ENABLED'`)  
  const [collectionIndexExists] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'collection'
      AND INDEX_NAME = 'index2'`) 
  // If the indexes exist, drop them
  if( assetIndexExists[0].count > 0) {
    const dropEnabledAssetIndex = `ALTER TABLE asset DROP INDEX INDEX_NAME_COLLECTION_ENABLED`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropEnabledAssetIndex })
    await connection.query(dropEnabledAssetIndex)
  }

  if( collectionIndexExists[0].count > 0) {
    const dropEnabledCollectionIndex = `ALTER TABLE collection DROP INDEX index2`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropEnabledCollectionIndex })
    await connection.query(dropEnabledCollectionIndex)
  }
 
  // Drop old virtual isEnabled column on 'asset' if it exists
  const [assetColumnsDrop] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'asset'
      AND COLUMN_NAME = 'isEnabled'`)
  if (assetColumnsDrop[0].count > 0) {
    const dropEnabledAssetColumn = `ALTER TABLE asset DROP COLUMN isEnabled`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropEnabledAssetColumn })
    await connection.query(dropEnabledAssetColumn)
  }

  // Drop old virtual isEnabled column on 'collection' if it exists
  const [collectionColumnsDrop] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'collection'
      AND COLUMN_NAME = 'isEnabled'`)
  if (collectionColumnsDrop[0].count > 0) {
    const dropEnabledCollectionColumn = `ALTER TABLE collection DROP COLUMN isEnabled`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: dropEnabledCollectionColumn })
    await connection.query(dropEnabledCollectionColumn)
  }


  // Check if 'isEnabled' exists on 'asset'
  const [assetColumns] = await connection.query(`
  SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'asset'
    AND COLUMN_NAME = 'isEnabled'`)
    
  // If it does not exist, create the new stored column
  if (assetColumns[0].count === 0) {
    const createEnabledAssetColumn = `
      ALTER TABLE asset ADD COLUMN isEnabled
      TINYINT GENERATED ALWAYS AS (CASE WHEN state = 'enabled' THEN 1 ELSE NULL END) STORED`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledAssetColumn })
    await connection.query(createEnabledAssetColumn)
  }

  // Check if 'isEnabled' exists on 'collection'
  const [collectionColumns] = await connection.query(`
    SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'collection'
      AND COLUMN_NAME = 'isEnabled'`)
  // If it does not exist, create the new stored column
  if (collectionColumns[0].count === 0) {
    const createEnabledCollectionColumn = `
      ALTER TABLE collection ADD COLUMN isEnabled
      TINYINT GENERATED ALWAYS AS (CASE WHEN state = 'enabled' THEN 1 ELSE NULL END) STORED`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledCollectionColumn })
    await connection.query(createEnabledCollectionColumn)
  }

  // recreate indexes for new stored isEnabled column
  const [assetIndexes] = await connection.query(`
  SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'asset'
    AND INDEX_NAME = 'INDEX_NAME_COLLECTION_ENABLED'`)
    // If the index does not exist, create it
  if (assetIndexes[0].count === 0) {
    const createEnabledAssetIndex = `ALTER TABLE asset ADD UNIQUE INDEX INDEX_NAME_COLLECTION_ENABLED (name, collectionId, isEnabled)`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledAssetIndex })
    await connection.query(createEnabledAssetIndex)
  }

  
  const [collectionIndexes] = await connection.query(`
  SELECT COUNT(*) AS count FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'collection'
    AND INDEX_NAME = 'index2'`)
  if (collectionIndexes[0].count === 0) {
    const createEnabledCollectionIndex = `ALTER TABLE collection ADD UNIQUE INDEX index2 (name, isEnabled)`
    logger.writeInfo('mysql', 'migration', { status: 'running', name: migrationName, statement: createEnabledCollectionIndex })
    await connection.query(createEnabledCollectionIndex)
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
