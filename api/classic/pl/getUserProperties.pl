#!/usr/bin/perl
# ============================================================================================
# NAME: 		getUserProperties.pl
# CREATED: 		November 7, 2016 @ 15:53
# UPDATED: 		November 10, 2016 @ 15:52 
# AUTHOR(S):	BRANDON MASSEY
# PURPOSE: 		To retrieve the user properties and STIG-ASSET assignments for a specific user 
# =============================================================================================

#===============================================================
# MODULE INCLUDES
#===============================================================
use warnings;
use strict;
use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
#===============================================================
#OBJECT VARIABLES
#===============================================================
my $db = $STIGMAN_DB;
my $q = CGI->new;
my $id = $q->param('id');
my $stigmanId = $q->cookie('stigmanId');
#my $coder = JSON::XS->new->ascii->pretty->allow_nonref;
my $dbh = undef;
my $userObj = undef;
my $hashref = {};
my $sql = '';
my $json = undef;

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q);

#===============================================================
# ONLY THOSE WITH ROLE OF "IA" OR WHO "canAdmin" CAN FETCH DATA
#===============================================================
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	#===============================================================
	# FETCH THE GENERAL USER PROPERTIES IF AN USER ID WAS PASSED
	# TO THIS SCRIPT.
	#===============================================================
	if ($id != 0) {
		$sql =<<END;
		SELECT 
		cn as "cn"
		,name as "name"
		,dept as "dept"
		,roleId as "roleId"
		,canAdmin as "canAdmin"
		FROM user_data 
		where id=?
END
		#===============================================================
		# FETCH THE USER GENERAL USER PROPERTIES WHILE RETAINING THE 
		# BOOLEAN NATURE OF THE canAdmin FLAG.
		#===============================================================
		$hashref = $dbh->selectrow_hashref($sql,undef,($id));
		if ($hashref->{'canAdmin'} == 1) {
			$hashref->{'canAdmin'} = \1;
		} else {
			$hashref->{'canAdmin'} = \0;
		}
		#===============================================================
		# SQL FOR THE STIG-ASSET ASSIGNMENTS FOR THE SPECIFIC USER
		#===============================================================
		$sql =<<END;
		SELECT 
			sam.assetId as "assetId", 
			sam.stigId as "stigId", 
			sam.stigId as "title",
			a.name as "name", 
			sam.said as "saId"
		FROM user_stig_asset_map usam 
		INNER JOIN stig_asset_map sam ON sam.said = usam.said
		INNER JOIN assets a ON a.assetId = sam.assetId
		INNER JOIN stigs.stigs s ON s.stigId = sam.stigId
		where userId=?
END
		#===============================================================
		# FETCH THE STIG-ASSET ASSIGNMENTS FOR THE GIVEN USER AND ADD
		# THE DATA AS AN ELEMENT OF OUR HASH REFERENCE.
		#===============================================================
		my $assignments = $dbh->selectall_arrayref($sql,{Slice => {}},($id));
		$hashref->{'currentAssignments'} = {rows => $assignments};
	} else {
		#===============================================================
		# NO USER ID WAS SPECIFIED. THIS MUST BE A NEW USER
		#===============================================================
		$hashref->{'cn'} = '';
	}
	#===============================================================
	# FINALLY, ENCODE ANY RESULTING DATA AS JSON
	#===============================================================
	$json = encode_json ({
		success => \1, 
		data 	=> $hashref
	});
	# $json = encode_json $hashref;
}
#===============================================================
# RETURN THE USER PROPERTIES DATA TO THE FRONT-END
#===============================================================	
print "Content-Type: text/html\n\n";
print "$json\n"
#print "{\"success\": true,\"data\": $json}\n";
