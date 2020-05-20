-- MySQL dump 10.13  Distrib 8.0.18, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stig
-- ------------------------------------------------------
-- Server version	8.0.16

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `stig`
--

-- DROP DATABASE IF EXISTS `stig`;
-- CREATE DATABASE /*!32312 IF NOT EXISTS*/ `stig` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `stigman`;

--
-- Table structure for table `cci`
--

DROP TABLE IF EXISTS `cci`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cci` (
  `cci` varchar(20) NOT NULL,
  `cciNum` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `publishdate` date NOT NULL,
  `contributor` varchar(255) NOT NULL,
  `type` varchar(20) NOT NULL,
  `definition` text NOT NULL,
  `apAcronym` varchar(20) DEFAULT NULL,
  `implementation` text,
  `assessmentProcedure` text,
  PRIMARY KEY (`cci`)
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
  `textRefNist` varchar(255) DEFAULT NULL,
  `parentControl` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`cciRefId`),
  KEY `cci` (`cci`),
  KEY `textRefNist` (`textRefNist`)
) ENGINE=InnoDB AUTO_INCREMENT=24394 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
-- Temporary view structure for view `current_cci`
--

DROP TABLE IF EXISTS `current_cci`;
/*!50001 DROP VIEW IF EXISTS `current_cci`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_cci` AS SELECT 
 1 AS `control`,
 1 AS `cci`,
 1 AS `textRefNist`,
 1 AS `benchmarkId`,
 1 AS `groupId`,
 1 AS `ruleId`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_cci_rule`
--

DROP TABLE IF EXISTS `current_cci_rule`;
/*!50001 DROP VIEW IF EXISTS `current_cci_rule`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_cci_rule` AS SELECT 
 1 AS `cci`,
 1 AS `textRefNist`,
 1 AS `benchmarkId`,
 1 AS `rule`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_group_rule`
--

DROP TABLE IF EXISTS `current_group_rule`;
/*!50001 DROP VIEW IF EXISTS `current_group_rule`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_group_rule` AS SELECT 
 1 AS `benchmarkId`,
 1 AS `groupId`,
 1 AS `rgId`,
 1 AS `ruleId`,
 1 AS `rgrId`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_rev`
--

DROP TABLE IF EXISTS `current_rev`;
/*!50001 DROP VIEW IF EXISTS `current_rev`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_rev` AS SELECT 
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
 1 AS `rn`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_textref_rule`
--

DROP TABLE IF EXISTS `current_textref_rule`;
/*!50001 DROP VIEW IF EXISTS `current_textref_rule`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_textref_rule` AS SELECT 
 1 AS `textRefNist`,
 1 AS `benchmarkId`,
 1 AS `rule`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `current_textref`
--

DROP TABLE IF EXISTS `current_textref`;
/*!50001 DROP VIEW IF EXISTS `current_textref`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `current_textref` AS SELECT 
 1 AS `cci`,
 1 AS `textRefNist`,
 1 AS `benchmarks`*/;
SET character_set_client = @saved_cs_client;

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
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`groupId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mv_current_cci_rule`
--

DROP TABLE IF EXISTS `mv_current_cci_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mv_current_cci_rule` (
  `ccrId` int(11) NOT NULL AUTO_INCREMENT,
  `cci` varchar(20) NOT NULL,
  `textRefNist` varchar(255) DEFAULT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `rule` json DEFAULT NULL,
  PRIMARY KEY (`ccrId`)
) ENGINE=InnoDB AUTO_INCREMENT=8192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mv_current_cci`
--

DROP TABLE IF EXISTS `mv_current_cci`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mv_current_cci` (
  `ccId` int(11) NOT NULL AUTO_INCREMENT,
  `cci` varchar(20) NOT NULL,
  `textRefNist` varchar(255) DEFAULT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `groupId` varchar(45) DEFAULT NULL,
  `ruleId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ccId`),
  KEY `index_cci` (`cci`),
  KEY `index_textRefNist` (`textRefNist`),
  KEY `index_benchmarkId` (`benchmarkId`)
) ENGINE=InnoDB AUTO_INCREMENT=32768 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mv_current_textref_rule`
--

DROP TABLE IF EXISTS `mv_current_textref_rule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mv_current_textref_rule` (
  `textRefNist` varchar(255) DEFAULT NULL,
  `benchmarkId` varchar(255) NOT NULL,
  `rule` json DEFAULT NULL
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
) ENGINE=InnoDB AUTO_INCREMENT=84954 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_group_rule_cci_map`
--

DROP TABLE IF EXISTS `rev_group_rule_cci_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_group_rule_cci_map` (
  `rgriId` int(11) NOT NULL AUTO_INCREMENT,
  `rgrId` int(11) NOT NULL,
  `cci` varchar(60) NOT NULL,
  PRIMARY KEY (`rgriId`),
  UNIQUE KEY `uidx_rctlm_ruleId_controlNumber_controlType` (`rgrId`,`cci`),
  KEY `idx_rctlm_controlNumber` (`cci`),
  CONSTRAINT `FK_rev_group_rule_ident_map_rev_group_rule_map` FOREIGN KEY (`rgrId`) REFERENCES `rev_group_rule_map` (`rgrId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61663 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=64672 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=64384 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=85897 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rev_profile_group_map`
--

DROP TABLE IF EXISTS `rev_profile_group_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rev_profile_group_map` (
  `rpgId` int(11) NOT NULL AUTO_INCREMENT,
  `revId` varchar(255) DEFAULT NULL,
  `profile` varchar(45) DEFAULT NULL,
  `groupId` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`rpgId`),
  UNIQUE KEY `uidx_rpgm_revId_profile_groupId` (`revId`,`profile`,`groupId`),
  KEY `idx_rpgm_groupId` (`groupId`),
  CONSTRAINT `FK_rev_profile_group_map_revision` FOREIGN KEY (`revId`) REFERENCES `revision` (`revId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=815749 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  PRIMARY KEY (`revId`),
  UNIQUE KEY `uidx_revision_benchmarkId_version_release` (`benchmarkId`,`version`,`release`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `rgrId_textref`
--

DROP TABLE IF EXISTS `rgrId_textref`;
/*!50001 DROP VIEW IF EXISTS `rgrId_textref`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `rgrId_textref` AS SELECT 
 1 AS `rgrId`,
 1 AS `textRefNist`*/;
SET character_set_client = @saved_cs_client;

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
  PRIMARY KEY (`roId`)
) ENGINE=InnoDB AUTO_INCREMENT=52238 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  PRIMARY KEY (`ruleId`,`version`),
  KEY `idx_rule_severity` (`severity`),
  KEY `idx_title` (`title`(100))
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
  `cat` varchar(45) NOT NULL,
  `roman` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_scm_severity` (`severity`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stig_target_map`
--

DROP TABLE IF EXISTS `stig_target_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stig_target_map` (
  `stId` int(11) NOT NULL AUTO_INCREMENT,
  `benchmarkId` varchar(255) NOT NULL,
  `targetId` int(11) NOT NULL,
  PRIMARY KEY (`stId`),
  UNIQUE KEY `st-unique-idx` (`benchmarkId`,`targetId`),
  KEY `st-target-idx` (`targetId`),
  KEY `st-benchmark-idx` (`benchmarkId`),
  CONSTRAINT `fk_stig_target_map_1` FOREIGN KEY (`targetId`) REFERENCES `target` (`targetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `benchmark`
--

DROP TABLE IF EXISTS `benchmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benchmark` (
  `benchmarkId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`benchmarkId`),
  KEY `idx_benchmark_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `target`
--

DROP TABLE IF EXISTS `target`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `target` (
  `targetId` int(11) NOT NULL AUTO_INCREMENT,
  `target` varchar(255) NOT NULL,
  `targetType` varchar(45) NOT NULL,
  `targetVersion` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`targetId`),
  UNIQUE KEY `target-type-idx` (`targetType`,`target`,`targetVersion`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Current Database: `stig`
--

USE `stigman`;

--
-- Final view structure for view `current_cci`
--

/*!50001 DROP VIEW IF EXISTS `current_cci`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_cci` AS select `cref`.`parentControl` AS `control`,`cref`.`cci` AS `cci`,`cref`.`textRefNist` AS `textRefNist`,`cgr`.`benchmarkId` AS `benchmarkId`,`cgr`.`groupId` AS `groupId`,`cgr`.`ruleId` AS `ruleId` from ((`current_group_rule` `cgr` join `rev_group_rule_cci_map` `rgrc` on((`cgr`.`rgrId` = `rgrc`.`rgrId`))) join `cci_reference_map` `cref` on((`rgrc`.`cci` = `cref`.`cci`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_cci_rule`
--

/*!50001 DROP VIEW IF EXISTS `current_cci_rule`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_cci_rule` AS select `current_cci`.`cci` AS `cci`,`current_cci`.`textRefNist` AS `textRefNist`,`current_cci`.`benchmarkId` AS `benchmarkId`,json_arrayagg(json_object('groupId',`current_cci`.`groupId`,'ruleId',`current_cci`.`ruleId`)) AS `rule` from `current_cci` group by `current_cci`.`cci`,`current_cci`.`textRefNist`,`current_cci`.`benchmarkId` order by `current_cci`.`cci`,`current_cci`.`textRefNist`,`current_cci`.`benchmarkId` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_group_rule`
--

/*!50001 DROP VIEW IF EXISTS `current_group_rule`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_group_rule` AS select `cr`.`benchmarkId` AS `benchmarkId`,`rg`.`groupId` AS `groupId`,`rg`.`rgId` AS `rgId`,`rgr`.`ruleId` AS `ruleId`,`rgr`.`rgrId` AS `rgrId` from ((`current_rev` `cr` left join `rev_group_map` `rg` on((`cr`.`revId` = `rg`.`revId`))) left join `rev_group_rule_map` `rgr` on((`rg`.`rgId` = `rgr`.`rgId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_rev`
--

/*!50001 DROP VIEW IF EXISTS `current_rev`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,`rr`.`version` AS `version`,`rr`.`release` AS `release`,`rr`.`benchmarkDate` AS `benchmarkDate`,`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,`rr`.`status` AS `status`,`rr`.`statusDate` AS `statusDate`,`rr`.`description` AS `description`,`rr`.`active` AS `active`,`rr`.`rn` AS `rn` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,`r`.`benchmarkDate` AS `benchmarkDate`,`r`.`benchmarkDateSql` AS `benchmarkDateSql`,`r`.`status` AS `status`,`r`.`statusDate` AS `statusDate`,`r`.`description` AS `description`,`r`.`active` AS `active`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY (`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r`) `rr` where (`rr`.`rn` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_textref_rule`
--

/*!50001 DROP VIEW IF EXISTS `current_textref_rule`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_textref_rule` AS select `rt`.`textRefNist` AS `textRefNist`,`cgr`.`benchmarkId` AS `benchmarkId`,json_arrayagg(json_object('groupId',`cgr`.`groupId`,'ruleId',`cgr`.`ruleId`)) AS `rule` from (`rgrId_textref` `rt` join `current_group_rule` `cgr` on((`rt`.`rgrId` = `cgr`.`rgrId`))) group by `rt`.`textRefNist`,`cgr`.`benchmarkId` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `current_textref`
--

/*!50001 DROP VIEW IF EXISTS `current_textref`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `current_textref` AS select `a`.`cci` AS `cci`,`a`.`textRefNist` AS `textRefNist`,json_arrayagg(json_object('rule',`a`.`rule`,'benchmarkId',`a`.`benchmarkId`)) AS `benchmarks` from `current_cci_rule` `a` group by `a`.`cci`,`a`.`textRefNist` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `rgrId_textref`
--

/*!50001 DROP VIEW IF EXISTS `rgrId_textref`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50001 VIEW `rgrId_textref` AS select distinct `rgrc`.`rgrId` AS `rgrId`,`cr`.`textRefNist` AS `textRefNist` from (`rev_group_rule_cci_map` `rgrc` join `cci_reference_map` `cr` on((`rgrc`.`cci` = `cr`.`cci`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-12-03 22:49:38
