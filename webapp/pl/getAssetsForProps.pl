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
$userObj = getUserObject($stigmanId,$dbh,$q);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	$sql=<<END;
SELECT 
	a.assetId as "assetId",
	case when a.domain IS NOT NULL then 
		a.name || ' (' || a.domain || ')'
	else 
		a.name
	end as "assetName",
	a.ip as "ip"
FROM 
	stigman.assets a
order by 
	name
END
	my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
	my $numRecords = @$arrayref;
	my $json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
}


