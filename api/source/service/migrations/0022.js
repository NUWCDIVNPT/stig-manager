const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: rule_version_check_digest
  `drop table if exists rule_version_check_digest`,

  `CREATE TABLE rule_version_check_digest (
    ruleId varchar(255) NOT NULL,
    \`version\` varchar(45) NOT NULL,
    checkDigest binary(32) NOT NULL,
    PRIMARY KEY index1 (ruleId),
    KEY index_vcd (\`version\`, checkDigest)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `INSERT INTO rule_version_check_digest (ruleId, \`version\`, checkDigest)
  with currentDigest as (
  select
    rgr.ruleId,
    rgr.version,
    rgr.checkDigest,
    rev.benchmarkDateSql,
    rev.revId,
    ROW_NUMBER() OVER (PARTITION BY rgr.ruleId ORDER BY rev.benchmarkDateSql DESC) as rowNum
  from
    rev_group_rule_map rgr
    left join revision rev using (revId)
  where
    rgr.checkDigest is not null
  )
  select
    ruleId,
    \`version\`,
    checkDigest
  from
    currentDigest
  where
    rowNum = 1`,

  // table: review_history
  `ALTER TABLE review_history ADD COLUMN ruleId VARCHAR(45) DEFAULT NULL`,

  // table: review
  `ALTER TABLE review 
  ADD COLUMN \`version\` VARCHAR(45) NOT NULL AFTER reAuthority,
  ADD COLUMN checkDigest BINARY(32) NOT NULL AFTER \`version\``,

  // table: temp_current_reviews
  `drop table if exists temp_current_reviews`,

  `CREATE TABLE temp_current_reviews (
  reviewId INT,
  \`version\` VARCHAR(45) NOT NULL,
  checkDigest BINARY(32) NOT NULL,
  PRIMARY KEY (reviewId))`,

  `INSERT INTO temp_current_reviews (reviewId, \`version\`, checkDigest)
  WITH ordered_reviews AS (
  SELECT r.reviewId,rvcd.version,rvcd.checkDigest,ROW_NUMBER() OVER (PARTITION BY r.assetId, rvcd.version, rvcd.checkDigest ORDER BY r.touchTs DESC) as rowNum
  FROM review r INNER JOIN rule_version_check_digest rvcd using (ruleId))
  ,active_reviews AS (SELECT reviewId, \`version\`, checkDigest from ordered_reviews where rowNum = 1)
  SELECT reviewId, \`version\`, checkDigest from active_reviews`,

  // update the reviews that are current
  `UPDATE review r INNER JOIN temp_current_reviews t using (reviewId) SET r.version = t.version, r.checkDigest = t.checkDigest`,

  // index the new columns
  `ALTER TABLE review ADD INDEX idx_vcd (\`version\`, checkDigest)`,
  `ALTER TABLE review ADD INDEX idx_asset_vcd (assetId, \`version\`, checkDigest)`,
  `ALTER TABLE review DROP INDEX INDEX_ASSETID_RULEID`,

  `drop table if exists temp_current_reviews`,

  // recalculate metrics

  `with source as
  ( select
     sa.assetId,
     sa.benchmarkId,
     min(review.ts) as minTs,
     max(review.ts) as maxTs,  
     max(review.touchTs) as maxTouchTs,  
     
     sum(CASE WHEN review.statusId = 0 THEN 1 ELSE 0 END) as saved,
     sum(CASE WHEN review.resultEngine is not null and review.statusId = 0 THEN 1 ELSE 0 END) as savedResultEngine,
     sum(CASE WHEN review.statusId = 1 THEN 1 ELSE 0 END) as submitted,
     sum(CASE WHEN review.resultEngine is not null and review.statusId = 1 THEN 1 ELSE 0 END) as submittedResultEngine,
     sum(CASE WHEN review.statusId = 2 THEN 1 ELSE 0 END) as rejected,
     sum(CASE WHEN review.resultEngine is not null and review.statusId = 2 THEN 1 ELSE 0 END) as rejectedResultEngine,
     sum(CASE WHEN review.statusId = 3 THEN 1 ELSE 0 END) as accepted,
     sum(CASE WHEN review.resultEngine is not null and review.statusId = 3 THEN 1 ELSE 0 END) as acceptedResultEngine,

     sum(CASE WHEN review.resultId=4 and cgr.severity='high' THEN 1 ELSE 0 END) as highCount,
     sum(CASE WHEN review.resultId=4 and cgr.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
     sum(CASE WHEN review.resultId=4 and cgr.severity='low' THEN 1 ELSE 0 END) as lowCount,
     
     sum(CASE WHEN review.resultId = 1 THEN 1 ELSE 0 END) as notchecked,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 1 THEN 1 ELSE 0 END) as notcheckedResultEngine,
     sum(CASE WHEN review.resultId = 2 THEN 1 ELSE 0 END) as notapplicable,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 2 THEN 1 ELSE 0 END) as notapplicableResultEngine,
     sum(CASE WHEN review.resultId = 3 THEN 1 ELSE 0 END) as pass,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 3 THEN 1 ELSE 0 END) as passResultEngine,
     sum(CASE WHEN review.resultId = 4 THEN 1 ELSE 0 END) as fail,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 4 THEN 1 ELSE 0 END) as failResultEngine,
     sum(CASE WHEN review.resultId = 5 THEN 1 ELSE 0 END) as unknown,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 5 THEN 1 ELSE 0 END) as unknownResultEngine,
     sum(CASE WHEN review.resultId = 6 THEN 1 ELSE 0 END) as error,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 6 THEN 1 ELSE 0 END) as errorResultEngine,
     sum(CASE WHEN review.resultId = 7 THEN 1 ELSE 0 END) as notselected,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 7 THEN 1 ELSE 0 END) as notselectedResultEngine,            
     sum(CASE WHEN review.resultId = 8 THEN 1 ELSE 0 END) as informational,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 8 THEN 1 ELSE 0 END) as informationalResultEngine,
     sum(CASE WHEN review.resultId = 9 THEN 1 ELSE 0 END) as fixed,
     sum(CASE WHEN review.resultEngine is not null and review.resultId = 9 THEN 1 ELSE 0 END) as fixedResultEngine
     
     from
       asset a
       left join stig_asset_map sa using (assetId)
       left join v_current_group_rule cgr using (benchmarkId)
       left join rule_version_check_digest rvcd using (ruleId)
       left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
  group by
    sa.assetId,
    sa.benchmarkId
    )
update stig_asset_map sam
  inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
  set sam.minTs = source.minTs,
      sam.maxTs = source.maxTs,
      sam.maxTouchTs = source.maxTouchTs,
      sam.saved = source.saved,
      sam.savedResultEngine = source.savedResultEngine,
      sam.submitted = source.submitted,
      sam.submittedResultEngine = source.submittedResultEngine,
      sam.rejected = source.rejected,
      sam.rejectedResultEngine = source.rejectedResultEngine,
      sam.accepted = source.accepted,
      sam.acceptedResultEngine = source.acceptedResultEngine,
      sam.highCount = source.highCount,
      sam.mediumCount = source.mediumCount,
      sam.lowCount = source.lowCount,
      sam.notchecked = source.notchecked,
      sam.notcheckedResultEngine = source.notcheckedResultEngine,
      sam.notapplicable = source.notapplicable,
      sam.notapplicableResultEngine = source.notapplicableResultEngine,
      sam.pass = source.pass,
      sam.passResultEngine = source.passResultEngine,
      sam.fail = source.fail,
      sam.failResultEngine = source.failResultEngine,
      sam.unknown = source.unknown,
      sam.unknownResultEngine = source.unknownResultEngine,
      sam.error = source.error,
      sam.errorResultEngine = source.errorResultEngine,
      sam.notselected = source.notselected,
      sam.notselectedResultEngine = source.notselectedResultEngine,
      sam.informational = source.informational,
      sam.informationalResultEngine = source.informationalResultEngine,
      sam.fixed = source.fixed,
      sam.fixedResultEngine = source.fixedResultEngine`
]

const downMigration = [
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
