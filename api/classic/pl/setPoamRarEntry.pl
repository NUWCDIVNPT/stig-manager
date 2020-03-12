#!/usr/bin/perl
# $Id: setPoamRarEntry.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$db = 'stigman';
$q = CGI->new;

# create a hash with all params, replacing the empty strings with undef
$p = { map { $_ => $q->param($_) eq '' ? undef : scalar $q->param($_) } $q->param() };
$stigmanId = $q->cookie('stigmanId');

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

$sqlInsert =<<END;
INSERT into poam_rar_entries (
	iaControl,
	status,
	poc,
	resources,
	compDate,
	milestone,
	poamComment,
	likelihood,
	recCorrAct,
	mitDesc,
	residualRisk,
	remDesc,
	rarComment,
	packageId,
	findingType,
	sourceId)
VALUES 
	(?,?,?,?,TO_DATE(?,'yyyy-mm-dd'),?,?,?,?,?,?,?,?,?,?,?)
END

$sqlUpdate =<<END;
UPDATE poam_rar_entries
SET
	iaControl = ?,
	status = ?,
	poc = ?,
	resources = ?,
	compDate = TO_DATE(?,'yyyy-mm-dd'),
	milestone = ?,
	poamComment = ?,
	likelihood = ?,
	recCorrAct = ?,
	mitDesc = ?,
	residualRisk = ?,
	remDesc = ?,
	rarComment = ?
WHERE
	packageId = ?
	AND findingType = ?
	AND sourceId = ?
END

@params = (
	$p->{'iaControl'},
	$p->{'status'},
	$p->{'poc'},
	$p->{'resources'},
	$p->{'compDate'},
	$p->{'milestone'},
	$p->{'poamComment'},
	$p->{'likelihood'},
	$p->{'recCorrAct'},
	$p->{'mitDesc'},
	$p->{'residualRisk'},
	$p->{'remDesc'},
	$p->{'rarComment'},	
	$p->{'packageId'},
	$p->{'findingType'},
	$p->{'sourceId'},
);
$sthInsert = $dbh->prepare($sqlInsert);
$sthUpdate = $dbh->prepare($sqlUpdate);
$rv = $sthUpdate->execute(@params);
if ($rv == 0) { # no record to update, do insert instead
	$rv = $sthInsert->execute(@params);
}
print "Content-Type: text/html\n\n";
if ($rv) {
	# Get the new doneness of the entry
	
	my $sql;
	if ($p->{'findingType'} eq 'stig')
	{
		# This assumes the severity (CAT) of a group (V-number) is the same for all child rules
		# We'll end up using only the first row of this result set
		$sql =<<END;
		select
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
			END as "rarDone"
		from
			stigman.poam_rar_entries pre
			left join stigman.packages p on p.packageId=pre.packageId
			left join stigs.current_group_rules cr on cr.groupId=pre.sourceId
			left join stigs.rules ru on ru.ruleId=cr.ruleId
			left join stigs.severity_cat_map sc on sc.severity=ru.severity
		where
			pre.packageId = ?
			and pre.findingType = ?
			and pre.sourceId = ?
		
END
	} elsif ($p->{'findingType'} eq 'nessus')
	{
		$sql =<<END;
		select
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
						CASE WHEN pre.residualRisk > fp.cat
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
			END as "rarDone"
		from
			stigman.poam_rar_entries pre
			left join vars_2.found_plugins fp on fp.pluginId=pre.sourceId
		where
			pre.packageId = ?
			and pre.findingType = ?
			and pre.sourceId = ?
END
	}
	($poamDone,$rarDone) = $dbh->selectrow_array($sql,undef,($p->{'packageId'},$p->{'findingType'},$p->{'sourceId'}));

	$resultHash = {
		'success' => \1,
		'poamDone' => $poamDone,
		'rarDone' => $rarDone
	};
} else {
	$resultHash = {
		'success' => \0
	};
}
$json = encode_json $resultHash;
print $json;
