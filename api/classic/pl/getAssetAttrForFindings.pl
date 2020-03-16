#!/usr/bin/perl
#$Id: getAssetAttrForFindings.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');
$attribute = $q->param('attribute');
$workspace = $q->param('workspace');

$db = 'stigman';
$dbh = gripDbh("PSG-STIGMAN",undef, 'oracle') or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}

if ($stigId ne '') {
	$sqlStigCondition = "and sa.stigId=?";
	@bindValues = ($packageId,$stigId);
} else {
	$sqlStigCondition = "and sa.stigId is not null";
	@bindValues = ($packageId);
}

if ($attribute eq 'dept') {
	$queryAttr = 'a.dept';
	$rowAttr = 'dept';
} elsif ($attribute eq 'domain') {
	$queryAttr = 'a.domain';
	$rowAttr = 'domain';
} else {
	$queryAttr = 'a.dept';;
	$rowAttr = 'dept';
}

if ($workspace eq 'report') {
	$sqlStatusCondition = '';
} else {
	$sqlStatusCondition = 'and rv.statusId=3';
}

	
$sql =<<END;
select
	distinct $queryAttr as "$queryAttr"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigs.rules ru on ru.ruleId=cr.ruleId
	-- left join stigs.groups gr on gr.groupId=cr.groupId
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=ru.ruleId)
where 
	ap.packageId = ?
	$sqlStigCondition
	and rv.stateId=4
	$sqlStatusCondition
	and $queryAttr is not null
	and $queryAttr <> ''
order by 
	$queryAttr
END

$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@bindValues);
unshift(@$arrayref,{$rowAttr => '--Any--'});
$numRecords = @$arrayref;

$json = encode_json $arrayref;
print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"classification\": \"$classification\",\"rows\": $json}\n";

