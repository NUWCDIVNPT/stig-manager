#!/usr/bin/perl
#$Id: getArtifacts.pl 807 2017-07-27 13:04:19Z csmig $

use DBI;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Text::CSV;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;


$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$fromAdminTab = $q->param('fromAdminTab');
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
	@params = ();
	my $sql =<<END;
SELECT
	art.artId as "artId",
	art.filename as "filename",
	ud.name as "userName",
	art.dept as "dept",
	art.sha1 as "sha1",
	art.description as "description",
	to_char(art.ts,'yyyy-mm-dd hh24:mi:ss') as "ts",
	sum(
	case 
	when ra.raId is null then
		0
	else 
		1
	end
) as "inUse"
FROM
	stigman.artifacts art
	left join stigman.user_data ud on ud.id=art.userId
	left join stigman.review_artifact_map ra on ra.artId=art.artId
END
	
	
	if ($userObj->{'canAdmin'} && $fromAdminTab) {
		$sql .= "";	
	} elsif ($userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'IAWF') {
		$sql .= "where art.dept = ? ";
		push(@params ,$userObj->{'dept'});
	}
	
	$sql .=<<END;
group by 
	art.artId
	,art.filename
	,ud.name
	,art.dept
	,art.sha1
	,art.description
	,art.ts
order by art.filename
END
	$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
	$numRecords = @$arrayref;

	$json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	print "{\"records\": \"$numRecords\",\"rows\": $json}\n";


