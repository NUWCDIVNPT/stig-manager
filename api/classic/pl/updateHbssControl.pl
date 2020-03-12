#!/usr/bin/perl
#$Id: updateHbssControl.pl 807 2017-07-27 13:04:19Z csmig $


use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;

$q = CGI->new;
$packageId = $q->param('packageId');
$saIds  = decode_json $q->param('saIds');
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

print "Content-Type: text/html\n\n";
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	$sqlReset =<<END;
update
	stig_asset_map
SET
	disableImports = 0
WHERE
	saId in (
		select
		  saId
		from
		  stig_asset_map sa
		  left join asset_package_map ap on ap.assetId=sa.assetId
		where
		  ap.packageId = ?
    )
END
	$dbh->do($sqlReset,undef,($packageId));
	if (scalar @$saIds) {
		$paramStr = join ',' => ('?') x @$saIds; # create string with the correct number of '?'s
		$sqlUpdate =<<END;
UPDATE
	stig_asset_map
SET
	disableImports = 1
WHERE
	saId IN ($paramStr)
END
		$dbh->do($sqlUpdate,undef,(@$saIds));
	}
	print "{\"success\":\"true\"}\n";
} else {
	print "{\"success\":\"false\"}\n";
}	
