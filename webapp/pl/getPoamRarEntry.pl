#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use Text::CSV;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = 'stigman';
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$findingType = $q->param('findingType');
$sourceId = $q->param('sourceId');

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
$userId = $userObj->{'id'};

$sql=<<END;
select
	preId as "preId",
	packageId as "packageId",
	findingType as "findingType",
	sourceId as "sourceId",
	status as "status",
	iaControl as "iaControl",
	poc as "poc",
	resources as "resources",
	to_char(compDate,'yyyy-mm-dd') as "compDate",
	milestone as "milestone",
	poamComment as "poamComment",
	recCorrAct as "recCorrAct",
	likelihood as "likelihood",
	mitDesc as "mitDesc",
	residualRisk as "residualRisk",
	remDesc as "remDesc",
	rarComment as "rarComment"
from
	stigman.poam_rar_entries pre
where
	pre.packageId = ?
	and pre.findingType = ?
	and pre.sourceId = ?
END
@bindValues = ($packageId,$findingType,$sourceId);

my $sth = $dbh->prepare($sql);
my $rv = $sth->execute(@bindValues);
$hashref = $sth->fetchrow_hashref();

if (!$hashref) {
	# No records returned, build hashref with null values
	$columnNames = $sth->{NAME};
	$hashref = {};
	foreach $columnName (@$columnNames) {
		$hashref->{$columnName} = undef;
	}
	$hashref->{'rv'} = $rv;
	$hashref->{'RowsInCache'} = $sth->{'RowsInCache'};
	$hashref->{'packageId'} = $packageId;
	$hashref->{'findingType'} = $findingType;
	$hashref->{'sourceId'} = $sourceId;
	
}
# else { 
	# $hashref = $sth->fetchrow_hashref();
# }

$json = encode_json $hashref;
print "Content-Type: text/html\n\n";
print "{\"success\": true,\"data\": $json}\n";
