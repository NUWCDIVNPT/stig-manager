const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `
  ALTER TABLE stig_asset_map 
  RENAME COLUMN savedManual TO saved,
  RENAME COLUMN savedAuto TO savedResultEngine,
  RENAME COLUMN submittedManual TO submitted,
  RENAME COLUMN submittedAuto TO submittedResultEngine, 
  RENAME COLUMN rejectedManual to rejected,  
  RENAME COLUMN rejectedAuto TO rejectedResultEngine,
  RENAME COLUMN acceptedManual TO accepted,
  RENAME COLUMN acceptedAuto TO acceptedResultEngine,
 
  ADD COLUMN notchecked int,
  ADD COLUMN notcheckedResultEngine int,
  ADD COLUMN notapplicable int, 
  ADD COLUMN notapplicableResultEngine int, 
  ADD COLUMN pass int,
  ADD COLUMN passResultEngine int,
  ADD COLUMN fail int,
  ADD COLUMN failResultEngine int,
  ADD COLUMN unknown int,
  ADD COLUMN unknownResultEngine int,
  ADD COLUMN error int,
  ADD COLUMN errorResultEngine int,
  ADD COLUMN notselected int,
  ADD COLUMN notselectedResultEngine int,
  ADD COLUMN informational int,
  ADD COLUMN informationalResultEngine int,
  ADD COLUMN fixed int,  
  ADD COLUMN fixedResultEngine int  
  `,

  `
  with source as
    ( select
       sa.assetId,
       sa.benchmarkId,
       min(review.ts) as minTs,
       max(review.ts) as maxTs,  
       
       sum(CASE WHEN review.statusId = 0 THEN 1 ELSE 0 END) as saved,
       sum(CASE WHEN review.resultEngine is not null and review.statusId = 0 THEN 1 ELSE 0 END) as savedResultEngine,
       sum(CASE WHEN review.statusId = 1 THEN 1 ELSE 0 END) as submitted,
       sum(CASE WHEN review.resultEngine is not null and review.statusId = 1 THEN 1 ELSE 0 END) as submittedResultEngine,
       sum(CASE WHEN review.statusId = 2 THEN 1 ELSE 0 END) as rejected,
       sum(CASE WHEN review.resultEngine is not null and review.statusId = 2 THEN 1 ELSE 0 END) as rejectedResultEngine,
       sum(CASE WHEN review.statusId = 3 THEN 1 ELSE 0 END) as accepted,
       sum(CASE WHEN review.resultEngine is not null and review.statusId = 3 THEN 1 ELSE 0 END) as acceptedResultEngine,

       sum(CASE WHEN review.resultId=4 and r.severity='high' THEN 1 ELSE 0 END) as highCount,
       sum(CASE WHEN review.resultId=4 and r.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
       sum(CASE WHEN review.resultId=4 and r.severity='low' THEN 1 ELSE 0 END) as lowCount,
       
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
         left join current_group_rule cgr using (benchmarkId)
         left join rule r using (ruleId)
         left join review on (r.ruleId=review.ruleId and review.assetId=sa.assetId)
    group by
      sa.assetId,
      sa.benchmarkId
      )
  update stig_asset_map sam
    inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
    set sam.minTs = source.minTs,
        sam.maxTs = source.maxTs,
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
        sam.fixedResultEngine = source.fixedResultEngine        
    `

]



const downMigration = [
  `
  ALTER TABLE stig_asset_map 
  RENAME COLUMN saved TO savedManual,
  RENAME COLUMN savedResultEngine TO savedAuto,
  RENAME COLUMN submitted TO submittedManual,
  RENAME COLUMN submittedResultEngine TO submittedAuto, 
  RENAME COLUMN rejected to rejectedManual,  
  RENAME COLUMN rejectedResultEngine TO rejectedAuto,
  RENAME COLUMN accepted TO acceptedManual,
  RENAME COLUMN acceptedResultEngine TO acceptedAuto,
 
  DROP COLUMN notchecked ,
  DROP COLUMN notcheckedResultEngine ,
  DROP COLUMN notapplicable , 
  DROP COLUMN notapplicableResultEngine , 
  DROP COLUMN pass ,
  DROP COLUMN passResultEngine ,
  DROP COLUMN fail ,
  DROP COLUMN failResultEngine ,
  DROP COLUMN unknown ,
  DROP COLUMN unknownResultEngine ,
  DROP COLUMN error ,
  DROP COLUMN errorResultEngine ,
  DROP COLUMN notselected ,
  DROP COLUMN notselectedResultEngine ,
  DROP COLUMN informational ,
  DROP COLUMN informationalResultEngine ,
  DROP COLUMN fixed ,  
  DROP COLUMN fixedResultEngine   
 `

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
