#!/usr/bin/perl
# $Id: getStigAssetForProps.pl 807 2017-07-27 13:04:19Z csmig $

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

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO') {
	@params = ();
	$sql=<<END;
select
	sam.saId as "saId",
  case
    when a.domain IS NOT NULL then 
     a.name || ' (' || a.domain || ')'
    else 
      a.name
  end as "assetName",
	a.dept as "dept",
	st.title as "stigName" 
from 
	stigman.stig_asset_map sam
	left join stigman.assets a on a.assetId=sam.assetId
	left join stigs.stigs st on st.stigId=sam.stigId
where
	sam.saId is not null
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



