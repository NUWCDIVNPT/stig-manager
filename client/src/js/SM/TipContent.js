Ext.ns('SM.TipContent')

Ext.ns('SM.TipContent.ImportOptions')

SM.TipContent.ImportOptions.AutoStatus = `Choose the "Goal" status for imported reviews.
<br><br><b>Keep Existing:</b> Keep existing status, if possible. New reviews are set to "Saved" status. The resulting Status will also take into consideration the "Reset to Saved" configuration that is set in the Review Status section of Collection Settings. 
<br><br><b>Saved:</b> Set Reviews to "Saved" status.
<br><br><b>Submitted:</b> Set Review to "Submitted" status. If review does not meet Submit requirements, Review will be set to Saved.
<br><br><b>Accepted:</b> If importing user has the proper grant, set Review to "Accepted". If they cannot Accept, Reviews will be set to "Submitted." If review does not meet Submit requirements, Review will be set to "Saved."
<br><br>Note: Informational and Not Reviewed reviews will always be set to "Saved" status.
`

SM.TipContent.ImportOptions.Unreviewed = `Should Reviews without a compliance result (NF, NA, O) be imported? 
<br><br><b>Never:</b> Ignore these Reviews. Existing Reviews will not change.  
<br><br><b>Having Comments:</b> Import these Reviews only if Detail or Comment is also provided. This is usually only seen in CKL sources.
<br><br><b>Always:</b> Always import these Reviews.
`

SM.TipContent.ImportOptions.UnreviewedCommented = `The result to be imported for Reviews without a compliance result (NR, NA, O) but having Detail or Comment. This is usually only seen in CKL sources.
<br><br><b>Informational:</b> Set result to "Informational" to distinguish it from those Reviews without commentary. 
<br><br><b>Not Reviewed:</b> Leave the result as "Not_Reviewed"
`

SM.TipContent.ImportOptions.EmptyComment = `How to handle Reviews with empty commentary text:
<br><br><b>Ignored:</b> Retain any existing text already stored. 
<br><br><b>Replaced:</b> Create a static message. This message will become the text for the purposes of meeting submission requirements.
<br><br><b>Imported:</b> This will have the effect of clearing any existing text.
`


SM.TipContent.Roles = `
<b>Roles</b> <br>
- <b>Restricted:</b> Can access specific STIGs on specific Assets only. <br>
- <b>Full:</b> Can access any Asset/STIG in the Collection but cannot add/remove/modify Assets, STIGs, or Grants. <br>
- <b>Manage:</b> Can access any Asset/STIG in the Collection and can also add/remove/modify Assets, STIGs, and Grants except for User "Owner" grants. Optionally responsible for accepting and rejecting reviews from evaluators. <br>
- <b>Owner:</b> Everything in the "Manage" level.  Can also delete the Collection and create new Owner Grants.  Responsible for accepting and rejecting reviews from evaluators. <br>
<br>
* By default, Users with a Restricted grant to a Collection can't access any STIG on any Asset. They can be assigned specific STIGs on specific Assets using the "Edit Restriced Access..." button in the Grants panel toolbar. <br>
`

SM.TipContent.RulePropertyDiffs = `<b>Changes to these rule properties are detected</b><br>
- ruleId<br>
- title<br>
- groupId<br>
- groupTitle<br>
- severity<br>
- weight<br>
- mitigations<br>
- documentable<br>
- falseNegatives<br>
- falsePositives<br>
- responsibility<br>
- vulnDiscussion<br>
- thirdPartyTools<br>
- potentialImpacts<br>
- mitigationControl<br>
- severityOverrideGuidance<br>
- check<br>
- fix<br>
- cci<br>
`

SM.TipContent.DefaultRevision = `
<b>Set the default STIG revision to use for this Collection.</b> <br><br>
All calculated Metrics and Workspaces for this Collection will default to the "pinned" STIG Revision specified here. <br><br>
- <b>Most Recent Revision:</b> The Collection Metrics and Workspaces will default to the latest STIG in the system as they are updated. <br><br>
- <b>Revision String (Date):</b> Pin the default to the specified Revision<br><br>
`

Ext.ns('SM.TipContent.CloneOptions')

SM.TipContent.CloneOptions.ClickThru = `<span class="sm-warning-header">Warning</span><br><br>
Cloning large Collections can take several minutes! Users may see performance impacts when accessing the source Collection during this time.<br><br>

Making changes to the source Collection while it is being cloned may lead to inconsistent results in the cloned Collection.<br><br>

<b>Before proceeding, it is recommended that you warn other Users to refrain from modifying any components of the source Collection while the cloning process is underway.</b>`

SM.TipContent.CloneOptions.Grants = `<b>Clone the source Collection's users and their grants.</b><br><br>Whether this option is selected or not, the creator of the cloned Collection (ie. you) will be given an Owner grant in the clone.`

SM.TipContent.CloneOptions.Labels = `<b>Clone the source Collection's available labels.</b><br><br>You must select this option AND the Assets option for labels to be mapped to Assets in the clone.`

SM.TipContent.CloneOptions.Assets = `<b>Clone the source Collection's Assets and their core properties.</b><br><br>This option must be selected to enable the STIGs and Pin Revisions options below.`

SM.TipContent.CloneOptions.Stigs = `<b>Assignments and Reviews:</b> Assets will be cloned with their current STIG assignments and ALL stored Reviews. This will include Reviews that are no longer associated with a current STIG assignment or are associated with a non-default Revision of a STIG.<br><br>
<b>Assignments but not Reviews:</b> Assets will be cloned with their current STIG assignments but NO stored Reviews will be cloned. All Metrics will be set to zero.<br><br> 
<b>Do not clone assignments or Reviews:</b> Assets will be cloned with only their core properties and no STIG assignments or Reviews. The Pin Revisions option will be disabled.`

SM.TipContent.CloneOptions.Revisions = `<b>Match the source's pinned Revisions:</b> STIGs in the source Collection that are pinned to a specific Revision will be pinned to that Revision in the clone. STIGs that track the latest Revision (unpinned) in the source will be unpinned in the clone.<br><br> 
<b>Pin the source's default revisions:</b> All STIGs in the clone will be pinned to a specific Revision. STIGs that are pinned to a specific Revision in the source Collection will be pinned to that Revision in the clone. STIGs that track the latest Revision in the source will be pinned to the current latest Revision in the clone.`

Ext.ns('SM.TipContent.ExportOptions')

SM.TipContent.ExportOptions.CollectionTpl = `Export results for selected Assets/STIGs to another Collection.<br><br>
Assets or STIG Assignments that do not exist in the destination Collection will be created. Reviews for existing Assets will be updated in accordance with the destination Collection's import settings.<br><br>
The user must have a "Manage" or "Owner" grant in the destination Collection.<br><br>
<b>Exporting results to another Collection is limited to a maximum of {maxItems} Assets at a time.</b>`

SM.TipContent.ExportOptions.ZipArchive = `Export a .zip archive of checklists for selected Assets/STIGs in the desired format.`

SM.TipContent.ImportFromCollectionPanel = `Will not create new Assets or STIG assignments.<br><br>To create new Assets or STIG assignments, import from the Collection Management workspace.`

SM.TipContent.ImportFromCollectionManager = `Will create new Assets and STIG assignments if they do not exist in this Collection.`

SM.TipContent.CORA =`
 <b>Cyber Operational Readiness Assessment (CORA)</b> evaluates the effectiveness of security controls and operational processes.<br><br>
 <b>Risk Rating</b> is calculated from a <b>Weighted Average</b> that reflects the number and severity of <i>open</i> or <i>unassessed</i> rules.<br>
 Reviews with <i>Open</i>, <i>Not a Finding</i>, or <i>Not Applicable</i> results are considered <i>assessed</i>.<br>
 Reviews with other results (such as <i>Not Reviewed</i> or <i>Informational</i>) are treated as <i>unassessed</i>.
 <br><br>
  Each severity category (CAT I, II, III) is weighted differently when calculating the overall score:
  <br>
  <b>Weighted Average</b> formula:<br>
  <code>(p₁·w₁ + p₂·w₂ + p₃·w₃) / (w₁ + w₂ + w₃)</code><br>
  where:<br>
  - <code>pₙ</code> = % of open + unassessed rules in that category<br>
  - <code>wₙ</code> = weight <b>(CAT I = 10, CAT II = 4, CAT III = 1)</b><br><br>
  The <b>Risk Rating</b> is primarily determined by the <b>Weighted Average</b>, except for the special "Low" risk condition:<br>
  <ul style="padding-left: 16px; margin: 4px 0;">
    <li><span class="sm-cora-tooltip-label sm-cora-risk-very-high"><b>Very High</b></span><b> ≥ 20%</b></li>
    <li><span class="sm-cora-tooltip-label sm-cora-risk-high"><b>High</b></span><b> ≥ 10% and &lt; 20%</b></li>
    <li><span class="sm-cora-tooltip-label sm-cora-risk-moderate"><b>Moderate</b></span><b> &gt; 0% and &lt; 10%</b></li>
    <li><span class="sm-cora-tooltip-label sm-cora-risk-low"><b>Low</b></span><b> CAT I = 0; CAT II &amp; III each &lt; 5% <i>unweighted</i></b></li>
    <li><span class="sm-cora-tooltip-label sm-cora-risk-very-low"><b>Very Low</b></span><b> 0% total</b></li>
  </ul>
`
