-- MySQL dump 10.13  Distrib 8.0.33, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: stigman
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `result`
--

LOCK TABLES `result` WRITE;
/*!40000 ALTER TABLE `result` DISABLE KEYS */;
INSERT INTO `result` VALUES (1,'notchecked','Not_Reviewed','not_reviewed','NR','Not checked'),(2,'notapplicable','Not_Applicable','not_applicable','NA','Not Applicable'),(3,'pass','NotAFinding','not_a_finding','NF','Not a Finding'),(4,'fail','Open','open','O','Open'),(5,'unknown','Not_Reviewed','not_reviewed','U','Unknown'),(6,'error','Not_Reviewed','not_reviewed','E','Error'),(7,'notselected','Not_Reviewed','not_reviewed','NS','Not selected'),(8,'informational','Not_Reviewed','not_reviewed','I','Informational'),(9,'fixed','NotAFinding','not_a_finding','NF','Fixed');
/*!40000 ALTER TABLE `result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `status`
--

LOCK TABLES `status` WRITE;
/*!40000 ALTER TABLE `status` DISABLE KEYS */;
INSERT INTO `status` VALUES (0,'saved','Saved'),(1,'submitted','Submitted'),(2,'rejected','Rejected'),(3,'accepted','Accepted');
/*!40000 ALTER TABLE `status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `_migrations`
--

LOCK TABLES `_migrations` WRITE;
/*!40000 ALTER TABLE `_migrations` DISABLE KEYS */;
INSERT INTO `_migrations` VALUES ('2025-10-01 04:05:27',NULL,'0000.js'),('2025-10-01 04:05:27',NULL,'0001.js'),('2025-10-01 04:05:27',NULL,'0002.js'),('2025-10-01 04:05:28',NULL,'0003.js'),('2025-10-01 04:05:28',NULL,'0004.js'),('2025-10-01 04:05:28',NULL,'0005.js'),('2025-10-01 04:05:28',NULL,'0006.js'),('2025-10-01 04:05:29',NULL,'0007.js'),('2025-10-01 04:05:30',NULL,'0008.js'),('2025-10-01 04:05:30',NULL,'0009.js'),('2025-10-01 04:05:30',NULL,'0010.js'),('2025-10-01 04:05:31',NULL,'0011.js'),('2025-10-01 04:05:31',NULL,'0012.js'),('2025-10-01 04:05:31',NULL,'0013.js'),('2025-10-01 04:05:31',NULL,'0014.js'),('2025-10-01 04:05:32',NULL,'0015.js'),('2025-10-01 04:05:32',NULL,'0016.js'),('2025-10-01 04:05:33',NULL,'0017.js'),('2025-10-01 04:05:33',NULL,'0018.js'),('2025-10-01 04:05:34',NULL,'0019.js'),('2025-10-01 04:05:36',NULL,'0020.js'),('2025-10-01 04:05:36',NULL,'0021.js'),('2025-10-01 04:05:37',NULL,'0022.js'),('2025-10-01 04:05:37',NULL,'0023.js'),('2025-10-01 04:05:37',NULL,'0024.js'),('2025-10-01 04:05:38',NULL,'0025.js'),('2025-10-01 04:05:38',NULL,'0026.js'),('2025-10-01 04:05:38',NULL,'0027.js'),('2025-10-01 04:05:38',NULL,'0028.js'),('2025-10-01 04:05:38',NULL,'0029.js'),('2025-10-01 04:05:38',NULL,'0032.js'),('2025-10-01 04:05:38',NULL,'0033.js'),('2025-10-01 04:05:38',NULL,'0034.js'),('2025-10-01 04:05:38',NULL,'0035.js'),('2025-10-01 04:05:39',NULL,'0036.js'),('2025-10-01 04:05:40',NULL,'0037.js'),('2025-10-01 04:05:41',NULL,'0038.js'),('2025-10-01 04:05:41',NULL,'0039.js'),('2025-10-01 04:05:41',NULL,'0040.js'),('2025-10-01 04:05:42',NULL,'0041.js'),('2025-10-01 04:05:42',NULL,'0042.js'),('2025-10-01 04:05:42',NULL,'0043.js'),('2025-10-01 04:05:49',NULL,'0044.js');
/*!40000 ALTER TABLE `_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-01 13:07:28
