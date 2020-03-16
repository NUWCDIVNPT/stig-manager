prompt connecting to stigman
connect stigman/stigman@orclpdb1;
Insert into stigman.USER_DATA (CN,NAME,DEPT,ROLEID,CANADMIN) values ('admin','admin',1,4,1);
commit;
exit
