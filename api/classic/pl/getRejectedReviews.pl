#!/usr/bin/perl
# $Id: getRejectedReviews.pl 807 2017-07-27 13:04:19Z csmig $

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
$stigmanId = $q->cookie('stigmanId');

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
#if (!($dbh = gripDbh("debug-nc",$db))) {
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
if ($userObj->{'role'} eq 'Staff') {
	$GETALL=1;
} elsif ($userObj->{'role'} eq 'IAO') {
	$GETDEPT = $userObj->{'dept'};
} else {
	$GETUSER=1;
}
@params = ();
$sql=<<END;
select
	a.assetId as "assetId",
	a.name as "assetName",
	r.ruleId as "ruleId",
	crr.groupId as "groupId",
	sa.stigId as "stigId",
	cr.revId as "revId",
	p.packageId as "packageId",
	p.name as "packageName",
	rules.title as "title"
from
END
if ($GETUSER) {
	$sql .=<<END;
        stigman.user_stig_asset_map usa
		left join stigman.stig_asset_map sa ON sa.saId = usa.saId
END
} else {
	$sql .=<<END;
        stigman.stig_asset_map sa
END
}
$sql .=<<END;	
    left join stigman.assets a ON a.assetId = sa.assetId
    left join stigman.asset_package_map ap ON ap.assetId = a.assetId
    left join stigman.packages p ON p.packageId = ap.packageId
    left join stigs.current_group_rules crr ON crr.stigId = sa.stigId
    left join stigs.current_revs cr ON cr.stigId = sa.stigId
	left join stigman.reviews r on r.ruleId=crr.ruleId and r.assetId=sa.assetId 
	left join stigs.rules rules on rules.ruleId=r.ruleId
where
	r.statusId = 2
END
if ($GETDEPT) {
	$sql .= " and a.dept = ?";
	@params = ($GETDEPT);
} elsif ($GETUSER) {
	$sql .= " and usa.userId=?";
	@params = ($userId);
}	

$sql .= ' order by sa.stigId';

print "Content-Type: text/html\n\n";

#print $sql;
$rejectionsRef = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
$numRecords = @$rejectionsRef;

$responseHashRef = {
	'records' => int $numRecords,
	'rows' => $rejectionsRef
};											

$json = encode_json $responseHashRef;
print $json;
