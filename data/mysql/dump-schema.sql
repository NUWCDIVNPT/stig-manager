-- MySQL dump 10.13-csmig  Distrib 8.0.18-csmig, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stigman
-- ------------------------------------------------------
-- Server version	8.0.20

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
-- Table structure for table `action`
--

DROP TABLE IF EXISTS `action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `action` (
  `actionId` decimal(10,0) NOT NULL,
  `action` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`actionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact`
--

DROP TABLE IF EXISTS `artifact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact` (
  `artId` decimal(10,0) NOT NULL,
  `sha1` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `description` varchar(4000) COLLATE utf8mb4_bin NOT NULL,
  `userId` decimal(10,0) NOT NULL,
  `ts` datetime NOT NULL,
  `dept` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`artId`),
  KEY `INDEX_SHA1` (`sha1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `artifact_blob`
--

DROP TABLE IF EXISTS `artifact_blob`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_blob` (
  `sha1` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `data` longblob NOT NULL,
  `ts` datetime DEFAULT NULL,
  `userId` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`sha1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset`
--

DROP TABLE IF EXISTS `asset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset` (
  `assetId` decimal(10,0) NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `profile` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `domain` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `dept` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `nonnetwork` char(1) COLLATE utf8mb4_bin DEFAULT NULL,
  `scanexempt` char(1) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`assetId`),
  UNIQUE KEY `INDEX_NAME` (`name`),
  KEY `INDEX_PROFILE` (`profile`),
  KEY `INDEX_NONNETWORK` (`nonnetwork`),
  KEY `INDEX_SCANEXEMPT` (`scanexempt`),
  KEY `INDEX_DEPT` (`dept`),
  CONSTRAINT `ASSETS_CHK_IP_NN` CHECK ((((`ip` is not null) and (`nonnetwork` = 0)) or ((`ip` is null) and (`nonnetwork` = 1)))),
  CONSTRAINT `ASSETS_CHK_NN_SE` CHECK ((((`nonnetwork` = 0) and (`scanexempt` in (0,1))) or ((`nonnetwork` = 1) and (`scanexempt` = 1))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `asset_package_map`
--

DROP TABLE IF EXISTS `asset_package_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_package_map` (
  `apId` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) NOT NULL,
  `packageId` decimal(10,0) NOT NULL,
  PRIMARY KEY (`apId`),
  UNIQUE KEY `ASSET_PACKAGE_MAP_INDEX1` (`packageId`,`assetId`),
  KEY `INDEX_3_1` (`packageId`),
  KEY `INDEX_2_2` (`assetId`),
  CONSTRAINT `FK_ASSET_PACKAGE_MAP_1` FOREIGN KEY (`packageId`) REFERENCES `package` (`packageId`),
  CONSTRAINT `FK_ASSET_PACKAGE_MAP_2` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `imported_blob`
--

DROP TABLE IF EXISTS `imported_blob`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imported_blob` (
  `sha1` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `data` longblob,
  PRIMARY KEY (`sha1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `imported_job`
--

DROP TABLE IF EXISTS `imported_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `imported_job` (
  `jobId` decimal(10,0) NOT NULL,
  `starttime` datetime DEFAULT NULL,
  `userId` decimal(10,0) DEFAULT NULL,
  `stigmanId` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `source` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `assetId` decimal(10,0) DEFAULT NULL,
  `stigId` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `packageId` decimal(10,0) DEFAULT NULL,
  `filename` varchar(256) COLLATE utf8mb4_bin DEFAULT NULL,
  `filesize` decimal(10,0) DEFAULT NULL,
  `modified` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `filemd` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `reporttext` longtext COLLATE utf8mb4_bin,
  `endtime` datetime DEFAULT NULL,
  PRIMARY KEY (`jobId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `package`
--

DROP TABLE IF EXISTS `package`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `package` (
  `packageId` decimal(10,0) NOT NULL,
  `name` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `emassId` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `reqrar` int DEFAULT NULL,
  `pocname` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `pocemail` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `pocphone` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`packageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `poam_rar_entry`
--

DROP TABLE IF EXISTS `poam_rar_entry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poam_rar_entry` (
  `preId` decimal(10,0) NOT NULL,
  `packageId` decimal(10,0) NOT NULL,
  `findingType` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `sourceId` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `iacontrol` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `status` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `poc` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `resources` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `compdate` datetime DEFAULT NULL,
  `milestone` longtext COLLATE utf8mb4_bin,
  `poamComment` longtext COLLATE utf8mb4_bin,
  `likelihood` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `mitdesc` longtext COLLATE utf8mb4_bin,
  `residualRisk` decimal(10,0) DEFAULT NULL,
  `recCorrAct` longtext COLLATE utf8mb4_bin,
  `remdesc` longtext COLLATE utf8mb4_bin,
  `rarComment` longtext COLLATE utf8mb4_bin,
  PRIMARY KEY (`preId`),
  UNIQUE KEY `PACKAGEID_RULEID` (`packageId`,`sourceId`),
  KEY `FINDINGTYPE` (`findingType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reject_string`
--

DROP TABLE IF EXISTS `reject_string`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reject_string` (
  `rejectId` decimal(10,0) NOT NULL,
  `shortStr` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `longStr` longtext COLLATE utf8mb4_bin,
  PRIMARY KEY (`rejectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `reviewId` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) DEFAULT NULL,
  `ruleId` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `stateId` decimal(10,0) DEFAULT NULL,
  `userId` decimal(10,0) DEFAULT NULL,
  `stateComment` longtext COLLATE utf8mb4_bin,
  `actionId` decimal(10,0) DEFAULT NULL,
  `actionComment` longtext COLLATE utf8mb4_bin,
  `reqdoc` int DEFAULT NULL,
  `autostate` int DEFAULT NULL,
  `ts` datetime NOT NULL,
  `rejecttext` longtext COLLATE utf8mb4_bin,
  `rejectUserId` decimal(10,0) DEFAULT NULL,
  `statusId` decimal(10,0) NOT NULL,
  PRIMARY KEY (`reviewId`),
  UNIQUE KEY `INDEX_2_1_1` (`assetId`,`ruleId`),
  KEY `INDEX_4` (`stateId`),
  KEY `INDEX_3_3` (`ruleId`),
  KEY `INDEX_STATUSID` (`statusId`),
  CONSTRAINT `FK_REVIEWS_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_artifact_map`
--

DROP TABLE IF EXISTS `review_artifact_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_artifact_map` (
  `raId` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) NOT NULL,
  `ruleId` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `artId` decimal(10,0) NOT NULL,
  `userId` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`raId`),
  KEY `INDEX_2_1` (`assetId`,`ruleId`),
  KEY `INDEX_3` (`artId`),
  CONSTRAINT `FK_REVIEW_ARTIFACT_MAP_1` FOREIGN KEY (`artId`) REFERENCES `artifact` (`artId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_history`
--

DROP TABLE IF EXISTS `review_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_history` (
  `id` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) DEFAULT NULL,
  `ruleId` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `activityType` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `columnname` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `oldValue` longtext COLLATE utf8mb4_bin,
  `newValue` longtext COLLATE utf8mb4_bin,
  `userId` decimal(10,0) DEFAULT NULL,
  `ts` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `INDEX_ACTIVITYTYPE` (`activityType`),
  KEY `INDEX_ASSETID` (`assetId`),
  KEY `INDEX_COLUMNNAME` (`columnname`),
  KEY `INDEX_RULEID` (`ruleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_reject_string_map`
--

DROP TABLE IF EXISTS `review_reject_string_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_reject_string_map` (
  `rrsId` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) NOT NULL,
  `ruleId` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  `rejectId` decimal(10,0) NOT NULL,
  `userId` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`rrsId`),
  UNIQUE KEY `INDEX2` (`assetId`,`ruleId`,`rejectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role` (
  `id` decimal(10,0) NOT NULL,
  `role` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `roleDisplay` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `state`
--

DROP TABLE IF EXISTS `state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `state` (
  `stateId` decimal(10,0) NOT NULL,
  `state` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `abbr` varchar(3) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`stateId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stats_asset_stig`
--

DROP TABLE IF EXISTS `stats_asset_stig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stats_asset_stig` (
  `id` decimal(10,0) NOT NULL,
  `assetId` decimal(10,0) DEFAULT NULL,
  `stigId` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `minTs` datetime DEFAULT NULL,
  `maxTs` datetime DEFAULT NULL,
  `checksManual` decimal(10,0) DEFAULT NULL,
  `checksScap` decimal(10,0) DEFAULT NULL,
  `inprogressManual` decimal(10,0) DEFAULT NULL,
  `inprogressScap` decimal(10,0) DEFAULT NULL,
  `submittedManual` decimal(10,0) DEFAULT NULL,
  `submittedScap` decimal(10,0) DEFAULT NULL,
  `rejectedManual` decimal(10,0) DEFAULT NULL,
  `rejectedScap` decimal(10,0) DEFAULT NULL,
  `approvedManual` decimal(10,0) DEFAULT NULL,
  `approvedScap` decimal(10,0) DEFAULT NULL,
  `cat1Count` decimal(10,0) DEFAULT NULL,
  `cat2Count` decimal(10,0) DEFAULT NULL,
  `cat3Count` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_2_2_C` (`assetId`,`stigId`),
  KEY `FK_STATS_ASSET_STIG_2` (`stigId`),
  CONSTRAINT `FK_STATS_ASSET_STIG_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `status` (
  `statusId` decimal(10,0) NOT NULL,
  `statusStr` varchar(45) COLLATE utf8mb4_bin NOT NULL,
  PRIMARY KEY (`statusId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stig_asset_map`
--

DROP TABLE IF EXISTS `stig_asset_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stig_asset_map` (
  `saId` decimal(10,0) NOT NULL,
  `stigId` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `assetId` decimal(10,0) NOT NULL,
  `disableImports` int NOT NULL,
  PRIMARY KEY (`saId`),
  UNIQUE KEY `INDEX_2_3_C` (`stigId`,`assetId`),
  KEY `DISABLEIMPORTS` (`disableImports`),
  KEY `FK_STIGASSETMAP_1` (`assetId`),
  CONSTRAINT `FK_STIG_ASSET_MAP_1` FOREIGN KEY (`assetId`) REFERENCES `asset` (`assetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_data`
--

DROP TABLE IF EXISTS `user_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_data` (
  `id` decimal(10,0) NOT NULL,
  `cn` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `dept` varchar(45) COLLATE utf8mb4_bin DEFAULT NULL,
  `roleId` decimal(10,0) DEFAULT NULL,
  `canAdmin` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_CN` (`cn`),
  UNIQUE KEY `INDEX_3_C` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_role_map`
--

DROP TABLE IF EXISTS `user_role_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role_map` (
  `id` decimal(10,0) NOT NULL,
  `userId` decimal(10,0) NOT NULL,
  `roleId` decimal(10,0) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `INDEX_3_38` (`roleId`,`userId`),
  KEY `INDEX_2` (`userId`),
  CONSTRAINT `FK_USER_ROLE_MAP_1` FOREIGN KEY (`userId`) REFERENCES `user_data` (`id`),
  CONSTRAINT `FK_USER_ROLE_MAP_2` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_stig_asset_map`
--

DROP TABLE IF EXISTS `user_stig_asset_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stig_asset_map` (
  `id` decimal(10,0) NOT NULL,
  `userId` decimal(10,0) NOT NULL,
  `saId` decimal(10,0) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_2_1_C` (`userId`,`saId`),
  KEY `INDEX_3_2` (`saId`),
  CONSTRAINT `FK_USER_STIG_ASSET_MAP_1` FOREIGN KEY (`userId`) REFERENCES `user_data` (`id`),
  CONSTRAINT `FK_USER_STIG_ASSET_MAP_2` FOREIGN KEY (`saId`) REFERENCES `stig_asset_map` (`saId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-05-05 21:54:37
