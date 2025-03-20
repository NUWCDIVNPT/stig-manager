const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // Add unassessed severity count columns to stig_asset_map table
  `ALTER TABLE stig_asset_map
   ADD COLUMN unassessedHighCount INT DEFAULT NULL,
   ADD COLUMN unassessedMediumCount INT DEFAULT NULL,
   ADD COLUMN unassessedLowCount INT DEFAULT NULL`,

  // Initialize the new columns with calculated values
  `UPDATE stig_asset_map sam
   JOIN (
     SELECT 
       sa.assetId,
       sa.benchmarkId,
       sum(CASE WHEN (review.reviewId is null or review.resultId not in (2,3,4)) and rgr.severity='high' THEN 1 ELSE 0 END) as unassessedHighCount,
       sum(CASE WHEN (review.reviewId is null or review.resultId not in (2,3,4)) and rgr.severity='medium' THEN 1 ELSE 0 END) as unassessedMediumCount,
       sum(CASE WHEN (review.reviewId is null or review.resultId not in (2,3,4)) and rgr.severity='low' THEN 1 ELSE 0 END) as unassessedLowCount
     FROM
       asset a
       left join stig_asset_map sa using (assetId)
       left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
       left join rev_group_rule_map rgr on dr.revId = rgr.revId
       left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
       left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
     GROUP BY
       sa.assetId,
       sa.benchmarkId
   ) src ON sam.assetId = src.assetId AND sam.benchmarkId = src.benchmarkId
   SET 
     sam.unassessedHighCount = src.unassessedHighCount,
     sam.unassessedMediumCount = src.unassessedMediumCount,
     sam.unassessedLowCount = src.unassessedLowCount`
]

const downMigration = [
  // Remove unassessed severity count columns from stig_asset_map table
  `ALTER TABLE stig_asset_map
   DROP COLUMN unassessedHighCount,
   DROP COLUMN unassessedMediumCount, 
   DROP COLUMN unassessedLowCount`
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}
