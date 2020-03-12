#!/usr/bin/perl
# $Id: getGroupsForProps.pl 807 2017-07-27 13:04:19Z csmig $

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

$sql=<<END;
SELECT 
	groupId as "groupId"
	,groupName as "groupName"
FROM 
	asset_groups ag 
order by groupId
END

my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
my $numRecords = @$arrayref;
my $json = encode_json $arrayref;

print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
