const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')


const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()

  const [collectionsData] = await connection.query(`
    SELECT collectionId, settings 
    FROM collection
  `)

  const updates = []

  for (const { collectionId, settings } of collectionsData) {

    const legacyValue = settings.importOptions.autoStatus

    updates.push({
      collectionId,
      autoStatus: {
        fail: legacyValue,
        notapplicable: legacyValue,
        pass: legacyValue
      }
    })
  }

  logger.writeInfo('mysql', 'migration', {
    status: 'running',
    name: migrationName,
    updates: updates.length,
    data: updates
  })

  await connection.query(`SET @json = ?`, [JSON.stringify(updates)])

  const updateStatement = `
    UPDATE collection c
    LEFT JOIN 
      JSON_TABLE(@json, '$[*]' COLUMNS(
        collectionId INT PATH '$.collectionId',
        autoStatus JSON PATH '$.autoStatus'
      )) as jt 
    ON c.collectionId = jt.collectionId
    SET c.settings = JSON_SET(c.settings, '$.importOptions.autoStatus', jt.autoStatus)
  `

  logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement: updateStatement })

  await connection.query(updateStatement)
  await connection.release()
}

module.exports = {
  up: async pool => {
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
