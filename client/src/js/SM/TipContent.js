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