#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );  
use XML::Twig;
use Data::Dumper;
use File::Temp qw/ tempfile tempdir /;
use File::Basename;
use Archive::Zip qw( :ERROR_CODES );
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

############################################
# IMPORTANT: SET FOR YOUR ENVIRONMENT
############################################
#my $sourceScanDir = 'C:\Users\carl.smigielski\Documents\PSG\items\0184-logging\vars\scans.new';
my $sourceScanDir = 'I:\wwwisms\wwwVARS\SCANS.NEW';
my $pkgDirs = "../pkgScans";

# Global error table, maps error numbers to error strings
my $errors = {
	'101' => "No authentication token",
	'102' => "Missing parameter",
	'106' => "Failed to connect to database",
	'107' => "Unauthorized",
};

Archive::Zip::setErrorHandler(\&zipErrorHandler);

##############################################
# Database connection
##############################################
my $dbh;
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	fatalError(106);
};

##############################################
# Process CGI parameters
##############################################
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId') or fatalError(101);
my $pkgId = $q->param('packageId') or fatalError(102);

##############################################
# User authorization
##############################################
my $userObj;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	fatalError(107);
}
if ($userObj->{'role'} ne 'Staff') {
	fatalError(107);
}

############################################
# Initialize the streaming output
############################################
$| = 1;
print "Content-Type: text/html\n\n";
print "<br>" x 64; # For IE

##############################################
# Setup the package scan directory and file
##############################################
my $pkgDir;
eval {
	$pkgDir = tempdir(DIR => $pkgDirs, CLEANUP => 1);
};
if ($@) {
	$@ =~ s/\n//g; 
	updateStatusText( "Failed to create temporary directory in $pkgDirs : $@");
	exit;
}

#updateStatusText( "Temporary directory is: " . $pkgDir);

my $fhPkgScan;
if (!open($fhPkgScan,">",$pkgDir . "/PackageScan.nessus")){
	updateStatusText( "Failed to create PackageScan.nessus");
	exit;
}

##############################################
# Initialize the Package scan
##############################################
updateProgress(0,"Beginning the package scan file");
updateStatusText( "Beginning the package scan file");
print $fhPkgScan <<E;
<?xml version="1.0"?>
<NessusClientData_v2>
<Policy>
	<policyName>IAVM Policy</policyName>
	<Preferences>
		<ServerPreferences>
			<preference>
				<name>TARGET</name>
E

##############################################
# Setup the database and make the query
# $ipsByScan = {
#	SCANRESULTID => [array of ips]
#	...
# }
##############################################
my $sql =<<E;
select
  apm.SCANRESULTID
  ,a.ip
from
  ASSET_PACKAGE_MAP apm
  left join ASSETS a on a.ASSETID=apm.ASSETID
where
  apm.PACKAGEID = ?
  and apm.scanresultid is not null
  and a.ip is not null
order by
  a.ip
E

my $ipsByScan = {};
my @targetIps = ();
my $ar = $dbh->selectall_arrayref($sql,{Slice=>{}},($pkgId));
foreach $a (@$ar){
	push (@{$ipsByScan->{$a->{'SCANRESULTID'}}},$a->{'IP'});
	push (@targetIps,$a->{'IP'});
}
my $totalIPs = scalar @targetIps;

##############################################
# Insert target IPs into the Package scan,
# close the <Policy> tag and start the
# <Report> tag 
##############################################
print $fhPkgScan "\t\t\t\t<value>" . join(',',@targetIps) . "</value>\n";
print $fhPkgScan <<E;
			</preference>
		</ServerPreferences>
	</Preferences>
</Policy>
<Report name="Package Scan" xmlns:cm="http://www.nessus.org/cm">
E
##############################################
# Iterate through the SCANRESULTIDs
##############################################
my $processedIPs = 0;
my $environ = {
	'processedIPs' => $processedIPs,
	'totalIPs' => $totalIPs
};
foreach my $scanResultId (sort keys %$ipsByScan) {
	updateStatusText(""); # \n
	updateStatusText("Processing Source Scan ID $scanResultId");
	my $fhSourceMod;
	my $fnSourceMod = $pkgDir . "/" . $scanResultId . ".rmf.nessus";
	my $fnSourceZip = $sourceScanDir . "/" . $scanResultId . ".zip";
	my $fnSourceScan = $pkgDir . "/" . $scanResultId . ".nessus";
	
	my $zip = Archive::Zip->new();
	if ( $zip->read($fnSourceZip) != AZ_OK ) {
		updateStatusText( "Archive::Zip couldn't read $fnSourceZip");
		exit;
	}
	my $memberName = $scanResultId . ".nessus";
	if ($zip->extractMember($memberName,$fnSourceScan) != AZ_OK) {
		updateStatusText( "Archive::Zip couldn't extract to $fnSourceScan");
		exit;
	}
	if (!open($fhSourceMod,">",$fnSourceMod)) {
		updateStatusText( "Failed to create $fnSourceMod");
		exit;
	}

	$environ->{'fhSourceMod'} = $fhSourceMod;
	$environ->{'fhPkgScan'} = $fhPkgScan;
	$environ->{'ipList'} = $ipsByScan->{$scanResultId};
	
	#updateStatusText( Dumper ($environ->{'ipList'}));
	my $tree = parseNessusXml($fnSourceScan,$environ);
	close($fhSourceMod);
	unlink($fnSourceScan);
	#$tree->flush($fhSourceMod);
}
##############################################
# Finalize the package scan file
##############################################
print $fhPkgScan <<E;
</Report>
</NessusClientData_v2>
E
close($fhPkgScan);
updateProgress(0,"Finalized the package scan file");
updateStatusText( '\nFinalized the package scan file\n',1);

##############################################
# ZIP the package scan directory
##############################################
updateProgress(0,"Creating ZIP archive for download");
updateStatusText( "Creating ZIP archive for download");
my $fhPkgZip;
my $fnPkgZip;
eval {
	($fhPkgZip,$fnPkgZip) = tempfile(DIR => $pkgDirs);
	my $dirZip = Archive::Zip->new();
	$dirZip->addTree($pkgDir);
	$dirZip->writeToFileHandle($fhPkgZip);
};
if ($@) {
	updateStatusText( "Failed to create ZIP archive");
	exit;
}
updateProgress(1,"Ready for download");
updateStatusText( "Initiating download in browser...");
my $basename = basename($fnPkgZip); 
print "<script>parent.window.location='downloadPkgScan.pl?packageId=$pkgId&bn=$basename'</script>";
updateStatusText( "Done.");


exit;

##############################################
# SUBROUTINES
##############################################
sub parseNessusXml {
	my ($nessusFile,$environ) = @_;
	$| = 1;

	# Create an XML::Twig object and associate our handlers

	my $nessusTwig = new XML::Twig (
		twig_handlers => {
			'/NessusClientData_v2/Report/ReportHost' => sub { handleReportHost(@_,$environ); }
			,
			'/NessusClientData_v2/Policy' => sub { handlePolicy(@_,$environ); }
		}
		,pretty_print => 'record'
	);
	
	# Parse the file. Our handlers will be called during parsing.
	
	my $nessusTree = $nessusTwig->safe_parsefile($nessusFile);
	if ($@) {
		$@ =~ s/\n//g;
		updateStatusText("safe_parsefile() got error - $@");
		return undef;
	} else {
		return $nessusTwig;
	}
	
}

sub handlePolicy {
	# NOTE:
	# die() here will not kill the script if we are called by safe_parsefile()
	
	my ($sourceTwig,$policy,$environ) = @_;
	
	#Set the TARGET values to our ipList
	my $elTargetValue = $policy->get_xpath('Preferences/ServerPreferences/preference/name[string()="TARGET"]/../value/',0);
	if ($elTargetValue) {
		$elTargetValue->set_text(join(',',@{$environ->{'ipList'}}));
	}
	
	#Leave everything else as we found it
	updateStatusText("Writing Policy element");
	$sourceTwig->flush($environ->{'fhSourceMod'});
}

sub handleReportHost {
	# NOTE:
	# die() here will not kill the script if we are called by safe_parsefile()

	my ($sourceTwig,$reportHost,$environ) = @_;
	my $name = $reportHost->att('name');

	if (grep {$name eq $_} @{$environ->{'ipList'}} ) {
		updateStatusText(""); # \n
		updateStatusText( "+ Including $name");
		$sourceTwig->flush($environ->{'fhSourceMod'});
		print {$environ->{'fhPkgScan'}} $reportHost->sprint();

		$environ->{'processedIPs'}++;
		my $progress = sprintf("%0.2f",( $environ->{'processedIPs'}/$environ->{'totalIPs'}));
		updateProgress($progress,"Included $name ($environ->{'processedIPs'} of $environ->{'totalIPs'})");
	} else {
		updateStatusText( ".",1);
		$reportHost->delete();
	}
}

##
## fatalError()
##
## Arguments:
##		$errNum: int  The error number from the global %errors
##
## Returns: undef
##
## Prints a Content-Type header and a JSON encoded error object, 
## then exits the script
##
sub fatalError {
	my ($errNum) = @_;
	print "Content-Type: application/json\n\n";
	print encode_json({
		'success' => \0,
		'error' => $errNum,
		'errorStr' => $errors->{$errNum}
	});
	exit;
}

sub zipErrorHandler {
	my $msg = $_[0];
	$msg =~ s/\n//g;
	updateStatusText($msg);
}
