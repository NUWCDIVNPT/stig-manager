const logger = require('../../utils/logger')
const path = require('node:path')

const migrationName = path.basename(__filename, '.js')

const upFn = async (pool, migrationName) => {
  // Check if columns exist before adding them
  const [cols] = await pool.query('SHOW COLUMNS FROM stig_asset_map')
  const colNames = cols.map(row => row.Field)
  
  // Define statements for adding columns
  const colStatements = []
  if (!colNames.includes('assessedHighCount')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN assessedHighCount INT DEFAULT NULL`)
  }
  if (!colNames.includes('assessedMediumCount')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN assessedMediumCount INT DEFAULT NULL`)
  }
  if (!colNames.includes('assessedLowCount')) {
    colStatements.push(`ALTER TABLE stig_asset_map ADD COLUMN assessedLowCount INT DEFAULT NULL`)
  }
  
  // Execute column addition statements
  for (const statement of colStatements) {
    logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement })
    await pool.query(statement)
  }
  
  // Update the columns with calculated values
  const updateStatement = `
  UPDATE stig_asset_map sam
   JOIN (
     SELECT 
       sa.assetId,
       sa.benchmarkId,
       sum(CASE WHEN (review.resultId in (2,3,4)) and rgr.severity='high' THEN 1 ELSE 0 END) as assessedHighCount,
       sum(CASE WHEN (review.resultId in (2,3,4)) and rgr.severity='medium' THEN 1 ELSE 0 END) as assessedMediumCount,
       sum(CASE WHEN (review.resultId in (2,3,4)) and rgr.severity='low' THEN 1 ELSE 0 END) as assessedLowCount
     FROM
       asset a
       left join stig_asset_map sa using (assetId)
       left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
       left join rev_group_rule_map rgr on dr.revId = rgr.revId
       left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
       left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
       inner join collection c on c.collectionId = a.collectionId 
     WHERE 
		    a.state = "enabled"
        and c.state = "enabled" 
     GROUP BY
       sa.assetId,
       sa.benchmarkId
   ) src ON sam.assetId = src.assetId AND sam.benchmarkId = src.benchmarkId
   SET 
     sam.assessedHighCount = src.assessedHighCount,
     sam.assessedMediumCount = src.assessedMediumCount,
     sam.assessedLowCount = src.assessedLowCount`
  
  logger.writeInfo('mysql', 'migration', {status: 'running', name: migrationName, statement: updateStatement })
  await pool.query(updateStatement)
}
  

// Remove assessed severity count columns from stig_asset_map table
const downMigration = [
  `ALTER TABLE stig_asset_map
   DROP COLUMN assessedHighCount,
   DROP COLUMN assessedMediumCount, 
   DROP COLUMN assessedLowCount`
]

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
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}
