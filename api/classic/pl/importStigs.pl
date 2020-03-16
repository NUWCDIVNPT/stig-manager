#!/usr/bin/perl
# $Id: importStigs.pl 190 2017-05-03 21:13:02Z cdaley $

# BEGIN {
# 	$ENV{'PATH'} = 'C:\Users\carl.SMIGIELSKI\Downloads\instantclient-basic-nt-12.1.0.2.0\instantclient_12_1;' . $ENV{'PATH'};
# }

use strict;
use warnings;
use Getopt::Long;
use File::Find;
use HTML::TreeBuilder;
use Data::Dumper;
use Digest::SHA1  qw(sha1 sha1_hex sha1_base64);
use DBI;
use DBD::Oracle qw(:ora_types);
use Archive::Zip;
use IO::String;
use Encode qw(encode decode);
use XML::TreePP;
use Data::Dumper;
use grip;
use Text::Unidecode;
# use stigImport;
use Log::Log4perl qw(:easy);
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );

select STDERR; $| = 1;  # make unbuffered
select STDOUT; $| = 1;  # make unbuffered

############################################################
# MAIN PROGRAM
############################################################

############################################################
# Process command line
############################################################
my $DEBUG=0;
my $SCAP = 0;
GetOptions ('debug' => \$DEBUG, 'scap' => \$SCAP);

my $importDir = '';
if (!$ARGV[0]) {
	print "Usage: $0 [--debug] directory\n";
	exit;
} else {
	$importDir = $ARGV[0];
}

############################################################
# String constants
############################################################
my $jobDb = "stig_import_jobs";
my $errorTable = 'import_errors';
my $stigsDb = "stigs";


############################################################
# Initialize error message hash
############################################################
 my $errHash = {
	'seq' => 0,
	'dbh' => undef,
	'jobDb' => $jobDb,
	'errTable' => $errorTable,
	'jobId' => undef,
	'zipPath' => [],
	'xccdfFn' => '',
	'message' => '',
	'errstr' => ''
};

############################################################
# Connect to database, insert job record, and get JobID
############################################################

my $dbh = gripDbh("PSG-STIGS",undef, 'oracle');
print Dumper ($dbh);
if (!$dbh) {
	print "Can't connect to database.\n";
	exit;
}
#$dbh->{'RaiseError'} = 0;
#$dbh->{'PrintError'} = 0;
$dbh->{HandleError} = sub { $errHash->{'errstr'} = $_[0]; };
$errHash->{'dbh'} = $dbh;

############################################################
# START SQL statements
############################################################

# SELECT Statememnts
my $sqlGetItem =<<END;
SELECT
	itemId
from
	stig_import_jobs.items
where 
	description = ? and
	href = ? and
	title = ? and
	filename = ? and
	sha1 = ? and
	lastModified = ?
END
my $sqlContentInJobs = "SELECT sha1 from stig_import_jobs.contents where sha1 = ?";
my $sqlContentInRevisions = "SELECT sha1 from revisions where sha1 = ?";
my $sqlGetXccdfId = "SELECT xccdfId FROM stig_import_jobs.xccdfs WHERE filename = ? and sha1 = ?";
my $sqlGetAliasGroupByStigId = "SELECT aliasGroup from stig_import_jobs.stig_aliases sa WHERE stigId = ?";
my $sqlGetNextAliasGroup = "SELECT MAX(aliasGroup) + 1 as nextAliasGroup from stig_import_jobs.stig_aliases sa";
my $sqlGetAliasesByGroup = "SELECT stigId from stig_import_jobs.stig_aliases sa WHERE aliasGroup = ?";
my $sqlGetAliasesByStigId = "SELECT stigId from stig_import_jobs.stig_aliases sa WHERE aliasGroup = (SELECT aliasGroup from stig_import_jobs.stig_aliases sa WHERE stigId = ?)";

# INSERT/UPDATE Statements

# JOB Statements
my $sqlInsertJob = "INSERT into stig_import_jobs.jobs (startTime,requestUrl) VALUES (SYSDATE,?) RETURNING jobId INTO ?";
my $sqlUpdateJobResponse = "UPDATE stig_import_jobs.jobs SET responseCode = ?, response = ?, responseHash = ? WHERE jobId = ?";
my $sqlUpdateJobFinish = "UPDATE stig_import_jobs.jobs SET endTime = SYSDATE WHERE jobId = ?";
my $sqlInsertItem = "INSERT into stig_import_jobs.items (description,href,title,filename,sha1,lastModified) VALUES (?,?,?,?,?,?) RETURNING itemId INTO ?";
my $sqlInsertContent = "INSERT into stig_import_jobs.contents (sha1,content,stored) VALUES (?,?,SYSDATE)";
my $sqlInsertJobItemMap = "INSERT /*+ ignore_row_on_dupkey_index(job_item_map, UNIQUE_COLUMNS_7) */ into stig_import_jobs.job_item_map (jobId,itemId) VALUES (?,?)"; 
my $sqlInsertJobImportMap = "INSERT /*+ ignore_row_on_dupkey_index(job_import_map, PRIMARY_3) */ into stig_import_jobs.job_import_map (sha1,jobId) VALUES (?,?)";
# my $sqlInsertRevHash = "INSERT IGNORE into $stigsDb.revisions (sha1,revId) VALUES (?,?)";
my $sqlInsertXccdfName = "INSERT into stig_import_jobs.xccdfs (filename,sha1) VALUES (?,?) RETURNING xccdfId INTO ?";
my $sqlInsertXccdfMap ="INSERT /*+ ignore_row_on_dupkey_index(item_xccdf_map, UNIQUE_COLUMNS) */ into stig_import_jobs.item_xccdf_map (sha1,xccdfId) VALUES (?,?) ";
my $sqlInsertAlias = "INSERT into stig_import_jobs.stig_aliases (aliasGroup,stigId) VALUES (?,?)";

# STIG Statements
my $sqlDisableRevConstraint = "ALTER TABLE REVISIONS DISABLE CONSTRAINT FK_STIGID"; 
my $sqlEnableRevConstraint = "ALTER TABLE REVISIONS ENABLE CONSTRAINT FK_STIGID";
my $sqlChangeStigIdForStigs = "UPDATE stigs set stigId = ? WHERE stigId = ?";
my $sqlChangeStigIdForRevs = "UPDATE revisions set stigId = ? WHERE stigId = ?";

my $sthInsertStig = $dbh->prepare("insert into stigs (title,stigId) VALUES (?,?)"); 
my $sthUpdateStig = $dbh->prepare("update stigs set title = ? where stigId = ?"); 
my $sqlInsertRevision =<<END;
insert into revisions
	(revId,stigId,version,release,benchmarkDate,benchmarkDateSql,status,statusDate,description,sha1)
VALUES
	(?,?,?,?,?,TO_DATE(?,'YYYY-MM-DD'),?,?,?,?)
END
my $sthInsertRevision = $dbh->prepare($sqlInsertRevision);

my $sqlUpdateRevision =<<END;
update revisions set
	stigId=?,
	version=?,
	release=?,
	benchmarkDate=?,
	benchmarkDateSql=TO_DATE(?,'YYYY-MM-DD'),
	status=?,
	statusDate=?,
	description=?,
	sha1=?
where
	revId = ?
END
my $sthUpdateRevision = $dbh->prepare($sqlUpdateRevision);

my $sthInsertRevXml = $dbh->prepare("insert into rev_xml_map (revId,xml) VALUES (?,?)");
my $sthUpdateRevXml = $dbh->prepare("update rev_xml_map set xml=? where revId=?");
my $sthInsertGroup = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(groups, primary_8) */ into groups (groupId, title) VALUES (?,?)");   
my $sthInsertFix = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(fixes, primary_7) */ into fixes (fixId,text) VALUES (?,?)");
my $sqlInsertRule =<<END;
insert into rules 
(ruleId,version,title,severity,weight,vulnDiscussion,
falsePositives,falseNegatives,documentable,mitigations,
securityOverrideGuidance,potentialImpacts,thirdPartyTools,
mitigationControl,responsibility,iaControls)
VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
END
my $sthInsertRule = $dbh->prepare($sqlInsertRule);   

my $sqlUpdateRule =<<END;
update rules set
	version=?,
	title=?,
	severity=?,
	weight=?,
	vulnDiscussion=?,
	falsePositives=?,
	falseNegatives=?,
	documentable=?,
	mitigations=?,
	securityOverrideGuidance=?,
	potentialImpacts=?,
	thirdPartyTools=?,
	mitigationControl=?,
	responsibility=?,
	iaControls=?
where
	ruleId = ?
END
my $sthUpdateRule = $dbh->prepare($sqlUpdateRule);   

my $sthInsertCheck = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(checks, \"PRIMARY\") */ into checks (checkId,content) VALUES (?,?)"); 

# Data Mapping Statements
my $sthRGMap = $dbh->prepare("insert into rev_group_map (groupId,revId) VALUES (?,?)"); 
my $sthRPGMap = $dbh->prepare("insert into rev_profile_group_map (revId,profile,groupId) VALUES (?,?,?)");
my $sthRGRMap = $dbh->prepare("insert into rev_group_rule_map (rgId,ruleId) VALUES (?,?)"); 
my $sthRCMap = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(rule_check_map, index_2_2) */ into rule_check_map (ruleId,checkId) VALUES (?,?)"); 
my $sthRFMap = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(rule_fix_map, index_2_4) */ into rule_fix_map (ruleId,fixId) VALUES (?,?)"); 
my $sthRCtlMap = $dbh->prepare("insert /*+ ignore_row_on_dupkey_index(rule_control_map, index_2_3) */ into rule_control_map (ruleId,controlNumber,controlType) VALUES (?,?,?)"); 

# Current revision calculation
my $sqlInsertCurrentRevs =<<END;
insert into current_revs 
select 
	revId,
	stigId,
	version,
	release,
	benchmarkDate,
	benchmarkDateSql,
	status,
	statusDate,
	description,
	active
from (
  SELECT
	revId,
	stigId,
	version,
	release,
	benchmarkDate,
	benchmarkDateSql,
	status,
	statusDate,
	description,
	active
    ,ROW_NUMBER() OVER (PARTITION BY stigId ORDER BY version+0 desc, release+0 desc) AS rn
  FROM
    revisions
)
where rn = 1
END

# Current group/rule/stig calculation
my $sqlInsertCurrentGroupRules =<<END;
insert into current_group_rules
SELECT rg.groupId,
	rgr.ruleId,
	s.stigId
from
	stigs s
	left join current_revs cr on cr.stigId=s.stigId
	left join rev_group_map rg on rg.revId=cr.revId
	left join rev_group_rule_map rgr on rgr.rgId=rg.rgId
where
	cr.revId is not null
order by
	rg.groupId,rgr.ruleId,s.stigId
END

my $sqlDelRevisionsOlderThan4Revs =<<END;
delete from 
  revisions
  where revId in (
    select
      revid
    from    
    (select
            ROW_NUMBER() OVER (PARTITION BY stigid ORDER BY statusdate desc) AS rn,
            revid
          from revisions) hrows 
        where hrows.rn > 4)
END

my $sqlCleanupOrphanedRules = "delete from rules r where r.ruleid not in (select distinct ruleid from REV_GROUP_RULE_MAP)";
my $sqlCleanupOrphanedGroups = "delete from groups g where g.groupid not in (select distinct groupid from rev_group_map)";


############################################################
# END SQL statements
############################################################

############################################################
# Initialize XML parser
############################################################
my $xml = XML::TreePP->new();
$xml->set( force_array => ['*'] );
# Handle elements that don't always have attributes
$xml->set( force_hash => ['status','plain-text',] );
$xml->set( ignore_error => 1 );

############################################################
# Start the job
############################################################
print "Starting import job\n";
my $jobId;
my $sthInsertJob = $dbh->prepare($sqlInsertJob);
$sthInsertJob->bind_param(1,'file:/' . $importDir);
$sthInsertJob->bind_param_inout(2,\$jobId,32);
my $rv;
$rv = $sthInsertJob->execute();
print "sthInsertJob: $rv \n";
$errHash->{'jobId'} = $jobId;
print "Job ID = $jobId\n";

############################################################
# Traverse the importDir
# When this returns, all files have been processed
############################################################
find({
			'wanted' => \&fileAction,
			'preprocess' => sub { sort @_ },
	},
	$importDir
);

############################################################
# All files have been processed.
# Update the current revision data
############################################################
print "Updating current revision and rule/group tables.\n";
$dbh->do("DELETE FROM current_revs");
$dbh->do($sqlInsertCurrentRevs);
$dbh->do("DELETE FROM current_group_rules");
$dbh->do($sqlInsertCurrentGroupRules);

############################################################
# All files have been processed.
# Remove revisions > 4 revisions old.
############################################################
print "Removing revisions older than 4 revisions old.\n";
$dbh->do($sqlDelRevisionsOlderThan4Revs);
$dbh->do($sqlCleanupOrphanedGroups);
$dbh->do($sqlCleanupOrphanedRules);

############################################################
# Finish
############################################################
$dbh->do($sqlUpdateJobFinish,undef,($jobId));
print "Finished with Job ID $jobId.\n";


############################################################
# SUBROUTINES BEGIN
############################################################
############################################################
# Action for each file in the import directory
############################################################
sub fileAction {
	# Look for ZIP files that don't have 'IAVM' in their name
	if (/\.zip$/i && !/IAVM/i) {
		my $fileInDir = $_;
		#my $filename = $File::Find::name;
		my $filename = "/var/www/html/pl/import/test.zip";
		print "PROCESSING ZIP FILE: $filename\n";
		my ($dev,$ino,$mode,$nlink,$uid,$gid,$rdev,$size,$atime,$mtime,$ctime,$blksize,$blocks) = stat($filename);
		my $last_modified = $mtime;
		my $content = do {
			local $/ = undef;
			open my $fh, "<", $filename
				or die "could not open $File::Find::name: $!";
			binmode $fh;
			<$fh>;
		};
		my $descStr = "Local ZIP file";
		my $href = "file:/" . $filename;
		my $title = "Local ZIP file";


		# Check if we've already stored the metadata for this item in the jobDb
		my $currentSha1 = sha1_hex($content);
		my $itemId;
		($itemId) = $dbh->selectrow_array($sqlGetItem,undef,($descStr,$href,$title,$fileInDir,$currentSha1,$last_modified));
		if (!$itemId) { # no previous record for this item
			if ($DEBUG) { print "Inserting metadata into jobDb\n";}
			my $sthInsertItem = $dbh->prepare($sqlInsertItem);
			$sthInsertItem->bind_param(1,$descStr);
			$sthInsertItem->bind_param(2,$href);
			$sthInsertItem->bind_param(3,$title);
			$sthInsertItem->bind_param(4,$fileInDir);
			$sthInsertItem->bind_param(5,$currentSha1);
			$sthInsertItem->bind_param(6,$last_modified);
			$sthInsertItem->bind_param_inout(7,\$itemId,32);
			$sthInsertItem->execute();
		} else { # item has been previously processed
			if ($DEBUG) { print "Metadata was already inserted into jobDb\n";}
		}
		
		# Record that we saw this item during this job
		$dbh->do($sqlInsertJobItemMap,undef,($jobId,$itemId));

		# Check if we've already stored the content for this item in the jobDb
		my ($shaCheck) = $dbh->selectrow_array($sqlContentInJobs,undef,($currentSha1));
		if (!$shaCheck) { # content is not stored
			if ($DEBUG) { print "Inserting content into jobDb\n";}
			my $sthInsertContent = $dbh->prepare($sqlInsertContent);
			$sthInsertContent->bind_param(1,$currentSha1);
			$sthInsertContent->bind_param(2,$content,{ ora_type => ORA_BLOB });
			$sthInsertContent->execute();
		} else {
			if ($DEBUG) { print "Content previously inserted into jobDb\n";}
		}

		# Process the zip file
		$errHash->{'zipPath'} = [];
		push(@{$errHash->{'zipPath'}},$filename);
		processStigZip($content,$currentSha1);
	} else { # File was not a ZIP
		if ($DEBUG) { print "WARNING: Ignoring $_\n"; }
	}
}	

############################################################
# processStigZip (zipContent, zipHash)
#
# Iterates through the members of a zip archive, recursing 
# into any members that are also zip archives, and extracts
# members whose name contains the string 'xccdf'.
#
# If not already present, insert the metadata and content 
# of each XCCDF file into the job database. 
############################################################

sub processStigZip {
	############################################################
	# IMPLEMENTATION NOTE:
	# Archive::Zip only accepts filehandles for input and output, 
	# but our downloaded zip data is in a string. We use 
	# IO::String to create a filehandle from the string
	# and use that filehandle with Archive::Zip
	############################################################

	my $fh = IO::String->new($_[0]); # create filehandle from our string
	my $parentSha1 = $_[1]; # SHA1 of the parent zip file 
	my $zip = Archive::Zip->new();
	$zip->readFromFileHandle($fh);
	my @members = $zip->members();
	foreach my $member (@members) {
		my $memberName = $member->fileName();

		############################################################
		# Recurse into any zip archives found
		############################################################
		if ($memberName =~ /\.zip/i) {
			print "PROCESSING CHILD: $memberName\n";
			# initialize a string to extract the zip archive into
			my $strZip = "";
			# tie the string to a filehandle
			my $fhZip = IO::String->new($strZip);
			# extract into the filehandle
			$member->extractToFileHandle($fhZip);
			# add this member to the zipPath in the error hash
			push (@{$errHash->{'zipPath'}},$memberName);
			# call ourselves with the scalar containing the zip data
			processStigZip($strZip,$parentSha1);
			# Be neat.
			close ($fhZip);
			# remove this member from the zipPath in the error hash
			pop(@{$errHash->{'zipPath'}});
			$strZip = "";
		}

		############################################################
		# Process any XCCDF files found
		############################################################
		if ($memberName =~ /xccdf.*\.xml$/i) { # Process the XCCDF file
			$errHash->{'xccdfFn'} = $memberName;
			print "EXTRACTING XCCDF: $memberName...\n";
			# initialize a string to extract the zip archive into
			my $strXccdf = "";
			# tie the string to a filehandle
			my $fhXccdf = IO::String->new($strXccdf);
			# extract into the filehandle
			$member->extractToFileHandle($fhXccdf);
			# use the string from now on
			my $xccdfSha1 = sha1_hex($strXccdf);

			# Do we have the metadata in the jobDb already?
			my $xccdfId;
			($xccdfId) = $dbh->selectrow_array($sqlGetXccdfId,undef,($memberName,$xccdfSha1));
			if (!$xccdfId) { # no
				if ($DEBUG) { print "Inserting metadata into jobDb\n";}
				my $sthInsertXccdfName = $dbh->prepare($sqlInsertXccdfName);
				$sthInsertXccdfName->bind_param(1,$memberName);
				$sthInsertXccdfName->bind_param(2,$xccdfSha1);
				$sthInsertXccdfName->bind_param_inout(3,\$xccdfId,32);
				$sthInsertXccdfName->execute();
			} else { # yes
				if ($DEBUG) { print "Metadata was already inserted into jobDb\n";}
			}
			
			$dbh->do($sqlInsertXccdfMap,undef,($parentSha1,$xccdfId));
			
			# Do we have the content in the jobDb already?
			my ($shaCheck) = $dbh->selectrow_array($sqlContentInJobs,undef,($xccdfSha1));
			if (!$shaCheck) { # content is not stored
				if ($DEBUG) { print "Inserting content into jobDb\n";}
				my $sthInsertContent = $dbh->prepare($sqlInsertContent);
				$sthInsertContent->bind_param(1,$xccdfSha1);
				$sthInsertContent->bind_param(2,$strXccdf,{ ora_type => ORA_BLOB });
				$sthInsertContent->execute();
			} else {
				if ($DEBUG) { print "Content previously inserted into jobDb\n";}
			}
			
			# Has this XCCDF been previously imported into the STIG database?
			my ($shaStigmanCheck) = $dbh->selectrow_array($sqlContentInRevisions,undef,($xccdfSha1));

			if (!$shaStigmanCheck) { 
				# XCCDF has not been imported into STIG database
				# Check for Manual or Benchmark stig
				if ($memberName =~ /manual/i ){ 
					###################################
					# Import the content as a STIG
					###################################
					print "IMPORTING MANUAL XCCDF: $memberName\n";
					if (!importStig($xccdfSha1, $strXccdf)) {
						print $errHash->{'message'} . "\n";
						insertErrorMsg($errHash);
					}
				}
				elsif ($memberName =~ /benchmark/i && $SCAP ){
					###################################
					# Import the content as a Benchmark
					###################################
					print "IMPORTING BENCHMARK XCCDF: $memberName\n";
					if (!importBenchmarkRules($strXccdf)) {
						print $errHash->{'message'} . "\n";
						insertErrorMsg($errHash);
					}
				} 
				# else {
					# print "FOUND UNLABLED XCCDF: $memberName\n";
					# if (!importStig($xccdfSha1, $strXccdf)) {
						# print $errHash->{'message'} . "\n";
						# insertErrorMsg($errHash);
					# }
				# }

				## Populate job_import_map in stig_scraper DB:
				$dbh->do($sqlInsertJobImportMap,undef,($xccdfSha1,$jobId));
			} else {
				print "ALREADY IMPORTED XCCDF: $memberName\n";
			}			
			print "********************************************\n\n";
			
			# Be neat.
			close ($fhXccdf);
			$strXccdf = "";
		}

	}
	close($fh);
	
}

sub importStig{
	my ($sha1xccdf,$hash,$stigTitle,$benchmarkId,$sql,$releaseInfo,$release,$benchmarkDate,$version,$status,$statusDate,$description,$revisionId,$stigId,$profileArrayRef,$profileHashRef,$profileId,$selectArrayRef,$groupArrayRef,$groupHashRef,$groupId,$groupTitle,$rgId,$ruleArrayRef,$ruleHashRef,$ruleId,$ruleVersion,$ruleTitle,$ruleSeverity,$ruleWeight,$fixtextArrayRef,$fixFixRef,$fixtextHashRef,$fixText,$checkArrayRef,$checkHashRef,$checkId,$checkContent,$xmlContent,$identArrayRef);

	$sha1xccdf=$_[0];
	$xmlContent=$_[1];

	$xmlContent = utf8_to_ascii($xmlContent);
	
	$hash = $xml->parse( $xmlContent );
	if (!$hash) {
		$errHash->{'message'} = "XML parsing failed.";
		return 0;
	}
	#$Data::Dumper::Maxdepth = 5;
	#print Dumper($hash);

	#Check for draft status
	$status = $hash->{'Benchmark'}[0]->{'status'}[0]->{'#text'};
	if ($status eq 'draft') {
		$errHash->{'message'} = 'Found draft status, not importing';
		return 0;
	}

	#Process the STIG's title - get $stigId
	$stigTitle = $hash->{'Benchmark'}[0]->{'title'}[0];
	$benchmarkId = $hash->{'Benchmark'}[0]->{'-id'};
	return "XML file is not a STIG. Can't find title." unless ($stigTitle);
	
	# BEGIN TRANSACTION
	#$dbh->begin_work;
	$stigId = processStigTitle($stigTitle,$benchmarkId);
	return "Error processing the STIG title." unless ($stigId);
	
	#Process STIG revision - get $revisionId
	$releaseInfo = $hash->{'Benchmark'}[0]->{'plain-text'}[0]->{'#text'};
	($release,$benchmarkDate) = ($releaseInfo =~ /Release:\s+(\S+)\s+Benchmark Date:\s+(.*)/);
	$release = ($release ? $release : '0');
	$version = $hash->{'Benchmark'}[0]->{'version'}[0];
	$status = $hash->{'Benchmark'}[0]->{'status'}[0]->{'#text'};
	$statusDate = $hash->{'Benchmark'}[0]->{'status'}[0]->{'-date'};
	$description = $hash->{'Benchmark'}[0]->{'description'}[0];
	$revisionId = processStigRevision($stigId,$version,$release,$benchmarkDate,$status,$statusDate,$description,$xmlContent,$sha1xccdf);
	if (!$revisionId) {
		$errHash->{'message'} = "Error processing revision for $stigId";
		return 0;
	}

	#Create Profile/Group mappings
	$profileArrayRef = $hash->{'Benchmark'}[0]->{'Profile'};
	processProfiles($revisionId,$profileArrayRef);


	#Add Groups
	$groupArrayRef = $hash->{'Benchmark'}[0]->{'Group'};
	foreach $groupHashRef (@$groupArrayRef){
		#Look at Each Group
		$groupId = $groupHashRef->{'-id'};
		$groupTitle = $groupHashRef->{'title'}[0];
		$groupTitle = Encode::encode("ISO-8859-1", $groupTitle);
		#Write the groups into the Database
		if ($DEBUG) { print "$groupId:$groupTitle\n"; }
		$sthInsertGroup->execute(($groupId,$groupTitle));
		$sthRGMap->execute(($groupId,$revisionId));
		#Get the RG ID
		$sql = "select rgId from rev_group_map where revId=? and groupId =?"; 
		($rgId) = $dbh->selectrow_array($sql,undef,($revisionId,$groupId));

		#Look at each rule in the group
		$ruleArrayRef = $groupHashRef->{'Rule'};
		foreach $ruleHashRef (@$ruleArrayRef) {
			$ruleId = $ruleHashRef->{'-id'};
			$ruleVersion = $ruleHashRef->{'version'}[0];
			$ruleTitle = $ruleHashRef->{'title'}[0];
			$ruleSeverity = $ruleHashRef->{'-severity'};
			$ruleWeight = $ruleHashRef->{'-weight'};
			
			# Extract idents
			$identArrayRef = $ruleHashRef->{'ident'};
			foreach my $ident (@$identArrayRef) {
				if ($ident) {
					 if ($ident->{'-system'} eq 'http://iase.disa.mil/cci') {
						$sthRCtlMap->execute(($ruleId,$ident->{'#text'},'CCI'));
					}
				}
			}

			# Get and parse the Rule description
			$description = $ruleHashRef->{'description'}[0];
			my ($ruleVd) = ($description =~ /<VulnDiscussion>(.*)<\/VulnDiscussion>/s);
			$ruleVd = substr($ruleVd,0,32000);
			my ($ruleFp) = ($description =~ /<FalsePositives>(.*)<\/FalsePositives>/s);
			my ($ruleFn) = ($description =~ /<FalseNegatives>(.*)<\/FalseNegatives>/s);
			my ($ruleDoc) = ($description =~ /<Documentable>(.*)<\/Documentable>/s);
			my ($ruleMit) = ($description =~ /<Mitigations>(.*)<\/Mitigations>/s);
			my ($ruleSog) = ($description =~ /<SecurityOverrideGuidance>(.*)<\/SecurityOverrideGuidance>/s);
			my ($rulePi) = ($description =~ /<PotentialImpacts>(.*)<\/PotentialImpacts>/s);
			my ($ruleTpt) = ($description =~ /<ThirdPartyTools>(.*)<\/ThirdPartyTools>/s);
			my ($ruleMc) = ($description =~ /<MitigationControl>(.*)<\/MitigationControl>/s);
			my ($ruleResp) = ($description =~ /<Responsibility>(.*)<\/Responsibility>/s);
			$ruleResp =~ s/<\/Responsibility><Responsibility>/, /g;
			my ($ruleIaControls) = ($description =~ /<IAControls>(.*)<\/IAControls>/s);
			
			#Insert discovered Rule into the database
			# print "\t$ruleId:$ruleVersion:$ruleTitle\n";
			my $rv = $sthUpdateRule->execute(($ruleVersion,$ruleTitle,$ruleSeverity,$ruleWeight,$ruleVd,$ruleFp,$ruleFn,$ruleDoc,$ruleMit,$ruleSog,$rulePi,$ruleTpt,$ruleMc,$ruleResp,$ruleIaControls,$ruleId));
			if ($rv == 0) {
				my $rv = $sthInsertRule->execute(($ruleId,$ruleVersion,$ruleTitle,$ruleSeverity,$ruleWeight,$ruleVd,$ruleFp,$ruleFn,$ruleDoc,$ruleMit,$ruleSog,$rulePi,$ruleTpt,$ruleMc,$ruleResp,$ruleIaControls));
				if (!$rv) {
					$errHash->{'message'} = "Error inserting $ruleId. Continuing to process.";
					print $errHash->{'message'} . "\n";
					insertErrorMsg($errHash);
				}
			}
			#Map the Rule to the Group in which it was found
			$sthRGRMap->execute(($rgId,$ruleId));
			
			#Map the Rule to any IA Control it references
			$ruleIaControls =~ s/\s+//g; # remove spaces
			my @iaControls = split(',',$ruleIaControls);
			foreach my $iaControl (@iaControls) {
				$sthRCtlMap->execute(($ruleId,$iaControl,'DIACAP'));
			}
			
			#LOOK AT THE FIXES!
			$fixtextArrayRef = $ruleHashRef->{'fixtext'};
			foreach $fixtextHashRef (@$fixtextArrayRef){
				my $fixFixRef = $fixtextHashRef->{'-fixref'};
				my $fixText = $fixtextHashRef->{'#text'};
				
				# Insert discovered fix (fixtext) into the database:
				$rv = $sthInsertFix->execute(($fixFixRef,$fixText));
				if (!$rv) {
					$errHash->{'message'} = "Error inserting $fixFixRef. Continuing to process.";
					print $errHash->{'message'} . "\n";
					insertErrorMsg($errHash);
				}
				#Map the Fix to the Rule in which it was found.
				$sthRFMap->execute(($ruleId,$fixFixRef));
			}
			
			#LOOK AT THE CHECKS!
			$checkArrayRef = $ruleHashRef->{'check'};
			foreach $checkHashRef (@$checkArrayRef){
				$checkId = $checkHashRef->{'-system'};
				$checkContent = $checkHashRef->{'check-content'}[0];
				
				# Insert discovered Check into the database:
				$rv = $sthInsertCheck->execute(($checkId,$checkContent));
				if (!$rv) {
					$errHash->{'message'} = "Error inserting $checkId. Continuing to process.";
					print $errHash->{'message'} . "\n";
					insertErrorMsg($errHash);
				}
				#Map the Fix to the Rule in which it was found.
				$sthRCMap->execute(($ruleId,$checkId));
			}
		}
	}
	
	print "IMPORTED GROUPS/RULES: $revisionId\n";
	#$dbh->commit;
	print "COMMITTED: $revisionId\n";
	return 1;
}

sub processProfiles {
	###################################################
	# Input: revisionId (string)
	# Input: profileArrayRef (array reference)
	# Output: void
	###################################################
	my ($revisionId,$profileArrayRef) = @_;
	my ($profileHashRef,$profileId,$selectArrayRef,$selectHashRef,$groupId);
	
	print "PROCESSING PROFILES: $revisionId\n";
	my $revIds = [];
	my $profileIds = [];
	my $groupIds = [];
	
	foreach $profileHashRef (@$profileArrayRef){
		$profileId = $profileHashRef->{'-id'};
		$selectArrayRef = $profileHashRef->{'select'};
		foreach $selectHashRef (@$selectArrayRef){
			$groupId = $selectHashRef->{'-idref'};
			if ($selectHashRef->{'-selected'} eq 'true'){
				if ($DEBUG) { print "$revisionId,$profileId,$groupId\n"; }
				push(@$revIds,$revisionId);
				push(@$profileIds,$profileId);
				push(@$groupIds,$groupId);
				#$sthRPGMap->execute(($revisionId,$profileId,$groupId));
			} else {
				$errHash->{'message'} = "Profiles: value other than 'true' found. Continuing.";
				print $errHash->{'message'} . "\n";
				insertErrorMsg($errHash);
			}
		}
	}
	$sthRPGMap->bind_param_array(1,$revIds);
	$sthRPGMap->bind_param_array(2,$profileIds);
	$sthRPGMap->bind_param_array(3,$groupIds);
	my $tuples = $sthRPGMap->execute_array({ArrayTupleStatus=>\my @tuple_status});
	if (defined $tuples) {
		print "TUPLES: $tuples\n";
	} else {
		for my $tuple (0 .. scalar @$revIds-1) {
			my $status = $tuple_status[$tuple];
			$status = [0, "Skipped"] unless defined $status;
			next unless ref $status;
			$errHash->{'message'} = sprintf "ERROR: Failed to insert (%s, %s, %s): %s", $revIds->[$tuple], $profileIds->[$tuple], $groupIds->[$tuple], $status->[1];
			print $errHash->{'message'} . "\n";
			insertErrorMsg($errHash);
		}
	}
}

sub processStigRevision {
	###################################################
	# Input: stigId (string)
	# Input: version (integer)
	# Input: release (integer)
	# Input: benchmarkDate (string)
	# Input: status (string)
	# Input: statusDate (string)
	# Input: decsription (string)
	# Input: sha1 (string)
	# Input: xml (blob)
	# Output: revisionId (integer)
	###################################################
	my ($stigId,$version,$release,$benchmarkDate,$status,$statusDate,$description,$xmlContent,$sha1xccdf) = @_;
	my $revisionId = $stigId . "-" . $version . "-" . $release;
	my $rv;
	my $benchmarkDateSql = benchmarkDateToSqlDate($benchmarkDate);
	
	#Block to INSERT revision, DO NOT UPDATE IF ALREADY THERE, and Log discrepancy.
	$rv = $sthInsertRevision->execute(($revisionId,$stigId,$version,$release,$benchmarkDate,$benchmarkDateSql,$status,$statusDate,$description,$sha1xccdf));
	if (!$rv){
		$errHash->{'message'} = "Revision $revisionId already present! Skipping.";
		print $errHash->{'message'} . "\n";
		insertErrorMsg($errHash);
		return undef;
	}
	$sthInsertRevXml->bind_param(1,$revisionId);
	$sthInsertRevXml->bind_param(2,$xmlContent,{ ora_type => ORA_BLOB });
	$sthInsertRevXml->execute(($revisionId,$xmlContent));
	print "WROTE REVISION INFO: $revisionId\n";
	return $revisionId;	
}

sub benchmarkDateToSqlDate {
	###################################################
	# Input: benchmarkDate (string)
	# Output: benchmarkDateSql (date)
	###################################################
	my ($benchmarkDate) = @_;
	my $monthToNum = {
		'Jan' => '01',
		'January' => '01',
		'Feb' => '02',
		'February' => '02',
		'Mar' => '03',
		'March' => '03',
		'Apr' => '04',
		'April' => '04',
		'May' => '05',
		'Jun' => '06',
		'June' => '06',
		'Jul' => '07',
		'July' => '07',
		'Aug' => '08',
		'August' => '08',
		'Sep' => '09',
		'September' => '09',
		'Oct' => '10',
		'October' => '10',
		'Nov' => '11',
		'November' => '11',
		'Dec' => '12',
		'December' => '12',
	};
	my ($day,$monStr,$year) = split(/\s+/,$benchmarkDate);
	return sprintf("%04d-%02d-%02d",$year,$monthToNum->{$monStr},$day);
}

sub processStigTitle {
	###################################################
	# Input: currentTitle (string)
	# Input: currentStigId (string)
	# Output: stigId (string)
	###################################################
	my ($currentTitle,$currentStigId) = @_;
	my ($stigId,$sqlTitleQuery,$sqlStigIdQuery,$stigIdByTitle,$stigIdByStigId,$titleByStigId,$rv);
	
	$sqlTitleQuery = "SELECT stigId FROM stigs s where title = ?";
	$sqlStigIdQuery = "SELECT stigId,title FROM stigs s where stigId = ?";
	($stigIdByStigId,$titleByStigId) = $dbh->selectrow_array($sqlStigIdQuery,undef,($currentStigId));
	($stigIdByTitle) = $dbh->selectrow_array($sqlTitleQuery,undef,($currentTitle));

	# Check for stigId/title mismatch

	if (!$stigIdByStigId) {
		# No existing STIGID in the db
		if ($stigIdByTitle) {
			# The title was found in the db
			$errHash->{'message'} = "WARN: $currentStigId has title ($currentTitle) also used by \"$stigIdByTitle\"";
			insertErrorMsg($errHash);
			$rv = reviseStigId($stigIdByTitle,$currentStigId);
			return undef if (!$rv);
		} else {
			#INSERT
			$rv = $sthInsertStig->execute(($currentTitle,$currentStigId));
			print "INSERTED STIG ID: $currentStigId ($currentTitle)\n";
		}
	} else {
		# A row exists for the current STIGID
		if ($currentTitle ne $titleByStigId) {
			# The existing title is not the current title
			$errHash->{'message'} = "NOTE: Previous title: $titleByStigId\nUpdated title: $currentTitle";
			insertErrorMsg($errHash);
			#UPDATE
			my $rv = $sthUpdateStig->execute(($currentTitle,$currentStigId));
			print "UPDATED STIG ID: $currentStigId ($currentTitle)\n";
		} else {
			print "FOUND EXISTING STIG ID: $currentStigId ($currentTitle)\n";
		}
	}
	
	return $currentStigId;
}

sub reviseStigId {
	###################################################
	# Input: title (string)
	# Input: oldStigId (string)
	# Input: newStigId (string)
	# Output: stigId (string)
	###################################################
	my ($oldStigId,$newStigId) = @_;
	my ($aliasGroup,$rv);
	
	$errHash->{'message'} = "WARN: STIGID mismatch. Want to replace $oldStigId with $newStigId";
	print $errHash->{'message'} . "\n";
	insertErrorMsg($errHash);
	if ($aliasGroup = getCommonAliasGroup($oldStigId,$newStigId)) {
		print "NOTE: Got AliasGroup $aliasGroup\n";
		$rv = $dbh->do($sqlDisableRevConstraint);
		return undef if (!$rv);
		$rv = $dbh->do($sqlChangeStigIdForStigs,undef,($newStigId,$oldStigId));
		return undef if (!$rv);
		$rv = $dbh->do($sqlChangeStigIdForRevs,undef,($newStigId,$oldStigId));
		return undef if (!$rv);
		$rv = $dbh->do($sqlEnableRevConstraint);
		return undef if (!$rv);
	} else {
		# Bail. Error setting up alias group
		return undef;
	}
	return 1;
}

sub getCommonAliasGroup {
	###################################################
	# Input: oldStigId (string)
	# Input: newStigId (string)
	# Output: alias_group (string)
	###################################################
	my ($oldStigId,$newStigId) = @_;
	my ($newAliasGroup,$oldAliasGroup,$nextAliasGroup,$rv);

	($newAliasGroup) = $dbh->selectrow_array($sqlGetAliasGroupByStigId,undef,($newStigId));
	($oldAliasGroup) = $dbh->selectrow_array($sqlGetAliasGroupByStigId,undef,($oldStigId));
	
	# Is newStigId already in an aliasGroup?
	if ($newAliasGroup) {
		# newStigId is already in a group.
		# Is oldStigId in a group?
		if ($oldAliasGroup) {
			# oldStigId is already in an alias group.
			# Is it the same group that contains newStigId?
			if ($newAliasGroup == $oldAliasGroup) {
				# return alias_group
				return $newAliasGroup;
			} else {
				# This is not good. Bail.
				$errHash->{'message'} = "ERROR: aliasGroup conflict! $oldStigId in group $oldAliasGroup, $newStigId in group $newAliasGroup.";
				print $errHash->{'message'} . "\n";
				insertErrorMsg($errHash);
				return undef;
			}
		} else {
			# oldStigId is not in an aliasGroup (!).
			# Add oldStigId to the group containing newStigId
			$rv = $dbh->do($sqlInsertAlias,undef,($newAliasGroup,$oldStigId));
			if ($rv) {
				# return alias_group
				return $newAliasGroup;
			} else {
				# This is not good. Bail.
				$errHash->{'message'} = "ERROR: Can't add $oldStigId to alias group $newAliasGroup.";
				print $errHash->{'message'} . "\n";
				insertErrorMsg($errHash);
				return undef;
			}
		}
	} else {
		# newStigId is not in a group.
		# Is oldStigId already in a group?
		if ($oldAliasGroup) {
			# oldStigId is already in a group
			# Add newStigId to the group containing oldStigId
			$rv = $dbh->do($sqlInsertAlias,undef,($oldAliasGroup,$newStigId));
			if ($rv) {
				# return alias_group
				return $oldAliasGroup;
			} else {
				# This is not good. Bail.
				$errHash->{'message'} = "ERROR: Can't add $newStigId to alias group $oldAliasGroup.";
				print $errHash->{'message'} . "\n";
				insertErrorMsg($errHash);
				return undef;
			}
		} else {
			# oldStigId is not already in a group
			# Add oldStigId and newStigId to a new alias group
			($nextAliasGroup) = $dbh->selectrow_array($sqlGetNextAliasGroup);
			if ($nextAliasGroup) {
				$rv = $dbh->do($sqlInsertAlias,undef,($nextAliasGroup,$newStigId));
				if (!$rv) {
					# This is not good. Bail.
					$errHash->{'message'} = "ERROR: Can't add $newStigId to alias group $nextAliasGroup.";
					print $errHash->{'message'} . "\n";
					insertErrorMsg($errHash);
					return undef;
				} else {
					$rv = $dbh->do($sqlInsertAlias,undef,($nextAliasGroup,$oldStigId));
					if (!$rv) {
						# This is not good. Bail.
						$errHash->{'message'} = "ERROR: Can't add $oldStigId to alias group $nextAliasGroup.";
						print $errHash->{'message'} . "\n";
						insertErrorMsg($errHash);
						return undef;
					}
				}
				return $nextAliasGroup;
			} else {
				# This is not good. Bail.
				$errHash->{'message'} = "ERROR: Can't determine next alias_group id. Can't resolve this stigId mismatch.";
				print $errHash->{'message'} . "\n";
				insertErrorMsg($errHash);
				return undef;
			}
		}
	} 
}

sub clearTables {
	$dbh->do("delete from checks");
	$dbh->do("delete from current_revs");
	$dbh->do("delete from current_rule_groups");
	$dbh->do("delete from fixes");
	$dbh->do("delete from groups");
	$dbh->do("delete from rev_group_map");
	$dbh->do("delete from rev_group_rule_map");
	$dbh->do("delete from rev_profile_group_map");
	$dbh->do("delete from rev_xml_map");
	$dbh->do("delete from revisions");
	$dbh->do("delete from rule_check_map");
	$dbh->do("delete from rule_fix_map");
	$dbh->do("delete from rule_oval_map");
	$dbh->do("delete from rules");
	$dbh->do("delete from stigs");
}

sub utf8_to_ascii {
	my $string=$_[0];
	$string =~ s/\xe2\x80\x90/-/g;
	$string =~ s/\xe2\x80\x91/-/g;
	$string =~ s/\xe2\x80\x92/-/g;
	$string =~ s/\xe2\x80\x93/-/g;
	$string =~ s/\xe2\x80\x94/-/g;
	$string =~ s/\xe2\x80\x95/-/g;
	$string =~ s/\xe2\x80\x96/|/g;
	$string =~ s/\xe2\x80\x97/_/g;
	$string =~ s/\xe2\x80\x98/'/g;
	$string =~ s/\xe2\x80\x99/'/g;
	$string =~ s/\xe2\x80\x9a/'/g;
	$string =~ s/\xe2\x80\x9b/'/g;
	$string =~ s/\xe2\x80\x9c/"/g;
	$string =~ s/\xe2\x80\x9d/"/g;
	$string =~ s/\xe2\x80\x9e/"/g;
	$string =~ s/\xe2\x80\x9f/"/g;
	$string =~ s/\xe2\x80\xa2/*/g; # use * for a bullet
	$string =~ s/\xef\xbb\xbf//; #remove BOM
	
	return $string;
}

sub importBenchmarkRules{
	my ($hash,$stigTitle,$sql,$releaseInfo,$version,$status,$statusDate,$description,$stigId,$profileArrayRef,$profileHashRef,$profileId,$selectArrayRef,$groupArrayRef,$groupHashRef,$groupId,$groupTitle,$ruleArrayRef,$ruleId,$ruleVersion,$ruleTitle,$ruleSeverity,$ruleWeight,$fixtextArrayRef,$fixFixRef,$fixText,$checkArrayRef,$checkId,$checkContent,$xmlContent);
	
	$xmlContent=$_[0];
	my $sqlInsertRuleOvalMap =<<END;
	INSERT INTO rule_oval_map
	(ruleId,ovalRef,benchmarkId,releaseInfo)
	VALUES
	(?,?,?,?)
END
	my $sthInsertRuleOvalMap = $dbh->prepare($sqlInsertRuleOvalMap);

	$xmlContent = utf8_to_ascii($xmlContent);
	$hash = $xml->parse( $xmlContent );

	my $benchmarkId = $hash->{'Benchmark'}[0]->{'-id'};
	return "XML file is not a STIG. Can't find title." unless ($benchmarkId);
	$releaseInfo = $hash->{'Benchmark'}[0]->{'plain-text'}[0]->{'#text'};
	print "Importing Benchmark: $benchmarkId\n";
	#Process Groups
	$groupArrayRef = $hash->{'Benchmark'}[0]->{'Group'};
	foreach $groupHashRef (@$groupArrayRef){
		$groupId = $groupHashRef->{'-id'};
		$ruleArrayRef = $groupHashRef->{'Rule'};
		foreach my $ruleHashRef (@$ruleArrayRef) {
			$ruleId = $ruleHashRef->{'-id'};
			$checkArrayRef = $ruleHashRef->{'check'};
			foreach my $checkHashRef (@$checkArrayRef){
				my $checkContentRefArrayRef = $checkHashRef->{'check-content-ref'};
				foreach my $checkContentRefHashRef (@$checkContentRefArrayRef) {
					my $checkContentRefName = $checkContentRefHashRef->{'-name'};
					if ($DEBUG) { print "$ruleId\t$checkContentRefName\t$benchmarkId\t$releaseInfo\n"; }
					$sthInsertRuleOvalMap->execute(($ruleId,$checkContentRefName,$benchmarkId,$releaseInfo));
				}
			}
		}
	}
	return 1;
}

sub insertErrorMsg {
	# Expects hash $e
	# $e = {
	#	'dbh',
	#	'db',
	#	'errTable'
	#	'jobId',
	#	'zipPath',
	#	'xccdfFn,
	#	'message'
	# }
	my $e = $_[0];
	$e->{'seq'}++;
	my $zipPath = join ("/",@{$e->{'zipPath'}});
	#print Dumper($e);
	$e->{'dbh'}->do(
		"INSERT into $e->{'jobDb'}.$e->{'errTable'} (jobId,seq,zipPath, xccdfFilename, error, errstr) VALUES (?,?,?,?,?,?)",
		undef,
		($e->{'jobId'}
		,$e->{'seq'}
		,$zipPath
		,$e->{'xccdfFn'}
		,$e->{'message'}
		,$e->{'errstr'}));
	#$dbh->commit;
	$e->{'errstr'} = '';
}