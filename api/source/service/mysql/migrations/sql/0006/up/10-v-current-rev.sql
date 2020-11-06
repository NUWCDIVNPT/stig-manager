ALTER VIEW `v_current_rev` AS
select 
	`rr`.`revId` AS `revId`,
	`rr`.`benchmarkId` AS `benchmarkId`,
	`rr`.`version` AS `version`,
	`rr`.`release` AS `release`,
	`rr`.`benchmarkDate` AS `benchmarkDate`,
	`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,
	`rr`.`status` AS `status`,
	`rr`.`statusDate` AS `statusDate`,
	`rr`.`description` AS `description`,
	`rr`.`active` AS `active`,
	`rr`.`groupCount` AS `groupCount`,
	`rr`.`ruleCount` AS `ruleCount`,
	`rr`.`checkCount` AS `checkCount`,
	`rr`.`fixCount` AS `fixCount`,
	`rr`.`ovalCount` AS `ovalCount`
 from (
 select 
	 `r`.`revId` AS `revId`,
	 `r`.`benchmarkId` AS `benchmarkId`,
	 `r`.`version` AS `version`,
	 `r`.`release` AS `release`,
	 `r`.`benchmarkDate` AS `benchmarkDate`,
	 `r`.`benchmarkDateSql` AS `benchmarkDateSql`,
	 `r`.`status` AS `status`,
	 `r`.`statusDate` AS `statusDate`,
	 `r`.`description` AS `description`,
	 `r`.`active` AS `active`,
	 `r`.`groupCount` AS `groupCount`,
	 `r`.`ruleCount` AS `ruleCount`,
	 `r`.`checkCount` AS `checkCount`,
	 `r`.`fixCount` AS `fixCount`,
	 (select count(distinct `ro`.`ruleId`) from `rule_oval_map` `ro` where `ro`.`ruleId` IN (
     SELECT `rgr`.`ruleId` from `rev_group_map` `rg` inner join `rev_group_rule_map` `rgr` on `rg`.`rgId` = `rgr`.`rgId` WHERE `rg`.`revId` = `r`.`revId`)) AS `ovalCount`,
	row_number() OVER (
		PARTITION BY `r`.`benchmarkId` 
        ORDER BY 
			FIELD(status, 'draft', 'accepted') desc,
			(`r`.`version` + 0) desc,
			(`r`.`release` + 0) desc )  AS `rn` 
    from 
		`revision` `r`) `rr` where (`rr`.`rn` = 1);

DELETE from current_rev;
INSERT INTO current_rev (
      revId,
      benchmarkId,
      `version`, 
      `release`, 
      benchmarkDate,
      benchmarkDateSql,
      status,
      statusDate,
      description,
      active,
      groupCount,
      ruleCount,
      checkCount,
      fixCount,
      ovalCount)
      SELECT 
        revId,
        benchmarkId,
        `version`,
        `release`,
        benchmarkDate,
        benchmarkDateSql,
        status,
        statusDate,
        description,
        active,
        groupCount,
        ruleCount,
        checkCount,
        fixCount,
        ovalCount
      FROM
        v_current_rev;
DELETE FROM current_group_rule;
INSERT INTO current_group_rule (groupId, ruleId, benchmarkId)
      SELECT rg.groupId,
        rgr.ruleId,
        cr.benchmarkId
      from
        current_rev cr
        left join rev_group_map rg on rg.revId=cr.revId
        left join rev_group_rule_map rgr on rgr.rgId=rg.rgId
      order by
        rg.groupId,rgr.ruleId,cr.benchmarkId;
