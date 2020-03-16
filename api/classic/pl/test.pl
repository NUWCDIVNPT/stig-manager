#!/usr/bin/perl
use strict;
use warnings;

 
print qq(Content-type: text/plain\n\n);

my $filename = "/var/www/html/pl/import/test.zip";
open my $fh, "<", $filename;
while(<$fh>) {
    print;
}
print "hi\n";

