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

$db = $STIGS_DB;
$q = CGI->new;
$stigmanId = $q->cookie('stigmanId');
$ruleId = $q->param('ruleId');

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

$sql =<<END;
select
r.title as "title",

(select
LISTAGG(c.content, '<br><br><b>AND</b><br><br>') WITHIN GROUP (ORDER BY c.content)
from stigs.rule_check_map rc
left join stigs.checks c on c.checkId=rc.checkId
where ruleId = ?
group by ruleId) as "content",

(select
LISTAGG(SUBSTR(f.text,0,32000), '<br><br><b>AND</b><br><br>') WITHIN GROUP (ORDER BY SUBSTR(f.text,0,32000))
from stigs.rule_fix_map rf
left join stigs.fixes f on f.fixId=rf.fixId
where ruleId = ?
group by ruleId) as "fix",

sc.cat as "cat",
r.vulnDiscussion as "vulnDiscussion",
r.documentable as "documentable",
r.responsibility as "responsibility",
r.iaControls as "iaControls"
from stigs.rules r
left join stigs.severity_cat_map sc on r.severity=sc.severity
where
r.ruleId=?
END

$contentRef = $dbh->selectrow_hashref($sql,undef,($ruleId,$ruleId,$ruleId));

my $sqlCci = <<END;
select C.CCI, APACRONYM, CONTROL from STIGS.RULE_CONTROL_MAP RCM
left join IACONTROLS.CCI C on C.CCI=RCM.CONTROLNUMBER
left join IACONTROLS.CCI_CONTROL_MAP CCM on CCM.CCI=C.CCI
where RCM.RULEID = ?
and RCM.CONTROLTYPE = 'CCI'
and CCM.REV = ?
order by C.CCI asc
END

my $rmfRev = 4;
$cciRef = $dbh->selectall_arrayref($sqlCci,{Slice=>{}},($ruleId,$rmfRev));


$contentRef->{'content'} =~ s/\n/<br>/g;
$contentRef->{'fix'} =~ s/\n/<br>/g;

print "Content-Type: text/html\n\n";
print "<div class=cs-home-header-top>";
	print $ruleId;
print "</div>";

print "<div class=cs-home-header-sub>";
	print $contentRef->{'title'} . " (Category " . $contentRef->{'cat'} . ")";
print "</div>";

print "<div class=cs-home-body-title>";
print "Manual Check";
print "<div class=cs-home-body-text>";
print $contentRef->{'content'};
print "</div>";
print "</div>";
print "<div class=cs-home-body-title>";
print "Fix";
print "<div class=cs-home-body-text>";
print $contentRef->{'fix'};
print "</div>";
print "</div>";

print "<div class=cs-home-header-sub>";
print "</div>";

print "<div class=cs-home-body-title>";
print "Other Data";
print "<div class=cs-home-body-text>";
print "<b>Vulnerability Discussion</b><br>";
print $contentRef->{'vulnDiscussion'};
print "</div>";

print "<div class=cs-home-body-text>";
print "<b>Documentable: </b>";
print $contentRef->{'documentable'};
print "</div>";

print "<div class=cs-home-body-text>";
print "<b>Responsibility: </b>";
print $contentRef->{'responsibility'};
print "</div>";

print "<div class=cs-home-body-text>";
print "<b>Controls: </b><br>";


if (scalar @$cciRef){

	# print "<table style=\"width: 100%;border-collapse: collapse;\" border=\"1\" cellpadding=\"5\">";
	print "<table class=cs-home-body-table border=\"1\">";
	print "<tr>";
	print "<td><b>CCI</b></td>";
	print "<td><b>AP Acronym</b></td>";
	print "<td><b>Control</b></td>";
	print "</tr>";
	foreach my $r (@$cciRef){

		print "<tr>";
		print "<td>" . $r->{'CCI'} . "</td>";
		print "<td>" . $r->{'APACRONYM'} . "</td>";
		print "<td>" . $r->{'CONTROL'} . "</td>";
		print "</tr>";

	}
	
print "</table>";
}
else {
	print "None Available";
}

# print $contentRef->{'iaControls'};
print "</div>";

print "</div>";
