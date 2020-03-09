#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$q = CGI->new;
$raId = $q->param('raId');
$stigmanId = $q->cookie('stigmanId');

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Invalid user.\"}\n";	
	exit;
}
$userId = $userObj->{'id'};

$sqlRemoveMap =<<END;
DELETE FROM
	stigman.review_artifact_map
WHERE
	raId = ?
END
$rv = $dbh->do($sqlRemoveMap,undef,($raId));
$returnObject = {
	'success' => \1
};

$json = encode_json $returnObject;
print "Content-Type: text/html\n\n";
print $json;
