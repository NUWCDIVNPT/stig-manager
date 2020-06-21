'use strict'

Ext.ns('SM')

SM.Dispatcher = new Ext.util.Observable()
SM.Dispatcher.addEvents(
    'collectioncreated',
    'collectiondeleted',
    'assetcreated',
    'assetdeleted',
    'assetchanged'
)