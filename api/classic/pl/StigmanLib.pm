#!/usr/bin/perl
# $Id: StigmanLib.pm 808 2017-07-27 13:27:40Z csmig $

package StigmanLib;
use URI::Escape;
use DBI;
use CGI;
use Data::Dumper;
use Exporter;
use Log::Log4perl qw(:easy);
use Crypt::JWT qw(decode_jwt);
use Mojo::UserAgent;
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );
#use Switch;

use vars qw($VERSION @ISA @EXPORT @EXPORT_OK %EXPORT_TAGS);

$VERSION	= 1.00;
@ISA		= qw(Exporter);
@EXPORT		= qw($STATUS_TEXT $STIGMAN_DB $STIGS_DB getUserObject getStigFromAssetRule updateStatsAssetStig removeStatsAssetStig getAuditActivityId addAuditActivityDetails getClassification followUploadProgress updateProgress updateStatusText closeProgress reloadStore sendToFile);
@EXPORT_OK	= qw($STATUS_TEXT $STIGMAN_DB $STIGS_DB getUserObject getStigFromAssetRule updateStatsAssetStig removeStatsAssetStig getAuditActivityId addAuditActivityDetails getClassification followUploadProgress updateProgress updateStatusText closeProgress reloadStore sendToFile);

$STIGMAN_DB = 'stigman';
$STIGS_DB = 'stigs';
$STATUS_TEXT = '';

sub sendToFile($$);

sub getUserObject {
	my ($username,$userRef,$sql);
	my @params;
	my %cgiParams;
	
	my $guid = $_[0]; # Not used for JWT authorization
	my $dbh = $_[1];
	my $cgi = $_[2];
	my $noredirect = $_[3];

	my $log = Log::Log4perl->get_logger("StigmanLib");
	$log->info('In getUserObject');

	my $ua = Mojo::UserAgent->new;
	my $authority = $ENV{'STIGMAN_API_AUTHORITY'};
	my $resp = $ua->get("$authority/protocol/openid-connect/certs")->result->json;
	$log->info('Got response: ' . Dumper($resp));

	my $bearer = $cgi->http('Authorization');
	if (!$bearer) {
		$log->info("Authorization header not found");
		$username = 'nobody'
	} else {
		$log->info("Authorization header value: $bearer");
		$bearer =~ s/Bearer //;
		$log->info("Bearer value: $bearer");

		my $payload = decode_jwt(token => $bearer, kid_keys =>$resp, decode_payload=>1, verify_exp=>0);
		$log->info("Token dump: " . Dumper($payload));
		$username = $payload->{'preferred_username'} ;
		$log->info("Username: " . $username);
	}


	$sql =<<END;
SELECT
	ud.id as "id",
	ud.cn as "cn",
	ud.name as "name",
	ud.dept as "dept",
	r.role as "role",
	ud.canAdmin as "canAdmin"
FROM 
	stigman.user_data ud
	left join stigman.roles r on r.id=ud.roleId
where
	ud.cn=?
END
	$userRef = $dbh->selectrow_hashref($sql,undef,($username));
	if ($userRef) {
		return $userRef
	} else {
		return undef;
	}
}


#########################################
# getStigFromAssetRule: ArrayRef
#
# return the stigId(s) that contain the ruleId
# limit results to the stigIds assigned to assetId
#########################################
sub getStigFromAssetRule {
	my $assetId = $_[0];
	my $ruleId = $_[1];
	my $dbh = $_[2];
	
	my $sql =<<END;
select cr.stigId from
stigs.rev_group_rule_map rgrm
left join stigs.rev_group_map rgm on rgrm.rgId=rgm.rgId
left join stigs.current_revs cr on rgm.revId=cr.revId
left join stigman.stig_asset_map ssm on cr.stigId=ssm.stigId
where rgrm.ruleId=?
and ssm.assetId=?
and cr.revId is not null
END
	return $dbh->selectcol_arrayref($sql, undef, ($ruleId,$assetId));
}

#########################################
# updateStatsAssetStig: Scalar
#
# return the number of rows affected
#########################################
sub updateStatsAssetStig {
	my $assetId = $_[0];
	my $stigId = $_[1];
	my $dbh = $_[2];

	my $sqlStats =<<END;
select
--	s.assetId,
--	cr.stigId,
--	TO_CHAR(min(reviews.ts),'yyyy-mm-dd hh24:mi:ss') as minTs,
--	TO_CHAR(max(reviews.ts),'yyyy-mm-dd hh24:mi:ss') as maxTs,
	min(reviews.ts) as minTs,
	max(reviews.ts) as maxTs,
	sum(CASE WHEN vsc.ruleId is null THEN 1 ELSE 0 END) as manual_rules,
	count(vsc.ruleId) as scap_rules,
	sum(CASE WHEN vsc.ruleId is null and reviews.statusId = 0 THEN 1 ELSE 0 END) as manual_in_progress,
	sum(CASE WHEN vsc.ruleId is not null and reviews.statusId = 0 THEN 1 ELSE 0 END) as scap_in_progress,
	sum(CASE WHEN vsc.ruleId is null and reviews.statusId = 1 THEN 1 ELSE 0 END) as manual_submitted,
	sum(CASE WHEN vsc.ruleId is not null and reviews.statusId = 1 THEN 1 ELSE 0 END) as scap_submitted,
	sum(CASE WHEN vsc.ruleId is null and reviews.statusId = 2 THEN 1 ELSE 0 END) as manual_rejected,
	sum(CASE WHEN vsc.ruleId is not null and reviews.statusId = 2 THEN 1 ELSE 0 END) as scap_rejected,
	sum(CASE WHEN vsc.ruleId is null and reviews.statusId = 3 THEN 1 ELSE 0 END) as manual_approved,
	sum(CASE WHEN vsc.ruleId is not null and reviews.statusId = 3 THEN 1 ELSE 0 END) as scap_approved,
	sum(CASE WHEN reviews.stateId=4 and r.severity='high' THEN 1 ELSE 0 END) as cat1count,
	sum(CASE WHEN reviews.stateId=4 and r.severity='medium' THEN 1 ELSE 0 END) as cat2count,
	sum(CASE WHEN reviews.stateId=4 and r.severity='low' THEN 1 ELSE 0 END) as cat3count
from
	stigman.assets s
	left join stigs.current_revs cr on cr.stigId = ?
	left join stigs.rev_profile_group_map rpg on (s.profile=rpg.profile and cr.revId=rpg.revId)
	left join stigs.groups g on rpg.groupId=g.groupId
	left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
	left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
	left join stigs.rules r on rgr.ruleId=r.ruleId
	left join (select ruleId from stigs.rule_oval_map group by ruleId) vsc on vsc.ruleId=r.ruleId
	left join stigman.reviews reviews on (rgr.ruleId=reviews.ruleId and reviews.assetId=s.assetId)
where
	s.assetId = ?
group by
	s.assetId,cr.stigId
END
	my $sqlInsert =<<END;
insert into stigman.stats_asset_stig
(assetId,stigId,minTs,maxTs,checksManual,checksScap,inProgressManual,inProgressScap,submittedManual,submittedScap,rejectedManual,rejectedScap,approvedManual,approvedScap,cat1Count,cat2Count,cat3Count)
values
(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
END
	my $sqlUpdate =<<END;
update
	stigman.stats_asset_stig	
set
	minTs=?,
	maxTs=?,
	checksManual=?,
	checksScap=?,
	inProgressManual=?,
	inProgressScap=?,
	submittedManual=?,
	submittedScap=?,
	rejectedManual=?,
	rejectedScap=?,
	approvedManual=?,
	approvedScap=?,
	cat1Count=?,
	cat2Count=?,
	cat3Count=?
where
	assetId = ?
	and stigId = ?
END
	my @stats = $dbh->selectrow_array($sqlStats,undef,($stigId,$assetId));
	$rv = $dbh->do($sqlUpdate,undef,(@stats,$assetId,$stigId));
	if ($rv == 0) { # No record to update, do an insert
		$rv = $dbh->do($sqlInsert,undef,($assetId,$stigId,@stats));
	}
	return $rv
}

sub removeStatsAssetStig {
	my $assetId = $_[0];
	my $stigId = $_[1];
	my $dbh = $_[2];

	$sqlDelete =<<END;
delete from stigman.stats_asset_stig
where assetId=? and stigId=?
END
	$rv = $dbh->do($sqlInsert,undef,($assetId,$stigId));
	return $rv
}

sub getAuditActivityId{
	my $dbh = $_[0];
	my $userDataId = $_[1];
	my $cgi = $_[2];
	my $ourScript;
	$activityId;

	# print Dumper(%eventHash);
	($ourScript) = ($0 =~ /.*[\\\/](.*)/);
	# %cgiParams = $cgi->Vars;
	%cgiParams = $cgi->Vars;	
	foreach $key (keys %cgiParams){
		push(@params,"$key=" . uri_escape($cgiParams{$key}));
	}
	$paramsStr = join("&",@params);	
	$ourScript = "$ourScript  " . $paramsStr;
	# $sql = "INSERT INTO stigman.activity (user,script,username,name) SELECT '$userDataId','$ourScript',cn,name FROM user_data where id = $userDataId";
	# $rv = $dbh->do($sql);
	# $activityId=$dbh->{mysql_insertid};
	$sql = "SELECT cn,name FROM user_data where id = ?";		
	($cn,$name) = $dbh->selectrow_array($sql,undef,($userDataId));
	$sql = "INSERT INTO stigman.activity(user_,script,username,name) VALUES (?,?,?,?) returning id into ?";
	$sth = $dbh->prepare($sql);
	$sth->bind_param(1,$userDataId);
	$sth->bind_param(2,$ourScript);
	$sth->bind_param(3,$cn);
	$sth->bind_param(4,$name);	
	$sth->bind_param_inout(5,\$activityId,32);
	$rv = $sth->execute();	
	
		# print "sql: $sql \n userDataId: $userDataId \n script:$ourScript \n activityId:	$activityId";
	return $activityId;

}
sub addAuditActivityDetails{
	my $dbh = $_[0];
	my $activityId = $_[1];	
	my %eventHash =  %{$_[2]};
	while (($key, $value) = each(%eventHash)){
		$sql = "INSERT INTO stigman.activity_details (activityId,key,value) VALUES (?,?,?)";
		$rv = $dbh->do($sql,undef,($activityId,$key,$value));
	}

	return $activityId;

}

sub getClassification{
	if ($ENV{'VARS_NETCLASS'} eq 'secret') {
		return "S";
	} elsif ($ENV{'VARS_NETCLASS'} eq 'confidential') {
		return "C";
	} elsif ($ENV{'VARS_NETCLASS'} eq 'unclassified') {
		return "U";
	} else {
		return "-";
	}
	
}

sub followUploadProgress {
	my ($uploadedFile
		,$filesize
		,$bytes_read
		,$percent
	);
	$uploadedFile = $_[0];
	$filename = $_[1];
	$filesize = $_[2];
	updateStatusText("Uploading file \"$filename\".");
	do {
		my @stats = stat($uploadedFile);
		$bytes_read = $stats[7];
		$percent = sprintf("%0.2f",( $bytes_read / $filesize ));
		updateProgress($percent,"Uploading \"$filename\"");
		sleep(1);
	} while ($bytes_read < $filesize);

	updateProgress(1,"Upload complete");
	updateStatusText("Upload complete.");
	sleep(1);
	return $filename;
}

sub updateProgress {
	my ($value,$text) = @_;
	$text =~ s/\\/\\\\/g;
	$| = 1;
	print "<script>parent.updateProgress($value,'$text')</script>";
}

sub updateStatusText {
	my ($text,$noEsc) = @_;
	if (!$noEsc){
		$text =~ s/\\/\\\\/g;
		$text =~ s/\'/\\\'/g;
	}
	my $noNL = $noEsc ? 'true' : 'false';
	$| = 1;
	print "<script>parent.updateStatusText('$text',$noNL)</script>";
	$STATUS_TEXT .= "$text\n";
}

sub closeProgress {
	$| = 1;
	print "<script>parent.closeProgress()</script>";
}

sub reloadStore {
	my ($id) = @_;
	$| = 1;
	print "<script>parent.reloadStore('$id')</script>";
}

#=======================================================
#RETURNS A DATABASE HANDLE TO THE STIGMAN ORACLE BACKEND
#Gives least privilege by default.
#=======================================================
# sub getDbHandle(\%){
	# my $argHashRef = @_;
	# my $service='PSG-STIGMAN-READ';		#NOTE: Currently uses the same credentials as the full-powered account.
	
	# switch ($argHashRef->{'ROLE'}){
		# case 'STIGMAN-READ-WRITE'
			# {
				# $service='PSG-STIGMAN';
			# }
		# case 'STIGMAN-WRITE'
			# {
				# $service='PSG-STIGMAN-WRITE';
			# }
	# }
	# return	gripDbh($service,"PSG","oracle"); 
# }

#====================================================
#USED TO SEND OUTPUT TO A FILE.  JUST FOR TEST 
#PURPOSES.  DELETE AFTER MIGRATION IS DONE.
#1ST PARAMETER IS OUTPUT.
#2ND PARAMETER IS FILE.
#====================================================
sub sendToFile($$){
	my $output = shift @_;
	my $file = shift @_;
	open OUTFILE, ">>$file";
	print OUTFILE "$output\n\n"
}		#Testing line by Brandon Massey to check SQL.
	

return true;
