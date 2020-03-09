#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigId  = $q->param('stigId');
$assetIds  = decode_json $q->param('assetIds');
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
$userId = $userObj->{'id'};

print "Content-Type: text/html\n\n";
$sqlLog = "insert into audits (userId,logText) values (?,?)";
$sthLog = $dbh->prepare($sqlLog);
$sthLog->execute(($userId,"Starting updateStigAssignments.pl"));
my $activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);

if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
		# Delete any mapping where the assetId is not in the submitted list
		my ($assetParamStr,$assetClause);
		my @params;
		if (@$assetIds) {
			$assetParamStr = join ',' => ('?') x @$assetIds; # create string with the correct number of '?'s
			$assetWhereClause = "and sa.assetId NOT IN ($assetParamStr)";
			@params = ($stigId,@$assetIds);
		} else {
			$assetWhereClause = '';
			@params = ($stigId);
		}
			
		if ($userObj->{'role'} eq 'IAO') { #limit to dept
			$sql =<<END;
DELETE from
stig_asset_map
where
saId in 
(select saId from stig_asset_map sa
left join assets a on a.assetId=sa.assetId
where sa.stigId = ? $assetWhereClause and a.dept =?)
END
			push(@params,$userObj->{'dept'});
			$dbh->do($sql,undef,@params);
			$sthLog->execute(($userId,"DELETE from stig_asset_map where stigId=$stigId and assetId NOT IN(@assetIds) and dept=$userObj->{'dept'}"));
		} else { # full admin
			$sql = "DELETE from stig_asset_map sa where sa.stigId=? $assetWhereClause";
			$dbh->do($sql,undef,@params);
			$sthLog->execute(($userId,"DELETE from stig_asset_map where stigId=$stigId and assetId NOT IN(@assetIds)"));
		}
		
		# Delete stats where the assetId is not in the submitted list
		if ($userObj->{'role'} eq 'IAO') { #limit to dept
			$sql =<<END;
DELETE from
stats_asset_stig
where id in
(select id from stats_asset_stig sa
left join assets a on a.assetId=sa.assetId
where sa.stigId = ? $assetWhereClause and a.dept = ?)
END
			$dbh->do($sql,undef,@params);
		} else { #full admin
			$sql = "DELETE from stats_asset_stig sa where sa.stigId = ? $assetWhereClause";
			$dbh->do($sql,undef,@params);
		}

		# Insert new stigId mappings, ignore existing mappings
		# THIS DOES NOT VERIFY THE ASSET IS IN THE IAOs DEPT !!
		$sql = "INSERT /*+ ignore_row_on_dupkey_index(stig_asset_map, INDEX_2_3_C) */ into stig_asset_map(assetId,stigId) VALUES (?,?)";
		$sth = $dbh->prepare($sql);
		foreach $assetId (@$assetIds) {
			$sth->execute(($assetId,$stigId));
			$sthLog->execute(($userId,"INSERT IGNORE into stig_asset_map(assetId,stigId) VALUES ($assetId,$stigId)"));
			addAuditActivityDetails($dbh,$activityId,{"assetAssignment"=>$assetId});			
			updateStatsAssetStig($assetId,$stigId,$dbh); # unnecessary overhead for existing assignments!
		}
	print "{\"success\":\"true\",\"id\":\"$assetId\"}\n";
} else {
	print "{\"success\":\"false\",\"id\":\"$assetId\"}\n";
}

