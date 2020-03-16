#!/usr/bin/perl
#$Id: getFindingTexts.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$packageId = $q->param('packageId');
$stigId = $q->param('stigId');
$showUnapproved = $q->param('showUnapproved');
$sourceId = $q->param('sourceId');
$db = 'stigman';
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

my $sqlApprovedCondition;
if ($showUnapproved == 1) { 
	$sqlApprovedCondition = '';
} else {
	$sqlApprovedCondition = 'and rv.statusId=3';
}

$texts = [];

if ($sourceId !~ /^V-/) {
	push(@$texts,@{getNessusText()});
} else {
	push(@$texts,@{getStigText()});
}

sub getNessusText {
	my $nessusSql =<<END;
select
	fp.solution as "textStr"
	,'<b>NESSUS SOLUTION</b><br/>Plugin ' || fp.pluginId as "textSrc"
from
	vars_2.found_plugins fp
where
	fp.pluginId = ?
	
END
	my $arrayref = $dbh->selectall_arrayref($nessusSql,{ Slice => {} },($sourceId));
	return $arrayref;
}

sub getStigText {
	if ($stigId ne '') {
		$sqlStigCondition = "and sa.stigId=?";
		@bindValues = ($packageId,$stigId,$sourceId);
	} else {
		$sqlStigCondition = "and sa.stigId is not null";
		@bindValues = ($packageId,$sourceId);
	}
		
	$sqlAction =<<END;
select
	NVL(rv.actionComment,'-- No comment provided --') as "textStr",
	'<b>ACTION COMMENT</b><br/>' || strdagg_param(param_array(a.name,'<br/>')) as "textSrc"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=cr.ruleId)
where
	ap.packageId = ?
	$sqlStigCondition
	and cr.groupId = ?
	$sqlApprovedCondition
	and rv.stateId=4
group by
	rv.actionComment
order by
	rv.actionComment
END

	$arrayref = $dbh->selectall_arrayref($sqlAction,{ Slice => {} },@bindValues);
	$sqlFix =<<END;
select
	to_char(substr(f.text,0,4000)) as "textStr",
	'<b>FIX TEXT</b><br/>' || strdagg_param(param_array(cr.stigId,'<br/>')) as "textSrc"
from
	stigman.asset_package_map ap
	left join stigman.stig_asset_map sa on sa.assetId=ap.assetId
	left join stigman.assets a on a.assetId=sa.assetId
	left join stigs.current_group_rules cr on cr.stigId=sa.stigId
	left join stigman.reviews rv on (rv.assetId=a.assetId and rv.ruleId=cr.ruleId)
	left join stigs.rule_fix_map rf on rf.ruleId=cr.ruleId
	left join stigs.fixes f on f.fixId=rf.fixId
where
	ap.packageId = ?
	$sqlStigCondition
	and cr.groupId = ?
	$sqlApprovedCondition
	and rv.stateId=4
group by
	to_char(substr(f.text,0,4000))
order by
	to_char(substr(f.text,0,4000))
END

	$arrayref_fix= $dbh->selectall_arrayref($sqlFix,{ Slice => {} },@bindValues);
	push(@$arrayref,@$arrayref_fix);

	return $arrayref;
}

$numRecords = @$texts;

$json = encode_json $texts;
print "Content-Type: text/html\n\n";
print "{\"records\": \"$numRecords\",\"classification\": \"$classification\",\"rows\": $json}\n";

