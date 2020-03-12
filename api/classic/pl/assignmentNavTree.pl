#!/usr/bin/perl
# ======================================================================================
# NAME: 		assignmentNavTree.pl
# CREATED: 		October 31, 2016 @ 14:12 
# UPDATED: 		January 11, 2017 @ 14:07 
# AUTHOR(S):	BRANDON MASSEY
# PURPOSE: 		Builds the ASSIGNMENTS tree asynchronously or all at once as determined
#				by the role of the user.
# =======================================================================================
use warnings;
use strict;
use DBI;
use grip;
use JSON::XS;
use CGI;
use CGI::Carp qw(warningsToBrowser fatalsToBrowser); 
use Data::Dumper;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

my $TEMPLATE_STR = '!_TEMPLATE';			#NOT SURE WHAT THIS IF FOR YET.
my $q = CGI->new;							#CGI for pulling parameters used in the script
my $node = $q->param('node');				#The Node selected in the Assignments tree. 
my $stigmanId = $q->cookie('stigmanId');	#The StigMan token for this session
my $currentUserDept = '';					#The current user's department
my $GETALLDEPTS=0;							#A flag indicating whether or not user shall see information for all departments
my $json = undef;							#JSON data object resulting from encoding the $jsonData variable
my $jsonData = undef;						#The Perl representation of data before it's encoded as JSON
my $dbh = undef;							#Our database handle
my $userObj;								#The object containing information about the user
#==========================================
#PACKAGE DATA ITEMS
#==========================================	
my $packageNode = undef;					
my $packages = undef;
my $packageName = '';
my $packageArray = [];
my $packagesArrayRef = undef;
my $packageId = 0;
#==========================================
#STIG DATA ITEMS
#==========================================		
my $stigs = undef;
my $stig = undef;
my $stigsNode = undef;
my $stigsStigNode = undef;
my $stigsArrayRef = undef;
my $stigsStigArray = undef;
my $stigAssetNode = undef;
my $stigId = undef;
#==========================================
#STATEMENT HANDLES
#==========================================		
my $sthAssetsByPackage = undef;
my $sthAssetsByStigPackage = undef;
my $sthStigsByPackage = undef;
my $sthStigsByAsset = undef;
#==========================================
#ASSET DATA ITEMS
#==========================================		
my $assets = undef;
my $assetsNode = undef;
my $assetsArrayRef = undef;
my $asset = undef; 
my $assetId = 0; 
my $assetsAssetNode = undef;
my $assetStigNode = undef;
#==========================================
#SQL VARIABLES
#==========================================		
my $sqlPackagesAll = '';
my $sqlPackagesByDept = '';
my $sqlPackagesByUser = '';
my $sqlStigsByPackage = '';
my $sqlAssetsByPackage = '';
my $sqlAssetsByStigPackage = '';
my $sqlStigsByAsset = '';
#================================================================
# CREATE A CONNECTION TO THE DATABASE. ATTEMPT TO GET THE USER'S 
# INFORMATION
#================================================================
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
my $userId = $userObj->{'id'};

#================================================================
#The data in the resulting tree depends on the user's role
#================================================================
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'Staff') {
	#================================================================
	#Those with the CanAdmin attribute can see the full tree, 
	#loaded all at once and see information for all departments
	#================================================================
	$GETALLDEPTS=1;
} elsif ($userObj->{'role'} eq 'IAO') {
	#================================================================
	#IAOs can see the Packages for their departments. Tree loaded 
	#asynchronously.
	#================================================================
	$currentUserDept = $userObj->{'dept'};
} 
#================================================================
#Now that the details about how the tree shall be built for the 
#user, we go about building the tree based on the node (or
#lack thereof) that was selected.
#================================================================
if ($node eq 'assignment-root') {
	#============================================================
	#ROOT node passed in.  So we start by loading the packages.
	#============================================================
	$jsonData = getPackages();
} elsif (($packageId) = ($node =~ /(\d+)-assignment-stigs-node/)) {
	#============================================================
	#STIGS parent node was selected. We load all STIGS for the 
	#package.
	#============================================================
	$jsonData = getStigsByPackage($packageId);
} elsif (($packageId) = ($node =~ /(\d+)-assignment-assets-node/)) {
	#============================================================
	#ASSET parent node was selected. We load all ASSETS for the 
	#package.
	#============================================================
	$jsonData = getAssetsByPackage($packageId);
} elsif (($packageId,$stigId) = ($node =~ /(\d+)-(.+)-assignment-stigs-stig-node/)) {
	#============================================================
	#A specific STIG node was selected under the parent STIGS.
	#node. We load all ASSETS associated to that STIG within the 
	#package.
	#============================================================
	$jsonData = getAssetsByStigPackage($packageId,$stigId);
} elsif (($packageId,$assetId) = ($node =~ /(\d+)-(\d+)-assignment-assets-asset-node/)) {
	#============================================================
	#A specific ASSET node was selected under the parent ASSETS.
	#node. We load all STIGS associated to that ASSET within the 
	#package.
	#============================================================
	$jsonData = getStigsByAssetPackage($packageId,$assetId);
} elsif (!$node) {
	#============================================================
	#IF no node was selected, we load the full tree at once.
	#============================================================
	$jsonData = getPackages();
}
#============================================================
#Once the appropriate SQL Fetch Transaction has been executed
#return the resulting data as JSON to the calling script
#============================================================
$json = encode_json $jsonData;
print "Content-Type: text/html\n\n";
print "$json\n";

#============================================================
#                        FUNCTIONS 
#============================================================
sub getPackages {
#============================================================
#THIS FUNCTION WILL SELECT ALL OF THE PACKAGES FOR ALL 
#DEPARTMENTS, JUST THE USER'S DEPARTMENT OR JUST PACKAGES FOR
#WHICH THE CURRENT USER HAS A STIG-ASSET ASSIGNMENT. THEN A 
#HASH REFERENCE REPRESENTING THE TREE STRUCTURE OF THIS
#DATA IS CREATED.
#============================================================
	if ($GETALLDEPTS) {
	#================================================
	#THE CURRENT USER HAS "CANADMIN" RIGHTS
	#================================================
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
	} elsif ($currentUserDept) {
		#================================================
		#THE CURRENT USER IS AN IAO. FILTER PACKAGES WHERE 
		#THE ASSETS ARE IN THE CURRENT USER'S DEPT.
		#================================================
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
		$packages = $dbh->selectall_hashref($sqlPackagesByDept,'name',undef,($currentUserDept));
	}

	$packagesArrayRef = [];
	foreach $packageName (sort keys %$packages) {
		# ==========================================================
		# Create the portion of the tree that will represent the 
		# packages.
		# ==========================================================
		$packageId = $packages->{$packageName}->{'packageId'};
		$packageNode = {};
		$packageArray = [];
		$packageNode->{'children'} = $packageArray;
		$packageNode->{'packageId'} = $packageId;
		$packageNode->{'packageName'} = $packageName;
		$packageNode->{'reqRar'} = $packages->{$packageName}->{'reqRar'};
		$packageNode->{'node'} = 'package';
		$packageNode->{'id'}= $packageId . "-assignment-package-node";
		$packageNode->{'text'} = "$packageName";
		$packageNode->{'iconCls'} = 'sm-package-icon';

		# ==========================================================
		# Create the ASSETS Parent node and, conditionally, the 
		# asset children that should fall under it.
		# ==========================================================
		$assetsNode = {};
		$assetsNode->{'text'} = 'Assets';
		$assetsNode->{'node'} = 'assets';
		$assetsNode->{'id'} = $packageId . "-assignment-assets-node";
		$assetsNode->{'iconCls'} = 'sm-asset-icon';

		push(@$packageArray,$assetsNode);
		#==========================================================
		#Create the STIGs Parent node and, conditionally, the STIG 
		#children that should be under it.
		#==========================================================
		$stigsNode = {};
		$stigsStigArray = [];
		$stigsNode->{'text'} = 'STIGs';
		$stigsNode->{'node'} = 'stigs';
		$stigsNode->{'iconCls'} = 'sm-stig-icon';
		$stigsNode->{'id'} = $packageId . "-assignment-stigs-node";

		push(@$packageArray,$stigsNode);
		push(@$packagesArrayRef,$packageNode);
	}
	return $packagesArrayRef;
}

sub getStigsByPackage {
#============================================================
#THIS FUNCTION WILL SELECT ALL OF THE STIGS FOR A PACKAGE FOR 
#ALL DEPARTMENTS, JUST THE USER'S DEPARTMENT OR JUST PACKAGES 
#FOR WHICH THE CURRENT USER HAS A STIG-ASSET ASSIGNMENT. THEN 
# A HASH REFERENCE REPRESENTING THE TREE STRUCTURE OF THIS
#DATA IS CREATED.
#============================================================
$packageId = $_[0];
	my @params = ();
	if ($GETALLDEPTS) {
		#================================================
		#THE CURRENT USER HAS "CANADMIN" RIGHTS
		#================================================
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
	} elsif ($currentUserDept) {
		#================================================
		#THE CURRENT USER IS AN IAO. FILTER STIGS WHERE 
		#THE ASSETS ARE IN THE CURRENT USER'S DEPT.
		#================================================
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
	@params = ($packageId,$currentUserDept);
	}
	
	$sthStigsByPackage = $dbh->prepare($sqlStigsByPackage);	
	$sthStigsByPackage->execute(@params);
	$stigs = $sthStigsByPackage->fetchall_arrayref({});
	$stigsArrayRef = [];
	foreach $stig (@$stigs) {
		$stigsStigNode = {};
		$stigsStigNode->{'id'} = $packageId . "-" . $stig->{'stigId'} . "-assignment-stigs-stig-node";
		$stigsStigNode->{'text'} = $stig->{'stigId'};
		$stigsStigNode->{'stigId'} = $stig->{'stigId'};
		$stigsStigNode->{'revId'} = $stig->{'revId'};
		$stigsStigNode->{'node'} = 'stigs-stig';
		$stigsStigNode->{'packageId'} = $packageId;
		$stigsStigNode->{'packageName'} = $stig->{'packageName'};
		$stigsStigNode->{'reqRar'} = $stig->{'reqRar'};
		$stigsStigNode->{'report'} = 'stig';
		$stigsStigNode->{'qtip'} = $stig->{'title'};
		$stigsStigNode->{'iconCls'} = 'sm-stig-icon';

		push(@$stigsArrayRef,$stigsStigNode);
	}
	return $stigsArrayRef;
}

sub getAssetsByPackage {
#============================================================
#THIS FUNCTION WILL SELECT ALL OF THE ASSETS FOR A PACKAGE FOR 
#ALL DEPARTMENTS, JUST THE USER'S DEPARTMENT OR JUST PACKAGES 
#FOR WHICH THE CURRENT USER HAS A STIG-ASSET ASSIGNMENT. THEN 
# A HASH REFERENCE REPRESENTING THE TREE STRUCTURE OF THIS
#DATA IS CREATED.
#============================================================
$packageId = $_[0];
	my @params = ();
	if ($GETALLDEPTS) {
		#================================================
		#THE CURRENT USER HAS THE CANADMIN PRIV. GET ALL 
		#ASSETS IN THE PACKAGE.
		#================================================
		$sqlAssetsByPackage =<<END;
select apm.assetId as "assetId",a.name as "name",a.domain as "domain" from stigman.asset_package_map apm
left join stigman.assets a on a.assetId=apm.assetId
where packageId=?
order by a.name
END
	@params = ($packageId);
	} elsif ($currentUserDept) {
		#================================================
		#THE CURRENT USER IS AN IAO. FILTER ASSETS WHERE 
		#THE ASSETS ARE IN THE CURRENT USER'S DEPT.
		#================================================
		$sqlAssetsByPackage =<<END;
select apm.assetId as "assetId",a.name as "name",a.domain as "domain" from stigman.asset_package_map apm
left join stigman.assets a on a.assetId=apm.assetId
where packageId=? and a.dept=?
order by a.name
END
	@params = ($packageId,$currentUserDept);
	}
	
	$sthAssetsByPackage = $dbh->prepare($sqlAssetsByPackage);
	$sthAssetsByPackage->execute(@params);
	$assets = $sthAssetsByPackage->fetchall_arrayref({});
	$assetsArrayRef = [];
	foreach $asset (@$assets) {
		$assetsAssetNode = {};
		$assetsAssetNode->{'id'} = $packageId . "-" . $asset->{'assetId'} . "-assignment-assets-asset-node";
		$assetsAssetNode->{'text'} = $asset->{'name'};
		$assetsAssetNode->{'qtip'} = $asset->{'name'};
		$assetsAssetNode->{'node'} = 'assets-asset';
		if ($asset->{'domain'} eq $TEMPLATE_STR) {
			$assetsAssetNode->{'iconCls'} = 'sm-template-icon';
		} else {
			$assetsAssetNode->{'iconCls'} = 'sm-asset-icon';
		}
		# if ($GETFULLTREE) {
			# $assetsAssetNode->{'children'} = getStigsByAssetPackage($packageId,$asset->{'assetId'});
		# }
		push(@$assetsArrayRef,$assetsAssetNode);
	}
	return $assetsArrayRef;
}

sub getAssetsByStigPackage {
#============================================================
#THIS FUNCTION WILL SELECT ALL ASSETS ASSOCIATED TO A SPECIFIC 
#STIG FOR A PACKAGE. SQL Is FOR ALL DEPARTMENTS, JUST THE 
#USER'S DEPARTMENT OR JUST PACKAGES FOR WHICH THE CURRENT USER
#HAS A STIG-ASSET ASSIGNMENT. THEN A HASH REFERENCE REPRE-
#SENTING THE TREE STRUCTURE OF THIS DATA IS CREATED.
#============================================================
$packageId = $_[0];
$stigId = $_[1];
	my @params = ();
	
	if ($GETALLDEPTS) {
		#================================================
		#THE CURRENT USER HAS THE "CANADMIN" PRIV. GET ALL 
		#ASSETS IN THE PACKAGE.
		#================================================
		$sqlAssetsByStigPackage =<<END;
SELECT 
	a.assetId as "assetId",
	a.name as "name",
	st.stigId as "stigId",
	cr.revId as "revId",
	a.domain as "domain",
	sam.said as "saId"
FROM stigman.stig_asset_map sam
	LEFT JOIN stigman.asset_package_map apm on sam.assetId=apm.assetId
	LEFT JOIN stigman.assets a on sam.assetId=a.assetId
	LEFT JOIN stigs.stigs st on sam.stigId=st.stigId
	LEFT JOIN stigs.current_revs cr on sam.stigId=cr.stigId
WHERE sam.stigId=?
	and apm.packageId=?
ORDER BY a.name
END
	@params = ($stigId,$packageId);
	} elsif ($currentUserDept) {
		#================================================
		#THE CURRENT USER IS AN IAO. FILTER ASSETS OF THE 
		# STIG WHERE THE ASSETS ARE IN THE CURRENT USER'S 
		#DEPT.
		#================================================
		$sqlAssetsByStigPackage =<<END;
SELECT 
	a.assetId as "assetId",
	a.name as "name",
	st.stigId as "stigId",
	cr.revId as "revId",
	a.domain as "domain",
	sam.said as "saId"
FROM stigman.stig_asset_map sam
	LEFT JOIN stigman.asset_package_map apm on sam.assetId=apm.assetId
	LEFT JOIN stigman.assets a on sam.assetId=a.assetId
	LEFT JOIN stigs.stigs st on sam.stigId=st.stigId
	LEFT JOIN stigs.current_revs cr on sam.stigId=cr.stigId
WHERE sam.stigId=?
	and apm.packageId=?
	and a.dept = ?
ORDER BY a.name
END
	@params = ($stigId,$packageId,$currentUserDept);
	}
	
	$sthAssetsByStigPackage = $dbh->prepare($sqlAssetsByStigPackage);
	$sthAssetsByStigPackage->execute(@params);
	$assets = $sthAssetsByStigPackage->fetchall_arrayref({});
	$assetsArrayRef = [];
	foreach $asset (@$assets) {
		$stigAssetNode = {};
		$stigAssetNode->{'id'} = $packageId . "-" . $stigId . "-" . $asset->{'name'} . "-assignment-leaf";
		$stigAssetNode->{'text'} = $asset->{'name'};
		$stigAssetNode->{'qtip'} = $asset->{'name'};
		$stigAssetNode->{'report'} = "review";
		$stigAssetNode->{'node'} = "stig-asset";
		$stigAssetNode->{'saId'} = $asset->{'saId'};
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
#============================================================
#THIS FUNCTION WILL SELECT ALL STIGS ASSOCIATED TO A SPECIFIC 
#ASSET FOR A PACKAGE. SQL IS FOR ALL DEPARTMENTS, JUST THE 
#USER'S DEPARTMENT OR JUST PACKAGES FOR WHICH THE CURRENT USER
#HAS A STIG-ASSET ASSIGNMENT. THEN A HASH REFERENCE REPRE-
#SENTING THE TREE STRUCTURE OF THIS DATA IS CREATED.
#============================================================
$packageId = $_[0];
$assetId = $_[1];
	my @params = ();
	if ($GETALLDEPTS || $currentUserDept) {
		$sqlStigsByAsset =<<END;
SELECT 
	s.stigId as "stigId",
	cr.revId as "revId",
	s.title as "title",
	a.name as "name",
	a.domain as "domain",
	sam.said as "saId"
FROM stigman.stig_asset_map sam
	left join stigs.stigs s on sam.stigId=s.stigId
	left join stigs.current_revs cr on s.stigId=cr.stigId
	left join stigman.assets a on sam.assetId=a.assetId
WHERE sam.assetId=?
ORDER BY s.stigId
END
	@params = ($assetId);
	}
	
	$sthStigsByAsset = $dbh->prepare($sqlStigsByAsset);
	$sthStigsByAsset->execute(@params);
	$stigs = $sthStigsByAsset->fetchall_arrayref({});
	$stigsArrayRef = [];
	foreach $stig (@$stigs) {
		$assetStigNode = {};
		$assetStigNode->{'id'} = $packageId . "-" . $assetId . "-" . $stig->{'stigId'} . '-assignment-leaf';
		$assetStigNode->{'text'} = $stig->{'stigId'};
		$assetStigNode->{'qtip'} = $stig->{'title'};
		$assetStigNode->{'report'} = "review";
		$assetStigNode->{'node'} = "asset-stig";
		$assetStigNode->{'saId'} = $stig->{'saId'};
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
