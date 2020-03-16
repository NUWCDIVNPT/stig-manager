#!/usr/bin/perl

use strict;
use warnings;
use Excel::Writer::XLSX;
use DBI;
use JSON::XS;
use CGI;
use Time::Local;
use Data::UUID;
use grip;
use File::Temp qw/ tempfile tempdir /;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

my $roman = {
	1 => 'I',
	2 => 'II',
	3 => 'III',
	4 => 'IV'
};

my $timestamp = time;
my ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst)=localtime($timestamp);

my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId');
my $stigId = $q->param('stigId');
my $packageId = $q->param('packageId');
my $dept = $q->param('dept');
my $domain = $q->param('domain');
my $showUnapproved = $q->param('showUnapproved');
my $includeAssets = $q->param('includeAssets');
my $dbh;

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "Could not connect to the database.";
	exit;
} 
my $userObj;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "Invalid user.";
	exit;
}

my $userId = $userObj->{'id'};
my $exportUserName = $userObj->{'name'};
my $r = $userObj->{'roles'};

############################
# SQL
############################
my $sqlPackageInfo =<<END;
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
my $packageInfo = $dbh->selectrow_hashref($sqlPackageInfo, undef, ($packageId));

my $sqlStigCondition;
my @bindValues;
if ($stigId && $stigId ne 'undefined') {
	$sqlStigCondition = "and sa.stigId=?";
	@bindValues = ($packageId,$stigId);
} else {
	$sqlStigCondition = "and sa.stigId is not null";
	@bindValues = ($packageId);
}

my $sqlDeptCondition;
if ($dept && $dept ne '--Any--' && $dept ne 'undefined') { # $dept is defined and is not "Any"
	$sqlDeptCondition = 'and a.dept=?';
	push(@bindValues,$dept);
} else {
	$sqlDeptCondition = '';
}

my $sqlDomainCondition;
if ($domain && $domain ne '--Any--' && $domain ne 'undefined') { # $domain is defined and is not "Any"
	$sqlDomainCondition = 'and a.domain=?';
	push(@bindValues,$domain);
} else {
	$sqlDomainCondition = '';
}

my $sqlApprovedCondition;
if ($showUnapproved == 1) { 
	$sqlApprovedCondition = '';
} else {
	$sqlApprovedCondition = 'and rv.statusId=3';
}


my $sqlPoamRowsStig =<<END;
select
	gr.title as "groupTitle",
	ru.title as "ruleTitle",
	gr.groupId as "groupId",
	pre.mitdesc as "mitigation",
	pre.residualRisk as "residualRisk",
	pre.iaControl as "iaControl",
	pre.poc as "poc",
	pre.resources as "resources",
	TO_CHAR(pre.compDate,'yyyy-mm-dd') as "compDate",
	pre.milestone as "milestone",
	STRDAGG_PARAM(PARAM_ARRAY(REPLACE(st.title,' Security Technical Implementation Guide','')||' V'||crev.version||'R'||crev.release, CHR(10)))as "source",
	pre.status as "status",
	sc.cat as "rawRisk",
	pre.poamComment as "poamComment",
	STRDAGG_PARAM(PARAM_ARRAY(a.name,', ')) as "assets"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigs.stigs st on st.stigId=sa.stigId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigs.groups gr on gr.groupId=cr.groupId
	left join stigs.rules ru on ru.ruleId=cr.ruleId
	left join stigs.severity_cat_map sc on sc.severity=ru.severity
	left join stigs.current_revs crev on crev.stigId=cr.stigId
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=ru.ruleId)
	left join stigman.poam_rar_entries pre on (pre.packageId=ap.packageId and pre.sourceId=gr.groupId and pre.findingType='stig')
where
	ap.packageId = ?
	$sqlStigCondition
	$sqlDeptCondition
	$sqlDomainCondition
	$sqlApprovedCondition
	and rv.stateId=4
group by
	gr.title,
	ru.title,
	gr.groupId,
	pre.mitdesc,
	pre.residualRisk,
	pre.iaControl,
	pre.poc,
	pre.resources,
	pre.compDate,
	pre.milestone,
	pre.status,
	sc.cat,
	pre.poamComment
order by
	DECODE(substr(gr.groupId,1,2),'V-',lpad(substr(gr.groupId,3),6,'0'),gr.groupId) asc
END
my $poamRowsStig = $dbh->selectall_arrayref($sqlPoamRowsStig,{Slice => {}},@bindValues);
my $sqlPoamRowsNessus =<<END;
select
	pf.pluginId as "pluginId"
	,fp.name as "pluginName"
	,fp.synopsis as "synopsis"
	,fp.description as "description"
	,pre.mitdesc as "mitigation"
	,pre.residualRisk as "residualRisk"
	,pre.iaControl as "iaControl"
	,pre.poc as "poc"
	,pre.resources as "resources"
	,to_char(pre.compDate,'yyyy-mm-dd') as "compDate"
	,pre.milestone as "milestone"
	,STRDAGG_PARAM(PARAM_ARRAY (pf.nessusVersion, CHR(10))) as "nessusVersion"
	,pre.status as "status"
	,NVL(decode(TRIM(fp.stigSeverity),'I', 1, 'II', 2, 'III', 3),decode(fp.severity, 4, 1, 3, 1, 2, 2, 1, 3)) as "rawRisk"
	,pre.poamComment as "poamComment"
	,STRDAGG_PARAM(PARAM_ARRAY(a.name,', ')) as "assets"
from
	packages p
	inner join PKG_FINDINGS pf on pf.PACKAGEID=p.packageId
	inner join assets a on a.assetId=pf.assetId
	inner join VARS_2.FOUND_PLUGINS fp on fp.pluginId=pf.pluginId
	left join poam_rar_entries pre on (pre.packageId=p.packageId and pre.sourceId=to_char(pf.pluginId))
where
	p.packageId = ?
	$sqlDeptCondition
	$sqlDomainCondition
group by
	pf.pluginId
	,fp.name
	,fp.synopsis
	,fp.description
	,pre.mitdesc
	,pre.residualRisk
	,pre.iaControl
	,pre.poc
	,pre.resources
	,pre.compDate
	,pre.milestone
	,pre.status
	,fp.severity
	,fp.STIGSEVERITY
	,pre.poamComment
order by
	pf.pluginId
END

my $poamRowsNessus;
if ((!$stigId) || ($stigId eq 'undefined')) {
	$poamRowsNessus = $dbh->selectall_arrayref($sqlPoamRowsNessus,{Slice => {}},@bindValues);
}


############################
# Create workbook
############################
my $xlsFH = File::Temp->new();
my $xls = $xlsFH->filename;
my $workbook = Excel::Writer::XLSX->new("$xls");

############################
# Create worksheet
############################
my $poamWorksheet = $workbook->add_worksheet('POA&M');
$poamWorksheet->set_zoom(70);

############################
# Column/Row dimensions
############################
$poamWorksheet->set_column('A:A',  6.14); 
$poamWorksheet->set_column('B:B',  33.86); 
$poamWorksheet->set_column('C:C',  17.71); 
$poamWorksheet->set_column('D:D',  17.71); 
$poamWorksheet->set_column('E:E',  17.71); 
$poamWorksheet->set_column('F:F',  14.71); 
$poamWorksheet->set_column('G:G',  24.71);
$poamWorksheet->set_column('H:H',  14.43);
$poamWorksheet->set_column('I:I',  15.29);
$poamWorksheet->set_column('J:J',  20.86);
$poamWorksheet->set_column('K:K',  24);
$poamWorksheet->set_column('L:L',  24.43);
$poamWorksheet->set_column('M:M',  16.43);
$poamWorksheet->set_column('N:N',  15.43);
$poamWorksheet->set_column('O:O',  29.43);
# Assets affected
if ($includeAssets) {
	$poamWorksheet->set_column('P:P',  36);
}

$poamWorksheet->set_row(0, 0);
$poamWorksheet->set_row(1, 21);
$poamWorksheet->set_row(2, 20.25);
$poamWorksheet->set_row(3, 20.25);
$poamWorksheet->set_row(4, 20.25);
$poamWorksheet->set_row(5, 15.75);
$poamWorksheet->set_row(6, 81);


############################
# Colors
############################
# Grey
$workbook->set_custom_color('31', '192', '192', '192');
# Yellow
$workbook->set_custom_color('32', '255', '255', '153');

############################
# Formats
############################
# Grey background, bold font
my $fmtGreyLabelMerge = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'left',
	font => 'Arial',
	text_wrap => 1,
	size => 12,
	bold => 1,
	bg_color => 31
);
my $fmtGreyLabel = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'left',
	font => 'Arial',
	size => 12,
	bold => 1,
	bg_color => 31
);
my $fmtWhiteLabel = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'center',
	font => 'Arial',
	text_wrap => 1,
	size => 12,
	bold => 1
);
my $fmtWhiteLabelMerged = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'center',
	font => 'Arial',
	text_wrap => 1,
	size => 12,
	bold => 1
);

#White background, regular font
my $fmt02Merge = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'left',
	text_wrap => 1,
	font => 'Arial',
	size => 12
);
my $fmt02 = $workbook->add_format(
	border => 1,
	valign => 'vcenter',
	align => 'left',
	text_wrap => 1,
	font => 'Arial',
	size => 12
);
my $fmtData = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'left',
	text_wrap => 1,
	font => 'Arial',
	size => 12
);
my $fmtDataBold = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'left',
	text_wrap => 1,
	font => 'Arial',
	bold => 1,
	size => 12
);
my $fmtDataCentered = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'center',
	text_wrap => 1,
	font => 'Arial',
	size => 12
);

my $fmtCompleted = $workbook->add_format(
	border => 1,
	valign => 'top',
	align => 'left',
	text_wrap => 1,
	font => 'Arial',
	size => 12,
	bg_color => 32
);

############################
# Labels
############################
$poamWorksheet->merge_range('A2:B2',"Date Exported:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('A3:B3',"Exported By:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('A4:B4',"DoD Component:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('A5:B5',"System / Project Name:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('A6:B6',"DoD IT Registration No:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('I2:I3',"System Type:", $fmtGreyLabelMerge);
$poamWorksheet->write('I4',"POC Name:",$fmtGreyLabel);
$poamWorksheet->write('I5',"POC Phone:",$fmtGreyLabel);
$poamWorksheet->write('I6',"POC E-Mail:",$fmtGreyLabel);
$poamWorksheet->merge_range('L2:L3',"OMB Project ID:", $fmtGreyLabelMerge);
$poamWorksheet->merge_range('L4:O4',"", $fmtGreyLabelMerge);
$poamWorksheet->write('L5',"Security Costs:",$fmtGreyLabel);
$poamWorksheet->merge_range('L6:O6',"", $fmtGreyLabelMerge);


my $exportDate = sprintf ("%04d-%02d-%02d",$year+1900,$mon+1,$mday);
$poamWorksheet->merge_range('C2:H2',$exportDate, $fmt02Merge);
$poamWorksheet->merge_range('C3:H3',$exportUserName, $fmt02Merge);
$poamWorksheet->merge_range('C4:H4',"", $fmt02Merge);
$poamWorksheet->merge_range('C5:H5',$packageInfo->{'name'}, $fmt02Merge);
$poamWorksheet->merge_range('C6:H6',"", $fmt02Merge);

$poamWorksheet->merge_range('J2:K3',"", $fmt02Merge);
$poamWorksheet->merge_range('J4:K4',$packageInfo->{'pocName'}, $fmt02Merge);
$poamWorksheet->merge_range('J5:K5',$packageInfo->{'pocPhone'}, $fmt02Merge);
$poamWorksheet->merge_range('J6:K6',$packageInfo->{'pocEmail'}, $fmt02Merge);

$poamWorksheet->merge_range('M2:O3',"", $fmt02Merge);
$poamWorksheet->merge_range('M5:O5',"", $fmt02Merge);

$poamWorksheet->merge_range('A7:B7',"Control Vulnerability Description", $fmtWhiteLabelMerged);
$poamWorksheet->write('C7',"Security Control Number (NC/NA controls only)",$fmtWhiteLabel);
$poamWorksheet->write('D7',"Office/Org",$fmtWhiteLabel);
$poamWorksheet->write('E7',"Security Checks",$fmtWhiteLabel);
$poamWorksheet->write('F7'," Raw Severity Value",$fmtWhiteLabel);
$poamWorksheet->write('G7',"Mitigations",$fmtWhiteLabel);
$poamWorksheet->write('H7'," Severity Value",$fmtWhiteLabel);
$poamWorksheet->write('I7',"Resources Required",$fmtWhiteLabel);
$poamWorksheet->write('J7',"Scheduled Completion Date",$fmtWhiteLabel);
$poamWorksheet->write('K7',"Milestone with Completion Dates",$fmtWhiteLabel);
$poamWorksheet->write('L7',"Milestone Changes",$fmtWhiteLabel);
$poamWorksheet->write('M7',"Source Identifying Control Vulnerability ",$fmtWhiteLabel);
$poamWorksheet->write('N7',"Status",$fmtWhiteLabel);
$poamWorksheet->write('O7',"Comments",$fmtWhiteLabel);
if ($includeAssets) {
	$poamWorksheet->write('P7',"Affected Assets",$fmtWhiteLabel);
}

############################
# Rows            
############################
my $rowNum = 0;
foreach my $poamRow (@$poamRowsStig) {
	$rowNum++;
	my $row = $rowNum + 6;
	# Row number
	$poamWorksheet->write($row,0,$rowNum,$fmtDataBold);
	
	# Control Vulnerability Description
	$poamWorksheet->write($row,1,$poamRow->{'groupId'} . ".\n" . $poamRow->{'groupTitle'} . ".\n" . $poamRow->{'ruleTitle'},$fmtData);
	
	# Security Control Number (NC/NA controls only)
	$poamWorksheet->write($row,2,$poamRow->{'iaControl'},$fmtData);

	# Office/Org
	#$poamWorksheet->write($row,3,"NAVSEA, " . $packageInfo->{'pocName'} . ",\n" . $packageInfo->{'pocPhone'} . ",\n" . $packageInfo->{'pocEmail'},$fmtData);
	$poamWorksheet->write($row,3,"NAVSEA",$fmtData);

	# Security Checks
	$poamWorksheet->write($row,4,"",$fmtData);

	# Raw Severity Value
	$poamWorksheet->write($row,5,$roman->{$poamRow->{'rawRisk'}},$fmtDataCentered);

	# Mitigations
	# IF COMPLETED THEN PRINT ""
	if ($poamRow->{'status'} eq "Completed") {
		$poamWorksheet->write($row,6,"",$fmtData);
	} else {
		$poamWorksheet->write($row,6,$poamRow->{'mitigation'},$fmtData);
	}
	
	# Severity Value
	# IF COMPLETED THEN PRINT ""
	if ($poamRow->{'status'} eq "Completed") {
		$poamWorksheet->write($row,7,"",$fmtDataCentered);
	} else {
		$poamWorksheet->write($row,7,$roman->{$poamRow->{'residualRisk'}},$fmtDataCentered);
	}
	
	# Resources Required
	$poamWorksheet->write($row,8,"Labor",$fmtData);
	
	# Scheduled completion date
	$poamWorksheet->write($row,9,$poamRow->{'compDate'},$fmtData);
	
	# Milestone with Completion Date
	my $milestoneWithDate;
	if ($poamRow->{'milestone'}) {
		$milestoneWithDate = $poamRow->{'milestone'} . "\n " . $poamRow->{'compDate'};
	} else {
		$milestoneWithDate = "";
	}
	$poamWorksheet->write($row,10,$milestoneWithDate,$fmtData);
	
	# Milestone Changes
	$poamWorksheet->write($row,11,"",$fmtData);

	# Source Identifying Control Vulnerability 
	$poamWorksheet->write($row,12,$poamRow->{'source'} . "\n" . $poamRow->{'groupId'},$fmtData);
	
	
	# Status
	my $statusString;
	my $statusFormat;
	if ($poamRow->{'status'} eq "Completed") {
		$statusString = $poamRow->{'status'} . "\n " . $poamRow->{'compDate'};
		$statusFormat = $fmtCompleted;
	} else { # probably 'Ongoing'
		$statusString = $poamRow->{'status'};
		$statusFormat = $fmtData;
	}
	$poamWorksheet->write($row,13,$statusString,$statusFormat);
	
	# Comments
	my $commentString = '';
	if ($poamRow->{'status'} eq "Completed") {
		$commentString .= "Completed.\n";
	} else {
		$commentString .= "Raw Risk CAT " . $roman->{$poamRow->{'rawRisk'}} . "\n";
		if ($poamRow->{'residualRisk'} > $poamRow->{'rawRisk'}) {
			$commentString .= "Residual Risk CAT " . $roman->{$poamRow->{'residualRisk'}} . "\n";
		}
	}	
	if ($packageInfo->{'reqRar'} == 1) {
		$commentString .= "See Risk Assessment Report \"" . $poamRow->{'groupId'} . "\"";
	} else {
		if ($poamRow->{'status'} ne "Completed") {
			if ($poamRow->{'residualRisk'} > $poamRow->{'rawRisk'}) { 
				$commentString .= $poamRow->{'mitDesc'};
			}
		}
	}
	$poamWorksheet->write($row,14,$commentString,$fmtData);

	# Affected Assets
	if ($includeAssets) {
		$poamWorksheet->write($row,15,$poamRow->{'assets'},$fmtData);
	}
}

if ((!$stigId) || ($stigId eq 'undefined')) {
	foreach my $poamRow (@$poamRowsNessus) {
		$rowNum++;
		my $row = $rowNum + 6;
		# Row number
		$poamWorksheet->write($row,0,$rowNum,$fmtDataBold);

		# Control Vulnerability Description
		my $firstLineDesc = ($poamRow->{'description'} =~ /(.*)/)[0]; # get first line of the description
		$poamWorksheet->write($row,1,"Nessus ID " . $poamRow->{'pluginId'} . ".\n" . $poamRow->{'pluginName'} . ".\n" . $poamRow->{'synopsis'} . "\n------------\n" . $firstLineDesc,$fmtData);

		# Security Control Number (NC/NA controls only)
		$poamWorksheet->write($row,2,$poamRow->{'iaControl'},$fmtData);

		# Office/Org
		#$poamWorksheet->write($row,3,"NAVSEA, " . $packageInfo->{'pocName'} . ",\n" . $packageInfo->{'pocPhone'} . ",\n" . $packageInfo->{'pocEmail'},$fmtData);
		$poamWorksheet->write($row,3,"NAVSEA",$fmtData);

		# Security Checks
		$poamWorksheet->write($row,4,"",$fmtData);

		# Raw Severity Value
		$poamWorksheet->write($row,5,$roman->{$poamRow->{'rawRisk'}},$fmtDataCentered);

		# Mitigations
		$poamWorksheet->write($row,6,$poamRow->{'mitigation'},$fmtData);

		# Severity Value
		$poamWorksheet->write($row,7,$roman->{$poamRow->{'residualRisk'}},$fmtDataCentered);

		# Resources Required
		$poamWorksheet->write($row,8,"Labor",$fmtData);
		
		# Scheduled completion date
		$poamWorksheet->write($row,9,$poamRow->{'compDate'},$fmtData);
		
		# Milestone with Completion Date
		my $milestoneWithDate;
		if ($poamRow->{'milestone'}) {
			$milestoneWithDate = $poamRow->{'milestone'} . "\n " . $poamRow->{'compDate'};
		} else {
			$milestoneWithDate = "";
		}
		$poamWorksheet->write($row,10,$milestoneWithDate,$fmtData);
		
		# Milestone Changes
		$poamWorksheet->write($row,11,"",$fmtData);

		# Source Identifying Control Vulnerability 
		$poamWorksheet->write($row,12,"Nessus " . $poamRow->{'nessusVersion'} . "\nNessus ID: " . $poamRow->{'pluginId'},$fmtData);

		# Status
		my $statusString;
		my $statusFormat;
		if ($poamRow->{'status'} eq "Completed") {
			$statusString = $poamRow->{'status'} . "\n " . $poamRow->{'compDate'};
			$statusFormat = $fmtCompleted;
		} else { # probably 'Ongoing'
			$statusString = $poamRow->{'status'};
			$statusFormat = $fmtData;
		}
		$poamWorksheet->write($row,13,$statusString,$statusFormat);

		# Comments
		my $commentString = '';
		if ($poamRow->{'status'} eq "Completed") {
			$commentString .= "Completed.\n";
		} else {
			$commentString .= "Raw Risk CAT " . $roman->{$poamRow->{'rawRisk'}} . "\n";
			if ($poamRow->{'residualRisk'} > $poamRow->{'rawRisk'}) {
				$commentString .= "Residual Risk CAT " . $roman->{$poamRow->{'residualRisk'}} . "\n";
			}
		}	
		if ($packageInfo->{'reqRar'} == 1) {
			$commentString .= "See Risk Assessment Report \"Nessus ID: " . $poamRow->{'pluginId'} . "\"";
		} else {
			$commentString .= $poamRow->{'poamComment'};
		}
		$poamWorksheet->write($row,14,$commentString,$fmtData);

		# Affected Assets
		if ($includeAssets) {
			$poamWorksheet->write($row,15,$poamRow->{'assets'},$fmtData);
		}
	}
}	

# Pad out the remaining template rows
do {
	$rowNum++;
	my $row = $rowNum + 6;
	$poamWorksheet->write($row,0,$rowNum,$fmtDataBold);
	$poamWorksheet->write_row($row,1,['','','','','','','','','','','','','','',''],$fmtData);
} until ($rowNum == 3993); # creates 4000 rows

$workbook->close();

############################
# Send the file            
############################
my $reportPrefix = "POAM-" . $packageInfo->{'name'};
if ($stigId && $stigId ne 'undefined') {
	$reportPrefix .= "-$stigId";
}
if ($dept && $dept ne 'undefined' && $dept ne '--Any--') {
	$reportPrefix .= "-Dept_$dept";
}
if ($domain && $domain ne 'undefined' && $domain ne '--Any--') {
	$reportPrefix .= "-Group_$domain";
}
open(my $XLSFH,"<$xls") or die "Can't open $xls";
binmode($XLSFH);
my $datedFile = sprintf ("${reportPrefix}_%04d-%02d-%02dT%02d%02d.xlsx",$year+1900,$mon+1,$mday,$hour,$min);
print "Content-Type: application/vnd.ms-excel\n";
print "Content-Disposition: attachment;filename=$datedFile\n\n";
while (<$XLSFH>) {
	print;
}
close($XLSFH);
unlink($xls);
