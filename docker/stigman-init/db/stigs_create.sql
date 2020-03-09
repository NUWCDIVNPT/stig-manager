
SET ECHO ON
SET VERIFY ON
SET FEEDBACK OFF
CLEAR SCREEN
set serveroutput on


set define on;
connect sys/&&sys_pw as sysdba;
alter session set container=&&container_name;

-- PROMPT Creating Role &&stigs_role ...
-- CREATE ROLE &&stigs_role ;

PROMPT Create user stigs
CREATE USER stigs IDENTIFIED BY &&stigs_password DEFAULT 
TABLESPACE USERS TEMPORARY TABLESPACE TEMP QUOTA UNLIMITED ON USERS;
GRANT CREATE SESSION, RESOURCE, CREATE VIEW, CREATE MATERIALIZED VIEW, 
CREATE SYNONYM, UNLIMITED TABLESPACE TO stigs;

set define on
-- prompt connecting to stigs
-- connect stigs/&&stigs_password@&&container_name;


--------------------------------------------------------
--  DDL for Table CHECKS
--------------------------------------------------------

  CREATE TABLE "STIGS"."CHECKS" 
   (	"CHECKID" VARCHAR2(255 CHAR), 
	"CONTENT" VARCHAR2(32000 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT READ ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."CHECKS" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."CHECKS" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table CURRENT_GROUP_RULES
--------------------------------------------------------

  CREATE TABLE "STIGS"."CURRENT_GROUP_RULES" 
   (	"GROUPID" VARCHAR2(50 CHAR), 
	"RULEID" VARCHAR2(255 CHAR), 
	"STIGID" VARCHAR2(255 CHAR)
   ) ;
  GRANT DELETE ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT ALTER ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT READ ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."CURRENT_GROUP_RULES" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."CURRENT_GROUP_RULES" TO "STIGMAN";
--------------------------------------------------------
--  DDL for Table CURRENT_REVS
--------------------------------------------------------

  CREATE TABLE "STIGS"."CURRENT_REVS" 
   (	"REVID" VARCHAR2(255 CHAR), 
	"STIGID" VARCHAR2(255 CHAR), 
	"VERSION" NUMBER(10,0), 
	"RELEASE" VARCHAR2(45 CHAR), 
	"BENCHMARKDATE" VARCHAR2(45 CHAR), 
	"BENCHMARKDATESQL" DATE, 
	"STATUS" VARCHAR2(45 CHAR), 
	"STATUSDATE" VARCHAR2(45 CHAR), 
	"DESCRIPTION" VARCHAR2(4000 CHAR), 
	"ACTIVE" NUMBER(3,0) DEFAULT '1'
   ) ;
  GRANT ALTER ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT READ ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."CURRENT_REVS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."CURRENT_REVS" TO "STIGMAN";
--------------------------------------------------------
--  DDL for Table FIXES
--------------------------------------------------------

  CREATE TABLE "STIGS"."FIXES" 
   (	"FIXID" VARCHAR2(45 CHAR), 
	"TEXT" CLOB
   ) ;
  GRANT ALTER ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT READ ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."FIXES" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."FIXES" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table GROUPS
--------------------------------------------------------

  CREATE TABLE "STIGS"."GROUPS" 
   (	"GROUPID" VARCHAR2(45 CHAR), 
	"TITLE" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT READ ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."GROUPS" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."GROUPS" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table REVISIONS
--------------------------------------------------------

  CREATE TABLE "STIGS"."REVISIONS" 
   (	"REVID" VARCHAR2(255 CHAR), 
	"STIGID" VARCHAR2(255 CHAR), 
	"VERSION" NUMBER(10,0), 
	"RELEASE" VARCHAR2(45 CHAR), 
	"BENCHMARKDATE" VARCHAR2(45 CHAR), 
	"BENCHMARKDATESQL" DATE, 
	"STATUS" VARCHAR2(45 CHAR), 
	"STATUSDATE" VARCHAR2(45 CHAR), 
	"DESCRIPTION" VARCHAR2(4000 CHAR), 
	"ACTIVE" NUMBER(3,0) DEFAULT '1', 
	"SHA1" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT READ ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."REVISIONS" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."REVISIONS" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table REV_GROUP_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."REV_GROUP_MAP" 
   (	"RGID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 263717 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"GROUPID" VARCHAR2(45 CHAR), 
	"REVID" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."REV_GROUP_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table REV_GROUP_RULE_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."REV_GROUP_RULE_MAP" 
   (	"RGRID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 263857 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"RGID" NUMBER(10,0), 
	"RULEID" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."REV_GROUP_RULE_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table REV_PROFILE_GROUP_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."REV_PROFILE_GROUP_MAP" 
   (	"RPGID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 2364026 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"REVID" VARCHAR2(255 CHAR), 
	"PROFILE" VARCHAR2(45 CHAR), 
	"GROUPID" VARCHAR2(45 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."REV_PROFILE_GROUP_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table REV_XML_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."REV_XML_MAP" 
   (	"RXID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 2676 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"REVID" VARCHAR2(255 CHAR), 
	"XML" BLOB
   ) ;
  GRANT ALTER ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."REV_XML_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table RULES
--------------------------------------------------------

  CREATE TABLE "STIGS"."RULES" 
   (	"RULEID" VARCHAR2(255 CHAR), 
	"VERSION" VARCHAR2(45 CHAR), 
	"TITLE" VARCHAR2(4000 CHAR), 
	"SEVERITY" VARCHAR2(45 CHAR), 
	"WEIGHT" VARCHAR2(45 CHAR), 
	"VULNDISCUSSION" VARCHAR2(32000 CHAR), 
	"FALSEPOSITIVES" VARCHAR2(4000 CHAR), 
	"FALSENEGATIVES" VARCHAR2(4000 CHAR), 
	"DOCUMENTABLE" VARCHAR2(45 CHAR), 
	"MITIGATIONS" VARCHAR2(4000 CHAR), 
	"SECURITYOVERRIDEGUIDANCE" VARCHAR2(4000 CHAR), 
	"POTENTIALIMPACTS" VARCHAR2(4000 CHAR), 
	"THIRDPARTYTOOLS" VARCHAR2(4000 CHAR), 
	"MITIGATIONCONTROL" VARCHAR2(32000 CHAR), 
	"RESPONSIBILITY" VARCHAR2(255 CHAR), 
	"IACONTROLS" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."RULES" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."RULES" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."RULES" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."RULES" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."RULES" TO &&stigs_role;
  GRANT READ ON "STIGS"."RULES" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."RULES" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."RULES" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."RULES" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."RULES" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table RULE_CHECK_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."RULE_CHECK_MAP" 
   (	"RCID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 266797 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"RULEID" VARCHAR2(255 CHAR), 
	"CHECKID" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."RULE_CHECK_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table RULE_CONTROL_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."RULE_CONTROL_MAP" 
   (	"RCTLID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 303723 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"RULEID" VARCHAR2(255 CHAR), 
	"CONTROLNUMBER" VARCHAR2(60 BYTE), 
	"CONTROLTYPE" VARCHAR2(60 BYTE)
   ) ;
  GRANT ALTER ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."RULE_CONTROL_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table RULE_FIX_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."RULE_FIX_MAP" 
   (	"RFID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 263611 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"RULEID" VARCHAR2(255 CHAR), 
	"FIXID" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."RULE_FIX_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table RULE_OVAL_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."RULE_OVAL_MAP" 
   (	"ROID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 54978 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"RULEID" VARCHAR2(255 CHAR), 
	"OVALREF" VARCHAR2(255 CHAR), 
	"BENCHMARKID" VARCHAR2(255 CHAR), 
	"RELEASEINFO" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."RULE_OVAL_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table SEVERITY_CAT_MAP
--------------------------------------------------------

  CREATE TABLE "STIGS"."SEVERITY_CAT_MAP" 
   (	"ID" NUMBER(10,0) GENERATED BY DEFAULT AS IDENTITY MINVALUE 1 MAXVALUE 9999999999999999999999999999 INCREMENT BY 1 START WITH 5 CACHE 20 NOORDER  NOCYCLE  NOKEEP  NOSCALE , 
	"SEVERITY" VARCHAR2(45 CHAR), 
	"CAT" VARCHAR2(45 CHAR), 
	"ROMAN" VARCHAR2(45 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT READ ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."SEVERITY_CAT_MAP" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Table STIGS
--------------------------------------------------------

  CREATE TABLE "STIGS"."STIGS" 
   (	"STIGID" VARCHAR2(255 CHAR), 
	"TITLE" VARCHAR2(255 CHAR)
   ) ;
  GRANT ALTER ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT DELETE ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT INSERT ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT SELECT ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT UPDATE ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT READ ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT ON COMMIT REFRESH ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT QUERY REWRITE ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT DEBUG ON "STIGS"."STIGS" TO &&stigs_role;
  GRANT FLASHBACK ON "STIGS"."STIGS" TO &&stigs_role;
--------------------------------------------------------
--  DDL for Index PRIMARY_6
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_6" ON "STIGS"."CURRENT_REVS" ("REVID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_16
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_16" ON "STIGS"."RULE_FIX_MAP" ("RFID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_2
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_2" ON "STIGS"."RULE_CHECK_MAP" ("RULEID", "CHECKID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_17
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_17" ON "STIGS"."RULE_OVAL_MAP" ("ROID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_7
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_7" ON "STIGS"."FIXES" ("FIXID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_11
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_11" ON "STIGS"."REV_PROFILE_GROUP_MAP" ("RPGID") 
  ;
--------------------------------------------------------
--  DDL for Index GROUPID
--------------------------------------------------------

  CREATE INDEX "STIGS"."GROUPID" ON "STIGS"."CURRENT_GROUP_RULES" ("GROUPID") 
  ;
--------------------------------------------------------
--  DDL for Index STIGID
--------------------------------------------------------

  CREATE INDEX "STIGS"."STIGID" ON "STIGS"."CURRENT_GROUP_RULES" ("STIGID") 
  ;
--------------------------------------------------------
--  DDL for Index GROUPID_RULEID_STIGID
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."GROUPID_RULEID_STIGID" ON "STIGS"."CURRENT_GROUP_RULES" ("GROUPID", "RULEID", "STIGID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_3
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_3" ON "STIGS"."RULE_CONTROL_MAP" ("RULEID", "CONTROLNUMBER") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_19
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_19" ON "STIGS"."SEVERITY_CAT_MAP" ("ID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3_5
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3_5" ON "STIGS"."REV_GROUP_MAP" ("REVID") 
  ;
--------------------------------------------------------
--  DDL for Index RULEID
--------------------------------------------------------

  CREATE INDEX "STIGS"."RULEID" ON "STIGS"."CURRENT_GROUP_RULES" ("RULEID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY" ON "STIGS"."CHECKS" ("CHECKID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_13
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_13" ON "STIGS"."REVISIONS" ("REVID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_5
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_5" ON "STIGS"."RULE_OVAL_MAP" ("RULEID", "OVALREF", "BENCHMARKID", "RELEASEINFO") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_4
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_4" ON "STIGS"."REV_PROFILE_GROUP_MAP" ("GROUPID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_2" ON "STIGS"."CURRENT_REVS" ("STIGID") 
  ;
--------------------------------------------------------
--  DDL for Index DUPIDX
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."DUPIDX" ON "STIGS"."REV_XML_MAP" ("REVID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_18
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_18" ON "STIGS"."RULES" ("RULEID", "VERSION") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_15
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_15" ON "STIGS"."RULE_CONTROL_MAP" ("RCTLID") 
  ;
--------------------------------------------------------
--  DDL for Index TITLE
--------------------------------------------------------

  CREATE INDEX "STIGS"."TITLE" ON "STIGS"."STIGS" ("TITLE") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_19_C
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_19_C" ON "STIGS"."REV_PROFILE_GROUP_MAP" ("REVID", "PROFILE", "GROUPID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_12
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_12" ON "STIGS"."REV_XML_MAP" ("RXID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3_4
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3_4" ON "STIGS"."REV_PROFILE_GROUP_MAP" ("PROFILE") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_1_1
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_1_1" ON "STIGS"."REV_GROUP_RULE_MAP" ("RULEID", "RGID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_4
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_4" ON "STIGS"."RULE_FIX_MAP" ("RULEID", "FIXID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_5
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_5" ON "STIGS"."STIGS" ("STIGID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3" ON "STIGS"."REV_GROUP_RULE_MAP" ("RGID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_1
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."INDEX_2_1" ON "STIGS"."REV_GROUP_MAP" ("GROUPID", "REVID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_2_19
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_2_19" ON "STIGS"."REVISIONS" ("STIGID", "VERSION", "RELEASE") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3_2
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3_2" ON "STIGS"."RULE_CONTROL_MAP" ("CONTROLNUMBER") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3_1
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3_1" ON "STIGS"."RULE_FIX_MAP" ("FIXID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_8
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_8" ON "STIGS"."GROUPS" ("GROUPID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_10
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_10" ON "STIGS"."REV_GROUP_RULE_MAP" ("RGRID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_9
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_9" ON "STIGS"."REV_GROUP_MAP" ("RGID") 
  ;
--------------------------------------------------------
--  DDL for Index PRIMARY_14
--------------------------------------------------------

  CREATE UNIQUE INDEX "STIGS"."PRIMARY_14" ON "STIGS"."RULE_CHECK_MAP" ("RCID") 
  ;
--------------------------------------------------------
--  DDL for Index INDEX_3_3
--------------------------------------------------------

  CREATE INDEX "STIGS"."INDEX_3_3" ON "STIGS"."RULE_CHECK_MAP" ("CHECKID") 
  ;
--------------------------------------------------------
--  Constraints for Table CURRENT_REVS
--------------------------------------------------------

  ALTER TABLE "STIGS"."CURRENT_REVS" MODIFY ("REVID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."CURRENT_REVS" MODIFY ("STIGID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."CURRENT_REVS" MODIFY ("VERSION" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."CURRENT_REVS" MODIFY ("RELEASE" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."CURRENT_REVS" ADD CONSTRAINT "PRIMARY_6" PRIMARY KEY ("REVID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table RULES
--------------------------------------------------------

  ALTER TABLE "STIGS"."RULES" MODIFY ("RULEID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULES" MODIFY ("VERSION" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULES" ADD CONSTRAINT "PRIMARY_18" PRIMARY KEY ("RULEID", "VERSION")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table RULE_CONTROL_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."RULE_CONTROL_MAP" MODIFY ("RCTLID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CONTROL_MAP" MODIFY ("RULEID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CONTROL_MAP" MODIFY ("CONTROLNUMBER" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CONTROL_MAP" ADD CONSTRAINT "PRIMARY_15" PRIMARY KEY ("RCTLID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."RULE_CONTROL_MAP" ADD CONSTRAINT "INDEX_2_3" UNIQUE ("RULEID", "CONTROLNUMBER")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table CURRENT_GROUP_RULES
--------------------------------------------------------

  ALTER TABLE "STIGS"."CURRENT_GROUP_RULES" ADD CONSTRAINT "GROUPID_RULEID_STIGID" UNIQUE ("GROUPID", "RULEID", "STIGID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table GROUPS
--------------------------------------------------------

  ALTER TABLE "STIGS"."GROUPS" MODIFY ("GROUPID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."GROUPS" ADD CONSTRAINT "PRIMARY_8" PRIMARY KEY ("GROUPID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table REV_PROFILE_GROUP_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."REV_PROFILE_GROUP_MAP" MODIFY ("RPGID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_PROFILE_GROUP_MAP" ADD CONSTRAINT "PRIMARY_11" PRIMARY KEY ("RPGID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."REV_PROFILE_GROUP_MAP" ADD CONSTRAINT "INDEX_2_19_C" UNIQUE ("REVID", "PROFILE", "GROUPID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table REVISIONS
--------------------------------------------------------

  ALTER TABLE "STIGS"."REVISIONS" MODIFY ("REVID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REVISIONS" MODIFY ("STIGID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REVISIONS" MODIFY ("VERSION" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REVISIONS" MODIFY ("RELEASE" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REVISIONS" ADD CONSTRAINT "PRIMARY_13" PRIMARY KEY ("REVID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table RULE_CHECK_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."RULE_CHECK_MAP" MODIFY ("RCID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CHECK_MAP" MODIFY ("RULEID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CHECK_MAP" MODIFY ("CHECKID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_CHECK_MAP" ADD CONSTRAINT "PRIMARY_14" PRIMARY KEY ("RCID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."RULE_CHECK_MAP" ADD CONSTRAINT "INDEX_2_2" UNIQUE ("RULEID", "CHECKID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table RULE_FIX_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."RULE_FIX_MAP" MODIFY ("RFID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_FIX_MAP" MODIFY ("RULEID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_FIX_MAP" MODIFY ("FIXID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_FIX_MAP" ADD CONSTRAINT "PRIMARY_16" PRIMARY KEY ("RFID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."RULE_FIX_MAP" ADD CONSTRAINT "INDEX_2_4" UNIQUE ("RULEID", "FIXID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table RULE_OVAL_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."RULE_OVAL_MAP" MODIFY ("ROID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_OVAL_MAP" MODIFY ("RULEID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_OVAL_MAP" MODIFY ("BENCHMARKID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."RULE_OVAL_MAP" ADD CONSTRAINT "PRIMARY_17" PRIMARY KEY ("ROID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."RULE_OVAL_MAP" ADD CONSTRAINT "INDEX_2_5" UNIQUE ("RULEID", "OVALREF", "BENCHMARKID", "RELEASEINFO")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table SEVERITY_CAT_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."SEVERITY_CAT_MAP" MODIFY ("ID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."SEVERITY_CAT_MAP" MODIFY ("SEVERITY" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."SEVERITY_CAT_MAP" MODIFY ("CAT" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."SEVERITY_CAT_MAP" MODIFY ("ROMAN" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."SEVERITY_CAT_MAP" ADD CONSTRAINT "PRIMARY_19" PRIMARY KEY ("ID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table CHECKS
--------------------------------------------------------

  ALTER TABLE "STIGS"."CHECKS" MODIFY ("CHECKID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."CHECKS" ADD CONSTRAINT "PRIMARY" PRIMARY KEY ("CHECKID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table STIGS
--------------------------------------------------------

  ALTER TABLE "STIGS"."STIGS" MODIFY ("STIGID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."STIGS" MODIFY ("TITLE" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."STIGS" ADD CONSTRAINT "PRIMARY_5" PRIMARY KEY ("STIGID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table REV_XML_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."REV_XML_MAP" MODIFY ("RXID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_XML_MAP" MODIFY ("REVID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_XML_MAP" ADD CONSTRAINT "PRIMARY_12" PRIMARY KEY ("RXID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."REV_XML_MAP" ADD CONSTRAINT "DUPIDX" UNIQUE ("REVID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table FIXES
--------------------------------------------------------

  ALTER TABLE "STIGS"."FIXES" MODIFY ("FIXID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."FIXES" MODIFY ("TEXT" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."FIXES" ADD CONSTRAINT "PRIMARY_7" PRIMARY KEY ("FIXID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table REV_GROUP_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."REV_GROUP_MAP" MODIFY ("RGID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_GROUP_MAP" MODIFY ("GROUPID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_GROUP_MAP" MODIFY ("REVID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_GROUP_MAP" ADD CONSTRAINT "PRIMARY_9" PRIMARY KEY ("RGID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."REV_GROUP_MAP" ADD CONSTRAINT "INDEX_2_1" UNIQUE ("GROUPID", "REVID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Constraints for Table REV_GROUP_RULE_MAP
--------------------------------------------------------

  -- ALTER TABLE "STIGS"."REV_GROUP_RULE_MAP" MODIFY ("RGRID" NOT NULL ENABLE);
  ALTER TABLE "STIGS"."REV_GROUP_RULE_MAP" ADD CONSTRAINT "PRIMARY_10" PRIMARY KEY ("RGRID")
  USING INDEX  ENABLE;
  ALTER TABLE "STIGS"."REV_GROUP_RULE_MAP" ADD CONSTRAINT "INDEX_2_1_1" UNIQUE ("RULEID", "RGID")
  USING INDEX  ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table REVISIONS
--------------------------------------------------------

  ALTER TABLE "STIGS"."REVISIONS" ADD CONSTRAINT "FK_STIGID" FOREIGN KEY ("STIGID")
	  REFERENCES "STIGS"."STIGS" ("STIGID") ON DELETE CASCADE ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table REV_GROUP_MAP
--------------------------------------------------------

  ALTER TABLE "STIGS"."REV_GROUP_MAP" ADD CONSTRAINT "FK_REVID" FOREIGN KEY ("REVID")
	  REFERENCES "STIGS"."REVISIONS" ("REVID") ON DELETE CASCADE ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table REV_GROUP_RULE_MAP
--------------------------------------------------------

  ALTER TABLE "STIGS"."REV_GROUP_RULE_MAP" ADD CONSTRAINT "FK_RGID" FOREIGN KEY ("RGID")
	  REFERENCES "STIGS"."REV_GROUP_MAP" ("RGID") ON DELETE CASCADE ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table REV_PROFILE_GROUP_MAP
--------------------------------------------------------

  ALTER TABLE "STIGS"."REV_PROFILE_GROUP_MAP" ADD CONSTRAINT "FK_REVPROFILEGROUPMAP_1" FOREIGN KEY ("REVID")
	  REFERENCES "STIGS"."REVISIONS" ("REVID") ON DELETE CASCADE ENABLE;
--------------------------------------------------------
--  Ref Constraints for Table REV_XML_MAP
--------------------------------------------------------

  ALTER TABLE "STIGS"."REV_XML_MAP" ADD CONSTRAINT "FK_REVXMLMAP_1" FOREIGN KEY ("REVID")
	  REFERENCES "STIGS"."REVISIONS" ("REVID") ON DELETE CASCADE ENABLE;
