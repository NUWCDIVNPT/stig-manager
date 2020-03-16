#!/usr/bin/perl
#$Id: getAssetProps.pl 807 2017-07-27 13:04:19Z csmig $

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
$id = $q->param('id');
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
my $userObj = getUserObject($stigmanId,$dbh,$q);
my ($hashref);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	if ($id != 0) {
		$sql =<<END;
SELECT 
	name as "name"
	,profile as "profile"
	,ip as "ip"
	,domain as "group"
	,dept as "dept" 
	,nonnetwork as "nonnetwork"
	,scanexempt as "scanexempt"
FROM assets 
where assetId=?
END
		$hashref = $dbh->selectrow_hashref($sql,undef,($id));
		$sql =<<END;
SELECT 
	stigId as "stigId" 
FROM stig_asset_map 
where assetId=?
END
		$hashref->{'stigs'} = $dbh->selectcol_arrayref($sql,undef,($id));
		$sql =<<END;
SELECT 
	packageId as "packageId" 
FROM asset_package_map 
where assetId=?
END
		$hashref->{'packages'} = $dbh->selectcol_arrayref($sql,undef,($id));
	} else {
		$hashref->{'dept'} = $userObj->{'dept'};
	}
	$json = encode_json $hashref;
}
	
print "Content-Type: text/html\n\n";
print "{\"success\": true,\"data\": $json}\n";
