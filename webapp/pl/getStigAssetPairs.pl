#!/usr/bin/perl
# ============================================================================================
# NAME: 		getStigAssetPairs.pl
# PURPOSE: 		Retrieves STIG-ASSET pairs for a given Package, STIG or Asset
# =============================================================================================
#===============================================================
# MODULE INCLUDES
#===============================================================
use warnings;
use strict;
use DBI;
use JSON::XS;
use CGI;
use Data::Dumper;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

#===============================================================
#OBJECT VARIABLES
#===============================================================
my $q = CGI->new;
my $assetId = $q->param('assetId');
my $packageId = $q->param('packageId');
my $stigId = $q->param('stigId');
my $level = $q->param('level');
my $stigmanId = $q->cookie('stigmanId');
my $dbh = undef;
my $sql = '';
my $userObj = undef;
my $json = undef;
my $datahashref = {};
my $dataArray=[];
my $paramArray=[];
#===============================================================
#CONNECT TO THE DATABASE AND GET CURRENT USER'S INFORMATION
#===============================================================
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
$userObj = getUserObject($stigmanId,$dbh,$q);
if ($userObj->{'canAdmin'} || $userObj->{'role'} eq 'IAO' || $userObj->{'role'} eq 'Staff') {
	
	if ($level eq 'package'){
		#========================================================
		#FETCH STIG-ASSET PAIRS FOR THE WHOLE PACKAGE
		#========================================================
		$sql =<<END;
			SELECT sam.said as "saId",
				assets.name as "name",
				s.stigId as "stigId",
				s.stigId as "title"
			FROM stig_asset_map sam
				INNER JOIN assets ON assets.assetId = sam.assetId
				INNER JOIN stigs.stigs s ON s.stigId = sam.stigId
				INNER JOIN asset_package_map apm ON apm.assetId = sam.assetId AND packageId = ?
END
		push @$paramArray, $packageId;
		if (!$userObj->{'canAdmin'}){
			#===================================================
			#IF AN IAO, ADD CRITERIA TO RESTRICT BY DEPT
			#===================================================
			$sql .= ' WHERE assets.dept = ?';
			push @$paramArray, $userObj->{'dept'};
		}
		
	}elsif ($level eq 'asset'){
		#========================================================
		#FETCH STIG-ASSET PAIRS FOR THE ASSET (IN A PACKAGE)
		#========================================================
		$sql =<<END;
			SELECT sam.said as "saId",
				assets.name as "name",
				s.stigId as "stigId",
				s.stigId as "title"
			FROM stig_asset_map sam
				INNER JOIN assets ON assets.assetId = sam.assetId
				INNER JOIN stigs.stigs s ON s.stigId = sam.stigId
			WHERE sam.assetId = ?
END
		 push @$paramArray, $assetId;
	}elsif ($level eq 'stig'){
		#========================================================
		#FETCH STIG-ASSET PAIRS FOR THE STIG (IN A PACKAGE)
		#========================================================
		$sql =<<END;
			SELECT sam.said as "saId",
				assets.name as "name",
				s.stigId as "stigId",
				s.stigId as "title"
			FROM stig_asset_map sam
				INNER JOIN assets ON assets.assetId = sam.assetId
				INNER JOIN stigs.stigs s ON s.stigId = sam.stigId
				INNER JOIN asset_package_map apm ON apm.assetId = sam.assetId AND packageId = ?
			WHERE sam.stigId = ?
END
		push @$paramArray, $packageId;
		push @$paramArray, $stigId;
		if ((!$userObj->{'canAdmin'}) && $userObj->{'role'} eq 'IAO'){
			#===================================================
			#IF AN IAO, ADD CRITERIA TO RESTRICT BY DEPT
			#===================================================
			$sql .= ' AND assets.dept =?';
			push @$paramArray, $userObj->{'dept'};
		}
	}
}
#===================================================================================
#EXECUTE THE QUERY IF THE USER HAS RIGHTS. OTHERWISE NOTIFY OF FORBIDDEN ACCESS
#===================================================================================
if ($sql ne ''){
	#========================================================
	#EXECUTE THE SQL AND RETURN THE DATA AS JSON
	#========================================================
	$dataArray = $dbh->selectall_arrayref($sql,{Slice => {}},@$paramArray);
	$datahashref = {rows=>$dataArray};
	$json = encode_json ({
		success => \1, 
		data 	=> $datahashref
	});
}else{
	#========================================================
	#USER DOES NOT HAVE PRIVS TO RUN THIS QUERY
	#========================================================
	$json = encode_json ({
		success => \0, 
		response 	=> 'You are not authorized for this function'
	});
}
print "Content-Type: application/json\n\n";
print "$json\n";