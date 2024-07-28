-- MySQL dump 10.13  Distrib 8.0.36, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stigman
-- ------------------------------------------------------
-- Server version	8.0.35

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
  `isEnabled` tinyint GENERATED ALWAYS AS ((case when (`state` = _utf8mb4'enabled') then 1 else NULL end)) VIRTUAL,
  PRIMARY KEY (`assetId`),
  UNIQUE KEY `INDEX_NAME_COLLECTION_ENABLED` (`name`,`collectionId`,`isEnabled`),
  KEY `INDEX_COMPUTING` (`noncomputing`),
  KEY `INDEX_COLLECTIONID` (`collectionId`),
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
  `isEnabled` tinyint GENERATED ALWAYS AS ((case when (`state` = _utf8mb4'enabled') then 1 else NULL end)) VIRTUAL,
  `isNameUnavailable` tinyint GENERATED ALWAYS AS ((case when ((`state` = _utf8mb4'cloning') or (`state` = _utf8mb4'enabled')) then 1 else NULL end)) VIRTUAL,
  PRIMARY KEY (`collectionId`),
  UNIQUE KEY `index2` (`name`,`isEnabled`),
  UNIQUE KEY `index3` (`name`,`isNameUnavailable`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `collection_grant`
--

DROP TABLE IF EXISTS `collection_grant`;
CREATE TABLE `collection_grant` (
  `cgId` int NOT NULL AUTO_INCREMENT,
  `collectionId` int NOT NULL,
  `userId` int NOT NULL,
  `accessLevel` int NOT NULL,
  PRIMARY KEY (`cgId`),
  UNIQUE KEY `INDEX_USER` (`userId`,`collectionId`),
  KEY `INDEX_COLLECTION` (`collectionId`,`accessLevel`),
  CONSTRAINT `fk_collection_grant_1` FOREIGN KEY (`userId`) REFERENCES `user_data` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_collection_grant_2` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `historyId` int NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`saId`),
  UNIQUE KEY `IDX_BAID` (`benchmarkId`,`assetId`),
  KEY `IDX_ASSETID` (`assetId`),
  CONSTRAINT `FK_STIG_ASSET_MAP_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_STIG_ASSET_MAP_2` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE
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
  PRIMARY KEY (`userId`),
  UNIQUE KEY `INDEX_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Table structure for table `user_stig_asset_map`
--

DROP TABLE IF EXISTS `user_stig_asset_map`;
CREATE TABLE `user_stig_asset_map` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `saId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_user_stig_asset_map_2` (`userId`),
  KEY `fk_user_stig_asset_map_1` (`saId`),
  CONSTRAINT `fk_user_stig_asset_map_1` FOREIGN KEY (`saId`) REFERENCES `stig_asset_map` (`saId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_stig_asset_map_2` FOREIGN KEY (`userId`) REFERENCES `user_data` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
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
-- Final view structure for view `v_current_rev`
--

/*!50001 DROP VIEW IF EXISTS `v_current_rev`*/;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_current_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,`rr`.`version` AS `version`,`rr`.`release` AS `release`,`rr`.`benchmarkDate` AS `benchmarkDate`,`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,`rr`.`status` AS `status`,`rr`.`statusDate` AS `statusDate`,`rr`.`description` AS `description`,`rr`.`active` AS `active`,`rr`.`groupCount` AS `groupCount`,`rr`.`ruleCount` AS `ruleCount`,`rr`.`lowCount` AS `lowCount`,`rr`.`mediumCount` AS `mediumCount`,`rr`.`highCount` AS `highCount`,`rr`.`checkCount` AS `checkCount`,`rr`.`fixCount` AS `fixCount` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,`r`.`benchmarkDate` AS `benchmarkDate`,`r`.`benchmarkDateSql` AS `benchmarkDateSql`,`r`.`status` AS `status`,`r`.`statusDate` AS `statusDate`,`r`.`description` AS `description`,`r`.`active` AS `active`,`r`.`groupCount` AS `groupCount`,`r`.`ruleCount` AS `ruleCount`,`r`.`lowCount` AS `lowCount`,`r`.`mediumCount` AS `mediumCount`,`r`.`highCount` AS `highCount`,`r`.`checkCount` AS `checkCount`,`r`.`fixCount` AS `fixCount`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY field(`r`.`status`,'draft','accepted') desc,(`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r`) `rr` where (`rr`.`rn` = 1) */;
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

-- Dump completed on 2024-03-28 15:26:46
