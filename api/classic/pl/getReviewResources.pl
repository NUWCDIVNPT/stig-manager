#!/usr/bin/perl
# $Id: getReviewResources.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$db = $STIGMAN_DB;
$q = CGI->new;
$checkId = $q->param('checkId');
($assetId,$ruleId) = split("!",$checkId);
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

$dbh->do("alter session set nls_date_format='yyyy-mm-dd hh24:mi:ss'");

$resources = {};

#################################
# Get the metadata
#################################

$metadataSql=<<END;
select
  r.reviewId as "reviewId",
  r.autoState as "autoState",
  r.userId as "userId",
  ud.name as "userName",
  r.ts as "lastSaved",
  r.statusId as "statusId"
from
	reviews r
	left join user_data ud on r.userId=ud.id
where
	r.assetId = ? and
	r.ruleId = ?
END

$metadataHash = $dbh->selectrow_hashref($metadataSql,undef,($assetId,$ruleId));
$metadataRows = [];
foreach $key (sort keys %$metadataHash){
	push (@$metadataRows, [$key,$metadataHash->{$key}]);
}

$resources->{'metadata'} = $metadataRows;

#################################
# Get the feedback
#################################
$rejectIdsSql=<<END;
select
	rrs.rejectId as "rejectId"
from
	review_reject_string_map rrs
where
	rrs.assetId = ? and
	rrs.ruleId = ?
END
$rejectTextSql =<<END;
select 
	r.rejectText as "rejectText"
from
	reviews r
where
	r.assetId = ? and
	r.ruleId = ?
END

$feedbackHash = {};
$feedbackHash->{'rejectIds'} = $dbh->selectcol_arrayref($rejectIdsSql,undef,($assetId,$ruleId));
($feedbackHash->{'rejectText'}) = $dbh->selectrow_array($rejectTextSql,undef,($assetId,$ruleId));
$resources->{'feedback'} = $feedbackHash;

#######################################
# Get attachments
#######################################
$sqlGetAttachments =<<END;
SELECT
	ra.raId as "raId",
	art.artId as "artId",
	art.sha1 as "sha1",
	art.filename as "filename",
	art.description as "description",
	art.ts as "ts",
	ud.name as "userName"
FROM
	review_artifact_map ra
	left join artifacts art on art.artId=ra.artId
	left join user_data ud on ud.id=art.userId
WHERE
	ra.assetId = ?
	and ra.ruleId = ?
ORDER BY
	art.filename
END
$attachmentsRows = $dbh->selectall_arrayref($sqlGetAttachments,{ Slice => {} },($assetId,$ruleId));
$numRecords = @$attachmentsRows;
$resources->{'attachments'} = {
'records' => int $numRecords,
'rows' => $attachmentsRows
};											
#######################################
# Get history
#######################################
$sqlHistory=<<END;
select
	rh.ts as "ts",
	rh.activityType as "activityType",
	rh.columnName as "columnName",
	rh.oldValue as "oldValue",
	rh.newValue as "newValue",
	rh.userId as "userId",
	ud.name as "userName"
FROM
	reviews_history rh
	left join user_data ud on ud.id=rh.userId
where
	rh.ruleId = ? and
	rh.assetId = ?
	/* don't want to handle 'rejectText' yet */
	and rh.columnName != 'rejectText'
order by 
	rh.ts asc,rh.columnName desc
END
$historyRows = $dbh->selectall_arrayref($sqlHistory,{ Slice => {} },($ruleId,$assetId));
$numRecords = @$historyRows;
$resources->{'history'} = {
	'records' => int $numRecords,
	'rows' => $historyRows
};

#################################
# Package it up
#################################
$json = encode_json $resources;

print "Content-Type: text/html\n\n";
print $json;

#print "{\"records\": \"$numRecords\",\"rows\": $json}\n";



