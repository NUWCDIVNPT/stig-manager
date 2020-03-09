#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}

$sql=<<END;
SELECT 
	stigId as "stigId"
	,title as "title" 
FROM stigs.stigs s 
order by title
END


my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
my $numRecords = @$arrayref;
my $json = encode_json $arrayref;

print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
