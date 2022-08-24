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
  `
]

// STILL NEEDS UPDATE STATS QUERY



const downMigration = [
  `
  ALTER TABLE stig_asset_map 
  RENAME COLUMN saved TO savedManual,
  RENAME COLUMN savedResultEngine TO saved,
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
