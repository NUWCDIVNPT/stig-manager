#!/usr/bin/perl
# $Id: getCurrentXccdf.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use XML::Twig;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$revision = $q->param('revId');
$asset = $q->param('assetId');

$sqlGetBenchmarkId = "select r.stigId from stigs.revisions r where r.revId=?";
$sqlGetBenchmark = "select xml from stigs.rev_xml_map where revId=?";
$sqlGetAsset = "select name,profile,ip from assets where assetId=?";
$sqlGetResults =<<END;
select
	rgr.ruleId as "ruleId"
	,r.version as "version"
	,r.severity as "severity"
	,r.weight as "weight"
	,rev.stateId as "stateId"
	,to_char(rev.ts,'yyyy-mm-dd hh24:mi:ss') as "ts"
from
	assets s
	left join stigs.rev_profile_group_map rpg on s.profile=rpg.profile
	left join stigs.groups g on rpg.groupId=g.groupId
	left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
	left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
	left join stigs.rules r on rgr.ruleId=r.ruleId
	left join reviews rev on (r.ruleId=rev.ruleId and s.assetId=rev.assetId)
where
	s.assetId = ?
	and rg.revId = ?
order by
	DECODE(substr(rg.groupId,1,2),'V-',lpad(substr(rg.groupId,3),6,'0'),rg.groupId) asc
END
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "Could not connect to the database.";
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "Invalid user.";
	exit;
}

$dbh->{LongReadLen} = 100000000;


$ruleResults = $dbh->selectall_arrayref($sqlGetResults,{Slice=>{}},($asset,$revision));
($assetName,$profile,$assetIp) = $dbh->selectrow_array($sqlGetAsset,undef,($asset));
($benchmarkId) = $dbh->selectrow_array($sqlGetBenchmarkId,undef,($revision));
print $revision;
($benchmarkXml) = $dbh->selectrow_array($sqlGetBenchmark,undef,($revision));
##regex to fix strange, doubly-encoded BOMs(effed bom: c3 af c2 bb c2 bf) that have slipped into the xml blobs in the DB:
$benchmarkXml =~ s/\xc3\xaf\xc2\xbb\xc2\xbf//;
my $conv = XML::Twig::safe_encode_hex($benchmarkXml);
$t= XML::Twig->new(map_xmlns => {'http://checklists.nist.gov/xccdf/1.1' => "cdf"});
$t->parse($conv);
#$t->nparse( error_context => 1,$conv);
$benchmarkElt = $t->first_elt('cdf:Benchmark');
$description = $benchmarkElt->first_child('cdf:description');
if (!$description) {
	$benchmarkElt->insert_new_elt('first_child','cdf:description','No description has been provided by DISA');
}
#################################################################
# TestResult
#################################################################
$testResultElt = $benchmarkElt->insert_new_elt('last_child','cdf:TestResult'=>{'id'=>$benchmarkId});
$testResultElt->insert_new_elt('last_child','cdf:profile'=>{'idref'=>$profile});
$testResultElt->insert_new_elt('last_child','cdf:target',$assetName);
#################################################################
# TestResult/target-facts
#################################################################
$targetFactsElt = $testResultElt->insert_new_elt('last_child','cdf:target-facts');
$targetFactsElt->insert_new_elt('last_child','cdf:fact'=>{'name'=>'urn:scap:fact:asset:identifier:host_name','type'=>'string'},$assetName);
$targetFactsElt->insert_new_elt('last_child','cdf:fact'=>{'name'=>'urn:scap:fact:asset:identifier:ipv4','type'=>'string'},$assetIp);
#################################################################
# TestResult/rule-result
#################################################################
foreach $r (@$ruleResults) {
	if ($r->{'stateId'} == 4) {
		$resultStr = 'fail';
	} elsif ($r->{'stateId'} == 3) {
		$resultStr = 'pass';
	} elsif ($r->{'stateId'} == 2) {
		$resultStr = 'notapplicable';
	} else {
		$resultStr = 'notchecked';
	}
	$time = $r->{'ts'};
	$time =~ s/ /T/;
	$ruleResultElt = $testResultElt->insert_new_elt('last_child','cdf:rule-result' => {'version'=>$r->{'version'},'idref'=>$r->{'ruleId'},'weight'=>$r->{'weight'},'time'=>$time,'severity'=>$r->{'severity'}});
	$ruleResultElt->insert_new_elt('cdf:result',$resultStr);
}

############################
# Send the file            #
############################
$reportPrefix = "$assetName-$benchmarkId";
$timestamp = time;
($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);
$datedFile = sprintf ("${reportPrefix}_XCCDF_%04d-%02d-%02dT%02d%02d.xml",$year+1900,$mon+1,$mday,$hour,$min);
print "Content-Type: application/xml\n";
print "Content-Disposition: attachment;filename=$datedFile\n\n";
$t->set_pretty_print('indented');
print $t->sprint;

