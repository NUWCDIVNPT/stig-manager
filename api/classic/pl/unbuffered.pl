#!/usr/bin/perl

local $| = 1; # unbuffered print output
print "Content-type: text/html; charset=utf-8\n\n";
print "<br>" x 128; # For IE

$x = 0;
do {
    print "hello ";
    sleep(1);
    $x++
} while ($x < 10);
