Ext.ns('SM.WhatsNew')

SM.WhatsNew.Sources = [
  {
    date: '2024-03-17',
    header: `Bulk Checklist Imports Now Available to All Users`,
    body: `
    <p>
    All Users can now import multiple checklists at once from the Collection Dashboard. When initiated from the Collection Dashboard, the import will bring in Reviews for existing Assets and their STIG assignments, but no new Assets or STIG assignments will be created. <p>To create new Assets or STIG Assignments, Managers and Owners can still initiate an import from the Manage Collection Workspace.
    <p>
    <p><img src="img/whatsnew/2024-03-15-dashboard-import.png"/></p>
    `    
  },     

  {
    date: '2024-03-01',
    header: `Review Age Info Now Available In All Review Grids`,
    body: `
    <p>
    Review ages and timestamps can now be displayed in the top-level grid presentations of the Asset and Collection Review workspaces. The age displayed is calculated using the last time any part of the Review was altered. Hover over a Review age to see the date that change was made.<p>

    Review ages are presented by default in the last column of the Asset Review checklist:
    <p>
    <p><img src="img/whatsnew/2024-03-01-asset-workspace-dates.png"/></p>

    <p>The "Other Assets" tab also shows this column now:</p>
    <p><img src="img/whatsnew/2024-03-01-asset-workspace-dates-other-assets.png"/></p>

    In the Collection Review workspace, the Review age columns are hidden by default. Use the column picker to add them to your view. Changes made to this display will persist when you return to the workspace later:

    <p><img src="img/whatsnew/2024-03-01-collection-workspace-checklist-dates.png"/></p>

    <p>Review ages are presented by default in the last column of the individual Asset Review grid:

    <p><img src="img/whatsnew/2024-03-01-collection-workspace-asset-dates.png"/></p>

    `    

  },    


  {
    date: '2024-01-17',
    header: `New Meta Dashboard`,
    body: `
    <p>
    The new Meta Dashboard provides totals and metrics for some or all of your Collections at a glance. The Collections Tab shows top-level metrics for each Collection, while the STIGs tab shows metrics for each STIG across Collections.  
    <p>
    Access the Meta Dashboard by clicking on the Report icon in the top-level Collections node of the Navigation Tree:
    <p>
    <p><img src="img/whatsnew/2024-01-17-meta-collection-icon.png"/></p>

    <p>Control which Collections are included in the Meta Dashboard with the filters at the top of the Overview panel:</p>

    <p><img src="img/whatsnew/2024-01-17-meta-collection-panel-overview-filters.png"/></p>
    `    
  },      
  
  {
    date: '2023-10-31',
    header: `New Interfaces for Managing Asset Labels and STIG Assignments`,
    body: `
    <p>
    Managing a Collection's Asset Labels and STIG Assignments should now be a more streamlined and informative experience.  Just drag and drop Assets between the two panels to add or remove the selected Label or STIG:

    <p><img src="img/whatsnew/2023-10-31-new-label-interface-w-arrow.png"/></p>

    <p>The new interface also provides additional information about your Assets to help find what you're looking for. Hover over the Asset's name to see its currently assigned STIGs:</p>

    <p><img src="img/whatsnew/2023-10-31-new-label-interface-with-popup-crop.png"/></p>

    <p>Click on a column header to filter on that column's data, or to add or remove columns of Asset information:</p>

    <p><img src="img/whatsnew/2023-10-31-new-label-interface-filters-columns-crop.png"/></p>

    `    
  },      
  {
    date: '2023-09-26',
    header: `Export Results to Another Collection`,
    body: `
    <p>
    Collection Managers and Owners can now export results from one Collection to another Collection. This feature is available from the Manage Collection Workspace using the "Export Results..." button in both the Asset and STIG Assignment panels.  Use the radio buttons to select the desired export action. 
    </p>

    <p><b>Note:</b><b>Exporting Results to another Collection is limited to 100 Assets at a time, and the User must have "Manage" or "Owner" grants in the destination Collection.</b></p>

    <p><img src="img/whatsnew/2023-09-27-results-export-collection.png"/></p>

    `    
  },    
  {
    date: '2023-08-21',
    header: `Provisional .CKLB Support`,
    body: `
    <p>
    STIG Manager can now import and export data using the new .cklb file format introduced by DISA with the release of STIG Viewer 3. 
    </p>

    <p><b>Note:</b><b>.CKLB is a new format and may be subject to change without notice! </b></p>

    <p><img src="img/whatsnew/2023-08-20-cklb-export.png"/></p>

    <p><img src="img/whatsnew/2023-08-20-cklb-zip-export.png"/></p>
    `    
  },  
  {
    date: '2023-08-08',
    header: `Collection Cloning`,
    body: `
    <p>Collection Owners and Managers can now clone their Collections! Cloning a Collection can create a new Collection that is substantially the same as the source Collection, but must have a different name. 
    </p>

    <p>Users can choose to copy the Assets, their STIGs, Labels, and/or Reviews from the original Collection into the new one. They can also choose to copy the User Grants from the original Collection into the new one, and pin STIG Revisions to their current values. The User who created the cloned Collection will always be made an Owner of the new Collection.
    </p>
    
    <p><img src="img/whatsnew/2023-08-08-collection-clone-button.png"/></p>

    <p><img src="img/whatsnew/2023-08-08-collection-clone-options.png"/></p>

    <p><b>Note:</b><b> Large Collections can take several minutes to clone! During this time, Users will likely see a performance impact when accessing the source Collection. Making changes to the source Collection while it is being cloned may lead to inconsistent results in the cloned Collection. You may want to alert your users before cloning a large Collection!</b></p>

    <p>Once the clone operation has started, a status bar will appear at the bottom of the screen.  Users can continue to use STIG Manager while the clone operation is in progress, but performance may be impacted when accessing the source Collection. The status bar will update when the clone is complete.</p>

    <p><img src="img/whatsnew/2023-08-08-collection-clone-status-bar.png"/></p>`    
  },  

  {
    date: '2023-06-20',
    header: `Set the Default STIG Revision for a Collection`,
    body: `
    <p>Collection Owners and Managers can now specify the default STIG Revision that will be used for their Collection. All Workspaces will open and all Metrics will be calculated using the "pinned" Revision. Without setting a pin, STIG Manager will always use the latest STIG Revision known to the system. The "pinned" Revision will be indicated by a pin <span class="sm-whats-new-no-border"><img src="img/pin.svg" width="14" height="14"/></span> icon in the Collection Dashboard and Management Workspaces.</p>

    
    <p><b>Note:</b> A STIG must be assigned to at least one Asset in a Collection in order to be Pinned!</p>

    <p> Your options, available from the STIG Assignment Panel in the Manage Collection Workspace:</p>
      <b>- Most Recent Revision:</b> The Collection Metrics and Workspaces will default to the latest STIG in the system as they are updated. <br>
      <b>- Revision String (Date):</b> Pin the default to the specified STIG Revision<br><br>

    <p><img src="img/whatsnew/2023-06-20-revision-pinning.png"/></p>`    
  },  

  {
    date: '2023-05-20',
    header: `Tally Sprites for Most Display Grids`,
    body: `
    <p>New tally sprites have been added to the bottom toolbars of grids that display Review data. These sprites show the relevant counts for the various rows, results, and statuses displayed in the grids above.</p>

    <p>These sprites respond to filters you have active on your view of the grid data. For example, if you have a filter active that only shows CAT 1 Rules with a Result of "Open", the tally sprite will only count Reviews for CAT 1 Rules with a Result of "Open". </p>

    <p>Hover over the sprites for tooltips describing their contents.</p>

    <p><img src="img/whatsnew/2023-05-20-tally-sprites.png"/></p>

    <p>Note: The "Other" column in the Collection Review grid has been renamed to "NR+" to better describe its contents.</p>`    
  },  
  {
    date: '2023-04-27',
    header: `Reviews now persist across most Rule changes!`,
    body: `
    <p>Reviews are now tracked using the specific Check Content and Version ("STIG ID") of a STIG Rule, rather than the RuleId. This new behavior will preserve Reviews when DISA STIG Releases make only minor changes to the Rule text, such as to the description, discussion, or reference elements. <b>Reviews will continue to apply to Rules in new STIG Revisions unless the actual Check Content or STIG ID for a STIG Rule changes.</b></p>

    <ul><li><p>Below is a screenshot of the STIG Comparison tool (Available from the STIG Library node of the Navigation Tree) showing some of the differences between two Revisions of the RHEL 8 STIG. <b>Previously, all Rules in the red box would have required re-evaluation for the new STIG Revision. Now, only the Rule in the yellow box will require re-evaluation, because the actual check for that Rule has changed.</b></p></li></ul>

    <p><img src="img/whatsnew/2023-04-25-review-key-differ.png"/></p>

    <p>There are a very small number of exceptions to this behavior, please see the <a target="_blank" href="docs/user-guide/rule-exceptions.html">STIG Manager Documentation for more details.</a></p>`    
  },

  {
    date: '2023-01-11',
    header: `New Collection Dashboard!`,
    body: `
    <p>The original Navigation Tree has been trimmed down, and all navigation to reports and workspaces within a Collection have been moved to the Collection Dashboard. The Dashboard is an enhanced version of the Metrics Report released a few months ago.</p>
    <p>Instead of expanding Collection nodes that can get bogged down with thousands of Assets, clicking on a Collection now immediately opens the Collection Dashboard. This Dashboard shows all the same data previously shown in the Metrics Report, but with additional Navigation options and indicators.</p>    
    <p>The Navigation Tree is now only used to select your working Collection, the STIG library, User Interface options, and Application Management Functions.</p>

    <p><b>All features previously accessed via the deeper nodes of the Navigation Tree can now be accessed from the Collection Dashboard:</b></p>

    <ul>
      <li>
      <b>Collection Management Workspace</b>: Click on the gear icon in the Inventory box in the Collection Overview panel.
      </li>
      <ul>
        <img src="img/whatsnew/2023-01-09-collection-dash-inventory-management.png"/>
      </ul>

      <li>
        <b>Findings Report</b>: Click on the Details icon in the Findings box in the Collection Overview panel.
      </li>
      <ul>
        <img src="img/whatsnew/2023-01-09-collection-dash-findings-details.png"/>
      </ul>

      <li>
        <b>Collection Review Workspace</b>: Double-click on a STIG or click the green STIGMan Shield in the STIGs metrics grid.
      </li>
      <ul>
        <img src="img/whatsnew/2023-01-09-collection-dash-stig-shield.png"/>
      </ul>

      <li>
        <b>Asset Review Workspace</b>: Double-click on an Asset or click the green STIGMan Shield in an Asset metrics grid.
      </li>
      <ul>
        <img src="img/whatsnew/2023-01-09-collection-dash-asset-shield.png"/>
      </ul>
    </ul>         


    <p>Please see the <a target="_blank" href="docs/user-guide/user-guide.html#collection-dashboard">STIG Manager Documentation for more details about this new feature!</a></p>`
  },       

  {
    date: '2023-01-10',
    header: `New STIG Revision Compare Tool!`,
    body: `
    <p>Now available for preview is our new Revision Compare tool. Select a STIG, then two Revisions, and the tool will present a list of STIG IDs and how their Rules changed between revisions. Click on Rule to see a detailed comparison of how each field that STIG Manager tracks differs between the two versions.</p>
    
    <p><b>The Revision Compare tool is available from the STIG Library node of the Navigation Tree.</b> </p>


    <p><img src="img/whatsnew/2023-01-09-stig-compare-tool-crop.png" width="800"/></p>`
  },     
  
  {
    date: '2022-10-12',
    header: `New Metrics Report Replaces Status Report`,
    body: `<p>The old Status Report has been replaced with a shiny new Metrics Report!</p>
    
    <p>Available to all users from the NavTree, the new Metrics Report provides a much easier to digest view of the overall Status and Evaluation progress of your entire Collection, as well as metrics export options and various pivoted presentations of your Collection's assessment statistics.</p>
    
    <p>Please see the <a target="_blank" href="docs/user-guide/user-guide.html#metrics-report-workspace">STIG Manager Documentation for more details about this new feature!</a></p>
    <p><img src="img/whatsnew/2022-10-12-metrics-report1.png"/></p>`
  },        
  {
    date: '2022-09-12',
    header: `Review History Pruning`,
    body: `<p>Every time an individual Review for an Asset changes, a History record of its previous state is recorded.  With the release of this new feature, Collection Owners and Managers can now limit how many of these History records they keep for for each Review, or turn Review History off entirely.</p>
    
    <p>By default, STIG Manager caps history at 15 records for each Review.</p>
       
    <p>To find this new Collection Setting, from the <b>Collection Management</b> workspace, click the "Settings" tab. Use the pulldown to select your desired value:</p>
    <p><img src="img/whatsnew/2022-09-12-review-history-setting.png"/></p>`
  },      
  {
    date: '2022-08-17',
    header: `XCCDF Export Option`,
    body: `<p>This new feature allows users to export their review data in the XCCDF format. Look for this option wherever checklist result exports are offered: The Asset Review workspace, the Collection Review workspace, and the Collection Management workspace.   
    <p>For example, from the <b>Collection Management</b> workspace, click "Export Results..." and select the desired format from the pulldown menu:</p>
    <p><img src="img/whatsnew/2022-08-17-xxcdf-archive.png"/></p>`
  },    
  {
    date: '2022-07-19',
    header: `Streaming CKL Archive Export Option`,
    body: `<p>This option bring users better performance when exporting large numbers of .ckl files. The application will generate the exact same .ckl files whether or not this option is selected, they are just delivered to the client in a different way.</p>
    <p><b>Note:</b> This feature is being offered in an early "experimental" capacity to determine if it serves users needs appropriately. Please report any unexpected behavior. Modifications and improvements to the feature may be made in the future. </p> 
    <p>In the <b>Collection Management</b> workspace, click "Export CKLs..." and select the "Use streaming API" checkbox:</p>
    <p><img src="img/whatsnew/2022-07-19-streaming-archive.png"/></p>`
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
    <p>A <b>NEW</b> set of STIG-Asset Assignments will be created with the STIG you selected.</p>`
  },
  {
    date: '2022-07-14',
    header: `Checkbox Selection for Multi-select Grids`,
    body: `<p>In the <b>Collection Review</b> and <b>Collection Management</b> workspaces, grid rows can be selected with checkboxes.  Selecting the checkbox at the top of the column, or using the CTRL-A keyboard shortcut, will select all rows in the grid.</p>
    <p><img src="img/whatsnew/2022-07-15-selection-checkboxes.png"/></p>`
  },
  {
    date: '2022-07-14',
    header: `Review Detail and Comment Fields Now Capped at 32767 Characters`,
    body: `<p>For better performance and to align with character limits enforced in Excel and the next version of Evaluate-STIG, Review Detail and Comment text fields are now capped at 32767 characters.</p>`
  },  
  {
    date: '2022-07-11',
    header: `Enhanced User Lists in the Collection Grant Interface`,
    body: `<p>In the Collection Grants interface, the grid and dropdown lists now show the username and display name.</p>
    <p><img src="img/whatsnew/2022-07-11-A.png"/></p>
    <p>When selecting a User from the dropdown list, it is possible to filter the list on a string that appears anywhere in either the username or display name.</p>
    <p><img src="img/whatsnew/2022-07-11-B.png"/></p>`
  },
  {
    date: '2022-06-01',
    header: `Batch Editing Preview`,
    body: `Edit reviews for multiple Assets at once from the Collection Review workspace! This feature is offered as a preview of functionality that is actively under development, and may change somewhat before final release. <p />

    <p/>
    <b>From the Collection Review workspace, select two or more Reviews, then click the "Batch edit" button:</b>
    <p/>
    <img src="img/whatsnew/batch-edit-button.png"/>
    <p/>
    <b>Make changes to any or all of the desired fields in the pop-up, and click "Apply Review." If you leave the Detail or Comment empty, Reviews will keep their existing commentary. To remove existing commentary, add a space to that field.</b>
    <p/>
    <img src="img/whatsnew/batch-edit-popup.png"/>
    <p/>
    <b>Your specified Result and Detail/Comment will be applied to all Assets selected!</b>
    <p/>`
  },
  {
    date: '2022-05-18',
    header: `What's New Dialog on App Start`,
    body: `On startup, the App now displays a "What's New" dialog describing the latest features added to the App.<p />
    <ul><li>Click the <b>Don't show these features again</b> button and you will not be alerted until another new feature is added.</li>
    <li>Click <b>Close</b> and you will be shown the dialog again when you next load the App.</li></ul>
    <p/>
    <b>The list of all recent changes is always available from Interface -> What's New.</b>`
  },
  {
    date: '2022-05-16',
    header: 'Dark Mode Preview',
    body: `STIG Manager is now easier on the eyes! By popular request, we now provide a "Dark Mode" presentation for those STIG-ing after dark. This feature is provided as a preview which is expected to get additional aesthetic tweaks in the future. 
    <p/>
    <b>Toggle Dark Mode on and off via Interface -> Dark Mode.</b>
    <p/>
    <img src="img/whatsnew/dark-mode.png"/>`
  },
  {
    date: '2022-05-16',
    header: 'New Import Options and Additional Result Values',
    body: `The App now provides Users with more fine-grained control over the way they import .ckl and XCCDF files. Please see the <a target="_blank" href="docs/user-guide/user-guide.html#collection-settings-tab">STIG Manager Documentation for more details about these new Collection Settings</a>.
    <p/>
    <b>Control these Import Options from the Collection -> Manage workspace or from the import interfaces.</b>
    <p/>
    <img src="img/whatsnew/import-options.gif"/>
    <p/>
    <b>"Informational" and "Not Reviewed" Result values can now be selected manually:</b>
    <p/>
    <img src="img/whatsnew/result-values.gif"/>
    <p/>
    <b>Please note that only Reviews with result "Not a Finding", "Not Applicable", or "Open" can be set to a Submit status!</b>`
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
    <p/>
    <b>Look for this type of sprite next to your Evaluation Result, and hover over it for more info:</b>
    <p/>
    <img src="img/whatsnew/result-engine-1.png"/>
    <p/>
    <b>Result Engine information for a Review is also indicated in the checklist views:</b>
    <p/>
    <img src="img/whatsnew/result-engine-2.png"/>`
  },
  {
    date: '2022-04-20',
    header: 'Accept Reviews from the Asset-STIG Workspace',
    body: `Users with an appropriate Grant in a Collection can now Accept individual Reviews right from the Asset-STIG Workspace:
    <p/>
    <img src="img/whatsnew/accept-review.gif"/>`
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
  let lastWhatsNew = localStorage.getItem('lastWhatsNew') || '0000-00-00'
  
  // transform any non-standard date from a previous release
  const dateParts = lastWhatsNew.split('-')
  lastWhatsNew = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`
  
  if (SM.WhatsNew.Sources[0].date > lastWhatsNew) {
    SM.WhatsNew.showDialog(lastWhatsNew)
  }
}