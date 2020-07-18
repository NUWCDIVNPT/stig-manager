/*
$Id: findingsSummary.js 807 2017-07-27 13:04:19Z csmig $
*/

function addFindingsSummary(collectionId, collectionName) {
	var idAppend = '-findings-summary-' + collectionId;
	var benchmarkId = '';

	const aggregator = 'ruleId'

	const findingsPanel = new SM.FindingsPanel({
		collectionId: collectionId,
		aggregator: aggregator
	})

	var thisTab = Ext.getCmp('main-tab-panel').add({
		id: 'findingsTab-' + collectionId,
		collectionId: collectionId,
		collectionName: collectionName,
		iconCls: 'sm-report-icon',
		title: 'Findings Summary (' + collectionName + ')',
		closable: true,
		layout: 'fit',
		items: [findingsPanel]
	});
	thisTab.updateTitle = function () {
		this.setTitle(`${this.collectionName} : Findings`)
	}
	thisTab.updateTitle.call(thisTab)
	thisTab.show();

	findingsPanel.parent.getStore().load({
		params: {
			aggregator: aggregator
		}
	})

}; //end addCompletionReport();
