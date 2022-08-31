const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS review_reject_string_map`
  ,
  `DROP TABLE IF EXISTS reject_string`
  ,
  `DROP TABLE IF EXISTS rev_xml_map`
  ,  
  `DROP TABLE IF EXISTS rule_oval_map`
]



const downMigration = [
  `
  CREATE TABLE review_reject_string_map (
    rrsId int(11) NOT NULL AUTO_INCREMENT,
    assetId int(11) NOT NULL,
    ruleId varchar(45) NOT NULL,
    rejectId int(11) NOT NULL,
    userId int(11) DEFAULT NULL,
    PRIMARY KEY (rrsId),
    UNIQUE KEY INDEX2 (assetId,ruleId,rejectId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 `,
 `
 CREATE TABLE reject_string (
  rejectId int(11) NOT NULL AUTO_INCREMENT,
  shortStr varchar(45) NOT NULL,
  longStr longtext ,
  PRIMARY KEY (rejectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 `,
 `
 CREATE TABLE rule_oval_map (
  roId int(11) NOT NULL AUTO_INCREMENT,
  ruleId varchar(255) NOT NULL,
  ovalRef varchar(255) NOT NULL,
  benchmarkId varchar(255) NOT NULL,
  releaseInfo varchar(255) NOT NULL,
  PRIMARY KEY (roId),
  KEY index2 (ruleId),
  KEY index3 (benchmarkId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
 `,
 `
 CREATE TABLE rev_xml_map (
  rxId int(11) NOT NULL AUTO_INCREMENT,
  revId varchar(255) NOT NULL,
  xml blob,
  PRIMARY KEY (rxId),
  UNIQUE KEY uidx_rxm_revId (revId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
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
