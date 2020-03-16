#!/usr/bin/perl
# $Id: getCurrentExcel.pl 807 2017-07-27 13:04:19Z csmig $

use Spreadsheet::WriteExcel;
use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Time::Local;
use Data::UUID;
use grip;
use File::Temp qw/ tempfile tempdir /;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$stigId = $q->param('stigId');
$revId = $q->param('revId');
$assetId = $q->param('assetId');

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

$sqlRevInfo =<<END;
select s.title,r.version,r.release,r.benchmarkDate,s.stigId from stigs.revisions r
left join stigs.stigs s on r.stigId=s.stigId
where revId=?
END
@revInfo = $dbh->selectrow_array($sqlRevInfo, undef, ($revId));
$bench = $revInfo[0];
$version = $revInfo[1];
$release = $revInfo[2] . " (" . $revInfo[3] . ")";
$benchmarkId = $revInfo[4];

$sqlAssetInfo =<<END;
select s.name,s.profile,s.ip from assets s
where assetId=?
END
@assetInfo = $dbh->selectrow_array($sqlAssetInfo, undef, ($assetId));

$sqlCheckInfo =<<END;
select
  r.weight as "weight"
  ,rg.groupId as "groupId"
  ,r.version as "stigId"
  ,rgr.ruleId as "ruleId"
  ,g.title as "gTitle"
  ,r.title as "rTitle"
  ,r.vulnDiscussion as "discussion"
--  ,LISTAGG(substr(fix.text,0,3999), ' AND ') WITHIN GROUP (ORDER BY fix.fixId) as "fixtext"
  ,MAX(to_char(substr(fix.text,0,3999)))
  ,sc.cat as "cat"
  ,r.iaControls as "iaControls"
  ,st.abbr as "state"
  ,rev.stateComment as "stateComment"
  ,a.action as "action"
  ,rev.actionComment as "actionComment"
  ,r.documentable as "documentable"
  ,r.responsibility as "responsible"
from
  assets s
  left join stigs.rev_profile_group_map rpg on s.profile=rpg.profile
  left join stigs.groups g on rpg.groupId=g.groupId
  left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
  left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
  left join stigs.rules r on rgr.ruleId=r.ruleId
  left join stigs.severity_cat_map sc on r.severity=sc.severity
  left join stigs.rule_fix_map rfm on r.ruleId=rfm.ruleId
  left join stigs.fixes fix on rfm.fixId=fix.fixId
  left join stigman.reviews rev on (r.ruleId=rev.ruleId and s.assetId=rev.assetId)
  left join stigman.states st on rev.stateId=st.stateId
  left join stigman.actions a on a.actionId=rev.actionId
where
  s.assetId = ?
  and rg.revId = ?
group by
  r.weight
  ,rg.groupId
  ,r.version
  ,rgr.ruleId
  ,g.title
  ,r.title
  ,r.vulnDiscussion
  --,to_char(substr(fix.text,0,3999))
  ,sc.cat
  ,r.iaControls
  ,st.abbr
  ,rev.stateComment
  ,a.action
  ,rev.actionComment
  ,r.documentable
  ,r.responsibility
order by
	DECODE(substr(rg.groupId,1,2),'V-',lpad(substr(rg.groupId,3),6,'0'),rg.groupId) asc
END
$checkInfo = $dbh->selectall_arrayref($sqlCheckInfo, { Slice => {} }, ($assetId,$revId));

############################
# Create workbook
############################
# $ug = new Data::UUID;
# $uuid = $ug->create();
# $uuidStr = $ug->to_string($uuid);
# $xls = "/tmp/${uuidStr}.xls";
# #$xls = "checklistTest.xls";
$xlsFH = File::Temp->new();
$xls = $xlsFH->filename;
$workbook = Spreadsheet::WriteExcel->new("$xls");

############################
# Formats
############################
$workbook->set_custom_color('31', '219', '229', '241');
$mFormat = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
);
									
$mFormat->set_text_wrap('1');
$mFormat->set_bg_color('31');
$mFormat->set_bold('1');

$m1Format = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
);
									
$m1Format->set_text_wrap('1');
$m1Format->set_bg_color('31');
$m1Format->set_bold('1');

$m2Format = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
);

$cFormat = $workbook->add_format(
	valign => 'top',
	align => 'left',
	border => 1,
);
$cFormat->set_text_wrap('1');

$bFormat = $workbook->add_format(
	valign => 'vcenter',
	align => 'left',
	border => 1,
);
									
$bFormat->set_bold('1');
									
$b1Format = $workbook->add_format(
	valign => 'vcenter',
	align => 'left',
	border => 1,
);
									
$b1Format->set_bold('1');

$profileYesFormat = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
);
$profileYesFormat->set_bg_color('57');
$profileNoFormat = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
);
$profileNoFormat->set_bg_color('16');

############################
# Worksheet: Checklist
############################
$worksheet = $workbook->add_worksheet('Checklist');
$worksheet->set_column('A:A',  8); 
$worksheet->set_column('B:B',  9); 
$worksheet->set_column('C:C',  13); 
$worksheet->set_column('D:D',  7); 
$worksheet->set_column('E:E',  15); 
$worksheet->set_column('F:F',  44); 
$worksheet->set_column('G:G',  6); 
$worksheet->set_column('H:H',  8); 
$worksheet->set_column('I:I',  6);
$worksheet->set_column('J:J',  35);
$worksheet->freeze_panes('A8');  

$title = "$bench\n Version: $version Release: $release"; 
$worksheet->merge_range('A1:J2',$title, $mFormat);
$worksheet->merge_range('A3:E3','Unclassified / For Official Use Only', $bFormat);
$worksheet->merge_range('F3:G3','Date:', $bFormat);
$worksheet->merge_range('H3:J3',scalar localtime, $bFormat);
$worksheet->write(3, 0,  'System', $b1Format);
$worksheet->merge_range('B4:E4',$assetInfo[0], $bFormat);
$worksheet->merge_range('F4:G4','Profile: ' . $assetInfo[1] . '     Prepared by:', $bFormat);
$worksheet->merge_range('H4:J4','STIG Manager 2.0', $bFormat);
$worksheet->merge_range('B5:J5','', $bFormat);
$worksheet->merge_range('A6:J6','', $bFormat);

$worksheet->write(4, 0,  'Comments', $b1Format);
$worksheet->write(6, 0,  'Group ID', $m1Format);
$worksheet->write(6, 1,  'STIG_ID', $m1Format);
$worksheet->write(6, 2,  'RULE_ID', $m1Format);
$worksheet->write(6, 3,  'Weight', $m1Format);
$worksheet->write(6, 4,  'Rule Title', $m1Format);
$worksheet->write(6, 5,  'Vulnerability Discussion', $m1Format);
$worksheet->write(6, 6,  'CAT', $m1Format);
$worksheet->write(6, 7,  'IA Control', $m1Format);
$worksheet->write(6, 8,  'Status', $m1Format);
$worksheet->write(6, 9,  'Comment', $m1Format);

$n=7;
foreach $group (@$checkInfo) {
	my $weight=$group->{'weight'};
	my $action=$group->{'action'};
	my $groupId=$group->{'groupId'};
	my $stigId=$group->{'stigId'};
	my $ruleId=$group->{'ruleId'};
	my $gTitle=$group->{'gTitle'};
	my $rTitle=$group->{'rTitle'};
	my $discussion1=$group->{'discussion'};
	my $discussion2=$group->{'fixtext'};
	my $cat=catFormat($group->{'cat'});
	my $iaControls=$group->{'iaControls'};
	my $state=$group->{'state'};
	my $stateComment=$group->{'stateComment'};
	my $actionComment=$group->{'actionComment'};
	#This 'doc' refers to a documentable rule, not to potentially required documentation
	my $docText=docFormat($group->{'documentable'});
	my $repText=repFormat($group->{'responsible'});
	
	#build Text Strings
	my $titleText = $gTitle."\n-------\n".$rTitle;
	my $vulnText = $discussion1."\n-------\n".$discussion2;
	
	if ($action){
		$commentText = $docText."\n".$repText."\n\n".$stateComment."\n\nRecommended Action: ".$action."\nNotes:".$actionComment;
	}else{
		$commentText = $docText."\n".$repText."\n\n".$stateComment;
	}
	
	$worksheet->write($n, 0,  $groupId, $cFormat);
	$worksheet->write($n, 1,  $stigId, $cFormat);
	$worksheet->write($n, 2,  $ruleId, $cFormat);
	$worksheet->write($n, 3,  $weight, $cFormat);
	$worksheet->write($n, 4,  $titleText, $cFormat);
	$worksheet->write($n, 5,  $vulnText, $cFormat);
	$worksheet->write($n, 6,  $cat, $cFormat);
	$worksheet->write($n, 7,  $iaControls, $cFormat);
	$worksheet->write($n, 8,  $state, $cFormat);
	$worksheet->write($n, 9,  $commentText, $cFormat);

	$n++;
}

############################
# Worksheet: Profiles
############################
$sqlProfileInfo =<<END;
SELECT
	groupId
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-1_Classified') > 0 THEN 'Y' ELSE 'N' END as "M1C"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-1_Sensitive') > 0 THEN 'Y' ELSE 'N' END as "M1S"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-1_Public') > 0 THEN 'Y' ELSE 'N' END as "M1P"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-2_Classified') > 0 THEN 'Y' ELSE 'N' END as "M2C"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-2_Sensitive') > 0 THEN 'Y' ELSE 'N' END as "M2S"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-2_Public') > 0 THEN 'Y' ELSE 'N' END as "M2P"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-3_Classified') > 0 THEN 'Y' ELSE 'N' END as "M3C"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-3_Sensitive') > 0 THEN 'Y' ELSE 'N' END as "M3S"
	,CASE WHEN INSTR(LISTAGG(profile,',') WITHIN GROUP (ORDER BY profile),'MAC-3_Public') > 0 THEN 'Y' ELSE 'N' END as "M3P"
FROM
	stigs.rev_profile_group_map
where
	revId=?
group by
	groupId
order by
	DECODE(substr(groupId,1,2),'V-',lpad(substr(groupId,3),6,'0'),groupId) asc
END
$profileInfos = $dbh->selectall_arrayref($sqlProfileInfo, undef, ($revId));

$worksheet = $workbook->add_worksheet('Profiles');
$worksheet->set_column('A:J',20);
$worksheet->write(0, 0,  'Group ID', $m1Format);
$worksheet->write(0, 1,  'Mac-1_Classified', $m1Format);
$worksheet->write(0, 2,  'Mac-1_Sensitive', $m1Format);
$worksheet->write(0, 3,  'Mac-1_Public', $m1Format);
$worksheet->write(0, 4,  'Mac-2_Classified', $m1Format);
$worksheet->write(0, 5,  'Mac-2_Sensitive', $m1Format);
$worksheet->write(0, 6,  'Mac-2_Public', $m1Format);
$worksheet->write(0, 7,  'Mac-3_Classified', $m1Format);
$worksheet->write(0, 8,  'Mac-3_Sensitive', $m1Format);
$worksheet->write(0, 9,  'Mac-3_Public', $m1Format);
$worksheet->freeze_panes('B2');  

$n = 1;
foreach $profileInfo (@$profileInfos) {
	$worksheet->write($n,0,$profileInfo->[0],$m2Format);
	for my $x (1 .. 9) {
		if ($profileInfo->[$x] eq 'Y') {
			$worksheet->write($n,$x,'Yes',$profileYesFormat);
		} else {
			$worksheet->write($n,$x,'No',$profileNoFormat);
		}
	}	
	$n++
}

$workbook->close();

############################
# Send the file            
############################
$reportPrefix = $assetInfo[0] . "-" . $benchmarkId;
open(XLS,"<$xls") or die "Can't open $xls";
binmode(XLS);
$timestamp = time;
($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);
$datedFile = sprintf ("${reportPrefix}_%04d-%02d-%02dT%02d%02d.xls",$year+1900,$mon+1,$mday,$hour,$min);
print "Content-Type: application/vnd.ms-excel\n";
print "Content-Disposition: attachment;filename=$datedFile\n\n";
while (<XLS>) {
	print;
}
close(XLS);
unlink($xls);

############################
# Subroutines            
############################
sub catFormat{
	my $in = shift;
	return "CAT I" if $in eq '1';
	return "CAT II" if $in eq '2';
	return "CAT III" if $in eq '3';
	return $in;
}

sub docFormat{
	my $in = shift;
	return "Documentable Exception: NO" if $in eq 'false';
	return "Documentable Exception: YES" if $in eq 'true';
	return $in;
}

sub repFormat{
	my $in = shift;
	return "Action: $in";

}