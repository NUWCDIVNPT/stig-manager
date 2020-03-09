#!/usr/bin/perl

use strict;
use warnings 'all';
use Apache2::RequestUtil ();

my $r = shift();
$r->status(401);
return 401;