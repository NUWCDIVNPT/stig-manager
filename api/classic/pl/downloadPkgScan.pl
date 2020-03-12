#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );  
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

my $pkgDirs = "../pkgScans";

# Global error table, maps error numbers to error strings
my $errors = {
	'101' => "No authentication token",
	'102' => "Missing parameter",
	'106' => "Failed to connect to database",
	'107' => "Unauthorized",
	'110' => "Can't open file"
};

##############################################
# Database connection
##############################################
my $dbh;
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	fatalError(106);
} 

##############################################
# Process CGI parameters
##############################################
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId') or fatalError(101);
# Are all parameters present?
my $pkgId = $q->param('packageId') or fatalError(102);
my $bn = $q->param('bn') or fatalError(102);;

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
# Output the ZIP file
############################################
my $fnDownload = $pkgDirs . "/$bn";
my $timestamp = time;
my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);
open(my $FH,"<",$fnDownload) or fatalError(110);
binmode($FH);
my $datedFile = sprintf ("PackageScans_%04d_%04d-%02d-%02dT%02d%02d.zip",$pkgId,$year+1900,$mon+1,$mday,$hour,$min);
print "Content-Type: application/zip\n";
print "Content-Disposition: attachment;filename=$datedFile\n\n";
while (<$FH>) {
	print;
}
close($FH);
unlink($fnDownload);

##############################################
# SUBROUTINES
##############################################

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
