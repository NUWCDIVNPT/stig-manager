connect sys/&&sys_pw&&our_container_service as sysdba;
-- connect sys/&&sys_pw&&our_service as sysdba;
alter session set container=&&container_name;
shutdown immediate;
startup upgrade;
alter system set max_string_size=extended;
start /stigman-init/db/utl32k.sql;
shutdown immediate;
startup;
