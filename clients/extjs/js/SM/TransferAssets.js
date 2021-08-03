'use strict'

Ext.ns('SM.TransferAssets')

SM.TransferAssets.TransferBtn = Ext.extend(Ext.Button, {
  initComponent: function() {
    const me = this
    const config = {}
    
    // Populate the menu with collections that are not the source
    function setMenuItems (menu) {
      menu.removeAll()
      const destCollectionGrants = curUser.collectionGrants.filter( g => g.collection.collectionId !== menu.srcCollectionId && g.accessLevel >= 3)
      for (const destCollectionGrant of destCollectionGrants) {
        menu.addMenuItem({
          iconCls: 'sm-collection-icon',
          text: destCollectionGrant.collection.name,
          collectionId: destCollectionGrant.collection.collectionId
        })
      }
    }

    me.setSrcAssets = function (assets) {
      me.menu.srcAssets = assets
    }

    me.menu = new Ext.menu.Menu({
      srcCollectionId: me.srcCollectionId,
      listeners: {
        beforeshow: function (menu) {
          setMenuItems(menu)
        },
        itemClick: me.onItemClick
      }
    })

    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.TransferAssets.TransferBtn.superclass.initComponent.call(this)
  }
})
Ext.reg('sm-transferassets-btn', SM.TransferAssets.TransferBtn)
