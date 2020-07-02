Ext.ns('SM')

SM.MainTabPanel = Ext.extend(Ext.TabPanel, {
  initComponent: function () {
    const me = this
    this.onCollectionChanged = change => {
      if (change.name) {
        for (const tab of me.items.items) {
          if (tab.collectionId === change.collectionId) {
            tab.collectionName = change.name
            tab.updateTitle.call(tab)
          }
        }
      }
    }
    const config = {
      plugins: new Ext.ux.TabCloseOnMiddleClick(),
      title: 'STIGManager',
      enableTabScroll: true,
      activeTab: 0,
      listeners: {
        beforetabchange: function (tabPanel, newTab, currentTab) {
          // For IE: Keep the panels in the same scroll position after tab changes
          if (Ext.isIE) {
            if (Ext.isDefined(currentTab)) {
              if (currentTab.sm_TabType == 'asset_review') {
                var vCur = currentTab.sm_GroupGridView;
                vCur.scrollTop = vCur.scroller.dom.scrollTop;
                vCur.scrollHeight = vCur.scroller.dom.scrollHeight;
              }
            }
            if (Ext.isDefined(newTab)) {
              if (newTab.sm_TabType == 'asset_review') {
                var vNew = newTab.sm_GroupGridView;
                if (Ext.isDefined(vNew.scroller)) {
                  setTimeout(function () {
                    vNew.scroller.dom.scrollTop = vNew.scrollTop + (vNew.scrollTop == 0 ? 0 : vNew.scroller.dom.scrollHeight - vNew.scrollHeight);
                  }, 100);
                }
              }
            }
          }
        }
      },
      items: []
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.MainTabPanel.superclass.initComponent.call(this)
    SM.Dispatcher.addListener('collectionchanged', this.onCollectionChanged)
  }
})

SM.HomeTab = Ext.extend(Ext.Panel, {
  initComponent: function() {
    const me = this
    const config = {
      title: 'Home',
      autoScroll: true,
      iconCls: 'sm-stig-icon'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.HomeTab.superclass.initComponent.call(this)
  }
})

SM.WelcomeWidget = Ext.extend(Ext.Panel, {
  initComponent: function() {
      const me = this
      const id = Ext.id()
      const tpl = new Ext.XTemplate(
          `<div class=sm-home-widget-header>`,
          `<div class='sm-home-widget-title'>Welcome</div>`,
          `</div>`,
          `<div class='sm-reviews-home-body-text'>There are no returned reviews that require your attention.</div>`,
        )
      const config = {
        tpl: tpl,
        bodyCssClass: 'sm-home-widget-body',
        border: false,
        data: [1]
      }
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.WelcomeWidget.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-home-widget-welcome', SM.WelcomeWidget)

SM.DocWidget = Ext.extend(Ext.Panel, {
  initComponent: function() {
      const me = this
      const id = Ext.id()
      const tpl = new Ext.XTemplate(
          `<div class=sm-home-widget-header>`,
          `<div class='sm-home-widget-title'>Documentation</div>`,
          `</div>`,
          `<div class='sm-reviews-home-body-text'>Lorum ipsum sit dolor.</div>`,
        )
      const config = {
        tpl: tpl,
        bodyCssClass: 'sm-home-widget-body',
        border: false,
        data: [1]
      }
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.DocWidget.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-home-widget-doc', SM.DocWidget)

SM.StigWidget = Ext.extend(Ext.Panel, {
  initComponent: function() {
      const me = this
      const id = Ext.id()
      const tpl = new Ext.XTemplate(
          `<div class=sm-home-widget-header>`,
          `<div class='sm-home-widget-title'>STIG updates</div>`,
          `</div>`,
          `<div class='sm-reviews-home-body-text'>Lorum ipsum sit dolor.</div>`,
        )
      const config = {
        tpl: tpl,
        bodyCssClass: 'sm-home-widget-body',
        border: false,
        data: [1]
      }
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.StigWidget.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-home-widget-stig', SM.StigWidget)
