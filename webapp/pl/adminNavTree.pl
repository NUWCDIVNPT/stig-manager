#!/usr/bin/perl

use DBI;
use grip;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {

	$treeArrayRef = [];

	# Build network nodes with child reports
	$adminArray = [];
	push(@$treeArrayRef,{
		'id'=>'global-admin',
		'text'=>'Administration areas',
		'icon' => 'img/Settings-icon-16.png',
		'expanded' => \1,
		'children'=>$adminArray});
		
	$usersHash = {};
	$usersHash->{'id'} = 'user-admin';
	$usersHash->{'text'} = 'Users';
	$usersHash->{'leaf'} = 'true';
	$usersHash->{'iconCls'} = 'sm-users-icon';
	push(@$adminArray,$usersHash);

	$assetsHash = {};
	$assetsHash->{'id'} = 'asset-admin';
	$assetsHash->{'text'} = 'Assets';
	$assetsHash->{'leaf'} = 'true';
	$assetsHash->{'iconCls'} = 'sm-asset-icon';
	push(@$adminArray,$assetsHash);

	$assetsHash = {};
	$assetsHash->{'id'} = 'artifact-admin';
	$assetsHash->{'text'} = 'Artifacts';
	$assetsHash->{'leaf'} = 'true';
	$assetsHash->{'iconCls'} = 'sm-artifact-icon';
	push(@$adminArray,$assetsHash);

	$stigsHash = {};
	$stigsHash->{'id'} = 'stig-admin';
	$stigsHash->{'text'} = 'STIG checklists';
	$stigsHash->{'leaf'} = 'true';
	$stigsHash->{'iconCls'} = 'sm-stig-icon';
	push(@$adminArray,$stigsHash);

	if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
		$packagesHash = {};
		$packagesHash->{'id'} = 'package-admin';
		$packagesHash->{'text'} = 'C&A packages';
		$packagesHash->{'leaf'} = 'true';
		$packagesHash->{'iconCls'} = 'sm-package-icon';
		push(@$adminArray,$packagesHash);
	}


	my $json = encode_json $treeArrayRef;
	print "Content-Type: text/html\n\n";
	print "$json\n";
}