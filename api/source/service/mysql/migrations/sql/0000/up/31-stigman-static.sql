-- MySQL dump 10.13  Distrib 8.0.18, for Linux (x86_64)
--
-- Host: 192.168.1.155    Database: stigman
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

--
-- Dumping data for table `action`
--

LOCK TABLES `action` WRITE;
/*!40000 ALTER TABLE `action` DISABLE KEYS */;
INSERT INTO `action` VALUES (1,'remediate','Remediate'),(2,'mitigate','Mitigate'),(3,'exception','Exception');
/*!40000 ALTER TABLE `action` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `reject_string`
--

LOCK TABLES `reject_string` WRITE;
/*!40000 ALTER TABLE `reject_string` DISABLE KEYS */;
INSERT INTO `reject_string` VALUES (1,'Evaluation comment not specific.','The comment supporting the result of the evaluation does not contain enough specific information. Comments should mention the specific setting(s) or value(s) contained in the check text.'),(2,'Recommendation comment not specific.','The comment describing the recommended action is not specific.'),(3,'Documentation is not attached.','The review requires the submission of documentation for the result of the evaluation to be accepted.');
/*!40000 ALTER TABLE `reject_string` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `state`
--

LOCK TABLES `result` WRITE;
/*!40000 ALTER TABLE `result` DISABLE KEYS */;
INSERT INTO `result` VALUES (1,'notchecked','Not_Reviewed','NR','Not checked'),
(2,'notapplicable','Not_Applicable','NA','Not Applicable'),
(3,'pass','NotAFinding','NF','Not a Finding'),
(4,'fail','Open','O','Open'),
(5,'unknown','Not_Reviewed','U','Unknown'),
(6,'error','Not_Reviewed','E','Error'),
(7,'notselected','Not_Reviewed','NS','Not selected'),
(8,'informational','Not_Reviewed','I','Informational'),
(9,'fixed','NotAFinding','NF','Fixed');
/*!40000 ALTER TABLE `result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `severity_cat_map`
--

LOCK TABLES `severity_cat_map` WRITE;
/*!40000 ALTER TABLE `severity_cat_map` DISABLE KEYS */;
INSERT INTO `severity_cat_map` VALUES (1,'high',1,'I'),(2,'medium',2,'II'),(3,'low',3,'III'),(4,'mixed',4,'IV');
/*!40000 ALTER TABLE `severity_cat_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `status`
--

LOCK TABLES `status` WRITE;
/*!40000 ALTER TABLE `status` DISABLE KEYS */;
INSERT INTO `status` VALUES (0,'saved','Saved'),
(1,'submitted','Submitted'),
(2,'rejected','Rejected'),
(3,'accepted','Accepted');
/*!40000 ALTER TABLE `status` ENABLE KEYS */;
UNLOCK TABLES;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2020-05-13 14:47:04
