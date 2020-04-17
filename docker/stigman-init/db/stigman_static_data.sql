--------------------------------------------------------
--  File created - Tuesday-September-15-2015   
--------------------------------------------------------
-- set sqlbl on;
set define on
-- prompt connecting to stigman
-- connect stigman/&&stigman_password@&&container_name;
SET DEFINE OFF;
Insert into stigman.ACTIONS (ACTIONID,ACTION) values (1,'Remediate');
Insert into stigman.ACTIONS (ACTIONID,ACTION) values (2,'Mitigate');
Insert into stigman.ACTIONS (ACTIONID,ACTION) values (3,'Exception');
commit;
SET DEFINE OFF;
Insert into stigman.ROLES (ID,ROLE,ROLEDISPLAY) values (2,'IAWF','IA Workforce');
Insert into stigman.ROLES (ID,ROLE,ROLEDISPLAY) values (3,'IAO','IA Officer');
Insert into stigman.ROLES (ID,ROLE,ROLEDISPLAY) values (4,'Staff','IA Staff');
commit;
SET DEFINE OFF;
Insert into stigman.STATES (STATEID,STATE,ABBR) values (1,'In Process','IP');
Insert into stigman.STATES (STATEID,STATE,ABBR) values (2,'Not Applicable','NA');
Insert into stigman.STATES (STATEID,STATE,ABBR) values (3,'Not a Finding','NF');
Insert into stigman.STATES (STATEID,STATE,ABBR) values (4,'Open','O');
commit;
SET DEFINE OFF;
Insert into stigman.STATUSES (STATUSID,STATUSSTR) values (0,'saved');
Insert into stigman.STATUSES (STATUSID,STATUSSTR) values (1,'submitted');
Insert into stigman.STATUSES (STATUSID,STATUSSTR) values (2,'rejected');
Insert into stigman.STATUSES (STATUSID,STATUSSTR) values (3,'approved');
commit;
SET DEFINE OFF;
Insert into stigman.REJECT_STRINGS (REJECTID,SHORTSTR,LONGSTR) values (1,'Evaluation comment not specific.','The comment supporting the result of the evaluation does not contain enough specific information. Comments should mention the specific setting(s) or value(s) contained in the check text.');
Insert into stigman.REJECT_STRINGS (REJECTID,SHORTSTR,LONGSTR) values (2,'Recommendation comment not specific.','The comment describing the recommended action is not specific.');
Insert into stigman.REJECT_STRINGS (REJECTID,SHORTSTR,LONGSTR) values (3,'Documentation is not attached.','The review requires the submission of documentation for the result of the evaluation to be accepted.');
commit;
