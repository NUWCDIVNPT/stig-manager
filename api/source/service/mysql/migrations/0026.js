const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: collection
  `ALTER TABLE collection 
  CHANGE COLUMN isCloning isNameUnavailable TINYINT GENERATED ALWAYS AS ((case when (state = _utf8mb4'cloning') or (state = _utf8mb4'enabled') then 1 else NULL end)) VIRTUAL ;`,
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