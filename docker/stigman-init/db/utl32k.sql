aRem
Rem $Header: rdbms/admin/utl32k.sql /st_rdbms_12.2.0.1.0/1 2016/08/06 02:27:50 geadon Exp $
Rem
Rem utl32k.sql
Rem
Rem Copyright (c) 2011, 2016, Oracle and/or its affiliates. 
Rem All rights reserved.
Rem
Rem    NAME
Rem      utl32k.sql - <one-line expansion of the name>
Rem
Rem    DESCRIPTION
Rem      <short description of component this file declares/defines>
Rem
Rem    NOTES
Rem      <other useful comments, qualifications, etc.>
Rem
Rem    MODIFIED   (MM/DD/YY)
Rem    geadon      07/21/16 - XbranchMerge geadon_bug-22650793 from main
Rem    geadon      03/28/16 - bug 22375145: add ORDER BY for column migration
Rem    sjanardh    11/25/15 - Replace dbms_aqadm_syscalls APIs w/ dbms_aqadm_sys APIs
Rem    acolunga    11/05/15 - bug 21996904: do not update virtual columns in
Rem                           xml index path tables.
Rem    geadon      09/28/15 - bug 21907429: enable AQ DDL
Rem    rafsanto    09/10/15 - Bug 21793725: Let DDL through for csx tokensets
Rem    sanagara    08/12/15 - 21615157: use DBMS_SQL.DESCRIBE_COLUMNS3
Rem    rafsanto    06/03/15 - Bug 20911289 - Let DML go through for csx
Rem                           tokenset objects
Rem    pjayapal    10/28/14 - bug 19063812: procedure to parse mv defn query
Rem    geadon      11/20/13 - bug 16894689: run utlrp.sql in normal mode
Rem    geadon      02/26/13 - bug 16237862: long col names for describe_columns
Rem    geadon      09/24/12 - bug 13824121: fix PROPS$ property name
Rem    geadon      03/14/12 - bug 13332548: enforce utl32k upgrade for
Rem                           max_sql_string_size
Rem    geadon      12/28/11 - script to set MAX_SQL_STRING_SIZE=EXTENDED
Rem    geadon      12/28/11 - Created
Rem

Rem Exit immediately if Any failure in this script
WHENEVER SQLERROR EXIT;

alter session set current_schema = SYS;

DOC
#######################################################################
#######################################################################
   The following statement will cause an "ORA-01722: invalid number"
   error if the database has not been opened for UPGRADE.  

   Perform a "SHUTDOWN ABORT"  and 
   restart using UPGRADE.
#######################################################################
#######################################################################
#
SELECT TO_NUMBER('MUST_BE_OPEN_UPGRADE') FROM v$instance
WHERE status != 'OPEN MIGRATE';

DOC
#######################################################################
#######################################################################
   The following statement will cause an "ORA-01722: invalid number"
   error if the database does not have compatible >= 12.0.0

   Set compatible >= 12.0.0 and retry.
#######################################################################
#######################################################################
#

DECLARE
  dummy number;
BEGIN
  SELECT CASE WHEN TO_NUMBER(SUBSTR(value,1,2)) < 12
              THEN TO_NUMBER('COMPATIBLE_12.1.0_REQUIRED')
              ELSE NULL
              END INTO dummy
  FROM v$parameter WHERE name = 'compatible';
END;
/

alter session set "_oracle_script" = TRUE;

---------------------------------------------------------------------------
-- invalidate views that have VARCHAR or NVARCHAR columns >= 4000 bytes or 
-- RAW columns >= 2000 bytes because these columns could change when
-- 32k VARCHAR2, NVARCHAR2, and RAW are enabled.

update obj$ o
  set status = 6
  where type# IN (4)
    and status not in (5, 6)
    and bitand(flags, 196608) = 0                     /* not a common object */
    and exists (select * from col$ c
                  where c.obj# = o.obj# 
                    and ( (c.type# = 1 and c.length >= 4000) or
                          (c.type# = 23 and c.length >= 2000) ));

commit;

alter system flush shared_pool;

---------------------------------------------------------------------------
-- invalidate views and synonyms that depend on views that have been
-- invalided

begin
  loop
    update obj$ o_outer set status = 6
    where     type# in (4, 5)
          and status not in (5, 6)
          and bitand(flags, 196608) = 0               /* not a common object */
          and linkname is null
          and ((subname is null) or (subname <> 'DBMS_DBUPGRADE_BABY'))
          and exists (select o.obj# from obj$ o, dependency$ d
                      where     d.d_obj# = o_outer.obj#
                            and d.p_obj# = o.obj#
                            and (bitand(d.property, 1) = 1)
                            and o.status > 1);
    exit when sql%notfound;
  end loop;
end;
/

commit;

alter system flush shared_pool;

---------------------------------------------------------------------------
-- Now, update virtual columns if their length has changed as a result
-- of enabling 32k types.

-- Bug 21996904: during selection of candidate columns, we should leave out
-- columns from path tables. Path tables are internal unstructured XML Index
-- (UXI) tables and they should not be changed since:
-- (1) UXI code is not going to be changed in any near future, if required
--     the XMLIndex layer will take care of future changes in utl32k regarding
--     this matter.
-- (2) The column left out from the path table is a virtual column with 
--     SYS_ORDERKEY_PARENT("ORDER_KEY") as expression. Such operator does not
--     return a 32 kB type and it is safe to skip during migration.
-- This will be checked by asserting that the candidate columns do not belong
-- to tables specified in path_table_names of dba_xml_indexes

alter session set "_modify_column_index_unusable" = TRUE;
--Turn on csx dml internal event to let internal columns be reloaded
alter session set events '19056 trace name context forever, level 0x10';

create table utl32k_errors(uname     varchar2(128),
                           tname     varchar2(128),
                           cname     varchar2(128),
                           obj#      int,
                           intcol#   int,
                           data_type varchar2(9),
                           data_len  int,
                           char_used varchar2(4),
                           virtual   varchar2(1),
                           mv        varchar2(1),
                           error     varchar2(4000),
                           sqlstr    clob,
                           when      timestamp);

create table utl32k_warnings(uname     varchar2(128),
                             tname     varchar2(128),
                             warning   varchar2(4000),
                             when      timestamp);

-- find all indexes that initially have KQLDINF_TOBE_DROPPED flag set
create table utl32k_ini_tobe_dropped(obj# int);
truncate table utl32k_ini_tobe_dropped;
insert into utl32k_ini_tobe_dropped
  select obj# from sys.ind$ where bitand(flags, 536870912) != 0;

variable starttime varchar2(128)
exec :starttime := to_char(systimestamp, 'MM/DD/YYYY HH24:MI:SS.FF');
print starttime

DECLARE
  cursor candidate_columns is
    select u.name UNAME,
           o.name TNAME,
           o.obj# OBJ#,
           DECODE(c.type#,
                    1, DECODE(c.charsetform, 2, 'NVARCHAR2', 'VARCHAR2'),
                   23, 'RAW') DATA_TYPE,
           c.spare3 DATA_LEN,
           decode(bitand(c.property, 8388608), 0, 'BYTE', 'CHAR') CHAR_USED,
           c.name CNAME,
           c.intcol# INTCOL#,
           decode(c.segcol#, 0, 'Y', 'N') VIRTUAL,
           decode(bitand(t.flags, 262144), 0, 'N', 'Y') MV
     from sys.tab$ t, sys.obj$ o, sys.user$ u, sys.col$ c
     where t.obj# = o.obj# and o.owner# = u.user# and c.obj# = t.obj#
       and bitand(o.flags, 196608) = 0               -- not a common object
       and (c.segcol# = 0 or                      -- virtual column
            bitand(c.property, 8388608) != 0 or   -- CHAR length semantics
            bitand(t.flags, 262144) != 0)         -- materialized view tbl
       and ( (c.type# = 1  and c.length >= 4000) or
             (c.type# = 23 and c.length >= 2000) )
       and (u.name, o.name) not in 
           (select index_owner, path_table_name from dba_xml_indexes)
     order by UNAME, TNAME, VIRTUAL;  -- bug 22375145: physical before virtual

  schema_table varchar2(512);         /* "SCHEMA"."TABLE" for SQL generation */
  data_type    varchar2(128);
  cur          integer;
  col_cnt      integer;
  len          integer;
  off          integer;
  discard      integer;
  str          varchar2(32767);
  strlen       integer;
  col_desc     DBMS_SQL.DESC_TAB2;
  col_expr     clob;
  sqlstr       clob;
  mv_str       clob;
  long_chunk_sz constant int := 256;
  parse_proc   varchar2(32767);
  parse_exec   varchar2(128);   
  parse_dele   varchar2(128);
  tokenset_dml varchar2(30);
  mv_objn      int;
  mv_status    int;
  mv_owner     varchar2(128);
  mv_name      varchar2(128);
  mv_schema_table varchar2(512);      /* "SCHEMA"."TABLE" for SQL generation */
BEGIN
  -- Bug 21907429: enable DDL on AQ tables
  sys.dbms_aqadm_sys.Mark_Internal_Tables(dbms_aqadm_sys.ENABLE_AQ_DDL); 

  cur := DBMS_SQL.OPEN_CURSOR;

  for target in candidate_columns loop
    BEGIN

    schema_table := DBMS_ASSERT.ENQUOTE_NAME(target.UNAME, FALSE) || '.'
                 || DBMS_ASSERT.ENQUOTE_NAME(target.TNAME, FALSE);

    IF (target.virtual = 'Y') THEN
      DBMS_SQL.PARSE(cur,
        'select deflength, default$ from col$ where obj# = :1 and name = :2',
        DBMS_SQL.NATIVE);
      DBMS_SQL.BIND_VARIABLE(cur, ':1', target.obj#);
      DBMS_SQL.BIND_VARIABLE(cur, ':2', target.cname);
      DBMS_SQL.DEFINE_COLUMN(cur, 1, len);
      DBMS_SQL.DEFINE_COLUMN_LONG(cur, 2);
      discard := DBMS_SQL.EXECUTE(cur);
      discard := DBMS_SQL.FETCH_ROWS(cur);

      DBMS_SQL.COLUMN_VALUE(cur, 1, len);
      col_expr := '';
      off := 0;
      WHILE len > 0 LOOP
        DBMS_SQL.COLUMN_VALUE_LONG(cur, 2, long_chunk_sz, off, str, strlen);
        col_expr := col_expr || str;
        off := off + strlen;
        len := len - strlen;
      END LOOP;

      /* Bug 20911289: let dml to go through for csx tokenset objects
       * This is required for the virtual column in QN index to be aliased*/
      tokenset_dml := '/*+ XMLTSET_DML_ENABLE*/ ';

      /* Bug 16237862: use an alias for the column to avoid column
       * name overflow errors in dbms_sql.describe_columns.
       */
      sqlstr := 'SELECT '
             || tokenset_dml || col_expr || ' expr FROM ' || schema_table;
      DBMS_SQL.PARSE(cur, sqlstr, DBMS_SQL.NATIVE);
      DBMS_SQL.DESCRIBE_COLUMNS2(cur, col_cnt, col_desc);

      data_type := target.DATA_TYPE || '(' || col_desc(1).col_max_len || ')';  

    ELSIF (target.mv = 'Y') THEN
      DBMS_SQL.PARSE(cur,
        'select sumtextlen, sumtext, obj# from sys.sum$ ' ||
        'where containerobj# = :1',
        DBMS_SQL.NATIVE);
      DBMS_SQL.BIND_VARIABLE(cur, ':1', target.obj#);
      DBMS_SQL.DEFINE_COLUMN(cur, 1, len);
      DBMS_SQL.DEFINE_COLUMN_LONG(cur, 2);
      DBMS_SQL.DEFINE_COLUMN(cur, 3, mv_objn);
      discard := DBMS_SQL.EXECUTE(cur);
      discard := DBMS_SQL.FETCH_ROWS(cur);

      DBMS_SQL.COLUMN_VALUE(cur, 1, len);
      mv_str := '';
      off := 0;
      WHILE len > 0 LOOP
        DBMS_SQL.COLUMN_VALUE_LONG(cur, 2, long_chunk_sz, off, str, strlen);
        mv_str := mv_str || str;
        off := off + strlen;
        len := len - strlen;
      END LOOP;
      DBMS_SQL.COLUMN_VALUE(cur, 3, mv_objn);

      -- check status of the MV
      EXECUTE IMMEDIATE
        'select u.name, o.name, o.status from sys.obj$ o, sys.user$ u ' ||
        'where o.obj# = :1 and o.owner# = u.user#' 
       into mv_owner, mv_name, mv_status
       using mv_objn;

      mv_schema_table := DBMS_ASSERT.ENQUOTE_NAME(mv_owner, FALSE) || '.' ||
                  DBMS_ASSERT.ENQUOTE_NAME(mv_name, FALSE);

      IF mv_status != 1 THEN
        sqlstr := 'alter materialized view ' || mv_schema_table ||
                  ' compile';
        EXECUTE IMMEDIATE sqlstr;

        EXECUTE IMMEDIATE
          'select u.name, o.name, o.status from sys.obj$ o, sys.user$ u ' ||
          'where o.obj# = :1 and o.owner# = u.user#' 
         into mv_owner, mv_name, mv_status
         using mv_objn;
      END IF;

      IF mv_status != 1 THEN

        insert into utl32k_warnings values(target.UNAME, target.TNAME,
          'Materialized view container table ' || schema_table
          || 'was not migrated because materialized view '
          || mv_schema_table
          || 'has compilation errors. When compilation errors have been fixed, '
          || 'column length in the container table can be updated manually '
          || 'via ALTER MATERIALIZED VIEW <mview_name> '
          || 'MODIFY(<col> <data type>).',
          SYSTIMESTAMP);

      ELSE
        execute immediate
          'alter session set current_schema = '
          || DBMS_ASSERT.ENQUOTE_NAME(target.UNAME, FALSE);

        sqlstr := mv_str;

        -- Bug 19063812 : Incase of mview definition query,create a procedure 
        -- as part of the mview owner schema to do the parsing. This is to
        -- avoid ORA 2019 when parsing db links which maybe present in the
        -- query. 

        parse_proc := 'create or replace procedure utl32k_parsequery 
                     (
                     sqlstr   IN    clob,
                     col_cnt  OUT   integer,
                     col_desc OUT   DBMS_SQL.DESC_TAB2
                     )as 
                     cur integer;
                     begin
                     cur := DBMS_SQL.OPEN_CURSOR;
                     DBMS_SQL.PARSE(cur, sqlstr, DBMS_SQL.NATIVE);
                     DBMS_SQL.DESCRIBE_COLUMNS2(cur, col_cnt, col_desc);
                     DBMS_SQL.CLOSE_CURSOR(cur);
                     EXCEPTION WHEN OTHERS THEN 
                      DBMS_SQL.CLOSE_CURSOR(cur);
                      RAISE;
                     end;';
        execute immediate parse_proc;

        parse_exec := 'BEGIN utl32k_parsequery(:a, :b, :c); END;';
        execute immediate parse_exec
         USING IN sqlstr,OUT col_cnt,OUT col_desc;

        data_type := target.DATA_TYPE
            || '(' || col_desc(target.intcol#).col_max_len || ')';

        parse_dele := 'drop procedure utl32k_parsequery';
        execute immediate parse_dele;

        execute immediate
         'alter session set current_schema = SYS';
      END IF;

    ELSE
      IF (target.DATA_TYPE = 'NVARCHAR2') THEN
        data_type := target.DATA_TYPE 
                  || '(' || target.DATA_LEN || ')';
      ELSE
        data_type := target.DATA_TYPE 
                  || '(' || target.DATA_LEN || ' ' || target.CHAR_USED || ')';
      END IF;
    END IF;

    sqlstr := 'ALTER TABLE ' || schema_table 
           || ' MODIFY (' || DBMS_ASSERT.ENQUOTE_NAME(target.CNAME, FALSE)
           || ' ' || data_type || ')';
    dbms_output.put_line(sqlstr);
    EXECUTE IMMEDIATE sqlstr;

    EXCEPTION WHEN OTHERS THEN
     execute immediate
      'insert into utl32k_errors(uname, tname, cname, obj#,
                                 intcol#, data_type, data_len, char_used,
                                 virtual, mv, error, sqlstr,
                                 when)
        values (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)'
     using target.uname, target.tname, target.cname, target.obj#,
           target.intcol#, target.data_type, target.data_len, target.char_used,
           target.virtual, target.mv, sqlerrm, sqlstr,
           systimestamp;
    END;  
  end loop;

  DBMS_SQL.CLOSE_CURSOR(cur);
END;
/
show errors;

-- Bug 21907429: disable DDL on AQ tables since we've finished processing them
BEGIN
  sys.dbms_aqadm_sys.Mark_Internal_Tables(dbms_aqadm_sys.DISABLE_AQ_DDL); 
END;
/

--Turn off csx dml internal event after finished processing columns
alter session set events '19056 trace name context off';
alter session set "_modify_column_index_unusable" = FALSE;

insert into utl32k_warnings
  select tu.name, tobj.name,
         CASE WHEN i.type# != 9 THEN
           'Index "' || iu.name || '"."' || iobj.name
           || '" must be dropped because it now exceeds maximum key length.'
         ELSE
           'Domain index "' || iu.name || '"."' || iobj.name
           || '" is now unusable because length of the indexed column '
           || 'has changed. This index must be dropped and recreated.' 
         END,
         systimestamp
    from sys.ind$ i, obj$ tobj, obj$ iobj, user$ tu, user$ iu
    where bitand(i.flags, 536870912) != 0 
      and i.bo# = tobj.obj# and i.obj# = iobj.obj#
      and tobj.owner# = tu.user# and iobj.owner# = iu.user#
      and i.obj# not in (select obj# from utl32k_ini_tobe_dropped);


select uname, tname, warning from utl32k_warnings
 where when > TO_TIMESTAMP(:starttime, 'MM/DD/YYYY HH24:MI:SS.FF')
 order by when;

select uname, tname, cname, error from utl32k_errors
 where when > TO_TIMESTAMP(:starttime, 'MM/DD/YYYY HH24:MI:SS.FF')
 order by when;

DOC
#######################################################################
#######################################################################
   The following statement will cause an "ORA-01722: invalid number"
   error if we encountered an error while modifying a column to
   account for data type length change as a result of enabling or
   disabling 32k types.

   Contact Oracle support for assistance.
#######################################################################
#######################################################################
#

DECLARE
  dummy number;
BEGIN
  SELECT CASE WHEN COUNT(*) > 0 THEN TO_NUMBER('ERROR IN UTL32K MIGRATION')
              ELSE NULL
         END INTO dummy
    FROM utl32k_errors
    where when > TO_TIMESTAMP(:starttime, 'MM/DD/YYYY HH24:MI:SS.FF');
END;
/

-- update PROPS$ to indicate that we've completed migration in this container
DECLARE
  mss_typ    binary_integer;    -- type of max_string_size parameter
  mss_len    binary_integer;    -- length of max_string_size parameter
  mss_prm    varchar2(80);      -- max_string_size parameter
BEGIN
  -- get the MAX_STRING_SIZE parameter
  mss_typ := SYS.DBMS_UTILITY.GET_PARAMETER_VALUE('MAX_STRING_SIZE',
                                                  mss_len, mss_prm);

  update props$ set value$ = mss_prm where name = 'MAX_STRING_SIZE';
END;
/

commit;

Rem Continue even if there are SQL errors 
WHENEVER SQLERROR CONTINUE;  

---------------------------------------------------------------------------
-- bug 16894689: utlrp.sql should be run in normal mode to recompile all 
-- invalid objects

alter package SYS.DBMS_INTERNAL_LOGSTDBY compile;
alter package SYS.PRVT_ADVISOR compile;

