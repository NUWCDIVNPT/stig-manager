#!/usr/bin/perl

# Parameters:
# None
# Output:

use strict;
use warnings;
use JSON::XS;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );  
use Digest::SHA1  qw(sha1 sha1_hex sha1_base64);
use XML::TreePP;
use XML::Twig;
use Data::Dumper;
use DBI;
use DBD::Oracle qw{:ora_types};
use grip;
use Time::Local;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
use File::Copy;
use File::Slurp;
use Archive::Zip qw( :ERROR_CODES );

################################################################
# MAIN PROGRAM
################################################################
my $uploadDir = "/tmp/";
my $insertCnt = 0;
$| = 1; # unbuffered print output

############################################
# Connect to database or exit
############################################
my $dbh;
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
} 
$dbh->do("alter session set nls_date_format='yyyy-mm-dd hh24:mi:ss'");

############################################
# CGI query object
############################################
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId');
my $filename = $q->param('filename');
my ($extension) = ($filename =~ /.*\.(.*)$/);
my $filesize = $q->param('filesize');
my $modified = $q->param('modified');
my $source = $q->param('source');
my $cgiPackageId = $q->param('packageId');
my $cgiPackageName = $q->param('packageName');
my $cgiAssetId = $q->param('assetId');
my $cgiAssetName = $q->param('assetName');
my $cgiStigId = $q->param('stigId');
my $uploadedName = $uploadDir . "upload.$stigmanId";

############################################
# Verify user or exit
############################################
my ($userObj,$userId,$cn,$name,$userRole,$userCanAdmin,$userDept);
if ($userObj = getUserObject($stigmanId,$dbh,$q,1)) { # no redirect!
	$userId = $userObj->{'id'};
	$cn = $userObj->{'cn'};
	$name = $userObj->{'name'};
	$userRole =  $userObj->{'role'};
	$userCanAdmin =  $userObj->{'canAdmin'};
	$userDept =  $userObj->{'dept'};
} else {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Invalid user.\"}\n";	
	exit;
}

############################################
# Initialize the streaming output
############################################
$| = 1;
print "Content-Type: text/html\n\n";
print "<br>" x 64; # For IE

############################################
# Create the jobId
############################################
my @t = localtime();
my $timeStr = sprintf("%04d-%02d-%02d %02d:%02d:%02d",$t[5]+1900,$t[4]+1,$t[3],$t[2],$t[1],$t[0]);
my $jobId = insertJobRecord($timeStr,$userId,$stigmanId,$source,$cgiAssetId,$cgiStigId,$cgiPackageId,$filename,$filesize,$modified);
if ($source eq 'package') {
	updateStatusText("Beginning import job $jobId for package \"$cgiPackageName\" requested by user \"$name\" at $timeStr.");
} elsif ($source eq 'review') {
	updateStatusText("Beginning import job $jobId for asset \"$cgiAssetName\", STIGID \"$cgiStigId\" for user \"$name\" at $timeStr.");
}

############################################
# Follow progress of the file upload
############################################
followUploadProgress($uploadedName,$filename,$filesize);

############################################
# Prepare the uploaded file for processing
############################################
# Calculate message digest of uploaded file
my $data = getDataFromFile($uploadedName);
my $uploadedSha1 = sha1_hex($data);
insertBlob($uploadedSha1,$data);
updateJobRecord($jobId,'fileMd',$uploadedSha1);

my $blobName = $uploadDir . "blob.$uploadedSha1";
# Rename uploaded file
updateProgress(0,"Processing \"$filename\" ...");
updateStatusText("");
updateStatusText("Processing \"$filename\".");
if (move ($uploadedName,$blobName)) {
	updateStatusText("File staging succeeded.");
	
} else {
	updateStatusText("FAIL: File staging failed.");
	updateProgress(0,"Finished processing \"" . $filename . "\"");
	updateStatusText("Finished processing \"" . $filename . "\"");
	exit;
}


# Instantiate the XML parser 
my $xml = XML::TreePP->new();
$xml->set( force_array => ['*'] );
$xml->set( ignore_error => 1 );


############################################
# Process the uploaded file in accordance
# with the GUI source of the import
############################################
if ($source eq 'review') {
	###################
	# Source = 'review'
	###################
	if ($extension eq 'ckl') {
		###################
		# Extension = 'ckl'
		###################
		# my $cklContent = read_file($blobName);
		updateStatusText("  NOTE: File extension is CKL. Expecting DISA STIG Viewer CKL content.");
		my $cklVersion = getCklVersion($data);
		
		if ($cklVersion == 2){
			updateStatusText("  NOTE: Detected format other than CKL version 1. Will try to parse as CKL version 2.");

			my $cklTwig = new XML::Twig;
			updateStatusText("  Starting file vetting...");		
			if ($cklTwig->safe_parse($data)){
				my $r = vetCklv2($cklTwig,{
				'source' => $source
				,'expAssetName' => $cgiAssetName
				# ,'expStigTitle' => $stigTitle
				,'expStigId' => $cgiStigId
				});

				if (!$r->{'success'}) {
					updateStatusText("  FAIL: File was not successfully vetted.");
				} else {
					updateStatusText("  PASS: File successfully vetted.");
					foreach my $iStig (@{$r->{'iStigs'}}){
						importIStig($iStig,$cgiAssetId,$cgiStigId);
						# importIStig($iStig,$cgiAssetId,$r->{'stigId'});

					}
				}
			}
			else{
				updateStatusText("  File was not successfully parsed. Invalid XML!");	
			}		
		}
		elsif ($cklVersion == 1){
			updateStatusText("  NOTE: Detected CKL version 1 format.");
			my $cklHash = $xml->parse( $data );
			updateStatusText("  Starting file vetting...");
			my ($stigTitle) = $dbh->selectrow_array("select title from stigs.stigs s where s.stigId = ?",undef,($cgiStigId)); 
			my $r = vetCklv1($cklHash,{
				'source' => $source
				,'expAssetName' => $cgiAssetName
				,'expStigTitle' => $stigTitle
			});
			if (!$r->{'success'}) {
				updateStatusText("  FAIL: File was not successfully vetted.");
			} else {
				updateStatusText("  PASS: File successfully vetted.");
				importCkl($cklHash,$cgiAssetId, $cgiStigId);
			}
		}
		else{
			updateStatusText("   FAIL: Unable to detect CKL version.");
		}
	} elsif ($extension eq 'xml') {
		###################
		# Extension = 'xml'
		###################
		updateStatusText("  NOTE: File extension is XML. Expecting XCCDF content.");
		my $xmlHash = $xml->parsefile( $blobName );
		updateStatusText("  Starting file vetting.");
		my $r = vetXccdf($xmlHash,{
			'source' => $source
			,'expAssetName' =>  $cgiAssetName
			,'expStigId' =>  $cgiStigId
		});
		if (!$r->{'success'}) {
			updateStatusText("  FAIL: File was not successfully vetted.");
		} else {
			updateStatusText("  PASS: File successfully vetted.");
			importXccdf($xmlHash,$cgiAssetId, $cgiStigId);
		}
	} else {
		###################
		# Extension != 'xml' or 'ckl'
		###################
		updateStatusText("  FAIL: Unsupported extension $extension.");
	}
} elsif ($source eq 'package') {
	###################
	# Source = 'package'
	###################
	if ($extension eq 'zip') {
		processZip($blobName);
	} else {
		updateProgress(0,"FAIL: Unsupported extension $extension.");
	}
} else {
	updateStatusText("FAIL: Unknown source $source");
}

updateProgress(1,"Finished processing \"" . $filename . "\" and imported $insertCnt results");
updateStatusText("Finished processing \"" . $filename . "\" and imported $insertCnt results.");
updateJobRecord($jobId,"reportText",$STATUS_TEXT);
@t = localtime();
$timeStr = sprintf("%04d-%02d-%02d %02d:%02d:%02d",$t[5]+1900,$t[4]+1,$t[3],$t[2],$t[1],$t[0]);
updateJobRecord($jobId,"endTime",$timeStr);

################################################################
################################################################
################################################################
# SUBROUTINES
################################################################
################################################################
################################################################
sub getDataFromFile {
	my ($filename) = @_;
	my $fh;
	my $data = do {
		local $/ = undef;
		open $fh, "<", $filename;
		<$fh>;
	};
	close $fh;
	return $data;
}

sub insertBlob {
	my ($sha1,$data) = @_;
	my $sql = <<END;
	insert /*+ ignore_row_on_dupkey_index(imported_blobs, primary_14) */ 
	into
		stigman.imported_blobs (sha1,data)
	VALUES
		(?,?)
END
	# my $rv = $dbh->do($sql,undef,($sha1,$data));
	my $sth = $dbh->prepare($sql);
	$sth->bind_param(1,$sha1);
	$sth->bind_param(2,$data,{ ora_type => ORA_BLOB });
	my $rv = $sth->execute();	
	return $rv;
}

sub updateJobRecord {
	my ($jobId,$column,$value) = @_;
	my $sql = <<END;
	update
		stigman.imported_jobs
	SET
		$column = ?
	WHERE
		jobId = ?
END
	$dbh->do($sql,undef,($value,$jobId));
}

sub insertJobRecord {
	my $jobId;
	my $sql =<<END;
	insert into imported_jobs (
		startTime
		,userId
		,stigmanId
		,source
		,assetId
		,stigId
		,packageId
		,filename
		,filesize
		,modified
	)
	VALUES
		(TO_DATE(?,'yyyy-mm-dd hh24:mi:ss'),?,?,?,?,?,?,?,?,?)
	RETURNING
		jobId into ?
END
	my $sth = $dbh->prepare($sql);
	# bind each of the function arguments
	my $x = 1;
	foreach my $param (@_) {
		$sth->bind_param($x,$param);
		$x++;
	}
	# bind the returned value
	$sth->bind_param_inout($x,\$jobId,32);
	$sth->execute();
	return $jobId;
}

sub processZip {
	my ($zipfile) = @_;
	my $importZip = Archive::Zip->new();
	my $zipStatus = $importZip->read($zipfile);
	if ( $zipStatus != AZ_OK ) {
		updateStatusText("FAIL: $filename is not a valid ZIP archive. Zip status: $zipStatus.");
		return;
	}
	updateStatusText("PASS: $filename is a valid ZIP archive.");

	#############################
	# Get CKL and XML members
	# and produce arrays sorted
	# by modification time
	#############################
	my $member;
	my $cklMemberHash = {};
	foreach $member ($importZip->membersMatching('.*\.ckl')) {
		$cklMemberHash->{$member->fileName()} = {
			'memberObj' => $member
			,'lastModTime' => $member->lastModTime()
		};
	}
	my @cklNames = sort { $cklMemberHash->{$a}->{'lastModTime'} <=> $cklMemberHash->{$b}->{'lastModTime'} } keys(%$cklMemberHash);

	my $xmlMemberHash = {};
	foreach $member ($importZip->membersMatching('.*\.xml')) {
		$xmlMemberHash->{$member->fileName()} = {
			'memberObj' => $member
			,'lastModTime' => $member->lastModTime()
		};
	}
	my @xmlNames = sort { $xmlMemberHash->{$a}->{'lastModTime'} <=> $xmlMemberHash->{$b}->{'lastModTime'} } keys(%$xmlMemberHash);

	updateStatusText("NOTE: Archive contains " . scalar @cklNames . " CKL members.");
	updateStatusText("NOTE: Archive contains " . scalar @xmlNames . " XML members.");
	
	my $totalMembers = scalar @cklNames + scalar @xmlNames;
	my $processedMembers = 0;
	#############################
	# Process CKL members sorted
	# by modification time
	#############################
	foreach my $cklName (@cklNames) {
		my $progress = sprintf("%0.2f",( $processedMembers / $totalMembers ));
		updateProgress($progress,"Processing member \"$cklName\"");
		updateStatusText(" ");
		updateStatusText("Processing member \"$cklName\", modified on " . localtime($cklMemberHash->{$cklName}->{'lastModTime'}) . ".");
		my $cklContent = $cklMemberHash->{$cklName}->{'memberObj'}->contents();
			
		updateStatusText("  Running vetting checks against member.");
		
		my $cklVersion = getCklVersion($cklContent);
		
		if ($cklVersion == 2){
			updateStatusText("  NOTE: Detected format other than CKL version 1. Will try to parse as CKL version 2.");

			my $cklTwig = new XML::Twig;
			updateStatusText("  Starting file vetting.");
			if ($cklTwig->safe_parse($cklContent)){			
				my $r = vetCklv2($cklTwig,{
					'source' => $source
					,'packageName' => $cgiPackageName
					,'packageId' => $cgiPackageId
				});

				if (!$r->{'success'}) {
					updateStatusText("  FAIL: Member fails vetting checks.");
				} else {
					updateStatusText("  PASS: Member passes vetting checks.");
					updateStatusText('  Ready to import results from CKL file.');
					foreach my $iStig (@{$r->{'iStigs'}}){
						importIStig($iStig, $r->{'assetId'}, $r->{'stigId'});
					}
					updateStatusText('  Finished importing results from CKL file.');
				}		
			}
			else{
				updateStatusText('  Member unable to be parsed. Invalid XML!');
			}
		}		
		elsif ($cklVersion == 1){
			updateStatusText("  Detected CKL version 1 format.");
			my $cklHash = $xml->parse( $cklContent );

			my $r = vetCklv1($cklHash,{
				'source' => $source
				,'packageName' => $cgiPackageName
				,'packageId' => $cgiPackageId
			});
		
			if (!$r->{'success'}) {
				updateStatusText('  Member fails vetting checks.');
			} else {
				updateStatusText('  Member passes vetting checks.');
				updateStatusText('  Ready to import results from CKL file.');
				importCkl($cklHash,$r->{'assetId'},$r->{'stigId'});
				updateStatusText('  Finished importing results from CKL file.');
			}
		}

		$processedMembers++;
	}
	#############################
	# Process XML members sorted
	# by modification time
	#############################
	foreach my $xmlName (@xmlNames) {
		my $progress = sprintf("%0.2f",( $processedMembers / $totalMembers ));
		updateProgress($progress,"Processing member \"$xmlName\"");
		updateStatusText(" ");
		updateStatusText("Processing archive member \"$xmlName\", modified on " . localtime($xmlMemberHash->{$xmlName}->{'lastModTime'}) . ".");
		my $xmlContent = $xmlMemberHash->{$xmlName}->{'memberObj'}->contents();
		my $xmlHash = $xml->parse( $xmlContent );
		updateStatusText("  Running vetting checks against member.");
		my $r = vetXccdf($xmlHash,{
			'source' => $source
			,'packageName' => $cgiPackageName
			,'packageId' => $cgiPackageId
		});
		if (!$r->{'success'}) {
			updateStatusText('  Member fails vetting checks.');
		} else {
			updateStatusText('  Member passes vetting checks.');
			updateStatusText('  Ready to import results from XCCDF file.');
			importXccdf($xmlHash,$r->{'assetId'},$r->{'stigId'});
			updateStatusText('  Finished importing results from XCCDF file.');
		}
		$processedMembers++;
	}
}

#takes ckl content and returns version (1 or 2) of .ckl
sub getCklVersion {
	my ($cklContent) = @_;
	my ($svVersion) = ($cklContent =~ /<SV_VERSION>/);
	if ($svVersion){ return 1;}
	else {return 2;}
}

sub vetCklv2 {
	#returns success/failure and an array of iStigs that meed import criteria
	my ($twig,$conf) = @_;
	#updateStatusText("    vetting ckl v2");

	my @checklists = $twig->get_xpath('/CHECKLIST');
	my $t;
	my $checklist = ($t = $twig->get_xpath('/CHECKLIST',0)) ? 1 : undef;
	
	if (!$checklist) {
		updateStatusText("    FAIL: No <CHECKLIST> element. Invalid CKL document.");
		return {'success' => 0};
	}	
	updateStatusText("    PASS: The root element is <CHECKLIST>.");	
	# my $asset = $twig->get_xpath('/CHECKLIST/ASSET/HOST_NAME',0);

	# my $assets = $twig->get_xpath('/CHECKLIST/ASSET/HOST_NAME',0);
	###### change this portion to check for $assets, THEN grab text etc.
	# my $hostName = $asset->text;
	my $hostName = ($t = $twig->get_xpath('/CHECKLIST/ASSET/HOST_NAME',0)) ? $t->text : undef;	
	if (!$hostName) {
		updateStatusText("    FAIL: The <HOST_NAME> element does not exist or its value is empty.");
		return {'success' => 0};
	}	
	my $re1='(([a-z0-9_-]*))';	# regex hands back just hostname portion (to avoid FQDN issues)
	my ($assetName) = $hostName =~ m/$re1/is;
	updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
	
	# my $iStigTitle;
	# my $stigTitle;	
	# my $stigTitleText;	
	# my @stigTitles = $twig->get_xpath('/CHECKLIST/STIGS/iSTIG/STIG_INFO/SI_DATA/SID_NAME[string()="title"]/../SID_DATA');
	# if (scalar @stigTitles == 0) {
		# updateStatusText("    FAIL: No STIG title values found.");
		# return {'success' => 0};
	# }
	
	##output all stig titles if feeling ambitious and friendly
	my $iStigIdTwig;
	my $stigIdTwig;	
	my $stigIdText;	
	my @stigIdTwigs = $twig->get_xpath('/CHECKLIST/STIGS/iSTIG/STIG_INFO/SI_DATA/SID_NAME[string()="stigid"]/../SID_DATA');
	if (scalar @stigIdTwigs == 0) {
		updateStatusText("    FAIL: No STIG ID values found.");
		return {'success' => 0};
	}	

	
	
	if ($conf->{'source'} eq 'review') {
		# Source: 'review'
		# conf = { expAssetName, expStigTitle }
	
		# updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (lc($conf->{'expAssetName'}) eq lc($assetName)) {
			updateStatusText("    PASS: Asset name matches this review.");
			
			# foreach $iStigTitle (@stigTitles){
				# $stigTitleText = $iStigTitle->text;
				# if (lc($conf->{'expStigTitle'}) eq lc($stigTitleText)) {
					# updateStatusText("    NOTE: Results included for STIG title \"$stigTitleText\".");
					# $stigTitle = $iStigTitle;
					# last; 
				# }
			# }
			foreach $iStigIdTwig(@stigIdTwigs){
				$stigIdText = $iStigIdTwig->text;
				my $stigIdTextTEST = $stigIdText;
				#Need text to reference other xml elements, but test for proper stig ID should be performed without prefix.
				$stigIdTextTEST =~ s/xccdf_mil\.disa\.stig_benchmark_//g;
				if (lc($conf->{'expStigId'}) eq lc($stigIdTextTEST)) {
					updateStatusText("    NOTE: Results included for STIG title \"$stigIdText\".");
					$stigIdTwig = $iStigIdTwig;
					last; 
				}
			}			
			#vetUserAssetStig somewhere in here
			if ($stigIdTwig) {
				updateStatusText("    PASS: STIG title matches this review.");
				my @iStigTwig = $stigIdTwig->get_xpath('../../../');
				return {'success' => 1, 'iStigs' => \@iStigTwig};
				
			} else {
				updateStatusText("    FAIL: STIG ID does not match this review for \"" . $conf->{'expStigId'} . "\".");
				return {'success' => 0};
			}
		} else {
			updateStatusText("    FAIL: Asset name does not match this review for \"" . $conf->{'expAssetName'} . "\".");
			return {'success' => 0};
		}	
		
	} elsif ($conf->{'source'} eq 'package') {
		# Source: 'package'
		# conf = { packageId, packageName }
		# my $iStigHashRef;
		my $iStigTwig;
		my @iStigArray;
		# updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (my $assetId = vetAssetInPackage($assetName,$conf->{'packageId'})) {
			updateStatusText("    PASS: Asset name is associated with current package.");
			
			# if (scalar @stigTitles == 0) {
				# updateStatusText("    FAIL: No STIG titles found in repository.");
				# return {'success' => 0};
			# } else {			
				#updateStatusText("    checking stig ids");

				foreach $iStigIdTwig (@stigIdTwigs){		
					my $stigIdText = $iStigIdTwig->text;
					###should already hvae stigids in ckl, no need for lookup
					# my ($stigId) = $dbh->selectrow_array("select stigId from stigs.stigs s where lower(s.title) = ?",undef,(lc($stigIdText)));
					updateStatusText("    NOTE: File includes reviews for the STIG titled \"$stigIdText\". ");
				
					my $r = vetUserAssetStig($userObj,$assetId,$stigIdText);
					if ($r->{'success'}) {
						# updateStatusText("    vetUserAssetStig success");

						# my @stigTitles = $twig->get_xpath('iSTIG/STIG_INFO/SI_DATA/SID_NAME[string()="title"]/../SID_DATA');
						# $iStig = $iStigTitle->get_xpath('../../../../iSTIG');
						$iStigTwig = $iStigIdTwig->get_xpath('../../../',0);
						# return {'success' => 1, 'iStig' => @iStigTwig};
						push(@iStigArray,$iStigTwig);
						updateStatusText("    NOTE: The STIG titled \"$stigIdText\" is in scope.");
						#^^^make this an array, no need for weird hash structure^^^
						
					} 				
				}
				
				if (scalar @iStigArray){
					updateStatusText("    NOTE: The file contains results for one or more STIGs that are in scope.");
					return {'success' => 1, 'assetId' => $assetId, 'iStigs' => \@iStigArray};		
				
				}else {
					return {'success' => 0};
				
				}

			# }		
		} else {
			updateStatusText("    FAIL: Asset name is not associated with current package.");
			return {'success' => 0};
		}
		
	} else {
		return {'success' => 0};
	}		
}



sub vetCklv1 {
	# returns a result hash
	my ($hash,$conf) = @_;

	my $checklist = $hash->{'CHECKLIST'}->[0];
	if (!$checklist) {
		updateStatusText("    FAIL: No <CHECKLIST> element. Invalid CKL document.");
		return {'success' => 0};
	}	
	updateStatusText("    PASS: The root element is <CHECKLIST>.");
	my $hostName = $checklist->{'ASSET'}->[0]->{'HOST_NAME'}->[0];
	if (!$hostName) {
		updateStatusText("    FAIL: The <HOST_NAME> element does not exist or its value is empty.");
		return {'success' => 0};
	}
	my $stigTitle = $checklist->{'STIG_INFO'}->[0]->{'STIG_TITLE'}->[0];
	if (!$stigTitle) {
		updateStatusText("    FAIL: The <STIG_TITLE> element does not exist or its value is empty.");
		return {'success' => 0};
	}
	
	my $re1='(([a-z0-9_-]*))';	# regex hands back just hostname portion (to avoid FQDN issues)
	my ($assetName) = $hostName =~ m/$re1/is;

	if ($conf->{'source'} eq 'review') {
		# Source: 'review'
		# conf = { expAssetName, expStigTitle }

		#STILL NEED TO VET USER-STIG-ASSET ASSIGNMENT


		updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (lc($conf->{'expAssetName'}) eq lc($assetName)) {
			updateStatusText("    PASS: Asset name matches this review.");
			updateStatusText("    NOTE: Results are for STIG title \"$stigTitle\".");
			if (lc($conf->{'expStigTitle'}) eq lc($stigTitle)) {
				updateStatusText("    PASS: STIG title matches this review.");
				return {'success' => 1};
			} else {
				updateStatusText("    FAIL: STIG title does not match this review for \"" . $conf->{'expStigTitle'} . "\".");
				return {'success' => 0};
			}
		} else {
			updateStatusText("    FAIL: Asset name does not match this review for \"" . $conf->{'expAssetName'} . "\".");
			return {'success' => 0};
		}
	} elsif ($conf->{'source'} eq 'package') {
		# Source: 'package'
		# conf = { packageId, packageName }
		updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (my $assetId = vetAssetInPackage($assetName,$conf->{'packageId'})) {
			updateStatusText("    PASS: Asset name is associated with current package.");
			my ($stigId) = $dbh->selectrow_array("select stigId from stigs.stigs s where s.title = ?",undef,($stigTitle));
			updateStatusText("    NOTE: Results are for STIG title \"$stigTitle\".");
			if (!$stigId) {
				updateStatusText("    FAIL: STIG title not found in repository.");
				return {'success' => 0};
			} else {
				updateStatusText("    PASS: STIG title found in repository.");
				my $r = vetUserAssetStig($userObj,$assetId,$stigId);
				if ($r->{'success'}) {
					return {'success' => 1, 'assetId' => $assetId, 'stigId' => $stigId};
				} else {
					return {'success' => 0};
				}
			}	
		} else {
			updateStatusText("    FAIL: Asset name is not associated with current package.");
			return {'success' => 0};
		}
	} else {
		return {'success' => 0};
	}	
}

sub vetUserAssetStig {
	# returns a result hash
	my ($userObj,$assetId,$stigId) = @_;
	my $adminStr = '';
	if ($userObj->{'canAdmin'}) {
		$adminStr = ' with Administrator privileges';
	} 
	updateStatusText("    NOTE: User has \"". $userObj->{'role'}. "\" role" . "$adminStr.");
	if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
		# If admin, add the association and return
		my $sql = <<END;
		select
			sa.saId as "saId"
			,sa.disableImports as "disableImports"
		from
			stigman.stig_asset_map sa
		where
			sa.assetId = ?
			and sa.stigId = ?
END
		my ($saId,$disableImports) = $dbh->selectrow_array($sql,undef,($assetId,$stigId));
		if ($saId) {
			return {'success' => 1};
			# if ($disableImports) {
				# updateStatusText("  FAIL: Imports disabled for this asset/STIG association.");
				# return {'success' => 0};
			# } else {
				# updateStatusText("  PASS: Imports are allowed for this asset/STIG association.");
				# return {'success' => 1};
			# }
		} else {
			my $sql = <<END;
			INSERT into 
				stig_asset_map(assetId,stigId)
			VALUES (?,?)
END
			$dbh->do($sql,undef,($assetId,$stigId));
			updateStatusText("    NOTE: Previously unassociated STIG is now associated with this asset.");
			return {'success' => 1};
		}
	} elsif ($userObj->{'role'} eq 'IAWF') {
		# If workforce, check if assignment in place and imports are okay
		my $sql = <<END;
		select
			sa.saId as "saId"
			,sa.disableImports as "disableImports"
		from
			stig_asset_map sa
			left join user_stig_asset_map usa on usa.saId=sa.saId
		where
			usa.userId = ?
			and sa.assetId = ?
			and sa.stigId = ?
END
		my ($saId,$disableImports) = $dbh->selectrow_array($sql,undef,($userObj->{'id'},$assetId,$stigId));
		if ($saId) {
			updateStatusText("    PASS: User is authorized for this asset/STIG association.");
			return {'success' => 1};
			# if ($disableImports) {
				# updateStatusText("  FAIL: Imports are disabled for this asset/STIG association.");
				# return {'success' => 0};
			# } else {
				# updateStatusText("  PASS: Imports are enabled for this asset/STIG association.");
				# return {'success' => 1};
			# }
		} else {
			updateStatusText("    FAIL: User is not authorized for this asset/STIG association.");
			return {'success' => 0};
		}
	} elsif ($userObj->{'role'} eq 'IAO') {
		my $sql = "select a.dept from stigman.assets a where a.assetId = ?";
		my ($dept) = $dbh->selectrow_array($sql,undef,($assetId));
		if ($dept ne $userObj->{'dept'}) {
			# IAO not in the same dept as the asset
			updateStatusText("    FAIL: User in department " . $userObj->{'dept'} . " is not authorized to modify asset in department $dept.");
			return {'success' => 0};
		} else {
			updateStatusText("    PASS: User in department " . $userObj->{'dept'} . " is authorized to modify asset.");
			my $sql = <<END;
			select
				sa.saId as "saId"
				,sa.disableImports as "disableImports"
			from
				stig_asset_map sa
			where
				sa.assetId = ?
				and sa.stigId = ?
END
			my ($saId,$disableImports) = $dbh->selectrow_array($sql,undef,($assetId,$stigId));
			if ($saId) {
				return {'success' => 1};
				# if ($disableImports) {
					# updateStatusText("  FAIL: Imports are disabled for this asset/STIG association.");
					# return {'success' => 0};
				# } else {
					# updateStatusText("  PASS: Imports are enabled for this asset/STIG association.");
					# return {'success' => 1};
				# }
			} else {
				my $sql = <<END;
				INSERT into 
					stig_asset_map(assetId,stigId)
				VALUES (?,?)
END
				$dbh->do($sql,undef,($assetId,$stigId));
				updateStatusText("    NOTE: Previously unassociated STIG has been associated with this asset.");
				return {'success' => 1};
			}
		} 
	}
}

sub vetAssetInPackage {
	# returns assetId if successful, otherwise undef
	my ($assetName,$packageId) = @_;
	my $sql =<<END;
select
	a.assetId as "assetId"
FROM
	assets a
	left join asset_package_map ap on ap.assetId=a.assetId
WHERE
	UPPER(a.name) = UPPER(?)
	and ap.packageId = ?
END
	my ($match) = $dbh->selectrow_array($sql,undef,($assetName,$packageId));
	if ($match) {
		return $match;
	} else {
		return undef;
	}
}

sub vetXccdf {
	# returns a result hash
	my ($hash,$conf) = @_;
	my $benchmark = $hash->{'cdf:Benchmark'}[0];
	if (!$benchmark) {
		updateStatusText("    FAIL: No <Benchmark> element. Invalid SCC document.");
		return {'success' => 0};
	}
	updateStatusText("    PASS: The root element is <Benchmark>.");
	my $testResult = $benchmark->{'cdf:TestResult'}[0];
	if (!$testResult) {
		updateStatusText("    FAIL: No <TestResult> element. Invalid SCC document.");
		return {'success' => 0};
	}
	updateStatusText("    PASS: The <TestResult> element exists.");
	my $hostname = $testResult->{'cdf:target'}[0];
	if (!$hostname) {
		updateStatusText("    FAIL: The <target> element does not exist or its value is empty.");
		return {'success' => 0};
	}
	my $re1='(([a-z0-9_-]*))';	# regex
	my ($assetName) = $hostname =~ m/$re1/is;
	my $stigId =  $hash->{'cdf:Benchmark'}[0]->{'-id'};
	$stigId =~ s/xccdf_mil\.disa\.stig_benchmark_//g;

	if (!$stigId) {
		updateStatusText("    FAIL: The <Benchmark id> attribute does not exist or its value is empty.");
		return {'success' => 0};
	}

	# Verify the Identity used by the scan was authenticated and privileged
	my $identity = $testResult->{'cdf:identity'}[0]->{'#text'};
	if ($identity) {
		updateStatusText("    NOTE: Results were obtained using identity \"$identity\".");
		my $privileged = $testResult->{'cdf:identity'}[0]->{'-privileged'};
		my $authenticated = $testResult->{'cdf:identity'}[0]->{'-authenticated'};
		if ($authenticated ne 'true') {
			updateStatusText("    FAIL: Identity was not successfully authenticated on the asset.");
			return {'success' => 0};
		} else {
			updateStatusText("    PASS: Identity was successfully authenticated on the asset.");
			if ($privileged ne 'true') {
				updateStatusText("    FAIL: Identity was not privileged on the asset.");
				return {'success' => 0};
			} else {
				updateStatusText("    PASS: Identity was privileged on the asset.");
			}
		}
	} else {
		updateStatusText("    FAIL: The <identity> element does not exist or its value is empty.");
		return {'success' => 0};
	}
	if ($conf->{'source'} eq 'review') {
		#STILL NEED TO VET USER-STIG-ASSET ASSIGNMENT
		# Source: 'review'
		# conf = { expAssetName, expStigId }
		updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (lc($conf->{'expAssetName'}) eq lc($assetName)) {
			updateStatusText("    PASS: Asset name matches this review.");
			updateStatusText("    NOTE: Results are for STIG ID \"$stigId\".");
			if ($conf->{'expStigId'} eq $stigId) {
				updateStatusText("    PASS: STIG ID matches this review.");
				return {'success' => 1, 'assetName' => $assetName, 'stigId' => $stigId};
			} else {
				updateStatusText("    FAIL: STIG ID does not match this review for \"" . $conf->{'expStigId'} . "\".");
				return {'success' => 0};
			}
		} else {
			updateStatusText("    FAIL: Asset name does not match this review for \"" . $conf->{'expAssetName'} . "\".");
			return {'success' => 0};
		}
	} elsif ($conf->{'source'} eq 'package') {
		# Source: 'package'
		# conf = { packageId, packageName }
		updateStatusText("    NOTE: Results are for Asset name \"$assetName\".");
		if (my $assetId = vetAssetInPackage($assetName,$conf->{'packageId'})) {
			updateStatusText("    PASS: Asset name is associated with current package.");
			my ($stigId) = $dbh->selectrow_array("select stigId from stigs.stigs s where s.stigId = ?",undef,($stigId));
			updateStatusText("    NOTE: Results are for STIG ID \"$stigId\".");
			if (!$stigId) {
				updateStatusText("    FAIL: STIG ID not found in repository.");
				return {'success' => 0};
			} else {
				updateStatusText("    PASS: STIG title found in repository.");
				my $r = vetUserAssetStig($userObj,$assetId,$stigId);
				if ($r->{'success'}) {
					return {'success' => 1, 'assetId' => $assetId, 'stigId' => $stigId};
				} else {
					return {'success' => 0};
				}
			}	
		} else {
			updateStatusText("    FAIL: Asset name is not associated with current package.");
			return {'success' => 0};
		}
	}
}




sub importIStig {
	# returns nothing!
	my ($iStig,$assetId,$stigId) = @_;
	$stigId = $iStig->get_xpath('STIG_INFO/SI_DATA/SID_NAME[string()="stigid"]/../SID_DATA',0)->text; #iStig has already been vetted, so pretty confident we will find something here.
	#stigId not available when called as part of package processing, so check for value and query for it if we don't have it.
	# if (!$stigId){
		# $stigId = $dbh->selectrow_array("select stigId from stigs.stigs s where lower(s.title) = ?",undef,(lc($stigTitle)));	
	# }
	# $stigId = $dbh->selectrow_array("select stigId from stigs.stigs s where lower(s.title) = ?",undef,(lc($stigTitle)));	
	updateStatusText("  Importing results from \"$stigId\" for assetid: $assetId");
	# my $gi = $iStig->gi;# just verifying I'm in iStig
	# updateStatusText("  gi: $gi");

	# Initialization
	my $sqlUpdateCklReview =<<END;
	UPDATE
		reviews
	SET
		stateId=?,
		stateComment=?,
		actionId=?,
		actionComment=?,
		userId=?,
		autoState=0,
		statusId = 0
	WHERE
		assetId = ?
		AND ruleId = ?
END
	my $sthUpdateCklReview = $dbh->prepare($sqlUpdateCklReview);
	my $sqlInsertCklReview =<<END;
	insert into	reviews	(
		stateId
		,stateComment
		,actionId
		,actionComment
		,userId
		,autoState
		,statusId
		,assetId
		,ruleId
	) 
	VALUES
		(?,?,?,?,?,0,0,?,?) 
END
	my $sthInsertCklReview = $dbh->prepare($sqlInsertCklReview);

	my $sqlIsCurrentRule = <<END;
	select
		cgr.ruleId as "ruleId"
	from
		stigs.current_group_rules cgr
	where
		cgr.ruleId = ?
END
	my $sthIsCurrentRule = $dbh->prepare($sqlIsCurrentRule);

	my $findingToState = {
		'Open' => 4,
		'NotAFinding' => 3,
		'Not_Applicable' => 2,
		'Not_Reviewed' => 1
	};
	my $strToAction = {
		'remediate' => 1,
		'mitigate' => 2,
		'exception' => 3
	};

	my @vulns = $iStig->get_xpath('VULN/');
	my $numVulns = scalar @vulns;
	updateStatusText("  Found $numVulns <VULN> elements");
	my $cnt = 0; #progress count
	my $notReviewed_cnt = 0; # "Not Reviewed" count 
	
	foreach my $vuln (@vulns){
		$cnt++;
		my $progress = sprintf("%0.2f",( $cnt / $numVulns ));
		my $t; #temp variable for holding xpath results
		# my @rules = $vuln->get_xpath('STIG_DATA/VULN_ATTRIBUTE[string()="Rule_ID"]/../ATTRIBUTE_DATA');
		# my $ruleId = $vuln->get_xpath('STIG_DATA/VULN_ATTRIBUTE[string()="Rule_ID"]/../ATTRIBUTE_DATA',0)->text;
		my $ruleId = ($t = $vuln->get_xpath('STIG_DATA/VULN_ATTRIBUTE[string()="Rule_ID"]/../ATTRIBUTE_DATA',0)) ? $t->text : undef;

		# Skip this VULN if no RuleID is found
		if (!$ruleId) {
			updateStatusText("    WARN: Cannot find <VULN_ATTRIBUTE> = \"Rule_ID\" for element $cnt. Skipping.");
			next;
		}
		#updateStatusText("  ruleId: $ruleId");

		# my $status = $vuln->get_xpath('STATUS',0)->text;
		my $status = ($t = $vuln->get_xpath('STATUS',0)) ? $t->text : undef;
		my $stateId = $findingToState->{$status};
		if (!$stateId) {
			updateStatusText("    WARN: Unknown <STATUS> found for $ruleId. Skipping.");
			next;
		}
		if ($stateId == 1) {
			# Not_Reviewed is set to NULL stateId
			$stateId = undef;
			$notReviewed_cnt++;
		}
		#updateStatusText("  status: $status");
		#updateStatusText("  stateId: $stateId");

		# my $stateComment = $vuln->get_xpath('FINDING_DETAILS',0)->text;
		my $stateComment = ($t = $vuln->get_xpath('FINDING_DETAILS',0)) ? $t->text : undef;
		
		# my $stateComment = (my $t = $vuln->get_xpath('FINDING_DETAILS',0)) ? $t->text : undef;
		#updateStatusText("  finding details(stateComment): $stateComment");
		$stateComment=~s/^\s+//;
		$stateComment=~s/\s+$//;

		# Handle action (if any)		
		my $actionStr = undef;
		my $actionId = undef;
		my $actionComment = undef;
		my $resultStr = '';
		if ($stateId == 4) { # Open
			# my $commentStr = $vuln->get_xpath('COMMENTS',0)->text;
			my $commentStr = ($t = $vuln->get_xpath('COMMENTS',0)) ? $t->text : undef;			
			#updateStatusText("  commentStr: $commentStr");			# Regex: ?: = non-capturing group, ? = optional group
			# Look for prefix remediate|mitigate|exception
			# and use as actionId if present
			($actionStr,$actionComment) = ($commentStr =~ /^(?:^(remediate|mitigate|exception)(?:\s*\:))?(.*)/smi);
			$actionId = $strToAction->{lc($actionStr)};
			# trim spaces
			$actionComment=~s/^\s+//;
			$actionComment=~s/\s+$//;
			$resultStr = "\"$status\" (" . lc($actionStr) . ")";
		} else {
			$resultStr = "\"$status\"";
		}	
		

		my $rv = $sthUpdateCklReview->execute(($stateId,$stateComment,$actionId,$actionComment,$userId,$assetId,$ruleId));
		if ($rv == 0) {
			$rv = $sthInsertCklReview->execute(($stateId,$stateComment,$actionId,$actionComment,$userId,$assetId,$ruleId));
		}
		if ($rv) {
			$insertCnt++;
			#updateStatusText("    Inserted result $resultStr for $ruleId.");
		} else {
			updateStatusText("    FAIL: Unable to insert result $resultStr for $ruleId.");
		}
		# Check if ruleId is current
		my ($currentRule) = $dbh->selectrow_array($sqlIsCurrentRule,undef,($ruleId));
		if (!$currentRule) {
			updateStatusText("    WARN: Rule $ruleId not present in any current STIG revision.");
		}
	}
	updateStatusText("  Imported $cnt results");
	updateStatusText("  Imported ckl included $notReviewed_cnt \"Not Reviewed\" results");
	updateStatsAssetStig($assetId,$stigId,$dbh);

}



sub importCkl {
	# returns nothing!
	my ($hash,$assetId,$stigId) = @_;
	
	# Initialization
	my $sqlUpdateCklReview =<<END;
	UPDATE
		reviews
	SET
		stateId=?,
		stateComment=?,
		actionId=?,
		actionComment=?,
		userId=?,
		autoState=0,
		statusId = 0
	WHERE
		assetId = ?
		AND ruleId = ?
END
	my $sthUpdateCklReview = $dbh->prepare($sqlUpdateCklReview);
	my $sqlInsertCklReview =<<END;
	insert into	reviews	(
		stateId
		,stateComment
		,actionId
		,actionComment
		,userId
		,autoState
		,statusId
		,assetId
		,ruleId
	) 
	VALUES
		(?,?,?,?,?,0,0,?,?) 
END
	my $sthInsertCklReview = $dbh->prepare($sqlInsertCklReview);

	my $sqlIsCurrentRule = <<END;
	select
		cgr.ruleId as "ruleId"
	from
		stigs.current_group_rules cgr
	where
		cgr.ruleId = ?
END
	my $sthIsCurrentRule = $dbh->prepare($sqlIsCurrentRule);

	my $findingToState = {
		'Open' => 4,
		'NotAFinding' => 3,
		'Not_Applicable' => 2,
		'Not_Reviewed' => 1
	};
	my $strToAction = {
		'remediate' => 1,
		'mitigate' => 2,
		'exception' => 3
	};

	# Get the array of VULN elements
	my $checklist = $hash->{'CHECKLIST'}->[0];
	my $vulns = $checklist->{'VULN'};
	my $numVulns = scalar @$vulns;
	updateStatusText("  Found $numVulns <VULN> elements");
	my $cnt = 0;
	my $notReviewed_cnt = 0; # "Not Reviewed" count 

	# Iterate through the VULN array
	foreach my $vulnHash (@$vulns) {
		$cnt++;
		my $progress = sprintf("%0.2f",( $cnt / $numVulns ));

		# Get the array of STIG_DATA elements and find the RuleID
		my $stigData = $vulnHash->{'STIG_DATA'};
		my $ruleId = undef;
		foreach my $stigDatum (@$stigData) {
			if ($stigDatum->{'VULN_ATTRIBUTE'}->[0] eq 'Rule_ID') {
				$ruleId = $stigDatum->{'ATTRIBUTE_DATA'}->[0];
				last;
			}
		}
		# Skip this VULN if no RuleID is found
		if (!$ruleId) {
			updateStatusText("    WARN: Cannot find <VULN_ATTRIBUTE> = \"Rule_ID\" for element $cnt. Skipping.");
			next;
		}

		my $status = $vulnHash->{'STATUS'}->[0];
		my $stateId = $findingToState->{$status};
		
		if (!$stateId) {
			updateStatusText("    WARN: Unknown <STATUS> found for $ruleId. Skipping.");
			next;
		}
		if ($stateId == 1) {
			# Not_Reviewed is set to NULL stateId
			$stateId = undef;
			$notReviewed_cnt++;
		}
		# Use Finding Details as the state comment
		my $stateComment = $vulnHash->{'FINDING_DETAILS'}->[0];
		# trim spaces
		$stateComment=~s/^\s+//;
		$stateComment=~s/\s+$//;
		
		# Handle action (if any)		
		my $actionStr = undef;
		my $actionId = undef;
		my $actionComment = undef;
		my $resultStr = '';
		if ($stateId == 4) { # Open
			my $commentStr = $vulnHash->{'COMMENTS'}->[0];
			# Regex: ?: = non-capturing group, ? = optional group
			# Look for prefix remediate|mitigate|exception
			# and use as actionId if present
			($actionStr,$actionComment) = ($commentStr =~ /^(?:^(remediate|mitigate|exception)(?:\s*\:))?(.*)/smi);
			$actionId = $strToAction->{lc($actionStr)};
			# trim spaces
			$actionComment=~s/^\s+//;
			$actionComment=~s/\s+$//;
			$resultStr = "\"$status\" (" . lc($actionStr) . ")";
		} else {
			$resultStr = "\"$status\"";
		}	
		my $rv = $sthUpdateCklReview->execute(($stateId,$stateComment,$actionId,$actionComment,$userId,$assetId,$ruleId));
		if ($rv == 0) {
			$rv = $sthInsertCklReview->execute(($stateId,$stateComment,$actionId,$actionComment,$userId,$assetId,$ruleId));
		}
		if ($rv) {
			$insertCnt++;
			#updateStatusText("    Inserted result $resultStr for $ruleId.");
		} else {
			updateStatusText("    FAIL: Unable to insert result $resultStr for $ruleId.");
		}
		# Check if ruleId is current
		my ($currentRule) = $dbh->selectrow_array($sqlIsCurrentRule,undef,($ruleId));
		if (!$currentRule) {
			updateStatusText("    WARN: Rule $ruleId not present in any current STIG revision.");
		}
	}
	updateStatusText("  Imported $cnt results");
	updateStatusText("  Imported ckl included $notReviewed_cnt \"Not Reviewed\" results");
	updateStatsAssetStig($assetId,$stigId,$dbh);
}

sub importXccdf {
	my ($hash,$assetId,$stigId) = @_;
	
	# Initialization
	my $sqlInsertXccdfReview =<<END;
	insert into	reviews (
		assetId
		,ruleId
		,stateId
		,stateComment
		,userId
		,autoState
		,statusId
	)
	VALUES 
		(?,?,?,?,?,1,?)
END
	my $sthInsertXccdfReview = $dbh->prepare($sqlInsertXccdfReview); 

	my $sqlUpdateXccdfReview =<<END;
	UPDATE
		reviews
	SET
		stateId=?,
		stateComment=?,
		userId=?,
		autoState=1,
		statusId=?
	WHERE
		assetId = ?
		AND ruleId = ?
END
	my $sthUpdateXccdfReview = $dbh->prepare($sqlUpdateXccdfReview); 	
	
	my $sqlIsCurrentRule = <<END;
	select
		cgr.ruleId as "ruleId"
	from
		stigs.current_group_rules cgr
	where
		cgr.ruleId = ?
END
	my $resultToState = {
		'pass' => 3,
		'fail' => 4
	};
	
	# Get the array of <rule-result> elements
	my $testResult = $hash->{'cdf:Benchmark'}[0]->{'cdf:TestResult'}[0];
	my $href = $testResult->{'cdf:benchmark'}[0]->{'-href'};	
	# $href =~ s/scap_mil\.disa\.stig_comp_//g;

	my $ruleResults = $testResult->{'cdf:rule-result'};
	my $numResults = scalar @$ruleResults;
	updateStatusText("  Processing $numResults <rule-result> elements");
	my $cnt = 0;
	# Iterate through the array
	foreach my $ruleResult (@$ruleResults){
		$cnt++;
		my $progress = sprintf("%0.2f",( $cnt / $numResults ));
		
		my $ruleId = $ruleResult->{'-idref'}; 
		$ruleId =~ s/xccdf_mil\.disa\.stig_rule_//g;

		# Skip this VULN if no RuleID is found
		if (!$ruleId) {
			updateStatusText("    WARN: Cannot find \"idref\" attribute for element $cnt. Skipping.");
			next;
		}
		my $result = $ruleResult->{'cdf:result'}[0];
		my $stateId = $resultToState->{$result};
		if (!$stateId) {
			updateStatusText("    WARN: Unknown <result> for element $cnt. Skipping.");
			next;
		}
		
		my $statusId = 0;
		if ($stateId != 4) {
			$statusId = 3;
		}
		my $time = $ruleResult->{'-time'};
		my $stateComment = "SCC Reviewed at $time using\n$href";

		my $rv = $sthUpdateXccdfReview->execute(($stateId,$stateComment,$userId,$statusId,$assetId,$ruleId));
		if ($rv == 0) {
			$rv = $sthInsertXccdfReview->execute(($assetId,$ruleId,$stateId,$stateComment,$userId,$statusId));
		}

		if ($rv) {
			$insertCnt++;
			#updateStatusText("    Inserted result \"$result\" for $ruleId.");
		} else {
			updateStatusText("    FAIL: Unable to insert result \"$result\" for $ruleId.");
		}
		# Check if ruleId is current
		my ($currentRule) = $dbh->selectrow_array($sqlIsCurrentRule,undef,($ruleId));
		if (!$currentRule) {
			updateStatusText("    WARN: Rule $ruleId not present in any current STIG revision.");
		}
	}
	updateStatusText("  Imported $cnt results");
	updateStatsAssetStig($assetId,$stigId,$dbh);
}