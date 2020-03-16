#!/usr/bin/perl

#use strict;
#use warnings;
use JSON::XS;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );  
use Log::Log4perl qw(:easy);
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );

my $log = Log::Log4perl->get_logger("Upload");

my $uploadDir = "/tmp/";
my $init = 0;
$| = 1;
(my $stigmanId) = ($ENV{'HTTP_COOKIE'} =~ /stigmanId=(.*)(\s+|$)/);
my $uploadedFile = $uploadDir . "upload.$stigmanId";
$log->info("uploadedFile: $uploadedFile");

$q = CGI->new(\&hook);
$stigmanId = $q->cookie('stigmanId');


sub hook {
    my ($filespec, $buffer, $bytes_read, $data) = @_;
	if (!$init) {
		open(UF,">$uploadedFile") or die "Error on open $uploadedFile";
		binmode UF;
		print UF $buffer;
		close UF;
		$init = 1;
	} else {
		open(UF,">>$uploadedFile");
		binmode UF;
		print UF $buffer;
		close UF;
	}
}
print "Content-Type: text/html\n\n";

