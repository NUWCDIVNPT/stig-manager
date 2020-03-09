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
$coder = JSON::XS->new->ascii->pretty->allow_nonref;
$stigmanId = $q->cookie('stigmanId');
$xaction = $q->param('xaction');
if ($rowsJson = $q->param('rows')){
	$rows = $coder->decode($rowsJson);
}
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}

my $returnObject;
if (!$xaction || $xaction eq 'read') {
	my $sql =<<END;
SELECT
	p.packageId as "packageId",
	p.name as "packageName",
	p.emassId as "emassId",
	p.reqRar as "reqRar",
	p.pocName as "pocName",
	p.pocEmail as "pocEmail",
	p.pocPhone as "pocPhone",
	mc.longName as "macCl" -- ,
	-- r.name as "repositoryName"
FROM 
	stigman.packages p
	left join iaControls.mac_cl mc on mc.macClId=p.macClId
	-- left join VARS_2.repositories r on r.repositoryId=p.repositoryId
order by 
	p.name
END
	$returnObject->{'rows'} = $dbh->selectall_arrayref($sql,{ Slice => {} });
	$returnObject->{'records'} = @{$returnObject->{'rows'}};


	
	$sql =<<END;
SELECT
	macClId as "macClId",
	longName as "longName",
	shortName as "shortName",
	profileName as "profileName"
FROM 
	iaControls.mac_cl
order by 
	macClId
END
	$returnObject->{'macCls'} = $dbh->selectall_arrayref($sql);
	
} elsif ($xaction eq 'destroy' && $userObj->{'canAdmin'}) {
	my $sql = "delete FROM stigman.packages where packageId=?";
	$rv = $dbh->do($sql,undef,($rows));		
	if ($rv) {
		$returnObject->{'success'} = \1; 
	} else {
		$returnObject->{'success'} = \0; 
		$returnObject->{'$rv'} = $rv; 
		$returnObject->{'sql'} = $sql; 
	}
}

$json = encode_json $returnObject;
print "Content-Type: text/html\n\n";
print $json;

