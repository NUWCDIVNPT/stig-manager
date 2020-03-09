#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use Text::CSV;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');
$dept = $q->param('dept');
$domain = $q->param('domain');
$status = $q->param('status');
$csv = $q->param('csv');

$dbh = gripDbh("PSG-STIGMAN",undef, 'oracle') or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
# Set long group_concat
#$dbh->do("SET SESSION group_concat_max_len = 1000000");
$classification = getClassification();
$userId = $userObj->{'id'};

@bindValues = ($packageId);
if ($stigId && $stigId ne '--Any--') {
	$sqlStigCondition = "and sa.stigId=?";
	push(@bindValues,$stigId);
} else {
	$sqlStigCondition = "and sa.stigId is not null";
}

if ($userObj->{'role'} eq 'Staff') {
	if ($dept ne '--Any--' && $dept) { # $dept is defined and is not "Any"
		$sqlDeptCondition = 'and a.dept=?';
		push(@bindValues,$dept);
	} else {
		$sqlDeptCondition = '';
	}
} elsif ($userObj->{'role'} eq 'IAO') {
	$sqlDeptCondition = 'and a.dept=?';
	push(@bindValues,$userObj->{'dept'});
} else {
	$sqlDeptCondition = '';
}

if ($userObj->{'role'} eq 'Staff') {
	if ($domain ne '--Any--' && $domain) { # $domain is defined and is not "Any"
		$sqlDomainCondition = 'and a.domain=?';
		push(@bindValues,$domain);
	} else {
		$sqlDomainCondition = '';
	}
} else {
	$sqlDomainCondition = '';
}

if ($status ne '--Any--' && $status) { # $status is defined and is not "Any"
	$sqlStatusCondition = 'and a.status=?';
	push(@bindValues,$status);
} else {
	$sqlStatusCondition = '';
}

if ($userObj->{'role'} eq 'IAWF') {
	$sqlUserJoin = 'left join stigman.user_stig_asset_map usa on usa.saId=sa.saId';
	$sqlUserCondition = 'and usa.userId=?';
	push(@bindValues,$userId);
} else {
	$sqlUserJoin = '';
	$sqlUserCondition = '';
}	
#group_concat(distinct cr.stigId order by cr.stigId asc separator "<br>" ) as "stigIds",
$sql=<<END;
select
	-- LISTAGG(cr.stigId, '<br/>') WITHIN GROUP (ORDER BY cr.stigId ASC) as "stigIds",
	strdagg_param(param_array(cr.stigId, '<br/>')) as "stigIds",
	ru.severity as "severity",
	cr.groupId as "groupId",
	ru.title as "title",
	count(distinct a.name) as "cnt"
from
	stigman.asset_package_map ap
	left join stigman.packages p on ap.packageId=p.packageId
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	$sqlUserJoin
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigs.rules ru on ru.ruleId=cr.ruleId
	left join stigs.groups gr on gr.groupId=cr.groupId
	left join stigs.severity_cat_map sc on sc.severity=ru.severity
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=ru.ruleId)
where
	ap.packageId = ?
	$sqlStigCondition
	$sqlDeptCondition
	$sqlDomainCondition
	$sqlStatusCondition
	$sqlUserCondition
	and rv.stateId=4
 group by
	 cr.groupId, ru.severity, ru.title


END

#cr.groupId, stigIds, ru.severity, ru.title,  cnt

if (!$csv) {
	my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@bindValues);
	my $numRecords = @$arrayref;
	my $json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	print "{\"records\": \"$numRecords\",\"classification\": \"$classification\",\"rows\": $json}\n";
} else {
	print "Content-Type: text/csv\n";
	#print "Content-Disposition: attachment;filename=($classification) NoncompliantHosts-${packageName}.csv\n\n";
	print "Content-Disposition: attachment;filename=($classification) Findings-${packageName}.csv\n\n";
	my $csv = Text::CSV->new ( { binary => 1 } );
	my $sth = $dbh->prepare($sql);
	my $rv = $sth->execute(@bindValues);
	$columnNames = $sth->{NAME};
	unshift(@$columnNames,'classification');
	$csv->combine (@$columnNames);
	print $csv->string() . "\n";
	my $arrayref = $sth->fetchall_arrayref();
	foreach $array (@$arrayref) {
		unshift(@$array,"($classification)");
		$csv->combine (@$array);
		print $csv->string() . "\n";
	}
}

