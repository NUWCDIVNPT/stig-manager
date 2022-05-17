Ext.ns('SM.WhatsNew')

SM.WhatsNew.Sources = [
  {
    date: '2022-05-16',
    header: `What's New Dialog on App Start`,
    body: 
    `
    On startup, STIG Manager now displays a "What's New" pop-up describing the latest features added to the app.  Click the "Don't show these features again" button and you will not be alerted until another new feature is added. Click "Dismiss" and you will be shown the pop-up again when you next load the app. 
    <br><br>
    <img src="img/whatsnew/whats-new-small.png"/>
    <br>
    <b>This list is always available from the "What's New" option in the new "Interface" node of the Navigation Tree.</b>
    `
  },
  {
    date: '2022-05-16',
    header: 'Dark Mode Preview Is Available',
    body: 
    `
    STIG Manager is now easier on the eyes! By popular request, STIGMan now provides a "Dark Mode" presentation for those STIG-ing after dark. This option is presented as a "Preview" feature that is expected to get additional aesthetic tweaks in the future. 
    <br><br>
    <b>Toggle Dark Mode on and off from the new Interface node of the Navigation Tree:</b>
    <br><br>
    <img src="img/whatsnew/dark-mode.png"/>
    `
  },
  {
    date: '2022-05-15',
    header: 'New Import Options and Additional Result Values',
    body: 
    `
    STIG Manager now provides Users with more fine-grained control over the way they import their .ckl and XCCDF files. Please see the <a href="https://stig-manager.readthedocs.io/en/latest/user-guide/user-guide.html#collection-settings-tab">STIG Manager Documentation for more details about these new Collection Settings</a>.
    <br><br>
    <b>Control these Import Options from the Manage Collection Workspace, or from individual file import interfaces:</b>
    <br><br>
    <img src="img/whatsnew/import-options.png"/>
    <br><br>
    <b>"Informational" and "Not Reviewed" Result values can now be selected manually:</b>
    <br><br>
    <img src="img/whatsnew/result-values-small.png"/>
    <br><br>
    Please note that only Reviews marked Not a Finding, Not Applicable, or Open can be set to a Submit status!
    `
  },  
  {
    date: '2022-05-15',
    header: 'Result Engine Property for Reviews',
    body: 
    `
    STIG Manager now stores and displays additional information about the source of your Reviews! Reviews produced by compatible Result Engines, such as the latest version of Evaluate STIG and those producing XCCDF results, will now be displayed with additional information about the source of the Evaluation.  This information can include the Result Engine that performed the Evaluation, the timestamp of the actual Evaluation, and information about any Eval STIG "Answer File" ("Override" for XCCDF results) that was used to generate the results. 
    <br><br>
    <b>Look for this type of sprite next to your Evaluation Result, and hover over it for more info:</b>
    <br><br>
    <img src="img/whatsnew/result-engine-1.png"/>
    <br><br>
    <b>Result Engine information for a Review is also indicated in checklist views:</b>
    <br><br>
    <img src="img/whatsnew/result-engine-2.png"/>
    <br>
    `
  },
  {
    date: '2022-05-01',
    header: 'Accept Reviews from the Asset-STIG Tab',
    body: 
    `
    Users with the appropriate Grant for a Collection can now Accept individual Reviews right from the Asset Review Workspace:
    <br><br>
    <img src="img/whatsnew/save-from-asset-review.png"/>
    <br>
    `
  }
]

SM.WhatsNew.BodyTpl = new Ext.XTemplate(
  `<div class=sm-home-widget-title>New Features in the STIG Manager App</div>`,
  `<tpl for=".">`,
    `<hr style="margin-left:20px;margin-right:20px;" />`,
    `<div class=sm-home-widget-text>`,
      `<div class=sm-home-widget-subtitle>{header}<div style="font-size:70%; font-style:italic;">({date})</div></div> `,
      `{body}`,
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
  let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024
  
  const panel = new Ext.Panel({
    border: false,
    autoScroll: true,
    tpl: SM.WhatsNew.BodyTpl,
    data: SM.WhatsNew.Sources.filter( item => item.date > lastDate )  
  })

  const btnDismiss = new Ext.Button({
    text: 'Dismiss',
    handler: function (b, e) {
      fpwindow.close()
    }
  })

  const btnRemember = new Ext.Button({
    text: `Don't show these features again`,
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
      btnDismiss
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