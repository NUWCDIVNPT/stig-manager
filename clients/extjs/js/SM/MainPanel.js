Ext.ns('SM')

SM.Margin = {
  adjacent: 3,
  top: 6,
  bottom: 0,
  edge: 0
}

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
    this.onCollectionDeleted = collectionId => {
      const tabsToRemove = me.items.items.filter( tab => tab.collectionId === collectionId )
      for (const tab of tabsToRemove) {
          me.remove(tab)
      }
    }
    const config = {
      plugins: new SM.TabEnhancements(),
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
        },
        tabchange: function (tp, tab) {
          // expand the navigation tree to the source node
          if (tab.sm_treePath) {
            Ext.getCmp('app-nav-tree').selectPath(tab.sm_treePath)
          }
        }
      },
      items: []
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.MainTabPanel.superclass.initComponent.call(this)
    SM.Dispatcher.addListener('collectionchanged', this.onCollectionChanged)
    SM.Dispatcher.addListener('collectiondeleted', this.onCollectionDeleted)
  }
})

SM.HomeTab = Ext.extend(Ext.Panel, {
  initComponent: function() {
    const me = this
    const config = {
      // title: 'Home',
      autoScroll: true,
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
          `<div class='sm-home-widget-text'><img src="img/navy.png" width=125 height=125 class="sm-home-widget-image-text-wrap" /><b>STIG Manager</b> is an API and Web client for managing the assessment of Information Systems for compliance with <a href="https://public.cyber.mil/stigs/">security checklists</a> published by the United States (U.S.) Defense Information Systems Agency (DISA). STIG Manager supports DISA checklists <a href="https://public.cyber.mil/stigs/downloads/">distributed</a> as either a Security Technical Implementation Guide (STIG) or a Security Requirements Guide (SRG)</div>`, 

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

          `<div class='sm-home-widget-subtitle'>Project Home</div>`,
          `<div class='sm-home-widget-text'>What is <a target="_blank" href="https://github.com/NUWCDIVNPT/stig-manager#stig-manager">STIG Manager OSS</a>?</div>`,

          `<div class='sm-home-widget-subtitle'>The Docs</div>`,
          `<div class='sm-home-widget-text'>Need help? Check out our <a target="_blank" href="docs/index.html">Documentation</a></div>`,
          
          `<div class='sm-home-widget-subtitle'> Just Geting Started? </div>`,
          `<div class='sm-home-widget-text'>Check out our <a target="_blank" href="docs/user-guide/user-quickstart.html">User Walkthrough</a> or the <a target="_blank" href="docs/user-guide/user-guide.html">User Guide</a></div>`,

          `<div class='sm-home-widget-subtitle'>Common Tasks </div>`,
          `<div class='sm-home-widget-text'>Not sure how to do something in STIG Manager? Check out these links to <a target="_blank" href="docs/features/common-tasks.html">Common Tasks</a></div>`,

          `<div class='sm-home-widget-subtitle'>Issues, Feature Requests, and Contributions</div>`,
          `<div class='sm-home-widget-text'>Want to report a bug, request a feature, or help out the project? <a target="_blank" href="docs/the-project/contributing.html">Check out our Contribution Guide</a></div>`,
          
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

SM.ResourcesWidget = Ext.extend(Ext.Panel, {
  initComponent: function() {
      const me = this
      const id = Ext.id()
      const tpl = new Ext.XTemplate(
          `<div class=sm-home-widget-header>`,
          `<div class='sm-home-widget-title'>Resources</div>`,
          `</div>`,
          `<div class='sm-home-widget-subtitle'>GitHub</div>`,
          `<div class='sm-home-widget-text'><a target="_blank" href="https://github.com/NUWCDIVNPT">NUWCDIVNPT is on GitHub!</a></div>`,
          `<div class='sm-home-widget-text'><a target="_blank" href="https://github.com/Code-dot-mil/code.mil">Code.mil</a></div>`,
          `<div class='sm-home-widget-subtitle'>DISA STIGs</div>`,
          `<div class='sm-home-widget-text'>Get the latest STIGs at <a target="_blank" href="https://public.cyber.mil/stigs/downloads/">cyber.mil</a>.</div>`,
          `<div class='sm-home-widget-subtitle'>RMF Reference</div>`,
          `<div class='sm-home-widget-text'>STIG Manager assists with STEP 4 of the <a target="_blank" href="https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf">Risk Management Framework Process</a>.</div>`,
          `<div class='sm-home-widget-subtitle'>DevSecOps</div>`,
          `<div class='sm-home-widget-text'>STIG Manager is being developed as part of the <a target="_blank" href="https://software.af.mil/dsop/documents/">DoD Enterprise DevSecOps</a> and <a target="_blank" href="https://code.mil">Code.mil Open Source </a> initiatives.</div>`,

        )
      const config = {
        tpl: tpl,
        bodyCssClass: 'sm-home-widget-body',
        border: false,
        data: [1]
      }
      Ext.apply(this, Ext.apply(this.initialConfig, config))
      SM.ResourcesWidget.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-home-widget-resources', SM.ResourcesWidget)

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
