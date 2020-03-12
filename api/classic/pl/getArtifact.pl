#!/usr/bin/perl
# $Id: getArtifact.pl 807 2017-07-27 13:04:19Z csmig $

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
$artId = $q->param('artId');
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
$dbh->{LongReadLen} = 100000000;

$userId = $userObj->{'id'};

$sqlGetAttachment =<<END;
SELECT
	art.filename,
	ab.data
FROM
	stigman.artifacts art
	left join stigman.artifact_blobs ab on ab.sha1=art.sha1
WHERE
	art.artId = ?
END
($filename,$content) = $dbh->selectrow_array($sqlGetAttachment,undef,($artId));
print "Content-Type: application/octet\n";
print "Content-Disposition: attachment;filename=$filename\n\n";
print $content;
