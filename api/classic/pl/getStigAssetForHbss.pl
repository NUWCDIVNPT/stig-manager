#!/usr/bin/perl
# $Id: getStigAssetForHbss.pl 825 2017-09-15 14:51:55Z csmig $

use DBI;
use JSON::XS;
use CGI;
use Text::CSV;
use grip;
use Data::Dumper;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


my $db = $STIGMAN_DB;

$q = CGI->new;
$packageId = $q->param('packageId');
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
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	@params = ();
	if ($packageId) {
		$sqlFromClause =<<END;
	packages p
	left join asset_package_map ap on ap.packageId=p.packageId
	left join stig_asset_map sam on sam.assetId=ap.assetId
	left join assets a on a.assetId=sam.assetId
	left join stigs.stigs st on st.stigId=sam.stigId
	left join stigs.current_group_rules cgr on cgr.stigId=st.stigId
	left join (SELECT distinct ruleId FROM stigs.rule_oval_map) scap on scap.ruleId=cgr.ruleId 
END
		$sqlPackageClause = 'and p.packageId = ?';
		push(@params,$packageId);
	} else {
		$sqlFromClause =<<END;
	stig_asset_map
	left join assets a on a.assetId=sam.assetId
	left join stigs.stigs st on st.stigId=sam.stigId
	left join stigs.current_group_rules cgr on cgr.stigId=st.stigId
	left join (SELECT distinct ruleId FROM stigs.rule_oval_map) scap on scap.ruleId=cgr.ruleId  
END
		$sqlPackageClause = '';
	}
	$sql=<<END;
select
	sam.saId as "saId",
	CASE
		WHEN a.domain is not null
		THEN a.name || ' (' || a.domain || ')'
		ELSE a.name
	END as "assetName",
	a.dept as "dept",
	st.title as "stigName" 
from 
	$sqlFromClause
where
	scap.ruleId is not null
	and sam.saId is not null
	$sqlPackageClause
group by
  sam.said,
  a.domain,
  a.name,
  a.dept,
  st.title
order by 
	a.name,a.domain,st.title
END

	my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	my $numRecords = @$arrayref;
	my $json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
} else {
	print "Content-Type: text/html\n\n";
	print "Unauthorized";
}



