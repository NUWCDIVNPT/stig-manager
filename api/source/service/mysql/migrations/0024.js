const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: collection
  `ALTER TABLE collection 
  ADD COLUMN state ENUM('enabled','disabled','cloning') NOT NULL,
  ADD COLUMN createdUserId INT NULL,
  ADD COLUMN stateDate DATETIME NULL,
  ADD COLUMN stateUserId INT NULL,
  ADD COLUMN isEnabled TINYINT GENERATED ALWAYS AS (case when (state = 'enabled') then 1 else null end),
  DROP INDEX index2,
  ADD UNIQUE INDEX index2 (name ASC, isEnabled ASC) VISIBLE`,

  // table: asset
  `ALTER TABLE asset ADD COLUMN state ENUM('enabled','disabled') NOT NULL,
  ADD COLUMN stateDate DATETIME NULL,
  ADD COLUMN stateUserId INT NULL,
  ADD COLUMN isEnabled TINYINT GENERATED ALWAYS AS (case when (state = 'enabled') then 1 else null end),
  DROP INDEX INDEX_NAMECOLLECTION,
  ADD UNIQUE INDEX INDEX_NAME_COLLECTION_ENABLED (name ASC, collectionId ASC, isEnabled ASC) VISIBLE`,

  // procedure: deleteDisabledCollections
  `DROP procedure IF EXISTS deleteDisabledCollections`
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
