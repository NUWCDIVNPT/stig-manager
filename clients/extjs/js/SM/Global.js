var appName = 'STIG Manager';
var appVersion = "3.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser, appConfig;

Ext.ns('SM')
SM.GetUserObject = async function () {
    try {
        let result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/user`,
            method: 'GET'
        })
        curUser = JSON.parse(result.response.responseText)
        return curUser
    }
    catch (e) {
        alert(e.message)
    }
}

SM.styledEmptyRenderer = v => v ? v : '<span class="sm-empty-cell" />'

SM.resultTipText = `<b>Evaluation Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;`

SM.resultCommentTipText = `<b>Evaluation Result Comment</b><br>A description of how the evaluator or evaluation tool determined the result.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;message&gt;`

SM.actionTipText = `<b>Recommended Action</b><br>For failed results (i.e., Open), the type of action recommended by the evaluator.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;metadata action&gt;`

SM.actionCommentTipText = `<b>Recommended Action Comment</b><br>For failed results (i.e., Open), the action plan recommended by the evaluator.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;metadata action-comment&gt;`


