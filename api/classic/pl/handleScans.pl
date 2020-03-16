#!/usr/bin/perl

use strict;
use warnings;
use DBI;
use JSON::XS;
use CGI;
#use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
# use Log::Log4perl qw(:easy);
# Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>test.log" } );

##############################################
# Initialize
##############################################
# $MAX_SCAN_AGE is subtracted from today to
# determine the earliest scan date that will be
# returned by requests that list scans 
my $MAX_SCAN_AGE = 45;
# The dispatch table, maps requests to subroutines
my $dt = {
		'getBrowseTargets' => \&getBrowseTargets,
		'scanSummary' => \&scanSummary,
		'scanDetail' => \&scanDetail,
		'assign' => \&assign,
		'pkgScanSummary' => \&pkgScanSummary,
		'pkgScanDetail' => \&pkgScanDetail,
		'batch' => \&batch
};
# Global error table, maps error numbers to error strings
my $errors = {
	'101' => "No authentication token",
	'102' => "Missing parameter (req)",
	'103' => "Unknown value for (req)",
	'104' => "Missing parameter (reqd)",
	'105' => "Failed to decode parameter (reqd)",
	'106' => "Failed to connect to database",
	'107' => "Unauthorized",
	'108' => "Unsupported nested 'batch' request"
};

##############################################
# Process CGI parameters
##############################################
my $q = CGI->new;
my $stigmanId = $q->cookie('stigmanId') or fatalError(101);
# Is there a request?
my $req = $q->param('req') or fatalError(102);
# Can we handle it?
$dt->{$req} or fatalError(103);
# Is there request data?
my $p_reqd = $q->param('reqd') or fatalError(104);
#  Can we decode it?
my $reqd;
eval {
	$reqd = decode_json $p_reqd;
};
if ($@) {
	fatalError(105);
}

##############################################
# Database connection
##############################################
my $dbhStigman;
if (!($dbhStigman = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	fatalError(106);
};

##############################################
# User authorization
##############################################
my $userObj;
if (!($userObj = getUserObject($stigmanId,$dbhStigman,$q))) {
	fatalError(107);
}
if ($userObj->{'role'} ne 'Staff') {
	fatalError(107);
}

##############################################
# Dispatch the request to the corresponding
# subroutine and print the result.
#
# All subroutines are passed the same three arguments,
# but only the 'batch' request uses $dt:
#		$reqd: hashref  The request data
#		$dbh: object  A database handle
#		$dt: hashref  The dispatch table
##############################################
my $returnObject = $dt->{$req}->($reqd,$dbhStigman,$dt);

print "Content-Type: application/json\n\n";
print encode_json($returnObject);
exit;


##############################################
# SUBROUTINES
##############################################

##
## fatalError()
##
## Arguments:
##		$errNum: int  The error number from the global %errors
##
## Returns: undef
##
## Prints a Content-Type header and a JSON encoded error object, 
## then exits the script
##
sub fatalError {
	my ($errNum) = @_;
	print "Content-Type: application/json\n\n";
	print encode_json({
		'success' => \0,
		'error' => $errNum,
		'errorStr' => $errors->{$errNum}
	});
	exit;
}

##
## getBrowseTargets()
##
## Arguments:
##		$reqd: hashref  Required keys: packageId, targetType
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) records, rows 
##						(if !success) errorStr, errorDetail [optional]
##
## Gets the target items that can be passed 
## as an argument to the scanSummary suboutine
##
sub getBrowseTargets {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	my $packageId = $reqd->{'packageId'};
	my $targetType = $reqd->{'targetType'};
	if (!($packageId) || !($targetType)) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Missing a required property in (reqd)";
		return $ro;
	}
	my @params = ($packageId);
	my $sql;
	if ($targetType eq 'asset') {
		$sql =<<E;
			select 
				ap.assetId as "targetId"
				,a.name||' ('||NVL(a.ip,'--')||')' as "target"
				,CASE WHEN ap.scanresultId is not null THEN 1 ELSE 0 END as "assigned"
			from
				asset_package_map ap
				left join assets a on a.ASSETID=ap.ASSETID
			where
				ap.PACKAGEID = ?
				and a.nonnetwork = 0
				and a.scanexempt = 0
			order by
				a.name ASC
E
	} elsif ($targetType eq 'scan'){
		$sql =<<E;
			select
			  sr.SCANRESULTID as "targetId"
			  ,sr.SCANRESULTID || ' (' || sr.NAME || ')'  as "target"
			  ,SUM(CASE WHEN apm.scanresultid=sr.scanresultId THEN 1 ELSE 0 END) as "assigned"
			from
			  stigman.packages p
			  left join ASSET_PACKAGE_MAP apm on apm.PACKAGEID=p.PACKAGEID
			  inner join vars_2.scan_results sr on sr.REPOSITORYID=p.REPOSITORYID
			where
			  p.PACKAGEID = ?
			  and sr.DETAILS LIKE '%IAVM Policy%'
			  and sr.STARTTIME >= trunc(SYSDATE-$MAX_SCAN_AGE) 
			group by
			  sr.scanresultId
			  ,sr.name
			  ,sr.STARTTIME
			order by
				sr.SCANRESULTID desc
E
	} else {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Unknown value for 'targetType' in (reqd)";
		return $ro;
	}
	
	my $arrayref;
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'success'} = \1;
	$ro->{'records'} = @$arrayref;
	$ro->{'rows'} = $arrayref;
	return $ro;
}

##
## scanSummary()
##
## Arguments:
##		$reqd: hashref  Required keys: packageId, targetType, targetId
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) records, rows
##						(if !success) errorStr, errorDetail [optional] 
##
## Gets summaries of the scan results for the targetId
##
sub scanSummary {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	my $sql;
	my @params;
	if ($reqd->{'targetType'} eq 'asset') {
		if (!($reqd->{'packageId'}) || !($reqd->{'targetType'}) || !($reqd->{'targetId'})) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "Missing a required property in (reqd)";
			return $ro;
		}
		@params = ($reqd->{'packageId'},$reqd->{'targetId'});
		$sql =<<E;
			select
				hh.credentialed as "credentialed"
				,sr.scanresultid as "scanId"
				,sr.name as "scanName"
				,apm.assetId as "assetId"
				,a.name as "assetName"
				,TO_CHAR(sr.startTime AT LOCAL,'yyyy-mm-dd hh24:mi:ss') as "scanDate"
				,hh.ip as "ip"
				,NVL(hh.NETBIOSNAME,hh.dnsname) as "scannedName"
				,hhs.fnd_Cnt as "findCnt"
				,hhs.cat1_Sum as "cat1Cnt"
				,hhs.cat2_Sum as "cat2Cnt"
				,hhs.cat3_Sum as "cat3Cnt"
				,sr.scanresultId || '-' || hh.ip as "uniqueId"
				,CASE WHEN apm.scanresultid=sr.scanresultid THEN 1 ELSE 0 END as "isAssigned"
				,CASE WHEN hh.credentialed = 'true' THEN 1 ELSE 0 END as "assignable"
			from
				stigman.packages p
				inner join stigman.ASSET_PACKAGE_MAP apm on apm.PACKAGEID=p.PACKAGEID
				inner join stigman.ASSETS a on a.ASSETID=apm.ASSETID
				inner join vars_2.scan_results sr on sr.REPOSITORYID = p.REPOSITORYID
				inner join vars_2.hosts_history hh on hh.IP=a.ip and hh.SCANRESULTID=sr.SCANRESULTID 
				inner join VARS_2.HOSTS_HISTORY_STATS hhs on hhs.scanresultId=hh.SCANRESULTID and hhs.ip=hh.ip
			where
				p.packageId=?
				and apm.assetId=?
				and sr.DETAILS LIKE '%IAVM Policy%'
				and sr.STARTTIME >= trunc(SYSDATE-$MAX_SCAN_AGE) 
			group by
				hh.credentialed
				,sr.SCANRESULTID
				,sr.name
				,apm.assetId
				,a.name
				,sr.STARTTIME
				,hh.ip
				,hh.netbiosname
				,hh.dnsname
				,hhs.FND_CNT
				,hhs.CAT1_SUM
				,hhs.CAT2_SUM
				,hhs.CAT3_SUM
				,apm.scanresultId
			order by
				sr.SCANRESULTID desc
				,hh.ip
E
	} elsif ($reqd->{'targetType'} eq 'scan') {
		if (!($reqd->{'packageId'}) || !($reqd->{'targetType'}) || !($reqd->{'targetId'})) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "Missing a required property in (reqd)";
			return $ro;
		}
		@params = ($reqd->{'packageId'},$reqd->{'targetId'});
		$sql =<<E;
			select
				hh.credentialed as "credentialed"
				,pkgasset.assetId as "assetId"
				,pkgasset.name as "assetName"
				,sr.scanresultid as "scanId"
				,sr.name as "scanName"
				,TO_CHAR(sr.startTime AT LOCAL,'yyyy-mm-dd hh24:mi:ss') as "scanDate"
				,hh.ip as "ip"
				,NVL(hh.NETBIOSNAME,hh.dnsname) as "scannedName"
				,hhs.fnd_Cnt as "findCnt"
				,hhs.cat1_Sum as "cat1Cnt"
				,hhs.cat2_Sum as "cat2Cnt"
				,hhs.cat3_Sum as "cat3Cnt"
				,CASE WHEN pkgasset.scanresultid=sr.scanresultid THEN 1 ELSE CASE WHEN pkgasset.scanresultid is not null THEN 2 ELSE 0 END END as "isAssigned"
				,CASE WHEN pkgasset.assetId is not null AND hh.credentialed = 'true' THEN 1 ELSE 0 END as "assignable"
				,sr.scanresultId || hh.ip as "uniqueId"
			  from
				vars_2.scan_results sr
				inner join vars_2.hosts_history hh on hh.SCANRESULTID=sr.SCANRESULTID 
				inner join VARS_2.HOSTS_HISTORY_STATS hhs on hhs.scanresultId=hh.SCANRESULTID and hhs.ip=hh.ip
				left join (select
					a.ip
					,a.assetId
					,a.name
					,apm.scanresultid
				  from
					stigman.packages p
					inner join stigman.asset_package_map apm on apm.PACKAGEID=p.packageId
					inner join stigman.assets a on a.ASSETID=apm.ASSETID
				  where
					p.packageId = ?
					and a.nonnetwork = 0
					and a.scanexempt = 0
					) pkgasset on pkgasset.ip=hh.IP
			where
				sr.scanresultid=?
			group by
				sr.SCANRESULTID
				,sr.name
				,hh.ip
				,hh.NETBIOSNAME
				,hh.DNSNAME
				,hhs.FND_CNT
				,hhs.CAT1_SUM
				,hhs.CAT2_SUM
				,hhs.CAT3_SUM
				,pkgasset.assetId
				,pkgasset.name
				,pkgasset.scanresultId
				,hh.credentialed
				,sr.STARTTIME
			order by
				hh.ip
E
	} elsif ($reqd->{'targetType'} eq 'best') {
		if (!($reqd->{'packageId'}) || !($reqd->{'targetType'})) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "Missing a required property in (reqd)";
			return $ro;
		}
		@params = ($reqd->{'packageId'});
		$sql =<<E;	
			select
				hh.credentialed as "credentialed"
				,apm.assetId as "assetId"
				,a.name as "assetName"
				,a.ip as "ip"
				,hhb.scanresultid as "scanId"
				,sr.name as "scanName"
				,TO_CHAR(sr.startTime AT LOCAL,'yyyy-mm-dd hh24:mi:ss') as "scanDate"
				,NVL(hh.NETBIOSNAME,hh.dnsname) as "scannedName"
				,hhs.FND_CNT as "findCnt"
				,hhs.CAT1_SUM as "cat1Cnt"
				,hhs.CAT2_SUM as "cat2Cnt"
				,hhs.CAT3_SUM as "cat3Cnt"
				,hhb.scanresultId || '-' || a.ip as "uniqueId"
				,CASE WHEN apm.scanresultid=hhb.scanresultid THEN 1 ELSE CASE WHEN apm.scanresultid is not null THEN 2 ELSE 0 END END as "isAssigned"
				,CASE WHEN hh.credentialed = 'true' THEN 1 ELSE 0 END as "assignable"
			from
				stigman.packages p
				inner join stigman.ASSET_PACKAGE_MAP apm on apm.PACKAGEID=p.PACKAGEID
				inner join stigman.ASSETS a on a.ASSETID=apm.ASSETID
				left join VARS_2.HOSTS_HISTORY_BEST hhb on p.REPOSITORYID=hhb.REPOSITORYID and hhb.ip=a.ip
				left join VARS_2.HOSTS_HISTORY hh on hh.SCANRESULTID=hhb.SCANRESULTID and hh.ip=hhb.ip
				left join VARS_2.HOSTS_HISTORY_STATS hhs on hhs.SCANRESULTID=hhb.SCANRESULTID and hhs.ip=hhb.ip
				left join VARS_2.SCAN_RESULTS sr on sr.SCANRESULTID=hhs.SCANRESULTID
			where 
				p.packageId=?
				and a.nonnetwork = 0
				and a.scanexempt = 0
			group by
				hh.credentialed
				,apm.assetId
				,a.name
				,a.ip
				,hhb.SCANRESULTID
				,sr.name
				,sr.STARTTIME
				,hh.NETBIOSNAME
				,hh.dnsname
				,hhs.FND_CNT
				,hhs.CAT1_SUM
				,hhs.CAT2_SUM
				,hhs.CAT3_SUM
				,apm.SCANRESULTID
			order by
				a.name
E
	} else {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Unknown value for 'targetType' in (reqd)";
		return $ro;
	}
	my $arrayref;
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'success'} = \1;
	$ro->{'records'} = @$arrayref;
	$ro->{'rows'} = $arrayref;
	return $ro;
}

##
## scanDetail()
##
## Arguments:
##		$reqd: hashref  Required keys: scanId, ip
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) records, rows, message
##						(if !success) errorStr, errorDetail [optional] 
##
## Gets the individual scan results for an IP within a scanId
##
sub scanDetail {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	if (!($reqd->{'scanId'}) || !($reqd->{'ip'})) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Missing a required property in (reqd)";
		return $ro;
	}
	my $sql;
	my @params = ($reqd->{'scanId'},$reqd->{'ip'});
	my $sqlVulnDetail =<<E;
		SELECT 
			vh.pluginId as "pluginId"
			,vh.protocol as "protocol"
			,vh.port as "port"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(vh.pluginOutput)),CHR(10),'<br>') as "pluginOutput"
			,fp.name as "pluginName"
			,decode(fp.severity, 4, 'Critical', 3, 'High', 2, 'Medium', 1, 'Low') as "severity"
			,NVL(fp.stigSeverity,'--') as "stigSeverity"
			,fp.cat as "cat"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(fp.description)),CHR(10),'<br>') as "description"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(fp.solution)),CHR(10),'<br>') as "solution"
		FROM
			vars_2.vulns_history vh
			left join vars_2.found_plugins fp on fp.pluginId=vh.pluginId
		where
			vh.scanResultId = ?
			and vh.ip = ?
		group by
			vh.pluginId
			,vh.protocol
			,vh.port
			,vh.pluginOutput
			,fp.name
			,fp.severity
			,fp.stigSeverity
			,fp.cat
			,fp.description
			,fp.solution
		order by
			vh.pluginId
			,vh.protocol
			,vh.port
E
	my $sqlHostDetail =<<E;
		SELECT
			NVL(hh.os,'--') as "OS"
			,NVL(upper(hh.mac),'--') as "MAC"
		from
			VARS_2.HOSTS_HISTORY hh
		where
			hh.scanResultId = ?
			and hh.ip = ?
E
	my $vulnArrayref;
	my $hostHashref;
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$vulnArrayref = $dbhStigman->selectall_arrayref($sqlVulnDetail,{ Slice => {} },@params);
		$hostHashref = $dbhStigman->selectrow_hashref($sqlHostDetail,undef,@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'success'} = \1;
	$ro->{'records'} = @$vulnArrayref;
	$ro->{'rows'} = $vulnArrayref;
	$ro->{'message'} = $hostHashref;
	return $ro;
}	

##
## assign()
##
## Arguments:
##		$reqd: hashref  Required keys: 
##			packageId: string
##			assign: array of hashrefs  Required keys: scanId, assetId
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) assignments
##						(if !success) errorStr, errorDetail [optional] 
##
## Updates STIGMAN.ASSET_PACKAGE_MAP from an array of assetId/scanId pairs.
## The scanId can be undefined, which corresponds to the "unassign" action. 
## To prevent a resource exhaustion attack, a maximum number of assignments are 
## allowed in one request. The assignments are updated in a transaction
## which will be fail if there is an error in any individual assignment
##
sub assign {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	if (!($reqd->{'packageId'}) || !($reqd->{'assign'})) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Missing a required property in (reqd)";
		return $ro;
	}
	my $assignments = $reqd->{'assign'};
	if (ref($assignments) ne "ARRAY") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The 'assign' property of (reqd) is not an array.";
		return $ro;
	}
	if (scalar @$assignments > 1000) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The 'assign' property of (reqd) is an array with more than 1000 items.";
		return $ro;
	}
	my $sql =<<E;
	UPDATE
		stigman.asset_package_map
	SET
		scanresultId = ?
	WHERE
		packageId = ?
		and assetId = ?
E
	my @params;
	my $origCommit = $dbh->{'AutoCommit'};
	$dbh->{'AutoCommit'} = 0;
	my $x = 0;
	foreach my $assignment (@$assignments) {
		if (ref($assignment) ne "HASH") {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "(reqd) array item $x is not an object.";
			$dbh->rollback;
			$dbh->{'AutoCommit'} = $origCommit;
			return $ro;
		}
		if (!($assignment->{'assetId'})) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "Missing required property 'assetId' in (reqd) array item $x";
			$dbh->rollback;
			$dbh->{'AutoCommit'} = $origCommit;
			return $ro;
		}
		eval {
			local $dbh->{'PrintError'} = 0;
			local $dbh->{'RaiseError'} = 1;
			$dbh->do($sql,undef,($assignment->{'scanId'},$reqd->{'packageId'},$assignment->{'assetId'}));
		};
		if ($@) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "Update error for array item $x";
			$ro->{'errorDetail'} = $@;
			$dbh->rollback;
			$dbh->{'AutoCommit'} = $origCommit;
			return $ro;
		}
		$x++;
	}
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$dbh->commit;
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Commit error";
		$ro->{'errorDetail'} = $@;
		$dbh->rollback;
		$dbh->{'AutoCommit'} = $origCommit;
		return $ro;
	}
	$dbh->{'AutoCommit'} = $origCommit;
	$ro->{'success'} = \1;
	$ro->{'assignments'} = $assignments;
	return $ro;
}

##
## pkgScanSummary()
##
## Arguments:
##		$reqd: hashref  Required key: packageId
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) records, rows, asset_score
##						(if !success) errorStr, errorDetail [optional] 
##
## Gets a summary of the current package scan and statistics
## about the current package scan
##
sub pkgScanSummary {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	if (!($reqd->{'packageId'})) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Missing the required 'packageId' property in (reqd)";
		return $ro;
	}
	my $sql;
	my @params=($reqd->{'packageId'});
	$sql =<<E;
		select
			fp.cat as "cat"
			,decode(fp.severity, 4, 'Critical', 3, 'High', 2, 'Medium', 1, 'Low') as "severity"
			,NVL(fp.stigseverity,'--') as "stigSeverity"
			,pf.pluginid as "pluginId"
			,fp.name as "pluginName"
			,count(pf.pluginId) as "occurrences"
			,count (distinct pf.assetId) as "assetCnt"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(fp.description)),CHR(10),'<br>') as "description"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(fp.solution)),CHR(10),'<br>') as "solution"
		from
			stigman.PKG_FINDINGS pf
			left join VARS_2.FOUND_PLUGINS fp on fp.pluginId=pf.PLUGINID
		where
			pf.packageId = ?
		group by
			pf.pluginid
			,fp.name
			,fp.description
			,fp.solution
			,fp.severity
			,fp.cat
			,fp.stigseverity
		order by
			"cat" asc
			,"occurrences" desc
			,pf.pluginId
E
	my $arrayref;
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'records'} = @$arrayref;
	$ro->{'rows'} = $arrayref;

	$sql =<<E;
		select
			count(apm.assetId) as "totalAssets"
			,sum(case when apm.scanresultid is not null THEN 1 ELSE 0 END) as "assignedAssets" 
			,NVL(TO_CHAR(min(sr.starttime) + $MAX_SCAN_AGE,'yyyy-mm-dd'),'--') as "lastSubmit"
			,count(distinct apm.scanresultId) as "distinctScans"
		from
			stigman.asset_package_map apm
			left join stigman.assets a on a.assetId=apm.assetId
			left join VARS_2.SCAN_RESULTS sr on sr.SCANRESULTID=apm.SCANRESULTID
		where
			apm.packageId = ?
			and a.nonnetwork = 0
			and a.scanexempt = 0
E
	my $hashref;
	eval {
		$hashref = $dbh->selectrow_hashref($sql,{ Slice => {} },@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'asset_score'} = $hashref;
	$ro->{'success'} = \1;
	return $ro;
}

##
## pkgScanDetail()
##
## Arguments:
##		$reqd: hashref  Required keys: packageId, pluginId
##		$dbh: object  A database handle
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) records, rows
##						(if !success) errorStr, errorDetail [optional]
##
## Gets the details of the findings for a pluginId in the current package scan 
##
sub pkgScanDetail {
	my ($reqd, $dbh) = @_;
	my $ro = {};
	if (ref($reqd) ne "HASH") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an object.";
		return $ro;
	}
	if (!($reqd->{'packageId'}) || !($reqd->{'pluginId'})) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Missing a required property in (reqd)";
		return $ro;
	}
	my $sql;
	my @params = ($reqd->{'packageId'},$reqd->{'pluginId'});
	$sql=<<E;
		select
			pf.SCANRESULTID as "scanId"
			,pf.ASSETID as "assetId"
			,a.NAME as "assetName"
			,a.IP as "ip"
			,UPPER(pf.protocol) || ' ' || pf.port as "port"
			--,pf.port as "port"
			,TO_CHAR(sr.startTime AT LOCAL,'yyyy-mm-dd hh24:mi:ss') as "scanDate"
			,sr.NAME as "scanName"
			,REPLACE(TRIM(BOTH CHR(10) FROM htf.escape_sc(pf.PLUGINOUTPUT)),CHR(10),'<br>') as "pluginOutput"
		from
			STIGMAN.PKG_FINDINGS pf
			left join STIGMAN.ASSETS a on a.ASSETID=pf.ASSETID
			left join VARS_2.SCAN_RESULTS sr on sr.SCANRESULTID=pf.SCANRESULTID
		where
			pf.PACKAGEID = ?
			and pf.PLUGINID = ?
E
	my $arrayref;
	eval {
		local $dbh->{'PrintError'} = 0;
		local $dbh->{'RaiseError'} = 1;
		$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	};
	if ($@) {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "Query error";
		$ro->{'errorDetail'} = $@;
		return $ro;
	}
	$ro->{'success'} = \1;
	$ro->{'records'} = @$arrayref;
	$ro->{'rows'} = $arrayref;
	return $ro;
}

##
## batch()
##
## Arguments:
##		$reqd: arrayref  An array of hashrefs, each with required keys: req, reqd.
##		$dbh: object  A database handle
##		$dt:  hashref  The dispatch table
##
## Returns: hashref  The response object.
##						Keys:	success
##						(if success) batch
##						(if !success) errorStr, error [optional] 
##
## Invokes multiple requests in series, dispatching each to the appropriate  
## handler and pushing the returned data onto a single response object
##
sub batch {
	my ($reqd, $dbh, $dt) = @_;
	my $ro = {};
	if (ref($reqd) ne "ARRAY") {
		$ro->{'success'} = \0;
		$ro->{'errorStr'} = "The (reqd) property is not an array.";
		return $ro;
	}
	my $x = 0;
	my $batch = [];
	$ro->{'batch'} = $batch;
	foreach my $i (@$reqd) {
		if (ref($i) ne "HASH") {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "The (reqd) array item $x is not an object.";
			return $ro;
		}
		if (!($i->{'req'}) || !($i->{'reqd'})) {
			$ro->{'success'} = \0;
			$ro->{'errorStr'} = "The (reqd) array item $x is missing property (req) or (reqd)";
			return $ro;
		}
		my $i_req = $i->{'req'};
		if ($i_req eq 'batch') {
			push(@$batch,{
				'success' => \0,
				'error' => 108,
				'errorStr' => $errors->{'108'}
			});
		}
		if (!$dt->{$i_req}) {
			push(@$batch,{
				'success' => \0,
				'error' => 103,
				'errorStr' => $errors->{'103'}
			});
		}
		my $i_reqd = $i->{'reqd'};
		push(@$batch,$dt->{$i_req}->($i_reqd,$dbh));
		$x++;
	}
	$ro->{'success'} = \1;
	return $ro;
}
