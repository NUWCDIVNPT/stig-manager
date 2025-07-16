const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `CREATE TABLE collection_label_rule_map (
    clrId INT NOT NULL AUTO_INCREMENT,
    ruleId VARCHAR(255) NOT NULL,
    clId INT NOT NULL,
    PRIMARY KEY (clrId),
    KEY fk_collection_label_rule_map_2 (clId),
    UNIQUE KEY index4 (ruleId, clId),
    CONSTRAINT fk_collection_label_rule_map_1 FOREIGN KEY (ruleId) REFERENCES rule (ruleId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_label_rule_map_2 FOREIGN KEY (clId) REFERENCES collection_label (clId) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
]

const downMigration = [
  `DROP TABLE collection_label_rule_map`
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