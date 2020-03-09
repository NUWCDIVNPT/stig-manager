#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


my $db = $STIGMAN_DB;

my $q = CGI->new;
my $coder = JSON::XS->new->ascii->pretty->allow_nonref;
my $id = $q->param('id');
my $stigmanId = $q->cookie('stigmanId');

my $dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
my $userObj = getUserObject($stigmanId,$dbh,$q);

my ($returnObject,$sql);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	if ($id != 0) {
		$sql =<<END;
SELECT
	p.packageId as "packageId",
	p.name as "packageName",
	p.emassId as "emassId",
	p.reqRar as "reqRar",
	p.pocName as "pocName",
	p.pocEmail as "pocEmail",
	p.pocPhone as "pocPhone",
	p.macClId as "macClId",
	p.repositoryId as "repositoryId"
FROM 
	stigman.packages p
where
	packageId=? 
END
		$returnObject->{'data'} = $dbh->selectrow_hashref($sql,undef,($id));
		$sql =<<END;
SELECT 
	distinct assetId as "assetId" 
FROM 
	asset_package_map 
where packageId=?
END
		$returnObject->{'data'} ->{'assets'} = $dbh->selectcol_arrayref($sql,undef,($id));
	} else {
		$returnObject->{'data'}->{'packageName'} = '';
	}
	$returnObject->{'success'} = \1;

}
$json = encode_json $returnObject;
print "Content-Type: text/html\n\n";
print $json;
