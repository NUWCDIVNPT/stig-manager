#!/usr/bin/perl
#$Id: getHbssControl.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$db = $STIGMAN_DB;

$q = CGI->new;
$coder = JSON::XS->new->ascii->pretty->allow_nonref;
$packageId = $q->param('packageId');
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
$r = $userObj->{'roles'};
my ($hashref);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	$sql =<<END;
SELECT
	sam.saId as "saId"
FROM
	packages p
	left join asset_package_map ap on ap.packageId=p.packageId
	left join stig_asset_map sam on sam.assetId=ap.assetId
WHERE
	p.packageId = ?
	and sam.disableImports = 1
END
	$hashref->{'stigAssets'} = $dbh->selectcol_arrayref($sql,undef,($packageId));
	$json = encode_json $hashref;
	print "Content-Type: text/html\n\n";
	print "{\"success\": true,\"data\": $json}\n";
} else {
	print "Content-Type: text/html\n\n";
}	
