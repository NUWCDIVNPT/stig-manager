-- MySQL dump 10.13-csmig  Distrib 8.0.18-csmig, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stigman
-- ------------------------------------------------------
-- Server version	8.0.20

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- DROP DATABASE IF EXISTS `stigman`;
-- CREATE DATABASE /*!32312 IF NOT EXISTS*/ `stigman` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

-- USE `stigman`;

--
-- Table structure for table `action`
--

DROP TABLE IF EXISTS `action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `action` (
  `actionId` int(11) NOT NULL AUTO_INCREMENT,
  `api` varchar(16) NOT NULL,
  `en` varchar(64) NOT NULL,
  PRIMARY KEY (`actionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset`
--

DROP TABLE IF EXISTS `asset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset` (
  `assetId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `collectionId` int NOT NULL,
  `ip` varchar(45) DEFAULT NULL, 
  `description` varchar(255) DEFAULT NULL,
  `noncomputing` bit(1) NOT NULL DEFAULT b'0',
  `metadata` json NOT NULL,
  PRIMARY KEY (`assetId`),
  UNIQUE KEY `INDEX_NAMECOLLECTION` (`name`, `collectionId`),
  KEY `INDEX_COMPUTING` (`noncomputing`),
  KEY `INDEX_COLLECTIONID` (`collectionId`),
  CONSTRAINT `FK_ASSET_2` FOREIGN KEY (`collectionId`) REFERENCES `collection` (`collectionId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cci`
--

DROP TABLE IF EXISTS `cci`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cci_reference_map`
--

DROP TABLE IF EXISTS `cci_reference_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cci_reference_map` (
  `cciRefId` int(11) NOT NULL AUTO_INCREMENT,
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `check`
--

DROP TABLE IF EXISTS `check`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `check` (
  `checkId` varchar(255) NOT NULL,
  `content` text,
  PRIMARY KEY (`checkId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `collection`
--

DROP TABLE IF EXISTS `collection`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `collection` (
  `collectionId` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `workflow` varchar(45) NOT NULL,
  `metadata` json NOT NULL,
  PRIMARY KEY (`collectionId`),
  UNIQUE KEY `index2` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `collection_grant`
--

DROP TABLE IF EXISTS `collection_grant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `current_group_rule`
--

DROP TABLE IF EXISTS `current_group_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_group_rule` (
  `cgrId` int(11) NOT NULL AUTO_INCREMENT,
  `benchmarkId` varchar(255) NOT NULL,
  `groupId` varchar(45) NOT NULL,
  `ruleId` varchar(255) NOT NULL,
  PRIMARY KEY (`cgrId`),
  KEY `idx_benchmarkId` (`benchmarkId`),
  KEY `idx_rule` (`ruleId`),
  KEY `idx_group` (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `current_rev`
--

DROP TABLE IF EXISTS `current_rev`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `current_rev` (
  `revId` varchar(255) NOT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `version` int(11) NOT NULL,
  `release` varchar(45) NOT NULL,
  `benchmarkDate` varchar(45) DEFAULT NULL,
  `benchmarkDateSql` date DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `statusDate` varchar(45) DEFAULT NULL,
  `description` varchar(4000) DEFAULT NULL,
  `active` tinyint(4) DEFAULT NULL,
  `groupCount` int(11) DEFAULT 0 NOT NULL,
  `ruleCount` int(11) DEFAULT 0 NOT NULL,
  `checkCount` int(11) DEFAULT 0 NOT NULL,
  `fixCount` int(11) DEFAULT 0 NOT NULL,
  `ovalCount` int(11) DEFAULT 0 NOT NULL,
  PRIMARY KEY (`revId`),
  UNIQUE KEY `index2` (`benchmarkId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fix`
--

DROP TABLE IF EXISTS `fix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fix` (
  `fixId` varchar(45) NOT NULL,
  `text` mediumtext,
  PRIMARY KEY (`fixId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `group`
--

DROP TABLE IF EXISTS `group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group` (
  `groupId` varchar(45) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `severity` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `key` varchar(45) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poam_rar_entry`
--

DROP TABLE IF EXISTS `poam_rar_entry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poam_rar_entry` (
  `preId` int(11) NOT NULL AUTO_INCREMENT,
  `collectionId` int(11) NOT NULL,
  `groupId` varchar(45) NOT NULL,
  `iacontrol` varchar(45) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `poc` varchar(255) DEFAULT NULL,
  `resources` varchar(255) DEFAULT NULL,
  `compdate` datetime DEFAULT NULL,
  `milestone` longtext,
  `poamComment` longtext,
  `likelihood` varchar(50) DEFAULT NULL,
  `mitdesc` longtext,
  `residualRisk` int(11) DEFAULT NULL,
  `recCorrAct` longtext,
  `remdesc` longtext,
  `rarComment` longtext,
  PRIMARY KEY (`preId`),
  UNIQUE KEY `unique_collectionId_groupId` (`collectionId`,`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reject_string`
--

DROP TABLE IF EXISTS `reject_string`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reject_string` (
  `rejectId` int(11) NOT NULL AUTO_INCREMENT,
  `shortStr` varchar(45) NOT NULL,
  `longStr` longtext ,
  PRIMARY KEY (`rejectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

DROP TABLE IF EXISTS `result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `result` (
  `resultId` int(11) NOT NULL AUTO_INCREMENT,
  `api` varchar(32) NOT NULL,
  `ckl` varchar(32) NOT NULL,
  `abbr` varchar(2) NOT NULL,
  `en` varchar(64) NOT NULL,
  PRIMARY KEY (`resultId`),
  UNIQUE KEY `RESULT_API` (`api`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_group_map`
--

DROP TABLE IF EXISTS `rev_group_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_group_map` (
  `rgId` int(11) NOT NULL AUTO_INCREMENT,
  `revId` varchar(255) DEFAULT NULL,
  `groupId` varchar(45) DEFAULT NULL,
  `rules` JSON DEFAULT NULL,
  PRIMARY KEY (`rgId`),
  UNIQUE KEY `uidx_rgm_revId_groupId` (`revId`,`groupId`),
  KEY `idx_rgm_groupId` (`groupId`),
  CONSTRAINT `FK_rev_group_map_group` FOREIGN KEY (`groupId`) REFERENCES `group` (`groupId`),
  CONSTRAINT `FK_rev_group_map_revision` FOREIGN KEY (`revId`) REFERENCES `revision` (`revId`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_group_rule_check_map`
--

DROP TABLE IF EXISTS `rev_group_rule_check_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_group_rule_check_map` (
  `rgrcId` int(11) NOT NULL AUTO_INCREMENT,
  `rgrId` int(11) NOT NULL,
  `checkId` varchar(255) NOT NULL,
  PRIMARY KEY (`rgrcId`),
  UNIQUE KEY `uidx_rcm_ruleId_checkId` (`rgrId`,`checkId`),
  KEY `idx_rcm_checkId` (`checkId`),
  CONSTRAINT `FK_rev_group_rule_check_map_check` FOREIGN KEY (`checkId`) REFERENCES `check` (`checkId`),
  CONSTRAINT `FK_rev_group_rule_check_map_rev_group_rule_map` FOREIGN KEY (`rgrId`) REFERENCES `rev_group_rule_map` (`rgrId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_group_rule_fix_map`
--

DROP TABLE IF EXISTS `rev_group_rule_fix_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_group_rule_fix_map` (
  `rgrfId` int(11) NOT NULL AUTO_INCREMENT,
  `rgrId` int(11) NOT NULL,
  `fixId` varchar(255) NOT NULL,
  PRIMARY KEY (`rgrfId`),
  UNIQUE KEY `uidx_rfm_ruleId_fixId` (`rgrId`,`fixId`),
  KEY `idx_rfm_fixId` (`fixId`),
  CONSTRAINT `FK_rev_group_rule_fix_map_fix` FOREIGN KEY (`fixId`) REFERENCES `fix` (`fixId`),
  CONSTRAINT `FK_rev_group_rule_fix_map_rev_group_rule_map` FOREIGN KEY (`rgrId`) REFERENCES `rev_group_rule_map` (`rgrId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_group_rule_map`
--

DROP TABLE IF EXISTS `rev_group_rule_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_group_rule_map` (
  `rgrId` int(11) NOT NULL AUTO_INCREMENT,
  `rgId` int(11) NOT NULL,
  `ruleId` varchar(255) DEFAULT NULL,
  `checks` JSON DEFAULT NULL,
  `fixes` JSON DEFAULT NULL,
  `ccis` JSON DEFAULT NULL,
  PRIMARY KEY (`rgrId`),
  UNIQUE KEY `uidx_rgrm_rgId_ruleId` (`rgId`,`ruleId`),
  KEY `idx_rgrm_ruleId` (`ruleId`),
  CONSTRAINT `FK_rev_group_rule_map_rev_group_map` FOREIGN KEY (`rgId`) REFERENCES `rev_group_map` (`rgId`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `FK_rev_group_rule_map_rule` FOREIGN KEY (`ruleId`) REFERENCES `rule` (`ruleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_xml_map`
--

DROP TABLE IF EXISTS `rev_xml_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_xml_map` (
  `rxId` int(11) NOT NULL AUTO_INCREMENT,
  `revId` varchar(255) NOT NULL,
  `xml` blob,
  PRIMARY KEY (`rxId`),
  UNIQUE KEY `uidx_rxm_revId` (`revId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `reviewId` int(11) NOT NULL AUTO_INCREMENT,
  `assetId` int(11) DEFAULT NULL,
  `ruleId` varchar(45) DEFAULT NULL,
  `resultId` int(11) DEFAULT NULL,
  `resultComment` longtext ,
  `actionId` int(11) DEFAULT NULL,
  `actionComment` longtext ,
  `autoResult` bit(1) DEFAULT 0,
  `ts` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `userId` int(11) DEFAULT NULL,
  `rejecttext` longtext ,
  `rejectUserId` int(11) DEFAULT NULL,
  `statusId` int(11) NOT NULL,
  PRIMARY KEY (`reviewId`),
  UNIQUE KEY `INDEX_ASSETID_RULEID` (`assetId`,`ruleId`),
  KEY `INDEX_RESULTID` (`resultId`),
  KEY `INDEX_RULEID` (`ruleId`),
  KEY `INDEX_STATUSID` (`statusId`),
  CONSTRAINT `FK_REVIEWS_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_history`
--

DROP TABLE IF EXISTS `review_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_history` (
  `historyId` int(11) NOT NULL AUTO_INCREMENT,
  `reviewId` int(11) NOT NULL,
  `resultId` int(11) NOT NULL,
  `resultComment` longtext,
  `actionId` int(11) DEFAULT NULL,
  `actionComment` longtext,
  `autoResult` bit(1) DEFAULT NULL,
  `ts` datetime NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `rejectText` longtext,
  `rejectUserId` int(11) DEFAULT NULL,
  `statusId` int(11) NOT NULL,
  PRIMARY KEY (`historyId`),
  KEY `index_reviewId` (`reviewId`),
  CONSTRAINT `fk_review_history_1` FOREIGN KEY (`reviewId`) REFERENCES `review` (`reviewId`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_reject_string_map`
--

DROP TABLE IF EXISTS `review_reject_string_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_reject_string_map` (
  `rrsId` int(11) NOT NULL AUTO_INCREMENT,
  `assetId` int(11) NOT NULL,
  `ruleId` varchar(45) NOT NULL,
  `rejectId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  PRIMARY KEY (`rrsId`),
  UNIQUE KEY `INDEX2` (`assetId`,`ruleId`,`rejectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `revision`
--

DROP TABLE IF EXISTS `revision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `revision` (
  `revId` varchar(255) NOT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `version` int(11) NOT NULL,
  `release` varchar(45) NOT NULL,
  `benchmarkDate` varchar(45) DEFAULT NULL,
  `benchmarkDateSql` date DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `statusDate` varchar(45) DEFAULT NULL,
  `description` varchar(4000) DEFAULT NULL,
  `active` tinyint(4) DEFAULT '1',
  `groupCount` int(11) DEFAULT 0 NOT NULL,
  `ruleCount` int(11) DEFAULT 0 NOT NULL,
  `checkCount` int(11) DEFAULT 0 NOT NULL,
  `fixCount` int(11) DEFAULT 0 NOT NULL,
  `ovalCount` int(11) DEFAULT 0 NOT NULL,
  PRIMARY KEY (`revId`),
  UNIQUE KEY `uidx_revision_benchmarkId_version_release` (`benchmarkId`,`version`,`release`),
  CONSTRAINT `FK_REVISION_1` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rule`
--

DROP TABLE IF EXISTS `rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule` (
  `ruleId` varchar(255) NOT NULL,
  `version` varchar(45) NOT NULL,
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
  PRIMARY KEY (`ruleId`),
  KEY `idx_rule_severity` (`severity`),
  KEY `idx_title` (`title`(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rule_cci_map`
--

DROP TABLE IF EXISTS `rule_cci_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_cci_map` (
  `rcId` int(11) NOT NULL AUTO_INCREMENT,
  `ruleId` varchar(255) NOT NULL,
  `cci` varchar(60) NOT NULL,
  PRIMARY KEY (`rcId`),
  UNIQUE KEY `rule_cci_unique` (`ruleId`,`cci`),
  KEY `index_cci` (`cci`),
  CONSTRAINT `FK_rule_cci_map_1` FOREIGN KEY (`ruleId`) REFERENCES `rule` (`ruleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rule_oval_map`
--

DROP TABLE IF EXISTS `rule_oval_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rule_oval_map` (
  `roId` int(11) NOT NULL AUTO_INCREMENT,
  `ruleId` varchar(255) NOT NULL,
  `ovalRef` varchar(255) NOT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `releaseInfo` varchar(255) NOT NULL,
  PRIMARY KEY (`roId`),
  KEY `index2` (`ruleId`),
  KEY `index3` (`benchmarkId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `severity_cat_map`
--

DROP TABLE IF EXISTS `severity_cat_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `severity_cat_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `severity` varchar(45) NOT NULL,
  `cat` int(11) NOT NULL,
  `roman` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scm_severity` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stats_asset_stig`
--

DROP TABLE IF EXISTS `stats_asset_stig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stats_asset_stig` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assetId` int(11) DEFAULT NULL,
  `benchmarkId` varchar(255) DEFAULT NULL,
  `minTs` datetime DEFAULT NULL,
  `maxTs` datetime DEFAULT NULL,
  `savedManual` int(11) DEFAULT NULL,
  `savedAuto` int(11) DEFAULT NULL,
  `submittedManual` int(11) DEFAULT NULL,
  `submittedAuto` int(11) DEFAULT NULL,
  `rejectedManual` int(11) DEFAULT NULL,
  `rejectedAuto` int(11) DEFAULT NULL,
  `acceptedManual` int(11) DEFAULT NULL,
  `acceptedAuto` int(11) DEFAULT NULL,
  `highCount` int(11) DEFAULT NULL,
  `mediumCount` int(11) DEFAULT NULL,
  `lowCount` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_2_2_C` (`assetId`,`benchmarkId`),
  KEY `FK_STATS_ASSET_STIG_2` (`benchmarkId`),
  CONSTRAINT `FK_STATS_ASSET_STIG_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status` (
  `statusId` int(11) NOT NULL,
  `api` varchar(16) NOT NULL,
  `en` varchar(16) NOT NULL,
  PRIMARY KEY (`statusId`),
  UNIQUE KEY `IDX_API` (`api`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `benchmark`
--

DROP TABLE IF EXISTS `stig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stig` (
  `benchmarkId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`benchmarkId`),
  KEY `idx_benchmark_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stig_asset_map`
--

DROP TABLE IF EXISTS `stig_asset_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stig_asset_map` (
  `saId` int(11) NOT NULL AUTO_INCREMENT,
  `benchmarkId` varchar(255) NOT NULL,
  `assetId` int(11) NOT NULL,
  `userIds` JSON DEFAULT NULL,
  PRIMARY KEY (`saId`),
  UNIQUE KEY `IDX_BAID` (`benchmarkId`,`assetId`),
  KEY `IDX_ASSETID` (`assetId`),
  CONSTRAINT `FK_STIG_ASSET_MAP_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_STIG_ASSET_MAP_2` FOREIGN KEY (`benchmarkId`) REFERENCES `stig` (`benchmarkId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_data` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `display` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `globalAccess` bit(1) NOT NULL DEFAULT b'0',
  `canCreateCollection` bit(1) NOT NULL DEFAULT b'0',
  `canAdmin` bit(1) NOT NULL DEFAULT b'0',
  `metadata` json NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lastAccess` int DEFAULT NULL,
  `disabled` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`userId`),
  UNIQUE KEY `INDEX_username` (`username`),
  KEY `INDEX_display` (`display`),
  KEY `email` (`email`),
  KEY `INDEX_globalAccess` (`globalAccess`),
  KEY `INDEX_canAdmin` (`canAdmin`),
  KEY `INDEX_canCreateCollection` (`canCreateCollection`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_stig_asset_map`
--

DROP TABLE IF EXISTS `user_stig_asset_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stig_asset_map` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `saId` int NOT NULL,
  -- `benchmarkId` varchar(255) NOT NULL,
  -- `assetId` int NOT NULL,
  PRIMARY KEY (`id`),
  -- UNIQUE KEY `usa_Unique` (`benchmarkId`,`assetId`,`userId`),
  -- KEY `usa_sa` (`benchmarkId`,`assetId`),
  -- KEY `usa_a` (`assetId`),
  KEY `fk_user_stig_asset_map_2` (`userId`),
  -- CONSTRAINT `fk_user_stig_asset_map_1` FOREIGN KEY (`benchmarkId`, `assetId`) REFERENCES `stig_asset_map` (`benchmarkId`, `assetId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_stig_asset_map_1` FOREIGN KEY (`saId`) REFERENCES `stig_asset_map` (`saId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_stig_asset_map_2` FOREIGN KEY (`userId`) REFERENCES `user_data` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

--
-- Temporary view structure for view `v_current_rev`
--

DROP TABLE IF EXISTS `v_current_rev`;
/*!50001 DROP VIEW IF EXISTS `v_current_rev`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
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
 1 AS `checkCount`,
 1 AS `fixCount`,
 1 AS `ovalCount`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_current_rev`
--

/*!50001 DROP VIEW IF EXISTS `v_current_rev`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `v_current_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,`rr`.`version` AS `version`,`rr`.`release` AS `release`,`rr`.`benchmarkDate` AS `benchmarkDate`,`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,`rr`.`status` AS `status`,`rr`.`statusDate` AS `statusDate`,`rr`.`description` AS `description`,`rr`.`active` AS `active`,`rr`.`groupCount` AS `groupCount`,`rr`.`ruleCount` AS `ruleCount`,`rr`.`checkCount` AS `checkCount`,`rr`.`fixCount` AS `fixCount`,`rr`.`ovalCount` AS `ovalCount` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,`r`.`benchmarkDate` AS `benchmarkDate`,`r`.`benchmarkDateSql` AS `benchmarkDateSql`,`r`.`status` AS `status`,`r`.`statusDate` AS `statusDate`,`r`.`description` AS `description`,`r`.`active` AS `active`,`r`.`groupCount` AS `groupCount`,`r`.`ruleCount` AS `ruleCount`,`r`.`checkCount` AS `checkCount`,`r`.`fixCount` AS `fixCount`,(SELECT COUNT(roId) FROM rule_oval_map where benchmarkId = `r`.`benchmarkId`) AS `ovalCount`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY (`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r` where `r`.`status` = 'accepted') `rr` where (`rr`.`rn` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-05-05 21:54:37
