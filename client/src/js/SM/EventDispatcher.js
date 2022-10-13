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
    'usercreated',
    'userdeleted',
    'userchanged',
    'stigassetschanged',
    'fieldsettingschanged',
    'statussettingschanged',
    'labelcreated',
    'labelchanged',
    'labeldeleted',
    'labelfilter',
    'importoptionschanged',
    'themechanged'
)
