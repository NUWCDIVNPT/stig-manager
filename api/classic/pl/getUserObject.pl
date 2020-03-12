#!/usr/bin/perl
# $Id: getUserObject.pl 807 2017-07-27 13:04:19Z csmig $

# This code is called without a 'redirect' argument by stigman.js to 
# retreive a userObject and to pass a new GUID as a cookie value.
# In that case, it returns a JSON reply
#
# It is also called with a 'redirect' argument by other perl scripts when the
# stigmanId GUID presented to those scripts is not found or has expired.
# In that case, it returns an HTTP 302 message that causes the original perl script to
# be called again, and passes the new GUID as a cookie value


use DBI;
use Data::UUID;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use URI::Escape;
use Log::Log4perl qw(:easy);
use Crypt::JWT qw(decode_jwt);
use Mojo::UserAgent;
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );

$db = $STIGMAN_DB;

# Setup the CGI object
$q = CGI->new;
%cgiParams = $q->Vars;

$dbh = gripDbh( "PSG-STIGMAN", undef, "oracle" );
#$host = "192.168.1.155";
#$db = "orclpdb1.localdomain";
#$dbh = DBI->connect("DBI:Oracle:$host:1521/$db","stigman","stigman");
if ( !$dbh ) 
{
	print "Content-Type: application/json\n\n";
	print "{\"success\": false,\"error\": \"" . "The System is currently unavailable. Please try again in a few minutes, and if the condition continues please submit a Helpdesk ticket." . "\"}\n";	
	#print "Could not connect to the database.";
	exit;
} 
$cn = getCnValue();
if (!$cn) 
{
	print "Content-Type: application/json\n\n";
	print "{\"success\": false,\"error\": Token error\"}\n";	
	exit;
}


# Look up the CN in the STIGMAN user table
$sql=<<END;
SELECT
	ud.id as "id",
	ud.cn as "cn",
	ud.name as "name",
	ud.dept as "dept",
	r.role as "role",
	ud.canAdmin as "canAdmin"
from 
	user_data ud
	left join roles r on r.id=ud.roleId
where UPPER(cn)=UPPER(?)
END
$userRef = $dbh->selectrow_hashref($sql,undef,($cn));
if (!$userRef) 
{
	print "Content-Type: application/json\n\n";
	print "{\"success\": false,\"error\": \"$cn<br>is not a STIG Manager user.\"}\n";	
	exit;
}

$userRef->{'roles'} = [$userRef->{'role'}]; # backwards compatability
if ($userRef->{'canAdmin'} == 1) {
	$userRef->{'canAdmin'} = \1;
} else {
	$userRef->{'canAdmin'} = \0;
}
$userRef->{'REMOTE_ADDR'} = $ENV{'REMOTE_ADDR'};
foreach $key (sort keys %ENV) {
	$userRef->{'ENV'} .= $key . " : " . $ENV{$key} . "<br>";
}
$userRef->{'whoami'} = `whoami`;


# print output to be consumed by VARS
my $json = encode_json $userRef;
print "Content-Type: text/html\r\n\r\n";
print "$json\r\n";


sub getCnValue {
	my $username;
	my $log = Log::Log4perl->get_logger("Grip");
	$log->info('In getCnValue');

	my $ua = Mojo::UserAgent->new;
	my $authority = $ENV{'STIGMAN_API_AUTHORITY'};
	my $resp = $ua->get("$authority/protocol/openid-connect/certs")->result->json;
	$log->info('Got response: ' . Dumper($resp));

	my $bearer = $q->http('Authorization');
	if (!$bearer) {
		$log->info("Authorization header not found");
		$username = 'nobody'
	} else {
		$log->info("Authorization header value: $bearer");
		$bearer =~ s/Bearer //;
		$log->info("Bearer value: $bearer");

		my $payload = decode_jwt(token => $bearer, kid_keys =>$resp, decode_payload=>1, verify_exp=>0);
		$log->info("Token dump: " . Dumper($payload));
		$username = $payload->{'preferred_username'} ;
		$log->info("Username: " . $username);
	}
	return $username;
}
