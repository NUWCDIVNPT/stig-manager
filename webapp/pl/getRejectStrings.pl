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
$stigmanId = $q->cookie('stigmanId');
$db = $STIGMAN_DB;
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
my $sql =<<END;
SELECT
	r.rejectId as "rejectId",
	r.shortStr as "shortStr",
	r.longStr as "longStr"
FROM
	stigman.reject_strings r
order by
	rejectId
END
$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
$numRecords = @$arrayref;

$json = encode_json $arrayref;
print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";

