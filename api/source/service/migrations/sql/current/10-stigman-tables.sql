-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stigman
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_migrations`
--

DROP TABLE IF EXISTS `_migrations`;
CREATE TABLE `_migrations` (
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `name` varchar(128) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `asset`
--

DROP TABLE IF EXISTS `asset`;
CREATE TABLE `asset` (
  `assetId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `fqdn` varchar(255) DEFAULT NULL,
  `collectionId` int NOT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `mac` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `noncomputing` bit(1) NOT NULL DEFAULT b'0',
  `metadata` json NOT NULL,
  `state` enum('enabled','disabled') NOT NULL,
  `stateDate` datetime DEFAULT NULL,
  `stateUserId` int DEFAULT NULL,
  `isEnabled` tinyint GENERATED ALWAYS AS ((case when (`state` = _utf8mb4'enabled') then 1 else NULL end)) STORED,
  PRIMARY KEY (`assetId`),
  UNIQUE KEY `INDEX_NAME_COLLECTION_ENABLED` (`name`,`collectionId`,`isEnabled`),
  KEY `INDEX_COMPUTING` (`noncomputing`),
  KEY `INDEX_COLLECTIONID` (`collectionId`),
  KEY `idx_state` (`state`),
  CONSTRAINT `FK_ASSET_2` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `cci`
--

DROP TABLE IF EXISTS `cci`;
CREATE TABLE `cci` (
  `cci` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `publishdate` date NOT NULL,
  `contributor` varchar(255) NOT NULL,
  `type` varchar(20) NOT NULL,
  `definition` text NOT NULL,
  `apAcronym` varchar(20) DEFAULT NULL,
  `implementation` text,
  `assessmentProcedure` text,
  PRIMARY KEY (`cci`),
  KEY `ap` (`apAcronym`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `cci_reference_map`
--

DROP TABLE IF EXISTS `cci_reference_map`;
CREATE TABLE `cci_reference_map` (
  `cciRefId` int NOT NULL AUTO_INCREMENT,
  `cci` varchar(20) NOT NULL,
  `creator` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `version` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `indexDisa` varchar(255) NOT NULL,
  `textRefNist` varchar(255) NOT NULL,
  `parentControl` varchar(255) NOT NULL,
  PRIMARY KEY (`cciRefId`),
  KEY `cci` (`cci`),
  KEY `textRefNist` (`textRefNist`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `check_content`
--

DROP TABLE IF EXISTS `check_content`;
CREATE TABLE `check_content` (
  `ccId` int NOT NULL AUTO_INCREMENT,
  `digest` binary(32) GENERATED ALWAYS AS (unhex(sha2(`content`,256))) STORED,
  `content` text NOT NULL,
  PRIMARY KEY (`ccId`),
  UNIQUE KEY `digest_UNIQUE` (`digest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection`
--

DROP TABLE IF EXISTS `collection`;
CREATE TABLE `collection` (
  `collectionId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `settings` json NOT NULL,
  `metadata` json NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `state` enum('enabled','disabled','cloning') NOT NULL,
  `createdUserId` int DEFAULT NULL,
  `stateDate` datetime DEFAULT NULL,
  `stateUserId` int DEFAULT NULL,
  `isNameUnavailable` tinyint GENERATED ALWAYS AS ((case when ((`state` = _utf8mb4'cloning') or (`state` = _utf8mb4'enabled')) then 1 else NULL end)) VIRTUAL,
  `isEnabled` tinyint GENERATED ALWAYS AS ((case when (`state` = _utf8mb4'enabled') then 1 else NULL end)) STORED,
  PRIMARY KEY (`collectionId`),
  UNIQUE KEY `index2` (`name`,`isEnabled`),
  UNIQUE KEY `index3` (`name`,`isNameUnavailable`),
  KEY `idx_state` (`state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_grant`
--

DROP TABLE IF EXISTS `collection_grant`;
CREATE TABLE `collection_grant` (
  `grantId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `userId` int DEFAULT NULL,
  `userGroupId` int DEFAULT NULL,
  `roleId` int NOT NULL,
  PRIMARY KEY (`grantId`),
  UNIQUE KEY `INDEX_USER` (`userId`,`collectionId`),
  UNIQUE KEY `INDEX_USER_GROUP` (`userGroupId`,`collectionId`),
  KEY `INDEX_COLLECTION` (`collectionId`,`roleId`),
  CONSTRAINT `fk_collection_grant_1` FOREIGN KEY (`userId`) REFERENCES `user_data` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_2` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_3` FOREIGN KEY (`userGroupId`) REFERENCES `user_group` (`userGroupId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_grant_acl`
--

DROP TABLE IF EXISTS `collection_grant_acl`;
CREATE TABLE `collection_grant_acl` (
  `cgAclId` int NOT NULL AUTO_INCREMENT,
  `grantId` int NOT NULL,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs DEFAULT NULL,
  `assetId` int DEFAULT NULL,
  `clId` int DEFAULT NULL,
  `access` enum('none','r','rw') NOT NULL,
  `modifiedUserId` int DEFAULT NULL,
  `modifiedDate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`cgAclId`),
  KEY `fk_collection_grant_acl_1` (`grantId`),
  KEY `fk_collection_grant_acl_2` (`assetId`,`benchmarkId`),
  KEY `fk_collection_grant_acl_3` (`benchmarkId`,`assetId`),
  KEY `fk_collection_grant_acl_4` (`clId`,`benchmarkId`),
  CONSTRAINT `fk_collection_grant_acl_1` FOREIGN KEY (`grantId`) REFERENCES `collection_grant` (`grantId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_acl_2` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_acl_3` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_acl_4` FOREIGN KEY (`clId`) REFERENCES `collection_label` (`clId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_acl_5` FOREIGN KEY (`benchmarkId`, `assetId`) REFERENCES `stig_asset_map` (`benchmarkId`, `assetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_label`
--

DROP TABLE IF EXISTS `collection_label`;
CREATE TABLE `collection_label` (
  `clId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `name` varchar(36) NOT NULL,
  `description` varchar(45) DEFAULT NULL,
  `color` varchar(6) NOT NULL,
  `uuid` binary(16) NOT NULL,
  PRIMARY KEY (`clId`),
  UNIQUE KEY `colname` (`collectionId`,`name`),
  KEY `index4` (`uuid`),
  CONSTRAINT `fk_collection_label_1` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_label_asset_map`
--

DROP TABLE IF EXISTS `collection_label_asset_map`;
CREATE TABLE `collection_label_asset_map` (
  `claId` int NOT NULL AUTO_INCREMENT,
  `assetId` int NOT NULL,
  `clId` int NOT NULL,
  PRIMARY KEY (`claId`),
  UNIQUE KEY `index4` (`assetId`,`clId`),
  KEY `fk_collection_label_asset_map_2` (`clId`),
  CONSTRAINT `fk_collection_label_asset_map_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_label_asset_map_2` FOREIGN KEY (`clId`) REFERENCES `collection_label` (`clId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_rev_map`
--

DROP TABLE IF EXISTS `collection_rev_map`;
CREATE TABLE `collection_rev_map` (
  `crId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs DEFAULT NULL,
  `revId` varchar(255) NOT NULL,
  PRIMARY KEY (`crId`),
  UNIQUE KEY `index_collection_benchmark` (`collectionId`,`benchmarkId`),
  KEY `index_revId` (`revId`),
  CONSTRAINT `fk_collection_rev_map_1` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
CREATE TABLE `config` (
  `key` varchar(45) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `current_rev`
--

DROP TABLE IF EXISTS `current_rev`;
CREATE TABLE `current_rev` (
  `revId` varchar(255) NOT NULL,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs DEFAULT NULL,
  `version` int NOT NULL,
  `release` varchar(45) NOT NULL,
  `benchmarkDate` varchar(45) DEFAULT NULL,
  `benchmarkDateSql` date DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `statusDate` varchar(45) DEFAULT NULL,
  `marking` varchar(10) DEFAULT NULL,
  `description` varchar(4000) DEFAULT NULL,
  `active` tinyint DEFAULT NULL,
  `groupCount` int NOT NULL DEFAULT '0',
  `ruleCount` int GENERATED ALWAYS AS (((`highCount` + `mediumCount`) + `lowCount`)) STORED,
  `checkCount` int NOT NULL DEFAULT '0',
  `fixCount` int NOT NULL DEFAULT '0',
  `lowCount` int NOT NULL DEFAULT '0',
  `mediumCount` int NOT NULL DEFAULT '0',
  `highCount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`revId`),
  UNIQUE KEY `index2` (`benchmarkId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `default_rev`
--

DROP TABLE IF EXISTS `default_rev`;
CREATE TABLE `default_rev` (
  `vdId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
  `revId` varchar(255) NOT NULL,
  `revisionPinned` tinyint NOT NULL,
  PRIMARY KEY (`vdId`),
  UNIQUE KEY `index2` (`collectionId`,`benchmarkId`),
  KEY `index3` (`benchmarkId`),
  KEY `index4` (`revId`),
  CONSTRAINT `fk_default_rev_2` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Temporary view structure for view `enabled_asset`
--

DROP TABLE IF EXISTS `enabled_asset`;
/*!50001 DROP VIEW IF EXISTS `enabled_asset`*/;
/*!50001 CREATE VIEW `enabled_asset` AS SELECT 
 1 AS `assetId`,
 1 AS `name`,
 1 AS `fqdn`,
 1 AS `collectionId`,
 1 AS `ip`,
 1 AS `mac`,
 1 AS `description`,
 1 AS `noncomputing`,
 1 AS `metadata`,
 1 AS `state`,
 1 AS `stateDate`,
 1 AS `stateUserId`,
 1 AS `isEnabled`*/;

--
-- Temporary view structure for view `enabled_collection`
--

DROP TABLE IF EXISTS `enabled_collection`;
/*!50001 DROP VIEW IF EXISTS `enabled_collection`*/;
/*!50001 CREATE VIEW `enabled_collection` AS SELECT 
 1 AS `collectionId`,
 1 AS `name`,
 1 AS `description`,
 1 AS `settings`,
 1 AS `metadata`,
 1 AS `created`,
 1 AS `state`,
 1 AS `createdUserId`,
 1 AS `stateDate`,
 1 AS `stateUserId`,
 1 AS `isNameUnavailable`,
 1 AS `isEnabled`*/;

--
-- Table structure for table `fix_text`
--

DROP TABLE IF EXISTS `fix_text`;
CREATE TABLE `fix_text` (
  `ftId` int NOT NULL AUTO_INCREMENT,
  `digest` binary(32) GENERATED ALWAYS AS (unhex(sha2(`text`,256))) STORED,
  `text` text NOT NULL,
  PRIMARY KEY (`ftId`),
  UNIQUE KEY `digest_UNIQUE` (`digest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `job`
--

DROP TABLE IF EXISTS `job`;
CREATE TABLE `job` (
  `jobId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdBy` int DEFAULT NULL,
  `updatedBy` int DEFAULT NULL,
  `created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated` timestamp(3) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`jobId`),
  UNIQUE KEY `idx_job_name` (`name`),
  KEY `fk_job_updatedBy` (`updatedBy`),
  KEY `fk_job_createdBy` (`createdBy`),
  CONSTRAINT `fk_job_createdBy` FOREIGN KEY (`createdBy`) REFERENCES `user_data` (`userId`) ON DELETE RESTRICT,
  CONSTRAINT `fk_job_updatedBy` FOREIGN KEY (`updatedBy`) REFERENCES `user_data` (`userId`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `job_run`
--

DROP TABLE IF EXISTS `job_run`;
CREATE TABLE `job_run` (
  `jrId` int NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `runId` binary(16) NOT NULL,
  `state` varchar(255) DEFAULT NULL,
  `created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`jrId`),
  KEY `idx_job_run_runId` (`runId`),
  KEY `fk_job_run_jobId` (`jobId`),
  CONSTRAINT `fk_job_run_jobId` FOREIGN KEY (`jobId`) REFERENCES `job` (`jobId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `job_task_map`
--

DROP TABLE IF EXISTS `job_task_map`;
CREATE TABLE `job_task_map` (
  `jtId` int NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `taskId` int NOT NULL,
  `created` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`jtId`),
  KEY `fk_job_task_jobId` (`jobId`),
  KEY `fk_job_task_taskId` (`taskId`),
  CONSTRAINT `fk_job_task_jobId` FOREIGN KEY (`jobId`) REFERENCES `job` (`jobId`) ON DELETE CASCADE,
  CONSTRAINT `fk_job_task_taskId` FOREIGN KEY (`taskId`) REFERENCES `task` (`taskId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `result`
--

DROP TABLE IF EXISTS `result`;
CREATE TABLE `result` (
  `resultId` int NOT NULL AUTO_INCREMENT,
  `api` varchar(32) NOT NULL,
  `ckl` varchar(32) NOT NULL,
  `cklb` varchar(32) NOT NULL,
  `abbr` varchar(2) NOT NULL,
  `en` varchar(64) NOT NULL,
  PRIMARY KEY (`resultId`),
  UNIQUE KEY `RESULT_API` (`api`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `rev_group_rule_cci_map`
--

DROP TABLE IF EXISTS `rev_group_rule_cci_map`;
CREATE TABLE `rev_group_rule_cci_map` (
  `rgrccId` int NOT NULL AUTO_INCREMENT,
  `rgrId` int NOT NULL,
  `cci` varchar(20) NOT NULL,
  PRIMARY KEY (`rgrccId`),
  UNIQUE KEY `index2` (`rgrId`,`cci`),
  KEY `index3` (`cci`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `rev_group_rule_map`
--

DROP TABLE IF EXISTS `rev_group_rule_map`;
CREATE TABLE `rev_group_rule_map` (
  `rgrId` int NOT NULL AUTO_INCREMENT,
  `revId` varchar(255) DEFAULT NULL,
  `groupId` varchar(45) DEFAULT NULL,
  `groupTitle` varchar(255) DEFAULT NULL,
  `groupSeverity` varchar(45) DEFAULT NULL,
  `ruleId` varchar(255) DEFAULT NULL,
  `version` varchar(45) DEFAULT NULL,
  `title` varchar(1000) DEFAULT NULL,
  `severity` varchar(45) DEFAULT NULL,
  `weight` varchar(45) DEFAULT NULL,
  `vulnDiscussion` text,
  `falsePositives` text,
  `falseNegatives` text,
  `documentable` varchar(45) DEFAULT NULL,
  `mitigations` text,
  `severityOverrideGuidance` text,
  `potentialImpacts` text,
  `thirdPartyTools` text,
  `mitigationControl` text,
  `responsibility` varchar(255) DEFAULT NULL,
  `iaControls` varchar(255) DEFAULT NULL,
  `checkSystem` varchar(255) DEFAULT NULL,
  `checkDigest` binary(32) DEFAULT NULL,
  `fixref` varchar(255) DEFAULT NULL,
  `fixDigest` binary(32) DEFAULT NULL,
  PRIMARY KEY (`rgrId`),
  UNIQUE KEY `rev_group_rule_UNIQUE` (`revId`,`groupId`,`ruleId`),
  KEY `idx_rgrm_ruleId` (`ruleId`),
  KEY `index5` (`fixDigest`),
  KEY `idx_version_check_digest` (`version`,`checkDigest`),
  CONSTRAINT `fk_rev_group_rule_map_1` FOREIGN KEY (`revId`) REFERENCES `revision` (`revId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
  `reviewId` int NOT NULL AUTO_INCREMENT,
  `assetId` int DEFAULT NULL,
  `ruleId` varchar(45) DEFAULT NULL,
  `resultId` int DEFAULT NULL,
  `detail` mediumtext,
  `comment` mediumtext,
  `autoResult` bit(1) DEFAULT b'0',
  `ts` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  `statusId` int NOT NULL,
  `statusText` varchar(512) DEFAULT NULL,
  `statusUserId` int DEFAULT NULL,
  `statusTs` datetime DEFAULT NULL,
  `metadata` json NOT NULL DEFAULT (json_object()),
  `touchTs` datetime GENERATED ALWAYS AS (greatest(`ts`,`statusTs`)) STORED,
  `resultEngine` json DEFAULT NULL,
  `reProduct` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.product'))) VIRTUAL,
  `reType` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.type'))) VIRTUAL,
  `reAuthority` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.overrides[0].authority'))) VIRTUAL,
  `version` varchar(45) NOT NULL,
  `checkDigest` binary(32) NOT NULL,
  PRIMARY KEY (`reviewId`),
  KEY `INDEX_RESULTID` (`resultId`),
  KEY `INDEX_RULEID` (`ruleId`),
  KEY `INDEX_STATUSID` (`statusId`),
  KEY `idx_vcd` (`version`,`checkDigest`),
  KEY `idx_asset_vcd` (`assetId`,`version`,`checkDigest`),
  KEY `idx_reProduct` (`reProduct`),
  KEY `idx_reType` (`reType`),
  KEY `idx_reAuthority` (`reAuthority`),
  CONSTRAINT `FK_REVIEWS_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `review_history`
--

DROP TABLE IF EXISTS `review_history`;
CREATE TABLE `review_history` (
  `historyId` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reviewId` int NOT NULL,
  `resultId` int NOT NULL,
  `detail` mediumtext,
  `comment` mediumtext,
  `autoResult` bit(1) DEFAULT NULL,
  `ts` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  `statusId` int NOT NULL,
  `statusText` varchar(512) DEFAULT NULL,
  `statusUserId` int DEFAULT NULL,
  `statusTs` datetime DEFAULT NULL,
  `touchTs` datetime DEFAULT NULL,
  `resultEngine` json DEFAULT NULL,
  `reProduct` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.product'))) VIRTUAL,
  `reType` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.type'))) VIRTUAL,
  `reAuthority` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`resultEngine`,_utf8mb4'$.overrides[0].authority'))) VIRTUAL,
  `ruleId` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`historyId`),
  KEY `index_reviewId` (`reviewId`),
  KEY `idx_reProduct` (`reProduct`),
  KEY `idx_reType` (`reType`),
  KEY `idx_reAuthority` (`reAuthority`),
  CONSTRAINT `fk_review_history_1` FOREIGN KEY (`reviewId`) REFERENCES `review` (`reviewId`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `revision`
--

DROP TABLE IF EXISTS `revision`;
CREATE TABLE `revision` (
  `revId` varchar(255) NOT NULL,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs DEFAULT NULL,
  `version` int NOT NULL,
  `release` varchar(45) NOT NULL,
  `revisionStr` varchar(45) GENERATED ALWAYS AS (concat(_utf8mb4'V',`version`,_utf8mb4'R',`release`)) VIRTUAL,
  `benchmarkDate` varchar(45) DEFAULT NULL,
  `benchmarkDateSql` date DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `statusDate` varchar(45) DEFAULT NULL,
  `marking` varchar(10) DEFAULT NULL,
  `description` varchar(4000) DEFAULT NULL,
  `active` tinyint DEFAULT '1',
  `groupCount` int NOT NULL DEFAULT '0',
  `ruleCount` int GENERATED ALWAYS AS (((`highCount` + `mediumCount`) + `lowCount`)) STORED,
  `checkCount` int NOT NULL DEFAULT '0',
  `fixCount` int NOT NULL DEFAULT '0',
  `lowCount` int NOT NULL DEFAULT '0',
  `mediumCount` int NOT NULL DEFAULT '0',
  `highCount` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`revId`),
  UNIQUE KEY `uidx_revision_benchmarkId_version_release` (`benchmarkId`,`version`,`release`),
  KEY `idx_revision_benchmark_revisionStr` (`benchmarkId`,`revisionStr`),
  CONSTRAINT `FK_REVISION_1` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `rule_version_check_digest`
--

DROP TABLE IF EXISTS `rule_version_check_digest`;
CREATE TABLE `rule_version_check_digest` (
  `ruleId` varchar(255) NOT NULL,
  `version` varchar(45) NOT NULL,
  `checkDigest` binary(32) NOT NULL,
  PRIMARY KEY (`ruleId`),
  KEY `index_vcd` (`version`,`checkDigest`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `severity_cat_map`
--

DROP TABLE IF EXISTS `severity_cat_map`;
CREATE TABLE `severity_cat_map` (
  `id` int NOT NULL AUTO_INCREMENT,
  `severity` varchar(45) NOT NULL,
  `cat` int NOT NULL,
  `roman` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scm_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `statusId` int NOT NULL,
  `api` varchar(16) NOT NULL,
  `en` varchar(16) NOT NULL,
  PRIMARY KEY (`statusId`),
  UNIQUE KEY `IDX_API` (`api`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `stig`
--

DROP TABLE IF EXISTS `stig`;
CREATE TABLE `stig` (
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NOT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`benchmarkId`),
  KEY `idx_benchmark_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `stig_asset_map`
--

DROP TABLE IF EXISTS `stig_asset_map`;
CREATE TABLE `stig_asset_map` (
  `saId` int NOT NULL AUTO_INCREMENT,
  `benchmarkId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs DEFAULT NULL,
  `assetId` int NOT NULL,
  `userIds` json DEFAULT NULL,
  `minTs` datetime DEFAULT NULL,
  `maxTs` datetime DEFAULT NULL,
  `saved` int DEFAULT NULL,
  `savedResultEngine` int DEFAULT NULL,
  `submitted` int DEFAULT NULL,
  `submittedResultEngine` int DEFAULT NULL,
  `rejected` int DEFAULT NULL,
  `rejectedResultEngine` int DEFAULT NULL,
  `accepted` int DEFAULT NULL,
  `acceptedResultEngine` int DEFAULT NULL,
  `highCount` int DEFAULT NULL,
  `mediumCount` int DEFAULT NULL,
  `lowCount` int DEFAULT NULL,
  `notchecked` int DEFAULT NULL,
  `notcheckedResultEngine` int DEFAULT NULL,
  `notapplicable` int DEFAULT NULL,
  `notapplicableResultEngine` int DEFAULT NULL,
  `pass` int DEFAULT NULL,
  `passResultEngine` int DEFAULT NULL,
  `fail` int DEFAULT NULL,
  `failResultEngine` int DEFAULT NULL,
  `unknown` int DEFAULT NULL,
  `unknownResultEngine` int DEFAULT NULL,
  `error` int DEFAULT NULL,
  `errorResultEngine` int DEFAULT NULL,
  `notselected` int DEFAULT NULL,
  `notselectedResultEngine` int DEFAULT NULL,
  `informational` int DEFAULT NULL,
  `informationalResultEngine` int DEFAULT NULL,
  `fixed` int DEFAULT NULL,
  `fixedResultEngine` int DEFAULT NULL,
  `maxTouchTs` datetime DEFAULT NULL,
  `assessedHighCount` int DEFAULT NULL,
  `assessedMediumCount` int DEFAULT NULL,
  `assessedLowCount` int DEFAULT NULL,
  PRIMARY KEY (`saId`),
  UNIQUE KEY `IDX_BAID` (`benchmarkId`,`assetId`),
  KEY `IDX_ASSETID` (`assetId`),
  CONSTRAINT `FK_STIG_ASSET_MAP_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_STIG_ASSET_MAP_2` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
CREATE TABLE `task` (
  `taskId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `command` varchar(255) NOT NULL,
  PRIMARY KEY (`taskId`),
  UNIQUE KEY `idx_task_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `task_output`
--

DROP TABLE IF EXISTS `task_output`;
CREATE TABLE `task_output` (
  `seq` int NOT NULL AUTO_INCREMENT,
  `ts` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `runId` binary(16) DEFAULT NULL,
  `taskId` int DEFAULT NULL,
  `type` varchar(45) NOT NULL,
  `message` varchar(255) NOT NULL,
  PRIMARY KEY (`seq`),
  KEY `fk_task_output_runId` (`runId`),
  KEY `fk_task_output_taskId` (`taskId`),
  CONSTRAINT `fk_task_output_runId` FOREIGN KEY (`runId`) REFERENCES `job_run` (`runId`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_output_taskId` FOREIGN KEY (`taskId`) REFERENCES `task` (`taskId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `user_data`
--

DROP TABLE IF EXISTS `user_data`;
CREATE TABLE `user_data` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastAccess` int DEFAULT NULL,
  `lastClaims` json DEFAULT (_utf8mb4'{}'),
  `status` enum('available','unavailable') NOT NULL DEFAULT 'available',
  `statusDate` datetime NOT NULL DEFAULT (`created`),
  `statusUser` int DEFAULT NULL,
  `webPreferences` json NOT NULL DEFAULT (_utf8mb4'{"darkMode": true, "lastWhatsNew": "2000-01-01"}'),
  PRIMARY KEY (`userId`),
  UNIQUE KEY `INDEX_username` (`username`),
  KEY `INDEX_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `user_group`
--

DROP TABLE IF EXISTS `user_group`;
CREATE TABLE `user_group` (
  `userGroupId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdUserId` int NOT NULL,
  `createdDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `modifiedUserId` int NOT NULL,
  `modifiedDate` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`userGroupId`),
  UNIQUE KEY `idx_name` (`name`),
  KEY `fk_user_group_1_idx` (`createdUserId`),
  KEY `fk_user_group_2_idx` (`modifiedUserId`),
  CONSTRAINT `fk_user_group_1` FOREIGN KEY (`createdUserId`) REFERENCES `user_data` (`userId`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_group_2` FOREIGN KEY (`modifiedUserId`) REFERENCES `user_data` (`userId`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `user_group_user_map`
--

DROP TABLE IF EXISTS `user_group_user_map`;
CREATE TABLE `user_group_user_map` (
  `ugumId` int NOT NULL AUTO_INCREMENT,
  `userGroupId` int NOT NULL,
  `userId` int NOT NULL,
  PRIMARY KEY (`ugumId`),
  UNIQUE KEY `INDEX_UG_USER` (`userGroupId`,`userId`),
  KEY `fk_user_group_map_2_idx` (`userId`),
  CONSTRAINT `fk_user_group_map_1` FOREIGN KEY (`userGroupId`) REFERENCES `user_group` (`userGroupId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_group_map_2` FOREIGN KEY (`userId`) REFERENCES `user_data` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Temporary view structure for view `v_current_rev`
--

DROP TABLE IF EXISTS `v_current_rev`;
/*!50001 DROP VIEW IF EXISTS `v_current_rev`*/;
/*!50001 CREATE VIEW `v_current_rev` AS SELECT 
 1 AS `revId`,
 1 AS `benchmarkId`,
 1 AS `version`,
 1 AS `release`,
 1 AS `benchmarkDate`,
 1 AS `benchmarkDateSql`,
 1 AS `status`,
 1 AS `statusDate`,
 1 AS `marking`,
 1 AS `description`,
 1 AS `active`,
 1 AS `groupCount`,
 1 AS `ruleCount`,
 1 AS `lowCount`,
 1 AS `mediumCount`,
 1 AS `highCount`,
 1 AS `checkCount`,
 1 AS `fixCount`*/;

--
-- Temporary view structure for view `v_default_rev`
--

DROP TABLE IF EXISTS `v_default_rev`;
/*!50001 DROP VIEW IF EXISTS `v_default_rev`*/;
/*!50001 CREATE VIEW `v_default_rev` AS SELECT 
 1 AS `collectionId`,
 1 AS `benchmarkId`,
 1 AS `revId`,
 1 AS `revisionPinned`*/;

--
-- Temporary view structure for view `v_latest_rev`
--

DROP TABLE IF EXISTS `v_latest_rev`;
/*!50001 DROP VIEW IF EXISTS `v_latest_rev`*/;
/*!50001 CREATE VIEW `v_latest_rev` AS SELECT 
 1 AS `revId`,
 1 AS `benchmarkId`,
 1 AS `revisionStr`*/;

--
-- Dumping events for database 'stigman'
--
/*!50106 SET @save_time_zone= @@TIME_ZONE */ ;
/*!50106 DROP EVENT IF EXISTS `job-1-stigman` */;
DELIMITER $
/*!50003 SET @saved_col_connection = @@collation_connection */ $
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ $
/*!50003 SET @saved_sql_mode       = @@sql_mode */ $
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ $
/*!50003 SET @saved_time_zone      = @@time_zone */ $
/*!50003 SET time_zone             = 'SYSTEM' */ $
/*!50106 CREATE*/ /*!50117 */ /*!50106 EVENT `job-1-stigman` ON SCHEDULE EVERY 1 DAY STARTS '2025-10-01 00:00:00' ON COMPLETION NOT PRESERVE DISABLE DO CALL run_job(1, NULL) */ $
/*!50003 SET time_zone             = @saved_time_zone */ $
/*!50003 SET sql_mode              = @saved_sql_mode */ $
/*!50003 SET collation_connection  = @saved_col_connection */ $
DELIMITER ;
/*!50106 SET TIME_ZONE= @save_time_zone */ ;

--
-- Dumping routines for database 'stigman'
--
/*!50003 DROP PROCEDURE IF EXISTS `analyze_tables` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `analyze_tables`(IN in_tables JSON)
BEGIN
          DECLARE v_runId BINARY(16) DEFAULT NULL;
          DECLARE v_taskId INT DEFAULT NULL;
          DECLARE v_itemCount INT;
          DECLARE v_currentCount INT;
          DECLARE v_table VARCHAR(255);

          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
            DECLARE err_code INT;
            DECLARE err_msg TEXT;
            GET STACKED DIAGNOSTICS CONDITION 1
              err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
              IF err_msg = NULL THEN 
          SET err_msg = '';
              END IF;
            CALL task_output(v_runId, v_taskId, 'error',concat('code: ', err_code, ' message: ', err_msg));
            RESIGNAL;
          END;
          
          CALL get_runtime(v_runId, v_taskId);
        CALL task_output (v_runId, v_taskId, 'info', 'task started');

        select JSON_LENGTH(in_tables) INTO v_itemCount;
        SET v_currentCount = 0;
        WHILE v_currentCount < v_itemCount DO
          SET v_table = json_unquote(json_extract(in_tables, concat('$[', v_currentCount, ']')));
          CALL task_output (v_runId, v_taskId, 'info', concat('analyze table: ', v_table));
          SET @sql = CONCAT('ANALYZE TABLE ', v_table);
          PREPARE stmt_analyze_tables FROM @sql;
          EXECUTE stmt_analyze_tables;
          DEALLOCATE PREPARE stmt_analyze_tables;
          SET v_currentCount = v_currentCount + 1;
        END WHILE;
        CALL task_output (v_runId, v_taskId, 'info', 'task finished');

    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_disabled` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `delete_disabled`()
BEGIN
    DECLARE v_incrementValue INT DEFAULT 10000;
    DECLARE v_curMinId BIGINT DEFAULT 1;
    DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;
    DECLARE v_numCollectionIds INT;
    DECLARE v_numAssetIds INT;
    DECLARE v_numReviewIds INT;
    DECLARE v_numHistoryIds INT;
    DECLARE v_runId BINARY(16);
    DECLARE v_taskId INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE err_code INT;
      DECLARE err_msg TEXT;
      GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
      CALL task_output(v_runId, v_taskId, 'error', concat('code: ', err_code, ' message: ', err_msg));
      RESIGNAL;
    END;

    -- Set v_runId from t_runtime if table exists, else generate a new UUID
    CALL get_runtime(v_runId, v_taskId);
    CALL task_output (v_runId, v_taskId, 'info','task started');

    drop temporary table if exists t_collectionIds;
    create temporary table t_collectionIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select collectionId from collection where isEnabled is null;
    select max(seq) into v_numCollectionIds from t_collectionIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numCollectionIds, 0), ' collections to delete'));

    drop temporary table if exists t_assetIds;
    create temporary table t_assetIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select assetId from asset where isEnabled is null or collectionId in (select collectionId from t_collectionIds);
    select max(seq) into v_numAssetIds from t_assetIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numAssetIds, 0), ' assets to delete'));

    drop temporary table if exists t_reviewIds;
    create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select reviewId from review where assetId in (select assetId from t_assetIds);
    select max(seq) into v_numReviewIds from t_reviewIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numReviewIds, 0), ' reviews to delete'));

    drop temporary table if exists t_historyIds;
    create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
    select max(seq) into v_numHistoryIds from t_historyIds;
    CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numHistoryIds, 0), ' history records to delete'));

    IF v_numHistoryIds > 0 THEN
    CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numHistoryIds, ' history records'));
    REPEAT
      delete from review_history where historyId IN (
          select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
        );
      SET v_curMinId = v_curMinId + v_incrementValue;
      SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_historyIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numReviewIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numReviewIds, ' reviews'));
      REPEAT
        delete from review where reviewId IN (
            select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_reviewIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numAssetIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numAssetIds, ' assets'));
      REPEAT
        delete from asset where assetId IN (
            select assetId from t_assetIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_assetIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numCollectionIds > 0 THEN
      CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numCollectionIds, ' collections'));
      REPEAT
        delete from collection where collectionId IN (
            select collectionId from t_collectionIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_collectionIds;

    CALL task_output (v_runId, v_taskId, 'info', 'task finished');
    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_unmapped` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `delete_unmapped`(IN in_context VARCHAR(255))
BEGIN
      DECLARE v_runId BINARY(16);
      DECLARE v_taskId INT;
      DECLARE v_numReviewIds INT;
      DECLARE v_numHistoryIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET STACKED DIAGNOSTICS CONDITION 1
          err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output(v_runId, v_taskId, 'error',concat('code: ', err_code, ' message: ', err_msg));
        RESIGNAL;
      END;

      -- Set v_runId from t_runtime if table exists, else generate a new UUID
      CALL get_runtime(v_runId, v_taskId);
      CALL task_output (v_runId, v_taskId, 'info', 'task started');

      drop temporary table if exists t_reviewIds;
      create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);
      -- Context-specific logic
      IF in_context = 'system' THEN
        INSERT into t_reviewIds (reviewId)
        select r.reviewId from review r
        left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
        where rgr.rgrId is null;
      ELSEIF in_context = 'asset' THEN
        INSERT into t_reviewIds (reviewId)
        select
          r.reviewId
        from
          review r
          left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
          left join revision on (rgr.revId = revision.revId)
          left join stig_asset_map sa on (r.assetId = sa.assetId and revision.benchmarkId = sa.benchmarkId)
        group by
          r.reviewId
        having
          count(sa.saId) = 0;
      END IF;

      select max(seq) into v_numReviewIds from t_reviewIds;
      CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numReviewIds, 0), ' reviews to delete'));

      IF v_numReviewIds > 0 THEN
        drop temporary table if exists t_historyIds;
        create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
          select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
        select max(seq) into v_numHistoryIds from t_historyIds;
        CALL task_output (v_runId, v_taskId, 'info', concat('found ', ifnull(v_numHistoryIds, 0), ' history records to delete'));
        IF v_numHistoryIds > 0 THEN
          CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numHistoryIds, ' history records'));
          SET v_curMinId = 1;
          SET v_curMaxId = v_curMinId + v_incrementValue;
          REPEAT
            delete from review_history where historyId IN (
                select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
              );
            SET v_curMinId = v_curMinId + v_incrementValue;
            SET v_curMaxId = v_curMaxId + v_incrementValue;
          UNTIL ROW_COUNT() = 0 END REPEAT;
        END IF;
        CALL task_output (v_runId, v_taskId, 'info', concat('deleting ', v_numReviewIds, ' reviews'));
        SET v_curMinId = 1;
        SET v_curMaxId = v_curMinId + v_incrementValue;
        REPEAT
          delete from review where reviewId IN (
              select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
            );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
      CALL task_output (v_runId, v_taskId, 'info', 'task finished');
    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `get_runtime` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `get_runtime`(OUT out_runId BINARY(16), OUT out_taskId INT)
BEGIN
      DECLARE v_table_exists INT DEFAULT 1;
      BEGIN
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_table_exists = 0;
        SET v_table_exists = 1;
        SELECT 1 FROM t_runtime LIMIT 1;
      END;
      IF v_table_exists = 1 THEN
        SELECT runId, taskId INTO out_runId, out_taskId FROM t_runtime LIMIT 1;
      ELSE
        SET out_runId = NULL;
        SET out_taskId = NULL;
      END IF;
    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `run_job` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `run_job`(
    IN in_jobId INT,
    IN in_runIdStr VARCHAR(36)
  )
main:BEGIN
        DECLARE v_ourId INT DEFAULT NULL;
        DECLARE v_done INT DEFAULT FALSE;
        DECLARE v_runId BINARY(16);
        DECLARE v_jrId INT;
        DECLARE v_numTasks INT;
        DECLARE v_currentTaskId INT;
        DECLARE v_currentTaskName VARCHAR(255);
        DECLARE v_currentCommand VARCHAR(255);
        DECLARE v_currentTaskNum INT DEFAULT 0;
        DECLARE v_param_string TEXT;
        DECLARE cur CURSOR FOR
          SELECT 
            jt.taskId,
            t.name,
            t.command
          FROM
            job_task_map jt
            inner join task t on (jt.taskId = t.taskId)
          WHERE 
            jobId = in_jobId 
          ORDER BY jtId ASC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
        DECLARE EXIT HANDLER FOR SQLEXCEPTION
        BEGIN
          DECLARE err_code INT;
          DECLARE err_msg TEXT;
          GET STACKED DIAGNOSTICS CONDITION 1 err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
          CALL task_output(v_runId, v_ourId, 'error', concat('code: ', err_code, ' message: ', err_msg));
          UPDATE job_run SET state = 'failed' WHERE runId = v_runId;
        END;

        -- === Pre-task-loop logic ===
        IF in_runIdStr IS NOT NULL AND in_runIdStr REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          SET v_runId = UUID_TO_BIN(in_runIdStr, 1);
        ELSE
          SET v_runId = UUID_TO_BIN(UUID(), 1);
        END IF;

        CREATE TEMPORARY TABLE IF NOT EXISTS t_runtime (runId BINARY(16) NOT NULL, taskId INT NULL) SELECT v_runId AS runId, NULL AS taskId;
        INSERT INTO job_run(jobId, runId, state) VALUES (in_jobId, v_runId, 'running');
        CALL task_output (v_runId, v_ourId, 'info', concat('run started for jobId ', in_jobId));

        -- Get the number of tasks for the job
        SELECT COUNT(*) INTO v_numTasks FROM job_task_map WHERE jobId = in_jobId;

        IF v_numTasks = 0 THEN
          CALL task_output (v_runId, v_ourId, 'error', 'no tasks to run');
          UPDATE job_run SET state = 'failed' WHERE runId = v_runId AND state = 'running';
          LEAVE main; -- No tasks to run, exit the procedure
        END IF;


        OPEN cur;
        read_loop: LOOP
          FETCH cur INTO v_currentTaskId, v_currentTaskName, v_currentCommand;
          IF v_done THEN
            LEAVE read_loop;
          END IF;
          SET v_currentTaskNum = v_currentTaskNum + 1;

          SET @sql = CONCAT('CALL ', v_currentCommand);
          PREPARE stmt_run_job FROM @sql;
          CALL task_output (v_runId, v_ourId, 'info', concat('Starting task ', v_currentTaskName, ' (', v_currentTaskNum, '/', v_numTasks, ')'));
          UPDATE t_runtime SET taskId = v_currentTaskId WHERE runId = runId;
          EXECUTE stmt_run_job;
          DEALLOCATE PREPARE stmt_run_job;
        END LOOP;
        CLOSE cur;

        -- === Post-task-loop logic ===
        UPDATE job_run SET state = 'completed' WHERE runId = v_runId AND state = 'running';
        CALL task_output (v_runId, v_ourId, 'info', concat('run completed for jobId ', in_jobId));

    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `task_output` */;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER $
CREATE PROCEDURE `task_output`(
    IN in_runId BINARY(16),
    IN in_taskId INT,
    IN in_type VARCHAR(45),
    IN in_message VARCHAR(255)
  )
BEGIN
      IF in_message IS NULL THEN SET in_message = ''; END IF;
      insert into task_output (runId, taskId, type, message) values (in_runId, in_taskId, in_type, in_message);
    END $
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Final view structure for view `enabled_asset`
--

/*!50001 DROP VIEW IF EXISTS `enabled_asset`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `enabled_asset` AS select `asset`.`assetId` AS `assetId`,`asset`.`name` AS `name`,`asset`.`fqdn` AS `fqdn`,`asset`.`collectionId` AS `collectionId`,`asset`.`ip` AS `ip`,`asset`.`mac` AS `mac`,`asset`.`description` AS `description`,`asset`.`noncomputing` AS `noncomputing`,`asset`.`metadata` AS `metadata`,`asset`.`state` AS `state`,`asset`.`stateDate` AS `stateDate`,`asset`.`stateUserId` AS `stateUserId`,`asset`.`isEnabled` AS `isEnabled` from `asset` where (`asset`.`state` = 'enabled') */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `enabled_collection`
--

/*!50001 DROP VIEW IF EXISTS `enabled_collection`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `enabled_collection` AS select `collection`.`collectionId` AS `collectionId`,`collection`.`name` AS `name`,`collection`.`description` AS `description`,`collection`.`settings` AS `settings`,`collection`.`metadata` AS `metadata`,`collection`.`created` AS `created`,`collection`.`state` AS `state`,`collection`.`createdUserId` AS `createdUserId`,`collection`.`stateDate` AS `stateDate`,`collection`.`stateUserId` AS `stateUserId`,`collection`.`isNameUnavailable` AS `isNameUnavailable`,`collection`.`isEnabled` AS `isEnabled` from `collection` where (`collection`.`state` = 'enabled') */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_current_rev`
--

/*!50001 DROP VIEW IF EXISTS `v_current_rev`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_current_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,`rr`.`version` AS `version`,`rr`.`release` AS `release`,`rr`.`benchmarkDate` AS `benchmarkDate`,`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,`rr`.`status` AS `status`,`rr`.`statusDate` AS `statusDate`,`rr`.`marking` AS `marking`,`rr`.`description` AS `description`,`rr`.`active` AS `active`,`rr`.`groupCount` AS `groupCount`,`rr`.`ruleCount` AS `ruleCount`,`rr`.`lowCount` AS `lowCount`,`rr`.`mediumCount` AS `mediumCount`,`rr`.`highCount` AS `highCount`,`rr`.`checkCount` AS `checkCount`,`rr`.`fixCount` AS `fixCount` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,`r`.`benchmarkDate` AS `benchmarkDate`,`r`.`benchmarkDateSql` AS `benchmarkDateSql`,`r`.`status` AS `status`,`r`.`statusDate` AS `statusDate`,`r`.`marking` AS `marking`,`r`.`description` AS `description`,`r`.`active` AS `active`,`r`.`groupCount` AS `groupCount`,`r`.`ruleCount` AS `ruleCount`,`r`.`lowCount` AS `lowCount`,`r`.`mediumCount` AS `mediumCount`,`r`.`highCount` AS `highCount`,`r`.`checkCount` AS `checkCount`,`r`.`fixCount` AS `fixCount`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY field(`r`.`status`,'draft','accepted') desc,(`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r`) `rr` where (`rr`.`rn` = 1) */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_default_rev`
--

/*!50001 DROP VIEW IF EXISTS `v_default_rev`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_default_rev` AS select distinct `a`.`collectionId` AS `collectionId`,`sa`.`benchmarkId` AS `benchmarkId`,(case when (`crm`.`revId` is not null) then `crm`.`revId` else `cr`.`revId` end) AS `revId`,(case when (`crm`.`revId` is not null) then 1 else 0 end) AS `revisionPinned` from (((`asset` `a` join `stig_asset_map` `sa` on((`a`.`assetId` = `sa`.`assetId`))) left join `current_rev` `cr` on((`sa`.`benchmarkId` = `cr`.`benchmarkId`))) left join `collection_rev_map` `crm` on(((`sa`.`benchmarkId` = `crm`.`benchmarkId`) and (`a`.`collectionId` = `crm`.`collectionId`)))) */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_latest_rev`
--

/*!50001 DROP VIEW IF EXISTS `v_latest_rev`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_latest_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,concat('V',`rr`.`version`,'R',`rr`.`release`) AS `revisionStr` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY field(`r`.`status`,'draft','accepted') desc,(`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r`) `rr` where (`rr`.`rn` = 1) */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-04 20:55:14
