#!/usr/bin/perl

use Spreadsheet::WriteExcel;
use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Time::Local;
use Data::UUID;
use File::Temp qw/ tempfile tempdir /;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
use Data::Dumper;

$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$stigId = $q->param('stigId');
$packageId = $q->param('packageId');
#$profileName = 'MAC-3_Sensitive';
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

############################
# SQL
############################
$sqlPackageInfo =<<END;
select
	name,
	mc.macClId,
	mc.longName,
	mc.profileName
from
	stigman.packages p
	left join iaControls.mac_cl mc on mc.macClId=p.macClId
where 
	p.packageId=?
END
($packageName,$macClId,$macClLong,$profileName) = $dbh->selectrow_array($sqlPackageInfo, undef, ($packageId));

$sqlRevInfo =<<END;
select
	s.title,
	r.version,
	r.release,
	r.benchmarkDate,
	s.stigId
from
	stigs.current_revs cr
	left join stigs.revisions r on r.revId=cr.revId
	left join stigs.stigs s on s.stigId=cr.stigId
where
	cr.stigId=?
END
@revInfo = $dbh->selectrow_array($sqlRevInfo, undef, ($stigId));
$bench = $revInfo[0];
$version = $revInfo[1];
$release = $revInfo[2] . " (" . $revInfo[3] . ")";
$benchmarkId = $revInfo[4];

$sqlAssetInfo =<<END;
select
	a.assetId as "assetId",
	a.name as "name"
from
	stigman.packages p
	left join stigman.asset_package_map ap on ap.packageId=p.packageId
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigman.assets a on a.assetId=sa.assetId
where
	p.packageId=?
	and sa.stigId=?
order by
	a.name
END
$assetInfo = $dbh->selectall_arrayref($sqlAssetInfo, { Slice => {} }, ($packageId,$stigId));
@assetIds = ();
@assetNames = ();
foreach $asset (@$assetInfo) {
	push(@assetIds,$asset->{'assetId'});
	push(@assetNames,$asset->{'name'});
}

$reviewInfoParamStr = join ', ' => ('?') x @assetIds;
# The query returns results in order of 'O', 'NA', 'NF'
$sqlReviewInfo =<<END;
select
	rv.ruleId as "ruleId",
	rv.assetId as "assetId",
	a.name as "name",
	st.abbr as "abbr",
	rv.stateComment as "stateComment",
	act.action as "action",
	rv.actionComment as "actionComment" 
from 
	stigman.reviews rv
	left join stigman.assets a on a.assetId=rv.assetId
	left join stigman.states st on st.stateId=rv.stateId
	left join stigman.actions act on act.actionId=rv.actionId
where
	rv.assetId in ($reviewInfoParamStr)
	and rv.ruleId=?
order by
	DECODE(st.abbr,'O',1,'NA',2,'NF',3,4), a.name
END
$sthReviewInfo = $dbh->prepare($sqlReviewInfo);

$sqlPoamInfo =<<END;
select
	pre.iaControl as "iaControl",
	pre.milestone as "milestone"
from stigman.poam_rar_entries pre
where
	pre.packageId = ?
	and pre.sourceId = ?
END

$sqlCheckInfo =<<END;
select
	ru.weight as "weight",
	gr.groupId as "groupId",
	ru.version as "stigId",
	ru.ruleId as "ruleId",
	gr.title as "gTitle",
	ru.title as "rTitle",
	ru.vulnDiscussion as "discussion",
	MAX(to_char(substr(fix.text,0,3999))) as "fixText",
	sc.cat as "cat",
	ru.iaControls as "iaControls",
	ru.documentable as "documentable",
	ru.responsibility as "responsible"
from
	stigs.current_revs cr  
	left join stigs.rev_profile_group_map rpg on rpg.revId=cr.revId
	left join stigs.current_group_rules cgr on (cgr.stigId=cr.stigId and cgr.groupId=rpg.groupId)
	left join stigs.groups gr on gr.groupId=cgr.groupId
	left join stigs.rules ru on ru.ruleId=cgr.ruleId
	left join stigs.severity_cat_map sc on sc.severity=ru.severity
	left join stigs.rule_fix_map rf on rf.ruleId=ru.ruleId
	left join stigs.fixes fix on fix.fixId=rf.fixId
where
	cr.stigId=?
	and rpg.profile=?
group by
	ru.weight,
	gr.groupId,
	ru.version,
	ru.ruleId,
	gr.title,
	ru.title,
	ru.vulnDiscussion,
	sc.cat,
	ru.iaControls,
	ru.documentable,
	ru.responsibility
order by
	DECODE(substr(gr.groupId,1,2),'V-',lpad(substr(gr.groupId,3),6,'0'),gr.groupId) asc
END
$checkInfo = $dbh->selectall_arrayref($sqlCheckInfo, { Slice => {} }, ($stigId,$profileName));

$sqlReviewInfo =<<END;

END


############################
# Create workbook
############################

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
$cOpenFormat = $workbook->add_format(
	valign => 'top',
	align => 'left',
	border => 1,
);
$cOpenFormat->set_text_wrap('1');
$cOpenFormat->set_bg_color('31');
$bFormat = $workbook->add_format(
	valign => 'vcenter',
	align => 'left',
	border => 1,
	bold => 1
);
$bRightFormat = $workbook->add_format(
	valign => 'vcenter',
	align => 'right',
	border => 1,
	bold => 1
);
									
$bMergeFormat = $workbook->add_format(
	valign => 'vcenter',
	align => 'left',
	border => 1,
	bold => 1
);
$namesMergeFormat = $workbook->add_format(
	valign => 'vcenter',
	align => 'left',
	border => 1
);
									
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
# Page setup stuff
$worksheet->fit_to_pages(1); # 1 page wide and as long as necessary
$worksheet->set_landscape();
$worksheet->set_paper(1); #US Letter
$worksheet->set_margin_top(0.5);
$worksheet->set_margin_bottom(0.3);
$worksheet->set_margin_left(0.1);
$worksheet->set_margin_right(0.25);
$worksheet->repeat_rows(6); #repeat row 6
# Header
$worksheet->set_header('&CFOR OFFICIAL USE ONLY',0.3);
# Footer
$shortStigName = $bench;
$shortStigName =~ s/\s*STIG//g;
$shortStigName =~ s/\s*Security Technical Implementation Guide//g;
$footerLeftStr = '&L' . "$packageName - $shortStigName";
$footerCenterStr = '&CFOR OFFICIAL USE ONLY';
$footerRightStr = '&R&P/&N';
$worksheet->set_footer($footerLeftStr . $footerCenterStr . $footerRightStr,0.2);

# Page
$worksheet->set_column('A:A',  10); 
$worksheet->set_column('B:B',  9); 
$worksheet->set_column('C:C',  13); 
$worksheet->set_column('D:D',  7); 
$worksheet->set_column('E:E',  15); 
$worksheet->set_column('F:F',  44); 
$worksheet->set_column('G:G',  6); 
$worksheet->set_column('H:H',  8); 
$worksheet->set_column('I:I',  6);
$worksheet->set_column('J:J',  35);
$worksheet->set_column('K:K',  20);
$worksheet->freeze_panes('A8');  

$title = "$bench\n Version: $version Release: $release"; 
$worksheet->merge_range('A1:K2',$title, $mFormat);
$worksheet->merge_range('A3:E3','Unclassified / For Official Use Only', $bMergeFormat);
$worksheet->merge_range('F3:G3','Date:', $bRightFormat);
$worksheet->merge_range('H3:K3',scalar localtime, $bMergeFormat);
$worksheet->write(3, 0,  'System', $bFormat);
$worksheet->merge_range('B4:E4',join(", ",@assetNames), $namesMergeFormat);
$worksheet->merge_range('F4:G4','Profile: ' . $profileName . '                             Prepared by:', $bMergeFormat);
$worksheet->merge_range('H4:K4','STIG Manager 2.0', $bMergeFormat);
$worksheet->merge_range('B5:K5','', $bMergeFormat);
$worksheet->merge_range('A6:K6','', $bMergeFormat);

$worksheet->write(4, 0,  'Comments', $bFormat);
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
$worksheet->write(6, 10,  'Affected Assets', $m1Format);

$n=7;
foreach $group (@$checkInfo) {
	# Derived cells
	my $weight=$group->{'weight'};
	my $groupId=$group->{'groupId'};
	my $stigId=$group->{'stigId'};
	my $ruleId=$group->{'ruleId'};
	my $gTitle=$group->{'gTitle'};
	my $rTitle=$group->{'rTitle'};
	my $discussion1=$group->{'discussion'};
	my $discussion2=$group->{'fixtext'};
	my $cat=catFormat($group->{'cat'});
	my $docText=docFormat($group->{'documentable'});
	my $respText=repFormat($group->{'responsible'});
	my $iaControls=$group->{'iaControls'};
	
	#build Text Strings
	#$commentText = $docText."\n".$respText."\n\n";
	$commentText = $docText."\n".$respText."\n\n";
	my $titleText = $gTitle."\n-------\n".$rTitle;
	my $vulnText = $discussion1."\n-------\n".$discussion2;

	$worksheet->write($n, 0,  $groupId, $cFormat);
	$worksheet->write($n, 1,  $stigId, $cFormat);
	$worksheet->write($n, 2,  $ruleId, $cFormat);
	$worksheet->write($n, 3,  $weight, $cFormat);
	$worksheet->write($n, 4,  $titleText, $cFormat);
	$worksheet->write($n, 5,  $vulnText, $cFormat);
	$worksheet->write($n, 6,  $cat, $cFormat);
	$worksheet->write($n, 7,  $iaControls, $cFormat);
	
	
	# Review cells
	@reviewInfoParams = ();
	push(@reviewInfoParams,@assetIds);
	push(@reviewInfoParams,$ruleId);
	
	$sthReviewInfo->execute(@reviewInfoParams);
	$reviewInfo = $sthReviewInfo->fetchall_arrayref({});
	$stateComment = $reviewInfo->[0]->{'stateComment'}; # From the first review in sort order
	$stateComment =~ s/at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}//; #strip time from SCC comment
	$stateComment =~ s/ \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC\)//; #strip time from HBSS comment
	$commentText .= $stateComment; 
	$affectedAssetsStr = '';
	if ($reviewInfo->[0]->{'abbr'} eq 'O') { # There is at least one open
		$stateStr = 'O';
		$commentText .= "\n\nRecommended Action: " . $reviewInfo->[0]->{'action'};
		($iaControl,$milestone) = $dbh->selectrow_array($sqlPoamInfo,undef,($packageId,$groupId));
		$commentText .= "\nNotes: ".$milestone;
		# Get names of affected assets
		@affectedAssets = ();
		foreach $review (@$reviewInfo) {
			if ($review->{'abbr'} eq 'O') {
				push(@affectedAssets,$review->{'name'});
			}
		}
		$affectedAssetsStr = join(", ",@affectedAssets);
		$worksheet->write($n, 8,  $stateStr, $cOpenFormat);
	} else {
		$stateStr = $reviewInfo->[0]->{'abbr'};
		$worksheet->write($n, 8,  $stateStr, $cFormat);
	}

	$worksheet->write($n, 9,  $commentText, $cFormat);
	$worksheet->write($n, 10,  $affectedAssetsStr, $cFormat);

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
$profileInfos = $dbh->selectall_arrayref($sqlProfileInfo, undef, ($stigId));

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