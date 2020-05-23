SET ECHO ON
shutdown immediate;
startup restrict;

alter database character set INTERNAL_USE AL32UTF8;
shutdown immediate;
startup;

alter session set container=orclpdb1;
shutdown immediate;
startup restrict;

alter database character set INTERNAL_USE AL32UTF8;
shutdown immediate;
startup upgrade;

alter system set max_string_size=extended;
@?/rdbms/admin/utl32k.sql
shutdown immediate;
startup;

CREATE USER stigman IDENTIFIED BY stigman DEFAULT TABLESPACE USERS TEMPORARY TABLESPACE TEMP QUOTA UNLIMITED ON USERS;
GRANT CREATE SESSION, RESOURCE, CREATE VIEW, CREATE MATERIALIZED VIEW, CREATE SYNONYM, UNLIMITED TABLESPACE TO stigman;
