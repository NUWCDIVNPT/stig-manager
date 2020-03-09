
var appName = 'STIG Manager';
var appVersion = "2.0";
var copyrightStr = '';
var licenseStr = "This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\
\n\nThis program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.\
\n\nThe GNU General Public License is available at  <http://www.gnu.org/licenses/>.";

var curUser;

/* DEBUG ONLY */
// appName = curUser.name;
// appVersion = ' - ' + curUser.role + ' - ' + curUser.canAdmin;


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

Ext.onReady(function() {
	Ext.get( 'indicator' ).dom.innerHTML = "Getting user profile...";
	var varsXmlHttp=GetXmlHttpObject();
	varsXmlHttp.onreadystatechange = function() {
		if (varsXmlHttp.readyState == 4) {
			if (varsXmlHttp.status == 200) {
				curUser = Ext.util.JSON.decode(varsXmlHttp.responseText);
				if (curUser.cn !== undefined) {
					loadApp();
				} else {
					Ext.get( 'indicator' ).dom.innerHTML = curUser.error;
				}
			} else {
				Ext.get( 'indicator' ).dom.innerHTML = "XHR request returned status:<br>" + varsXmlHttp.statusText ;
			}
		}
	};
	var varsUrl="pl/getUserObject.pl";
	varsXmlHttp.open("GET",varsUrl);
	varsXmlHttp.send();
});

function loadApp () {
	Ext.BLANK_IMAGE_URL=Ext.isIE6||Ext.isIE7||Ext.isAir? "/ext/resources/images/default/s.gif" : "data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
	//Ext.getBody().on("contextmenu", Ext.emptyFn, null, {preventDefault: true});  
	Ext.getBody().on("contextmenu", myContextMenu);  
	Ext.QuickTips.init();
	
	var reviewItems = getReviewItems();
	var reportItems = getReportItems();
	var viewport = new Ext.Viewport({
		layout: 'fit',
		items: [{
			xtype: 'tabpanel',
			id: 'main-tabs',
			activeTab: 'tab-reviews',
			items: [
			{
				title: 'Reviews',
				iconCls: 'sm-stig-icon',
				layout: 'border',
				id: 'tab-reviews',
				items: reviewItems,
				listeners: {
					render: function () {
						addReviewHome();
					}
				}
			},{
				title: 'Reports',
				iconCls: 'sm-report-icon',
				layout: 'border',
				id: 'tab-reports',
				items: reportItems
			}],
			listeners: {
				render: function (tp) {
					var appStr = {
						tag: 'li',
						cls: 'x-tab-strip-active',
						style: 'right: 0px; position: absolute; padding-right: 10px;',
						cn: [{
							tag: 'span',
							cls: 'x-tab-strip-text',
							//html: '<a href="#" onclick="showAbout()" style="text-decoration:none;">' + appName + ' ' + appVersion + '</a>'
							html: '<span onclick="logout()">' + appName + ' ' + appVersion + ' - ' + curUser.name + ' (' + curUser.role + ') - Logout</span>'
						}]
					};
					var edge = tp.getEl().child('.x-tab-edge');
					var appStrEl = edge.insertSibling(appStr,'after');
				}
			}
		}]
	});
	if (curUser.canAdmin || curUser.role == 'IAO' || curUser.role == 'Staff') {
		var adminItems = getAdministrationItems();
		Ext.getCmp('main-tabs').add({
			title: 'Administration',
			iconCls: 'sm-setting-icon',
			layout: 'border',
			id: 'tab-admin',
			items: adminItems
		});
	}
	
	Ext.get('loading').remove();
	Ext.get('loading-mask').fadeOut({duration: 1, remove:true});
} //end loadApp()

function showAbout() {
	alert(copyrightStr + '\n\n' + licenseStr);
}

function logout() {
	window.location='/pl/logout.pl'
}
