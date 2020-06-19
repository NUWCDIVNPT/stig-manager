'use strict'

Ext.ns('SM')

SM.Dispatcher = new Ext.util.Observable()
SM.Dispatcher.addEvents(
    'packagecreated',
    'packagedeleted',
    'assetcreated',
    'assetdeleted',
    'assetchanged'
)