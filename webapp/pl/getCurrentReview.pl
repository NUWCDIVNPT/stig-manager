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
$assetId = $q->param('assetId');
$ruleId = $q->param('ruleId');
$stigmanId = $q->cookie('stigmanId');
if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Could not connect to the database.\"}\n";	
	exit;
}

$dbh->do("alter session set nls_date_format='yyyy-mm-dd hh24:mi:ss'");

if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	print "Content-Type: text/html\n\n";
	print "{\"success\": false,\"error\": \"Invalid user.\"}\n";	
	exit;
}
$userId = $userObj->{'id'};
$dept = $userObj->{'dept'};

$returnObject = {
	'success' => \1,
	'review' => {},
	'others' => {
		'records' => int 0,
		'rows' => []
	},
	'attachments' => {
		'records' => int 0,
		'rows' => []
	},
	'history' => {
		'records' => int 0,
		'rows' => []
	},
	'last_column_history' => {
		'records' => int 0,
		'rows' => []
	},
	'rejectHtml' => ''
};
print "Content-Type: text/html\n\n";

###############################
# Get the review
###############################
$sqlReview=<<END;
select
  r.stateId as "state",
  r.stateComment as "stateComment",
  r.actionId as "action",
  r.actionComment as "actionComment",
  decode (r.reqDoc,0,'off','on') as "requiresDoc",
  r.userId as "userId",
  r.ts||' by '||u.name as "editStr",
  r.ts as "editorts",
  u.name as "editor",
  r.autoState as "autoState",
  r.statusId as "statusId"
from
  reviews r
  left join user_data u on r.userId=u.id
where
	r.assetId=?
	and r.ruleId=?
END

$reviewRef = $dbh->selectall_arrayref($sqlReview,{ Slice => {} },($assetId,$ruleId));
$numRecords = @$reviewRef;
if ($numRecords > 0) {
	$returnObject->{'review'} = $reviewRef->[0];
}
#######################################
# Get the others
#######################################
$sqlOthers=<<END;
select 
	r.reviewId as "reviewId",
	NVL(u.name,'UnknownUser') as "user",
	sv.name as "asset",
	sv.domain as "assetGroup",
	sv.dept as "dept",
	r.stateId as "stateId",
	s.state as "state",
	r.stateComment as "stateComment",
	r.reqDoc as "reqDoc",
	r.actionId as "actionId",
	a.action as "action",
	r.actionComment as "actionComment",
	r.autostate as "autostate" 
FROM
	reviews r
	left join states s on r.stateId=s.stateId
	left join actions a on r.actionId=a.actionId
	left join assets sv on r.assetId=sv.assetId
	left join user_data u on r.userId=u.id
where
	r.ruleId = ? and
	r.assetId != ?
order by
	sv.name
END
$othersRows = $dbh->selectall_arrayref($sqlOthers,{ Slice => {} },($ruleId,$assetId));
$numRecords = @$othersRows;
$returnObject->{'others'} = {
	'records' => int $numRecords,
	'rows' => $othersRows
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
	-- don't want to handle 'rejectText' yet
	and rh.columnName != 'rejectText'
order by 
	rh.ts asc,rh.columnName desc
END
$historyRows = $dbh->selectall_arrayref($sqlHistory,{ Slice => {} },($ruleId,$assetId));
$numRecords = @$historyRows;
$returnObject->{'history'} = {
	'records' => int $numRecords,
	'rows' => $historyRows
};
# #######################################
# # Get last_changes
# #######################################
# # $sqlLastColumnHistory=<<END;
# # CALL usp_getLastColumnHistoryByAssetRule(?,?)
# # END
# # $lastColumnHistoryRows = $dbh->selectall_arrayref($sqlLastColumnHistory,{ Slice => {} },($assetId,$ruleId));
# # $numRecords = @$lastColumnHistoryRows;
# # $returnObject->{'last_column_history'} = {
	# # 'records' => int $numRecords,
	# # 'rows' => $lastColumnHistoryRows
# # };

# #######################################
# # Get rejection strings
# #######################################
$rejectHtml = '';
if (int $returnObject->{'review'}->{'statusId'} == 2) { # review has 'reject' status
	$sqlRejectStrs=<<END;
	select
		rs.shortStr as "shortStr",
		rs.longStr as "longStr"
	from 
		stigman.review_reject_string_map rrs
		left join stigman.reject_strings rs on rs.rejectId=rrs.rejectId
	where
		rrs.assetId = ? and
		rrs.ruleId = ?
END
		$rejectTextSql =<<END;
	select 
		r.rejectText as "rejectText",
		ud.name as "name"
	from
		stigman.reviews r
		left join stigman.user_data ud on ud.id=r.rejectUserId
	where
		r.assetId = ? and
		r.ruleId = ?
END
	$rejectStrs = $dbh->selectall_arrayref($sqlRejectStrs,{Slice=>{}},($assetId,$ruleId));
	($rejectText,$rejectUsername) = $dbh->selectrow_array($rejectTextSql,undef,($assetId,$ruleId));
	if (scalar @$rejectStrs || $rejectText) {
		#$rejectHtml = '<div class="sm-feedback-panel-active">';
		if (scalar @$rejectStrs) {
			$rejectHtml .= "<div class=sm-feedback-body-title>Standard Feedback<div class=sm-feedback-body-text><ul>";
			foreach $rejectStr (@$rejectStrs) {
				$rejectHtml .= "<li><b>" . $rejectStr->{'shortStr'} . "</b> " . $rejectStr->{'longStr'}
			}
			$rejectHtml .= "</ul></div></div>";
		}
		if ($rejectText) {
			$rejectHtml .= "<div class=sm-feedback-body-title>Custom Feedback<div class=sm-feedback-body-text>$rejectText</div></div>";
		}
		if ($rejectUsername) {
			$rejectHtml .= "<div class=sm-feedback-body-text><i>- Feedback from " . $rejectUsername . "</i></div>";
		}
	}
}
$returnObject->{'rejectHtml'} = $rejectHtml;

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
	stigman.review_artifact_map ra
	left join stigman.artifacts art on art.artId=ra.artId
	left join stigman.user_data ud on ud.id=art.userId
WHERE
	ra.assetId = ?
	and ra.ruleId = ?
ORDER BY
	art.filename
END
$attachmentsRows = $dbh->selectall_arrayref($sqlGetAttachments,{ Slice => {} },($assetId,$ruleId));
$numRecords = @$attachmentsRows;
$returnObject->{'attachments'} = {
'records' => int $numRecords,
'rows' => $attachmentsRows
};											


$json = encode_json $returnObject;
print $json;




