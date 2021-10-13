async function addLibraryStig( params ) {
  let { benchmarkId, revisionStr = 'latest', stigTitle, treePath } = params
  try {
		const tab = Ext.getCmp('main-tab-panel').getItem(`library-stig-${benchmarkId}-tab`)
		if (tab) {
			tab.show()
			return
		}
    const libraryStigTab = new SM.Library.StigPanel({
      id: `library-stig-${benchmarkId}-tab`,
      benchmarkId,
      revisionStr,
      stigTitle,
      sm_tabMode: 'ephemeral',
      sm_treePath: treePath
    })
    libraryStigTab.updateTitle = function () {
			this.setTitle(`${this.sm_tabMode === 'ephemeral' ? '<i>':''}${this.benchmarkId}${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
		}
		libraryStigTab.makePermanent = function () {
			this.sm_tabMode = 'permanent'
			this.updateTitle.call(this)
		}
    let tp = Ext.getCmp('main-tab-panel')
		let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
		let thisTab
		if (ephTabIndex !== -1) {
      let ephTab = tp.items.itemAt(ephTabIndex)
      tp.remove(ephTab)
      thisTab = tp.insert(ephTabIndex, libraryStigTab);
		} 
    else {
		  thisTab = tp.add( libraryStigTab )
		}
		thisTab.updateTitle.call(thisTab)
		thisTab.show()
    libraryStigTab.load(benchmarkId)
  }
  catch (e) {
    console.error(e)
    alert(e.message)
  }
}
