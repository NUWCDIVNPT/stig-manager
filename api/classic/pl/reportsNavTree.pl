#!/usr/bin/perl
# $Id: reportsNavTree.pl 807 2017-07-27 13:04:19Z csmig $

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
#$dbh = getDbHandle({'ROLE'=>'STIGMAN-READ'}) or die $dbh->errstr;
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

# Asset queries
# if ($GETALL) {
	# $sqlAssetsByPackage =<<END;
# select apm.assetId,ass.name from $STIGMAN_DB.asset_package_map apm
# left join $STIGMAN_DB.assets ass on apm.assetId=ass.assetId
# where packageId=?
# order by ass.name
# END
# } elsif ($GETDEPT) {
	# $sqlAssetsByPackage =<<END;
# select apm.assetId,ass.name from $STIGMAN_DB.asset_package_map apm
# left join $STIGMAN_DB.assets ass on apm.assetId=ass.assetId
# where packageId=? and ass.dept = ?
# order by ass.name
# END
# } else {
	# $sqlAssetsByPackage =<<END;
# SELECT distinct sam.assetId,srv.name FROM $STIGMAN_DB.user_stig_asset_map usam
# left join $STIGMAN_DB.stig_asset_map sam on sam.saId=usam.saId
# left join $STIGMAN_DB.asset_package_map apm on apm.assetId=sam.assetId
# left join $STIGMAN_DB.assets ass on ass.assetId=sam.assetId
# where apm.packageId=? and usam.userId=?
# order by ass.name
# END
# }
# $sthAssetsByPackage = $dbh->prepare($sqlAssetsByPackage);

# STIG queries
# $sqlStigs =<<END;
# select s.benchmarkId,cr.revId,ssm.stigId from $STIGMAN_DB.stig_asset_map ssm
# left join $STIGS_DB.stigs s on ssm.stigId=s.stigId
# left join $STIGS_DB.current_revs cr on s.stigId=cr.stigId
# where ssm.assetId=?
# order by s.benchmarkId
# END
# $sthStigs = $dbh->prepare($sqlStigs);

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
	# $assetNode = {};
	# $assetsArray = [];
	# $assetNode->{'text'} = 'Assets';
	# $assetNode->{'id'} = $packageId . "-assets-node";
	# $assetNode->{'children'} = $assetsArray;
	# $assetNode->{'iconCls'} = 'sm-asset-icon';
	# push(@$packageArray,$assetNode);

	# Asset folders
	# if ($GETALL) {
		# $sthAssetsByPackage->execute(($packageId));
	# } else {
		# $sthAssetsByPackage->execute(($packageId,$userId));
	# }
	# $assets = $sthAssetsByPackage->fetchall_arrayref({});
	# foreach $asset (@$assets) {
		# $assetNode = {};
		# $stigsArray = [];
		# $assetNode->{'id'} = $packageId . "-" . $asset->{'name'} . "-node";
		# $assetNode->{'text'} = $asset->{'name'};
		# $assetNode->{'iconCls'} = 'sm-report-icon';
		# $assetNode->{'leaf'} = 'true';
		# # $assetNode->{'children'} = $stigsArray;
		# # # Stigs
		# # $sthStigs->execute(($asset->{'assetId'}));
		# # $stigs = $sthStigs->fetchall_arrayref({});
		# # foreach $stig (@$stigs) {
			# # $stigHash = {};
			# # $stigHash->{'id'} = $packageId . "-" . $asset->{'name'} . "-" . $stig->{'revId'};
			# # $stigHash->{'text'} = $stig->{'benchmarkId'};
			# # $stigHash->{'report'} = "review";
			# # $stigHash->{'assetId'} = $asset->{'assetId'};
			# # $stigHash->{'assetName'} = $asset->{'name'};
			# # $stigHash->{'stigName'} = $stig->{'benchmarkId'};
			# # $stigHash->{'revId'} = $stig->{'revId'};
			# # $stigHash->{'stigId'} = $stig->{'stigId'};
			# # $stigHash->{'leaf'} = 'true';
			# # push(@$stigsArray,$stigHash);
		# # }
		# push(@$assetsArray,$assetNode);
	# }
	push(@$packagesArrayRef,$packageNode);
}

my $json = encode_json $packagesArrayRef;
print "Content-Type: text/html\n\n";
print "$json\n";
