#!/usr/bin/perl
# =============================================================================================
# NAME: 		updateUserProperties.pl
# CREATED: 		November 9, 2016 @ 15:53
# UPDATED: 		November 10, 2016 @ 15:51 
# AUTHOR(S):	BRANDON MASSEY
# PURPOSE: 		Updates the user properties for a specific user including STIG-ASSET assignments 
# ==============================================================================================

#===============================================================
# MODULE INCLUDES
#===============================================================
use warnings;
use strict;
use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
#===============================================================
#OBJECT VARIABLES
#===============================================================
my $db = $STIGMAN_DB;
my $dbh = undef;
my $userObj = undef;
my $sql = undef;
my $sth = undef;
my $rv = undef;
my @params=();

my $stigId='';
my $assetName='';
my $saId = 0;

my $q = CGI->new;
my $id  = $q->param('id');
my $roleId  = $q->param('roleId');
my $dept  = $q->param('dept');
my $canAdmin  = $q->param('canAdmin');
my $saIds  = decode_json $q->param('saIds');
my $cn  = $q->param('cn');
my $name  = $q->param('name');
my $stigmanId = $q->cookie('stigmanId');
my $activityId = undef;
#===============================================================
#PERL-IZE THE BOOLEAN NATURE OF THE CanAdmin option
#===============================================================
if ($canAdmin eq 'on') {
	$canAdmin = 1;
} else {
	$canAdmin = 0;
}
#===============================================================
#CONNECT TO THE STIGMAN DATABASE / EXIT UPON FAILED CONNECTION
#===============================================================
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
#===============================================================
#GET AN ID TO BE USED FOR SUBSEQUENT AUDIT ENTRIES.
#===============================================================
$activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);
#===============================================================
#PRINT THE RESPONSE HEADER
#===============================================================
print "Content-Type: text/html\n\n";

#===============================================================
#ONLY A USER WITH THE ABILITY TO ADMIN OR WITH THE ROLE OF IAO
#MAY UPDAGE USER PROPERTIES.
#===============================================================
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	if ($id == 0 && $userObj->{'canAdmin'}) {
	#===============================================================
	#IF AN ID PARAMETER OF 0 WAS PASSED IT MEANS THIS IS A NEW USER
	#THAT SHOULD BE INSERTED.
	#===============================================================
		$sql = "INSERT into user_data(cn,name,dept,roleId,canAdmin) VALUES (?,?,?,?,?) returning id into ?";
		$sth = $dbh->prepare($sql);
		$sth->bind_param(1,$cn);
		$sth->bind_param(2,$name);
		$sth->bind_param(3,$dept);
		$sth->bind_param(4,$roleId);
		$sth->bind_param(5,$canAdmin);
		$sth->bind_param_inout(6,\$id,32);
		$rv = $sth->execute();
		if ($rv == 1) {
			addAuditActivityDetails($dbh,$activityId,{
				"create" => "user",
				"userCn" => $cn,
				"name" => $name,
				"stigmanUserDataId" => $id
			});		
		} else {
			print "{\"success\":\"false\",\"id\":\"0\"}\n";
			exit;
		}
	} else {
		#===============================================================
		#THE USER IS A CURRENT USER AND HIS/HER PROPERTIES NEED TO BE 
		#UPDATED.
		#===============================================================
		# This should be more generic, updating submitted fields only
		if (!($userObj->{'canAdmin'})) {
			$sql = "UPDATE user_data SET name=? WHERE id=?";
			@params = ($name,$id);
		} else {
			$sql = "UPDATE user_data SET cn=?,name=?,dept=?,roleId=?,canAdmin=? WHERE id=?";
			@params = ($cn,$name,$dept,$roleId,$canAdmin,$id);
		}
		$dbh->do($sql,undef,@params);
		addAuditActivityDetails($dbh,$activityId,{
			"update" => "user",
			"userCn" => $cn,
			"name" => $name,
			"stigmanUserDataId" => $id
		});		
	}
	#===============================================================
	#REGARDLESS OF WHETHER THIS IS A NEW/EXISTING USER. PURGE ALL
	#STIG-ASSET ASSIGNMENTS FOR THAT USER
	#===============================================================
	$sql = "DELETE from user_stig_asset_map where userId=?";
	$dbh->do($sql,undef,($id));
		
	$sql = "INSERT into user_stig_asset_map(userId,saId) VALUES (?,?)";
	$sth = $dbh->prepare($sql);
	#===============================================================
	#ADD ALL ASSIGNMENTS THAT ARE PRESENT IN THE INTERFACE.
	#===============================================================
	foreach $saId (@$saIds) {
		$sth->execute(($id,$saId));
		($stigId,$assetName) = $dbh->selectrow_array("Select stigId,s.name FROM stigman.stig_asset_map sam left join assets s on s.assetId=sam.assetId where saId = ?", undef, ($saId));
		addAuditActivityDetails($dbh,$activityId,{"assetAndStigAssignment" => "$assetName-$stigId"});					
	}
	#===============================================================
	#RESPOND WITH SUCCESS.
	#===============================================================
	print encode_json({
		success	=> \1,
		id		=> $id, 
		response => "User, $name, has been Updated."
	}) . "\n";
} else {
	#===============================================================
	#RESPOND WITH FAILURE
	#===============================================================
	print encode_json({
		success	=> \0,
		id		=> $id, 
		response => "You do not have rights to this function."
	}) . "\n";
}	
