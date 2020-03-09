#!/usr/bin/perl
#==================================================================================
#NAME:			batchReviewUnlock.pl
#DESCRIPTION:	This script is responsible for resetting rule reviews at various 
#				levels of a package.  Reviews can be reset/unlocked for a whole PACKAGE, 
#				for a particular ASSET in a PACKAGE, for all ASSETS with a partic-
#				ular STIG in a PACKAGE, and for a specific ASSET with a specific
#				STIG.  
#
#PARAMETERS:	Parameters sent to this script include the STIGMANID, PACKAGEID,
#				PACKAGENAME, STIGID, ASSETID and ASSETNAME.
#RETURNS:		A response Message, response title, and a value of success or
#				failure is returned as JSON. 				
#===================================================================================

#==========================================================
#MODULE INCLUDES
#==========================================================
use strict;
use warnings;
use FindBin qw($Bin);
use lib $Bin;
use DBI;
use CGI;
use grip;
use JSON::XS;
use StigmanLib;
use Switch;
#==========================================================
#PROCESS ANY CGI PARAMETERS
#==========================================================
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId');
my $packageId = $q->param('packageId');
my $packageName = $q->param('packageName');
my $stigId = $q->param('stigId');
#my $stigName = $q->param('stigName');
my $assetId = $q->param('assetId');
my $assetName = $q->param('assetName');
my $unlockDepth = $q->param('unlockDepth');
my $userObj = undef;
my $executeReady = undef;
my $sql = '';
my $dbh = undef;
my $respObj = {
	'success' => \1, # true by default
	'responseMsg' => '',
	'responseTitle' => ''
};

#==========================================================
#CONNECT TO STIGMAN
#==========================================================
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
#==========================================================
#ATTEMPT TO GRAB THE USER OBJECT
#==========================================================
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	$respObj->{'success'} = \0;
	$respObj->{'responseMsg'} = "You are an invalid user.";
	$respObj->{'responseTitle'} = "Invalid user";
	print "Content-Type: application/json\n\n";
	print encode_json($respObj);
	exit;
}
#==========================================================
#ONLY THOSE WITH A ROLE OF IA STAFF CAN BATCH RESET!
#==========================================================
if ($userObj->{'role'} eq 'Staff') {
		my $sthUnlock = undef;
		$respObj->{'responseTitle'} = 'Review Reset Result';
		my @paramArray = ();	
		if ($packageId > 0){
			my $sql = '';
			#==================================================
			#CHECK THE PARAMETERS TO DECIDE AT WHAT LEVEL 
			#ITEMS SHOULD BE RESET
			#==================================================
			if ($assetId > 0){
				#===============================================
				#THIS IS AN ASSET-LEVEL RESET. RESET ALL 
				#REVIEWS IN ALL STIGS OF THIS SPECIFIC ASSET.
				#(updated to clear ALL STIG REVISIONS)
				#===============================================
				$sql = <<END;
					UPDATE REVIEWS 
						SET STATUSID = 0
					WHERE 
END
				#===============================================
				#MODIFY WHERE CLAUSE TO ACCOUNT FOR THE DEPTH
				#OF THE RESET.
				#===============================================
				switch($unlockDepth){
					case "S"{$sql.="statusId = 1 AND assetId = ?";}
					case "A"{$sql.="statusId = 3 AND assetId = ?";}
					case "SA"{$sql.="(statusId = 3 OR statusId = 1) AND assetId = ?";}
				}
				$sthUnlock = $dbh->prepare($sql);
				push @paramArray, $assetId;
				$executeReady = 1;
			}elsif($stigId ne ''){
				#===============================================
				#THIS IS A STIG-LEVEL RESET. RESET ALL REVIEWS
				#FOR THIS SPECIFIC STIG IN ALL ASSOCIATED ASSETS
				#updated 10/12/2016
				#===============================================
				$sql = <<END;
					UPDATE REVIEWS 
						SET STATUSID = 0
					WHERE REVIEWID IN (
						SELECT
							distinct r.reviewId
						 FROM
							stigman.reviews r
							inner join stigs.rev_group_rule_map rgr on rgr.ruleId=r.ruleId
							inner join stigs.rev_group_map rg on rg.rgId=rgr.rgId
							inner join stigs.revisions rev on rev.revId=rg.revId and rev.stigId=?
							INNER JOIN stigman.asset_package_map apm ON apm.packageId = ? AND apm.assetId=r.assetId
						 WHERE 
						   <WHERE_CLAUSE>
					)
END
				#===============================================
				#MODIFY WHERE CLAUSE TO ACCOUNT FOR THE DEPTH
				#OF THE RESET.
				#===============================================
				switch($unlockDepth){
					case "S"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 1/;}
					case "A"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 3/;}
					case "SA"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 3 OR r.statusId = 1/;}
				}
				$sthUnlock = $dbh->prepare($sql);
				push @paramArray, $stigId;
				push @paramArray, $packageId;
				$executeReady = 1;
			}else{
				#===============================================
				#THIS IS A PACKAGE-LEVEL RESET. RESET ALL 
				#REVIEWS FOR ALL ASSOCIATED STIGS OF ALL 
				#ASSOCIATED ASSETS.
				#updated 10/12/2016
				#===============================================
				$sql = <<END;
					UPDATE REVIEWS 
						SET STATUSID = 0
					WHERE REVIEWID IN (
						SELECT
						  distinct r.reviewId
						FROM
						  reviews r
						  INNER JOIN asset_package_map apm ON apm.packageId = ? AND apm.assetId = r.assetId
						WHERE 
							<WHERE_CLAUSE>
					)
END
				#===============================================
				#MODIFY WHERE CLAUSE TO ACCOUNT FOR THE DEPTH
				#OF THE RESET.
				#===============================================
				switch($unlockDepth){
					case "S"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 1/;}
					case "A"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 3/;}
					case "SA"{$sql=~ s/<WHERE_CLAUSE>/r.statusId = 3 OR r.statusId = 1/;}
				}
				$sthUnlock = $dbh->prepare($sql);
				push @paramArray, $packageId;
				$executeReady = 1;
			}
		}else{
			#=======================================================
			#THIS MAY BE AN RESET FOR A SPECIFIC STIG AND SPECIFIC
			#ASSET COMBINATION. CHECK FOR A STIG AND ASSET ID.
			#=======================================================
			if ($stigId ne '' and $assetId > 0){
				#=======================================================
				#THIS IS AN RESET AT THE ASSET-STIG LEVEL. RESET ALL
				#REVIEWS FOR THIS SPECIFIC STIG WITH RESPECT TO THIS 
				#SPECIFIC ASSET.
				#=======================================================
				$sql = <<END;
					UPDATE REVIEWS 
						SET STATUSID = 0
					WHERE REVIEWID IN (
						SELECT
						  distinct r.reviewId
						FROM
							reviews r
							INNER JOIN stigs.rev_group_rule_map rgrm ON rgrm.ruleId = r.ruleId 
							INNER JOIN stigs.rev_group_map rgm ON rgm.rgId = rgrm.rgId 
							INNER JOIN stigs.revisions rev ON rev.revId = rgm.revId and rev.stigId = ?
						WHERE 
							<WHERE_CLAUSE>
					)
END
				#===============================================
				#MODIFY WHERE CLAUSE TO ACCOUNT FOR THE DEPTH
				#OF THE RESET.
				#===============================================
				switch($unlockDepth){
					case "S"{$sql=~ s/<WHERE_CLAUSE>/r.assetId = ? and r.statusId = 1/;}
					case "A"{$sql=~ s/<WHERE_CLAUSE>/r.assetId = ? and r.statusId = 3/;}
					case "SA"{$sql=~ s/<WHERE_CLAUSE>/r.assetId = ? and (r.statusId = 3 OR r.statusId = 1)/;}
				}
				$sthUnlock = $dbh->prepare($sql);
				push @paramArray, $stigId;
				push @paramArray, $assetId;
				#$respObj->{'responseMsg'} = qq/An attempt was made to reset all reviews for STIG "$stigId" on "$assetName"./;
				$executeReady = 1;
			}else{
				#=======================================================
				#ALL OF THE PARAMETERS REQUIRED FOR AN RESET WERE 
				#NOT PROVIDED.
				#=======================================================
				$executeReady = 0;
				$respObj->{'responseMsg'} = "The reset parameters provided are invalid.";
				$respObj->{'responseTitle'} = "Review reset Failed!";
			}
		}
		#================================================================
		#IF THERE IS A VALID EXECUTION READY, FIRE IT OFF
		#================================================================
		if ($executeReady){
			#===================================================
			#EXECUTE SQL.
			#===================================================
			my $returnValue;
			$dbh->{AutoCommit} = 0;
			$sthUnlock->{RaiseError} = 1;
			$sthUnlock->{PrintError} = 0;
			eval {
				$returnValue = $sthUnlock->execute(@paramArray);
				$dbh->commit;
			};
			if ($@) {
				# There was an error in the eval block
				$respObj->{'success'} = \0;
				$respObj->{'responseMsg'} .= "<br/><br/>FAIL: The UPDATE query failed.";
				eval {$dbh->rollback};
			} else {
				# There were no errors in the eval block
				$respObj->{'success'} = \1;
				if ($returnValue > 0){
					$respObj->{'responseMsg'} .= "$returnValue review(s) were reset. You may need to refresh any data views to show the changes.";
				}else{
					$respObj->{'responseMsg'} .= "No reviews were reset because no records were found that met the reset criteria.";
				}
			}
		}
		#===================================================
		#RETURN THE APPROPRIATE MESSAGE TO THE CLIENT
		#===================================================
		print "Content-Type: application/json\n\n";
		print encode_json($respObj);
}else{
		#==================================================
		#THE USER IS NOT ALLOWED TO USE THIS FUNCTION
		#==================================================
		print "Content-Type: application/json\n\n";
		$respObj->{'success'} = \0;
		$respObj->{'responseMsg'} = "You are not authorized to call this function.";
		$respObj->{'responseTitle'} = "Forbidden";
		print encode_json($respObj);
}