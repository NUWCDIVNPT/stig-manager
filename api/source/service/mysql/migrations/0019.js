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

  `CREATE TABLE check_content (
  ccId INT NOT NULL AUTO_INCREMENT,
  digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(content, 256))) STORED,
  content TEXT NOT NULL,
  PRIMARY KEY (ccId),
  UNIQUE INDEX digest_UNIQUE (digest ASC) VISIBLE)`,

  'INSERT INTO check_content (content) VALUES ("")',

  'INSERT INTO check_content (content) SELECT content from `check` c ON DUPLICATE KEY UPDATE content=c.content',

  'ALTER TABLE `check` ADD COLUMN ccId INT NOT NULL DEFAULT 1',

  'ALTER TABLE rule ADD COLUMN ccId INT NOT NULL DEFAULT 1',

  'UPDATE `check` SET ccId = (SELECT ccId from check_content WHERE digest = UNHEX(SHA2(`check`.content, 256)))',

  'ALTER TABLE `check` DROP COLUMN content',

  'DROP TEMPORARY TABLE IF EXISTS temp_ruleId_ccId',

  `CREATE TEMPORARY TABLE temp_ruleId_ccId (
  ruleId varchar(255) NOT NULL,
  ccId int not null,
  primary key (ruleId)) as
WITH cte1 as (select
	r.ruleId,
  MAX(rgrc.checkId) as maxCheckId
from
  rule r
  left join rev_group_rule_map rgr using (ruleId)
  left join rev_group_rule_check_map rgrc using (rgrId)
group by
  r.ruleId)
select 
  cte1.ruleId,
  c.ccId 
from
  cte1 
  left join \`check\` c on cte1.maxCheckId = c.checkId
where
  c.ccId is not null`,

  'UPDATE rule inner join temp_ruleId_ccId t using (ruleId) set rule.ccId = t.ccId',

  'DROP TEMPORARY TABLE IF EXISTS temp_ruleId_ccId',

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
