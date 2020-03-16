#!/usr/bin/perl
# $Id: getCompletionStatus.pl 807 2017-07-27 13:04:19Z csmig $

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

#print "Content-Type: text/html\n\n";


#$db = 'stigman';
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$csv = $q->param('csv');

#$dbh = gripDbh("stigman",$db) or die $dbh->errstr;
$dbh = gripDbh("PSG-STIGMAN",undef, 'oracle') or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
$userId = $userObj->{'id'};
$classification = 'U';

if ($userObj->{'role'} eq 'Staff') {
	$GETALL = 1;
} elsif ($userObj->{'role'} eq 'IAO') {
	$GETDEPT = $userObj->{'dept'};
} else {
	$GETALL=0;
}

$sql =<<END;
SELECT 
srv.assetId as "assetId",
srv.name as "assetName",
srv.domain as "assetGroup",
srv.dept as "dept",
NVL(st.stigId,'!! NO STIG ASSIGNMENTS !!') as "stigId",
cr.revId as "revId",
NVL(st.title,'!! NO STIG ASSIGNMENTS !!') as "stigTitle",

sas.checksManual + sas.checksScap as "checksTotal",
(sas.checksManual + sas.checksScap) - (sas.inProgressManual + sas.inProgressScap + sas.submittedManual + sas.submittedScap + sas.rejectedManual + sas.rejectedScap + sas.approvedManual + sas.approvedScap) as "unreviewedTotal",
sas.inProgressManual + sas.inProgressScap as "inProgressTotal",
sas.submittedManual + sas.submittedScap as "submittedTotal",
sas.rejectedManual + sas.rejectedScap as "rejectedTotal",
sas.approvedManual + sas.approvedScap as "approvedTotal",

sas.checksManual as "checksManual",
sas.checksManual - (sas.inProgressManual + sas.submittedManual + sas.rejectedManual + sas.approvedManual) as "unreviewedManual",
sas.inProgressManual as "inProgressManual",
sas.submittedManual as "submittedManual",
sas.rejectedManual as "rejectedManual",
sas.approvedManual as "approvedManual",

sas.checksScap as "checksScap",
sas.checksScap - (sas.inProgressScap + sas.submittedScap + sas.rejectedScap + sas.approvedScap) as "unreviewedScap",
sas.inProgressScap as "inProgressScap",
sas.submittedScap as "submittedScap",
sas.rejectedScap as "rejectedScap",
sas.approvedScap as "approvedScap",

sas.cat1Count as "cat1Count",
sas.cat2Count as "cat2Count",
sas.cat3Count as "cat3Count"
END

if ($GETALL) {
	$sql .=<<END;
FROM stigman.asset_package_map ap
left join stigman.stats_asset_stig sas on ap.assetId=sas.assetId
left join stigman.assets srv on ap.assetId=srv.assetId
left join stigs.stigs st on sas.stigId=st.stigId
left join stigs.current_revs cr on st.stigId=cr.stigId
where ap.packageId=?
order by srv.Name,st.title
END
	@bindValues = ($packageId);
} elsif ($GETDEPT) {
	$sql .=<<END;
FROM stigman.asset_package_map ap
left join stigman.stats_asset_stig sas on ap.assetId=sas.assetId
left join stigman.assets srv on ap.assetId=srv.assetId
left join stigman.domain_dept_map ddm on ddm.domain=srv.domain
left join stigs.stigs st on sas.stigId=st.stigId
left join stigs.current_revs cr on st.stigId=cr.stigId
where ap.packageId=? and srv.dept=?
order by srv.Name,st.title
END
	@bindValues = ($packageId,$GETDEPT);
} else {
	$sql .=<<END;
FROM stigman.user_stig_asset_map usam
left join stigman.stig_asset_map sam on sam.saId=usam.saId
left join stigman.asset_package_map ap on ap.assetId=sam.assetId
left join stigman.stats_asset_stig sas on (sas.assetId=sam.assetId and sas.stigId=sam.stigId)
left join stigman.assets srv on srv.assetId=sas.assetId
left join stigman.domain_dept_map ddm on ddm.domain=srv.domain
left join stigs.stigs st on st.stigId=sas.stigId
left join stigs.current_revs cr on cr.stigId=st.stigId
where ap.packageId=? and usam.userId=?
order by srv.Name,st.title
END
	@bindValues = ($packageId,$userId);
}


if (!$csv) {
	my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@bindValues);
	my $numRecords = @$arrayref;
	my $json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	

	
	print "{\"records\": \"$numRecords\",\"classification\": \"$classification\",\"rows\": $json}\n";
} else {
	($packageName) = $dbh->selectrow_array("select name from stigman.packages where packageId=?",undef,($packageId));
	print "Content-Type: text/csv\n";
	print "Content-Disposition: attachment;filename=($classification) CompletionStatus-${packageName}.csv\n\n";
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
