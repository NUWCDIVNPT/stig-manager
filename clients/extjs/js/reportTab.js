// $Id: reportTab.js 807 2017-07-27 13:04:19Z csmig $

function getReportItems() {
	return [{
		region: 'west',
		xtype: 'treepanel',
		id: 'reports-nav-tree',
		rootVisible: false,
		autoScroll: true,
		split: true,
		collapsible: true,
		title: 'STIG Manager Reports',
		bodyStyle:'padding:5px;',
		width: 220,
		minSize: 160,
		root: {
			nodeType: 'async',
			text: 'MyReports'
		},
		dataUrl: 'pl/reportsNavTree.pl',
		listeners: {
			click: reportsTreeClick
		}
	},{
		region: 'center',
		xtype: 'tabpanel',
		id: 'reports-center-tab',
		title: 'STIGManager',
		activeTab: 0,
		items: [
			{			
				title: 'Home',
				iconCls: 'sm-report-icon',
				autoLoad:'reportsHome.html',
				padding: 20,
				autoScroll:true
			}		
		]
	}];
}

function reportsTreeClick(n) {
	var tab = Ext.getCmp('reports-center-tab').getItem('report-tab-' + n.attributes.collectionId + '-' + n.attributes.report);
	if (tab) {
		tab.show();
	} else {
		addReportTab(n.attributes);
	}
}

function addReportTab(reportAttributes) {
	switch(reportAttributes.report) {
		case 'comp':
			addCompletionStatus(reportAttributes.collectionId,reportAttributes.collectionName);
			break;
		case 'find':
			addFindingsSummary(reportAttributes.collectionId,reportAttributes.collectionName);
			break;
		// case 'review':
			// addReview(reportAttributes);
			// break;
	}	

} //end addReportTab();

