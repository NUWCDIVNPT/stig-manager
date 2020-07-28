// $Id: reviewTab.js 885 2018-02-20 16:26:08Z bmassey $

function getReviewItems() {
  let mainNavTree = new SM.AppNavTree({
    region: 'west'
  })
  let mainTabPanel = new SM.MainTabPanel({
    region: 'center'
  })

  return [
    mainNavTree,
    mainTabPanel,
  ]
}

function addReviewHome() {
  var idAppend = '-user-' + curUser.id;

  var statusChangesFields = Ext.data.Record.create([
    {
      name: 'assetId'
    }
    , {
      name: 'assetName',
      type: 'string'
    }
    , {
      name: 'ruleId',
      type: 'string'
    }
    , {
      name: 'groupId',
      type: 'string',
      sortType: sortGroupId
    }
    , {
      name: 'title',
      type: 'string'
    }
    , {
      name: 'benchmarkId',
      type: 'string'
    }
    , {
      name: 'revId',
      type: 'string'
    }
    , {
      name: 'collectionName',
      type: 'string'
    }
    , {
      name: 'collectionId',
      type: 'int'
    }
  ]);

  var statusChangesStore = new Ext.data.GroupingStore({
    //url: 'pl/getLastStatusChanges.pl',
    url: 'pl/getRejectedReviews.pl',
    // baseParams: {
    // rejectOnly: 1
    // },
    autoLoad: false,
    groupField: 'assetName',
    storeId: 'statusChangesStore' + idAppend,
    sortInfo: {
      field: 'benchmarkId',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    reader: new Ext.data.JsonReader({
      fields: statusChangesFields,
      root: 'rows',
      idProperty: 'checkId'
    }),
    listeners: {
      load: function () {
        filterStatusChangesStore();
      }
    }
  });

  if (curUser.accessLevel !== 3) {
    var statusChangesGridTitle = 'Rejected reviews associated with ' + curUser.display;
  } else {
    var statusChangesGridTitle = 'Status changes';
  }

  var statusChangesGrid = new Ext.grid.GridPanel({
    id: 'statusChangesGrid' + idAppend,
    title: statusChangesGridTitle,
    store: statusChangesStore,
    flex: 1,
    stripeRows: true,
    loadMask: true,
    sm: new Ext.grid.RowSelectionModel({
      singleSelect: true
    }),
    view: new Ext.grid.GroupingView({
      enableGrouping: true,
      //forceFit: true,
      //autoFill: true,
      emptyText: 'No returned reviews.',
      hideGroupedColumn: true,
      deferEmptyText: false,
      groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "changes" : "change"]})'
    }),
    autoExpandColumn: 'statusChangesGrid-title' + idAppend,
    columns: [
      {
        header: "",
        width: 35,
        dataIndex: 'none',
        align: 'center',
        renderer: function () {
          return '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Returned">';
        }
      }
      , {
        id: 'statusChangesGrid-collectionName' + idAppend,
        header: "Collection",
        width: 170,
        dataIndex: 'collectionName',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-assetName' + idAppend,
        header: "Asset",
        width: 120,
        dataIndex: 'assetName',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-benchmarkId' + idAppend,
        header: "STIG",
        width: 170,
        dataIndex: 'benchmarkId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-groupId' + idAppend,
        header: "Group",
        width: 70,
        dataIndex: 'groupId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-ruleId' + idAppend,
        header: "Rule",
        width: 95,
        dataIndex: 'ruleId',
        sortable: true,
        align: 'left'
      }
      , {
        id: 'statusChangesGrid-title' + idAppend,
        header: "Title",
        width: 100,
        dataIndex: 'title',
        sortable: true,
        align: 'left'
      }
    ],
    bbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            statusChangesStore.load({
              callback: function (records, options, success) {
                if (success) {
                  var recordCount = records.length;
                  Ext.getCmp('reviewHome-html' + idAppend).update({
                    recordCount: recordCount
                  });
                }
              }
            });
          }
        }]
    }),
    tbar: new Ext.Toolbar({
      items: [
        // START Grouping control
        {
          xtype: 'buttongroup',
          title: 'Grouping',
          items: [
            {
              xtype: 'tbbutton',
              icon: 'img/security_firewall_on.png',
              tooltip: 'Group by STIG',
              toggleGroup: 'statusChangesGrid-groupBy',
              enableToggle: true,
              allowDepress: true,
              width: 20,
              handler: function (btn) {
                if (btn.pressed) {
                  Ext.getCmp('statusChangesGrid-expandButton').enable();
                  Ext.getCmp('statusChangesGrid-collapseButton').enable();
                  statusChangesGrid.getStore().groupBy('benchmarkId');
                } else {
                  Ext.getCmp('statusChangesGrid-expandButton').disable();
                  Ext.getCmp('statusChangesGrid-collapseButton').disable();
                  statusChangesGrid.getStore().clearGrouping();
                }
              }
            }, {
              xtype: 'tbbutton',
              icon: 'img/mycomputer1-16.png',
              tooltip: 'Group by asset',
              toggleGroup: 'statusChangesGrid-groupBy',
              enableToggle: true,
              allowDepress: true,
              pressed: true,
              width: 20,
              handler: function (btn) {
                if (btn.pressed) {
                  Ext.getCmp('statusChangesGrid-expandButton').enable();
                  Ext.getCmp('statusChangesGrid-collapseButton').enable();
                  statusChangesGrid.getStore().groupBy('assetName');
                } else {
                  Ext.getCmp('statusChangesGrid-expandButton').disable();
                  Ext.getCmp('statusChangesGrid-collapseButton').disable();
                  statusChangesGrid.getStore().clearGrouping();
                }
              }
            }, {
              xtype: 'tbseparator'
            }, {
              xtype: 'tbbutton',
              //icon: 'img/chevron.png',
              icon: 'img/minus-grey.png',
              id: 'statusChangesGrid-collapseButton',
              tooltip: 'Collapse all groups',
              width: 20,
              handler: function (btn) {
                statusChangesGrid.getView().collapseAllGroups();
              }
            }, {
              xtype: 'tbbutton',
              //icon: 'img/chevron_expand.png',
              icon: 'img/plus-grey.png',
              id: 'statusChangesGrid-expandButton',
              tooltip: 'Expand all groups',
              width: 20,
              handler: function (btn) {
                statusChangesGrid.getView().expandAllGroups();
              }
            }]
          // END Grouping control
        }, {
          // START Filter control
          xtype: 'buttongroup',
          title: 'Filtering',
          items: [
            {
              xtype: 'tbbutton',
              icon: 'img/security_firewall_on.png',
              tooltip: 'Filter by STIG id',
              toggleGroup: 'statusChangesGrid-filterBy',
              enableToggle: true,
              allowDepress: true,
              pressed: false,
              width: 20,
              handler: function (btn) {
                var filterField = Ext.getCmp('statusChangesGrid-filterField');
                if (btn.pressed) {
                  filterField.enable();
                  statusChangesStore.filterField = 'benchmarkId';
                  if (filterField.getRawValue() == '') {
                    filterField.emptyText = 'Enter a STIG filter...';
                    filterField.setRawValue(filterField.emptyText);
                  } else {
                    filterField.emptyText = 'Enter a STIG filter...';
                  }
                  filterStatusChangesStore();
                } else {
                  filterField.disable();
                  //filterField.setValue('');
                  filterStatusChangesStore();
                }
              }
            }, {
              xtype: 'tbbutton',
              icon: 'img/mycomputer1-16.png',
              tooltip: 'Filter by asset name',
              toggleGroup: 'statusChangesGrid-filterBy',
              enableToggle: true,
              allowDepress: true,
              width: 20,
              handler: function (btn) {
                var filterField = Ext.getCmp('statusChangesGrid-filterField');
                if (btn.pressed) {
                  filterField.enable();
                  statusChangesStore.filterField = 'assetName';
                  if (filterField.getRawValue() == '') {
                    filterField.emptyText = 'Enter an asset filter...';
                    filterField.setRawValue(filterField.emptyText);
                  } else {
                    filterField.emptyText = 'Enter an asset filter...';
                  }
                  filterStatusChangesStore();
                } else {
                  filterField.disable();
                  //filterField.setValue('');
                  filterStatusChangesStore();
                }
              }
            }, {
              xtype: 'tbseparator'
            }, {
              xtype: 'trigger',
              fieldLabel: 'Filter',
              triggerClass: 'x-form-clear-trigger',
              onTriggerClick: function () {
                this.triggerBlur();
                this.blur();
                this.setValue('');
                filterStatusChangesStore();
              },
              id: 'statusChangesGrid-filterField',
              width: 140,
              submitValue: false,
              disabled: true,
              enableKeyEvents: true,
              emptyText: 'Filter string...',
              listeners: {
                keyup: function (field, e) {
                  filterStatusChangesStore();
                  return false;
                }
              }
            }
          ]
        }
      ]
    }),
    listeners: {
      rowdblclick: {
        fn: function (grid, rowIndex, e) {
          var r = grid.getStore().getAt(rowIndex);
          var idAppend, tab;
          if (curUser.accessLevel === 3) {
            idAppend = '-collection_review-' + r.data.collectionId + '-' + r.data.benchmarkId.replace(".", "_");
            tab = Ext.getCmp('collectionReviewTab' + idAppend);
            if (Ext.isDefined(tab)) {
              tab.show();
            } else {
              fakeLeaf = new Object();
              fakeLeaf.benchmarkId = r.get('benchmarkId');
              fakeLeaf.revId = r.get('revId');
              fakeLeaf.collectionId = r.get('collectionId');
              fakeLeaf.collectionName = r.get('collectionName');
              //fakeLeaf.stigName = r.get('benchmarkId');
              addCollectionReview(fakeLeaf, r.data.ruleId, r.data.assetId);
            }
          } else {
            idAppend = '-' + r.data.assetId + '-' + r.data.benchmarkId.replace(".", "_");
            tab = Ext.getCmp('reviewTab' + idAppend);
            if (Ext.isDefined(tab)) {
              tab.show();
              var groupGrid = Ext.getCmp('groupGrid' + idAppend);
              var resourcesTabs = Ext.getCmp('resources-tabs' + idAppend);
              var index = groupGrid.getStore().find('ruleId', r.data.ruleId);
              groupGrid.getSelectionModel().selectRow(index);

              if (Ext.isIE) { // delay necessary for IE?!
                setTimeout(function () {
                  var rowEl = groupGrid.getView().getRow(index);
                  //rowEl.scrollIntoView(groupGrid.getGridEl(), false);
                  rowEl.scrollIntoView();
                }, 100);
              } else {
                var rowEl = groupGrid.getView().getRow(index);
                //rowEl.scrollIntoView(groupGrid.getGridEl(), false);
                rowEl.scrollIntoView();
              }

              //groupGrid.getView().focusRow(index);

              resourcesTabs.setActiveTab('feedback-tab' + idAppend);
            } else {
              fakeLeaf = new Object();
              fakeLeaf.assetId = r.get('assetId');
              fakeLeaf.assetName = r.get('assetName');
              fakeLeaf.benchmarkId = r.get('benchmarkId');
              fakeLeaf.revId = r.get('revId');
              //fakeLeaf.stigName = r.get('benchmarkId');
              //Ext.getCmp('main-tabs').setActiveTab('tab-reviews');
              addReview(fakeLeaf, r.get('ruleId'), 'feedback-tab' + idAppend);
            }
          }
        }
      }
    }
  });

  function filterStatusChangesStore() {
    var value = Ext.getCmp('statusChangesGrid-filterField').getValue();
    var filterFunction = null;
    // if (Ext.getCmp('statusChangesGrid-ready-filterButton').pressed) {
    // filterFunction = filterReady;
    // }
    // if (Ext.getCmp('statusChangesGrid-reject-filterButton').pressed) {
    // filterFunction = filterReject;
    // }
    // if (Ext.getCmp('statusChangesGrid-approve-filterButton').pressed) {
    // filterFunction = filterApprove;
    // }

    if (value == '' || Ext.getCmp('statusChangesGrid-filterField').disabled) {
      if (filterFunction != null) {
        statusChangesStore.filterBy(filterFunction);
      } else {
        statusChangesStore.clearFilter();
      }
    } else {
      if (filterFunction != null) {
        statusChangesStore.filter([
          {
            property: statusChangesStore.filterField,
            value: value,
            anyMatch: true,
            caseSensitive: false
          }, {
            fn: filterFunction
          }
        ]);
      } else {
        statusChangesStore.filter({ property: statusChangesStore.filterField, value: value, anyMatch: true, caseSensitive: false });
      }
    }
  };

  function filterReady(record, sm) {
    return (record.get('newStatus') == 1);
  };
  function filterReject(record, sm) {
    return (record.get('newStatus') == 2);
  };
  function filterApprove(record, sm) {
    return (record.get('newStatus') == 3);
  };

  let section508link = ` <span class='cs-section-five-o-eight' onclick="alert('You have reached the Department of Defense (DoD) Accessibility Link, at which you may report issues of accessibility of DoD websites for persons with disabilities.\\\n\\\nIf your issue involves log in access, password recovery, or other technical issues, contact the administrator for the website in question, or your local helpdesk.\\\n\\\nThe U.S. Department of Defense is committed to making its electronic and information technologies accessible to individuals with disabilities in accordance with Section 508 of the Rehabilitation Act (29 U.S.C. 794d), as amended in 1998.\\\n\\\nFor persons with disabilities experiencing difficulties accessing content on a particular website, please email RSSDD-DODCIO.MailboxSection508@osd.smil.mil.  In your message, please indicate the nature of your accessibility problem, the website address of the requested content, and your contact information so we can address your issue.\\\n\\\nFor more information about Section 508 law, policies and resource guidance, please visit the DoD Section 508 website on NIPRNET (http://dodcio.defense.gov/DoDSection508.aspx) .  \\\n\\\nLast Updated:  04/30/2014')">Accessibility/Section 508</span>`
  let reviewsHomeTpl = new Ext.XTemplate(
    `<div class='cs-home-header-reviews'>STIG Manager OSS${section508link}</div>`,
    // `<tpl if="recordCount == 0">`,
    `<div class=sm-reviews-home-no-tasks>`,
    `<div class='sm-reviews-home-body-title'>No returned reviews</div>`,
    `<div class='sm-reviews-home-body-text'>There are no returned reviews that require your attention.</div>`,
    `</div>`,
    // `</tpl>`,
    // `<tpl if="recordCount &gt; 0">`,
    // `<div class=sm-reviews-home-tasks>`,
    // `<div class='sm-reviews-home-body-title'>Returned reviews</div>`,
    // `<div class='sm-reviews-home-body-text'>There are returned reviews that require your attention.</div>`,
    // `</div>`,
    // `</tpl>`
  )

  var thisTab = Ext.getCmp('main-tab-panel').add({
    id: 'reviewHome' + idAppend,
    sm_TabType: 'review_home',
    iconCls: 'sm-stig-icon',
    closable: false,
    title: 'Home',
    padding: 20,
    bodyCssClass: 'sm-reviews-home-background',
    autoScroll: true,
    layout: 'vbox',
    layoutConfig: {
      align: 'stretch',
      pack: 'start'
    },
    items: [
      {
        id: 'reviewHome-html' + idAppend,
        border: false,
        height: 180,
        tpl: reviewsHomeTpl,
        bodyCssClass: 'sm-reviews-home-background',
        listeners: {
          render: function () {
            Ext.getCmp('reviewHome-html' + idAppend).update({
              recordCount: 0
            });
          }
        }
      }
      , statusChangesGrid
    ]
  });

  thisTab.show();

  // statusChangesStore.load({
  // 	callback: function (records,options,success) {
  // 		if (success) {
  // 			var recordCount = records.length;
  // 			Ext.getCmp('reviewHome-html' + idAppend).update({
  // 				recordCount: recordCount
  // 			});
  // 		}
  // 	}
  // });


}; //end addReviewHome();

// function reviewsTreeClick(n) {
//   var idAppend;
//   var tab;

//   if (n.attributes.report == 'review') {
//     idAppend = '-' + n.attributes.assetId + '-' + n.attributes.benchmarkId.replace(".", "_");
//     tab = Ext.getCmp('main-tab-panel').getItem('reviewTab' + idAppend);
//     if (tab) {
//       tab.show();
//     } else {
//       addReview(n.attributes);
//     }
//   }
//   if (n.attributes.action == 'import') {
//     uploadArchive(n);
//   }
//   if (n.attributes.action == 'collection-create') {
//     let collectionRootNode = n.parentNode
//     let fp = new SM.CollectionForm({
//       btnText: 'Create',
//       btnHandler: () => {
//         let values = fp.getForm().getFieldValues()
//         createCollection(values, curUser.userId)
//       }
//     })
//     let appwindow = new Ext.Window({
//       id: 'window-project-info',
//       title: 'Create STIG Manager Project',
//       modal: true,
//       width: 560,
//       height:550,
//       layout: 'fit',
//       plain: false,
//       bodyStyle:'padding:5px;',
//       buttonAlign:'right',
//       items: fp
//     })
//     appwindow.show(document.body)
//   }

//   if (n.attributes.action == 'collection-management') {
//       addCollectionManager(n.attributes.collectionId, n.attributes.collectionName)
//   }

//   switch (n.id) {
//     case 'user-admin':
//       addUserAdmin();
//       break;
//     case 'stig-admin':
//       addStigAdmin();
//       break;
//     case 'appdata-admin':
//       addAppDataAdmin();
//       break;
//   }

// }

function openCollectionReview(n) {
  if (n.attributes.report === 'stig' && (curUser.accessLevel === 3 || curUser.privileges.canAdmin)) {
    var idAppend = '-collection-' + n.attributes.collectionId + '-' + n.attributes.benchmarkId.replace(".", "_");
    var tab = Ext.getCmp('main-tab-panel').getItem('collectionReviewTab' + idAppend);
    if (tab) {
      tab.show();
    } else {
      addCollectionReview(n.attributes);
    }
  }
}

function openPoamWorkspace(n) {
  var conf = {};
  if (n.attributes.node == 'collection') {
    conf.context = 'collection';
    conf.idAppend = '-' + n.attributes.collectionId;
  } else if (n.attributes.report == 'stig') {
    conf.context = 'stig';
    conf.idAppend = '-' + n.attributes.collectionId + '-' + n.attributes.benchmarkId.replace(".", "_");
  }
  var tab = Ext.getCmp('main-tab-panel').getItem('poamWorkspaceTab' + conf.idAppend);
  if (tab) {
    tab.show();
  } else {
    conf.attributes = n.attributes;
    addPoamWorkspace(conf);
  }
}

async function addOrUpdateCollection( collectionId, collectionObj, options ) {
  try {
    let url, method
    if (collectionId) {
      url = `${STIGMAN.Env.apiBase}/collections/${collectionId}?elevate=${options.elevate}`
      method = 'PUT'
    }
    else {
      url = `${STIGMAN.Env.apiBase}/collections?elevate=${options.elevate}`,
      method = 'POST'
    }
    let result = await Ext.Ajax.requestPromise({
      url: url,
      method: method,
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      params: {
        projection: ['owners', 'statistics']
      },
      jsonData: collectionObj
    })
    let apiCollection = JSON.parse(result.response.responseText)
    // Refresh the curUser global
    await SM.GetUserObject()
    
    let event = collectionId ? 'collectionchanged' : 'collectioncreated'
    SM.Dispatcher.fireEvent( event, apiCollection )
    if (options.showManager) {
      addCollectionManager( apiCollection.collectionId, apiCollection.name )
    }
  }
  catch (e) {
    alert (e.message)
  }

}

