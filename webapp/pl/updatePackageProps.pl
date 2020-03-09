#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
#use Log::Log4perl qw(:easy);

my $q = CGI->new;
my $packageId  = $q->param('id');
my $assetIds  = decode_json $q->param('assets');
my $packageName  = $q->param('packageName');
my $emassId  = $q->param('emassId');
my $reqRar = $q->param('reqRar') eq 'on' ? 1 : 0;
my $pocName  = $q->param('pocName');
my $pocEmail  = $q->param('pocEmail');
my $pocPhone = $q->param('pocPhone');
my $macClId = $q->param('macClId');
my $repositoryId = $q->param('repositoryId');
my $stigmanId = $q->cookie('stigmanId');

print "Content-Type: application/json\n\n";

my (
	$returnObj,
	$dbh,
	$userObj,
	$sql,
	$sth
);

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = 0;
	$returnObj->{'errorStr'} = "Can't connect to database";
	finish();
}
$dbh->{AutoCommit} = 0;

if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = 0;
	$returnObj->{'errorStr'} = "User not found";
	finish();
}
my $userId = $userObj->{'id'};

#my $activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);

if (!$userObj->{'canAdmin'} && $userObj->{'role'} ne 'Staff') {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = 0;
	$returnObj->{'errorStr'} = "Forbidden";
	finish();
}
if ($packageId == 0) { # This is a new record
	$sql = "INSERT into packages(name,emassId,reqRar,pocName,pocEmail,pocPhone,macClId,repositoryId) VALUES (?,?,?,?,?,?,?,?) returning packageId into ?";
	$sth = $dbh->prepare($sql);
	$sth->bind_param(1,$packageName);
	$sth->bind_param(2,$emassId);
	$sth->bind_param(3,$reqRar);
	$sth->bind_param(4,$pocName);
	$sth->bind_param(5,$pocEmail);
	$sth->bind_param(6,$pocPhone);
	$sth->bind_param(7,$macClId);
	$sth->bind_param(8,$repositoryId);
	$sth->bind_param_inout(9,\$packageId,32);
	eval {
		local $dbh->{RaiseError} = 1;
		local $dbh->{PrintError} = 0;
		$sth->execute();
	};
	if ($@) {
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = $packageId;
		$returnObj->{'errorStr'} = $@;
		$dbh->rollback;
		finish();
	}
	# addAuditActivityDetails($dbh,$activityId,{
			# "create"=>"package",
			# "packageId"=>"$packageId",
			# "name"=>"$packageName",
			# "emass"=>"$emassId"
			# });
} else {
	# This is an update to an existing package
	$sql = "UPDATE packages SET name=?,emassId=?,reqRar=?,pocName=?,pocEmail=?,pocPhone=?, macClId=?,repositoryId=? WHERE packageId=?";
	eval {
		local $dbh->{RaiseError} = 1;
		local $dbh->{PrintError} = 0;
		$dbh->do($sql,undef,($packageName,$emassId,$reqRar,$pocName,$pocEmail,$pocPhone,$macClId,$repositoryId,$packageId));
	};
	if ($@) {
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = $packageId;
		$returnObj->{'errorStr'} = $@;
		$dbh->rollback;
		finish();
	}
	# addAuditActivityDetails($dbh,$activityId,{
		# "update"=>"package",
		# "packageId"=>"$packageId",
		# "name"=>"$packageName",
		# "boundary"=>"$emassId"
		# });	
	}

# Rebuild asset_package_map
if (scalar @$assetIds > 0) {
	my $assetParamStr = join ',' => ('?') x @$assetIds; # create string with the correct number of '?'s
	$sql = "DELETE from asset_package_map where packageId=? and assetId not in ($assetParamStr)";
	eval {
		local $dbh->{RaiseError} = 1;
		local $dbh->{PrintError} = 0;
	$	dbh->do($sql,undef,($packageId,@$assetIds));
	};
	if ($@) {
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = $packageId;
		$returnObj->{'errorStr'} = $@;
		$dbh->rollback;
		finish();
	}
	$sql = "INSERT /*+ ignore_row_on_dupkey_index(asset_package_map, ASSET_PACKAGE_MAP_INDEX1) */ into asset_package_map(assetId,packageId) VALUES (?,?)";
	$sth = $dbh->prepare($sql);
	foreach my $assetId (@$assetIds) {	
		eval {
			local $dbh->{RaiseError} = 1;
			local $dbh->{PrintError} = 0;
			$sth->execute(($assetId,$packageId));
		};
		if ($@) {
			$returnObj->{'success'} = \0;
			$returnObj->{'id'} = $packageId;
			$returnObj->{'errorStr'} = $@;
			$dbh->rollback;
			finish();
		}
		#($assetName) = $dbh->selectrow_array("Select name FROM stigman.assets where assetId = ?",undef,($assetId));	
		#addAuditActivityDetails($dbh,$activityId,{"assetAssignedToPackage"=>"$assetName"});
	}
} else {
	$sql = "DELETE from asset_package_map where packageId=?";
	$dbh->do($sql,undef,($packageId));
}

eval {
	local $dbh->{RaiseError} = 1;
	local $dbh->{PrintError} = 0;
	$dbh->commit;
};
if ($@) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $packageId;
	if ($@ =~ /PKG_IP_IS_UNIQUE/ms) {
		$returnObj->{'errorStr'} = "The same IP address is assigned to multiple assets. The package was not updated.";
	} else {
		$returnObj->{'errorStr'} = "There was an unexpected error saving your changes. The package was not updated.";
	}
	$returnObj->{'errormsg'} = $@;
	$dbh->rollback;
	finish();
}

$returnObj->{'success'} = \1;
$returnObj->{'id'} = $packageId;
finish();

sub finish {
	print encode_json($returnObj);
	exit;
}
