#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


my $db = $STIGMAN_DB;

$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q) or die;

$sql=<<END;
SELECT
	a.assetId as "assetId"
	,a.name as "assetName"
	,a.dept as "dept"
	,a.domain as "assetGroup"
FROM
	assets a
END
if ($userObj->{'role'} eq 'IAO') {
	$sql .= "WHERE a.dept = ?";
	$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },($userObj->{'dept'}));
} else {
	$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
}

my $numRecords = @$arrayref;
my $json = encode_json $arrayref;
print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";



