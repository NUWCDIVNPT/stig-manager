#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Digest::SHA1  qw(sha1 sha1_hex sha1_base64);
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$q = CGI->new;
$artId = $q->param('artId');
$stigmanId = $q->cookie('stigmanId');

my $responseHashRef = {};
$responseHashRef->{'success'} = 'true';

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q,1))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Invalid user.\"}\n";	
	exit;
}
$userId = $userObj->{'id'};
$userDept = $userObj->{'dept'};


#####################################
# START: SQL statements
#####################################
$sqlDelArtifact =<<END;
	DELETE FROM stigman.artifacts WHERE artId=?
END

#####################################
# END: SQL statements
#####################################

if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	$rv = $dbh->do($sqlDelArtifact,undef,($artId));
	if ($rv) {
		$returnObject = {
			'success' => \1
		};

		$json = encode_json $returnObject;
		print "Content-Type: text/html\n\n";
		print $json;
	}
}
