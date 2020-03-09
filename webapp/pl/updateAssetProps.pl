#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
use Data::Dumper;
#use Log::Log4perl qw(:easy);

my (
	$returnObj,
	$dbh,
	$userObj,
	$sql,
	$sth,
	$rv,
	$log
);

my $q = CGI->new;
my $assetId  = $q->param('id');
my $stigsArray  = decode_json $q->param('stigs');
my $packages  = decode_json $q->param('packages');
my $name  = $q->param('name');
my $profile  = $q->param('profile');
my $ip  = $q->param('ip');
my $group  = $q->param('group');
my $dept  = $q->param('dept');
my $nonnetwork  = $q->param('nonnetwork');
my $scanexempt  = $q->param('scanexempt');
my $stigmanId = $q->cookie('stigmanId');

# Total hack for now, it would better if the framework
# submitted the nulled ip but disabled fields are not submitted.
if ($nonnetwork eq "on") {
	$ip = '';
	$scanexempt = 'on';
}

print "Content-Type: application/json\n\n";

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $assetId;
	$returnObj->{'errorStr'} = "Can't connect to database";
	finish();
}
$dbh->{AutoCommit} = 0;

if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $assetId;
	$returnObj->{'errorStr'} = "User not found";
	finish();
}
my $userId = $userObj->{'id'};


#$sqlLog = "insert into stigman.audits (userId,logText) values (?,?)";
#$sthLog = $dbh->prepare($sqlLog);
#$sthLog->execute(($userId,"Starting updateAssetProps.pl"));
#my $activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);

if (!$userObj->{'canAdmin'} && $userObj->{'role'} ne 'IAO' && $userObj->{'role'} ne 'Staff') {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $assetId;
	$returnObj->{'errorStr'} = "Forbidden";
	finish();
}
# asset table
if ($assetId == 0) { # This is a new record
	# New asset record
	$sql = "INSERT into assets(name,domain,ip,dept,nonnetwork,scanexempt) VALUES (?,?,?,?,?,?) returning assetId into ?";
	$sth = $dbh->prepare($sql);
	$sth->bind_param(1,$name);
	$sth->bind_param(2,$group);
	$sth->bind_param(3,$ip);
	$sth->bind_param(4,$dept);
	$sth->bind_param(5,$nonnetwork eq 'on' ? 1 : 0);
	$sth->bind_param(6,$scanexempt eq 'on' ? 1 : 0);
	$sth->bind_param_inout(7,\$assetId,32);
	eval {
		local $sth->{RaiseError} = 1;
		local $sth->{PrintError} = 0;
		$sth->execute();
	};
	if ($@) {
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = 0;
		$returnObj->{'errorStr'} = $@;
		$dbh->rollback;
		finish();
	}
} else {
	# This is an update to an existing asset
	# Update the submitted fields only
	my @params = ();
	my $fieldMap = {
		'name' => $name,
		'profile' => $profile,
		'domain' => $group,
		'ip' => $ip,
		'dept' => $dept,
		'nonnetwork' => $nonnetwork eq 'on'? 1 : 0,
		'scanexempt' => $scanexempt eq 'on'? 1 : 0
	};
	$sql = "UPDATE assets SET ";
	my @sqlSets = ();
	foreach my $field (keys %$fieldMap) {
		if (defined $fieldMap->{$field}) {
			push(@sqlSets,"$field=?");
			push(@params,$fieldMap->{$field});
		}
	}
	$sql .= join(",",@sqlSets);
	$sql .= " WHERE assetId=?";
	push(@params,$assetId);
	$log = $sql;
	eval {
		local $dbh->{RaiseError} = 1;
		local $dbh->{PrintError} = 0;
		$dbh->do($sql,undef,@params);
	};
	
	if ($@) {
		$log .= $@;
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = $assetId;
		if ($@ =~ /ORA-12008/) {
			$returnObj->{'errorStr'} = "The IP address is already assigned to one of this asset's packages. No changes were saved.";
		} else {
			$returnObj->{'errorStr'} = 'There was a database error';
		}
		$dbh->rollback;
		finish();

	}
	
	if ($nonnetwork eq 'on' || $scanexempt eq 'on') {
		$sql = "UPDATE asset_package_map set scanresultId = NULL where assetId = ?";
		eval {
			local $dbh->{RaiseError} = 1;
			local $dbh->{PrintError} = 0;
			$dbh->do($sql,undef,($assetId));
		};
		if ($@) {
			$returnObj->{'success'} = \0;
			$returnObj->{'id'} = $assetId;
			$returnObj->{'errorStr'} = $@;
			$dbh->rollback;
			finish();
		}
	}
	
	# Audit
	# $sthLog->execute(($userId,"$sql : @params"));
	# addAuditActivityDetails($dbh,$activityId,{
		# "update"=>"asset",
		# "name"=>$name,
		# "profile"=>$profile,
		# "assetId"=>$assetId
		# });				
}

# Delete existing statistics (!)
$sql =<<END;
DELETE from stats_asset_stig where assetId=?
END
eval {
	local $dbh->{RaiseError} = 1;
	local $dbh->{PrintError} = 0;
	$dbh->do($sql,undef,($assetId));
};
if ($@) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $assetId;
	$returnObj->{'errorStr'} = $@;
	$dbh->rollback;
	finish();
}

# Rebuild stig_asset_map
if (scalar @$stigsArray > 0) {
	# Get the stigIds
	my @stigIds = ();
	foreach my $stigHash (@$stigsArray) {
		push(@stigIds,$stigHash->{'parent'});
	}
	# Delete any mapping where the stigId is not in the submitted list
	my $stigParamStr = join ',' => ('?') x @stigIds; # create string with the correct number of '?'s
	$sql = "DELETE from stig_asset_map where assetId=? and stigId NOT IN ($stigParamStr)";
	eval {
		local $dbh->{RaiseError} = 1;
		local $dbh->{PrintError} = 0;
		$dbh->do($sql,undef,($assetId,@stigIds));
	};
	if ($@) {
		$returnObj->{'success'} = \0;
		$returnObj->{'id'} = $assetId;
		$returnObj->{'errorStr'} = $@;
		$dbh->rollback;
		finish();
	}

	# $sthLog->execute(($userId,"DELETE from stig_asset_map where assetId=$assetId and stigId NOT IN(@stigIds)"));
	# Insert new stigId mappings, ignore existing mappings
	$sql="insert /*+ ignore_row_on_dupkey_index(stig_asset_map, index_2_3_C) */ into  stig_asset_map (assetId,stigId) values (?,?)";
	$sth = $dbh->prepare($sql);
	foreach my $stigId (@stigIds) {
		updateStatsAssetStig($assetId,$stigId,$dbh); # lots of unnecessary overhead!
		$sth->execute(($assetId,$stigId));
		# $sthLog->execute(($userId,"INSERT IGNORE into stig_asset_map(assetId,stigId) VALUES ($assetId,$stigId)"));
		# addAuditActivityDetails($dbh,$activityId,{"stigAssignment"=>$stigId});			
	}
} else { 
	# stigsArray is empty, so remove all assignments
	$sql = "DELETE from stig_asset_map where assetId=?";
	$dbh->do($sql,undef,($assetId));
}	

# Rebuild user_stig_asset_map
foreach my $stigHash (@$stigsArray) {
	if (ref($stigHash->{'children'}) eq 'ARRAY') {
		# we were provided userIds
		my $stigId = $stigHash->{'parent'};
		my $userIds = $stigHash->{'children'};
		$sql = "SELECT saId FROM stigman.stig_asset_map WHERE assetId=? and stigId=?";
		(my $saId) = $dbh->selectrow_array($sql,undef,($assetId,$stigId));
#-->			#############################################################
#-->			# For IAOs, server-side should enforce only delete from their department
#-->			#############################################################
		$sql = "DELETE FROM stigman.user_stig_asset_map WHERE saId = ?";
		$dbh->do($sql,undef,($saId));
		$sql = "INSERT INTO stigman.user_stig_asset_map (userId,saId) VALUES (?,?)";
		$sth = $dbh->prepare($sql);
		foreach $userId (@$userIds) {
			$sth->execute(($userId,$saId));
			# ($userName) = $dbh->selectrow_array("Select cn FROM stigman.user_data where id = $userId");	
			# ($stigId) = $dbh->selectrow_array("Select stigId FROM stigman.stig_asset_map sam where saId = $saId");
			# addAuditActivityDetails($dbh,$activityId,{"userAndStigAssignment" => "$userName-$stigId"});						
		}
	}
}

# Rebuild asset_package_map
if (scalar @$packages > 0) {
	my $pkgParamStr = join ',' => ('?') x @$packages; # create string with the correct number of '?'s
	$sql = "DELETE from asset_package_map where assetId=? and packageId not in ($pkgParamStr)";
	$dbh->do($sql,undef,($assetId,@$packages));
	# $sthLog->execute(($userId,"DELETE from asset_package_map where assetId=$assetId"));
	$sql = "INSERT /*+ ignore_row_on_dupkey_index(asset_package_map, ASSET_PACKAGE_MAP_INDEX1) */ into asset_package_map(assetId,packageId) VALUES (?,?)";
	$sth = $dbh->prepare($sql);
	foreach my $package (@$packages) {
		eval {
			local $dbh->{RaiseError} = 1;
			local $dbh->{PrintError} = 0;
			$sth->execute(($assetId,$package));
		};
		if ($@) {
			$returnObj->{'success'} = \0;
			$returnObj->{'id'} = $assetId;
			$returnObj->{'errorStr'} = $@;
			$dbh->rollback;
			finish();
		}
		# $sthLog->execute(($userId,"INSERT into asset_package_map(assetId,packageId) VALUES ($assetId,$package)"));
		# ($packageName) = $dbh->selectrow_array("select name from stigman.packages where packageId=?",undef,($package));
		# addAuditActivityDetails($dbh,$activityId,{"packageAssignment"=>$packageName});			
	}
} else {
	$sql = "DELETE from asset_package_map where assetId=?";
	$dbh->do($sql,undef,($assetId));
}

eval {
	local $dbh->{RaiseError} = 1;
	local $dbh->{PrintError} = 0;
	$dbh->commit;
};
if ($@) {
	$returnObj->{'success'} = \0;
	$returnObj->{'id'} = $assetId;
	if ($@ =~ /PKG_IP_IS_UNIQUE/ms) {
		$returnObj->{'errorStr'} = "The IP address is already assigned to one of this asset's packages. The asset was not updated.";
	} else {
		$returnObj->{'errorStr'} = "There was an unexpected error saving your changes. The asset was not updated.";
	}
	$returnObj->{'errormsg'} = $@;
	$dbh->rollback;
	finish();
}

$returnObj->{'success'} = \1;
$returnObj->{'id'} = $assetId;
finish();

sub finish {
	print encode_json($returnObj);
	exit;
}

