const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE revision 
  ADD COLUMN lowCount INT NOT NULL DEFAULT 0,
  ADD COLUMN mediumCount INT NOT NULL DEFAULT 0,
  ADD COLUMN highCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN ruleCount ruleCount INT GENERATED ALWAYS AS (highCount + mediumCount + lowCount) STORED`,

  `update revision left join (select
    rg.revId,
      SUM(CASE WHEN r.severity = 'high' THEN 1 ELSE 0 END) as highCount,
      SUM(CASE WHEN r.severity = 'medium' THEN 1 ELSE 0 END) as mediumCount,
      SUM(CASE WHEN r.severity = 'low' THEN 1 ELSE 0 END) as lowCount
  from
    rev_group_map rg
      left join rev_group_rule_map rgr on rg.rgId = rgr.rgId
      left join rule r on rgr.ruleId = r.ruleId
  group by
    rg.revId) as sq on revision.revId = sq.revId
  set
    revision.lowCount = sq.lowCount,
    revision.mediumCount = sq.mediumCount,
    revision.highCount = sq.highCount`,

  `ALTER TABLE current_rev 
  ADD COLUMN lowCount INT NOT NULL DEFAULT 0,
  ADD COLUMN mediumCount INT NOT NULL DEFAULT 0,
  ADD COLUMN highCount INT NOT NULL DEFAULT 0,
  CHANGE COLUMN ruleCount ruleCount INT GENERATED ALWAYS AS (highCount + mediumCount + lowCount) STORED`,
  
  `ALTER VIEW v_current_rev AS
  select
  rr.revId AS revId,
  rr.benchmarkId AS benchmarkId,
  rr.\`version\` AS \`version\`,
  rr.\`release\` AS \`release\`,
  rr.benchmarkDate AS benchmarkDate,
  rr.benchmarkDateSql AS benchmarkDateSql,
  rr.status AS status,
  rr.statusDate AS statusDate,
  rr.description AS description,
  rr.active AS active,
  rr.groupCount AS groupCount,
  rr.ruleCount AS ruleCount,
  rr.lowCount AS lowCount,
  rr.mediumCount AS mediumCount,
  rr.highCount AS highCount,
  rr.checkCount AS checkCount,
  rr.fixCount AS fixCount from (select r.revId AS revId,
  r.benchmarkId AS benchmarkId,
  r.\`version\` AS \`version\`,
  r.\`release\` AS \`release\`,
  r.benchmarkDate AS benchmarkDate,
  r.benchmarkDateSql AS benchmarkDateSql,
  r.status AS status,
  r.statusDate AS statusDate,
  r.description AS description,
  r.active AS active,
  r.groupCount AS groupCount,
  r.ruleCount AS ruleCount,
  r.lowCount AS lowCount,
  r.mediumCount AS mediumCount,
  r.highCount AS highCount,
  r.checkCount AS checkCount,
  r.fixCount AS fixCount,
  row_number() OVER (PARTITION BY r.benchmarkId ORDER BY field(r.status,
  'draft',
  'accepted') desc,
  (r.\`version\` + 0) desc,
  (r.\`release\` + 0) desc )  AS rn from revision r) rr where (rr.rn = 1)`,

  `DELETE FROM current_rev`,
  `INSERT INTO current_rev (
    revId,
    benchmarkId,
    \`version\`, 
    \`release\`, 
    benchmarkDate,
    benchmarkDateSql,
    status,
    statusDate,
    description,
    active,
    groupCount,
    lowCount,
    mediumCount,
    highCount,
    checkCount,
    fixCount)
    SELECT 
      revId,
      benchmarkId,
      \`version\`,
      \`release\`,
      benchmarkDate,
      benchmarkDateSql,
      status,
      statusDate,
      description,
      active,
      groupCount,
      lowCount,
      mediumCount,
      highCount,
      checkCount,
      fixCount
    FROM
      v_current_rev`,

  `CREATE TABLE check_content (
  ccId INT NOT NULL AUTO_INCREMENT,
  digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(content, 256))) STORED,
  content TEXT NOT NULL,
  PRIMARY KEY (ccId),
  UNIQUE INDEX digest_UNIQUE (digest ASC) VISIBLE)`,

  'INSERT INTO check_content (content) SELECT content from `check` c ON DUPLICATE KEY UPDATE content=c.content',

  'ALTER TABLE `check` ADD COLUMN ccId INT DEFAULT NULL',

  'ALTER TABLE rule ADD COLUMN ccId INT DEFAULT NULL',

  'UPDATE `check` SET ccId = (SELECT ccId from check_content WHERE digest = UNHEX(SHA2(`check`.content, 256)))',

  'ALTER TABLE `check` DROP COLUMN content',

  'ALTER TABLE `check` ADD INDEX (ccId)',

  `ALTER TABLE \`check\` ADD CONSTRAINT fk_check_1 FOREIGN KEY (ccId) REFERENCES check_content (ccId) ON DELETE RESTRICT ON UPDATE RESTRICT`,

  'ALTER TABLE rule ADD INDEX (ccId)',

  `ALTER TABLE rule ADD CONSTRAINT fk_rule_1 FOREIGN KEY (ccId) REFERENCES check_content (ccId) ON DELETE RESTRICT ON UPDATE RESTRICT`,
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
