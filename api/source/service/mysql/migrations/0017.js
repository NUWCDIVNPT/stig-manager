const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
	`ALTER TABLE current_rev DROP COLUMN ovalCount`,  
	`ALTER TABLE revision DROP COLUMN ovalCount`,  
`
ALTER VIEW v_current_rev AS
select 
	rr.revId AS revId,
	rr.benchmarkId AS benchmarkId,
	rr.version AS version,
	rr.release AS \`release\`,
	rr.benchmarkDate AS benchmarkDate,
	rr.benchmarkDateSql AS benchmarkDateSql,
	rr.status AS status,
	rr.statusDate AS statusDate,
	rr.description AS description,
	rr.active AS active,
	rr.groupCount AS groupCount,
	rr.ruleCount AS ruleCount,
	rr.checkCount AS checkCount,
	rr.fixCount AS fixCount
 from (
 select 
	 r.revId AS revId,
	 r.benchmarkId AS benchmarkId,
	 r.version AS version,
	 r.release AS \`release\`,
	 r.benchmarkDate AS benchmarkDate,
	 r.benchmarkDateSql AS benchmarkDateSql,
	 r.status AS status,
	 r.statusDate AS statusDate,
	 r.description AS description,
	 r.active AS active,
	 r.groupCount AS groupCount,
	 r.ruleCount AS ruleCount,
	 r.checkCount AS checkCount,
	 r.fixCount AS fixCount,
	row_number() OVER (
		PARTITION BY r.benchmarkId 
        ORDER BY 
			FIELD(status, 'draft', 'accepted') desc,
			(r.version + 0) desc,
			(r.release + 0) desc )  AS rn 
    from 
		revision r) rr where (rr.rn = 1);

`,
`DROP TABLE IF EXISTS review_reject_string_map`,
`DROP TABLE IF EXISTS reject_string`,
`DROP TABLE IF EXISTS rev_xml_map`,  
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
 `,
 `ALTER TABLE current_rev ADD COLUMN ovalCount int`,
 `ALTER TABLE revision ADD COLUMN ovalCount int`,
 `
 ALTER VIEW v_current_rev AS
select 
	rr.revId AS revId,
	rr.benchmarkId AS benchmarkId,
	rr.version AS version,
	rr.release AS \`release\`,
	rr.benchmarkDate AS benchmarkDate,
	rr.benchmarkDateSql AS benchmarkDateSql,
	rr.status AS status,
	rr.statusDate AS statusDate,
	rr.description AS description,
	rr.active AS active,
	rr.groupCount AS groupCount,
	rr.ruleCount AS ruleCount,
	rr.checkCount AS checkCount,
	rr.fixCount AS fixCount
 from (
 select 
	 r.revId AS revId,
	 r.benchmarkId AS benchmarkId,
	 r.version AS version,
	 r.release AS \`release\`,
	 r.benchmarkDate AS benchmarkDate,
	 r.benchmarkDateSql AS benchmarkDateSql,
	 r.status AS status,
	 r.statusDate AS statusDate,
	 r.description AS description,
	 r.active AS active,
	 r.groupCount AS groupCount,
	 r.ruleCount AS ruleCount,
	 r.checkCount AS checkCount,
	 r.fixCount AS fixCount,
	 (select count(distinct ro.ruleId) from rule_oval_map ro where ro.ruleId IN (
     SELECT rgr.ruleId from rev_group_map rg inner join rev_group_rule_map rgr on rg.rgId = rgr.rgId WHERE rg.revId = r.revId)) AS ovalCount,   
	row_number() OVER (
		PARTITION BY r.benchmarkId 
        ORDER BY 
			FIELD(status, 'draft', 'accepted') desc,
			(r.version + 0) desc,
			(r.release + 0) desc )  AS rn 
    from 
		revision r) rr where (rr.rn = 1)
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
