#!/usr/bin/perl
#$Id: getStigs.pl 807 2017-07-27 13:04:19Z csmig $

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
$csv = $q->param('csv');
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
my $sql =<<END;
SELECT 
	s.stigId as "stigId"
	,s.title as "title"
	,'Version ' || cr.version || ', Release ' || cr.release as "revision"
	,to_char(cr.benchmarkDateSql,'yyyy-mm-dd') as "benchmarkDateSql"
FROM 
	stigs.stigs s
left join stigs.current_revs cr on cr.stigId=s.stigId
order by s.stigId
END


if (!$csv) {
	$arrayref = $dbh->selectall_arrayref($sql,{ Slice => {} });
	$numRecords = @$arrayref;
	$json = encode_json $arrayref;
	print "Content-Type: text/html\n\n";
	print "{\"records\": \"$numRecords\",\"rows\": $json}\n";
	exit;
} else {
	print "Content-Type: text/csv\n";
	print "Content-Disposition: attachment;filename=STIGs.csv\n\n";
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