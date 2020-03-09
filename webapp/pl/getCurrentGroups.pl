#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = "stigman";
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$revId = $q->param('revId');
$assetId = $q->param('assetId');
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "Could not connect to the database.";
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "Invalid user.";
	exit;
}
$userId = $userObj->{'id'};

# If no revId was provided, use the current revision of the given stigId
if (!$revId) {
	($revId) = $dbh->selectrow_array("select revId from stigs.current_revs where stigId=?",undef,($stigId));
}

# Check if there's XML available for this revision
if ($dbh->selectrow_array("select revId from stigs.rev_xml_map where revId=? and xml is not null",undef,($revId))){
	$xmlDisabled = 'false';
} else {
	$xmlDisabled = 'true';
}
# Get a list of the other revisions of this stig's revision
$sqlRevisions =<<END;
select r.revId as "revId",
'Version ' || version || ', Release ' || release || ' (' || benchmarkDate || ')' as "revisionStr"
from stigs.revisions r
where stigId=(select stigId from stigs.revisions where revId=?)
order by statusDate desc
END
$revisionRef = $dbh->selectall_arrayref($sqlRevisions,{ Slice => {} },($revId));
$jsonRevisions = encode_json $revisionRef;

if ($assetId) { # Request is for an asset's checks

	# X=result and action complete
	# O=result complete, but not action
	$sql=<<END;
  select
		alpha.assetId || '!' || alpha.ruleId as "checkId",
		alpha.assetId as "assetId",
		alpha.groupId as "groupId",
		alpha.ruleId as "ruleId",
		alpha.groupTitle as "groupTitle",
		alpha.ruleTitle as "ruleTitle",
		alpha.cat as "cat",
		alpha.documentable as "documentable",
		NVL(bravo.abbr,'') as "stateAbbr",
		NVL(bravo.statusId,0) as "statusId",
		NVL(bravo.autoState,0) as "autoState",
		bravo.hasAttach as "hasAttach",
    CASE
      WHEN bravo.ruleId is null
      THEN 0
      ELSE
        CASE WHEN bravo.stateId != 4
        THEN
          CASE WHEN bravo.stateComment != ' ' and bravo.stateComment is not null
            THEN 1
            ELSE 0 END
        ELSE
          CASE WHEN bravo.actionId is not null and bravo.actionComment is not null and bravo.actionComment != ' '
            THEN 1
            ELSE 0 END
        END
      END as "done",
		CASE
      WHEN charlie.ruleId is null
      THEN 'Manual'
      ELSE 'SCAP'
    END as "checkType"
	from
		-- Get the group and rules for this asset (based on its profile)
		(select
			s.assetId,
			rg.groupId,
			rgr.ruleId,
			g.title as groupTitle,
			r.title as ruleTitle,
			sc.cat,
			r.documentable
		from 
			assets s
			--left join stigs.rev_profile_group_map rpg on (s.profile=rpg.profile and rpg.revId=?)
			left join stigs.rev_profile_group_map rpg on (s.profile=rpg.profile)
			left join stigs.groups g on rpg.groupId=g.groupId
			left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
			left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
			left join stigs.rules r on rgr.ruleId=r.ruleId
			left join stigs.severity_cat_map sc on r.severity=sc.severity
		where 
			s.assetId = ?
			and rpg.revId = ?
		) alpha
		left join
		-- Get all the reviews for this asset
		(SELECT 
			r.ruleId,
			r.stateId,
			r.stateComment,
			st.abbr,
			r.actionId,
			r.actionComment,
			r.autoState,
			r.statusId, 
      CASE WHEN ra.raId is null THEN 0 ELSE 1 END as hasAttach
		FROM 
			reviews r
			left join states st on r.stateId=st.stateId
			left join review_artifact_map ra on (ra.assetId=r.assetId and ra.ruleId=r.ruleId)
		where 
			r.assetId=?
		group by 
			r.ruleId,
			r.stateId,
			r.stateComment,
			st.abbr,
			r.actionId,
			r.actionComment,
			r.autoState,
			r.statusId,
			ra.raId) bravo on alpha.ruleId=bravo.ruleId
		left join
		-- Get all the SCAP rules
		(SELECT 
			distinct ruleId
		FROM 
			stigs.rule_oval_map) charlie on alpha.ruleId=charlie.ruleId
		order by
			DECODE(substr(groupId,1,2),'V-',lpad(substr(groupId,3),6,'0'),groupId) asc
END
	$targetRef = $dbh->selectall_arrayref($sql,{ Slice => {} },($assetId,$revId,$assetId));
	#$targetRef = $dbh->selectall_arrayref($sql,{ Slice => {} },($revId,$assetId,$assetId));
	$assetCnt = 1;
} else { # Request is for the package-level STIG checks
	$sql=<<END;
select
  rCnt.oCnt as "oCnt",
  rCnt.nfCnt as "nfCnt",
  rCnt.naCnt as "naCnt",
  rCnt.nrCnt as "nrCnt",
  rCnt.approveCnt as "approveCnt",
  rCnt.rejectCnt as "rejectCnt",
  rCnt.readyCnt as "readyCnt",
  g.groupId as "groupId",
  g.groupTitle as "groupTitle",
  g.ruleTitle as "ruleTitle",
  g.ruleId as "ruleId",
  g.cat as "cat",
  g.checkType as "checkType"
from (
	select
		g.groupId,
		g.title as groupTitle,
		r.title as ruleTitle,
		r.ruleId,
		sc.cat,
		CASE WHEN ro.ruleId is null
			THEN 'Manual'
			ELSE 'SCAP'
		END	as checkType
	from 
		stigs.rev_group_map rg
		left join stigs.groups g on g.groupId=rg.groupId
		left join stigs.rev_group_rule_map rgr on rgr.rgId=rg.rgId
		left join stigs.rules r on r.ruleId=rgr.ruleId
		left join stigs.severity_cat_map sc on sc.severity=r.severity
		left join (SELECT distinct ruleId FROM stigs.rule_oval_map) ro on ro.ruleId=rgr.ruleId
	where 
		rg.revId = ?) g
	left join ( 
		select
			p.ruleId,
			sum(CASE WHEN r.stateId = 4 THEN 1 ELSE 0 END) as oCnt,
			sum(CASE WHEN r.stateId = 3 THEN 1 ELSE 0 END) as nfCnt,
			sum(CASE WHEN r.stateId = 2 THEN 1 ELSE 0 END) as naCnt,
			sum(CASE WHEN r.stateId is null THEN 1 ELSE 0 END) as nrCnt,
			sum(CASE WHEN r.statusId = 3 THEN 1 ELSE 0 END) as approveCnt,
			sum(CASE WHEN r.statusId = 2 THEN 1 ELSE 0 END) as rejectCnt,
			sum(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END) as readyCnt
		from (
			/* For this package and STIG, get rows containing an assigned asset and its profile */
			select
				s.assetId as assetId,
				s.name as assetName,
				s.profile
			from
				stigman.assets s
				left join stigman.stig_asset_map ss on ss.assetId=s.assetId
				left join stigman.asset_package_map sp on sp.assetId=ss.assetId
			where
				ss.stigId=?
				and sp.packageId=?) a
			left join (
				/* For each rule in this STIG revision, get rows containing the rule and an applicable profile  */ 
				select
				  rpg.profile,
				  rgr.ruleId
				from
				  stigs.rev_group_rule_map rgr
				  left join stigs.rev_group_map rg on rg.rgId=rgr.rgId
				  left join stigs.rev_profile_group_map rpg on (rpg.revId=rg.revId and rpg.groupId=rg.groupId)
				where
				  rg.revId = ?) p on p.profile=a.profile
			left join stigman.reviews r on (r.ruleId=p.ruleId and r.assetId=a.assetId)
		group by
			 p.ruleId) rCnt on rCnt.ruleId=g.ruleId
order by
	DECODE(substr(groupId,1,2),'V-',lpad(substr(groupId,3),6,'0'),groupId) asc
END
	$targetRef = $dbh->selectall_arrayref($sql,{ Slice => {} },($revId,$stigId,$packageId,$revId));
	
	$sqlAssetCnt =<<END;
	select
		count(*) as assetCnt
	from
		stigman.assets s
		left join stigman.stig_asset_map ss on ss.assetId=s.assetId
		left join stigman.asset_package_map sp on sp.assetId=ss.assetId
	where
		ss.stigId=?
		and sp.packageId=?
END
	($assetCnt) = $dbh->selectrow_array($sqlAssetCnt,undef,($stigId,$packageId));
}

$numRecords = @$targetRef;
$json = encode_json $targetRef;
print "Content-Type: text/json\n\n";
print "{\"records\": \"$numRecords\",\"revisions\": $jsonRevisions, \"xmlDisabled\": $xmlDisabled, \"assetCnt\": $assetCnt, \"rows\": $json}\n";
	

