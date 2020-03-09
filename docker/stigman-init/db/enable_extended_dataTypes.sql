connect sys/&&sys_pw as sysdba;
alter session set container=&&container_name;
shutdown immediate;
startup upgrade;
alter system set max_string_size=extended;
start $ORACLE_HOME/rdbms/admin/utl32k.sql;
shutdown immediate;
startup;
