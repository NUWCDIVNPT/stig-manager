const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const defaultImportOptions = {
  autoStatus: 'saved',
  unreviewed: 'commented',
  unreviewedCommented: 'informational',
  emptyDetail: 'replace',
  emptyComment: 'ignore',
  allowCustom: true
}

const schemaEnums = {
    autoStatus: ["null", 'saved', 'submitted', 'accepted'],
    unreviewed: ['never', 'commented', 'always'],
    unreviewedCommented: ['notchecked', 'informational'],
    emptyDetail: ['ignore', 'import', 'replace'],
    emptyComment: ['ignore', 'import', 'replace'],
    allowCustom: [true, false]
}


const isValidImportOptions = (options) => {
  if (!options || typeof options !== 'object') return false

  const allowedKeys = Object.keys(defaultImportOptions)

  // contain only the allowed keys
  const optionKeys = Object.keys(options)
  if (optionKeys.length !== allowedKeys.length) return false
  if (!optionKeys.every(key => allowedKeys.includes(key))) return false

  // Each value must be valid for its key
  for (const key of allowedKeys) {
    const allowedValues = schemaEnums[key]
    if (!allowedValues.includes(options[key])) return false
  }

  return true
}


const upFn = async (pool, migrationName) => {

  const connection = await pool.getConnection()
  

  const collectionsData = await connection.query(`SELECT c.collectionId, c.settings, c.metadata FROM collection c`)

  const collections = collectionsData[0]

  const updates = []

  for(const { collectionId, metadata, } of collections) {
    let importOptions = metadata?.importOptions
    if (typeof importOptions === 'string') {
      try {
        importOptions = JSON.parse(importOptions)
      } catch (e) {
        importOptions = null // will be replaced with defaultImportOptions
      }
    }
    const finalOptions = isValidImportOptions(importOptions) ? importOptions : defaultImportOptions
    updates.push({
      collectionId,
      importOptions: finalOptions
    })
  }
  
  logger.writeInfo('mysql', 'migration', {
    status: 'running',
    name: migrationName,
    updates: updates.length
  })
  // get connection


  await connection.query(`SET @json = ?`, [JSON.stringify(updates)])

  await connection.query(`UPDATE
	collection c
    LEFT JOIN 
    JSON_TABLE(@json, '$[*]' COLUMNS(
		collectionId INT PATH '$.collectionId',
		importOptions JSON PATH '$.importOptions'
	)) as jt on c.collectionId = jt.collectionId
SET
	c.settings = JSON_SET(c.settings, '$.importOptions', jt.importOptions),
	c.metadata = JSON_REMOVE(c.metadata, '$.importOptions')`)

  await connection.release()
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
