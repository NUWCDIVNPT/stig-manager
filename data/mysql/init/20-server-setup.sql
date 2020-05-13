CREATE USER 'stigman' IDENTIFIED BY 'stigman';
GRANT ALL ON stigman.* TO 'stigman'@'%';
GRANT ALL ON stig.* TO 'stigman'@'%';
-- Below is to workaround bug in MySQL Workbench 8.0.16+ 
grant select on performance_schema.* to 'stigman'@'%';
grant select on performance_schema.* to 'root'@'%';
-- Set server system variables
SET PERSIST group_concat_max_len=1000000;
SET PERSIST local_infile = 1;
-- To use sqlines utility sqldata
CREATE DATABASE `ORA_STIGMAN`;
GRANT ALL ON `ORA_STIGMAN`.* TO 'stigman'@'%';
