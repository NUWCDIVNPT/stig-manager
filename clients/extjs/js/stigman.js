/* 
$Id: stigman.js 807 2017-07-27 13:04:19Z csmig $
*/

Ext.Ajax.timeout = 30000000
Ext.Msg.minWidth = 300

function GetXmlHttpObject() {
	if (window.XMLHttpRequest)
	  {
	  // code for IE7+, Firefox, Chrome, Opera, Safari
	  return new XMLHttpRequest();
	  }
	if (window.ActiveXObject)
	  {
	  // code for IE6, IE5
	   return new ActiveXObject("Microsoft.XMLHTTP");
	  }
	return null;
}

function myContextMenu (e,t,eOpts) {
	// only show the browser context menu in text areas
	if (!Ext.fly(e.getTarget()).hasClass('x-form-textarea')){
		e.preventDefault();
		return false;
	}
}

Ext.Ajax.disableCaching = false

async function start () {
	try {
		Ext.get( 'indicator' ).dom.innerHTML = "Getting user profile...";
		await SM.GetUserObject()
		if (curUser.username !== undefined) {
			loadApp();
		} else {
			Ext.get( 'indicator' ).dom.innerHTML =`No account for ${window.oidcProvider.token}`;
		}
	}
	catch (e) {
		Ext.get( 'indicator' ).dom.innerHTML = e.message
	}
}

async function loadApp () {
	try {
		Ext.isReady = true // a bit of a hack, for Firefox
		Ext.BLANK_IMAGE_URL=Ext.isIE6||Ext.isIE7||Ext.isAir? "/ext/resources/images/default/s.gif" : "data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
		Ext.getBody().on("contextmenu", myContextMenu);  
		Ext.QuickTips.init();
		Ext.apply(Ext.QuickTips.getQuickTip(), {
			maxWidth: 200,
			minWidth: 10,
			showDelay: 500,      // Show ms after entering target
			trackMouse: false
		});
	
		Ext.get( 'indicator' ).dom.innerHTML = "Getting configuration...";
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/op/configuration`,
			method: 'GET'
		})
		appConfig = JSON.parse(result.response.responseText);
		
		const mainNavTree = new SM.AppNavTree({
			id: 'app-nav-tree',
			cls: 'sm-round-panel',
			margins: {top:10, right:5, bottom:10, left:10},
			border: false,
			region: 'west'
		})
		const mainTabPanel = new SM.MainTabPanel({
			id: 'main-tab-panel',
			region: 'center',
			margins: {top:5, right:10, bottom:10, left:5},
			border: false
		})

		const appTitleQTipAttrs = `ext:qtitle="Commit info" ext:qwidth=200 ext:qtip="branch: ${STIGMAN.Env.commit.branch}&lt;br/&gt;sha: ${STIGMAN.Env.commit.sha}&lt;br/&gt;describe: ${STIGMAN.Env.commit.describe}"`
		// Register a quick tip for the version element
		Ext.QuickTips.register({
			target: 'sm-home-version-sprite',
			title: 'Commit info',
			text: `branch: ${STIGMAN.Env.commit.branch}&lt;br/&gt;sha: ${STIGMAN.Env.commit.sha}&lt;br/&gt;describe: ${STIGMAN.Env.commit.describe}`,
			width: 200,
			dismissDelay: 0 // Show while cursor is over element
		})

		const appTitleHtml = `<div class='sm-home-title'>
		STIG Manager<span id='sm-home-oss-sprite'>OSS</span><span id='sm-home-version-sprite'>${STIGMAN.Env.version}</span></div>`
		
		const homeTab = new SM.HomeTab({
			border: false,
			region: 'center',
			layout: 'table',
			layoutConfig: {
				tableAttrs: {
					style: {
						width: '100%',
						padding: '20px',
						"table-layout": 'fixed'

					}
				},
				columns: 3
			},
			items: [
				{
					html: appTitleHtml,
					colspan: 3,
					border: false
				},
				{
					xtype: 'sm-home-widget-welcome'
				},
				{
					xtype: 'sm-home-widget-doc'
				},
				{
					xtype: 'sm-home-widget-resources'
				}
			]
		})

		// mainTabPanel.add(homeTab)
		mainTabPanel.add({
			layout: 'border',
			border: false,
			title: 'Home',
			iconCls: 'sm-stig-icon',
			items: [
				{
					region: 'center',
					cls: 'sm-round-panel',
					border: false,
					margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.edge },
					layout: 'fit',
					// html: 'Hi there'
					items: homeTab
				}
			]
		})

		let viewportConfig = {
			id: 'app-viewport',
			layout: 'border',
			items: [],
		}
	
		let classification = new Classification(appConfig.classification)
		if (classification.showBanner) {
			let contentPanel = new Ext.Panel({
				region: 'center',
				layout: 'border',
				border: false,
				items: [mainNavTree, mainTabPanel]
			})
			let bannerTpl = new Ext.XTemplate(
				`<div class=sm-banner-{classificationCls}>`,
				`<div class='sm-banner-body-text'>{classificationText}</div>`
			) 
			let classificationBanner = new Ext.Panel({
				region: 'north',
				height: 20,
				border: false,
				tpl: bannerTpl,
				data: {
					classificationCls: classification.classificationCls,
					classificationText: classification.classificationText,
				},
				border: false
			})
	
			viewportConfig.items.push( classificationBanner, contentPanel)
		}
		else {
			viewportConfig.items.push( mainNavTree, mainTabPanel )
		}
		
		new Ext.Viewport(viewportConfig)
	
		Ext.get('loading').remove();
		Ext.get('loading-mask').fadeOut({duration: 1, remove:true});
		// Register a quick tip for the version element
		Ext.QuickTips.register({
			target: 'sm-home-version-sprite',
			title: 'Commit info',
			text: `branch: ${STIGMAN.Env.commit.branch}<br/>sha: ${STIGMAN.Env.commit.sha}<br/>describe: ${STIGMAN.Env.commit.describe}`,
			width: 200,
			dismissDelay: 60000 // Show while cursor is over element
		})
		
	}
	catch (e) {
		Ext.get( 'indicator' ).dom.innerHTML = e.message
	}

} //end loadApp()

function showAbout() {
	alert(copyrightStr + '\n\n' + licenseStr);
}

start()
