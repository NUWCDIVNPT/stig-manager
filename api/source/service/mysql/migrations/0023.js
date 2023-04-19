const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [

  // table: collection_rev

  `drop table if exists collection_rev_map`,

  `CREATE TABLE collection_rev_map (
    crId INT NOT NULL AUTO_INCREMENT,
    collectionId INT NOT NULL,
    benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs,
    revId VARCHAR(255) NOT NULL,
    PRIMARY KEY index1 (crId),
    UNIQUE KEY index_collection_benchmark (collectionId, benchmarkId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
]

const downMigration = [
  `drop table if exists collection_rev_map`
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
