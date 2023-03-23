Ext.ns('SM.TipContent')

Ext.ns('SM.TipContent.ImportOptions')

SM.TipContent.ImportOptions.AutoStatus = `Choose the "Goal" status for imported reviews.
<br><br><b>Keep Existing:</b> Keep existing status, if possible. New reviews are set to "Saved" status. The resulting Status will also take into consideration the "Reset to Saved" configuration that is set in the Review Status section of Collection Settings. 
<br><br><b>Saved:</b> Set Reviews to "Saved" status.
<br><br><b>Submitted:</b> Set Review to "Submitted" status. If review does not meet Submit requirements, Review will be set to Saved.
<br><br><b>Accepted:</b> If importing user has the proper grant, set Review to "Accepted". If they cannot Accept, Reviews will be set to "Submitted." If review does not meet Submit requirements, Review will be set to "Saved."
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


SM.TipContent.AccessLevels = `
<b>Grant Access Levels</b> <br>
- <b>Restricted:</b> Can review specific STIGs on specific Assets only. <br>
- <b>Full:</b> Can review any Asset/STIG in the Collection. <br>
- <b>Manage:</b> Everything in the "Full" level.  Can Add/Remove/Modify Assets, STIGs, and Users with the exception of User "Owner" grants. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators. <br>
- <b>Owner:</b> Everything in the "Manage" level.  Can Delete the Collection and create new Owner Grants.  Responsible for "Accepting"  and "Rejecting" reviews from evaluators. <br>
<br>
* In order to be useful, Users with Restricted access to a Collection must be assigned specific STIGs on specific Assets using the "User access..." button in the Grants panel toolbar. <br>
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