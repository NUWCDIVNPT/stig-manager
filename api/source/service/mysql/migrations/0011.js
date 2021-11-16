const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE review
  CHANGE COLUMN \`resultComment\` \`detail\` MEDIUMTEXT DEFAULT NULL,
  CHANGE COLUMN \`actionComment\` \`comment\` MEDIUMTEXT DEFAULT NULL,
  CHANGE COLUMN \`ts\` \`ts\` DATETIME NOT NULL,
  CHANGE COLUMN \`rejecttext\` \`statusText\` VARCHAR(255) DEFAULT NULL AFTER \`statusId\`,
  CHANGE COLUMN \`rejectUserId\` \`statusUserId\` INT DEFAULT NULL AFTER \`statusText\`,
  ADD COLUMN \`statusTs\` DATETIME DEFAULT NULL AFTER \`statusUserId\`,
  ADD COLUMN \`touchTs\` DATETIME GENERATED ALWAYS AS (GREATEST(ts,statusTs)) STORED,
  DROP COLUMN \`actionId\``,

  `UPDATE review SET 
  statusText = CASE WHEN statusId = 2 THEN statusText ELSE NULL END,
  statusUserId = userId,
  statusTs = ts`,

  `ALTER TABLE review_history
  CHANGE COLUMN \`resultComment\` \`detail\` MEDIUMTEXT DEFAULT NULL,
  CHANGE COLUMN \`actionComment\` \`comment\` MEDIUMTEXT DEFAULT NULL,
  CHANGE COLUMN \`rejecttext\` \`statusText\` VARCHAR(255) DEFAULT NULL AFTER \`statusId\`,
  CHANGE COLUMN \`rejectUserId\` \`statusUserId\` INT DEFAULT NULL AFTER \`statusText\`,
  ADD COLUMN \`statusTs\` DATETIME DEFAULT NULL AFTER \`statusUserId\`,
  ADD COLUMN \`touchTs\` DATETIME DEFAULT NULL,
  DROP COLUMN \`actionId\``,

  `UPDATE review_history SET 
  statusText = CASE WHEN statusId = 2 THEN statusText ELSE NULL END,
  statusUserId = userId,
  statusTs = ts,
  touchTs = ts`,

  'DROP TABLE IF EXISTS `action`',
]

const downMigration = [
  'ALTER TABLE `review` RENAME COLUMN `detail` TO `resultComment`',
  'ALTER TABLE `review` RENAME COLUMN `comment` TO `actionComment`',
  `CREATE TABLE action (
    actionId int(11) NOT NULL,
    api varchar(16) NOT NULL,
    en varchar(64) NOT NULL,
    PRIMARY KEY (actionId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  "INSERT INTO `action` VALUES (1,'remediate','Remediate'),(2,'mitigate','Mitigate'),(3,'exception','Exception')",
  'ALTER TABLE `review` ADD COLUMN `actionId` INT DEFAULT NULL',
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
