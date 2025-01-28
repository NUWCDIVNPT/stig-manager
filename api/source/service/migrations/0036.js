const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS collection_grant_acl`,
  `DROP TABLE IF EXISTS collection_grant_group_acl`,
  `DROP TABLE IF EXISTS collection_grant_group`,
  `DROP TABLE IF EXISTS user_group_user_map`,
  `DROP TABLE IF EXISTS user_group`,

  // table: user_group
  `CREATE TABLE user_group (
    userGroupId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    modifiedUserId INT NOT NULL,
    modifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    PRIMARY KEY (userGroupId),
    UNIQUE INDEX idx_name (name ASC),
    INDEX fk_user_group_1_idx (createdUserId ASC),
    INDEX fk_user_group_2_idx (modifiedUserId ASC),
    CONSTRAINT fk_user_group_1
      FOREIGN KEY (createdUserId)
      REFERENCES user_data (userId)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT,
    CONSTRAINT fk_user_group_2
      FOREIGN KEY (modifiedUserId)
      REFERENCES user_data (userId)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table user_group_user_map
  `CREATE TABLE user_group_user_map (
    ugumId INT NOT NULL AUTO_INCREMENT,
    userGroupId INT NOT NULL,
    userId INT NOT NULL,
    PRIMARY KEY (ugumId),
    UNIQUE KEY INDEX_UG_USER (userGroupId,userId),
    INDEX fk_user_group_map_2_idx (userId ASC) VISIBLE,
    CONSTRAINT fk_user_group_map_1
      FOREIGN KEY (userGroupId)
      REFERENCES user_group (userGroupId)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    CONSTRAINT fk_user_group_map_2
      FOREIGN KEY (userId)
      REFERENCES user_data (userId)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table collection_grant
  `ALTER TABLE collection_grant DROP FOREIGN KEY fk_collection_grant_1`,
  `ALTER TABLE collection_grant RENAME COLUMN cgId TO grantId`,
  `ALTER TABLE collection_grant ADD COLUMN userGroupId INT NULL AFTER userId, CHANGE COLUMN userId userId INT NULL`,
  `ALTER TABLE collection_grant ADD UNIQUE INDEX INDEX_USER_GROUP (userGroupId ASC, collectionId ASC) VISIBLE`,
  `ALTER TABLE collection_grant CHANGE COLUMN accessLevel roleId INT NOT NULL`,
  `ALTER TABLE collection_grant ADD CONSTRAINT fk_collection_grant_1 FOREIGN KEY (userId) REFERENCES user_data (userId) ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE collection_grant ADD CONSTRAINT fk_collection_grant_3 FOREIGN KEY (userGroupId) REFERENCES user_group (userGroupId) ON DELETE CASCADE ON UPDATE CASCADE`,

  // table collection_grant_acl
  `CREATE TABLE collection_grant_acl (
    cgAclId INT NOT NULL AUTO_INCREMENT,
    grantId INT NOT NULL,
    benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NULL,
    assetId INT NULL,
    clId INT NULL,
    access enum('none','r', 'rw') NOT NULL,
    modifiedUserId int NULL,
    modifiedDate datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cgAclId),
    KEY fk_collection_grant_acl_1 (grantId),
    KEY fk_collection_grant_acl_2 (assetId, benchmarkId),
    KEY fk_collection_grant_acl_3 (benchmarkId, assetId),
    KEY fk_collection_grant_acl_4 (clId, benchmarkId),
    CONSTRAINT fk_collection_grant_acl_1 FOREIGN KEY (grantId) REFERENCES collection_grant (grantId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_2 FOREIGN KEY (assetId) REFERENCES asset (assetId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_3 FOREIGN KEY (benchmarkId) REFERENCES stig (benchmarkId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_4 FOREIGN KEY (clId) REFERENCES collection_label (clId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_5 FOREIGN KEY (benchmarkId, assetId) REFERENCES stig_asset_map (benchmarkId, assetId) ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // initialize collection_grant_acl
  `INSERT INTO collection_grant_acl (grantId, assetId, benchmarkId, access, modifiedUserId, modifiedDate) SELECT
  cg.grantId,
  sa.assetId,
  sa.benchmarkId,
  'rw',
  null,
  null 
FROM
  user_stig_asset_map usa
  left join stig_asset_map sa using (saId)
  left join asset a on sa.assetId = a.assetId
  left join collection_grant cg on (a.collectionId = cg.collectionId and usa.userId = cg.userId )
WHERE
  cg.roleId = 1`,

  `DROP TABLE user_stig_asset_map`
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
