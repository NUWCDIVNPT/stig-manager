#!/usr/bin/perl

use DBI;
use grip;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;
$dbHost = "localhost";
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;	#Commented out by Brandon on 8/10/2015 @ 15:15
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
$userId = $userObj->{'id'};

if ($userObj->{'role'} eq 'Staff') {
	$GETALL = 1;
} elsif ($userObj->{'role'} eq 'IAO') {
	$GETDEPT = $userObj->{'dept'};
} else {
	$GETALL=0;
}

$treeArrayRef = [];
$packagesArrayRef = [];
push(@$treeArrayRef,{
	'id'=>'global-packages',
	'text'=>'My Packages',
	'expanded' => \1,
	'children'=>$packagesArrayRef});
%packageReports = ('comp'=>'Completion Status','find'=>'Findings Summary');

# Package queries
if ($GETALL) {
	$sqlPackagesAll = "SELECT packageId as \"packageId\",name as \"name\" FROM stigman.packages";
	$packages = $dbh->selectall_hashref($sqlPackagesAll,'name');
} elsif ($GETDEPT) {
		$sqlPackagesByDept =<<END;
		SELECT 
			distinct p.packageId as "packageId",
			p.name as "name"
		FROM
			stigman.packages p
			left join stigman.asset_package_map apm on apm.packageId=p.packageId
			left join stigman.assets a on a.assetId=apm.assetId
		where
			a.dept=? and p.packageId is not null
		order by p.name
END
		$packages = $dbh->selectall_hashref($sqlPackagesByDept,'name',undef,($GETDEPT));
} else {
	$sqlPackagesByUser =<<END;
SELECT distinct p.packageId as "packageId",p.name as "name" FROM stigman.user_stig_asset_map usam
left join stigman.stig_asset_map sam on sam.saId=usam.saId
left join stigman.asset_package_map apm on apm.assetId=sam.assetId
left join stigman.packages p on p.packageId=apm.packageId
where usam.userId=? and p.packageId is not null
END
	$packages = $dbh->selectall_hashref($sqlPackagesByUser,'name',undef,($userId));
}


foreach $packageName (sort keys %$packages) {
	# Package folder
	$packageId = $packages->{$packageName}->{'packageId'};
	$packageNode = {};
	$packageArray = [];
	$packageNode->{'children'} = $packageArray;
	$packageNode->{'id'}= $packageId . "-node";
	$packageNode->{'text'} = $packageName;
	$packageNode->{'iconCls'} = 'sm-package-icon';
	# Reports
	foreach $report (sort keys %packageReports) {
		$reportHash = {};
		$reportHash->{'id'} = $packageId . "-" . $report;
		$reportHash->{'text'} = $packageReports{$report};
		$reportHash->{'report'} = $report;
		$reportHash->{'packageId'} = $packageId;
		$reportHash->{'packageName'} = $packageName;
		$reportHash->{'leaf'} = 'true';
		$reportHash->{'iconCls'} = 'sm-report-icon';
		push(@$packageArray,$reportHash);
	}
	push(@$packagesArrayRef,$packageNode);
}

my $json = encode_json $packagesArrayRef;
print "Content-Type: text/html\n\n";
print "$json\n";
