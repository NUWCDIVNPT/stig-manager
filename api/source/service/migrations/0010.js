const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `
    ALTER TABLE stig_asset_map 
      ADD COLUMN minTs datetime DEFAULT NULL,
      ADD COLUMN maxTs datetime DEFAULT NULL,
      ADD COLUMN savedManual int DEFAULT NULL,
      ADD COLUMN savedAuto int DEFAULT NULL,
      ADD COLUMN submittedManual int DEFAULT NULL,
      ADD COLUMN submittedAuto int DEFAULT NULL,
      ADD COLUMN rejectedManual int DEFAULT NULL,
      ADD COLUMN rejectedAuto int DEFAULT NULL,
      ADD COLUMN acceptedManual int DEFAULT NULL,
      ADD COLUMN acceptedAuto int DEFAULT NULL,
      ADD COLUMN highCount int DEFAULT NULL,
      ADD COLUMN mediumCount int DEFAULT NULL,
      ADD COLUMN lowCount int DEFAULT NULL;
  `,
  `
  UPDATE stig_asset_map sam
	  INNER JOIN stats_asset_stig sas ON sam.benchmarkId = sas.benchmarkId AND sam.assetId = sas.assetId
  SET sam.minTs = sas.minTs
	  , sam.maxTs = sas.maxTs
    , sam.savedManual = sas.savedManual
    , sam.savedAuto = sas.savedAuto
    , sam.submittedManual = sas.submittedManual
    , sam.submittedAuto = sas.submittedAuto
    , sam.rejectedManual = sas.rejectedManual
    , sam.rejectedAuto = sas.rejectedAuto
    , sam.acceptedManual = sas.acceptedManual
    , sam.acceptedAuto = sas.acceptedAuto
    , sam.highCount = sas.highCount
    , sam.mediumCount = sas.mediumCount
    , sam.lowCount = sas.lowCount
  `,
  `DROP TABLE stats_asset_stig`
]

const downMigration = [
  `
    CREATE TABLE stats_asset_stig (
      id int NOT NULL AUTO_INCREMENT,
      assetId int DEFAULT NULL,
      benchmarkId varchar(255) DEFAULT NULL,
      minTs datetime DEFAULT NULL,
      maxTs datetime DEFAULT NULL,
      savedManual int DEFAULT NULL,
      savedAuto int DEFAULT NULL,
      submittedManual int DEFAULT NULL,
      submittedAuto int DEFAULT NULL,
      rejectedManual int DEFAULT NULL,
      rejectedAuto int DEFAULT NULL,
      acceptedManual int DEFAULT NULL,
      acceptedAuto int DEFAULT NULL,
      highCount int DEFAULT NULL,
      mediumCount int DEFAULT NULL,
      lowCount int DEFAULT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY INDEX_2_2_C (assetId,benchmarkId),
      KEY FK_STATS_ASSET_STIG_2 (benchmarkId),
      CONSTRAINT FOREIGN KEY (assetId) REFERENCES asset (assetId) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `,
  `ALTER TABLE stats_asset_stig MODIFY benchmarkId VARCHAR(255) COLLATE utf8mb4_0900_as_cs`,
  `
    INSERT INTO stats_asset_stig(benchmarkId, assetId, minTs, maxTs, savedManual, savedAuto, 
      submittedManual, submittedAuto, rejectedManual, rejectedAuto, acceptedManual, acceptedAuto, 
      highCount, mediumCount, lowCount)
    SELECT benchmarkId, assetId, minTs, maxTs, savedManual, savedAuto, 
      submittedManual, submittedAuto, rejectedManual, rejectedAuto, acceptedManual, acceptedAuto, 
      highCount, mediumCount, lowCount
    FROM stig_asset_map sam
  `,
  `
    ALTER TABLE stig_asset_map 
      DROP COLUMN minTs,
      DROP COLUMN maxTs,
      DROP COLUMN savedManual,
      DROP COLUMN savedAuto,
      DROP COLUMN submittedManual,
      DROP COLUMN submittedAuto,
      DROP COLUMN rejectedManual,
      DROP COLUMN rejectedAuto,
      DROP COLUMN acceptedManual,
      DROP COLUMN acceptedAuto,
      DROP COLUMN highCount,
      DROP COLUMN mediumCount,
      DROP COLUMN lowCount;
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
