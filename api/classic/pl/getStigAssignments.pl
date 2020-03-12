#!/usr/bin/perl
#$Id: getStigAssignments.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$q = CGI->new;
$coder = JSON::XS->new->ascii->pretty->allow_nonref;
$stigId = $q->param('stigId');
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q);
$r = $userObj->{'roles'};
my ($hashref);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	$sql =<<END;
SELECT 
	assetId as "assetId"
FROM 
stig_asset_map 
where stigId=?
END
	$hashref->{'assetAssignments'} = $dbh->selectcol_arrayref($sql,undef,($stigId));
	$json = encode_json $hashref;
}
	
print "Content-Type: text/html\n\n";
print "{\"success\": true,\"data\": $json}\n";
