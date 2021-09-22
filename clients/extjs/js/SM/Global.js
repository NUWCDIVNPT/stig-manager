var appName = 'STIG Manager';
var appVersion = "3.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser, appConfig;

Ext.ns('SM')
SM.GetUserObject = async function () {
    let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/user`,
        method: 'GET'
    })
    curUser = JSON.parse(result.response.responseText)
    curUser.collectionGrants.sort((a, b) => {
        const nameA = a.collection.name
        const nameB = b.collection.name
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }
        return 0
    })
    return curUser
}

SM.styledEmptyRenderer = v => v ? v : '<span class="sm-empty-cell" />'

SM.ResultTipText = `<b>Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;`

SM.ResultTipTpl = new Ext.XTemplate(
    `<b>Result</b><br>The result of an evaluation of a STIG ruleId.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;STATUS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;result&gt;`
)
SM.DetailTipText = `<b>Detail</b><br>A description of how the evaluator or evaluation tool determined the result.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;message&gt;`

SM.DetailTipTpl = new Ext.XTemplate(
    '<b>Detail</b><br>A description of how the evaluator or evaluation tool determined the result.<br><br>',
    '<b>Collection Settings</b></br>This field is enabled ',
    `<tpl if="detailEnabled == 'always'">for any result.<br></tpl>`,
    `<tpl if="detailEnabled == 'findings'">for findings only.<br></tpl>`,
    `Content in this field is `,
    `<tpl if="detailRequired == 'always'">required to submit a review.<br></tpl>`,
    `<tpl if="detailRequired == 'findings'">required to submit a finding.<br></tpl>`,
    `<tpl if="detailRequired == 'optional'">optional.<br></tpl>`,
    `<br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;FINDING_DETAILS&gt;<br><b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;message&gt;`
)

SM.actionTipText = `<b>Recommended Action</b><br>For failed results (i.e., Open), the type of action recommended by the evaluator.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;metadata action&gt;`

SM.CommentTipText = `<b>Comment</b><br>Additional comment by the evaluator or evaluation tool.<br><br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
<b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;metadata action-comment&gt;`

SM.CommentTipTpl = new Ext.XTemplate(
    '<b>Comment</b><br>Additional comment by the evaluator or evaluation tool.<br><br>',
    '<b>Collection Settings</b></br>This field is enabled ',
    `<tpl if="commentEnabled == 'always'">for any result.<br></tpl>`,
    `<tpl if="commentEnabled == 'findings'">for findings only.<br></tpl>`,
    `Content in this field is `,
    `<tpl if="commentRequired == 'always'">required to submit a review.<br></tpl>`,
    `<tpl if="commentRequired == 'findings'">required to submit a finding.<br></tpl>`,
    `<tpl if="commentRequired == 'optional'">optional.<br></tpl>`,
    `<br><b>Export Mappings</b><br><b>CKL:</b> &lt;CHECKLIST&gt;&lt;STIGS&gt;&lt;iSTIG&gt;&lt;VULN&gt;&lt;COMMENTS&gt;<br>
    <b>XCCDF:</b> &lt;TestResult&gt;&lt;rule-result&gt;&lt;metadata action-comment&gt;`
)

SM.RenderResult = {
    fail: {
        css: 'sm-result-fail',
        textDisa: 'O',
        textNist: 'F'
    },
    pass: {
        css: 'sm-result-pass',
        textDisa: 'NF',
        textNist: 'P'
    },
    notapplicable: {
        css: 'sm-result-na',
        textDisa: 'NA',
        textNist: 'N'
    },
    notchecked: {
        css: 'sm-result-nr',
        textDisa: 'NR',
        textNist: 'K'
    },
    unknown: {
        css: 'sm-result-nr',
        textDisa: 'U',
        textNist: 'U'
    },
    error: {
        css: 'sm-result-nr',
        textDisa: 'E',
        textNist: 'E'
    },
    notselected: {
        css: 'sm-result-nr',
        textDisa: 'S',
        textNist: 'S'
    },
    informational: {
        css: 'sm-result-nr',
        textDisa: 'I',
        textNist: 'I'
    },
    fixed: {
        css: 'sm-result-pass',
        textDisa: 'F',
        textNist: 'F'
    }
}

SM.RuleContentTpl = new Ext.XTemplate(
    '<div class=cs-home-header-top>{ruleId}',
      '<span class="sm-content-sprite sm-severity-{severity}">',
        `<tpl if="severity == 'high'">CAT 1</tpl>`,
        `<tpl if="severity == 'medium'">CAT 2</tpl>`,
        `<tpl if="severity == 'low'">CAT 3</tpl>`, 
      '</span>',
    '</div>',
    '<div class=cs-home-header-sub>{title}</div>',
    '<div class=cs-home-body-title>Manual Check',
    '<div class=cs-home-body-text>',
    '<tpl for="checks">',
      '<pre>{[Ext.util.Format.htmlEncode(values.content?.trim())]}</pre>',
    '</tpl>',
    '</div>',
    '</div>',
    '<div class=cs-home-body-title>Fix',
    '<div class=cs-home-body-text>',
    '<tpl for="fixes">',
    '<pre>{[Ext.util.Format.htmlEncode(values.text?.trim())]}</pre>',
    '</tpl>',
    '</div>',
    '</div>',
    '<div class=cs-home-header-sub></div>',
    '<div class=cs-home-body-title>Other Data',
    '<tpl if="values.detail.vulnDiscussion">',
      '<div class=cs-home-body-text><b>Vulnerability Discussion</b><br><br>',
      '<pre>{[Ext.util.Format.htmlEncode(values.detail.vulnDiscussion?.trim())]}</pre>',
      '</div>',
    '</tpl>',
    '<tpl if="values.detail.documentable">',
    	'<div class=cs-home-body-text><b>Documentable: </b>{values.detail.documentable}</div>',
		'</tpl>',
    '<tpl if="values.detail.responsibility">',
      '<div class=cs-home-body-text><b>Responsibility: </b>{values.detail.responsibility}</div>',
    '</tpl>',
    '<tpl if="values.ccis.length === 0">',
      '<div class=cs-home-body-text><b>Controls: </b>No mapped controls</div>',
    '</tpl>',
    '<tpl if="values.ccis.length !== 0">',
      '<div class=cs-home-body-text><b>Controls: </b><br>',
      '<table class=cs-home-body-table border="1">',
      '<tr><td><b>CCI</b></td><td><b>AP Acronym</b></td><td><b>Control</b></td></tr>',
      '<tpl for="ccis">',
      '<tr><td>{cci}</td><td>{apAcronym}</td><td>{control}</td></tr>',
      '</tpl>',
      '</table>',
      '</div>',
    '</tpl>',
    '</div>'
  )

