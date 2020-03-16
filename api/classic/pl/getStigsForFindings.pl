#!/usr/bin/perl
#$Id: getStigsForFindings.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');

#$db = 'stigman';
$dbh = gripDbh("PSG-STIGMAN",undef, 'oracle') or die $dbh->errstr;
 if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	 exit;
 }

@bindValues = ($packageId);
$sql =<<END;
select
	distinct sa.stigId as "stigId"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
where 
	ap.packageId = ?
	and sa.stigId is not null
order by 
	sa.stigId
END

$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@bindValues);
unshift(@$arrayref,{'stigId' => '--Any--'});
$numRecords = @$arrayref;

$json = encode_json $arrayref;
print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"classification\": \"$classification\",\"rows\": $json}\n";

