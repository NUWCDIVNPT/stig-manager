#!/usr/bin/perl
# $Id: getPoamFindings.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use Text::CSV;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = $STIGMAN_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');
$context = $q->param('context');
$dept = $q->param('dept');
$domain = $q->param('domain');
$showUnapproved = $q->param('showUnapproved');
$csv = $q->param('csv');

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
$classification = getClassification();
$userId = $userObj->{'id'};

@bindValues = ($packageId);
if ($context eq 'stig') {
	$sqlStigCondition = "and sa.stigId=?";
	push(@bindValues,$stigId);
} else {
	$sqlStigCondition = "and sa.stigId is not null";
}

if ($dept ne '--Any--' && $dept) { # $dept is defined and is not "Any"
	$sqlDeptCondition = 'and a.dept=?';
	push(@bindValues,$dept);
} else {
	$sqlDeptCondition = '';
}

if ($domain ne '--Any--' && $domain) { # $domain is defined and is not "Any"
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


$sqlStigs=<<END;
select
	'stig' as "findingType",
	MAX(ru.title) as "title",

	-- Is the POAM entry complete?
	-- All finding types must meet initial conditions
	CASE WHEN pre.status is not null
		AND pre.iaControl is not null
		AND pre.compDate is not null
		AND pre.milestone is not null
	THEN
		CASE WHEN pre.status = 'Ongoing'
		THEN -- The status is 'Ongoing'
			CASE WHEN pre.residualRisk is not null
			THEN -- Residual Risk value exists
				CASE WHEN pre.residualRisk > TO_NUMBER(sc.cat)
				THEN -- Finding has been mitigated 
					CASE WHEN pre.mitDesc is not null
					THEN 1 -- Have mitigation desc, the POAM entry is complete
					ELSE 0 END -- No mitigation desc, the POAM entry is not complete
				ELSE 1 END -- Finding non-mitigated, the POAM entry is complete
			ELSE 0 END -- No residual risk, the POAM entry is not complete
		ELSE 1 END -- Status other than "Ongoing", the POAM entry is complete
	ELSE 0 -- The POAM entry is not complete
	END as "poamDone",

	-- Is the RAR entry complete?
	-- This is calculated even if the RAR is not required
	CASE WHEN pre.status = 'Ongoing'
	THEN
		-- The status is 'Ongoing'
		CASE WHEN pre.iaControl is not null
			AND pre.likelihood is not null
			AND pre.mitDesc is not null
			AND pre.residualRisk is not null
			AND pre.remDesc is not null
		THEN 1 -- The RAR entry is complete
		ELSE 0 END -- The RAR entry is not complete
	ELSE
		-- The status other than 'Ongoing'
		CASE WHEN pre.status is not null
			AND pre.iaControl is not null
			AND pre.rarComment is not null
		THEN 1 -- The RAR entry is complete
		ELSE 0 END -- The RAR entry is not complete
	END as "rarDone",

	pre.status as "status",
	strdagg_param(param_array(cr.stigId,'<br/>')) as "source",
	STRDAGG_PARAM(PARAM_ARRAY(C.APACRONYM,', ')) as "iaControls",
	sc.cat as "cat",
	cr.groupId as "sourceId",
	strdagg_param(param_array(a.name||' ('||a.domain||')','<br/>')) as "assets",
	count(distinct a.name) as "assetCnt"
from
	stigman.asset_package_map ap
	left join stigman.packages p on ap.packageId=p.packageId
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigs.rules ru on ru.ruleId=cr.ruleId
	left join stigs.groups gr on gr.groupId=cr.groupId
	left join stigs.severity_cat_map sc on sc.severity=ru.severity
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=ru.ruleId)
	left join stigman.poam_rar_entries pre on (pre.packageId=ap.packageId and pre.sourceId=gr.groupId)
	left join STIGS.RULE_CONTROL_MAP RCM on RCM.RULEID=RU.RULEID
	left join IACONTROLS.CCI C on C.CCI=RCM.CONTROLNUMBER
where
	ap.packageId = ?
	$sqlStigCondition
	$sqlDeptCondition
	$sqlDomainCondition
	$sqlApprovedCondition
	and rv.stateId=4
group by
	p.reqRar,
	pre.status,
	pre.iaControl,
	pre.compDate,
	pre.milestone,
	pre.residualRisk,
	pre.poamComment,
	pre.likelihood,
	pre.mitDesc,
	pre.remDesc,
	pre.rarComment,
	sc.cat,
	cr.groupId
END
$sqlNessus=<<END;
select
	'nessus' as "findingType",

	-- Is the POAM entry complete?
	-- All finding types must meet initial conditions
	CASE WHEN pre.status is not null
		AND pre.iaControl is not null
		AND pre.compDate is not null
		AND pre.milestone is not null
	THEN
		CASE WHEN pre.status = 'Ongoing'
		THEN -- The status is 'Ongoing'
			CASE WHEN pre.residualRisk is not null
			THEN -- Residual Risk value exists
				CASE WHEN pre.residualRisk > NVL(decode(TRIM(fp.stigSeverity),'I', 1, 'II', 2, 'III', 3),decode(fp.severity, 4, 1, 3, 1, 2, 2, 1, 3))
				THEN -- Finding has been mitigated 
					CASE WHEN pre.mitDesc is not null
					THEN 1 -- Have mitigation desc, the POAM entry is complete
					ELSE 0 END -- No mitigation desc, the POAM entry is not complete
				ELSE 1 END -- Finding non-mitigated, the POAM entry is complete
			ELSE 0 END -- No residual risk, the POAM entry is not complete
		ELSE 1 END -- Status other than "Ongoing", the POAM entry is complete
	ELSE 0 -- The POAM entry is not complete
	END as "poamDone",

	-- Is the RAR entry complete?
	-- This is calculated even if the RAR is not required
	CASE WHEN pre.status = 'Ongoing'
    THEN
		-- The status is 'Ongoing'
		CASE WHEN pre.iaControl is not null
			AND pre.likelihood is not null
			AND pre.mitDesc is not null
			AND pre.residualRisk is not null
			AND pre.remDesc is not null
			AND pre.recCorrAct is not null
		THEN 1 -- The RAR entry is complete
		ELSE 0 END -- The RAR entry is not complete
    ELSE
		-- The status other than 'Ongoing'
		CASE WHEN pre.status is not null
			AND pre.iaControl is not null
			AND pre.rarComment is not null
		THEN 1 -- The RAR entry is complete
		ELSE 0 END -- The RAR entry is not complete
    END as "rarDone",

	pre.status as "status",
	strdagg_param(param_array('Scan ID '||pf.SCANRESULTID,'<br/>')) as "source",
	'' as "iaControls",
	NVL(decode(TRIM(fp.stigSeverity),'I', 1, 'II', 2, 'III', 3),decode(fp.severity, 4, 1, 3, 1, 2, 2, 1, 3)) as "cat",
	pf.pluginId as "sourceId",
	fp.name as "title",
	strdagg_param(param_array(a.name||' ('||a.domain||')','<br/>')) as "assets",
	count(distinct a.name) as "assetCnt"
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
	--p.reqRar,
	pre.status,
	pre.iaControl,
	pre.compDate,
	pre.milestone,
	pre.residualRisk,
	pre.poamComment,
	pre.likelihood,
	pre.mitDesc,
	pre.remDesc,
	pre.rarComment,
	pre.recCorrAct, 
	pf.pluginId,
	fp.name,
	fp.severity,
	fp.STIGSEVERITY
order by
	pf.pluginId
END

my $sqlAllApAcronyms = "select distinct APACRONYM from IACONTROLS.CCI C where apacronym is not null order by apacronym asc";
my $rev = 4; #<--should be in a config file some day? or limit db to current rev.
my $sqlAllControls = "select distinct CONTROL from IACONTROLS.CCI_CONTROL_MAP CCM where control is not null and ccm.rev = ? order by control asc ";

if (!$csv) {

	my $acronymsRef = $dbh->selectcol_arrayref($sqlAllApAcronyms);
	my $controlsRef = $dbh->selectcol_arrayref($sqlAllControls,undef,($rev));
	my @packageControlValidationSet = (@$acronymsRef,@$controlsRef);
	# my $acronymsJson = encode_json $acronymsRef;
	# my $controlsJson = encode_json $controlsRef;

	my $arrayref = $dbh->selectall_arrayref($sqlStigs,{ Slice => {} },@bindValues);
	if ($context ne 'stig') {
		my $arefNessus = $dbh->selectall_arrayref($sqlNessus,{ Slice => {} },@bindValues);
		push(@$arrayref,@$arefNessus);
	}
	my $numRecords = @$arrayref;
	
		my $responseObject = {
		'records' => $numRecords,
		'classification' => $classification,
		'rows' => $arrayref,
		'packageControlValidationSet' => \@packageControlValidationSet
	};
	
	print "Content-Type: text/html\n\n";	
	print encode_json $responseObject;
	
} else {
	print "Content-Type: text/csv\n";
	#print "Content-Disposition: attachment;filename=($classification) NoncompliantHosts-${packageName}.csv\n\n";
	print "Content-Disposition: attachment;filename=($classification) Findings-${packageName}.csv\n\n";
	my $csv = Text::CSV->new ( { binary => 1 } );
	my $sth = $dbh->prepare($sqlStigs);
	my $rv = $sth->execute(@bindValues);
	$columnNames = $sth->{NAME};
	unshift(@$columnNames,'classification');
	$csv->combine (@$columnNames);
	print $csv->string() . "\n";
	my $arrayref = $sth->fetchall_arrayref();
	foreach $array (@$arrayref) {
		unshift(@$array,"($classification)");
		$csv->combine (@$array);
		print $csv->string() . "\n";
	}
}
