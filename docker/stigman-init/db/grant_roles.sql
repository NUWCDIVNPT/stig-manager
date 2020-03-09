set define on;
connect sys/&&sys_pw as sysdba;
alter session set container=&&container_name;

grant &&stigs_role to stigman;
grant &&iacontrols_role to stigman;
grant &&stig_import_jobs_role to stigman;
grant &&stig_import_jobs_role to stigs;
grant &&stigman_role to stigs;
grant &&iacontrols_role to stigs;
ALTER USER stigman DEFAULT ROLE &&iacontrols_role, &&stigs_role, &&stig_import_jobs_role;
ALTER USER stigs DEFAULT ROLE &&stigman_role, &&iacontrols_role, &&stig_import_jobs_role;
