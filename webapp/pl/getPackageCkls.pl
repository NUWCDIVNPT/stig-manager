#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use XML::Twig;
use grip;
use Archive::Zip qw( :ERROR_CODES :CONSTANTS );
use IO::String;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

my $db = $STIGMAN_DB;
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId');
my $revId = $q->param('revId');
my $stigId = $q->param('stigId');
my $packageId = $q->param('packageId');
my $classification = getClassification();

######################################
# Common timestamp for all CKL files
######################################
my $timestamp = time;
my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);
my $commonPostfix = sprintf ("_%04d-%02d-%02d.ckl",$year+1900,$mon+1,$mday,$hour,$min);

######################################
# SQL queries
######################################
my $sqlGetBenchmarkId = "select s.stigId,s.title, r.description, r.version from stigs.stigs s left join stigs.revisions r on s.stigId=r.stigId where r.revId=?";
my $sqlGetAssets =<<END;
select
	s.assetId as "assetId",
	s.name as "name",
	s.profile as "profile",
	s.ip as "ip"
from
	stigman.assets s
	left join stigman.stig_asset_map ss on ss.assetId=s.assetId
	left join stigman.asset_package_map sp on sp.assetId=ss.assetId
where
	ss.stigId=?
	and sp.packageId=?
END
	
#$sqlGetAsset = "select name,profile,ip from $STIGMAN_DB.assets where assetId=?";
my $sqlGetCCI = "select controlnumber from stigs.rule_control_map where ruleId=? and controltype='CCI'";

my $sqlGetResults =<<END;
select
	g.groupId as "groupId",
	r.severity as "severity",
	g.title as "groupTitle",
	r.ruleId as "ruleId",
	r.title as "ruleTitle",
	r.version as "version",
	r.vulnDiscussion as "vulnDiscussion",
	r.iaControls as "iaControls",
--  The two lines below are hacks that only display a subset of the content and fix texts.
--  We should be doing some type of concatenation
	MAX(c.content) as "checkContent",
	MAX(to_char(substr(f.text,0,3999))) as "fixText",
	r.falsePositives as "falsePositives",
	r.falseNegatives as "falseNegatives",
	r.documentable as "documentable",
	r.mitigations as "mitigations",
	r.potentialImpacts as "potentialImpacts",
	r.thirdPartyTools as "thirdPartyTools",
	r.mitigationControl as "mitigationControl",
	r.responsibility as "responsibility",
	r.securityOverrideGuidance as "securityOverrideGuidance",
	NVL(rev.stateId,0) as "stateId",
	rev.stateComment as "stateComment",
	act.action as "action",
	rev.actionComment as "actionComment",
	to_char(rev.ts,'yyyy-mm-dd hh24:mi:ss') as "ts"
from
	assets s
	left join stigs.rev_profile_group_map rpg on s.profile=rpg.profile
	left join stigs.groups g on rpg.groupId=g.groupId
	left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
	left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
	left join stigs.rules r on rgr.ruleId=r.ruleId
	left join stigs.rule_check_map rc on r.ruleId=rc.ruleId
	left join stigs.checks c on rc.checkId=c.checkId
	left join stigs.rule_fix_map rf on r.ruleId=rf.ruleId
	left join stigs.fixes f on rf.fixId=f.fixId
	left join reviews rev on (r.ruleId=rev.ruleId and s.assetId=rev.assetId)
	left join actions act on act.actionId=rev.actionId
where
	s.assetId = ?
	and rg.revId = ?
group by
	g.groupId,
	r.severity,
	g.title,
	r.ruleId,
	r.title,
	r.version,
	r.vulnDiscussion,
	r.iaControls,
--	c.content,
--	to_char(substr(f.text,0,8000)),
	r.falsePositives,
	r.falseNegatives,
	r.documentable,
	r.mitigations,
	r.potentialImpacts,
	r.thirdPartyTools,
	r.mitigationControl,
	r.responsibility,
	r.securityOverrideGuidance,
	rev.stateId,
	rev.stateComment,
	act.action,
	rev.actionComment,
	rev.ts,
  rg.groupId
order by
	DECODE(substr(rg.groupId,1,2),'V-',lpad(substr(rg.groupId,3),6,'0'),rg.groupId) asc
END
my $stigDataRef = [
	{ 'Vuln_Num' => 'groupId' },
	{ 'Severity' => 'severity' },
	{ 'Group_Title' => 'groupTitle' },
	{ 'Rule_ID' => 'ruleId' },
	{ 'Rule_Ver' => 'version' },
	{ 'Rule_Title' => 'ruleTitle' },
	{ 'Vuln_Discuss' => 'vulnDiscussion' },
	{ 'IA_Controls' => 'iaControls' },
	{ 'Check_Content' => 'checkContent' },
	{ 'Fix_Text' => 'fixText' },
	{ 'False_Positives' => 'falsePositives' },
	{ 'False_Negatives' => 'falseNegatives' },
	{ 'Documentable' => 'documentable' },
	{ 'Mitigations' => 'mitigations' },
	{ 'Potential_Impact' => 'potentialImpacts' },
	{ 'Third_Party_Tools' => 'thirdPartyTools' },
	{ 'Mitigation_Control' => 'mitigationControl' },
	{ 'Responsibility' => 'responsibility' },
	{ 'Security_Override_Guidance' => 'securityOverrideGuidance' }
];
my $stateStrings = {
	'4' => 'Open',
	'3' => 'NotAFinding',
	'2' => 'Not_Applicable',
	'1' => 'Not_Reviewed',
	'0' => 'Not_Reviewed'
};	

######################################
# Core processing
######################################

my $zip = Archive::Zip->new();
my ($dbh,$userObj);
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
my $assetAryRef = $dbh->selectall_arrayref($sqlGetAssets,{Slice=>{}},($stigId,$packageId));

my $t;
my $benchmarkId;
foreach my $asset (@$assetAryRef) {
	my $assetName = $asset->{'name'};
	my $profile = $asset->{'profile'};
	my $assetIp = $asset->{'ip'};
	
	my $ruleResults = $dbh->selectall_arrayref($sqlGetResults,{Slice=>{}},($asset->{'assetId'},$revId));
	my ($stigTitle,$description,$version);	
	($benchmarkId,$stigTitle,$description,$version) = $dbh->selectrow_array($sqlGetBenchmarkId,undef,($revId));
	my $baseCkl =<<END;
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<CHECKLIST>
</CHECKLIST>
END
	$t= XML::Twig->new();
	$t->parse($baseCkl);
	my $checklistElt = $t->first_elt('CHECKLIST');

	#################################################################
	# ASSET
	#################################################################
	my ($assetMac,$assetGuid,$targetArea,$targetKey);
	my $assetElt = $checklistElt->insert_new_elt('last_child','ASSET');
	$assetElt->insert_new_elt('last_child','ASSET_TYPE','Computing');
	$assetElt->insert_new_elt('last_child','HOST_NAME',$assetName);
	$assetElt->insert_new_elt('last_child','HOST_IP',$assetIp);
	$assetElt->insert_new_elt('last_child','HOST_MAC',$assetMac);
	$assetElt->insert_new_elt('last_child','HOST_GUID',$assetGuid);
	$assetElt->insert_new_elt('last_child','HOST_FQDN',$assetGuid);
	$assetElt->insert_new_elt('last_child','TECH_AREA',$targetArea);
	$assetElt->insert_new_elt('last_child','TARGET_KEY',$targetKey);

	#################################################################
	# STIG_INFO
	#################################################################
	# $stigInfoElt = $checklistElt->insert_new_elt('last_child','STIG_INFO');
	# $stigInfoElt->insert_new_elt('last_child','STIG_TITLE',$stigTitle);
	my $stigsElt = $checklistElt->insert_new_elt('last_child','STIGS');
	my $iStigsElt = $stigsElt->insert_new_elt('last_child','iSTIG');
	my $stigInfoElt = $iStigsElt->insert_new_elt('last_child','STIG_INFO');

	#will need to foreach through a stigInfo hash ref similar to one used for vulns to build this section for ckl V2


	my $iStigDataRef = [
		{ 'version' => $version },
		{ 'classification' => 'classification' },
		{ 'customname' => 'customname' },
		{ 'stigid' => $benchmarkId },
		{ 'description' => $description },
		{ 'filename' => 'filename' },
		{ 'releaseinfo' => 'releaseinfo' },
		{ 'title' => $stigTitle },
		{ 'uuid' => '391aad33-3cc3-4d9a-b5f7-0d7538b7b5a2' },
		{ 'notice' => 'notice' },
		{ 'source' => 'source' },
	];	
		
	foreach my $iStigData (@$iStigDataRef) {
		my ($iStigDataAttribute) = keys %$iStigData;
		my ($resultKey) = values %$iStigData;
		
		my $siDataElt = $stigInfoElt->insert_new_elt('last_child','SI_DATA');
		my $sidDataElt = $siDataElt->insert_new_elt('last_child','SID_NAME',$iStigDataAttribute);
		$sidDataElt = $siDataElt->insert_new_elt('last_child','SID_DATA',$resultKey);


	}
	#################################################################
	# VULN
	#################################################################
	foreach my $r (@$ruleResults) {
		# $vulnElt = $checklistElt->insert_new_elt('last_child','VULN');
		my $vulnElt = $iStigsElt->insert_new_elt('last_child','VULN');
		my $stigDataElt;
		foreach my $stigData (@$stigDataRef) {
			my ($vulnAttribute) = keys %$stigData;
			my ($resultKey) = values %$stigData;
			my $attributeData = $r->{$resultKey};
			$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');
			$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE',$vulnAttribute);
			$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA',$attributeData);
		}
		my $cciResults = $dbh->selectall_arrayref($sqlGetCCI,{Slice=>{}},($r->{"ruleId"}));	
		if (scalar @$cciResults > 0){
			foreach my $cci (@$cciResults){
			$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
			$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','CCI_REF');
			$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA',$cci->{'CONTROLNUMBER'});	
			}
		}
		else{
			$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
			$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','CCI_REF');
			$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA',undef);		
		}
		$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
		$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','Check_Content_Ref');
		$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA');
		$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
		$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','Class');
		$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA','FOUO');
		$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
		$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','STIGRef');
		$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA',$stigTitle);
		$stigDataElt = $vulnElt->insert_new_elt('last_child','STIG_DATA');	
		$stigDataElt->insert_new_elt('last_child','VULN_ATTRIBUTE','TargetKey');
		$stigDataElt->insert_new_elt('last_child','ATTRIBUTE_DATA');
		my $stateString = $stateStrings->{$r->{'stateId'}};
		my $statusElt = $vulnElt->insert_new_elt('last_child','STATUS',$stateString);
		$vulnElt->insert_new_elt('last_child','FINDING_DETAILS',$r->{'stateComment'});
		if ($r->{'stateId'} == 4) { # Open finding
			$vulnElt->insert_new_elt('last_child','COMMENTS',$r->{'action'} . ": " . $r->{'actionComment'});
		} else {
			$vulnElt->insert_new_elt('last_child','COMMENTS',undef);
		}		
		$vulnElt->insert_new_elt('last_child','SEVERITY_OVERRIDE');
		$vulnElt->insert_new_elt('last_child','SEVERITY_JUSTIFICATION');
	}

	############################
	# Include the file            #
	############################
	my $reportPrefix = $classification . "_" . $assetName . "_" . $benchmarkId;
	my $filename = $reportPrefix . $commonPostfix;
	$t->set_pretty_print('indented');
	my $member = $zip->addString( $t->sprint, $filename);
	$member->desiredCompressionMethod( COMPRESSION_DEFLATED );
	$member->desiredCompressionLevel( 6 );
}

############################
# Send the file            #
############################
print "Content-Type: application/octet\n";
print "Content-Disposition: attachment;filename=${benchmarkId}_CKL.zip\n\n";
my $string;
my $io = IO::String->new( $string );
$zip->writeToFileHandle( $io);
#close($io);

print $string;


