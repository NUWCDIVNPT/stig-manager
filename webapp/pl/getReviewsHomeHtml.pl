#!/usr/bin/perl

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
$recordCount = $q->param('recordCount');

$db = $STIGMAN_DB;
$dbh = gripDbh("PSG-STIGMAN",undef,"oracle") or die $dbh->errstr;
if (!($userObj = getUserObject($stigmanId,$dbh,$q))) {
	exit;
}
if ($recordCount) {
	$class = 'sm-reviews-home-tasks';
	$title = 'Returned reviews';
	$text = 'There are returned reviews that require your attention.';
} else {
	$class = 'sm-reviews-home-no-tasks';
	$title = 'No returned reviews';
	$text = 'There are no returned reviews that require your attention.';
}

$section508link =<<END;
 <span class='cs-section-five-o-eight' onclick="alert('You have reached the Department of Defense (DoD) Accessibility Link, at which you may report issues of accessibility of DoD websites for persons with disabilities.\\n\\nIf your issue involves log in access, password recovery, or other technical issues, contact the administrator for the website in question, or your local helpdesk.\\n\\nThe U.S. Department of Defense is committed to making its electronic and information technologies accessible to individuals with disabilities in accordance with Section 508 of the Rehabilitation Act (29 U.S.C. 794d), as amended in 1998.\\n\\nFor persons with disabilities experiencing difficulties accessing content on a particular website, please email RSSDD-DODCIO.MailboxSection508@osd.smil.mil.  In your message, please indicate the nature of your accessibility problem, the website address of the requested content, and your contact information so we can address your issue.\\n\\nFor more information about Section 508 law, policies and resource guidance, please visit the DoD Section 508 website on NIPRNET (http://dodcio.defense.gov/DoDSection508.aspx) .  \\n\\nLast Updated:  04/30/2014')">Accessibility/Section 508</span>
END
$returnHtml =<<END;
	<div class='cs-home-header-reviews'>Reviews Home${section508link}</div>
<div class=$class>
	<div class='sm-reviews-home-body-title'>$title</div>
	<div class='sm-reviews-home-body-text'>$text</div>
</div>
END
print "Content-Type: text/html\n\n";
print $returnHtml;

