Ext.ns('SM.WhatsNew')

SM.WhatsNew.Sources = [
  {
    date: '2022-10-12',
    header: `New Metrics Report Replaces Status Report`,
    body: `<p>The old Status Report has been replaced with a shiny new Metrics Report!</p>
    
    <p>Available to all users from the NavTree, the new Metrics Report provides a much easier to digest view of the overall Status and Evaluation progress of your entire Collection, as well as metrics export options and various pivoted presentations of your Collection's assessment statistics.</p>
    
    <p>Please see the <a target="_blank" href="docs/user-guide/user-guide.html#metrics-report-workspace">STIG Manager Documentation for more details about this new feature!</a></p>
    <p><img src="img/whatsnew/2022-10-12-metrics-report1.png"/></p>
    `
  },        
  {
    date: '2022-09-12',
    header: `Review History Pruning`,
    body: `<p>Every time an individual Review for an Asset changes, a History record of its previous state is recorded.  With the release of this new feature, Collection Owners and Managers can now limit how many of these History records they keep for for each Review, or turn Review History off entirely.</p>
    
    <p>By default, STIG Manager caps history at 15 records for each Review.</p>
       
    <p>To find this new Collection Setting, from the <b>Collection Management</b> workspace, click the "Settings" tab. Use the pulldown to select your desired value:</p>
    <p><img src="img/whatsnew/2022-09-12-review-history-setting.png"/></p>
    `
  },      
  {
    date: '2022-08-17',
    header: `XCCDF Export Option`,
    body: `<p>This new feature allows users to export their review data in the XCCDF format. Look for this option wherever checklist result exports are offered: The Asset Review workspace, the Collection Review workspace, and the Collection Management workspace.   
    <p>For example, from the <b>Collection Management</b> workspace, click "Export Results..." and select the desired format from the pulldown menu:</p>
    <p><img src="img/whatsnew/2022-08-17-xxcdf-archive.png"/></p>
    `
  },    
  {
    date: '2022-07-19',
    header: `Streaming CKL Archive Export Option`,
    body: `<p>This option bring users better performance when exporting large numbers of .ckl files. The application will generate the exact same .ckl files whether or not this option is selected, they are just delivered to the client in a different way.</p>
    <p><b>Note:</b> This feature is being offered in an early "experimental" capacity to determine if it serves users needs appropriately. Please report any unexpected behavior. Modifications and improvements to the feature may be made in the future. </p> 
    <p>In the <b>Collection Management</b> workspace, click "Export CKLs..." and select the "Use streaming API" checkbox:</p>
    <p><img src="img/whatsnew/2022-07-19-streaming-archive.png"/></p>
    `
  },  
  {
    date: '2022-07-18',
    header: `Enhanced Options for Creating and Altering STIG-Asset Assignments`,
    body: `<p>Quickly create new STIG-Asset assignments based on an existing set of assignments:</p>
    <p>In the <b>Collection Management</b> workspace, select a STIG and click the "Modify..." button or double-click the STIG:</p>
    <p><img src="img/whatsnew/2022-07-18-STIG-assignment-modify.png"/></p>
    <p>A STIG Assignments window will pop up. Click the pull-down button now available in the BenchmarkId selection box. 
    <p>You will be presented with a list of available STIGs. Scroll to the STIG you want, or start typing to filter the list. Filtering now applies anywhere in the benchmarkId:</p>
    <p />
    <p><img src="img/whatsnew/2022-07-18-STIG-assignment-pulldown.png"/></p>
    <p>Select your desired STIG, make any required Asset changes with the "Assign Assets" button, and hit "Save."  
    <p>A <b>NEW</b> set of STIG-Asset Assignments will be created with the STIG you selected.</p>
    `
  },
  {
    date: '2022-07-14',
    header: `Checkbox Selection for Multi-select Grids`,
    body: `<p>In the <b>Collection Review</b> and <b>Collection Management</b> workspaces, grid rows can be selected with checkboxes.  Selecting the checkbox at the top of the column, or using the CTRL-A keyboard shortcut, will select all rows in the grid.</p>
    <p><img src="img/whatsnew/2022-07-15-selection-checkboxes.png"/></p>
    `
  },
  {
    date: '2022-07-14',
    header: `Review Detail and Comment Fields Now Capped at 32767 Characters`,
    body: `<p>For better performance and to align with character limits enforced in Excel and the next version of Evaluate-STIG, Review Detail and Comment text fields are now capped at 32767 characters.</p>
    `
  },  
  {
    date: '2022-07-11',
    header: `Enhanced User Lists in the Collection Grant Interface`,
    body: `<p>In the Collection Grants interface, the grid and dropdown lists now show the username and display name.</p>
    <p><img src="img/whatsnew/2022-07-11-A.png"/></p>
    <p>When selecting a User from the dropdown list, it is possible to filter the list on a string that appears anywhere in either the username or display name.</p>
    <p><img src="img/whatsnew/2022-07-11-B.png"/></p>
    `
  },
  {
    date: '2022-06-01',
    header: `Batch Editing Preview`,
    body: `Edit reviews for multiple Assets at once from the Collection Review workspace! This feature is offered as a preview of functionality that is actively under development, and may change somewhat before final release. <p />

    <p />
    <b>From the Collection Review workspace, select two or more Reviews, then click the "Batch edit" button:</b>
    <p />
    <img src="img/whatsnew/batch-edit-button.png"/>
    <p />
    <b>Make changes to any or all of the desired fields in the pop-up, and click "Apply Review." If you leave the Detail or Comment empty, Reviews will keep their existing commentary. To remove existing commentary, add a space to that field.</b>
    <p />
    <img src="img/whatsnew/batch-edit-popup.png"/>
    <p />
    <b>Your specified Result and Detail/Comment will be applied to all Assets selected!</b>
    <p />
    `
  },
  {
    date: '2022-05-18',
    header: `What's New Dialog on App Start`,
    body: `On startup, the App now displays a "What's New" dialog describing the latest features added to the App.<p />
    <ul><li>Click the <b>Don't show these features again</b> button and you will not be alerted until another new feature is added.</li>
    <li>Click <b>Close</b> and you will be shown the dialog again when you next load the App.</li></ul>
    <p />
    <b>The list of all recent changes is always available from Interface -> What's New.</b>
    `
  },
  {
    date: '2022-05-16',
    header: 'Dark Mode Preview',
    body: `STIG Manager is now easier on the eyes! By popular request, we now provide a "Dark Mode" presentation for those STIG-ing after dark. This feature is provided as a preview which is expected to get additional aesthetic tweaks in the future. 
    <p />
    <b>Toggle Dark Mode on and off via Interface -> Dark Mode.</b>
    <p />
    <img src="img/whatsnew/dark-mode.png"/>
    `
  },
  {
    date: '2022-05-16',
    header: 'New Import Options and Additional Result Values',
    body: `The App now provides Users with more fine-grained control over the way they import .ckl and XCCDF files. Please see the <a target="_blank" href="docs/user-guide/user-guide.html#collection-settings-tab">STIG Manager Documentation for more details about these new Collection Settings</a>.
    <p />
    <b>Control these Import Options from the Collection -> Manage workspace or from the import interfaces.</b>
    <p />
    <img src="img/whatsnew/import-options.gif"/>
    <p />
    <b>"Informational" and "Not Reviewed" Result values can now be selected manually:</b>
    <p />
    <img src="img/whatsnew/result-values.gif"/>
    <p />
    <b>Please note that only Reviews with result "Not a Finding", "Not Applicable", or "Open" can be set to a Submit status!</b>
    `
  },  
  {
    date: '2022-05-16',
    header: 'Result Engine Property for Reviews',
    body: `STIG Manager now stores and displays additional information about any tool used to perform an evaluation. Reviews produced by compatible Result Engines, such as the latest version of Evaluate-STIG and those producing XCCDF results, will now be displayed with additional information about the tool.  This information can include:
    <ul>
    <li>the Result Engine that performed the Evaluation</li>
    <li>the timestamp of the actual Evaluation</li>
    <li>information about any override (e.g., Evaluate-STIG "Answer File") to the engine's original result
    </ul> 
    <p />
    <b>Look for this type of sprite next to your Evaluation Result, and hover over it for more info:</b>
    <p />
    <img src="img/whatsnew/result-engine-1.png"/>
    <p />
    <b>Result Engine information for a Review is also indicated in the checklist views:</b>
    <p />
    <img src="img/whatsnew/result-engine-2.png"/>
    `
  },
  {
    date: '2022-04-20',
    header: 'Accept Reviews from the Asset-STIG Workspace',
    body: `Users with an appropriate Grant in a Collection can now Accept individual Reviews right from the Asset-STIG Workspace:
    <p />
    <img src="img/whatsnew/accept-review.gif"/>
    `
  }
]

SM.WhatsNew.BodyTpl = new Ext.XTemplate(
  `<div class="sm-home-widget-title">New Features in the STIG Manager App</div>`,
  `<tpl for=".">`,
    `<hr style="margin-left:20px;margin-right:20px;" />`,
    `<div class="sm-whats-new sm-home-widget-text">`,
      `<div class=sm-home-widget-subtitle>{header}<div style="font-size:70%; font-style:italic;">({date})</div></div> `,
      `<div style="width:800px;">{body}</div>`,
    `</div>`,
  `</tpl>`
)

SM.WhatsNew.addTab = function (params) {
	let { treePath } = params ?? {}
	const tab = Ext.getCmp('main-tab-panel').getItem('whats-new-tab')
	if (tab) {
		tab.show()
		return
	}
  const panel = new Ext.Panel({
    title: "What's New",
    cls: 'sm-round-panel',
    autoScroll: true,
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    region: 'center',
    border: false,
    tpl: SM.WhatsNew.BodyTpl,
    data: SM.WhatsNew.Sources  
  })
  const thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'whats-new-tab',
		sm_treePath: treePath,
		iconCls: 'sm-stig-icon',
		title: "What's New",
		closable:true,
		layout: 'border',
    layoutConfig: {
      targetCls: 'sm-border-layout-ct'
    },
		items: [panel]
	})

	thisTab.show();
}

SM.WhatsNew.showDialog = function (lastDate) {
  const vpSize = Ext.getBody().getViewSize()
  let height = vpSize.height * 0.75
  let width = 850
  
  const panel = new Ext.Panel({
    border: false,
    autoScroll: true,
    tpl: SM.WhatsNew.BodyTpl,
    data: SM.WhatsNew.Sources.filter( item => item.date > lastDate )  
  })

  const btnClose = new Ext.Button({
    text: 'Close',
    handler: function (b, e) {
      fpwindow.close()
    }
  })

  const btnRemember = new Ext.Button({
    text: `&nbsp;Don't show these features again&nbsp;`,
    handler: function (b, e) {
      localStorage.setItem('lastWhatsNew', SM.WhatsNew.Sources[0].date)
      fpwindow.close()
    }
  })

  const fpwindow = new Ext.Window({
    title: `What's New`,
    modal: true,
    resizable: false,
    width,
    height,
    layout: 'fit',
    plain: true,
    bodyStyle: 'padding:5px;',
    buttonAlign: 'right',
    buttons: [
      btnRemember,
      btnClose
    ],
    items: panel
  })

  fpwindow.show()

}

SM.WhatsNew.autoShow = function () {
  const lastWhatsNew = localStorage.getItem('lastWhatsNew') || '0000-00-00'
  if (SM.WhatsNew.Sources[0].date > lastWhatsNew) {
    SM.WhatsNew.showDialog(lastWhatsNew)
  }
}