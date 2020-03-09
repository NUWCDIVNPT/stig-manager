#!/usr/bin/perl

use Excel::Writer::XLSX;
use DBI;
use JSON::XS;
use CGI;
use Time::Local;
use Data::UUID;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$roman = {
	1 => 'I',
	2 => 'II',
	3 => 'III',
	4 => 'IV'
};

$timestamp = time;
($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);

$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$stigId = $q->param('stigId');
$packageId = $q->param('packageId');
$dept = $q->param('dept');
$domain = $q->param('domain');
$showUnapproved = $q->param('showUnapproved');

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
$userId = $userObj->{'id'};
$exportUserName = $userObj->{'name'};
$r = $userObj->{'roles'};

############################
# SQL
############################
$sqlPackageInfo =<<END;
	select
		name as "name",
		reqRar as "reqRar",
		pocName as "pocName",
		pocEmail as "pocEmail",
		pocPhone as "pocPhone"
	from
		packages
	where
		packageId = ?
END
$packageInfo = $dbh->selectrow_hashref($sqlPackageInfo, undef, ($packageId));

if ($stigId && $stigId ne 'undefined') {
	$sqlStigCondition = "and sa.stigId=?";
	@bindValues = ($packageId,$stigId);
} else {
	$sqlStigCondition = "and sa.stigId is not null";
	@bindValues = ($packageId);
}

if ($dept && $dept ne '--Any--' && $dept ne 'undefined') { # $dept is defined and is not "Any"
	$sqlDeptCondition = 'and a.dept=?';
	push(@bindValues,$dept);
} else {
	$sqlDeptCondition = '';
}

if ($domain && $domain ne '--Any--' && $domain ne 'undefined') { # $domain is defined and is not "Any"
	$sqlDomainCondition = 'and a.domain=?';
	push(@bindValues,$domain);
} else {
	$sqlDomainCondition = '';
}

if ($showUnapproved == 1) { 
	$sqlApprovedCondition = '';
} else {
	$sqlApprovedCondition = 'and rv.statusId=3';
}


$sqlRarRowsStig =<<END;
select
	pre.iaControl as "iaControl",
	STRDAGG_PARAM(PARAM_ARRAY(REPLACE(st.title,' Security Technical Implementation Guide','')||' V'||crev.version||'R'||crev.release, CHR(10)))as "source",
	gr.groupId as "groupId",
	ru.title as "ruleTitle",
	gr.title as "groupTitle",
	ru.vulnDiscussion as "vulnDiscussion",
	'CAT '||sc.roman as "cat",
	ii.impactCode as "impactCode",
	pre.likelihood as "likelihood",
	to_char(substr(fx.text,0,3999)) as "recCorrAct",
	pre.mitDesc as "mitDesc",
	pre.remDesc as "remDesc",
	pre.residualRisk as "residualRisk",
	pre.status as "status",
	pre.rarComment as "rarComment",
	STRDAGG_PARAM(PARAM_ARRAY(a.name,CHR(10))) as "assets"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigs.stigs st on st.stigId=sa.stigId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigs.groups gr on gr.groupId=cr.groupId
	left join stigs.rules ru on ru.ruleId=cr.ruleId
	left join stigs.rule_fix_map rfm on rfm.ruleId=ru.ruleId
	left join stigs.fixes fx on fx.fixId=rfm.fixId
	left join stigs.severity_cat_map sc on sc.severity=ru.severity
	left join stigs.current_revs crev on crev.stigId=cr.stigId
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=ru.ruleId)
	left join stigman.poam_rar_entries pre on (pre.packageId=ap.packageId and pre.sourceId=gr.groupId and pre.findingType='stig')
	left join iaControls.controls ii on ii.controlNumber=pre.iaControl
where
	ap.packageId = ?
	$sqlStigCondition
	$sqlDeptCondition
	$sqlDomainCondition
	$sqlApprovedCondition
	and rv.stateId=4
group by
	pre.iaControl,
	gr.groupId,
	ru.title,
	gr.title,
	ru.vulnDiscussion,
	sc.roman,
	ii.impactCode,
	pre.likelihood,
	to_char(substr(fx.text,0,3999)),
	pre.mitDesc,
	pre.remDesc,
	pre.residualRisk,
	pre.status,
	pre.rarComment
order by
	DECODE(substr(gr.groupId,1,2),'V-',lpad(substr(gr.groupId,3),6,'0'),gr.groupId) asc
END
$rarRowsStig = $dbh->selectall_arrayref($sqlRarRowsStig,{Slice => {}},@bindValues);

$sqlRarRowsNessus =<<END;
select
	pf.pluginId as "pluginId"
	,fp.name as "pluginName"
	,fp.synopsis as "synopsis"
	,fp.description as "description"
	,pre.residualRisk as "residualRisk"
	,pre.iaControl as "iaControl"
	,ii.impactCode as "impactCode"
	,pre.likelihood as "likelihood"
	,pre.recCorrAct as "recCorrAct"
	,pre.mitDesc as "mitDesc"
	,pre.remDesc as "remDesc"
	,STRDAGG_PARAM(PARAM_ARRAY ('Nessus ' || pf.nessusVersion || '(Plugin version ' || pf.PLUGINFEEDVERSION || ')', CHR(10))) as "nessusVersion"
	,pre.status as "status"
	,NVL(decode(TRIM(fp.stigSeverity),'I', 1, 'II', 2, 'III', 3),decode(fp.severity, 4, 1, 3, 1, 2, 2, 1, 3)) as "rawRisk"
	,pre.rarComment as "rarComment"
	,STRDAGG_PARAM(PARAM_ARRAY(a.name,', ')) as "assets"
from
	packages p
	inner join PKG_FINDINGS pf on pf.PACKAGEID=p.packageId
	inner join assets a on a.assetId=pf.assetId
	inner join VARS_2.FOUND_PLUGINS fp on fp.pluginId=pf.pluginId
	left join poam_rar_entries pre on (pre.packageId=p.packageId and pre.sourceId=to_char(pf.pluginId))
	left join iaControls.controls ii on ii.controlNumber=pre.iaControl
where
	p.packageId = ?
	$sqlDeptCondition
	$sqlDomainCondition
group by
	pf.pluginId
	,fp.name
	,fp.synopsis
	,fp.description
	,pre.residualRisk
	,pre.iaControl
	,ii.impactCode
	,pre.likelihood
	,pre.recCorrAct
	,pre.mitDesc
	,pre.remDesc
	,pre.status
	,pre.rarComment
	,fp.severity
	,fp.STIGSEVERITY
order by
	pf.pluginId
END
if ((!$stigId) || ($stigId eq 'undefined')) {
	$rarRowsNessus = $dbh->selectall_arrayref($sqlRarRowsNessus,{Slice => {}},@bindValues);
}

############################
# Create workbook
############################
$xlsFH = File::Temp->new();
$xls = $xlsFH->filename;
$workbook = Excel::Writer::XLSX->new("$xls");

############################
# Create worksheet
############################
$rarWorksheet = $workbook->add_worksheet('Risk Assessment Report');
$rarWorksheet->set_zoom(70);

############################
# Column/Row dimensions
############################
$rarWorksheet->set_column('A:A',  10.57); 
$rarWorksheet->set_column('B:B',  23.14); 
$rarWorksheet->set_column('C:C',  19); 
$rarWorksheet->set_column('D:D',  32); 
$rarWorksheet->set_column('E:E',  38); 
$rarWorksheet->set_column('F:F',  12); 
$rarWorksheet->set_column('G:G',  11.43);
$rarWorksheet->set_column('H:H',  11.71);
$rarWorksheet->set_column('I:I',  20.29);
$rarWorksheet->set_column('J:J',  20.29);
$rarWorksheet->set_column('K:K',  28);
$rarWorksheet->set_column('L:L',  9.43);
$rarWorksheet->set_column('M:M',  10.71);
$rarWorksheet->set_column('N:N',  17.29);
$rarWorksheet->set_column('O:O',  21.86);

$rarWorksheet->set_row(0, 15);
$rarWorksheet->set_row(1, 15);
$rarWorksheet->set_row(2, 15);
$rarWorksheet->set_row(3, 15);
$rarWorksheet->set_row(4, 15);
$rarWorksheet->set_row(5, 15);
$rarWorksheet->set_row(6, 60);


############################
# Colors
############################
# Grey
$workbook->set_custom_color('31', '255', '192', '0');

############################
# Formats
############################
# Orange background, bold font
$fmtOrangeLabel = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'center',
	text_wrap => 1,
	font => 'Calibri',
	size => 11,
	bold => 1,
	bg_color => 31
);

#White background, regular font, 
$fmtData = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'left',
	text_wrap => 1,
	font => 'Calibri',
	size => 11
);

$fmtDataRight = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'right',
	text_wrap => 1,
	font => 'Calibri',
	size => 11
);

$fmtDataCenter = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
	text_wrap => 1,
	font => 'Calibri',
	size => 11
);


############################
# Labels
############################
$pocString = $packageInfo->{'pocName'} . ", " . $packageInfo->{'pocEmail'} . ", " . $packageInfo->{'pocPhone'};
$exportDate = sprintf ("%04d-%02d-%02d",$year+1900,$mon+1,$mday);

$rarWorksheet->merge_range('A1:B1',"System Name and Version:", $fmtDataRight);
$rarWorksheet->merge_range('C1:E1',$packageInfo->{'name'}, $fmtDataRight);
$rarWorksheet->merge_range('A2:B2',"Date(s) of Testing:", $fmtDataRight);
$rarWorksheet->merge_range('C2:E2',"", $fmtDataRight);
$rarWorksheet->merge_range('A3:B3',"Date of Report:", $fmtDataRight);
$rarWorksheet->merge_range('C3:E3',$exportDate, $fmtDataRight);
$rarWorksheet->merge_range('A4:B4',"POC Information:", $fmtDataRight);
$rarWorksheet->merge_range('C4:E4',$pocString, $fmtDataRight);
$rarWorksheet->merge_range('A5:B5',"Risk Assessment Method:", $fmtDataRight);
$rarWorksheet->merge_range('C5:E5',"", $fmtDataRight);
$rarWorksheet->merge_range('A6:B6',"Overall Severity Category:", $fmtDataRight);
$rarWorksheet->merge_range('C6:E6',"", $fmtDataRight);

$rarWorksheet->write('A7',"Identifier\nApplicable Security Control (1)",$fmtOrangeLabel);
$rarWorksheet->write('B7',"Source of Discovery\nor\nTest Tool Name (2)",$fmtOrangeLabel);
$rarWorksheet->write('C7',"Test ID\nor\nThreat IDs (3)",$fmtOrangeLabel);
$rarWorksheet->write('D7',"Description of Vulnerability/Weakness (4)",$fmtOrangeLabel);
$rarWorksheet->write('E7',"Risk Statement (5)",$fmtOrangeLabel);
$rarWorksheet->write('F7',"Raw Risk (CAT, I, II, III) (6)",$fmtOrangeLabel);
$rarWorksheet->write('G7',"(Impact ) (7)",$fmtOrangeLabel);
$rarWorksheet->write('H7',"Likelihood (8)",$fmtOrangeLabel);
$rarWorksheet->write('I7',"Recommended Corrective Action (9)",$fmtOrangeLabel);
$rarWorksheet->write('J7',"Mitigation Description (10)",$fmtOrangeLabel);
$rarWorksheet->write('K7',"Remediation Description (11)",$fmtOrangeLabel);
$rarWorksheet->write('L7',"Residual Risk/Risk Exposure (12)",$fmtOrangeLabel);
$rarWorksheet->write('M7',"Status (13)",$fmtOrangeLabel);
$rarWorksheet->write('N7',"Comment (14)",$fmtOrangeLabel);
$rarWorksheet->write('O7',"Devices Affected (15)",$fmtOrangeLabel);


############################
# Rows            
############################
$rowNum = 0;
foreach $rarRow (@$rarRowsStig) {
	$rowNum++;
	$row = $rowNum + 6;
	$rarWorksheet->write($row,0,$rarRow->{'iaControl'},$fmtData);
	$rarWorksheet->write($row,1,$rarRow->{'source'},$fmtData);
	$rarWorksheet->write($row,2,$rarRow->{'groupId'},$fmtData);
	$rarWorksheet->write($row,3,$rarRow->{'groupTitle'} . ".\n" . $rarRow->{'ruleTitle'},$fmtData);

	if ($rarRow->{'status'} eq 'Completed') { #These columns not populated for "Completed" findings
		$rarWorksheet->write($row,4,"",$fmtData);
		$rarWorksheet->write($row,5,"",$fmtData);
		$rarWorksheet->write($row,6,"",$fmtDataCenter);
		$rarWorksheet->write($row,7,"",$fmtDataCenter);
		$rarWorksheet->write($row,8,"",$fmtData);
		$rarWorksheet->write($row,9,"",$fmtData);
		$rarWorksheet->write($row,10,"",$fmtData);
		$rarWorksheet->write($row,11,"",$fmtDataCenter);
		$rarWorksheet->write($row,12,$rarRow->{'status'},$fmtDataCenter);
	} else {
		$rarWorksheet->write($row,4,$rarRow->{'vulnDiscussion'},$fmtData);
		$rarWorksheet->write($row,5,$rarRow->{'cat'},$fmtData);
		$rarWorksheet->write($row,6,$rarRow->{'impactCode'},$fmtDataCenter);
		$rarWorksheet->write($row,7,$rarRow->{'likelihood'},$fmtDataCenter);
		$rarWorksheet->write($row,8,$rarRow->{'recCorrAct'},$fmtData);
		$rarWorksheet->write($row,9,$rarRow->{'mitDesc'},$fmtData);
		$rarWorksheet->write($row,10,$rarRow->{'remDesc'},$fmtData);
		if ($rarRow->{'residualRisk'}) {
			$rarWorksheet->write($row,11,"CAT " . $roman->{$rarRow->{'residualRisk'}},$fmtDataCenter);
		} else {
			$rarWorksheet->write($row,11,"",$fmtDataCenter);
		}
		$rarWorksheet->write($row,12,'Ongoing',$fmtDataCenter);
	}

	if ($rarRow->{'status'} eq 'Completed') {
		$rarWorksheet->write($row,13,$rarRow->{'rarComment'},$fmtData);
	} else {
		$rarWorksheet->write($row,13,"",$fmtData);
	}

	$rarWorksheet->write($row,14,$rarRow->{'assets'},$fmtData);
}
if ((!$stigId) || ($stigId eq 'undefined')) {
	foreach $rarRow (@$rarRowsNessus) {
		$rowNum++;
		$row = $rowNum + 6;
		# Identifier Applicable Security Control (1)
		$rarWorksheet->write($row,0,$rarRow->{'iaControl'},$fmtData);
		# Source of Discovery or Test Tool Name (2)
		$rarWorksheet->write($row,1,$rarRow->{'nessusVersion'},$fmtData);
		#Test ID or Threat IDs (3)
		$rarWorksheet->write($row,2,"Nessus ID: " . $rarRow->{'pluginId'},$fmtData);
		#Description of Vulnerability/Weakness (4)
		$rarWorksheet->write($row,3,$rarRow->{'pluginName'} . ".\n" . $rarRow->{'synopsis'},$fmtData);
		if ($rarRow->{'status'} eq 'Completed') { #These columns not populated for "Completed" findings
			$rarWorksheet->write($row,4,"",$fmtData);
			$rarWorksheet->write($row,5,"",$fmtData);
			$rarWorksheet->write($row,6,"",$fmtDataCenter);
			$rarWorksheet->write($row,7,"",$fmtDataCenter);
			$rarWorksheet->write($row,8,"",$fmtData);
			$rarWorksheet->write($row,9,"",$fmtData);
			$rarWorksheet->write($row,10,"",$fmtData);
			$rarWorksheet->write($row,11,"",$fmtDataCenter);
			$rarWorksheet->write($row,12,$rarRow->{'status'},$fmtDataCenter);
		} else {
			# Risk Statement (5)
			$rarWorksheet->write($row,4,$rarRow->{'description'},$fmtData);
			# Raw Risk
			$rarWorksheet->write($row,5,"CAT " . $roman->{$rarRow->{'rawRisk'}},$fmtData);
			$rarWorksheet->write($row,6,$rarRow->{'impactCode'},$fmtDataCenter);
			$rarWorksheet->write($row,7,$rarRow->{'likelihood'},$fmtDataCenter);
			$rarWorksheet->write($row,8,$rarRow->{'recCorrAct'},$fmtData);
			$rarWorksheet->write($row,9,$rarRow->{'mitDesc'},$fmtData);
			$rarWorksheet->write($row,10,$rarRow->{'remDesc'},$fmtData);
			if ($rarRow->{'residualRisk'}) {
				$rarWorksheet->write($row,11,"CAT " . $roman->{$rarRow->{'residualRisk'}},$fmtDataCenter);
			} else {
				$rarWorksheet->write($row,11,"",$fmtDataCenter);
			}
			$rarWorksheet->write($row,12,'Ongoing',$fmtDataCenter);
		}
		if ($rarRow->{'status'} eq 'Completed') {
			$rarWorksheet->write($row,13,$rarRow->{'rarComment'},$fmtData);
		} else {
			$rarWorksheet->write($row,13,"",$fmtData);
		}

		$rarWorksheet->write($row,14,$rarRow->{'assets'},$fmtData);
		
	}
}
$workbook->close();

############################
# Send the file            
############################
$reportPrefix = "RAR-" . $packageInfo->{'name'};
if ($stigId && $stigId ne 'undefined') {
	$reportPrefix .= "-$stigId";
}
if ($dept && $dept ne 'undefined' && $dept ne '--Any--') {
	$reportPrefix .= "-Dept_$dept";
}
if ($domain && $domain ne 'undefined' && $domain ne '--Any--') {
	$reportPrefix .= "-Group_$domain";
}

open(XLS,"<$xls") or die "Can't open $xls";
binmode(XLS);
$datedFile = sprintf ("${reportPrefix}_%04d-%02d-%02dT%02d%02d.xlsx",$year+1900,$mon+1,$mday,$hour,$min);
print "Content-Type: application/vnd.ms-excel\n";
print "Content-Disposition: attachment;filename=$datedFile\n\n";
while (<XLS>) {
	print;
}
close(XLS);
unlink($xls);
