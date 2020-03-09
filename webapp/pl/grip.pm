#!/usr/bin/perl
#=========================================================
#GRIP.PM
#	GRIP provides database connections to Oracle databases
#	or another database type by way of an ODBC connection.
#	Oracle connections can be made via a traditional 
# 	username/password approach or by way of Proxying.
#
#=========================================================
package grip;
use strict;
use Exporter;
use DBI;
# use MIME::Base64;
use Log::Log4perl qw(:nowarn);
use DBIx::Log4perl qw(:masks);
# use File::Basename;
# use JSON::XS;
use Data::Dumper;

use vars qw($VERSION @ISA @EXPORT @EXPORT_OK %EXPORT_TAGS);

$VERSION	= 1.00;
@ISA		= qw(Exporter);
@EXPORT		= qw(gripDbh gripFunc $GripErrStr oracleConnect);
@EXPORT_OK	= qw(gripDbh gripFunc $GripErrStr oracleConnect);
%EXPORT_TAGS= ( DEFAULT => [qw(&gripDbh &gripFunc)],
				Both	=> [qw(&gripDbh &gripFunc)]);
our $GripErrStr = "";

sub gripDbh { 
	my $log = Log::Log4perl->get_logger("Grip");
	$log->info('ENV=' . Dumper(\%ENV));
	$log->info('gripDbh called with arguments = (' . join(", ",@_) . ')');

    my $host = $ENV{"SM_ORACLE_HOST"} ? $ENV{"SM_ORACLE_HOST"} : "192.168.1.155";;
    my $port = $ENV{"SM_ORACLE_PORT"} ? $ENV{"SM_ORACLE_PORT"} : "1521";
    my $db = $ENV{"SM_ORACLE_SID"} ? $ENV{"SM_ORACLE_SID"} : "orclpdb1.localdomain" ;
	my $connStr = "DBI:Oracle:$host:$port/$db";
	$log->info("Will make connection: connStr = $connStr");
    # my $dbh = DBI->connect($connStr,"stigman","stigman");
	my $dbh = DBIx::Log4perl->connect($connStr,"stigman","stigman");
    if ($dbh) {
		return $dbh;
	} else {
		return undef;
	}
}

sub gripFunc {
	my %keychain = ();
	my ($service,$db,$func)=@_;
	my $keyFile = '/opt/grip/grip.nfo';
	
	open(KEYS,$keyFile) or die "Can't open file\n";
	while (<KEYS>) {
		chop;
		my($a,$b,$c,$d,$e,$f)=split("\t");
		$keychain{$a}{'user'} = $b;
		$keychain{$a}{'pass'} = $c;
		$keychain{$a}{'host'} = $d;
		if ($db){
			$keychain{$a}{'db'} = $db;
		}else{
			print "Failed. You need to provide a database to perform the function on!";
			return;
		}
	}
	my $user = $keychain{$service}{'user'};
	my $pass = md5reverse($keychain{$service}{'pass'});
	my $host = $keychain{$service}{'host'};

	my $drh = DBI->install_driver("mysql");
	my $rv = $drh->func($func,$db,$host,$user,$pass,'admin');
	
	return $rv;
}

sub md5reverse {
	my $SS64 = shift;
	my @uuEncode = split(undef,$SS64);
	my $hexCheck = \@uuEncode;
	my $asciiConvert = ifHex($hexCheck);
	my $crypto = join(undef,@$asciiConvert);
	return decode_base64($crypto);
}

sub ifHex {
	my $hex = shift;
	my @charMap = reverse(@$hex);
	return \@charMap;
}

1;

	
	
			

		
