#!/usr/bin/perl
#$Id: getUsers.pl 807 2017-07-27 13:04:19Z csmig $

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
$coder = JSON::XS->new->ascii->pretty->allow_nonref;
$xaction = $q->param('xaction');
$csv = $q->param('csv');
$stigmanId = $q->cookie('stigmanId');

if ($rowsJson = $q->param('rows')){
	$rows = $coder->decode($rowsJson);
}
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}

if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	if (!$xaction || $xaction eq 'read') {
		@params = ();
		$sql=<<END;
SELECT
	ud.id as "userId",
	ud.cn as "cn",
	ud.name as "name",
	ud.dept as "dept",
	r.roleDisplay as "roleDisplay",
	ud.canAdmin as "canAdmin",
	EXTRACT(DAY FROM systimestamp - from_unixtime(c.lastuse)) as "lastActiveDays",
	TO_CHAR(FROM_UNIXTIME_TZ(c.lastuse, 'UTC') at local, 'YYYY-MM-DD HH24:MI:SS' ) as "lastActiveTime"
from 
	stigman.user_data ud
	left join stigman.roles r on r.id=ud.roleId
	left join stigman_ids c on UPPER(ud.cn)=UPPER(c.cn)
where
	ud.id != 999
	and ud.id != 0
END
		if ($userObj->{'role'} eq 'IAO' && !($userObj->{'canAdmin'})) {
			$sql .= "and ud.dept = ? ";
			push(@params ,$userObj->{'dept'});
		}
		$sql .= "order by ud.cn";

		if (!$csv) {
			my $arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} },@params);
			my $numRecords = @$arrayref;
			my $json = encode_json $arrayref;
			print "Content-Type: text/html\n\n";
			print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
			exit;
		} else {
			print "Content-Type: text/csv\n";
			print "Content-Disposition: attachment;filename=Users.csv\n\n";
			my $csv = Text::CSV->new ( { binary => 1 } );
			my $sth = $dbh->prepare($sql);
			my $rv = $sth->execute(@params);
			$columnNames = $sth->{NAME};
			$csv->combine (@$columnNames);
			print $csv->string() . "\n";
			my $arrayref = $sth->fetchall_arrayref();
			foreach $array (@$arrayref) {
				$csv->combine (@$array);
				print $csv->string() . "\n";
			}
		}
	} elsif ($xaction eq 'destroy' && $userObj->{'canAdmin'}) {
		($deletedCn, $deletedName) = $dbh->selectrow_array("Select cn,name FROM stigman.user_data where id = ?", undef, ($rows));
		# %eventHash = ("delete","user","userCn","$deletedCn","user_dataId","$rows");
		# # print Dumper(%eventHash);
		my $activityId = getAuditActivityId($dbh,$userObj->{'id'},$q);
		addAuditActivityDetails($dbh,$activityId,{"delete"=>"user",
			"userCn"=>$deletedCn,
			"name"=>$deletedName,
			"user_dataId"=>"$rows"
			});	
		$sql = "delete FROM user_data where id=?";
		$rv = $dbh->do($sql,undef,($rows));		
		print "Content-Type: text/html\n\n";
		if ($rv) {
			print "{success:true}\n";
		} else {
			print "{success:false, rv:$rv, sql:$sql}\n";
		}
	}
}