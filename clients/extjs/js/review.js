async function addReview( params ) {
  let { leaf, selectedRule, selectedResource, treePath } = params
  let result = await Ext.Ajax.requestPromise({
    url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}`,
    method: 'GET'
  })
  let apiCollection = JSON.parse(result.response.responseText)


  // Classic compatability. Remove after modernization
  if (leaf.stigRevStr) {
    let match = leaf.stigRevStr.match(/V(\d+)R(\d+)/)
    leaf.revId = `${leaf.benchmarkId}-${match[1]}-${match[2]}`
  }
  var idAppend = '-' + leaf.assetId + '-' + leaf.benchmarkId.replace(".", "_");
  var TEMPLATE_STR = '!_TEMPLATE';
  var unsavedChangesPrompt = 'You have modified your review. Would you like to save your changes?';

  /******************************************************/
  // START Group Grid
  /******************************************************/
  var groupFields = Ext.data.Record.create([
    {
      name: 'assetId'
    }, {
      name: 'groupId',
      type: 'string',
      sortType: sortGroupId
    }, {
      name: 'ruleId',
      type: 'string',
      sortType: sortRuleId
    }, {
      name: 'groupTitle',
      type: 'string'
    }, {
      name: 'ruleTitle',
      type: 'string'
    }, {
      name: 'severity',
      type: 'string',
      sortType: sortSeverity
    }, {
      name: 'result',
      type: 'string'
    }, {
      name: 'status',
      type: 'string'
    }, {
      name: 'hasAttach',
      type: 'boolean'
    }, {
      name: 'autoResult',
      type: 'boolean'
    }, {
      name: 'reviewComplete',
      type: 'boolean'
    }, {
      name: 'autoCheckAvailable',
      type: 'boolean'
    }
  ]);


  var groupStore = new Ext.data.JsonStore({
    proxy: new Ext.data.HttpProxy({
      url: `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/latest`,
      // url: `pl/getCurrentGroups.pl`,
      method: 'GET'
    }),
    root: '',
    storeId: 'groupStore' + idAppend,
    fields: groupFields,
    idProperty: 'ruleId',
    sortInfo: {
      field: 'ruleId',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    listeners: {
      load: function (store, records) {
        var ourGrid = Ext.getCmp('groupGrid' + idAppend);
        // Filter the store
        filterGroupStore();

        // XCCDF option in export menu
        // if (store.reader.jsonData.xmlDisabled) {
        // Ext.getCmp('groupFileMenu-export-xccdfItem' + idAppend).disable();
        // } else {
        // Ext.getCmp('groupFileMenu-export-xccdfItem' + idAppend).enable();
        // }

        // Were we passed a specific rule to select?
        if ('undefined' !== typeof selectedRule) {
          var index = ourGrid.getStore().find('ruleId', selectedRule);
          ourGrid.getSelectionModel().selectRow(index);

          var rowEl = ourGrid.getView().getRow(index);
          //rowEl.scrollIntoView(ourGrid.getGridEl(), false);
          rowEl.scrollIntoView();
          //ourGrid.getView().focusRow(index+5);
        } else {
          ourGrid.getSelectionModel().selectFirstRow();
        }

        Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
      },
      clear: function () {
        Ext.getCmp('groupGrid-totalText' + idAppend).setText('0 rules');
      },
      update: function (store) {
        Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
      },
      datachanged: function (store) {
        Ext.getCmp('groupGrid-totalText' + idAppend).setText(getStatsString(store));
      },
      exception: function (misc) {
        var ourView = groupGrid.getView();
        var response = misc.events.exception.listeners[1].fn.arguments[4];
        if (response.status != 0) {
          ourView.emptyText = 'Load failed: ' + response.responseText;
        } else {
          ourView.emptyText = 'HTTP Server Error: ' + response.statusText;
        }
        ourView.refresh();
      }
    }
  });

  /******************************************************/
  // Group grid menus
  /******************************************************/
  var groupChecklistMenu = new Ext.menu.Menu({
    id: 'groupChecklistMenu' + idAppend,
    items: [
      {
        text: 'Group/Rule display',
        hideOnClick: false,
        menu: {
          items: [
            {
              id: 'groupFileMenu-title-groupItem' + idAppend,
              text: 'Group ID and title',
              checked: false,
              group: 'titleType' + idAppend,
              handler: function (item, eventObject) {
                var cm = groupGrid.getColumnModel();
                var groupTitleIndex = cm.findColumnIndex('groupTitle');
                var ruleTitleIndex = cm.findColumnIndex('ruleTitle');
                var groupIdIndex = cm.findColumnIndex('groupId');
                var ruleIdIndex = cm.findColumnIndex('ruleId');
                var titleWidth = cm.getColumnWidth(ruleTitleIndex);
                var idWidth = cm.getColumnWidth(ruleIdIndex);
                cm.setColumnWidth(groupTitleIndex, titleWidth);
                cm.setColumnWidth(groupIdIndex, idWidth);
                groupGrid.titleColumnDataIndex = 'groupTitle';
                filterGroupStore();
                cm.setHidden(ruleTitleIndex, true);
                cm.setHidden(ruleIdIndex, true);
                cm.setHidden(groupTitleIndex, false);
                cm.setHidden(groupIdIndex, false);
                groupGrid.autoExpandColumn = 'groupTitle' + idAppend;
              }
            },
            {
              id: 'groupFileMenu-title-ruleItem' + idAppend,
              text: 'Rule ID and title',
              checked: true,
              group: 'titleType' + idAppend,
              handler: function (item, eventObject) {
                var cm = groupGrid.getColumnModel();
                var groupTitleIndex = cm.findColumnIndex('groupTitle');
                var ruleTitleIndex = cm.findColumnIndex('ruleTitle');
                var groupIdIndex = cm.findColumnIndex('groupId');
                var ruleIdIndex = cm.findColumnIndex('ruleId');
                var titleWidth = cm.getColumnWidth(groupTitleIndex);
                var idWidth = cm.getColumnWidth(groupIdIndex);
                cm.setColumnWidth(ruleTitleIndex, titleWidth);
                cm.setColumnWidth(ruleIdIndex, idWidth);
                groupGrid.titleColumnDataIndex = 'ruleTitle';
                filterGroupStore();
                cm.setHidden(groupTitleIndex, true);
                cm.setHidden(groupIdIndex, true);
                cm.setHidden(ruleTitleIndex, false);
                cm.setHidden(ruleIdIndex, false);
                groupGrid.autoExpandColumn = 'ruleTitle' + idAppend;
              }
            }
          ]
        }
      },
      '-',
      {
        text: 'Export CKL',
        iconCls: 'sm-export-icon',
        tooltip: 'Download this checklist in DISA STIG Viewer format',
        handler: async function (item, eventObject) {
          try {
            document.body.style.cursor = 'wait'
            let ckl = await item.getCkl(leaf)
            item.downloadBlob(ckl.blob, ckl.filename)
            document.body.style.cursor = 'default'
          }
          catch (e) {
            alert(e.message)
          }
        },
        getCkl: function (leaf) {
          return new Promise( async (resolve, reject) => {
            var xhr = new XMLHttpRequest()
            var url = `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${groupGrid.sm_benchmarkId}/${groupGrid.sm_revisionStr}?format=ckl`
            xhr.open('GET', url)
            xhr.responseType = 'blob'
            await window.keycloak.updateToken(10)
            xhr.setRequestHeader('Authorization', 'Bearer ' + window.keycloak.token)
            xhr.onload = function () {
              if (this.status >= 200 && this.status < 300) {
                var contentDispo = this.getResponseHeader('Content-Disposition')
                //https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
                var fileName = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
                resolve({
                  blob: xhr.response,
                  filename: fileName
                })
              } else {
                reject({
                  status: this.status,
                  message: xhr.statusText
                })
              }
            }
            xhr.onerror = function () {
              reject({
                status: this.status,
                message: xhr.responseText
              })
            }
            xhr.send()
          })
        },
        downloadBlob: function (blob, filename) {
          let a = document.createElement('a')
          a.style.display = "none"
          let url = window.URL.createObjectURL(blob)
          a.href = url
          a.download = filename
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url)
        }
      },
      {
        text: 'Import Results...',
        iconCls: 'sm-import-icon',
        handler: function () {
          showImportResultFile( {...leaf, revisionStr: groupGrid.sm_revisionStr, store: groupStore} );            
        }
      },
      '-',
      {
        text: 'Submit All...',
        iconCls: 'sm-ready-icon',
        hideOnClick: true,
        handler: bulkSubmit
      }, {
        text: 'Reset reviews...',
        id: 'unlockMenuItem' + idAppend,
        iconCls: 'sm-unlock-icon',
        handler: function () {
          //====================================================
          //UNLOCK ALL REVIEWS FOR STIG ASSOCIATED TO ASSET
          //====================================================
          unlockStigReviewsForAsset();
        }
      },
      '-'
    ],
    listeners: {
      added: function (menu, ownerCt, index) {
        var test = 1;
      },
      render: function () {
        if (curUser.accessLevel !== 3) {
          Ext.getCmp('unlockMenuItem' + idAppend).hide();
        } else {
          Ext.getCmp('unlockMenuItem' + idAppend).show();
        }
      }
    }
  });

  var groupFilterMenu = new Ext.menu.Menu({
    id: 'groupFilterMenu' + idAppend,
    items: [
      {
        text: 'All checks',

        checked: true,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'All',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('All checks');
          filterGroupStore();

        }
      }, '-', {
        text: 'Manual',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Manual',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Manual only');
          filterGroupStore();
        }
      }, {
        text: 'SCAP',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'SCAP',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('SCAP only');
          filterGroupStore();
        }
      }, '-', {
        text: 'Incomplete',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Incomplete',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Incomplete only');
          filterGroupStore();
        }
      }
      , {
        text: 'Unsubmitted',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Unsubmitted',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Unsubmitted only');
          filterGroupStore();
        }
      }
      , {
        text: 'Submitted',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Submitted',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Submitted only');
          filterGroupStore();
        }
      }
      , {
        text: 'Returned',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Rejected',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Returned only');
          filterGroupStore();
        }
      }
      , {
        text: 'Approved',
        checked: false,
        group: 'checkType' + idAppend,
        handler: function (item, eventObject) {
          groupGrid.filterType = 'Accepted',
            Ext.getCmp('groupGrid-tb-filterButton' + idAppend).setText('Approved only');
          filterGroupStore();
        }
      }

    ]
  });


  /******************************************************/
  // Group grid statistics string
  /******************************************************/
  var getStatsString = function (store) {
    var totalChecks = store.getCount();
    var checksO = 0;
    var checksNF = 0;
    var checksNA = 0;
    var checksNR = 0;
    store.data.each(function (item, index, totalItems) {
      switch (item.data.result) {
        case 'fail':
          checksO++;
          break;
        case 'pass':
          checksNF++;
          break;
        case 'notapplicable':
          checksNA++;
          break;
        case '':
          checksNR++;
          break;
      }
    });
    return totalChecks + ' checks (' + checksO + ' Open, ' + checksNF + ' NF, ' + checksNA + ' NA, ' + checksNR + ' NR)';
  };

  /******************************************************/
  // The group grid
  /******************************************************/
  var groupGrid = new Ext.grid.GridPanel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
    border: false,
    region: 'west',
    id: 'groupGrid' + idAppend,
    sm_benchmarkId: leaf.benchmarkId,
    sm_revisionStr: 'latest',
    width: '35%',
    minWidth: 340,
    hideMode: 'offsets',
    filterType: 'All', // STIG Manager defined property
    titleColumnDataIndex: 'ruleTitle', // STIG Manager defined property
    title: 'Checklist',
    split: true,
    store: groupStore,
    stripeRows: true,
    listeners: {
      beforehide: {
        fn: function (grid) {
          var test = '1';
        }
      },
      beforeshow: {
        fn: function (grid) {
          var test = '1';
        }
      }
    },
    sm: new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        beforerowselect: function (sm, index, keepExisting, record) {
          // var resultCombo = Ext.getCmp('result-combo' + idAppend);
          // var resultComment = Ext.getCmp('result-comment' + idAppend);
          // var actionCombo = Ext.getCmp('action-combo' + idAppend);
          // var actionComment = Ext.getCmp('action-comment' + idAppend);

          // //var isDirty = (resultCombo.lastSavedData != resultCombo.value) || (resultComment.lastSavedData != resultComment.getValue()) || (actionCombo.lastSavedData != actionCombo.value) || (actionComment.lastSavedData != actionComment.getValue());
          var reviewForm = Ext.getCmp('reviewForm' + idAppend);

          if (reviewForm.groupGridRecord != record) { // perhaps the row select is the result of a view refresh
            var isDirty = Ext.getCmp('reviewForm' + idAppend).reviewChanged();
            var isValid = Ext.getCmp('reviewForm' + idAppend).getForm().isValid();

            if (isDirty && isValid && reviewForm.isLoaded) {
              Ext.Msg.show({
                title: 'Save Changes?',
                msg: unsavedChangesPrompt,
                // buttons: Ext.Msg.YESNOCANCEL,
                buttons: {yes: 'Save', no: 'Discard', cancel: 'Cancel'},
                fn: function (buttonId, text, opt) {
                  switch (buttonId) {
                    case 'yes':
                      saveReview({
                        source: "selectGroup",
                        sm: sm,
                        index: index,
                        type: 'save'
                      });
                      reviewForm.isLoaded = false;
                      break;
                    case 'no':
                      Ext.getCmp('result-combo' + idAppend).changed = false;
                      Ext.getCmp('action-combo' + idAppend).changed = false;
                      reviewForm.isLoaded = false;

                      sm.selectRow(index);
                      break;
                    case 'cancel':
                      break;
                  }

                }
              });
              return false;
            } else {
              return true;
            }
          }
          return true;
        },
        rowselect: {
          fn: function (sm, index, record) {
            handleGroupSelectionForAsset(record, leaf.collectionId, leaf.assetId, idAppend, groupGrid.sm_benchmarkId, groupGrid.sm_revisionStr); // defined in stigmanUtil.js
          }
        }
      }
    }),
    view: new Ext.grid.GridView({
      forceFit: false,
      emptyText: 'No checks to display',
      // These listeners keep the grid in the same scroll position after the store is reloaded
      holdPosition: true, // HACK to be used with override
      listeners: {
      },
      deferEmptyText: false,
      getRowClass: function (record, index) {
        var autoCheckAvailable = record.get('autoCheckAvailable');
        if (autoCheckAvailable === true) {
          return 'sm-scap-grid-item';
        } 
        // else {
        //   return 'sm-manual-grid-item';
        // }
      }
    }),
    columns: [
      {
        id: 'severity' + idAppend,
        header: "CAT",
        fixed: true,
        width: 48,
        align: 'center',
        dataIndex: 'severity',
        sortable: true,
        renderer: renderSeverity
      },
      {
        id: 'groupId' + idAppend,
        header: "Group",
        width: 95,
        dataIndex: 'groupId',
        sortable: true,
        hidden: true,
        align: 'left'
      },
      {
        id: 'ruleId' + idAppend,
        header: "Rule Id",
        width: 100,
        dataIndex: 'ruleId',
        hidden: false,
        sortable: true,
        align: 'left'
      },
      {
        id: 'groupTitle' + idAppend,
        header: "Group Title",
        width: 80,
        hidden: true,
        dataIndex: 'groupTitle',
        renderer: columnWrap,
        sortable: true
      },
      {
        id: 'ruleTitle' + idAppend,
        header: "Rule Title",
        width: 80,
        hidden: false,
        dataIndex: 'ruleTitle',
        renderer: columnWrap,
        sortable: true
      },
      {
        id: 'result' + idAppend,
        header: '&#160;', // per docs
        menuDisabled: true,
        width: 32,
        fixed: true,
        dataIndex: 'result',
        sortable: true,
        renderer: renderResult
      },
      {
        id: 'status' + idAppend,
        header: "Status",
        fixed: true,
        width: 44,
        align: 'center',
        dataIndex: 'status',
        sortable: true,
        renderer: renderStatuses
      }

    ],
    autoExpandColumn: 'ruleTitle' + idAppend,
    loadMask: true,
    tbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'sm-checklist-icon',  // <-- icon
          text: 'Checklist',
          menu: groupChecklistMenu
        }, '-', {
          xtype: 'tbbutton',
          id: 'groupGrid-tb-filterButton' + idAppend,
          iconCls: 'sm-filter-icon',  // <-- icon
          text: 'All checks',
          menu: groupFilterMenu
        }
        , {
          xtype: 'trigger',
          fieldLabel: 'Filter',
          triggerClass: 'x-form-clear-trigger',
          onTriggerClick: function () {
            this.triggerBlur();
            this.blur();
            this.setValue('');
            filterGroupStore();
          },
          id: 'groupGrid-filterTitle' + idAppend,
          width: 140,
          submitValue: false,
          disabled: false,
          enableKeyEvents: true,
          emptyText: 'Title filter...',
          listeners: {
            keyup: function (field, e) {
              filterGroupStore();
              return false;
            }
          }
        },
        '->',
        {
            xtype: 'tbitem',
            html: '<div class="sm-toolbar-legend-box sm-scap-grid-item"></div>'
        },
        {
            xtype: 'tbtext',
            text: ' SCAP available',
            style: 'margin-right: 15px;'
        }
      ]
    }),
    bbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'icon-refresh',
          tooltip: 'Reload this grid',
          width: 20,
          handler: function (btn) {
            groupGrid.getStore().reload();
            //hostGrid.getStore().removeAll();
          }
        }, {
          xtype: 'tbseparator'
        }, {
          xtype: 'tbtext',
          id: 'groupGrid-totalText' + idAppend,
          text: '0 rules',
          width: 80
        }]
    })
  });

  var handleRevisionMenu = function (item, eventObject) {
    let store = Ext.getCmp('groupGrid' + idAppend).getStore()
    store.proxy.setUrl(`${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/${item.revisionStr}`, true)
    store.load();
    loadRevisionMenu(leaf.benchmarkId, item.revisionStr, idAppend)
    groupGrid.sm_revisionStr = item.revisionStr
  };

  async function loadRevisionMenu(benchmarkId, activeRevisionStr, idAppend) {
    try {
      let result = await Ext.Ajax.requestPromise({
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions`,
        method: 'GET'
      })
      let revisions = JSON.parse(result.response.responseText)
      let revisionObject = getRevisionObj(revisions, activeRevisionStr, idAppend)
      if (Ext.getCmp('revision-menuItem' + idAppend) === undefined) {
        Ext.getCmp('groupChecklistMenu' + idAppend).addItem(revisionObject.menu);
      }
      groupGrid.setTitle(revisionObject.activeRevisionLabel);
    }
    catch (e) {
      alert(e.message)
    }
  }

  let getRevisionObj = function (revisions, activeRevisionStr, idAppend) {
    let returnObject = {}
    var menu = {
      id: 'revision-menuItem' + idAppend,
      text: 'Revisions',
      hideOnClick: false,
      menu: {
        items: []
      }
    };
    for (var i = 0; i < revisions.length; i++) {
      let r = revisions[i]
      let benchmarkDateJs = new Date(r.benchmarkDate)
      let item = {
        id: `revision-submenu${r.benchmarkId}-${r.version}-${r.release}${idAppend}`,
        text: `Version ${r.version} Release ${r.release} (${benchmarkDateJs.format('j M Y')})`,
        // revId: `${r.benchmarkId}-${r.version}-${r.release}`,
        revisionStr: r.revisionStr,
        group: 'revision-submenu-group' + idAppend,
        handler: handleRevisionMenu
      }
      if (item.revisionStr == activeRevisionStr || (activeRevisionStr === 'latest' && i === 0)) {
        item.checked = true;
        groupGrid.sm_revisionStr = item.revisionStr
        returnObject.activeRevisionLabel = item.text;
      } else {
        item.checked = false;
      }
      menu.menu.items.push(item);
    }
    returnObject.menu = menu;
    return returnObject;
  };

  function filterGroupStore() {
    var filterArray = [];
    // Filter menu
    switch (groupGrid.filterType) {
      case 'Manual':
      case 'SCAP':
        filterArray.push({
          property: 'autoCheckAvailable',
          value: groupGrid.filterType === 'SCAP' ? true : false
        });
        break;
      case 'Incomplete':
        filterArray.push({
          fn: function (record) {
            return !record.get('reviewComplete')
          }
        });
        break;
      case 'Unsubmitted':
        filterArray.push({
          fn: function (record) {
            return (record.get('reviewComplete') && record.get('status') === 'saved');
          }
        });
        break;
      case 'Submitted':
        filterArray.push({
          fn: function (record) {
            return record.get('status') === 'submitted';
          }
        });
        break;
      case 'Rejected':
        filterArray.push({
          fn: function (record) {
            return record.get('status') === 'rejected';
          }
        });
        break;
      case 'Accepted':
        filterArray.push({
          fn: function (record) {
            return record.get('status') === 'accepted';
          }
        });
        break;
    }
    // Title textfield
    var titleValue = Ext.getCmp('groupGrid-filterTitle' + idAppend).getValue();
    if (titleValue.length > 0) {
      filterArray.push({
        property: groupGrid.titleColumnDataIndex,
        value: titleValue,
        anyMatch: true,
        caseSensitive: false
      });
    }

    groupStore.filter(filterArray);

  }


  /******************************************************/
  // END Group Grid
  /******************************************************/

  let contentTpl = new Ext.XTemplate(
    '<div class=cs-home-header-top>{ruleId}',
      '<span class="sm-content-sprite sm-severity-{severity}">',
        `<tpl if="severity == 'high'">CAT 1</tpl>`,
        `<tpl if="severity == 'medium'">CAT 2</tpl>`,
        `<tpl if="severity == 'low'">CAT 3</tpl>`, 
      '</span>',
    '</div>',
    '<div class=cs-home-header-sub>{title}</div>',
    '<div class=cs-home-body-title>Manual Check',
    '<div class=cs-home-body-text>',
    '<tpl for="checks">',
      '<pre>{[values.content.trim()]}</pre>',
    '</tpl>',
    '</div>',
    '</div>',
    '<div class=cs-home-body-title>Fix',
    '<div class=cs-home-body-text>',
    '<tpl for="fixes">',
    '<pre>{[values.text.trim()]}</pre>',
    '</tpl>',
    '</div>',
    '</div>',
    '<div class=cs-home-header-sub></div>',
    '<div class=cs-home-body-title>Other Data',
    '<div class=cs-home-body-text><b>Vulnerability Discussion</b><br><br>',
    '<pre>{[values.vulnDiscussion.trim()]}</pre>',
    '</div>',
    '<div class=cs-home-body-text><b>Documentable: </b>{documentable}</div>',
    `<tpl if="typeof(responsibility) != 'undefined'">`,
      '<div class=cs-home-body-text><b>Responsibility: </b>{responsibility}</div>',
    '</tpl>',
    '<tpl if="values.ccis.length === 0">',
      '<div class=cs-home-body-text><b>Controls: </b>No mapped controls</div>',
    '</tpl>',
    '<tpl if="values.ccis.length !== 0">',
      '<div class=cs-home-body-text><b>Controls: </b><br>',
      '<table class=cs-home-body-table border="1">',
      '<tr><td><b>CCI</b></td><td><b>AP Acronym</b></td><td><b>Control</b></td></tr>',
      '<tpl for="ccis">',
      '<tr><td>{cci}</td><td>{apAcronym}</td><td>{control}</td></tr>',
      '</tpl>',
      '</table>',
      '</div>',
    '</tpl>',
    '</div>'
  )

  /******************************************************/
  // START Resources panel
  /******************************************************/

  /******************************************************/
  // START Other Grid
  /******************************************************/

  var otherFields = Ext.data.Record.create([
    {
      name: 'assetName',
      type: 'string'
    }, {
      name: 'status',
      type: 'string'
    }, {
      name: 'result',
      type: 'string'
    }, {
      name: 'action',
      type: 'string'
    }, {
      name: 'autoResult',
      type: 'boolean'
    }, {
      name: 'action',
      type: 'string'
    }, {
      name: 'username',
      type: 'string'
    }, {
      name: 'resultComment',
      type: 'string'
    }, {
      name: 'actionComment',
      type: 'string'
    }, {
      name: 'reviewId',
      type: 'int'
    }

  ]);

  var otherStore = new Ext.data.JsonStore({
    root: '',
    id: 'otherStore' + idAppend,
    fields: otherFields,
    sortInfo: {
      field: 'assetName',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    listeners: {
      exception: function (misc) {
        var ourView = otherGrid.getView();
        var response = misc.events.exception.listeners[1].fn.arguments[4];
        if (response.status != 0) {
          var maskStr = 'Load failed: ' + response.responseText;
          //ourView.emptyText = 'Load failed: ' + response.responseText;
        } else {
          //ourView.emptyText = 'HTTP Server Error: ' + response.statusText;
          var maskStr = 'HTTP Server Error: ' + response.statusText;
        }
        //ourView.refresh();
        otherGrid.getEl().mask(maskStr);
      }
    },
    idProperty: 'reviewId'
  });

  // var otherStore = new Ext.data.ArrayStore({
  // id: 'otherStore' + idAppend,
  // fields: otherFields,
  // idProperty: 'reviewId'
  // });

  var expander = new Ext.ux.grid.RowExpander({
    tpl: new Ext.XTemplate(
		  '<p><b>Result Comment:</b> {resultComment}</p>',
		  '<tpl if="action">',
		  '<p><b>Action:</b> {action}</p>',
		  '</tpl>',
		  '<tpl if="actionComment">',
		  '<p><b>Action Comment:</b> {actionComment}</p>',
		  '</tpl>'
    )
  });

  var otherGrid = new Ext.grid.GridPanel({
    //region: 'center',
    enableDragDrop: true,
    ddGroup: 'gridDDGroup',
    plugins: expander,
    layout: 'fit',
    height: 350,
    border: false,
    id: 'otherGrid' + idAppend,
    //title: 'Other Assets',
    store: otherStore,
    stripeRows: true,
    sm: new Ext.grid.RowSelectionModel({
      singleSelect: true
    }),
    view: new Ext.grid.GridView({
      forceFit: true,
      emptyText: 'No other assets to display.',
      deferEmptyText: false
    }),
    tbar: new Ext.Toolbar({
      items: []
    }),
    columns: [
      expander,
      {
        id: 'target' + idAppend,
        header: "Asset",
        width: 120,
        dataIndex: 'assetName',
        sortable: true,
        align: 'left',
        renderer: function (value, metaData, record, rowIndex, colIndex, store) {
          metaData.css += ' sm-cell-asset';
          return value;
        }
      },
			{ 	
				header: "Status", 
				width: 50,
				fixed: true,
				dataIndex: 'status',
				sortable: true,
				renderer: function (val, metaData, record, rowIndex, colIndex, store) {
          return renderStatuses(val, metaData, record, rowIndex, colIndex, store)
        }
			},
      {
        id: 'state' + idAppend,
        header: "Result",
				width: 50,
				fixed: true,
        dataIndex: 'result',
        sortable: true,
        renderer: function (val) {
					switch (val) {
						case 'fail':
							return '<div style="color:red;font-weight:bolder;text-align:center">O</div>';
							break;
						case 'pass':
							return '<div style="color:green;font-weight:bolder;text-align:center">NF</div>';
							break;
						case 'notapplicable':
							return '<div style="color:grey;font-weight:bolder;text-align:center">NA</div>';
							break;
					}
				}
      },
      // {
      //   header: 'Comment',
      //   width: 120,
      //   dataIndex: 'resultComment',
      //   renderer: columnWrap
      // },
			{ 	
				header: "User", 
				width: 50,
				dataIndex: 'username',
				sortable: true
			},
      // {
      //   id: 'action' + idAppend,
      //   header: "Action",
      //   width: 80,
      //   dataIndex: 'action',
      //   sortable: true,
      //   renderer: function (value, metaData, record, rowIndex, colIndex, store) {
      //     switch (value) {
      //       case 'remediate':
      //         return "Remediate"
      //         break
      //       case 'mitigate':
      //         return "Mitigate"
      //         break
      //       case 'exception':
      //         return "Exception"
      //         break
      //     }
      //   }
      // }
    ],
    // width: 300,
    loadMask: true,
    autoExpandColumn: 'target' + idAppend,
    emptyText: 'No other assets to display',
    listeners: {
      render: function () {
        var one = 1;
      }
    }
  });

  /******************************************************/
  // END Other Grid
  /******************************************************/

  /******************************************************/
  // START Attachments Panel
  /******************************************************/

  var attachFields = Ext.data.Record.create([
    {
      name: 'raId',
      type: 'int'
    }, {
      name: 'artId',
      type: 'int'
    }, {
      name: 'filename',
      type: 'string'
    }, {
      name: 'userName',
      type: 'string'
    }, {
      name: 'description',
      type: 'string'
    }, {
      name: 'ts',
      type: 'date',
      dateFormat: 'Y-m-d H:i:s'
    }
  ]);

  var attachStore = new Ext.data.JsonStore({
    root: 'rows',
    storeId: 'attachStore' + idAppend,
    fields: attachFields,
    sortInfo: {
      field: 'filename',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    idProperty: 'raId'
  });

  var attachGrid = new Ext.grid.GridPanel({
    //region: 'center',
    disableSelection: true,
    layout: 'fit',
    cls: 'custom-artifacts',
    hideHeaders: true,
    border: false,
    id: 'attachGrid' + idAppend,
    store: attachStore,
    stripeRows: true,
    // sm: new Ext.grid.RowSelectionModel ({
    // singleSelect: true
    // }),
    view: new Ext.grid.GridView({
      forceFit: true,
      emptyText: 'No attachments to display.',
      deferEmptyText: false
    }),
    tbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          text: 'Attach artifact...',
          id: 'attachGrid-add-button' + idAppend,
          icon: 'img/attach-16.png',
          handler: function (btn) {
            attachArtifact();
          }
        }
      ]
    }),
    columns: [
      {
        id: 'attach-filename' + idAppend,
        header: "Artifact",
        width: 100,
        dataIndex: 'filename',
        sortable: true,
        align: 'left',
        renderer: function (value, metadata, record) {
          //var returnStr = '<img src="' + getFileIcon(value) + '" width=12px height=12px>&nbsp;';
          var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">';
          returnStr += '<b>' + value + '</b>';
          returnStr += '<br><br><b>Attached by:</b> ' + record.data.userName;
          returnStr += '<br><b>Description:</b> ' + record.data.description;
          returnStr += '<br><br>';
          return returnStr;
        }
      }
      , {
        width: 25,
        header: 'download', // not shown, used in cellclick handler
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          metadata.css = 'artifact-download';
          metadata.attr = 'ext:qtip="Download artifact"';
          return '';
        }
      }
      , {
        width: 25,
        header: 'delete',
        fixed: true,
        dataIndex: 'none',
        renderer: function (value, metadata, record) {
          if (attachGrid.groupGridRecord.data.statusId == 0 || attachGrid.groupGridRecord.data.statusId == 2) {
            metadata.css = 'artifact-delete';
            metadata.attr = 'ext:qtip="Unattach the artifact from this review"';
          }
          return '';
        }
      }
    ],
    loadMask: true,
    autoExpandColumn: 'attach-filename' + idAppend,
    emptyText: 'No attachments to display',
    listeners: {
      cellclick: function (grid, rowIndex, columnIndex, e) {
        //if (grid.getSelectionModel().isSelected(rowIndex)) {
        var r = grid.getStore().getAt(rowIndex);
        var header = grid.getColumnModel().getColumnHeader(columnIndex);
        switch (header) {
          case 'download':
            window.location = 'pl/getArtifact.pl?artId=' + r.data.artId;
            break;
          case 'delete':
            removeMap(r);
            break;
        }
        //}
      }
    }
  });


  function removeMap(r) {
    var confirmStr = 'Do you want to unattach the artifact "' + r.data.filename + '"?';
    Ext.Msg.confirm("Confirm", confirmStr, function (btn, text) {
      if (btn == 'yes') {
        Ext.Ajax.request({
          url: 'pl/removeArtifactMap.pl',
          params: {
            raId: r.data.raId
          },
          success: function (response, request) {
            var responseObj = Ext.util.JSON.decode(response.responseText);
            if (responseObj.success) {
              attachStore.remove(r);
              if (attachStore.getCount() > 0) {
                reviewForm.groupGridRecord.set('hasAttach', 1);
              } else {
                reviewForm.groupGridRecord.set('hasAttach', 0);
              }
            }
          },
          failure: function (results, request) {
            // if (p.maskEl != undefined) {
            // p.maskEl.unmask();
            // }
            // alert('Error: review could not be updated.');
          }
        });
      }
    });

  };

  function attachArtifact() {
    var reviewForm = Ext.getCmp('reviewForm' + idAppend);
    var assetId = reviewForm.groupGridRecord.data.assetId;
    var ruleId = reviewForm.groupGridRecord.data.ruleId;

    var deptArtifactFields = Ext.data.Record.create([
      {
        name: 'artId',
        type: 'int'
      }, {
        name: 'filename',
        type: 'string'
      }, {
        name: 'userName',
        type: 'string'
      }, {
        name: 'dept',
        type: 'string'
      }, {
        name: 'sha1',
        type: 'string'
      }, {
        name: 'description',
        type: 'string'
      }, {
        name: 'ts',
        type: 'date',
        dateFormat: 'Y-m-d H:i:s'
      }
    ]);

    var deptArtifactStore = new Ext.data.JsonStore({
      url: 'pl/getArtifacts.pl',
      autoLoad: true,
      root: 'rows',
      fields: deptArtifactFields,
      totalProperty: 'records',
      idProperty: 'artId',
      listeners: {
        load: function (store, records) {
          deptArtifactGrid.getSelectionModel().selectFirstRow();
        }
      }
    });

    var sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: function (sm, rowIndex, r) {
          Ext.getCmp('dpt-attach-btn' + idAppend).setText('Attach "' + r.data.filename + '"');
        }
      }
    });

    var deptArtifactGrid = new Ext.grid.GridPanel({
      cls: 'artifact-grid',
      anchor: '100% -20',
      height: 200,
      store: deptArtifactStore,
      stripeRows: true,
      sm: sm,
      columns: [
        {
          header: "Artifact",
          width: 100,
          dataIndex: 'filename',
          sortable: true,
          align: 'left',
          renderer: function (value, metadata, record) {
            // var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">' + '<a href="pl/getArtifact.pl?artId=' + record.data.artId + '" style="color:#000;cursor:pointer;">' + value + '</a>';
            var returnStr = '<img src="' + getFileIcon(value) + '" class="sm-artifact-file-icon">' + value;
            return returnStr;
          }
        }
        , {
          header: "Description",
          id: 'artifact-description',
          width: 100,
          dataIndex: 'description',
          sortable: true,
          align: 'left',
        }
      ],
      autoExpandColumn: 'artifact-description',
      view: new Ext.grid.GridView({
        autoFill: true,
        deferEmptyText: false
      }),
      loadMask: false,
      listeners: {
        // cellclick: function (grid,rowIndex,columnIndex,e) {
        // window.location='http://www.google.com';
        // var r = grid.getStore().getAt(rowIndex);
        // var header = grid.getColumnModel().getColumnHeader(columnIndex);
        // switch (header) {
        // case 'download':
        // //window.location='pl/getAttachment.pl?aiId=' + r.data.aiId;
        // window.location='pl/getAttachment.pl?aiId=11';
        // break;
        // }
        // //}
        // }
      },
      setValue: function (v) {
      },
      getValue: function () {
        //return this.getSelectionModel().getSelected().data.artId
      },
      markInvalid: function () { },
      clearInvalid: function () { },
      isValid: function () { return true },
      disabled: false,
      getName: function () { return this.name },
      validate: function () { return true },
      hideLabel: true,
      isFormField: true,
      name: 'artId'
    });



    var fp = new Ext.FormPanel({
      baseCls: 'x-plain',
      monitorValid: true,
      bodyStyle: 'padding: 10px 10px 0 10px;',
      labelWidth: 60,
      items: [
        deptArtifactGrid
      ],
      buttons: [{
        text: 'Attach',
        id: 'dpt-attach-btn' + idAppend,
        icon: 'img/attach-16.png',
        tooltip: 'Attach an artifact to this review.',
        formBind: true,
        handler: function () {
          if (fp.getForm().isValid()) {
            fp.getForm().submit({
              url: 'pl/attachArtifact.pl',
              params: {
                assetId: assetId,
                ruleId: ruleId,
                artId: deptArtifactGrid.getSelectionModel().getSelected().data.artId
              },
              waitMsg: 'Attaching artifact...',
              success: function (f, o) {
                window.close();
                attachStore.loadData(o.result.artifacts, true); // append new record
                attachStore.sort('filename');
                reviewForm.groupGridRecord.set('hasAttach', 1);
              },
              failure: function (f, o) {
                window.close();
                Ext.Msg.alert('Failure', o.result.message);
              }
            });
          }
        }
      }]
    });

    var window = new Ext.Window({
      title: 'Attach artifact',
      modal: true,
      width: 600,
      height: 300,
      //minWidth: 500,
      //minHeight: 140,
      layout: 'fit',
      plain: true,
      bodyStyle: 'padding:5px;',
      buttonAlign: 'center',
      items: fp
    });

    window.show(document.body);
  };

  /******************************************************/
  // END Attachments Panel
  /******************************************************/
  /******************************************************/
  // START History Panel
  /******************************************************/

  var historyData = new Sm_HistoryData(idAppend);

  /******************************************************/
  // END History Panel
  /******************************************************/

  var resourcesPanel = new Ext.Panel({
    cls: 'sm-round-panel',
    margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.adjacent },
    border: false,
    region: 'center',
    title: 'Review Resources',
    layout: 'fit',
    items: [{
      xtype: 'tabpanel',
      border: false,
      deferredRender: false,
      id: 'resources-tabs' + idAppend,
      activeTab: ('undefined' !== typeof selectedResource ? selectedResource : 'other-tab' + idAppend),
      listeners: {
        beforerender: function (tabs) {
        }
      },
      items: [{
        title: 'Other Assets',
        border: false,
        layout: 'fit',
        id: 'other-tab' + idAppend,
        items: otherGrid
      }, {
        title: 'Feedback',
        //layout: 'fit',
        id: 'feedback-tab' + idAppend,
        padding: 10,
        autoScroll: true
      },{
        title: 'History',
        layout: 'fit',
        id: 'history-tab' + idAppend,
        items: historyData.grid
      }]
    }]
  });

  /******************************************************/
  // END Resources panel
  /******************************************************/
  /******************************************************/
  // START Input form
  /******************************************************/

  let resultCommentTextArea = new Ext.form.TextArea ({
    cls: 'sm-review-result-textarea',
    disabled: true,
    anchor: '100% -30',
    lastSavedData: "",
    allowBlank: true,
    id: 'result-comment' + idAppend,
    //emptyText: 'Please address the specific items in the review.',
    //height: 65,
    fieldLabel: 'Comment<br><i class= "fa fa-question-circle sm-question-circle"></i>',
    labelSeparator: '',
    autoScroll: 'auto',
    name: 'resultComment',
    enableKeyEvents: true,
    listeners: {
      'render': function (ta) {
        ta.mon( ta.el, 'input', function (e) {
          reviewForm.setReviewFormItemStates(reviewForm)
        })
        new Ext.ToolTip({
          target: ta.label.dom.getElementsByClassName('fa')[0],
          showDelay: 0,
          dismissDelay: 0,
          autoWidth: true,
          html: SM.resultCommentTipText
        }) 
      }
    }
  })

  let actionCommentTextArea = new Ext.form.TextArea({
    cls: 'sm-review-action-textarea',
    lastSavedData: "",
    disabled: true,
    allowBlank: true,
    anchor: '100% -30',
    id: 'action-comment' + idAppend,
    //emptyText: 'Please describe how the action will be accomplished.',
    //height: 65,
    fieldLabel: 'Comment<br><i class= "fa fa-question-circle sm-question-circle"></i>',
    labelSeparator: '',
    autoScroll: 'auto',
    name: 'actionComment',
    enableKeyEvents: true,
    listeners: {
      'render': function (ta) {
        ta.mon( ta.el, 'input', function (e) {
          reviewForm.setReviewFormItemStates(reviewForm)
        })
        new Ext.ToolTip({
          target: ta.label.dom.getElementsByClassName('fa')[0],
          showDelay: 0,
          dismissDelay: 0,
          autoWidth: true,
          html: SM.actionCommentTipText
        }) 
      }
    }
  })

  var reviewForm = new Ext.form.FormPanel({
    cls: 'sm-round-panel',
    bodyCssClass: 'sm-review-form',
    border: false,
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
    region: 'south',
    split: true,
    height: '65%',
    minHeight: 320,
    id: 'reviewForm' + idAppend,
    title: 'Review on ' + leaf.assetName,
    padding: 10,
    labelWidth: 54,
    isLoaded: false, // STIG Manager defined property
    groupGridRecord: {}, // STIG Manager defined property
    monitorValid: false,
    trackResetOnLoad: false,
    reviewChanged: function () { // STIG Manager defined property
      var resultCombo = Ext.getCmp('result-combo' + idAppend);
      var resultComment = Ext.getCmp('result-comment' + idAppend);
      var actionCombo = Ext.getCmp('action-combo' + idAppend);
      var actionComment = Ext.getCmp('action-comment' + idAppend);
      return (resultCombo.lastSavedData != resultCombo.value) || (resultComment.lastSavedData != resultComment.getValue()) || (actionCombo.lastSavedData != actionCombo.value) || (actionComment.lastSavedData != actionComment.getValue());
    },
    items: [{
      xtype: 'fieldset',
      anchor: '100%, 49%',
      title: 'Evaluation',
      items: [{
        xtype: 'combo',
        cls: 'sm-review-combo-input',
        triggerClass: 'sm-review-trigger',
        disabledClass: 'sm-review-item-disabled',
        width: 100,
        lastSavedData: "",
        id: 'result-combo' + idAppend,
        changed: false,
        fieldLabel: 'Result<i class= "fa fa-question-circle sm-question-circle"></i>',
        labelSeparator: '',
        emptyText: 'Your result...',
        valueNotFoundText: 'Your result...',
        disabled: true,
        name: 'result',
        hiddenName: 'result',
        mode: 'local',
        editable: false,
        store: new Ext.data.SimpleStore({
          fields: ['result', 'resultStr'],
          data: [['pass', 'Not a Finding'], ['notapplicable', 'Not Applicable'], ['fail', 'Open']]
        }),
        valueField: 'result',
        displayField: 'resultStr',
        listeners: {
          'select': function (combo, record, index) {
            if (record.data.result == 'fail') { // Open
              Ext.getCmp('action-combo' + idAppend).enable();
              Ext.getCmp('action-comment' + idAppend).enable();
            } else {
              Ext.getCmp('action-combo' + idAppend).disable();
              Ext.getCmp('action-comment' + idAppend).disable();
            }
            reviewForm.setReviewFormItemStates(reviewForm)
          },
          'change': function (combo, newVal, oldVal) {
            combo.changed = true;
          },
          'render': function (combo) {
            new Ext.ToolTip({
              target: combo.label.dom.getElementsByClassName('fa')[0],
              showDelay: 0,
              dismissDelay: 0,
              autoWidth: true,
              html: SM.resultTipText
            }) 
          }
        },
        triggerAction: 'all'
      },resultCommentTextArea
    ] // end fieldset items
    }, {
      xtype: 'fieldset',
      id: 'recommendation-fs' + idAppend,
      anchor: '100%, 49%',
      title: 'Recommendation',
      items: [{
        xtype: 'combo',
        triggerClass: 'sm-review-trigger',
        disabledClass: 'sm-review-item-disabled',
        cls: 'sm-review-combo-input',
        lastSavedData: "",
        disabled: true,
        changed: false,
        allowBlank: true,
        width: 100,
        id: 'action-combo' + idAppend,
        fieldLabel: 'Action<i class= "fa fa-question-circle sm-question-circle"></i>',
        labelSeparator: '',
        name: 'action',
        hiddenName: 'action',
        mode: 'local',
        editable: false,
        store: new Ext.data.SimpleStore({
          fields: ['action', 'actionStr'],
          data: [['remediate', 'Remediate'], ['mitigate', 'Mitigate'], ['exception', 'Exception']]
        }),
        displayField: 'actionStr',
        valueField: 'action',
        listeners: {
          'select': function (combo, record, index) {
            if (record.data.actionId == 3) {
              Ext.getCmp('rd-checkbox' + idAppend).setValue(1);
            }
            reviewForm.setReviewFormItemStates(reviewForm)
          },
          'change': function (combo, newVal, oldVal) {
            combo.changed = true;
            // reviewForm.setReviewFormItemStates(reviewForm)
          },
          'render': function (combo) {
            new Ext.ToolTip({
              target: combo.label.dom.getElementsByClassName('fa')[0],
              showDelay: 0,
              dismissDelay: 0,
              autoWidth: true,
              html: SM.actionTipText
            }) 
          }
        },
        triggerAction: 'all'
      },actionCommentTextArea] // end fieldset items
    }, {
      xtype: 'displayfield',
      anchor: '100% 2%',
      id: 'editor' + idAppend,
      fieldLabel: 'Modified',
      allowBlank: true,
      name: 'editStr',
      readOnly: true
    }
      , {
      xtype: 'hidden',
      name: 'autoResult',
      id: 'autoResult' + idAppend
    }, {
      xtype: 'hidden',
      name: 'locked',
      id: 'locked' + idAppend
    }], // end form panel items,
    footerCssClass: 'sm-review-footer',
    buttons: [
      {
        text: 'Loading...',
        disabled: true,
        id: 'reviewForm-button-1' + idAppend,
        // formBind: true,
        handler: function (btn) {
          saveReview({
            source: 'form',
            type: btn.actionType
          });
        }
      }, {
        text: 'Loading...',
        disabled: true,
        iconCls: 'sm-ready-icon',
        id: 'reviewForm-button-2' + idAppend,
        // formBind: true,
        handler: function (btn) {
          saveReview({
            source: 'form',
            type: btn.actionType
          });
        }
      }], // end buttons
    listeners: {
      render: function (formPanel) {
        this.getForm().waitMsgTarget = this.getEl();
        var reviewFormPanelDropTargetEl = formPanel.body.dom;
        var reviewFormPanelDropTarget = new Ext.dd.DropTarget(reviewFormPanelDropTargetEl, {
          ddGroup: 'gridDDGroup',
          notifyEnter: function (ddSource, e, data) {
            var editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
            var copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
            if (editableDest && copyableSrc) { // accept drop of manual reviews or Open SCAP reviews with actions
              // // Add some flare to invite drop.
              // reviewForm.body.stopFx();
              // reviewForm.body.highlight("00ff00", {
              //   attr: "background-color", //can be any valid CSS property (attribute) that supports a color value
              //   endColor: "f0f0f0",
              //   easing: 'backBoth',
              //   duration: 0.5
              // });
            } else {
              return (reviewFormPanelDropTarget.dropNotAllowed);
            }
          },
          notifyOver: function (ddSource, e, data) {
            var editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
            var copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
            if (editableDest && copyableSrc) { // accept drop of manual reviews or SCAP reviews with actions
              return (reviewFormPanelDropTarget.dropAllowed);
            } else {
              return (reviewFormPanelDropTarget.dropNotAllowed);
            }
          },
          notifyDrop: function (ddSource, e, data) {
            // var editableDest = true
            var editableDest = (reviewForm.groupGridRecord.data.status == 'saved' || reviewForm.groupGridRecord.data.status == 'rejected' || reviewForm.groupGridRecord.data.status === "");
            var copyableSrc = (data.selections[0].data.autoResult == false || (data.selections[0].data.autoResult == true && data.selections[0].data.action !== ''));
            if (editableDest && copyableSrc) { // accept drop of manual reviews or SCAP reviews with actions
              // Reference the record (single selection) for readability
              //var selectedRecord = ddSource.dragData.selections[0];
              var selectedRecord = data.selections[0];
              // Load the record into the form
              var sCombo = Ext.getCmp('result-combo' + idAppend);
              var sComment = Ext.getCmp('result-comment' + idAppend);
              var aCombo = Ext.getCmp('action-combo' + idAppend);
              var aComment = Ext.getCmp('action-comment' + idAppend);
              if (!sCombo.disabled && selectedRecord.data.autoResult == false) {
                sCombo.setValue(selectedRecord.data.result);
              }
              //if (!sComment.disabled && selectedRecord.data.autoResult == 0) {
              sComment.setValue(selectedRecord.data.resultComment);
              //}
              if (sCombo.getValue() === 'fail') {
                aCombo.enable();
                aComment.enable();
              } else {
                aCombo.disable();
                aComment.disable();
              }
              if (!aCombo.disabled) {
                aCombo.setValue(selectedRecord.data.action);
              }
              if (!aComment.disabled) {
                aComment.setValue(selectedRecord.data.actionComment);
              }
              // reviewForm.body.stopFx();
              // reviewForm.body.highlight("eeeeee", {
              //   attr: "background-color", //can be any valid CSS property (attribute) that supports a color value
              //   endColor: "FFFFFF",
              //   easing: 'easeIn',
              //   duration: 1
              // })
              reviewForm.setReviewFormItemStates(reviewForm)

            }
            return (true);

          }
        }); // end DropTarget
      }, // end render
      // clientvalidation: setReviewFormItemStates
    } // end listeners
  });

  reviewForm.setReviewFormItemStates = function (fp, valid) {
    var resultCombo = Ext.getCmp('result-combo' + idAppend);
    var resultComment = Ext.getCmp('result-comment' + idAppend);
    var actionCombo = Ext.getCmp('action-combo' + idAppend);
    var actionComment = Ext.getCmp('action-comment' + idAppend);
    var button1 = Ext.getCmp('reviewForm-button-1' + idAppend); // left button
    var button2 = Ext.getCmp('reviewForm-button-2' + idAppend); // right button
    var attachButton = Ext.getCmp('attachGrid-add-button' + idAppend); // 'add attachment' button
    var autoResultField = Ext.getCmp('autoResult' + idAppend); // hidden 'autoResult' field

    // Initial state: Enable the entry fields if the review status is 'In progress' or 'Rejected', disable them otherwise
    var editable = (fp.groupGridRecord.data.status === '' || fp.groupGridRecord.data.status === 'saved' || fp.groupGridRecord.data.status === 'rejected');
    resultCombo.setDisabled(!editable); // disable if not editable
    resultComment.setDisabled(!editable);
    actionCombo.setDisabled(!editable);
    actionComment.setDisabled(!editable);

    if (autoResultField.value == true && resultCombo.value === 'notapplicable') {
      autoResultField.value = false;
    }

    if (autoResultField.value == true) { // Disable editing for autoResult
      resultCombo.disable();
      resultComment.disable();
    }

    if (editable) {
      if (resultCombo.value === 'fail') { // Result is 'Open'
        actionCombo.enable();
        actionComment.enable();
      } else {
        actionCombo.disable();
        actionComment.disable();
      }
      if (resultCombo.value === '' || resultCombo.value === undefined || resultCombo.value === null) {
        resultComment.disable();
      }
    }

    //Disable the add attachment button if the review has not been saved yet
    if (fp.groupGridRecord.data.result == "") {
      attachButton.disable();
      attachButton.setTooltip('This button is disabled because the review has never been saved.');
    } else {
      attachButton.enable();
      //attachButton.setTooltip('Attach a file to this review.'); 
      attachButton.setTooltip('');
    }

    // Quick hide of the buttons and exit if review status is 'Approved', 
    // otherwise show the buttons and continue processing below
    if (fp.groupGridRecord.data.status == 'accepted') {
      button1.show();
      button2.show();
      attachButton.disable();
      attachButton.setTooltip('This button is disabled because the review is locked.');
    } else {
      button1.show();
      button2.show();
      if (fp.groupGridRecord.data.status == 'submitted') {
        attachButton.disable();
        attachButton.setTooltip('This button is disabled because the review is submitted');
      } else {
        attachButton.enable();
        attachButton.setTooltip('');
      }
    }


    if (isReviewComplete(resultCombo.value, resultComment.getValue(), actionCombo.value, actionComment.getValue())) {
      if (fp.reviewChanged()) {
        // review has been changed (is dirty)
        switch (fp.groupGridRecord.data.status) {
          case '':
          case 'saved':
            // button 1
            button1.enable();
            button1.setText('Save without submitting');
            button1.setIconClass('sm-database-save-icon');
            button1.actionType = 'save';
            button1.setTooltip('');
            // button 2
            button2.enable();
            button2.setText('Save and Submit');
            button2.actionType = 'save and submit';
            button2.setTooltip('');
            break;
          case 'submitted': // 'ready' (a.k.a 'submitted'), dirty review can't happen
            break;
          case 'rejected': // 'rejected'
            // button 1
            button1.enable();
            button1.setText('Save without submitting');
            button1.setIconClass('sm-database-save-icon');
            button1.actionType = 'save';
            button1.setTooltip('');
            // button 2
            button2.enable();
            button2.setText('Save and Resubmit');
            button2.actionType = 'save and submit';
            button2.setTooltip('');
            break;
          case 'accepted': // 'approved', dirty review can't happen
            break;
        }
      } else {
        // review has not been changed (is in last saved state)
        switch (fp.groupGridRecord.data.status) {
          case '':
          case 'saved': // in progress
            // button 1
            button1.disable();
            button1.setText('Save without submitting');
            button1.setIconClass('sm-database-save-icon');
            button1.actionType = '';
            button1.setTooltip('This button is disabled because the review has not been modified.');
            // button 2
            button2.enable();
            button2.setText('Submit');
            button2.actionType = 'submit';
            button2.setTooltip('');
            break;
          case 'accepted':
          case 'submitted': // ready
            // button 1
            button1.enable();
            button1.setText('Unsubmit');
            button1.setIconClass('sm-ready-flip-icon');
            button1.actionType = 'unsubmit';
            button1.setTooltip('');
            // button 2
            button2.disable();
            button2.setText('Submit');
            button2.actionType = '';
            button2.setTooltip('This button is disabled because the review has already been submitted.');
            // review fields
            break;
          case 'rejected': // rejected
            // button 1
            button1.disable();
            button1.setText('Save without submitting');
            button1.setIconClass('sm-database-save-icon');
            button1.actionType = '';
            button1.setTooltip('This button is disabled because the review has not been modified.');
            // button 2
            button2.disable();
            button2.setText('Save and Resubmit');
            button2.actionType = '';
            button2.setTooltip('This button is disabled because the review has not been modified.');
            break;
          // case 'accepted': // approved
          //   // we should never get here because of the earlier 'if' statement
          //   // button 1
          //   button1.hide();
          //   button1.setText('Save without submitting');
          //   button1.setIconClass('sm-database-save-icon');
          //   button1.actionType = '';
          //   // button 2
          //   button2.hide();
          //   button2.setText('Save and Submit');
          //   button2.actionType = '';
          //   break;
        }
      }
    } else {
      // review is incomplete
      if (fp.reviewChanged()) {
        // review has been changed
        // button 1
        button1.enable();
        button1.setText('Save without submitting');
        button1.setIconClass('sm-database-save-icon');
        button1.actionType = 'save and unsubmit';
        button1.setTooltip('');
        // button 2
        button2.disable();
        button2.setText('Save and Submit');
        button2.actionType = '';
        button2.setTooltip('This button is disabled because the review is not complete and cannot be submitted.');
      } else {
        // review has not been changed (as loaded)
        // button 1
        button1.disable();
        button1.setText('Save without submitting');
        button1.setIconClass('sm-database-save-icon');
        button1.actionType = '';
        button1.setTooltip('This button is disabled because the review has not been modified.');
        // button 2
        button2.disable();
        button2.setText('Save and Submit');
        button2.actionType = '';
        button2.setTooltip('This button is disabled because the review is not complete and cannot be submitted.');
      }
    }
  };

  /******************************************************/
  // END input form
  /******************************************************/
  var reviewItems = [
    groupGrid,
    {
      cls: 'sm-round-panel',
      margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
      border: false,
      region: 'center',
      //disabled: true,
      xtype: 'panel',
      split: true,
      collapsible: false,
      padding: 20,
      autoScroll: true,
      id: 'content-panel' + idAppend,
      title: 'Rule',
      tpl: contentTpl
    }
    ,
    {
      region: 'east',
      layout: 'border',
      width: '35%',
      minWidth: 340,
      border: false,
      split: true,
      collapsible: false,
      id: 'east-panel' + idAppend,
      items: [resourcesPanel, reviewForm]
    }
  ];

  let reviewTab = new Ext.Panel ({
    id: 'reviewTab' + idAppend,
    border: false,
    collectionId: leaf.collectionId,
    collectionName: apiCollection.name,
    assetName: leaf.assetName,
    stigName: leaf.stigName,
    iconCls: 'sm-stig-icon',
    title: ' ',
    closable: true,
    layout: 'border',
    sm_tabMode: 'ephemeral',
    sm_treePath: treePath,
    sm_TabType: 'asset_review',
    sm_GroupGridView: groupGrid.getView(),
    items: reviewItems,
    listeners: {
      beforeclose: function (p) {
        var resultCombo = Ext.getCmp('result-combo' + idAppend);
        var resultComment = Ext.getCmp('result-comment' + idAppend);
        var actionCombo = Ext.getCmp('action-combo' + idAppend);
        var actionComment = Ext.getCmp('action-comment' + idAppend);

        var isDirty = (resultCombo.lastSavedData != resultCombo.value) || (resultComment.lastSavedData != resultComment.getValue()) || (actionCombo.lastSavedData != actionCombo.value) || (actionComment.lastSavedData != actionComment.getValue());

        //var isDirty = Ext.getCmp('reviewForm' + idAppend).getForm().isDirty();
        var isValid = Ext.getCmp('reviewForm' + idAppend).getForm().isValid();

        if (isDirty && isValid) {
          Ext.Msg.show({
            title: 'Save Changes?',
            msg: unsavedChangesPrompt,
            buttons: Ext.Msg.YESNOCANCEL,
            fn: function (buttonId, text, opt) {
              switch (buttonId) {
                case 'yes':
                  saveReview({
                    source: 'closeTab',
                    type: 'save'
                  });
                  break;
                case 'no':
                  Ext.getCmp('result-combo' + idAppend).changed = false;
                  Ext.getCmp('action-combo' + idAppend).changed = false;
                  Ext.getCmp('main-tab-panel').remove('reviewTab' + idAppend);
                  break;
                case 'cancel':
                  break;
              }

            }
          });
          return false;
        } else {
          return true;
        }
      }
    }
  })
  reviewTab.updateTitle = function () {
    reviewTab.setTitle(`${this.sm_tabMode === 'ephemeral' ? '<i>':''}${this.collectionName} / ${this.assetName} / ${this.stigName}${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
  }
  reviewTab.makePermanent = function () {
    reviewTab.sm_tabMode = 'permanent'
    reviewTab.updateTitle.call(reviewTab)
  }

  let tp = Ext.getCmp('main-tab-panel')
  let ephTabIndex = tp.items.findIndex('sm_tabMode', 'ephemeral')
  let thisTab
  if (ephTabIndex !== -1) {
    let ephTab = tp.items.itemAt(ephTabIndex)
    tp.remove(ephTab)
    thisTab = tp.insert(ephTabIndex, reviewTab);
  } else {
    thisTab = tp.add( reviewTab )
  }
  thisTab.updateTitle.call(thisTab)
  thisTab.show();

  groupGrid.getStore().load();
  loadRevisionMenu(leaf.benchmarkId, 'latest', idAppend)

  async function saveReview(saveParams) {
    // saveParams = {
    // source,
    // sm,
    // index,
    // type
    // }
    let fp
    try {
      fp = Ext.getCmp('reviewForm' + idAppend)
      fp.getEl().mask('Saving...')
      // masktask = new Ext.util.DelayedTask(function(){
      //   Ext.getBody().mask('Saving...')
      // })
      // masktask.delay(100)

      let fvalues = fp.getForm().getFieldValues(false, false) // dirtyOnly=false, getDisabled=true
      let jsonData = {
        result: fvalues.result,
        resultComment: fvalues.resultComment || null,
        action: fvalues.action || null,
        actionComment: fvalues.actionComment || null,
        autoResult: fvalues.autoResult === 'true'
      }
      let result, reviewFromApi
      switch (saveParams.type) {
        case 'submit':
        case 'unsubmit':
          result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}/${fp.groupGridRecord.data.ruleId}`,
            method: 'PATCH',
            params: {
              projection: 'history'
            },
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            jsonData: {
              status: saveParams.type == 'submit' ? 'submitted' : 'saved'
            }
          })
          reviewFromApi = JSON.parse(result.response.responseText)
          break
        case 'save and unsubmit':
          jsonData.status = 'saved'
          result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}/${fp.groupGridRecord.data.ruleId}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            params: {
              projection: 'history'
            },
            jsonData: jsonData
          })
          reviewFromApi = JSON.parse(result.response.responseText)
          break
        case 'save and submit':
          jsonData.status = 'submitted'
          result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}/${fp.groupGridRecord.data.ruleId}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            params: {
              projection: 'history'
            },
            jsonData: jsonData
          })
          reviewFromApi = JSON.parse(result.response.responseText)
          break
        case 'save':
          jsonData.status = 'saved'
          result = await Ext.Ajax.requestPromise({
            url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}/${fp.groupGridRecord.data.ruleId}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            params: {
              projection: 'history'
            },
            jsonData: jsonData
          })
          reviewFromApi = JSON.parse(result.response.responseText)
          break
      }
      // Update group grid
      resultCombo = Ext.getCmp('result-combo' + idAppend)
      resultComment = Ext.getCmp('result-comment' + idAppend)
      actionCombo = Ext.getCmp('action-combo' + idAppend)
      actionComment = Ext.getCmp('action-comment' + idAppend)
      resultCombo.changed = false
      actionCombo.changed = false
      fp.groupGridRecord.data.result = reviewFromApi.result
      fp.groupGridRecord.data.reviewComplete = reviewFromApi.reviewComplete
      fp.groupGridRecord.data.status = reviewFromApi.status
      fp.groupGridRecord.commit()
      filterGroupStore()

      // Update reviewForm
      let extDate = new Date(reviewFromApi.ts)
      Ext.getCmp('editor' + idAppend).setValue(`${extDate.format('Y-m-d H:i')} by ${reviewFromApi.username}`)

      // Update history
      historyData.store.loadData(reviewFromApi.history)

      //Reset lastSavedData to current values, so we do not trigger the save again:
      resultCombo.lastSavedData = resultCombo.value;
      resultComment.lastSavedData = resultComment.getValue()
      actionCombo.lastSavedData = actionCombo.value
      actionComment.lastSavedData = actionComment.getValue()

      //Continue the action that triggered this save (if any):					
      if (saveParams.source == "closeTab") {
        Ext.getCmp('main-tab-panel').remove('reviewTab' + idAppend)

      }
      else if (saveParams.source == "selectGroup") {
        saveParams.sm.selectRow(saveParams.index);
      }
      reviewForm.setReviewFormItemStates(reviewForm)
      //Ext.Msg.alert('Success','Successfully updated review.');
    }
    catch (e) {
      Ext.Msg.alert('Fail', `Failed to update review.\n${e.message}`)
    }
    finally {
      // masktask.cancel()
      fp.getEl().unmask()

      // Ext.getBody().unmask()
    }
  } //end saveReview();

  function unlockStigReviewsForAsset() {
    //===================================================
    //RESETS ALL RULE REVIEWS FOR A SPECIFIC STIG
    //AND SPECIFIC ASSET.
    //===================================================
    var unlockObject = new Object;
    unlockObject.benchmarkId = leaf.benchmarkId;
    unlockObject.stigName = leaf.stigName;
    unlockObject.assetId = leaf.assetId;
    unlockObject.assetName = leaf.assetName;
    unlockObject.collectionId = -1;
    unlockObject.collectionName = -1;
    unlockObject.gridTorefresh = groupGrid;
    unlockObject.unlockDepth = "STIG-ASSET";
    getUnlockPrompt("STIG-ASSET", unlockObject, groupGrid);
  };

  function bulkSubmit(all) {
    let completedRecords = groupStore.getRange().filter( record => record.data.reviewComplete && record.data.status !== 'submitted')
    if (completedRecords.length) {
      const confirmStr = `Eligible reviews: ${completedRecords.length}<br><br>Continue with submitting?`
      Ext.Msg.confirm("Confirm", confirmStr, async function (btn) {
        try {
          if (btn == 'yes') {
            Ext.getBody().mask('Submitting...')
            const requests = []
            for (const record of completedRecords) {
              requests.push(
                Ext.Ajax.requestPromise({
                  url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${record.data.assetId}/${record.data.ruleId}`,
                  method: 'PATCH',
                  jsonData: {
                    status: 'submitted'
                  }
                })
              )
            }
            let results = await Promise.allSettled(requests)

            for (i=0, l=completedRecords.length; i < l; i++) {
              if (results[i].status === 'fulfilled') {
                completedRecords[i].data.status = 'submitted'
                completedRecords[i].commit()
              }
            }
          }
        }
        catch (e) {
          alert(e.message)
        }
        finally {
          groupStore.reload()
          Ext.getBody().unmask()
        }
      })
    } else {
      Ext.Msg.alert('No eligible Reviews', `There are no Reviews eligible for submission`)
    }



  }; //end bulkSubmit;

}; //end addReview();
