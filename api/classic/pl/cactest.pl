#!/usr/bin/perl
print "Content-type: text/html\n\n";

if ($ENV{'CERT_FLAGS'} eq "1") {
	print "<h1>This request used a Client certificate</h1>";
	print "<h3>The IIS variables below are only present when a request uses Client certificate authentication.</h3>";
	print "CERT_FLAGS: $ENV{'CERT_FLAGS'}<br>\n";
	print "CERT_SERIALNUMBER: $ENV{'CERT_SERIALNUMBER'}<br>\n";
	print "CERT_SUBJECT: $ENV{'CERT_SUBJECT'}<br>\n";
	print "CERT_ISSUER: $ENV{'CERT_ISSUER'}<br>\n";
} else {
	print "<h1>This request did not use a Client certificate</h1>";
}
