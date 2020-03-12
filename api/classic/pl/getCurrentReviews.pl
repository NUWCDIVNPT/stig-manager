#!/usr/bin/perl
# $Id: getCurrentReviews.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$db = $STIGMAN_DB;
$q = CGI->new;
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');
$revId = $q->param('revId');
$ruleId = $q->param('ruleId');
$stigmanId = $q->cookie('stigmanId');

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

$sql=<<END;
select
	r.reviewId as "reviewId",
	a.assetId||'!'||p.ruleId as "checkId",
	a.assetId as "assetId",
	p.ruleId as "ruleId",
	a.assetName as "assetName",
	CASE WHEN p.profile is null THEN 'No' ELSE 'Yes' END as "applicable",
	r.stateId as "stateId",
	st.abbr as "stateAbbr",
	r.stateComment as "stateComment",
	r.actionId as "actionId",
	act.action as "action",
	r.actionComment as "actionComment",
	r.autoState as "autoState",
	r.userId as "userId",
	ud.name as "userName",
	r.ts as "ts",
	r.statusId as "statusId",
	CASE WHEN at.assetId is not null THEN 1 ELSE 0 END as "hasAttach"
from
	/* For this package and STIG, get rows containing an assigned asset and its profile */
	(select
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
	left join
		/* For each rule in this STIG revision, get rows containing the rule and an applicable profile  */ 
		(select
		  rpg.profile,
		  rgr.ruleId
		from
		  stigs.rev_group_rule_map rgr
		  left join stigs.rev_group_map rg on rg.rgId=rgr.rgId
		  left join stigs.rev_profile_group_map rpg on (rpg.revId=rg.revId and rpg.groupId=rg.groupId)
		where
		  rgr.ruleId=?
		  and rg.revId = ?) p on p.profile=a.profile
	left join stigman.reviews r on (r.ruleId=p.ruleId and r.assetId=a.assetId)
	left join 
		/* Get the asset/rule pairs that have attachments */
		(SELECT
			assetId,
			ruleId
		FROM 
			stigman.review_artifact_map 
		group by 
			assetId,
			ruleId) at on (at.assetId=r.assetId and at.ruleId=r.ruleId)
	left join stigman.states st on st.stateId=r.stateId
	left join stigman.actions act on act.actionId=r.actionId
	left join stigman.user_data ud on ud.id=r.userId
order by
	a.assetName
END

$reviewRef = $dbh->selectall_arrayref($sql,{ Slice => {} },($stigId,$packageId,$ruleId,$revId));

$numRecords = @$reviewRef;
$json = encode_json $reviewRef;

print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";



