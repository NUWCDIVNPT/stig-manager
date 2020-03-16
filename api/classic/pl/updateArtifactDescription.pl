#!/usr/bin/perl
# $Id: updateArtifactDescription.pl 807 2017-07-27 13:04:19Z csmig $

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
$description = $q->param('desc');
$stigmanId = $q->cookie('stigmanId');

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

$sqlUpdateArtifactDescription =<<END;
UPDATE 
	artifacts
SET
	description = ?
WHERE
	artId = ?
END
$rv = $dbh->do($sqlUpdateArtifactDescription,undef,($description,$artId));
$returnObject = {
	'success' => \1
};

$json = encode_json $returnObject;
print "Content-Type: text/html\n\n";
print $json;
