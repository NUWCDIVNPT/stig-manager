#!/usr/bin/perl
#$Id: submitChecks.pl 807 2017-07-27 13:04:19Z csmig $

# Parameters:
# None
# Output:

use JSON::XS;
use CGI;
use CGI::Carp qw ( fatalsToBrowser );  
use Data::Dumper;
use DBI;
use grip;
use Time::Local;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
use Log::Log4perl qw(:easy);
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>test.log" } );


$q = CGI->new;
$desc = $q->param('desc');
my $stigmanId = $q->cookie('stigmanId');
$assetId = $q->param('assetId');
$stigId = $q->param('stigId');
$revId = $q->param('revId');
$allOrSome = $q->param('checks');
$ruleArray  = decode_json $q->param('ruleArray');

# $stigTitle = $q->param('stigName');


$responseHashRef = {};
$responseHashRef->{'success'} = 'true';

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Invalid user.\"}\n";	
	exit;
}
$userId = $userObj->{'id'};
$cn = $userObj->{'cn'};
$name = $userObj->{'name'};
$userRole =  $userObj->{'role'};
$userCanAdmin =  $userObj->{'canAdmin'};

#####################################
# START: SQL statements
#####################################
$sqlSubmitAllCompletedChecks =<<END;
update stigman.reviews r set statusId = 1, userId = ? 
where r.assetId = ? and statusId = 0
and
(
((stateId = 2 or stateId = 3) and stateComment is not null)
or (stateId = 4 and stateComment is not null and actionId is not null and actionComment is not null)
) 
and r.ruleId in 
(select rgrm.ruleId from stigs.rev_group_rule_map rgrm
left join stigs.rev_group_map rgm on rgm.rgId=rgrm.rgId 
where rgm.revId = ?)
END

$sthAll = $dbh->prepare($sqlSubmitAllCompletedChecks);

$ruleParamStr = join ',' => ('?') x @$ruleArray; # create string with the correct number of '?'s
$sqlSubmitListOfCompletedChecks =<<END;
update stigman.reviews r set statusId = 1, userId = ? 
where r.assetId = ? and statusId = 0
and
(
((stateId = 2 or stateId = 3) and stateComment is not null)
or (stateId = 4 and stateComment is not null and actionId is not null and actionComment is not null)
) 
and r.ruleId in ($ruleParamStr)
END

$sthList = $dbh->prepare($sqlSubmitListOfCompletedChecks);


# $ruleParamStr = join ',' => ('?') x @$ruleArray; # create string with the correct number of '?'s
# $sql = "DELETE from stig_asset_map where assetId=? and stigId NOT IN ($ruleParamStr)";
# $dbh->do($sql,undef,($assetId,@stigIds));
# $sthLog->execute(($userId,"DELETE from stig_asset_map where assetId=$assetId and stigId NOT IN(@stigIds)"));
#####################################
# END: SQL statements
#####################################


if ($allOrSome eq "all"){
	$rv = $sthAll->execute(($userId,$assetId,$revId));
}
else {
	# $ruleString = join(",",@$ruleArray);
	# $ruleString = "'SV-30991r2_rule','SV-30994r2_rule'";
	$rv = $sthList->execute(($userId,$assetId,@$ruleArray));
}



updateStatsAssetStig($assetId,$stigId,$dbh);
report("Checks Submitted.","Checks have been submitted.");


my $json = encode_json $responseHashRef;
print "Content-Type: text/html\n\n";
print $json;


sub report{
	$responseHashRef->{'status'} = $_[0];
	$responseHashRef->{'message'}= $_[1];
	
}

sub printLog {
	my $text = $_[0];
	my $timestamp = localtime();
	print LOG $timestamp . " " . $text . "\n";
	# print $timestamp . " " . $text . "\n";
}

