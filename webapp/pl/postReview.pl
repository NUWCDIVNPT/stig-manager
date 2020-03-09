#!/usr/bin/perl

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

$db = "stigman";
$q = CGI->new;
$updateStats = $q->param('updateStats');
$userId = $q->param('userId');
$assetId = $q->param('assetId');
$ruleId = $q->param('ruleId');
$type = $q->param('type');
# save types:
	# save
	# save and submit
	# save and unsubmit
	# submit
	# unsubmit

$state = $q->param('state');
#$autoState = $q->param('autoState');
$stateComment = $q->param('stateComment');
$action = ($q->param('action') ? $q->param('action') : undef);
$actionComment = ($q->param('actionComment') ? $q->param('actionComment') : undef);

$stigmanId = $q->cookie('stigmanId');
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
}
$dbh->do("alter session set nls_date_format='yyyy-mm-dd hh24:mi:ss'");

if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
#Should we use the userId supplied as an argument or the userId from the environment?
$userId = $userObj->{'id'};

if ($type eq 'submit') {
	$sql = "update reviews set statusId=1,userId=? where assetId=? and ruleId=?";
	@params = ($userId,$assetId,$ruleId);
} elsif ($type eq 'unsubmit') {
	$sql = "update reviews set statusId=0,userId=? where assetId=? and ruleId=?";
	@params = ($userId,$assetId,$ruleId);
} elsif ($type eq 'save' || $type eq 'save and submit' || $type eq 'save and unsubmit' ) {
	# check if review exists and get the autostate
	$sqlExists=<<END;
	SELECT autoState,stateId
	FROM reviews r
	where assetId=?
	and ruleId=?
END
	$isUpdate = (($autoState,$curStateId) = $dbh->selectrow_array($sqlExists,undef,($assetId,$ruleId)));
	if ($isUpdate) { # record exists
		$sql =<<END;
		update
			reviews
		set
			actionId=?,
			actionComment=?,
			userId=?
END
		@params = ($action,$actionComment,$userId);
		if ($autoState != 1 || ($autoState == 1 and $curStateId == 2)) { # only manual reviews can be changed (or autoState NAs)
			$sql .=<<END;
			,stateId=?
			,stateComment=?
			,autoState = 0
END
			push(@params,($state,$stateComment));
		}
		
		# Should we change the statusId?
		if ($type eq 'save and submit') {
			$sql .= ",statusId=1";
		} elsif ($type eq 'save and unsubmit') {
			$sql .= ",statusId=0";
		}
		$sql .= " where assetId=? and ruleId=?";
		push(@params,($assetId,$ruleId));
	} else { # create new record
		$sql =<<END;
		insert into reviews(assetId,ruleId,stateId,stateComment,actionId,actionComment,userId,statusId)
		VALUES (?,?,?,?,?,?,?,?)
END
		@params = ($assetId,$ruleId,$state,$stateComment,$action,$actionComment,$userId);
		if ($type eq 'save and submit') {
			push(@params,1);
		} else {
			push(@params,0);
		}
	}
}
	
#print "\n\nSQL = $sql\n";
$sth = $dbh->prepare($sql);
$rv = $sth->execute(@params);

print "Content-Type: text/html\n\n";
if ($rv) {
	# Get the new state of the rule
	$sql =<<END;
SELECT
	st.abbr as "abbr",
	CASE WHEN r.stateId != 4
	THEN
	  CASE WHEN r.stateComment != ' ' and r.stateComment is not null
		THEN 1
		ELSE 0 END
	ELSE
	  CASE WHEN r.actionId is not null and r.actionComment is not null and r.actionComment != ' '
		THEN 1
		ELSE 0 END
	END as "done",
	ud.name as "name",
	r.ts as "ts",
	r.statusId as "statusId",
	r.ts||' by '||ud.name as "editStr"
FROM 
	reviews r
	left join states st on r.stateId=st.stateId
	left join user_data ud on r.userId=ud.id
where 
	r.assetId=?
	and r.ruleId=?
END
	($abbr,$done,$userName,$ts,$statusId,$editStr) = $dbh->selectrow_array($sql,undef,($assetId,$ruleId));
	
	if ($updateStats eq "true") {
		# Update the asset/stig statistics
		$stigIds = getStigFromAssetRule($assetId,$ruleId,$dbh);
		foreach $stigId (@$stigIds) {
			updateStatsAssetStig($assetId,$stigId,$dbh);
		}
	}
	$resultHash = {
		'success' => \1,
		'stateAbbr' => $abbr,
		'done' => $done,
		'userName' => $userName,
		'ts' => $ts,
		'stats' => ( $updateStats eq 'true' ? \1 : \0 ),
		'editStr' => $editStr,
		'statusId' => int $statusId
	};
} else {
	$resultHash = {
		'success' => \0,
		'errstr' => $sth->errstr
	}
}
$json = encode_json $resultHash;
print $json;
