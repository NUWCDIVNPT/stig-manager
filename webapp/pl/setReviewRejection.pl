#!/usr/bin/perl

use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

# This script does NOT set the statusId
# In STIG Manager, that task is handled by updateReviews.pl,
# which is called when the reviewsStore in packageReview.js is saved

$db = $STIGMAN_DB;
$q = CGI->new;

$rejectIds  = decode_json $q->param('rejectIds');
$checkIds  = decode_json $q->param('checkIds');
$rejectText  = $q->param('rejectText');

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

# Need to handle multiple reviews
foreach $checkId (@$checkIds) {
	setReviewRejection($dbh,$userId,$checkId,$rejectIds,$rejectText);
}
print "Content-Type: text/html\n\n";
print "{\"success\": true}\n";

sub setReviewRejection {
	my ($dbh,$userId,$checkId,$rejectIds,$rejectText) = @_;
	my ($assetId,$ruleId) = split("!",$checkId);
		# delete any existing mappings
	$sql=<<END;
	DELETE FROM 
		review_reject_string_map
	WHERE
		assetId=? and 
		ruleId=?
END
	$sth = $dbh->prepare($sql);
	$rv = $sth->execute(($assetId,$ruleId));
	
	# insert current mappings
	$sql=<<END;
	INSERT INTO review_reject_string_map (assetId,ruleId,rejectId,userId) VALUES (?,?,?,?)
END
	$sth = $dbh->prepare($sql);
	foreach my $rejectId (@$rejectIds) {
		$rv = $sth->execute(($assetId,$ruleId,$rejectId,$userId));
	}
	
	# update any existing rejectText and set the rejectUserId
	$sql=<<END;
	UPDATE
		reviews r
	SET
		rejectText = ?,
		userId = ?,
		rejectUserId = ?
	WHERE
		r.assetId=? and 
		r.ruleId=?
END
	$sth = $dbh->prepare($sql);
	$rv = $sth->execute(($rejectText,$userId,$userId,$assetId,$ruleId));
}