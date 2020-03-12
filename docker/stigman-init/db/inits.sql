set define on;
DEFINE sys_pw=Oradoc_db1
DEFINE container_name=orclpdb1
DEFINE iacontrols_password=iacontrols
DEFINE iacontrols_role=role_iacontrols
DEFINE stigman_password=stigman
DEFINE stigman_role=role_stigman
DEFINE stig_import_jobs_password=stig_import_jobs
DEFINE stig_import_jobs_role=role_stig_import_jobs
DEFINE stigs_password=stigs
DEFINE stigs_role=role_stigs
DEFINE our_service=@db/orclcdb.localdomain
DEFINE our_container_service=@db/orclpdb1.localdomain

connect sys/&&sys_pw&&our_service as sysdba;
alter session set container=&&container_name;

@@enable_extended_dataTypes.sql

@@create-roles

@@iacontrols_create.sql
@@iacontrols_static_data_circumflex.sql

@@stigman_create.sql
@@stigman_static_data.sql

@@stig-import-jobs_create.sql

@@stigs_create.sql

@@grant_roles.sql

exit
