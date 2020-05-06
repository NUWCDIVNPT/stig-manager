-- SQLines Data 3.1.777 x86_64 Linux - Database Migration Tool.
-- Copyright (c) 2018 SQLines. All Rights Reserved.

-- All DDL SQL statements executed for the target database

-- Current timestamp: 2020:05:05 20:51:20.675

drop schema `stigman`;
create schema `stigman`;

DROP TABLE IF EXISTS stigman.actions;

-- Ok (6 ms)

CREATE TABLE stigman.actions
(
   `actionId` DECIMAL(10,0) NOT NULL,
   `action` VARCHAR(45) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (56 ms)

DROP TABLE IF EXISTS stigman.activity_details;

-- Ok (3 ms)

DROP TABLE IF EXISTS stigman.activity;

-- Ok (2 ms)

DROP TABLE IF EXISTS stigman.artifacts;

-- Ok (1 ms)

CREATE TABLE stigman.activity_details
(
   `id` DECIMAL(10,0) NOT NULL,
   `activityId` DECIMAL(10,0) NOT NULL,
   `key` VARCHAR(255) NOT NULL,
   `value` VARCHAR(4000)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (66 ms)

CREATE TABLE stigman.activity
(
   `id` DECIMAL(10,0) NOT NULL,
   `user` VARCHAR(45) NOT NULL,
   `timestamp` DATETIME NOT NULL,
   `username` VARCHAR(45) NOT NULL,
   `script` LONGTEXT NOT NULL,
   `name` VARCHAR(45) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (56 ms)

DROP TABLE IF EXISTS stigman.artifact_blobs;

-- Ok (2 ms)

DROP TABLE IF EXISTS stigman.assets;

-- Ok (1 ms)

DROP TABLE IF EXISTS stigman.asset_groups;

-- Ok (1 ms)

CREATE TABLE stigman.artifacts
(
   `artId` DECIMAL(10,0) NOT NULL,
   `sha1` VARCHAR(45) NOT NULL,
   `filename` VARCHAR(255) NOT NULL,
   `description` VARCHAR(4000) NOT NULL,
   `userId` DECIMAL(10,0) NOT NULL,
   `ts` DATETIME NOT NULL,
   `dept` VARCHAR(45) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (64 ms)

DROP TABLE IF EXISTS stigman.asset_package_map;

-- Ok (2 ms)

CREATE TABLE stigman.artifact_blobs
(
   `sha1` VARCHAR(45) NOT NULL,
   `data` LONGBLOB NOT NULL,
   `ts` DATETIME,
   `userId` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (73 ms)

DROP TABLE IF EXISTS stigman.audits;

-- Ok (4 ms)

CREATE TABLE stigman.assets
(
   `assetId` DECIMAL(10,0) NOT NULL,
   `name` VARCHAR(45) NOT NULL,
   `profile` VARCHAR(45) NOT NULL,
   `domain` VARCHAR(45),
   `ip` VARCHAR(45),
   `dept` VARCHAR(45),
   `nonnetwork` CHAR(1),
   `scanexempt` CHAR(1)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (82 ms)

DROP TABLE IF EXISTS stigman.domain_dept_map;

-- Ok (5 ms)

CREATE TABLE stigman.asset_groups
(
   `groupId` VARCHAR(45) NOT NULL,
   `groupIame` VARCHAR(45)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (96 ms)

DROP TABLE IF EXISTS stigman.iacontrol_impact_map;

-- Ok (5 ms)

CREATE TABLE stigman.asset_package_map
(
   `apId` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0) NOT NULL,
   `packageId` DECIMAL(10,0) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (93 ms)

CREATE TABLE stigman.audits
(
   `id` DECIMAL(10,0) NOT NULL,
   `ts` DATETIME NOT NULL,
   `userId` DECIMAL(10,0) NOT NULL,
   `logtext` VARCHAR(255) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (76 ms)

DROP TABLE IF EXISTS stigman.imported_blobs;

-- Ok (3 ms)

DROP TABLE IF EXISTS stigman.imported_jobs;

-- Ok (2 ms)

CREATE TABLE stigman.domain_dept_map
(
   `ddId` DECIMAL(10,0) NOT NULL,
   `domain` VARCHAR(45),
   `dept` VARCHAR(45)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (73 ms)

DROP TABLE IF EXISTS stigman.imported_results;

-- Ok (1 ms)

CREATE TABLE stigman.iacontrol_impact_map
(
   `iacontrol` CHAR(6) NOT NULL,
   `impact` VARCHAR(4000)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (79 ms)

DROP TABLE IF EXISTS stigman.packages;

-- Ok (1 ms)

CREATE TABLE stigman.imported_blobs
(
   `sha1` VARCHAR(255) NOT NULL,
   `data` LONGBLOB
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (70 ms)

DROP TABLE IF EXISTS stigman.poam_rar_entries;

-- Ok (4 ms)

CREATE TABLE stigman.imported_jobs
(
   `jobId` DECIMAL(10,0) NOT NULL,
   `starttime` DATETIME,
   `userId` DECIMAL(10,0),
   `stigmanId` VARCHAR(45),
   `source` VARCHAR(45),
   `assetId` DECIMAL(10,0),
   `stigId` VARCHAR(255),
   `packageId` DECIMAL(10,0),
   `filename` VARCHAR(256),
   `filesize` DECIMAL(10,0),
   `modified` VARCHAR(255),
   `filemd` VARCHAR(50),
   `reporttext` LONGTEXT,
   `endtime` DATETIME
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (86 ms)

CREATE TABLE stigman.imported_results
(
   `importId` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0),
   `user` VARCHAR(50),
   `cn` VARCHAR(50),
   `assetId` DECIMAL(10,0),
   `asset` VARCHAR(50),
   `submittedAsset` VARCHAR(50),
   `stigTitle` VARCHAR(255),
   `submittedStigTitle` VARCHAR(255),
   `timestamp` DATETIME,
   `sha1` VARCHAR(255),
   `filename` VARCHAR(1024),
   `data` LONGBLOB,
   `accepted` INTEGER,
   `checksSubmitted` DECIMAL(10,0),
   `checksImported` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (68 ms)

DROP TABLE IF EXISTS stigman.reject_strings;

-- Ok (4 ms)

DROP TABLE IF EXISTS stigman.reviews;

-- Ok (4 ms)

CREATE TABLE stigman.packages
(
   `packageId` DECIMAL(10,0) NOT NULL,
   `name` VARCHAR(45) NOT NULL,
   `emassId` VARCHAR(45),
   `reqrar` INTEGER,
   `pocname` VARCHAR(50),
   `pocemail` VARCHAR(50),
   `pocphone` VARCHAR(50)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (81 ms)

DROP TABLE IF EXISTS stigman.reviews_history;

-- Ok (3 ms)

CREATE TABLE stigman.poam_rar_entries
(
   `preId` DECIMAL(10,0) NOT NULL,
   `packageId` DECIMAL(10,0) NOT NULL,
   `findingType` VARCHAR(50),
   `sourceId` VARCHAR(45) NOT NULL,
   `iacontrol` VARCHAR(45),
   `status` VARCHAR(45),
   `poc` VARCHAR(255),
   `resources` VARCHAR(255),
   `compdate` DATETIME,
   `milestone` LONGTEXT,
   `poamComment` LONGTEXT,
   `likelihood` VARCHAR(50),
   `mitdesc` LONGTEXT,
   `residualRisk` DECIMAL(10,0),
   `recCorrAct` LONGTEXT,
   `remdesc` LONGTEXT,
   `rarComment` LONGTEXT
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (81 ms)

DROP TABLE IF EXISTS stigman.review_artifact_map;

-- Ok (3 ms)

CREATE TABLE stigman.reject_strings
(
   `rejectId` DECIMAL(10,0) NOT NULL,
   `shortStr` VARCHAR(45) NOT NULL,
   `longStr` LONGTEXT
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (78 ms)

DROP TABLE IF EXISTS stigman.review_reject_string_map;

-- Ok (12 ms)

CREATE TABLE stigman.reviews
(
   `reviewId` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0),
   `ruleId` VARCHAR(45),
   `stateId` DECIMAL(10,0),
   `userId` DECIMAL(10,0),
   `stateComment` LONGTEXT,
   `actionId` DECIMAL(10,0),
   `actionComment` LONGTEXT,
   `reqdoc` INTEGER,
   `autostate` INTEGER,
   `ts` DATETIME NOT NULL,
   `rejecttext` LONGTEXT,
   `rejectUserId` DECIMAL(10,0),
   `statusId` DECIMAL(10,0) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (85 ms)

CREATE TABLE stigman.reviews_history
(
   `id` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0),
   `ruleId` VARCHAR(45),
   `activityType` VARCHAR(45),
   `columnname` VARCHAR(45),
   `oldValue` LONGTEXT,
   `newValue` LONGTEXT,
   `userId` DECIMAL(10,0),
   `ts` DATETIME
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (91 ms)

CREATE TABLE stigman.review_artifact_map
(
   `raId` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0) NOT NULL,
   `ruleId` VARCHAR(45) NOT NULL,
   `artId` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (83 ms)

DROP TABLE IF EXISTS stigman.roles;

-- Ok (1 ms)

DROP TABLE IF EXISTS stigman.states;

-- Ok (1 ms)

DROP TABLE IF EXISTS stigman.stats_asset_stig;

-- Ok (2 ms)

CREATE TABLE stigman.review_reject_string_map
(
   `rrsId` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0) NOT NULL,
   `ruleId` VARCHAR(45) NOT NULL,
   `rejectId` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (150 ms)

DROP TABLE IF EXISTS stigman.statuses;

-- Ok (4 ms)

CREATE TABLE stigman.roles
(
   `id` DECIMAL(10,0) NOT NULL,
   `role` VARCHAR(45),
   `roleDisplay` VARCHAR(45)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (103 ms)

DROP TABLE IF EXISTS stigman.stigman_ids;

-- Ok (4 ms)

CREATE TABLE stigman.states
(
   `stateId` DECIMAL(10,0) NOT NULL,
   `state` VARCHAR(45),
   `abbr` VARCHAR(3)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (128 ms)

DROP TABLE IF EXISTS stigman.stig_asset_map;

-- Ok (4 ms)

CREATE TABLE stigman.stats_asset_stig
(
   `id` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0),
   `stigId` VARCHAR(255),
   `minTs` DATETIME,
   `maxTs` DATETIME,
   `checksManual` DECIMAL(10,0),
   `checksScap` DECIMAL(10,0),
   `inprogressManual` DECIMAL(10,0),
   `inprogressScap` DECIMAL(10,0),
   `submittedManual` DECIMAL(10,0),
   `submittedScap` DECIMAL(10,0),
   `rejectedManual` DECIMAL(10,0),
   `rejectedScap` DECIMAL(10,0),
   `approvedManual` DECIMAL(10,0),
   `approvedScap` DECIMAL(10,0),
   `cat1Count` DECIMAL(10,0),
   `cat2Count` DECIMAL(10,0),
   `cat3Count` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (139 ms)

DROP TABLE IF EXISTS stigman.user_asset_map;

-- Ok (6 ms)

CREATE TABLE stigman.statuses
(
   `statusId` DECIMAL(10,0) NOT NULL,
   `statusStr` VARCHAR(45) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (102 ms)

DROP TABLE IF EXISTS stigman.user_data;

-- Ok (3 ms)

CREATE TABLE stigman.stigman_ids
(
   `guid` VARCHAR(45) NOT NULL,
   `cn` VARCHAR(45) NOT NULL,
   `lastuse` DECIMAL(10,0)
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (113 ms)

DROP TABLE IF EXISTS stigman.user_role_map;

-- Ok (4 ms)

CREATE TABLE stigman.stig_asset_map
(
   `saId` DECIMAL(10,0) NOT NULL,
   `stigId` VARCHAR(255) NOT NULL,
   `assetId` DECIMAL(10,0) NOT NULL,
   `disableImports` INTEGER NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (114 ms)

DROP TABLE IF EXISTS stigman.user_stig_asset_map;

-- Ok (5 ms)

CREATE TABLE stigman.user_asset_map
(
   `id` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0) NOT NULL,
   `assetId` DECIMAL(10,0) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (119 ms)

CREATE TABLE stigman.user_data
(
   `id` DECIMAL(10,0) NOT NULL,
   `cn` VARCHAR(255),
   `name` VARCHAR(255),
   `dept` VARCHAR(45),
   `roleId` DECIMAL(10,0),
   `canAdmin` INTEGER
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (94 ms)

CREATE TABLE stigman.user_role_map
(
   `id` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0) NOT NULL,
   `roleId` DECIMAL(10,0) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (102 ms)

CREATE TABLE stigman.user_stig_asset_map
(
   `id` DECIMAL(10,0) NOT NULL,
   `userId` DECIMAL(10,0) NOT NULL,
   `saId` DECIMAL(10,0) NOT NULL
)
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_bin;

-- Ok (146 ms)

ALTER TABLE stigman.imported_blobs ADD CONSTRAINT PRIMARY_14 PRIMARY KEY (`sha1`);

-- Ok (295 ms)

ALTER TABLE stigman.review_reject_string_map ADD CONSTRAINT PRIMARY_26 PRIMARY KEY (`rrsid`);

-- Ok (341 ms)

ALTER TABLE stigman.states ADD CONSTRAINT PRIMARY_30 PRIMARY KEY (`stateId`);

-- Ok (171 ms)

ALTER TABLE stigman.roles ADD CONSTRAINT PRIMARY_29 PRIMARY KEY (`id`);

-- Ok (374 ms)

ALTER TABLE stigman.user_role_map ADD CONSTRAINT PRIMARY_36 PRIMARY KEY (`id`);

-- Ok (271 ms)

ALTER TABLE stigman.assets ADD CONSTRAINT ASSETS_CHK_IP_NN CHECK ((ip IS NOT NULL AND nonnetwork=0) OR (ip IS NULL AND nonnetwork=1));

-- Ok (672 ms)

ALTER TABLE stigman.domain_dept_map ADD CONSTRAINT PRIMARY_11 PRIMARY KEY (`ddId`);

-- Ok (192 ms)

ALTER TABLE stigman.reviews ADD CONSTRAINT INDEX_2_1_1 UNIQUE (`assetId`, `ruleId`);

-- Ok (198 ms)

ALTER TABLE stigman.stig_asset_map ADD CONSTRAINT PRIMARY_38 PRIMARY KEY (`saId`);

-- Ok (49 ms)

ALTER TABLE stigman.asset_package_map ADD CONSTRAINT PRIMARY_8 PRIMARY KEY (`apId`);

-- Ok (57 ms)

ALTER TABLE stigman.statuses ADD CONSTRAINT PRIMARY_32 PRIMARY KEY (`statusId`);

-- Ok (45 ms)

ALTER TABLE stigman.stats_asset_stig ADD CONSTRAINT PRIMARY_31 PRIMARY KEY (`id`);

-- Ok (68 ms)

ALTER TABLE stigman.actions ADD CONSTRAINT PRIMARY_99 PRIMARY KEY (`actionId`);

-- Failed (0 ms)
-- You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'PRIMARY KEY (`ACTIONID`)' at line 1

ALTER TABLE stigman.reject_strings ADD CONSTRAINT PRIMARY_24 PRIMARY KEY (`rejectId`);

-- Ok (37 ms)

ALTER TABLE stigman.user_data ADD CONSTRAINT PRIMARY_35 PRIMARY KEY (`id`);

-- Ok (74 ms)

ALTER TABLE stigman.iacontrol_impact_map ADD CONSTRAINT PRIMARY_13 PRIMARY KEY (`iacontrol`);

-- Ok (64 ms)

ALTER TABLE stigman.review_artifact_map ADD CONSTRAINT PRIMARY_25 PRIMARY KEY (`raId`);

-- Ok (78 ms)

ALTER TABLE stigman.activity ADD CONSTRAINT PRIMARY_37 PRIMARY KEY (`id`);

-- Ok (48 ms)

ALTER TABLE stigman.artifact_blobs ADD CONSTRAINT PRIMARY_5 PRIMARY KEY (`sha1`);

-- Ok (91 ms)

ALTER TABLE stigman.activity_details ADD CONSTRAINT PRIMARY_4 PRIMARY KEY (`id`);

-- Ok (55 ms)

ALTER TABLE stigman.asset_groups ADD CONSTRAINT PRIMARY_7 PRIMARY KEY (`groupId`);

-- Ok (95 ms)

ALTER TABLE stigman.user_asset_map ADD CONSTRAINT PRIMARY_34 PRIMARY KEY (`id`);

-- Ok (77 ms)

ALTER TABLE stigman.assets ADD CONSTRAINT PRIMARY_9 PRIMARY KEY (`assetId`);

-- Ok (75 ms)

ALTER TABLE stigman.packages ADD CONSTRAINT PRIMARY_22 PRIMARY KEY (`packageid`);

-- Ok (49 ms)

ALTER TABLE stigman.poam_rar_entries ADD CONSTRAINT PRIMARY_23 PRIMARY KEY (`preId`);

-- Ok (77 ms)

ALTER TABLE stigman.artifacts ADD CONSTRAINT PRIMARY_6 PRIMARY KEY (`artId`);

-- Ok (55 ms)

ALTER TABLE stigman.user_stig_asset_map ADD CONSTRAINT PRIMARY_3 PRIMARY KEY (`id`);

-- Ok (120 ms)

ALTER TABLE stigman.reviews_history ADD CONSTRAINT PRIMARY_28 PRIMARY KEY (`id`);

-- Ok (120 ms)

ALTER TABLE stigman.imported_jobs ADD CONSTRAINT PRIMARY_15 PRIMARY KEY (`jobId`);

-- Ok (57 ms)

ALTER TABLE stigman.stigman_ids ADD CONSTRAINT PRIMARY_33 PRIMARY KEY (`guid`);

-- Ok (57 ms)

ALTER TABLE stigman.audits ADD CONSTRAINT PRIMARY_10 PRIMARY KEY (`id`);

-- Ok (61 ms)

CREATE INDEX INDEX_PROFILE ON stigman.assets (`profile`);

-- Ok (39 ms)

CREATE INDEX INDEX_4 ON stigman.reviews (`stateId`);

-- Ok (35 ms)

CREATE INDEX INDEX_ACTIVITYTYPE ON stigman.reviews_history (`activityType`);

-- Ok (34 ms)

CREATE INDEX DISABLEIMPORTS ON stigman.stig_asset_map (`disableImports`);

-- Ok (34 ms)

CREATE INDEX FK_STATS_ASSET_STIG_2 ON stigman.stats_asset_stig (`stigId`);

-- Ok (48 ms)

CREATE INDEX INDEX_3_2 ON stigman.user_stig_asset_map (`saId`);

-- Ok (39 ms)

CREATE INDEX INDEX_SHA1 ON stigman.artifacts (`sha1`);

-- Ok (47 ms)

CREATE INDEX INDEX_1 ON stigman.imported_results (`importId`);

-- Ok (34 ms)

CREATE INDEX FINDINGTYPE ON stigman.poam_rar_entries (`findingType`);

-- Ok (40 ms)

CREATE INDEX INDEX_2_1 ON stigman.review_artifact_map (`assetId`, `ruleId`);

-- Ok (33 ms)

CREATE INDEX INDEX_3_38 ON stigman.user_role_map (`roleId`, `userId`);

-- Ok (28 ms)

ALTER TABLE stigman.review_reject_string_map ADD CONSTRAINT INDEX2 UNIQUE (`assetId`, `ruleId`, `rejectId`);

-- Ok (23 ms)

ALTER TABLE stigman.reviews ADD CONSTRAINT PRIMARY_27 PRIMARY KEY (`reviewId`);

-- Ok (58 ms)

ALTER TABLE stigman.user_data ADD CONSTRAINT INDEX_CN UNIQUE (`cn`);

-- Ok (21 ms)

ALTER TABLE stigman.stats_asset_stig ADD CONSTRAINT INDEX_2_2_C UNIQUE (`assetId`, `stigId`);

-- Ok (61 ms)

ALTER TABLE stigman.stig_asset_map ADD CONSTRAINT INDEX_2_3_C UNIQUE (`stigId`, `assetId`);

-- Ok (74 ms)

ALTER TABLE stigman.assets ADD CONSTRAINT ASSETS_CHK_NN_SE CHECK ((nonnetwork = 0 and scanexempt in (0,1)) OR (nonnetwork=1 AND scanexempt=1));

-- Ok (115 ms)

ALTER TABLE stigman.user_data ADD CONSTRAINT INDEX_3_C UNIQUE (`name`);

-- Ok (31 ms)

ALTER TABLE stigman.user_stig_asset_map ADD CONSTRAINT INDEX_2_1_C UNIQUE (`userId`, `saId`);

-- Ok (30 ms)

ALTER TABLE stigman.user_asset_map ADD CONSTRAINT INDEX_2_38 UNIQUE (`userId`, `assetId`);

-- Ok (39 ms)

CREATE INDEX INDEX_3_1 ON stigman.asset_package_map (`packageId`);

-- Ok (19 ms)

CREATE INDEX INDEX_NONNETWORK ON stigman.assets (`nonnetwork`);

-- Ok (32 ms)

ALTER TABLE stigman.poam_rar_entries ADD CONSTRAINT PACKAGEID_RULEID UNIQUE (`packageId`, `sourceId`);

-- Ok (43 ms)

CREATE INDEX INDEX_3_3 ON stigman.reviews (`ruleId`);

-- Ok (39 ms)

CREATE INDEX INDEX_ASSETID ON stigman.reviews_history (`assetId`);

-- Ok (38 ms)

CREATE INDEX FK_STIGASSETMAP_1 ON stigman.stig_asset_map (`assetId`);

-- Ok (34 ms)

CREATE INDEX INDEX_3 ON stigman.review_artifact_map (`artId`);

-- Ok (37 ms)

ALTER TABLE stigman.asset_package_map ADD CONSTRAINT FK_ASSET_PACKAGE_MAP_1 FOREIGN KEY (packageId) REFERENCES packages (packageId);

-- Ok (19 ms)

CREATE INDEX INDEX_2 ON stigman.user_role_map (`USERID`);

-- Ok (40 ms)

ALTER TABLE stigman.review_artifact_map ADD CONSTRAINT FK_REVIEW_ARTIFACT_MAP_1 FOREIGN KEY (artid) REFERENCES artifacts (artId);

-- Ok (24 ms)

ALTER TABLE stigman.reviews ADD CONSTRAINT FK_REVIEWS_1 FOREIGN KEY (assetId) REFERENCES assets (assetId);

-- Ok (29 ms)

ALTER TABLE stigman.user_stig_asset_map ADD CONSTRAINT FK_USER_STIG_ASSET_MAP_1 FOREIGN KEY (userId) REFERENCES user_data (id);

-- Ok (16 ms)

ALTER TABLE stigman.user_role_map ADD CONSTRAINT FK_USER_ROLE_MAP_2 FOREIGN KEY (roleid) REFERENCES roles (id);

-- Ok (23 ms)

ALTER TABLE stigman.stats_asset_stig ADD CONSTRAINT FK_STATS_ASSET_STIG_1 FOREIGN KEY (assetId) REFERENCES assets (assetId);

-- Ok (47 ms)

ALTER TABLE stigman.stig_asset_map ADD CONSTRAINT FK_STIG_ASSET_MAP_1 FOREIGN KEY (assetId) REFERENCES assets (assetId);

-- Ok (45 ms)

ALTER TABLE stigman.assets ADD CONSTRAINT INDEX_NAME UNIQUE (`name`);

-- Failed (9 ms)
-- Deadlock found when trying to get lock; try restarting transaction

CREATE INDEX INDEX_2_2 ON stigman.asset_package_map (`assetId`);

-- Ok (12 ms)

ALTER TABLE stigman.user_stig_asset_map ADD CONSTRAINT FK_USER_STIG_ASSET_MAP_2 FOREIGN KEY (saId) REFERENCES stig_asset_map (saId);

-- Ok (23 ms)

CREATE INDEX INDEX_STATUSID ON stigman.reviews (`statusId`);

-- Ok (20 ms)

CREATE INDEX INDEX_COLUMNNAME ON stigman.reviews_history (`columnname`);

-- Ok (22 ms)

ALTER TABLE stigman.user_role_map ADD CONSTRAINT FK_USER_ROLE_MAP_1 FOREIGN KEY (userId) REFERENCES user_data (id);

-- Ok (14 ms)

ALTER TABLE stigman.asset_package_map ADD CONSTRAINT FK_ASSET_PACKAGE_MAP_2 FOREIGN KEY (assetId) REFERENCES assets (assetId);

-- Ok (22 ms)

CREATE INDEX INDEX_RULEID ON stigman.reviews_history (`ruleId`);

-- Ok (12 ms)

CREATE INDEX INDEX_SCANEXEMPT ON stigman.assets (`scanexempt`);

-- Ok (35 ms)

CREATE UNIQUE INDEX ASSET_PACKAGE_MAP_INDEX1 ON stigman.asset_package_map (`packageId`, `assetId`);

-- Ok (53 ms)

CREATE INDEX INDEX_DEPT ON stigman.assets (`dept`);

-- Ok (110 ms)