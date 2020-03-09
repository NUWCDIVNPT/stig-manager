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

my $db = $STIGMAN_DB;
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}

$sql=<<END;
SELECT
	ud.id as "userId",
	ud.name as "username",
	ud.dept as "dept",
	ud.roleId as "roleId" 
FROM 
	stigman.user_data ud
where
	ud.roleId = 2
order by
	ud.name
END


my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
my $numRecords = @$arrayref;
my $json = encode_json $arrayref;

print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
