async function addReview( params ) {
  let { leaf, selectedRule, selectedResource, treePath, dblclick = false } = params
  const idAppend = '-' + leaf.assetId + '-' + leaf.benchmarkId.replace(".", "_");
  const tab = Ext.getCmp('main-tab-panel').getItem('reviewTab' + idAppend);
  if (tab) {
    if (dblclick) {
      tab.makePermanent()
    }
    tab.show()
    if (selectedRule) {
      tab.selectRule(selectedRule)
    }
    return
  }


  const apiCollection = await Ext.Ajax.requestPromise({
    responseType: 'json',
    url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}`,
    method: 'GET'
  })
  const apiFieldSettings = apiCollection.settings.fields
  const apiStatusSettings = apiCollection.settings.status
  const accessLevel = curUser.collectionGrants.filter(g => g.collection.collectionId == apiCollection.collectionId)[0].accessLevel
  const canAccept = apiStatusSettings.canAccept && accessLevel >= apiStatusSettings.minAcceptGrant


  // Classic compatability. Remove after modernization
  if (leaf.stigRevStr) {
    let match = leaf.stigRevStr.match(/V(\d+)R(\d+)/)
    leaf.revId = `${leaf.benchmarkId}-${match[1]}-${match[2]}`
  }
  var unsavedChangesPrompt = 'You have modified your review. Would you like to save your changes?';

  /******************************************************/
  // START Group Grid
  /******************************************************/
  function engineResultConverter (v,r) {
    return r.resultEngine ? 
      (r.resultEngine.overrides?.length ? 'override' : 'engine') : 
      (r.result ? 'manual' : '')
  }
  var groupFields = Ext.data.Record.create([
    'assetId',
    {
      name: 'groupId',
      type: 'string',
      sortType: sortGroupId
    },
    {
      name: 'ruleId',
      type: 'string',
      sortType: sortRuleId
    },
    {
      name: 'groupTitle',
      type: 'string'
    },
    {
      name: 'ruleTitle',
      type: 'string'
    },
    {
      name: 'version',
      type: 'string'
    },
    {
      name: 'severity',
      type: 'string',
      sortType: sortSeverity
    },
    {
      name: 'result',
      type: 'string'
    },
    {
      name: 'status',
      type: 'string'
    },
    {
      name: 'hasAttach',
      type: 'boolean'
    }, 
    'resultEngine',
    {
      name: 'engineResult',
      convert: engineResultConverter
    },
    {
      name: 'reviewComplete',
      type: 'boolean'
    }
  ]);


  var groupStore = new Ext.data.JsonStore({
    proxy: new Ext.data.HttpProxy({
      url: `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/latest`,
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
        // Were we passed a specific rule to select?
        if ('undefined' !== typeof selectedRule) {
          var index = store.find('ruleId', selectedRule);
          groupGrid.getSelectionModel().selectRow(index);

          var rowEl = groupGrid.getView().getRow(index);
          //rowEl.scrollIntoView(ourGrid.getGridEl(), false);
          rowEl.scrollIntoView();
          //ourGrid.getView().focusRow(index+5);
        } else {
          groupGrid.getSelectionModel().selectFirstRow();
        }

        groupGrid.totalText.setText(getStatsString(store))
      },
      clear: function () {
        groupGrid.totalText.setText('0 rules');
      },
      update: function (store) {
        groupGrid.totalText.setText(getStatsString(store));
      },
      datachanged: function (store) {
        groupGrid?.totalText.setText(getStatsString(store));
      }
    }
  });

  /******************************************************/
  // Group grid menus
  /******************************************************/
  function groupRuleColHandler (item) {
    const {idProp, titleProp} = item.colProps
    const cm = groupGrid.getColumnModel()
    const colNames = ['groupId','groupTitle','ruleId','ruleTitle']
    const cols = {}
    groupGrid.titleColumnDataIndex = titleProp
    groupGrid.autoExpandColumn = titleProp + idAppend
    for (const colName of colNames) {
      const index = cm.findColumnIndex(colName)
      const hide = colName !== idProp && colName !== titleProp
      cm.setHidden(index, hide)
    }
    groupGrid.getView().autoExpand()
  }

  var groupChecklistMenu = new Ext.menu.Menu({
    id: 'groupChecklistMenu' + idAppend,
    items: [
      {
        text: 'Group/Rule display',
        hideOnClick: false,
        menu: {
          items: [
            {
              text: 'Group ID and Rule title',
              colProps: {idProp: 'groupId', titleProp: 'ruleTitle'},
              checked: true,
              group: 'titleType' + idAppend,
              handler: groupRuleColHandler
            },
            {
              text: 'Group ID and Group title',
              colProps: {idProp: 'groupId', titleProp: 'groupTitle'},
              checked: false,
              group: 'titleType' + idAppend,
              handler: groupRuleColHandler
            },
            {
              text: 'Rule ID and Rule title',
              colProps: {idProp: 'ruleId', titleProp: 'ruleTitle'},
              checked: false,
              group: 'titleType' + idAppend,
              handler: groupRuleColHandler
            }
          ]
        }
      },
      '-',
      {
        text: 'Export to file',
        iconCls: 'sm-export-icon',
        tooltip: 'Download this checklist in CKL or XCCDF format',
        hideOnClick: false,
        menu: {
          items: [
            {
              text: 'CKL',
              iconCls: 'sm-export-icon',
              tooltip: 'Download this checklist in DISA STIG Viewer format',
              handler: async function (item, eventObject) {
                try {
                  document.body.style.cursor = 'wait'
                  let ckl = await item.getCkl(leaf)
                  saveAs(ckl.blob, ckl.filename)
                  document.body.style.cursor = 'default'
                }
                catch (e) {
                  SM.Error.handleError(e)
                }
              },
              getCkl: function (leaf) {
                return new Promise( async (resolve, reject) => {
                  var xhr = new XMLHttpRequest()
                  var url = `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${groupGrid.sm_benchmarkId}/${groupGrid.sm_revisionStr}?format=ckl`
                  xhr.open('GET', url)
                  xhr.responseType = 'blob'
                  await window.oidcProvider.updateToken(10)
                  xhr.setRequestHeader('Authorization', 'Bearer ' + window.oidcProvider.token)
                  xhr.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                      var contentDispo = this.getResponseHeader('Content-Disposition')
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
              }
            },
            {
              text: 'XCCDF',
              iconCls: 'sm-export-icon',
              tooltip: 'Download this checklist in XCCDF format',
              handler: async function (item, eventObject) {
                try {
                  document.body.style.cursor = 'wait'
                  await item.getXccdf(leaf)
                  document.body.style.cursor = 'default'
                }
                catch (e) {
                  SM.Error.handleError(e)
                }
              },
              getXccdf: async function (leaf) {
                await window.oidcProvider.updateToken(10)
                const url = `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${groupGrid.sm_benchmarkId}/${groupGrid.sm_revisionStr}?format=xccdf`
                let response = await fetch(url, {
                  method: 'GET',
                  headers: new Headers({
                    'Authorization': `Bearer ${window.oidcProvider.token}`
                  })
                })
                const contentDispo = response.headers.get("content-disposition")
                if (contentDispo) {
                  const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
                  console.log(filename)
                  const blob = await response.blob()
                  saveAs(blob, filename)
                }
                else {
                  throw new SM.Error.SmError('No Content-Disposition header')
                }           
              }
            }      
          ]
        }
      },
      {
        text: 'Import Results...',
        iconCls: 'sm-import-icon',
        handler: function () {
          showImportResultFile( {...leaf, revisionStr: groupGrid.sm_revisionStr, store: groupStore, fieldSettings: apiFieldSettings} );            
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
    var checksOther = 0;
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
        default:
          checksOther++;
          break;
      }
    });
    return totalChecks + ' checks (' + checksO + ' Open, ' + checksNF + ' NF, ' + checksNA + ' NA, ' + checksOther + ' NR/Other )';
  };

  /******************************************************/
  // The group grid
  /******************************************************/
  const groupExportBtn = new Ext.ux.ExportButton({
    hasMenu: false,
    exportType: 'grid',
    gridBasename: `${leaf.assetName}-${leaf.benchmarkId}`,
    iconCls: 'sm-export-icon',
    text: 'CSV'
  })

  const groupGridView = new SM.ColumnFilters.GridView({
    forceFit: false,
    emptyText: 'No checks to display',
    // These listeners keep the grid in the same scroll position after the store is reloaded
    holdPosition: true, // HACK to be used with override
    deferEmptyText: false,
    lastHide: new Date(),
    onColumnSplitterMoved : function(cellIndex, width) {
      // override that does NOT set userResized and calls autoExpand()
      // this.userResized = true;
      this.grid.colModel.setColumnWidth(cellIndex, width, true);

      if (this.forceFit) {
          this.fitColumns(true, false, cellIndex);
          this.updateAllColumnWidths();
      } else {
          this.updateColumnWidth(cellIndex, width);
          this.syncHeaderScroll();
      }
      this.grid.fireEvent('columnresize', cellIndex, width);
      this.autoExpand()
    },
    listeners: {
      filterschanged: function (view, item, value) {
        groupStore.filter(view.getFilterFns())  
      }
    }
  })

  var groupGrid = new Ext.grid.GridPanel({
    stateful: true,
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
    enableColumnMove: false,
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
          if (reviewForm.groupGridRecord != record) { // perhaps the row select is the result of a view refresh
            var isDirty = reviewForm.reviewChanged();
            var isValid = reviewForm.getForm().isValid();

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
            handleGroupSelectionForAsset(record, leaf.collectionId, leaf.assetId, idAppend, groupGrid.sm_benchmarkId, groupGrid.sm_revisionStr);
          }
        }
      }
    }),
    view: groupGridView,
    columns: [
      {
        id: 'severity' + idAppend,
        header: "CAT",
        fixed: true,
        width: 48,
        align: 'left',
        dataIndex: 'severity',
        sortable: true,        
        renderer: renderSeverity,
        filter: {
          type: 'values',
          renderer: renderSeverity,
          comparer: SM.ColumnFilters.CompareFns.severity
        } 
      },
      {
        id: 'version' + idAppend,
        header: "STIG Id",
        width: 100,
        dataIndex: 'version',
        hidden: true,
        sortable: true,
        align: 'left',
        renderer: (v, attrs) => {
          attrs.css = 'sm-direction-rtl'
          return v
        },
        filter: {
          type: 'string'
        }
      },
      {
        id: 'groupId' + idAppend,
        header: "Group",
        width: 95,
        dataIndex: 'groupId',
        sortable: true,
        hidden: false,
        align: 'left',
        filter: {
          type: 'string'
        }
      },
      {
        id: 'ruleId' + idAppend,
        header: "Rule Id",
        width: 100,
        dataIndex: 'ruleId',
        hidden: true,
        sortable: true,
        align: 'left',
        filter: {
          type: 'string'
        }
      },
      {
        id: 'groupTitle' + idAppend,
        header: "Group Title",
        width: 80,
        hidden: true,
        dataIndex: 'groupTitle',
        renderer: columnWrap,
        sortable: true,
        filter: {
          type: 'string'
        }
      },
      {
        id: 'ruleTitle' + idAppend,
        header: "Rule Title",
        width: 80,
        hidden: false,
        dataIndex: 'ruleTitle',
        renderer: columnWrap,
        sortable: true,
        filter: {
          type: 'string'
        }
      },
      {
        id: 'result' + idAppend,
        header: 'Result',
        width: 44,
        fixed: true,
        dataIndex: 'result',
        sortable: true,
        renderer: renderResult,
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.result
        } 
      },
      {
        id: 'engineResult' + idAppend,
        header: '<div exportvalue="Engine" class="sm-engine-result-icon"></div>',
        width: 24,
        fixed: true,
        dataIndex: 'engineResult',
        sortable: true,
        renderer: renderEngineResult,
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.engineResult
        } 
      },
      {
        id: 'status' + idAppend,
        header: "Status",
        fixed: true,
        width: 44,
        align: 'center',
        dataIndex: 'status',
        sortable: true,
        renderer: renderStatuses,
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.status
        } 
      }

    ],
    autoExpandColumn: 'ruleTitle' + idAppend,
    loadMask: {msg: ''},
    tbar: new Ext.Toolbar({
      items: [
        {
          xtype: 'tbbutton',
          iconCls: 'sm-checklist-icon',  // <-- icon
          text: 'Checklist',
          menu: groupChecklistMenu
        }
      ]
    }),
    bbar: [
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
      },
      groupExportBtn,
      {
        xtype: 'tbseparator'
      },
      {
        xtype: 'tbtext',
        ref: '../totalText',
        id: 'groupGrid-totalText' + idAppend,
        text: '0 rules',
        width: 80
      }
    ]
  });

  var handleRevisionMenu = function (item, eventObject) {
    let store = groupGrid.getStore()
    store.proxy.setUrl(`${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/${item.revisionStr}`, true)
    store.load();
    loadRevisionMenu(leaf.benchmarkId, item.revisionStr, idAppend)
    groupGrid.sm_revisionStr = item.revisionStr
  };

  async function loadRevisionMenu(benchmarkId, activeRevisionStr, idAppend) {
    try {
      let revisions = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions`,
        method: 'GET'
      })
      let revisionObject = getRevisionObj(revisions, activeRevisionStr, idAppend)
      if (groupChecklistMenu.revisionMenuItem === undefined) {
        groupChecklistMenu.addItem(revisionObject.menu);
      }
      groupGrid.setTitle(SM.he(revisionObject.activeRevisionLabel));
    }
    catch (e) {
      SM.Error.handleError(e)
    }
  }

  let getRevisionObj = function (revisions, activeRevisionStr, idAppend) {
    let returnObject = {}
    var menu = {
      id: 'revision-menuItem' + idAppend,
      ref: 'revisionMenuItem',
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
        text: SM.he(`Version ${r.version} Release ${r.release} (${benchmarkDateJs.format('j M Y')})`),
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
    groupStore.filter(groupGridView.getFilterFns())
  }


  /******************************************************/
  // END Group Grid
  /******************************************************/

  let contentTpl = SM.RuleContentTpl

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
    },
    {
      name: 'assetLabelIds',
    },
    {
      name: 'status',
      type: 'string',
      mapping: 'status.label'
    },
    {
      name: 'result',
      type: 'string'
    },
    'resultEngine',
    {
      name: 'engineResult',
      convert: engineResultConverter
    },
    {
      name: 'username',
      type: 'string'
    },
    {
      name: 'detail',
      type: 'string'
    },
    {
      name: 'comment',
      type: 'string'
    },
    {
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
    idProperty: 'reviewId'
  });

  const otherExportBtn = new Ext.ux.ExportButton({
    hasMenu: false,
    exportType: 'grid',
    gridBasename: `Other-Reviews`,
    iconCls: 'sm-export-icon',
    text: 'CSV'
  })

  var otherGrid = new Ext.grid.GridPanel({
    enableDragDrop: true,
    ddGroup: 'gridDDGroup',
    layout: 'fit',
    height: 350,
    border: false,
    id: 'otherGrid' + idAppend,
    store: otherStore,
    stripeRows: true,
    sm: new Ext.grid.RowSelectionModel({
      singleSelect: true
    }),
    view: new SM.ColumnFilters.GridViewBuffered({
      forceFit: true,
      emptyText: 'No other assets to display.',
      deferEmptyText: false,
      // custom row height
      rowHeight: 21,
      borderHeight: 2,
      // render rows as they come into viewable area.
      scrollDelay: false,
      listeners: {
        filterschanged: function (view, item, value) {
          otherStore.filter(view.getFilterFns())  
        }
      }  
    }),
    bbar: new Ext.Toolbar({
      items: [
        otherExportBtn,
        '->',
        new SM.RowCountTextItem({store:otherStore})
      ]
    }),
    columns: [
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
        },
        filter: {
          type: 'string'
        }
      },
      {
        header: "Labels",
        width: 120,
        dataIndex: 'assetLabelIds',
        sortable: false,
        filter: {
            type: 'values', 
            collectionId: apiCollection.collectionId,
            renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value, metadata) {
            const labels = []
            for (const labelId of value) {
                const label = SM.Cache.CollectionMap.get(apiCollection.collectionId).labelMap.get(labelId)
                if (label) labels.push(label)
            }
            labels.sort((a,b) => a.name.localeCompare(b.name))
            metadata.attr = 'style="white-space:nowrap;text-overflow:clip"'
            return SM.Collection.LabelArrayTpl.apply(labels)
        }
      },
      {
        id: 'state' + idAppend,
        header: "Result",
				width: 50,
				fixed: true,
        dataIndex: 'result',
        sortable: true,
        renderer: renderResult,
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.result
        }
      },
      {
        header: '<div exportvalue="Engine" class="sm-engine-result-icon"></div>',
        width: 24,
        fixed: true,
        dataIndex: 'engineResult',
        sortable: true,
        renderer: renderEngineResult,
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.engineResult
        } 
      },
      { 	
				header: "Status", 
				width: 50,
				fixed: true,
        align: 'center',
				dataIndex: 'status',
				sortable: true,
				renderer: function (val, metaData, record, rowIndex, colIndex, store) {
          return renderStatuses(val, metaData, record, rowIndex, colIndex, store)
        },
        filter: {
          type: 'values',
          renderer: SM.ColumnFilters.Renderers.status
        }
			},
			{ 	
				header: "User", 
				width: 50,
				dataIndex: 'username',
				sortable: true,
        filter: {
          type: 'values'         
        }
			}
    ],
    // width: 300,
    loadMask: {msg: ''},
    autoExpandColumn: 'target' + idAppend,
    emptyText: 'No other assets to display'
  });

  otherGrid.rowTipTpl = new Ext.XTemplate(
    '<tpl if="data.detail">',
    '<p><b>Detail:</b> {[SM.TruncateRecordProperty(values, "detail")]}</p>',
    '</tpl>',
    '<tpl if="data.comment">',
    '<p><b>Comment:</b> {[SM.TruncateRecordProperty(values, "comment")]}</p>',
    '</tpl>'
  )

  otherGrid.on('render', function (grid) {
    const store = grid.getStore()  
    const view = grid.getView() 
    grid.tip = new Ext.ToolTip({
      target: view.mainBody,   
      delegate: '.x-grid3-row',
      trackMouse: true,
      renderTo: document.body,
      constrainPosition: true,
      onMouseMove: function (e) { //override built-in method
        var t = this.delegate ? e.getTarget(this.delegate) : this.triggerElement = true;
        if (t) {
          this.targetXY = e.getXY();
          if (t === this.triggerElement) {
            if (!this.hidden && this.trackMouse) {
              // call showAt() instead of setPagePosition()
              Ext.ToolTip.superclass.showAt.call(this, this.getTargetXY())
            }
          } else {
            this.hide();
            this.lastActive = new Date(0);
            this.onTargetOver(e);
          }
        } else if (!this.closable && this.isVisible()) {
          this.hide();
        }
      },
      listeners: {
        beforeshow: function updateTipBody(tip) {
          const rowIndex = view.findRowIndex(tip.triggerElement)
          tip.body.dom.innerHTML = grid.rowTipTpl.apply(store.getAt(rowIndex))
        }
      }
    })
  })

  /******************************************************/
  // END Other Grid
  /******************************************************/

  /******************************************************/
  // START Attachments Panel
  /******************************************************/
  const attachmentsGrid = new SM.Attachments.Grid({
    id: 'attachmentsGrid' + idAppend,
    title: 'Attachments',
    collectionId: leaf.collectionId,
    assetId: leaf.assetId
  })
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
      items: [
        {
          title: 'Other Assets',
          border: false,
          layout: 'fit',
          id: 'other-tab' + idAppend,
          items: otherGrid
        },
        attachmentsGrid,
        {
          title: 'Status Text',
          ref: '../statusTextPanel',
          padding: 10,
          autoScroll: true
        },
        {
          title: 'History',
          layout: 'fit',
          id: 'history-tab' + idAppend,
          items: historyData.grid
        }
      ]
    }]
  });

  /******************************************************/
  // END Resources panel
  /******************************************************/
  /******************************************************/
  // START Input form
  /******************************************************/
  let labelSpans
  if (leaf.assetLabels) {
    labelSpans = SM.Collection.LabelArrayTpl.apply(leaf.assetLabels)
  }
  else {
    const labelMap = SM.Cache.CollectionMap.get(apiCollection.collectionId).labelMap
    const labels = []
    for (const labelId of leaf.assetLabelIds) {
        const label = labelMap.get(labelId)
        if (label) labels.push(label)
    }
    labels.sort((a,b) => a.name.localeCompare(b.name))
    labelSpans = SM.Collection.LabelArrayTpl.apply(labels)
  }

  const reviewForm = new SM.Review.Form.Panel({
    cls: 'sm-round-panel',
    bodyCssClass: 'sm-review-form',
    border: false,
    margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
    region: 'south',
    split: true,
    height: '65%',
    minHeight: 320,
    id: 'reviewForm' + idAppend,
    title: `Review on ${SM.he(leaf.assetName)} ${labelSpans}`,
    padding: 10,
    labelWidth: 54,
    canAccept,
    fieldSettings: apiFieldSettings,
    btnHandler: function (btn) {
      console.log(btn)
      saveReview({
        source: 'form',
        type: btn.actionType
      })
    }
  })

  function onFieldSettingsChanged (collectionId, fieldSettings) {
    if (collectionId === apiCollection.collectionId) {
      reviewForm.fieldSettings = fieldSettings
      reviewForm.setReviewFormItemStates()
      reviewForm.setReviewFormTips()
    }
  }
  SM.Dispatcher.addListener('fieldsettingschanged', onFieldSettingsChanged)


  async function handleGroupSelectionForAsset (groupGridRecord, collectionId, assetId, idAppend, benchmarkId, revisionStr) {
    let maskTimer
    try {
      maskTimer = setTimeout(() => {
        reviewTab.contentPanel.bwrap.mask('')
        reviewForm.bwrap.mask('')
        resourcesPanel.bwrap.mask('') 
      }, 250)

      const requests = [
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/stigs/${benchmarkId}/revisions/${revisionStr}/rules/${groupGridRecord.data.ruleId}`,
          method: 'GET',
          params: {
            projection: ['detail','ccis','check','fix']
          }
        }),
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews`,
          method: 'GET',
          params: {
            rules: 'all',
            ruleId: groupGridRecord.data.ruleId
          }
        }),
        Ext.Ajax.requestPromise({
          responseType: 'json',
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}/${groupGridRecord.data.ruleId}`,
          method: 'GET',
          params: { 
            projection: ['history', 'metadata']
          }
        })      
      ]

      const [content, reviews, reviewProjected] = await Promise.all(requests)

      // CONTENT
      reviewTab.contentPanel.update(content)
      reviewTab.contentPanel.setTitle('Rule for Group ' + SM.he(groupGridRecord.data.groupId))
  
      // REVIEW
      let review = reviews.filter(review => review.assetId == assetId)[0] || {}
      let otherReviews = reviews.filter(review => review.assetId != assetId)
  
      // load review
      let form = reviewForm.getForm()
      form.reset();
      reviewForm.isLoaded = false
        
      // Display the review
      reviewForm.groupGridRecord = groupGridRecord
      reviewForm.loadValues(review)
      reviewForm.isLoaded = true
      reviewForm.setReviewFormItemStates()
  
      // load others
      otherGrid.getStore().loadData(otherReviews);
  
      // Log, Feedback 
  
      if (! reviewProjected) {
        historyData.store.removeAll()
        attachmentsGrid.getStore().removeAll()
      }
      if (reviewProjected.history) {
        // append current state of review to history grid
        let currentReview = {
          ruleId: reviewProjected.ruleId,
          comment: reviewProjected.comment,
          resultEngine: reviewProjected.resultEngine,
          rejectText: reviewProjected.rejectText,
          result: reviewProjected.result,
          detail: reviewProjected.detail,
          status: reviewProjected.status,
          ts: reviewProjected.ts,
          touchTs: reviewProjected.touchTs,
          userId: reviewProjected.userId,
          username: reviewProjected.username
        }
        reviewProjected.history.push(currentReview)
        historyData.store.loadData(reviewProjected.history)
      }
      // Feedback
      resourcesPanel.statusTextPanel.update(reviewProjected.status?.text)
  
      // Attachments
      attachmentsGrid.ruleId = groupGridRecord.data.ruleId
      attachmentsGrid.loadArtifacts()
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      clearTimeout(maskTimer)
      reviewTab.contentPanel.bwrap.unmask()
      reviewForm.bwrap.unmask()
      resourcesPanel.bwrap.unmask()

    }
  }	
  
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
      xtype: 'panel',
      split: true,
      collapsible: false,
      padding: 20,
      autoScroll: true,
      id: 'content-panel' + idAppend,
      ref: 'contentPanel',
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
      beforedestroy: () => {
        SM.Dispatcher.removeListener('fieldsettingschanged', onFieldSettingsChanged)
      },
      beforeclose: function (p) {
        var isDirty = reviewForm.reviewChanged();
        var isValid = reviewForm.getForm().isValid();

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
                  p.ownerCt.remove(p)
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
    },
    selectRule: function (ruleId) {
      const index = groupStore.find('ruleId', selectedRule);
      groupGrid.getSelectionModel().selectRow(index);
      var rowEl = groupGrid.getView().getRow(index);
      rowEl.scrollIntoView();
    }
  })
  reviewTab.updateTitle = function () {
    reviewTab.setTitle(`${this.sm_tabMode === 'ephemeral' ? '<i>':''}${SM.he(this.collectionName)} / ${SM.he(this.assetName)} / ${SM.he(this.stigName)}${this.sm_tabMode === 'ephemeral' ? '</i>':''}`)
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
      fp = reviewForm
      fp.getEl().mask('Saving...')
      // masktask = new Ext.util.DelayedTask(function(){
      //   Ext.getBody().mask('Saving...')
      // })
      // masktask.delay(100)

      const fvalues = fp.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
      const jsonData = {
        result: fvalues.result,
        detail: fvalues.detail,
        comment: fvalues.comment,
        resultEngine: fp.resultChanged() ? null : fvalues.resultEngine
      }
      let method
      switch (saveParams.type) {
        case 'accept':
        case 'submit':
        case 'unsubmit':
          jsonData.status = saveParams.type == 'submit' ? 'submitted' : saveParams.type === 'accept' ? 'accepted' : 'saved'
          method = 'PATCH'
          break
        case 'save and unsubmit':
          jsonData.status = 'saved'
          method = 'PUT'
          break
        case 'save and submit':
          jsonData.status = 'submitted'
          method = 'PUT'
          break
        case 'save':
          jsonData.status = 'saved'
          method = 'PUT'
          break
      }

      const reviewFromApi = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}/${fp.groupGridRecord.data.ruleId}`,
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        params: {
          projection: 'history'
        },
        method,
        jsonData
      })

      // Update group grid
      fp.groupGridRecord.data.result = reviewFromApi.result
      fp.groupGridRecord.data.reviewComplete = reviewFromApi.reviewComplete
      fp.groupGridRecord.data.status = reviewFromApi.status.label
      fp.groupGridRecord.data.resultEngine = reviewFromApi.resultEngine
      fp.groupGridRecord.data.engineResult = engineResultConverter('', reviewFromApi)
      fp.groupGridRecord.commit()
      filterGroupStore()

      // Update reviewForm
      reviewForm.loadValues(reviewFromApi)

      // Update statusText
      resourcesPanel.statusTextPanel.update(reviewFromApi.status?.text)

      // Update history
      // append current state of review to history grid
      let currentReview = {
        ruleId: reviewFromApi.ruleId,
        comment: reviewFromApi.comment,
        autoResult: reviewFromApi.autoResult,
        rejectText: reviewFromApi.rejectText,
        result: reviewFromApi.result,
        detail: reviewFromApi.detail,
        status: reviewFromApi.status,
        ts: reviewFromApi.ts,
        touchTs: reviewFromApi.touchTs,
        userId: reviewFromApi.userId,
        username: reviewFromApi.username
      }
      reviewFromApi.history.push(currentReview)
      historyData.store.loadData(reviewFromApi.history)

      //Continue the action that triggered this save (if any):					
      if (saveParams.source == "closeTab") {
        Ext.getCmp('main-tab-panel').remove('reviewTab' + idAppend)
        return
      }
      else if (saveParams.source == "selectGroup") {
        saveParams.sm.selectRow(saveParams.index);
        return
      }
      reviewForm.setReviewFormItemStates(reviewForm)
    }
    catch (e) {
      SM.Error.handleError(e)
    }
    finally {
      fp.getEl().unmask()
    }
  } 
};
