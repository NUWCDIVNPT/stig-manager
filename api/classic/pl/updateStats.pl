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

print "Content-type: text/plain\n\n";

#########################################################
# Establish Oracle connection with AutoCommit = 0
#########################################################
print("Attempting connections to database...\n");
my $dbhStigman = gripDbh("PSG-STIGMAN",undef,"oracle");
if ($dbhStigman) {
	$dbhStigman->{'AutoCommit'} = 0;
	print("Opened Oracle connection to STIG Manager.\n");
} else {
	print("Failed to connect to Oracle\n");
	my $errstr = "Program database connection failed. Errstr = " . $DBI::errstr;
	die $errstr;
}
updateStatsAssetStig();

sub updateStatsAssetStig {
	print("in function updateStatsAssetStig\n");

	my $sqlAssets =<<END;
	select 
		assetId as "assetId"
		,name as "name"
	from 
		assets 
	order by 
		assetId
END
	my $sqlAssetStigs =<<END;
	select ssm.stigId as "stigId" from
	stig_asset_map ssm
	where ssm.assetId=?
END
	my $sqlGetStatsAssetStig =<<END;
	select
		s.assetId,
		cr.stigId,
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
		assets s
		left join stigs.current_revs cr on cr.stigId = ?
		left join stigs.rev_profile_group_map rpg on (s.profile=rpg.profile and cr.revId=rpg.revId)
		left join stigs.groups g on rpg.groupId=g.groupId
		left join stigs.rev_group_map rg on (rpg.groupId=rg.groupId and rpg.revId=rg.revId)
		left join stigs.rev_group_rule_map rgr on rg.rgId=rgr.rgId
		left join stigs.rules r on rgr.ruleId=r.ruleId
		left join (select ruleId from stigs.rule_oval_map group by ruleId) vsc on vsc.ruleId=r.ruleId
		left join reviews reviews on (rgr.ruleId=reviews.ruleId and reviews.assetId=s.assetId)
	where
		s.assetId = ?
	group by
		s.assetId,cr.stigId
END
	my $sqlInsertStatsAssetStig =<<END;
	insert into stats_asset_stig
	(assetId,stigId,minTs,maxTs,checksManual,checksScap,inProgressManual,inProgressScap,submittedManual,submittedScap,rejectedManual,rejectedScap,approvedManual,approvedScap,cat1Count,cat2Count,cat3Count)
	values
	(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
END

	###########################################################
	# Prepares
	###########################################################
	$dbhStigman->{AutoCommit} = 0;
	my $sthAssetStigs = $dbhStigman->prepare($sqlAssetStigs);
	my $sthGetStatsAssetStig = $dbhStigman->prepare($sqlGetStatsAssetStig);
	my $sthInsertStatsAssetStig = $dbhStigman->prepare($sqlInsertStatsAssetStig);
	###########################################################
	# (Re)populate the stateAssetRev table
	###########################################################
	$dbhStigman->do("delete from stats_asset_stig");
	my $assets = $dbhStigman->selectall_arrayref($sqlAssets,{Slice=>{}});
	foreach my $asset (@$assets) {
		print("Working $asset->{'assetId'}\n");
		# Get all revisions assigned to the asset
		my $assetStigs = $dbhStigman->selectall_arrayref($sqlAssetStigs,{Slice=>{}},($asset->{'assetId'}));
		foreach my $assetStig (@$assetStigs) {
			$sthGetStatsAssetStig->execute(($assetStig->{'stigId'},$asset->{'assetId'}));
			my $stats_asset_stig = $sthGetStatsAssetStig->fetchrow_arrayref();
			$sthInsertStatsAssetStig->execute((@$stats_asset_stig));
		}
	}

print("Stats updated.\n");

return $dbhStigman->commit;

}
