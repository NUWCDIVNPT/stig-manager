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


$db = $STIGMAN_DB;
$q = CGI->new;
#########################################################################
# rows= { field1: value1, field2:value2, checkId:'00!SV-0000R0_rule'}
# OR
# rows = [	{ field1: value1, field2:value2, checkId:'00!SV-0000R0_rule'}, 
#			{ field1: value1, field2:value2, checkId:'00!SV-0000R0_rule'}
#		]
#########################################################################
$rows  = decode_json $q->param('rows'); # data to be updated
$packageId = $q->param('packageId'); # used when calculating counts
$stigId = $q->param('stigId'); # used when calculating counts
$revId = $q->param('revId'); # used when calculating counts
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
print "Content-Type: text/html\n\n";
$userId = $userObj->{'id'};
$refType = ref $rows;
$updates = [];
$counts = [];

if ($refType eq 'ARRAY') { # array of hashes
	foreach $rowHash (@$rows) {
		push(@$updates,updateReview($dbh,$rowHash,$packageId,$stigId,$revId));
	}
} elsif ($refType eq 'HASH') {
	push(@$updates,updateReview($dbh,$rows,$packageId,$stigId,$revId));
}

# Check if either counts or stats need to be recalculated
$recountRules = {};
foreach $update (@$updates) {
	# did any of the updates change the state or status?
	if (exists $update->{'stateId'} || exists $update->{'statusId'}) {
		($assetId,$ruleId) = split("!",$update->{'checkId'});
		# Update the asset/stig statistics
		$stigIds = getStigFromAssetRule($assetId,$ruleId,$dbh);
		foreach $stigId (@$stigIds) {
			updateStatsAssetStig($assetId,$stigId,$dbh);
		}
		# Build a hash with a key for each rule whose counts need to be recalculated
		$recountRules->{$ruleId}++;
	}
}
foreach $rule (keys %$recountRules){
	$countHash = getCountsForRule($dbh,$rule,$packageId,$stigId,$revId);
	if ($countHash) {
		push(@$counts,$countHash);
	}
}

$returnObject = {
	'success' => \1,
	'updates' => $updates,
	'counts' => $counts
};

$json = encode_json $returnObject;
print $json;

sub updateReview {
	my ($dbh,$rowHash,$key,$checkId,$assetId,$ruleId,$field,$value,$columnName,$sql,$sth,$rv,$returnHash,$packageId,$stigId,$revId);

	($dbh,$rowHash,$packageId,$stigId,$revId) = @_;
	$checkId = $rowHash->{'checkId'};
	if (!$checkId) { return {}; }
	$returnHash->{'checkId'} = $checkId;
	($assetId,$ruleId) = split("!",$checkId);
	delete $rowHash->{'checkId'};
	
	foreach my $key (keys %$rowHash) {
		$field = $key;
		$value = $rowHash->{$key};
		$columnName = $dbh->quote_identifier(uc($field));
		$sql=<<END;
UPDATE reviews
SET $columnName = ?,
userId = ?
where assetId = ?
and ruleId = ?
END
		$sth = $dbh->prepare($sql);
		$rv = $sth->execute(($value,$userId,$assetId,$ruleId));
		if ($rv) {
			$returnHash->{$field} = $value;
		};
	}
	return $returnHash;
}

sub getCountsForRule {
	my ($dbh,$ruleId,$packageId,$stigId,$revId) = @_;
	my ($sql,$counts);
	
	$sql =<<END;
select 	
	p.ruleId as "ruleId",
	sum(CASE WHEN r.stateId = 4 THEN 1 ELSE 0 END) as "oCnt",
	sum(CASE WHEN r.stateId = 3 THEN 1 ELSE 0 END) as "nfCnt",
	sum(CASE WHEN r.stateId = 2 THEN 1 ELSE 0 END) as "naCnt",
	sum(CASE WHEN r.stateId is null THEN 1 ELSE 0 END) as "nrCnt",
	sum(CASE WHEN r.statusId = 3 THEN 1 ELSE 0 END) as "approveCnt",
	sum(CASE WHEN r.statusId = 2 THEN 1 ELSE 0 END) as "rejectCnt",
	sum(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END) as "readyCnt"
 from
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
		  rg.revId = ? and rgr.ruleId=?) p on p.profile=a.profile
	left join stigman.reviews r on (r.ruleId=p.ruleId and r.assetId=a.assetId)
group by
	p.ruleId
END
	#$counts = $dbh->selectall_arrayref($sql,{ Slice => {} },($stigId,$packageId,$revId,$ruleId));
	$counts = $dbh->selectrow_hashref($sql,undef,($stigId,$packageId,$revId,$ruleId));
	if ($counts) {
		return $counts;
	} else {
		return undef;
	}
}