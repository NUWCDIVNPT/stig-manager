-- MySQL dump 10.13  Distrib 8.0.18, for Linux (x86_64)
--
-- Host: 192.168.1.155    Database: stigman
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
-- Temporary view structure for view `asset_stigGrants`
--

DROP TABLE IF EXISTS `asset_stigGrants`;
/*!50001 DROP VIEW IF EXISTS `asset_stigGrants`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `asset_stigGrants` AS SELECT 
 1 AS `assetId`,
 1 AS `stigGrants`*/;
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
-- Temporary view structure for view `rule_cci_map`
--

DROP TABLE IF EXISTS `rule_cci_map`;
/*!50001 DROP VIEW IF EXISTS `rule_cci_map`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `rule_cci_map` AS SELECT 
 1 AS `ruleId`,
 1 AS `cci`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_review_history_jsonarray`
--

DROP TABLE IF EXISTS `v_review_history_jsonarray`;
/*!50001 DROP VIEW IF EXISTS `v_review_history_jsonarray`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_review_history_jsonarray` AS SELECT 
 1 AS `assetId`,
 1 AS `ruleId`,
 1 AS `h`,
 1 AS `rn`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `asset_stigGrants`
--

/*!50001 DROP VIEW IF EXISTS `asset_stigGrants`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`stigman`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `asset_stigGrants` AS select `byAsset`.`assetId` AS `assetId`,json_arrayagg(`byAsset`.`stigAssetUsers`) AS `stigGrants` from (select `r`.`assetId` AS `assetId`,json_object('benchmarkId',`r`.`benchmarkId`,'reviewers',(case when (count(`r`.`reviewers`) > 0) then json_arrayagg(`r`.`reviewers`) else json_array() end)) AS `stigAssetUsers` from (select `sa`.`assetId` AS `assetId`,`sa`.`benchmarkId` AS `benchmarkId`,(case when (`ud`.`userId` is not null) then json_object('userId',`ud`.`userId`,'username',`ud`.`username`,'dept',json_object('deptId',`d`.`deptId`,'name',`d`.`name`)) else NULL end) AS `reviewers` from (((`stig_asset_map` `sa` left join `user_stig_asset_map` `usa` on((`sa`.`saId` = `usa`.`saId`))) left join `user_data` `ud` on((`usa`.`userId` = `ud`.`userId`))) left join `department` `d` on((`ud`.`deptId` = `d`.`deptId`)))) `r` group by `r`.`assetId`,`r`.`benchmarkId`) `byAsset` group by `byAsset`.`assetId` */;
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
/*!50013 DEFINER=`stigman`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `current_rev` AS select `rr`.`revId` AS `revId`,`rr`.`benchmarkId` AS `benchmarkId`,`rr`.`version` AS `version`,`rr`.`release` AS `release`,`rr`.`benchmarkDate` AS `benchmarkDate`,`rr`.`benchmarkDateSql` AS `benchmarkDateSql`,`rr`.`status` AS `status`,`rr`.`statusDate` AS `statusDate`,`rr`.`description` AS `description`,`rr`.`active` AS `active`,`rr`.`rn` AS `rn` from (select `r`.`revId` AS `revId`,`r`.`benchmarkId` AS `benchmarkId`,`r`.`version` AS `version`,`r`.`release` AS `release`,`r`.`benchmarkDate` AS `benchmarkDate`,`r`.`benchmarkDateSql` AS `benchmarkDateSql`,`r`.`status` AS `status`,`r`.`statusDate` AS `statusDate`,`r`.`description` AS `description`,`r`.`active` AS `active`,row_number() OVER (PARTITION BY `r`.`benchmarkId` ORDER BY (`r`.`version` + 0) desc,(`r`.`release` + 0) desc )  AS `rn` from `revision` `r`) `rr` where (`rr`.`rn` = 1) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `rule_cci_map`
--

/*!50001 DROP VIEW IF EXISTS `rule_cci_map`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`stigman`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `rule_cci_map` AS select distinct `rgr`.`ruleId` AS `ruleId`,`rgrc`.`cci` AS `cci` from (`rev_group_rule_cci_map` `rgrc` left join `rev_group_rule_map` `rgr` on((`rgrc`.`rgrId` = `rgr`.`rgrId`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_review_history_jsonarray`
--

/*!50001 DROP VIEW IF EXISTS `v_review_history_jsonarray`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`stigman`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_review_history_jsonarray` AS select `rh`.`assetId` AS `assetId`,`rh`.`ruleId` AS `ruleId`,json_arrayagg(json_object('ts',date_format(`rh`.`ts`,'%Y-%m-%dT%H:%i:%s'),'activityType',`rh`.`activityType`,'columnName',`rh`.`columnname`,'oldValue',`rh`.`oldValue`,'newValue',`rh`.`newValue`,'userId',`rh`.`userId`,'\n username',`ud`.`username`)) OVER (ORDER BY `rh`.`ts` desc )  AS `h`,row_number() OVER (ORDER BY `rh`.`ts` )  AS `rn` from (`review_history` `rh` left join `user_data` `ud` on((`ud`.`userId` = `rh`.`userId`))) */;
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

-- Dump completed on 2020-06-04 12:24:13
