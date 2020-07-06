'use strict'

Ext.ns('SM')

SM.Dispatcher = new Ext.util.Observable()
SM.Dispatcher.addEvents(
    'collectioncreated',
    'collectiondeleted',
    'collectionchanged',
    'assetcreated',
    'assetdeleted',
    'assetchanged',
    'stigassetschanged'
)

SM.Dispatcher.addListener('collectioncreated', SM.GetUserObject)
SM.Dispatcher.addListener('collectiondeleted', SM.GetUserObject)
SM.Dispatcher.addListener('collectionchanged', SM.GetUserObject)
