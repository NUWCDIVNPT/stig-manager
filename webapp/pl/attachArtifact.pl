#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$q = CGI->new;
$assetId = $q->param('assetId');
$ruleId = $q->param('ruleId');
$artId = $q->param('artId');
$stigmanId = $q->cookie('stigmanId');

my $responseHashRef = {};
$responseHashRef->{'success'} = 'true';

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
$userDept = $userObj->{'dept'};

#####################################
# START: SQL statements
#####################################
$sqlGetArtifact =<<END;
SELECT
	ra.raId as "raId",
	ra.artId as "artId",
	art.sha1 as "sha1",
	art.filename as "filename",
	art.description as "description",
	to_char(art.ts,'yyyy-mm-dd hh24:mi:ss') as "ts",
	ud.name as "userName"
FROM
	review_artifact_map ra
	left join artifacts art on art.artId=ra.artId
	left join user_data ud on ud.id=ra.userId
WHERE
	ra.raId = ?
END

$sqlSetMap =<<END;
	INSERT INTO review_artifact_map (assetId,ruleId,artId,userId) VALUES (?,?,?,?) returning raId into ?
END
#####################################
# END: SQL statements
#####################################

$sthSetMap = $dbh->prepare($sqlSetMap);
$sthSetMap->bind_param(1,$assetId);
$sthSetMap->bind_param(2,$ruleId);
$sthSetMap->bind_param(3,$artId);
$sthSetMap->bind_param(4,$userId);
$sthSetMap->bind_param_inout(5,\$raId,32);
$rv = $sthSetMap->execute();
if ($rv > 0) {
	$artifactsRows = $dbh->selectall_arrayref($sqlGetArtifact,{ Slice => {} },($raId));
	$numRecords = @$artifactsRows;
	$responseHashRef->{'artifacts'} = {
		'records' => int $numRecords,
		'rows' => $artifactsRows
	};											
}
my $json = encode_json $responseHashRef;
print "Content-Type: text/html\n\n";
print $json;

