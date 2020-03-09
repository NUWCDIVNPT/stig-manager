#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


my $db = $STIGMAN_DB;

$q = CGI->new;
$coder = JSON::XS->new->ascii->pretty->allow_nonref;
$xaction = $q->param('xaction');
$csv = $q->param('csv');
$stigmanId = $q->cookie('stigmanId');

if ($rowsJson = $q->param('rows')){
	$rows = $coder->decode($rowsJson);
}
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	if (!$xaction || $xaction eq 'read') {
		@params = ();
		$sql=<<END;
SELECT
	a.assetId as "assetId",
	a.name as "name",
	a.profile as "profile",
	a.domain  as "group",
	a.ip as "ip",
	a.dept as "dept",
	a.nonnetwork as "nonnetwork",
	a.scanexempt as "scanexempt",
	LISTAGG(p.name, ', ') WITHIN GROUP (ORDER BY p.name)  as "packages",
	sub1.cnt  as "stigNum",
	subNullCount.cnt2 as "unassigned"
FROM
	stigman.assets a
	left join stigman.asset_package_map apm on a.assetId=apm.assetId
	left join stigman.packages p on apm.packageId=p.packageId
	left join 
		(select count(*) as cnt, assetId from stigman.stig_asset_map group by assetId ) sub1 on sub1.assetId=a.assetId
	left join (
		select count(*) as cnt2,assetId,sub2.cnt1 from stigman.stig_asset_map sam
				left join 
					(select count(*) as cnt1,saId from stigman.user_stig_asset_map group by saId) sub2 on sub2.saId=sam.saId
				where sub2.cnt1 is null
				group by assetId,sub2.cnt1
	) subNullCount on subNullCount.assetId=a.assetId
END
		if ($userObj->{'role'} eq 'IAO' && !($userObj->{'canAdmin'})) {
			$sql .= "where a.dept = ? ";
			push(@params ,$userObj->{'dept'});
		}
		$sql .=<<END;
  group by 
	a.assetId,
	a.name,
	a.profile,
	a.domain,
	a.ip,
	a.dept,
	a.nonnetwork,
	a.scanexempt,
	sub1.cnt,
	subNullCount.cnt2
order by 
	a.name
END
		if (!$csv) {
			my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
			my $numRecords = @$arrayref;
			my $json = encode_json $arrayref;
			print "Content-Type: text/html\n\n";
			print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
			exit;
		} else {
			print "Content-Type: text/csv\n";
			print "Content-Disposition: attachment;filename=Assets.csv\n\n";
			my $csv = Text::CSV->new ( { binary => 1 } );
			my $sth = $dbh->prepare($sql);
			my $rv = $sth->execute(@params);
			$columnNames = $sth->{NAME};
			$csv->combine (@$columnNames);
			print $csv->string() . "\n";
			my $arrayref = $sth->fetchall_arrayref();
			foreach $array (@$arrayref) {
				$csv->combine (@$array);
				print $csv->string() . "\n";
			}
		}
	} elsif ($xaction eq 'destroy' && ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff')) {
		my $activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);
		($assetName) = $dbh->selectrow_array("Select name FROM stigman.assets where id = ?",undef,($rows));
		addAuditActivityDetails($dbh,$activityId,{"delete"=>"asset",
			"name"=>"$assetName",
			"assetId"=>"$rows"
			});	
		$sql = "delete FROM assets where assetId=?";
		$rv = $dbh->do($sql,undef,($rows));		
		print "Content-Type: text/html\n\n";
		if ($rv) {
			print "{success:true}\n";
		} else {
			print "{success:false, rv:$rv, sql:$sql}\n";
		}
	}
}


