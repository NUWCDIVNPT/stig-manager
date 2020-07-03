/* 
$Id: stigman.js 807 2017-07-27 13:04:19Z csmig $
*/

var appName = 'STIG Manager';
var appVersion = "3.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser, appConfig;
Ext.Ajax.timeout = 30000000

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
Ext.override(Ext.data.Connection, {
	requestOriginal: Ext.data.Connection.prototype.request,
	request: function(o) {
		let me = this
		window.keycloak.updateToken(10).then(function (refreshed) {
			console.info("updateToken() returned success, refreshed: " + refreshed)
				
		}).catch(function() {
			console.info("updateToken() catch error! ")
		})
		return me.requestOriginal(o);
	}
});


Ext.Ajax.on('beforerequest', this.manageToken, this);

function manageToken (conn, options) {
	options.headers = options.headers || {}
	options.headers.Authorization = 'Bearer ' + window.keycloak.token
}


async function start () {
	try {
		Ext.get( 'indicator' ).dom.innerHTML = "Getting user profile...";
		let result = await Ext.Ajax.requestPromise({
			url: `${STIGMAN.Env.apiBase}/user`,
			method: 'GET'
		})
		curUser = JSON.parse(result.response.responseText);
		if (curUser.username !== undefined) {
			loadApp();
		} else {
			Ext.get( 'indicator' ).dom.innerHTML =`No account for ${window.keycloak.token}`;
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
			cls: 'sm-grid-round-panel',
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
					html: "<div class='sm-home-title'>STIG Manager<span id='sm-home-title-sprite'>OSS</span></div>",
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
					xtype: 'sm-home-widget-stig'
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
					cls: 'sm-grid-round-panel',
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
	}
	catch (e) {
		Ext.get( 'indicator' ).dom.innerHTML = e.message
	}

} //end loadApp()

function showAbout() {
	alert(copyrightStr + '\n\n' + licenseStr);
}

start()
