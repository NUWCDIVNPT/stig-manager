#!/usr/bin/perl

use DBI;
use DBD::Oracle qw{:ora_types};
use JSON::XS;
use CGI;
use Digest::SHA1  qw(sha1 sha1_hex sha1_base64);
use Data::Dumper;
use Time::Local;
use grip;
use FindBin qw($Bin);
use lib $Bin;
use StigmanLib;

$q = CGI->new;
$desc = $q->param('desc');
$importFilename = $q->param('importFile');
$importFilename =~ s{.*[\\/]}{};  # remove directories, just the filename  
$stigmanId = $q->cookie('stigmanId');

my $responseHashRef = {};
$responseHashRef->{'success'} = 'true';

if (!($dbh = gripDbh("PSG-STIGMAN",undef,"oracle"))) {
	print "Content-Type: text/html\n\n";
	print "Could not connect to the database.";
	exit;
} 
if (!($userObj = getUserObject($stigmanId,$dbh,$q,1))) {
	print "Content-Type: text/html\n\n";
	print "Invalid user.";
	exit;
}
$userId = $userObj->{'id'};
$userDept = $userObj->{'dept'};

#Get file from CGI
$importFh = $q->upload('importFile');
while (<$importFh>) {
	$importData .= $_;
}
$importSha1 = sha1_hex($importData);

#####################################
# START: SQL statements
#####################################
$sqlSetContent =<<END;
	INSERT /*+ ignore_row_on_dupkey_index(artifact_blobs, PRIMARY_5) */ INTO artifact_blobs(sha1,data,userId) VALUES (?,?,?)
END
$sqlSetArtifact =<<END;
	INSERT INTO stigman.artifacts(sha1,filename,description,userId,dept) VALUES (?,?,?,?,?) RETURNING artId into ?
END
$sqlGetArtifact =<<END;
SELECT
	art.artId as "artId",
	art.sha1 as "sha1",
	art.filename as "filename",
	art.description as "description",
	to_char(art.ts,'yyyy-mm-dd hh24:mi:ss') as "ts",
	ud.name as "userName",
	art.dept as "dept"
FROM
	stigman.artifacts art
	left join stigman.user_data ud on ud.id=art.userId
WHERE
	art.artId = ?
END

#####################################
# END: SQL statements
#####################################

$sthSetContent = $dbh->prepare($sqlSetContent);
$sthSetContent->bind_param(1,$importSha1);
$sthSetContent->bind_param(2,$importData,{ ora_type => ORA_BLOB });
$sthSetContent->bind_param(3,$userId);
$rv = $sthSetContent->execute();

$sthSetArtifact = $dbh->prepare($sqlSetArtifact);
$sthSetArtifact->bind_param(1,$importSha1);
$sthSetArtifact->bind_param(2,$importFilename);
$sthSetArtifact->bind_param(3,$desc);
$sthSetArtifact->bind_param(4,$userId);
$sthSetArtifact->bind_param(5,$userDept);
$sthSetArtifact->bind_param_inout(6,\$artId,32);
$rv = $sthSetArtifact->execute();

if ($rv) {
	$responseHashRef->{'message'} = $importSha1;
	$artifactsRows = $dbh->selectall_arrayref($sqlGetArtifact,{ Slice => {} },($artId));
	$numRecords = @$artifactsRows;
	$responseHashRef->{'artifacts'} = {
		'records' => int $numRecords,
		'rows' => $artifactsRows
	};											

}
my $json = encode_json $responseHashRef;
print "Content-Type: text/html\n\n";
print $json;
