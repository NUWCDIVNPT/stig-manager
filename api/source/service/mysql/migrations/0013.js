const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `CREATE TABLE collection_label (
    clId INT NOT NULL AUTO_INCREMENT,
    collectionId INT NOT NULL,
    name VARCHAR(36) NOT NULL,
    description VARCHAR(45) NULL,
    color VARCHAR(6) NOT NULL,
    uuid BINARY(16) NOT NULL,
    PRIMARY KEY (clId),
    KEY index4 (uuid),
    UNIQUE KEY colname (collectionId,name),
    CONSTRAINT fk_collection_label_1
      FOREIGN KEY (collectionId)
      REFERENCES collection (collectionId)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `,
  `CREATE TABLE collection_label_asset_map (
    claId int NOT NULL AUTO_INCREMENT,
    assetId int NOT NULL,
    clId int NOT NULL,
    PRIMARY KEY (claId),
    KEY fk_collection_label_asset_map_2 (clId),
    UNIQUE KEY index4 (assetId,clId),
    CONSTRAINT fk_collection_label_asset_map_1 FOREIGN KEY (assetId) REFERENCES asset (assetId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_label_asset_map_2 FOREIGN KEY (clId) REFERENCES collection_label (clId) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci  
  `
]

const downMigration = [
  `drop table collection_label_asset_map`,
  `drop table collection_label`
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
