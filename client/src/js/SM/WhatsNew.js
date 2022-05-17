Ext.ns('SM.WhatsNew')

SM.WhatsNew.Sources = [
  {
    date: '2022-05-16',
    header: `What's New dialog on App start`,
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br></br><b>Curabitur posuere est mi, quis egestas elit lobortis a.</b><br><br>Duis eget orci eu erat vestibulum egestas. Cras nec ex lorem. Phasellus vel rutrum nunc. Sed ultricies risus in iaculis porta. Etiam auctor placerat mauris eget interdum. Ut a sagittis orci, et blandit enim. Etiam eu eros metus. Nullam turpis dolor, maximus sed ultricies ut, accumsan ut urna. Nullam facilisis nunc varius leo tincidunt auctor. Vestibulum at molestie elit.`
  },
  {
    date: '2022-05-16',
    header: 'Dark Mode preview is available',
    body: `The Dark Mode HTML goes here. We could show a picture:<br><br><img src="img/whatsnew/dark-mode.png"/>
    `
  },
  {
    date: '2022-05-15',
    header: 'Result Engine property of Reviews',
    body: `Nam convallis cursus libero, at feugiat neque blandit eget.<br><br><img src="img/whatsnew/result-engine-1.png"/><br><br>Nullam sit amet orci id tellus tincidunt fringilla sed sit amet enim. Nam vel orci scelerisque, feugiat ligula at, commodo ipsum. Vivamus orci nulla, egestas mattis ultricies vel, congue non tortor. Integer et mi odio. Nunc dictum sapien sit amet dui facilisis, eget vehicula tellus ultrices. Cras bibendum nisi dui. Vivamus vel diam at nisi aliquam egestas in vitae velit. Etiam venenatis molestie vestibulum. Praesent eleifend vel arcu eu finibus. Fusce quis lectus ut purus aliquam volutpat at vitae ante. Vestibulum ut elementum lorem. Sed sit amet tristique urna. Ut et enim sit amet tortor viverra vehicula eu lacinia mauris. Maecenas convallis, ante sit amet bibendum tempus, diam nulla posuere dolor, in varius metus magna non tellus. Vivamus rhoncus vehicula velit.<br><br>Sed id elit tristique, bibendum ipsum at, pretium elit. Vestibulum ante lectus, rutrum ut fermentum a, fermentum vitae sapien. Pellentesque scelerisque posuere magna elementum efficitur. Aliquam erat volutpat. Aliquam mollis arcu ipsum, fringilla porttitor lacus mollis ac. Nulla commodo, nisi in auctor sollicitudin, enim libero tristique enim, at mollis ipsum metus id odio. Maecenas rhoncus commodo ultrices. Nunc ut volutpat est, id pellentesque urna.`
  },
  {
    date: '2022-05-01',
    header: 'Accept Reviews from the Asset-STIG tab',
    body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit.<br></br><b>Curabitur posuere est mi, quis egestas elit lobortis a.</b><br><br>Duis eget orci eu erat vestibulum egestas. Cras nec ex lorem. Phasellus vel rutrum nunc. Sed ultricies risus in iaculis porta. Etiam auctor placerat mauris eget interdum. Ut a sagittis orci, et blandit enim. Etiam eu eros metus. Nullam turpis dolor, maximus sed ultricies ut, accumsan ut urna. Nullam facilisis nunc varius leo tincidunt auctor. Vestibulum at molestie elit.`
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