#!/usr/bin/perl
#$Id: getStigUserProps.pl 807 2017-07-27 13:04:19Z csmig $

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
$assetId = $q->param('assetId');
$stigId = $q->param('stigId');
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO') {
	$sql =<<END;
SELECT 
	userId as "userId"
from 
	user_stig_asset_map usam
left join 
	stig_asset_map sam on sam.saId=usam.saId
where 
	sam.assetId=? 
	and sam.stigId=?	
END
	$hashref->{'users'} = $dbh->selectcol_arrayref($sql,undef,($assetId,$stigId));
	$json = encode_json $hashref;
}
	
print "Content-Type: text/html\n\n";
print "{\"success\": true,\"data\": $json}\n";
