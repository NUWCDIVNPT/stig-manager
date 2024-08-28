/*
$Id: findingsSummary.js 807 2017-07-27 13:04:19Z csmig $
*/

function addFindingsSummary( params ) {
	const { collectionId, collectionName, treePath } = params
	const tab = Ext.getCmp('main-tab-panel').getItem('findingsTab-' + collectionId)
	if (tab) {
		tab.show()
		return
	}


	const aggregator = 'groupId'

	const findingsPanel = new SM.Findings.FindingsPanel({
		collectionId: collectionId,
		aggregator: aggregator
	})

	const findingsTab = new Ext.Panel ({
		id: 'findingsTab-' + collectionId,
		collectionId: collectionId,
		collectionName: collectionName,
		iconCls: 'sm-report-icon',
		title: '',
		closable: true,
		layout: 'fit',
		sm_tabMode: 'permanent',
		sm_treePath: treePath,
		items: [findingsPanel]
	})

	findingsTab.updateTitle = function () {
		findingsTab.setTitle(`${findingsTab.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(findingsTab.collectionName)} / Findings${findingsTab.sm_tabMode === 'ephemeral' ? '</i>':''}`)
	}
	findingsTab.makePermanent = function () {
		findingsTab.sm_tabMode = 'permanent'
		findingsTab.updateTitle(findingsTab)
	}

	let tp = Ext.getCmp('main-tab-panel')
	let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
	let thisTab
	if (ephTabIndex !== -1) {
	  let ephTab = tp.items.itemAt(ephTabIndex)
	  tp.remove(ephTab)
	  thisTab = tp.insert(ephTabIndex, findingsTab);
	} else {
	  thisTab = tp.add( findingsTab )
	}
	thisTab.updateTitle(thisTab)
	thisTab.show();
  
	findingsPanel.parent.getStore().load({
		params: {
			aggregator: aggregator
		}
	})

}; //end addCompletionReport();
