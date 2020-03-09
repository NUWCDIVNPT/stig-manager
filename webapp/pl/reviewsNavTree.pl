#!/usr/bin/perl

use DBI;
use grip;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;
use Log::Log4perl qw(:easy);
Log::Log4perl->easy_init( { level   => $DEBUG, file    => ">>/tmp/test.log" } );

$db = "stigman";
$TEMPLATE_STR = '!_TEMPLATE';

$q = CGI->new;
$node = $q->param('node');
$stigmanId = $q->cookie('stigmanId');

$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
$userId = $userObj->{'id'};
if ($userObj->{'role'} eq 'Staff') {
	$GETFULLTREE = 0;
	$GETALL=1;
} elsif ($userObj->{'role'} eq 'IAO') {
	$GETFULLTREE = 0;
	$GETDEPT = $userObj->{'dept'};
} else {
	$GETFULLTREE = 1;
	$GETALL=0;
}

if ($node eq 'reviews-root') {
	$jsonData = getPackages();
} elsif (($packageId) = ($node =~ /(\d+)-stigs-node/)) {
	$jsonData = getStigsByPackage($packageId);
} elsif (($packageId) = ($node =~ /(\d+)-assets-node/)) {
	$jsonData = getAssetsByPackage($packageId);
} elsif (($packageId,$stigId) = ($node =~ /(\d+)-(.+)-stigs-stig-node/)) {
	$jsonData = getAssetsByStigPackage($packageId,$stigId);
} elsif (($packageId,$assetId) = ($node =~ /(\d+)-(\d+)-assets-asset-node/)) {
	$jsonData = getStigsByAssetPackage($packageId,$assetId);
} elsif (!$node) {
	$GETFULLTREE = 1;
	$jsonData = getPackages();
}

$json = encode_json $jsonData;
print STDERR $json;
print "Content-Type: text/html\n\n";
print "$json\n";


sub getPackages {
	if ($GETALL) {
		$sqlPackagesAll =<<END;
SELECT
	packageId as "packageId"
	,name as "name"
	,reqRar as "reqRar"
FROM
	stigman.packages
order by name
END
		$packages = $dbh->selectall_hashref($sqlPackagesAll,'name');
	} elsif ($GETDEPT) {
		$sqlPackagesByDept =<<END;
		SELECT 
			distinct p.packageId as "packageId",
			p.name as "name", 
			p.reqRar as "reqRar"			
		FROM
			stigman.packages p
			left join stigman.asset_package_map apm on apm.packageId=p.packageId
			left join stigman.assets a on a.assetId=apm.assetId
		where
			a.dept=?
			and p.packageId is not null
		order by p.name
END
		$packages = $dbh->selectall_hashref($sqlPackagesByDept,'name',undef,($GETDEPT));
	} else {
		$sqlPackagesByUser =<<END;
SELECT distinct p.packageId as "packageId"
,p.name as "name"
,p.reqRar as "reqRar" FROM
stigman.user_stig_asset_map usam
left join stigman.stig_asset_map sam on sam.saId=usam.saId
left join stigman.asset_package_map apm on apm.assetId=sam.assetId
left join stigman.packages p on p.packageId=apm.packageId
where usam.userId=? and p.packageId is not null
order by p.name
END
		$packages = $dbh->selectall_hashref($sqlPackagesByUser,'name',undef,($userId));
	}

	$packagesArrayRef = [];
	foreach $packageName (sort keys %$packages) {
		# Packages
		$packageId = $packages->{$packageName}->{'packageId'};
		$packageNode = {};
		$packageArray = [];
		$packageNode->{'children'} = $packageArray;
		$packageNode->{'packageId'} = $packageId;
		$packageNode->{'packageName'} = $packageName;
		$packageNode->{'reqRar'} = $packages->{$packageName}->{'reqRar'};
		$packageNode->{'node'} = 'package';
		$packageNode->{'id'}= $packageId . "-package-node";
		$packageNode->{'text'} = "$packageName";
		$packageNode->{'iconCls'} = 'sm-package-icon';

		# Import results
		$importResultLeaf = {};
		$importResultLeaf->{'text'} = 'Import STIG results...';
		$importResultLeaf->{'action'} = 'import';
		$importResultLeaf->{'packageId'} = $packageId;
		$importResultLeaf->{'packageName'} = $packageName;
		$importResultLeaf->{'id'} = $packageId . "-import-result-node";
		$importResultLeaf->{'iconCls'} = 'sm-import-icon';
		$importResultLeaf->{'leaf'} = 'true';
		push(@$packageArray,$importResultLeaf);

		# Assets
		$assetsNode = {};
		$assetsNode->{'text'} = 'Assets';
		$assetsNode->{'node'} = 'assets';
		$assetsNode->{'id'} = $packageId . "-assets-node";
		$assetsNode->{'iconCls'} = 'sm-asset-icon';
		if ($GETFULLTREE) {
			$assetsNode->{'children'} = getAssetsByPackage($packageId);
		}
		push(@$packageArray,$assetsNode);

		# STIGs
		$stigsNode = {};
		$stigsStigArray = [];
		$stigsNode->{'text'} = 'STIGs';
		$stigsNode->{'node'} = 'stigs';
		$stigsNode->{'iconCls'} = 'sm-stig-icon';
		$stigsNode->{'id'} = $packageId . "-stigs-node";
		if ($GETFULLTREE) {
			$stigsNode->{'children'} = getStigsByPackage($packageId);
		}
		push(@$packageArray,$stigsNode);

		push(@$packagesArrayRef,$packageNode);
	}
	return $packagesArrayRef;
}

sub getStigsByPackage {
	my $packageId = $_[0];
	my @params = ();
	if ($GETALL) {
		$sqlStigsByPackage =<<END;
select distinct st.stigId as "stigId",st.title as "title",cr.revId as "revId",p.name as "packageName",p.reqRar as "reqRar" from
stigman.packages p
left join stigman.asset_package_map apm on apm.packageId=p.packageId
left join stigman.stig_asset_map sam on sam.assetId=apm.assetId
left join stigs.stigs st on st.stigId=sam.stigId
left join stigs.current_revs cr on cr.stigId=st.stigId
where p.packageId=?
and st.stigId is not null
order by st.stigId
END
	@params = ($packageId);
	} elsif ($GETDEPT) {
		$sqlStigsByPackage =<<END;
select distinct st.stigId as "stigId",st.title as "title",cr.revId as "revId",p.name as "packageName",p.reqRar as "reqRar" from
stigman.packages p
left join stigman.asset_package_map apm on apm.packageId=p.packageId
left join stigman.assets a on a.assetId=apm.assetId
left join stigman.stig_asset_map sam on sam.assetId=a.assetId
left join stigs.stigs st on st.stigId=sam.stigId
left join stigs.current_revs cr on cr.stigId=st.stigId
where p.packageId=? and a.dept=?
and st.stigId is not null
order by st.stigId
END
	@params = ($packageId,$GETDEPT);
	} else {
		$sqlStigsByPackage =<<END;
select distinct st.stigId as "stigId",st.title as "title",cr.revId as "revId",p.name as "packageName",p.reqRar as "reqRar" from
stigman.packages p
left join stigman.asset_package_map apm on apm.packageId=p.packageId
left join stigman.stig_asset_map sam on sam.assetId=apm.assetId
left join stigman.user_stig_asset_map usam on usam.saId=sam.saId
left join stigs.stigs st on st.stigId=sam.stigId
left join stigs.current_revs cr on cr.stigId=st.stigId
where p.packageId=? and usam.userId=?
and st.stigId is not null
order by st.stigId
END
	@params = ($packageId,$userId);
	}
	$sthStigsByPackage = $dbh->prepare($sqlStigsByPackage);	
	$sthStigsByPackage->execute(@params);
	$stigs = $sthStigsByPackage->fetchall_arrayref({});
	$stigsArrayRef = [];
	foreach $stig (@$stigs) {
		$stigsStigNode = {};
		$stigsStigNode->{'id'} = $packageId . "-" . $stig->{'stigId'} . "-stigs-stig-node";
		$stigsStigNode->{'text'} = $stig->{'stigId'};
		$stigsStigNode->{'stigId'} = $stig->{'stigId'};
		$stigsStigNode->{'revId'} = $stig->{'revId'};
		$stigsStigNode->{'packageId'} = $packageId;
		$stigsStigNode->{'packageName'} = $stig->{'packageName'};
		$stigsStigNode->{'reqRar'} = $stig->{'reqRar'};
		$stigsStigNode->{'report'} = 'stig';
		$stigsStigNode->{'qtip'} = $stig->{'title'};
		$stigsStigNode->{'iconCls'} = 'sm-stig-icon';
		if ($GETFULLTREE) {
			$stigsStigNode->{'children'} = getAssetsByStigPackage($packageId,$stig->{'stigId'});
		}
		push(@$stigsArrayRef,$stigsStigNode);
	}
	return $stigsArrayRef;
}

sub getAssetsByPackage {
	my $packageId = $_[0];
	my @params = ();
	if ($GETALL) {
		$sqlAssetsByPackage =<<END;
select apm.assetId as "assetId",a.name as "name",a.domain as "domain" from stigman.asset_package_map apm
left join stigman.assets a on a.assetId=apm.assetId
where packageId=?
order by a.name
END
	@params = ($packageId);
	} elsif ($GETDEPT) {
		$sqlAssetsByPackage =<<END;
select apm.assetId as "assetId",a.name as "name",a.domain as "domain" from stigman.asset_package_map apm
left join stigman.assets a on a.assetId=apm.assetId
where packageId=? and a.dept=?
order by a.name
END
	@params = ($packageId,$GETDEPT);
	} else {
		$sqlAssetsByPackage =<<END;
select distinct apm.assetId as "assetId",a.name as "name",a.domain as "domain" from
stigman.asset_package_map apm
left join stigman.assets a on a.assetId=apm.assetId
left join stigman.stig_asset_map sam on sam.assetId=a.assetId
left join stigman.user_stig_asset_map usam on usam.saId=sam.saId
where packageId=? and usam.userId=?
order by a.name
END
	@params = ($packageId,$userId);
	}
	$sthAssetsByPackage = $dbh->prepare($sqlAssetsByPackage);
	$sthAssetsByPackage->execute(@params);
	$assets = $sthAssetsByPackage->fetchall_arrayref({});
	$assetsArrayRef = [];
	foreach $asset (@$assets) {
		$assetsAssetNode = {};
		$assetsAssetNode->{'id'} = $packageId . "-" . $asset->{'assetId'} . "-assets-asset-node";
		$assetsAssetNode->{'text'} = $asset->{'name'};
		$assetsAssetNode->{'qtip'} = $asset->{'name'};
		$assetsAssetNode->{'report'} = 'asset';
		$assetsAssetNode->{'assetId'} = $asset->{'assetId'};	#added by Brandon Massey 8/16/2016
		$assetsAssetNode->{'packageId'} = $packageId;			#added by Brandon Massey 8/16/2016
		#$assetsAssetNode->{'packageName'} = ?????;				#added by Brandon Massey 8/16/2016
		
		if ($asset->{'domain'} eq $TEMPLATE_STR) {
			$assetsAssetNode->{'iconCls'} = 'sm-template-icon';
		} else {
			$assetsAssetNode->{'iconCls'} = 'sm-asset-icon';
		}
		if ($GETFULLTREE) {
			$assetsAssetNode->{'children'} = getStigsByAssetPackage($packageId,$asset->{'assetId'});
		}
		push(@$assetsArrayRef,$assetsAssetNode);
	}
	return $assetsArrayRef;
}

sub getAssetsByStigPackage {
	my $packageId = $_[0];
	my $stigId = $_[1];
	my @params = ();
	
	if ($GETALL) {
		$sqlAssetsByStigPackage =<<END;
select a.assetId as "assetId",a.name as "name",st.stigId as "stigId",cr.revId as "revId",a.domain as "domain"
from stigman.stig_asset_map sam
left join stigman.asset_package_map apm on sam.assetId=apm.assetId
left join stigman.assets a on sam.assetId=a.assetId
left join stigs.stigs st on sam.stigId=st.stigId
left join stigs.current_revs cr on sam.stigId=cr.stigId
where sam.stigId=?
and apm.packageId=?
order by a.name
END
	@params = ($stigId,$packageId);
	} elsif ($GETDEPT) {
		$sqlAssetsByStigPackage =<<END;
select a.assetId as "assetId",a.name as "name",st.stigId as "stigId",cr.revId as "revId",a.domain as "domain"
from stigman.stig_asset_map sam
left join stigman.asset_package_map apm on sam.assetId=apm.assetId
left join stigman.assets a on sam.assetId=a.assetId
left join stigs.stigs st on sam.stigId=st.stigId
left join stigs.current_revs cr on sam.stigId=cr.stigId
where sam.stigId=?
and apm.packageId=?
and a.dept = ?
order by a.name
END
	@params = ($stigId,$packageId,$GETDEPT);
	} else {
		$sqlAssetsByStigPackage =<<END;
select a.assetId as "assetId",a.name as "name",st.stigId as "stigId",cr.revId as "revId",a.domain as "domain"
from stigman.user_stig_asset_map usam
left join stigman.stig_asset_map sam on sam.saId=usam.saId
left join stigman.asset_package_map apm on apm.assetId=sam.assetId
left join stigman.assets a on a.assetId=sam.assetId
left join stigs.stigs st on st.stigId=sam.stigId
left join stigs.current_revs cr on cr.stigId=sam.stigId
where sam.stigId=?
and apm.packageId=?
and usam.userId=?
order by a.name
END
	@params = ($stigId,$packageId,$userId);
	}
	$sthAssetsByStigPackage = $dbh->prepare($sqlAssetsByStigPackage);
	$sthAssetsByStigPackage->execute(@params);
	$assets = $sthAssetsByStigPackage->fetchall_arrayref({});
	$assetsArrayRef = [];
	foreach $asset (@$assets) {
		$stigAssetNode = {};
		$stigAssetNode->{'id'} = $packageId . "-" . $stigId . "-" . $asset->{'name'} . "-leaf";
		$stigAssetNode->{'text'} = $asset->{'name'};
		$stigAssetNode->{'qtip'} = $asset->{'name'};
		$stigAssetNode->{'report'} = "review";
		$stigAssetNode->{'assetId'} = $asset->{'assetId'};
		$stigAssetNode->{'assetName'} = $asset->{'name'};
		$stigAssetNode->{'assetGroup'} = $asset->{'domain'};
		$stigAssetNode->{'stigName'} = $asset->{'stigId'};
		$stigAssetNode->{'revId'} = $asset->{'revId'};
		$stigAssetNode->{'stigId'} = $stigId;
		if ($asset->{'domain'} eq $TEMPLATE_STR) {
			$stigAssetNode->{'iconCls'} = 'sm-template-icon';
		} else {
			$stigAssetNode->{'iconCls'} = 'sm-asset-icon';
		}
		$stigAssetNode->{'leaf'} = 'true';
		push(@$assetsArrayRef,$stigAssetNode);
	}
	return $assetsArrayRef;
}

sub getStigsByAssetPackage {
	my $packageId = $_[0];
	my $assetId = $_[1];
	my @params = ();
	if ($GETALL || $GETDEPT) {
		$sqlStigsByAsset =<<END;
select s.stigId as "stigId",cr.revId as "revId",s.title as "title",a.name as "name",a.domain as "domain"
from stigman.stig_asset_map sam
left join stigs.stigs s on sam.stigId=s.stigId
left join stigs.current_revs cr on s.stigId=cr.stigId
left join stigman.assets a on sam.assetId=a.assetId
where sam.assetId=?
order by s.stigId
END
	@params = ($assetId);
	} else {
		$sqlStigsByAsset =<<END;
select s.stigId as "stigId",cr.revId as "revId",s.title as "title",a.name as "name",a.domain as "domain"
from stigman.user_stig_asset_map usam
left join stigman.stig_asset_map sam on sam.saId=usam.saId
left join stigs.stigs s on s.stigId=sam.stigId
left join stigs.current_revs cr on cr.stigId=s.stigId
left join stigman.assets a on a.assetId=sam.assetId
where sam.assetId=?
and usam.userId=?
order by s.stigId
END
	@params = ($assetId,$userId);
	}
	$sthStigsByAsset = $dbh->prepare($sqlStigsByAsset);
	
	#print $assetId, " -- ", $userId > "testoutput.txt";
	
	$sthStigsByAsset->execute(@params);
	$stigs = $sthStigsByAsset->fetchall_arrayref({});
	$stigsArrayRef = [];
	foreach $stig (@$stigs) {
		$assetStigNode = {};
		$assetStigNode->{'id'} = $packageId . "-" . $assetId . "-" . $stig->{'stigId'} . '-leaf';
		$assetStigNode->{'text'} = $stig->{'stigId'};
		$assetStigNode->{'qtip'} = $stig->{'title'};
		$assetStigNode->{'report'} = "review";
		$assetStigNode->{'assetId'} = $assetId;
		$assetStigNode->{'assetName'} = $stig->{'name'};
		$assetStigNode->{'assetGroup'} = $stig->{'domain'};
		$assetStigNode->{'stigName'} = $stig->{'stigId'};
		$assetStigNode->{'revId'} = $stig->{'revId'};
		$assetStigNode->{'stigId'} = $stig->{'stigId'};
		$assetStigNode->{'iconCls'} = 'sm-stig-icon';
		$assetStigNode->{'leaf'} = 'true';
		push(@$stigsArrayRef,$assetStigNode);
	}
	return $stigsArrayRef;
}
