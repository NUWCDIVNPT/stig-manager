const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: collection
  `ALTER TABLE collection 
  ADD COLUMN isCloning TINYINT GENERATED ALWAYS AS (case when (state = 'cloning') then 1 else null end),
  ADD UNIQUE INDEX index3 (name ASC, isCloning ASC) VISIBLE`,

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
