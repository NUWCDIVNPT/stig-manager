#!/usr/bin/perl

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
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );

$db = $STIGMAN_DB;

# Setup the CGI object
$q = CGI->new;
%cgiParams = $q->Vars;

$dbh = gripDbh( "PSG-STIGMAN", undef, "oracle" );

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
	my $accountname = $ENV{'REMOTE_USER'};
	$accountname =~ s/\\/\\\\/g;
	print "{\"success\": false,\"error\": \"" . $accountname . " is not a user in the system. To establish an account, you must contact your ISSO.\"}\n";	
	
	#print "Content-Type: text/html\r\n\r\n";
	#foreach $key (sort keys %ENV) {
	#	print $key . " : " . $ENV{$key} . "<br>";
	#}
	#print Dumper(\%ENV);
	exit;
}

if ($redirectUrl = $cgiParams{'redirect'}) {
	# Create a new GUID and timestamp for this session
	$ug = new Data::UUID;
	$guid = $ug->create_str();
	$ts = time();
	$sql = "DELETE from stigman_ids where UPPER(cn)=UPPER(?)";
	$dbh->do($sql,undef,($cn));
	$sql = "INSERT into stigman_ids (GUID,CN,LASTUSE) VALUES (?,?,?)";
	$dbh->do($sql,undef,($guid,$cn,$ts));
	# print a Status header of 302 and a Location header
	delete $cgiParams{'redirect'};
	foreach $key (keys %cgiParams){
		push(@redirectParams,"$key=" . uri_escape($cgiParams{$key}));
	}
	$redirectParamsStr = join("&",@redirectParams);
	$redirectUrl .= "?" . $redirectParamsStr;
	print "Set-Cookie: stigmanId=$guid; Path=/\r\n";
	print "Status: 302 Moved\r\nLocation: $redirectUrl\r\n\r\n";

} else {
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


	# Create a new GUID and timestamp for this session
	$ug = new Data::UUID;
	$guid = $ug->create_str();
	$ts = time();
	$sql = "DELETE from stigman_ids where UPPER(cn)=UPPER(?)";
	$dbh->do($sql,undef,($cn));
	$sql = "INSERT into stigman_ids (GUID,CN,LASTUSE) VALUES (?,?,?)";
	$dbh->do($sql,undef,($guid,$cn,$ts));

	print "Set-Cookie: stigmanId=$guid; Path=/\r\n";
	# print output to be consumed by STIGMAN
	my $json = encode_json $userRef;
	print "Content-Type: text/html\r\n\r\n";
	print "$json\r\n";
}

sub getCnValue {
	my $sqlAccountTest =<<END;
	select
		id as "id"
	from
		user_data ud
	where
		UPPER(ud.cn) = UPPER(?)
END
	
	if ($ENV{'USER_AUTH_VAR'}) {
		# Some deployments supply the preferred environment variable
		$userVar = $ENV{'USER_AUTH_VAR'};
	} else {
		$userVar = "REMOTE_USER";
	}

	($id) = $dbh->selectrow_array($sqlAccountTest,undef,($ENV{$userVar}));
	if ($id) {
		return $ENV{$userVar};
	} else {
		(my $commonName) = ($ENV{'CERT_SUBJECT'} =~ /CN=(\S+)/);
		($id) = $dbh->selectrow_array($sqlAccountTest,undef,($commonName));
		if ($id) {
			return $commonName;
		} else {
			return undef;
		}
	}
}
