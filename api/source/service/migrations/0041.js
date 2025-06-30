const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upMigration = [
  // Add classification fields to review table
  `ALTER TABLE stigman.review 
   ADD COLUMN commentClassification VARCHAR(10) DEFAULT NULL,
   ADD COLUMN detailClassification VARCHAR(10) DEFAULT NULL`,

  // Add classification field to asset table  
  `ALTER TABLE stigman.asset 
   ADD COLUMN classification VARCHAR(10) DEFAULT NULL`,

  // Add classification field to rev_group_rule_map table (for STIG rule classification)
  `ALTER TABLE stigman.rev_group_rule_map 
   ADD COLUMN classification VARCHAR(10) DEFAULT NULL`,

  // Create indexes for performance
  `CREATE INDEX idx_review_comment_classification ON stigman.review(commentClassification)`,
  `CREATE INDEX idx_review_detail_classification ON stigman.review(detailClassification)`,
  `CREATE INDEX idx_asset_classification ON stigman.asset(classification)`,
  `CREATE INDEX idx_rev_group_rule_map_classification ON stigman.rev_group_rule_map(classification)`
]

const downMigration = [
  // Remove indexes
  `DROP INDEX idx_review_comment_classification ON stigman.review`,
  `DROP INDEX idx_review_detail_classification ON stigman.review`,
  `DROP INDEX idx_asset_classification ON stigman.asset`,
  `DROP INDEX idx_rev_group_rule_map_classification ON stigman.rev_group_rule_map`,

  // Remove classification columns
  `ALTER TABLE stigman.review 
   DROP COLUMN commentClassification,
   DROP COLUMN detailClassification`,

  `ALTER TABLE stigman.asset 
   DROP COLUMN classification`,

  `ALTER TABLE stigman.rev_group_rule_map 
   DROP COLUMN classification`
]

const upFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()
  
  try {
    logger.writeInfo('mysql', 'migration', {
      status: 'running',
      name: migrationName,
      direction: 'up'
    })

    for (const statement of upMigration) {
      logger.writeInfo('mysql', 'migration', {
        status: 'executing',
        name: migrationName,
        statement: statement.replace(/\s+/g, ' ').trim()
      })
      await connection.query(statement)
    }

    logger.writeInfo('mysql', 'migration', {
      status: 'completed',
      name: migrationName,
      direction: 'up'
    })
  } finally {
    await connection.release()
  }
}

const downFn = async (pool, migrationName) => {
  const connection = await pool.getConnection()
  
  try {
    logger.writeInfo('mysql', 'migration', {
      status: 'running',
      name: migrationName,
      direction: 'down'
    })

    for (const statement of downMigration) {
      logger.writeInfo('mysql', 'migration', {
        status: 'executing',
        name: migrationName,
        statement: statement.replace(/\s+/g, ' ').trim()
      })
      await connection.query(statement)
    }

    logger.writeInfo('mysql', 'migration', {
      status: 'completed',
      name: migrationName,
      direction: 'down'
    })
  } finally {
    await connection.release()
  }
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
  down: async pool => {
    try {
      logger.writeInfo('mysql', 'migration', { status: 'start', direction: 'down', migrationName })
      await downFn(pool, migrationName)
      logger.writeInfo('mysql', 'migration', { status: 'finish', migrationName })
    } catch (e) {
      logger.writeError('mysql', 'migration', { status: 'error', migrationName, message: e.message })
      throw e
    }
  }
}