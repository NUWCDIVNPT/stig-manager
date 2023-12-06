const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // if absent here, the query UPDATE rev_group_rule_map runs very slowly
  `ALTER TABLE rule DROP FOREIGN KEY fk_rule_1`,
  `ALTER TABLE rule DROP COLUMN ccId, DROP INDEX ccId`,

  // temp table for rule_fix
  `drop table if exists temp_rule_fix`,
  `create temporary table temp_rule_fix(
	  rgrId INT PRIMARY KEY,
    fixref varchar(255),
    text TEXT,
    digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(text, 256))) STORED)`,
  `insert into temp_rule_fix(rgrId, fixref, text)
    select 
      rgrf.rgrId,
      group_concat(fix.fixId) as fixref,
      group_concat(fix.text separator '\n\n-----AND-----\n\n') as text
    from
      rev_group_rule_fix_map rgrf
      left join fix using (fixId)
    group by rgrf.rgrId`,

  // create and populate fix_text
    `CREATE TABLE fix_text (
        ftId INT NOT NULL AUTO_INCREMENT,
        digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(text, 256))) STORED,
        text TEXT NOT NULL,
        PRIMARY KEY (ftId),
        UNIQUE INDEX digest_UNIQUE (digest ASC) VISIBLE)`,
    `INSERT INTO fix_text (text) SELECT text from temp_rule_fix ON DUPLICATE KEY UPDATE text=temp_rule_fix.text`,

  // temp table for rule_check
    `drop table if exists temp_rule_check`,
    `create temporary table temp_rule_check(
      rgrId INT PRIMARY KEY,
        \`system\` varchar(255),
        content TEXT,
        digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(content, 256))) STORED)`,
    `insert into temp_rule_check(rgrId, \`system\`, content)
      select 
        rgrc.rgrId,
        group_concat(rgrc.checkId) as \`system\`,
        group_concat(cc.content separator '\n\n-----AND-----\n\n') as content
      from
        rev_group_rule_check_map rgrc
        left join \`check\` using (checkId)
        left join check_content cc using (ccId)
      group by rgrc.rgrId`,
        
  // populate check_content with multi-check content only. Migration 0019 populated single-check content
    `insert ignore into check_content(content) select content from temp_rule_check where \`system\` like '%,%'`,
    
  // update rev_group_rule_map
    `ALTER TABLE rev_group_rule_map DROP COLUMN checks, DROP COLUMN fixes, DROP COLUMN ccis`,
    `ALTER TABLE rev_group_rule_map
      ADD COLUMN \`revId\` varchar(255) AFTER rgrId,
      ADD COLUMN \`groupId\` varchar(45) AFTER revId,
      ADD COLUMN \`groupTitle\` varchar(255) AFTER groupId,
      ADD COLUMN \`groupSeverity\` varchar(45) AFTER groupTitle,
      ADD COLUMN \`version\` varchar(45),
      ADD COLUMN \`title\` varchar(1000),
      ADD COLUMN \`severity\` varchar(45),
      ADD COLUMN \`weight\` varchar(45),
      ADD COLUMN \`vulnDiscussion\` text,
      ADD COLUMN \`falsePositives\` text,
      ADD COLUMN \`falseNegatives\` text,
      ADD COLUMN \`documentable\` varchar(45) ,
      ADD COLUMN \`mitigations\` text,
      ADD COLUMN \`severityOverrideGuidance\` text,
      ADD COLUMN \`potentialImpacts\` text,
      ADD COLUMN \`thirdPartyTools\` text,
      ADD COLUMN \`mitigationControl\` text,
      ADD COLUMN \`responsibility\` varchar(255) ,
      ADD COLUMN \`iaControls\` varchar(255),
      ADD COLUMN \`checkSystem\` varchar (255),
      ADD COLUMN \`checkDigest\` BINARY(32),
      ADD COLUMN \`fixref\` varchar(255),
      ADD COLUMN \`fixDigest\` BINARY(32)`,
      
    `UPDATE rev_group_rule_map rgr
    LEFT JOIN rev_group_map rg using (rgId)
    LEFT JOIN \`group\` g on rg.groupId = g.groupId
    LEFT JOIN rule r using (ruleId) 
    LEFT JOIN temp_rule_check trc using (rgrId) 
    LEFT JOIN temp_rule_fix trf using (rgrId) 
    SET
      rgr.revId = rg.revId,
      rgr.groupId = rg.groupId,
      rgr.groupTitle = g.title,
      rgr.groupSeverity = g.severity,
      rgr.\`version\` = r.\`version\`,
      rgr.title = r.title,
      rgr.severity = r.severity,
      rgr.weight = r.weight,
      rgr.vulnDiscussion = r.vulnDiscussion,
      rgr.falsePositives = r.falsePositives,
      rgr.falseNegatives = r.falseNegatives,
      rgr.documentable = r.documentable,
      rgr.mitigations = r.mitigations,
      rgr.severityOverrideGuidance = r.severityOverrideGuidance,
      rgr.potentialImpacts = r.potentialImpacts,
      rgr.thirdPartyTools = r.thirdPartyTools,
      rgr.mitigationControl = r.mitigationControl,
      rgr.responsibility = r.responsibility,
      rgr.iaControls = r.iaControls,
      rgr.checkSystem = trc.system,
      rgr.checkDigest = trc.digest,
      rgr.fixref = trf.fixref,
      rgr.fixDigest = trf.digest`,
      `ALTER TABLE rev_group_rule_map DROP FOREIGN KEY FK_rev_group_rule_map_rule`,
      `ALTER TABLE rev_group_rule_map DROP FOREIGN KEY FK_rev_group_rule_map_rev_group_map`,
      `ALTER TABLE rev_group_rule_map DROP INDEX uidx_rgrm_rgId_ruleId`,
      `ALTER TABLE rev_group_rule_map DROP COLUMN rgId`,
      `ALTER TABLE rev_group_rule_map ADD INDEX index4 (checkDigest ASC) VISIBLE, ADD INDEX index5 (fixDigest ASC) VISIBLE`,
      `ALTER TABLE rev_group_rule_map ADD UNIQUE INDEX rev_group_rule_UNIQUE (revId ASC, groupId ASC, ruleId ASC) VISIBLE`,
      `ALTER TABLE rev_group_rule_map ADD CONSTRAINT fk_rev_group_rule_map_1 FOREIGN KEY (revId) REFERENCES revision (revId) ON DELETE CASCADE ON UPDATE CASCADE`,

  // rev_group_rule_cci_map
  `CREATE TABLE rev_group_rule_cci_map (
    rgrccId INT NOT NULL AUTO_INCREMENT,
    rgrId INT NOT NULL,
    cci VARCHAR(20) NOT NULL,
    PRIMARY KEY (rgrccId),
    UNIQUE INDEX index2 (rgrId ASC, cci ASC) VISIBLE,
    INDEX index3 (cci ASC) VISIBLE)`,
  `INSERT INTO rev_group_rule_cci_map (rgrId, cci) 
  SELECT
    rgrId,
    rc.cci
  FROM
    rev_group_rule_map rgr
      left join rule_cci_map rc using (ruleId)
  WHERE
    rc.cci is not null`,

  // drop legacy tables
  `DROP TABLE rev_group_map`,
  `DROP TABLE \`group\``,
  `DROP TABLE rule_cci_map`,
  `DROP TABLE rule`,
  `DROP table rev_group_rule_check_map`,
  `DROP table rev_group_rule_fix_map`,
  `DROP table \`check\``,
  `DROP table fix`,
  `DROP table poam_rar_entry`,

  // VIEW for current_group_rule
  `CREATE OR REPLACE VIEW v_current_group_rule AS
  SELECT
  cr.benchmarkId
  ,rgr.groupId
  ,rgr.groupTitle
  ,rgr.groupSeverity
  ,rgr.ruleId
  ,rgr.\`version\`
  ,rgr.title
  ,rgr.severity
  ,rgr.weight
  ,rgr.vulnDiscussion
  ,rgr.falsePositives
  ,rgr.falseNegatives
  ,rgr.documentable
  ,rgr.mitigations
  ,rgr.severityOverrideGuidance
  ,rgr.potentialImpacts
  ,rgr.thirdPartyTools
  ,rgr.mitigationControl
  ,rgr.responsibility
  ,rgr.iaControls
  ,rgr.checkSystem
  ,rgr.checkDigest
  ,rgr.fixref
  ,rgr.fixDigest
  from current_rev cr left join rev_group_rule_map rgr using(revId)`
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    // await migrationHandler.down(pool, __filename)
  }
}
