async function addReview( params ) {
  let { leaf, selectedRule, selectedResource, treePath, dblclick = false } = params
  const idAppend = '-areview-' + leaf.assetId + '-' + leaf.benchmarkId.replace(/[. ]/g,'_');
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
  const roleId = curUser.collectionGrants.filter(g => g.collection.collectionId == apiCollection.collectionId)[0].roleId
  const canAccept = apiStatusSettings.canAccept && roleId >= apiStatusSettings.minAcceptGrant


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
      name: 'touchTs',
      type: 'date'
    }
  ]);


  var groupStore = new Ext.data.JsonStore({
    proxy: new Ext.data.HttpProxy({
      url: `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/${leaf.revisionStr}?format=json-access`,
      method: 'GET'
    }),
    root: 'checklist',
    storeId: 'groupStore' + idAppend,
    fields: groupFields,
    idProperty: 'ruleId',
    sortInfo: {
      field: 'ruleId',
      direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
    },
    listeners: {
      load: function (store, records) {
        const access = store.reader.jsonData.access
        reviewForm.defaultAccess = access
        attachmentsGrid.fileUploadField.setDisabled(access !== 'rw')
        groupChecklistMenu.importItem.setVisible(access === 'rw')
        groupGrid.accessStr = `<span class="sm-label-sprite sm-checklist-${access === 'rw' ? 'read-write">Writeable' : 'read">Read only'}</span>`
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

        groupGrid.statSprites.setText(getStatsString(store))
      },
      clear: function () {
        groupGrid.statSprites.setText(getStatsString(store));
      },
      update: function (store) {
        groupGrid.statSprites.setText(getStatsString(store));
      },
      datachanged: function (store) {
        groupGrid?.statSprites.setText(getStatsString(store));
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
        tooltip: 'Download this checklist and/or attachments',
        hideOnClick: false,
        menu: {
          items: [
            {
              text: 'CKL - STIG Viewer v2',
              iconCls: 'sm-export-icon',
              tooltip: 'Download this checklist in DISA STIG Viewer V2 format',
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
                  
                  xhr.setRequestHeader('Authorization', 'Bearer ' + window.oidcWorker.token)
                  xhr.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                      var contentDispo = this.getResponseHeader('Content-Disposition')
                      var fileName = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^\r\n"']*)['"]?;?/)[1]
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
              text: 'CKLB - STIG Viewer v3',
              iconCls: 'sm-export-icon',
              tooltip: 'Download this checklist in DISA STIG Viewer V3 format',
              handler: async function (item, eventObject) {
                try {
                  document.body.style.cursor = 'wait'
                  let ckl = await item.getCklb(leaf)
                  saveAs(ckl.blob, ckl.filename)
                  document.body.style.cursor = 'default'
                }
                catch (e) {
                  SM.Error.handleError(e)
                }
              },
              getCklb: function (leaf) {
                return new Promise( async (resolve, reject) => {
                  var xhr = new XMLHttpRequest()
                  var url = `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${groupGrid.sm_benchmarkId}/${groupGrid.sm_revisionStr}?format=cklb`
                  xhr.open('GET', url)
                  xhr.responseType = 'blob'
                  
                  xhr.setRequestHeader('Authorization', 'Bearer ' + window.oidcWorker.token)
                  xhr.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                      var contentDispo = this.getResponseHeader('Content-Disposition')
                      var fileName = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^\r\n"']*)['"]?;?/)[1]
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
                
                const url = `${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${groupGrid.sm_benchmarkId}/${groupGrid.sm_revisionStr}?format=xccdf`
                let response = await fetch(url, {
                  method: 'GET',
                  headers: new Headers({
                    'Authorization': `Bearer ${window.oidcWorker.token}`
                  })
                })
                const contentDispo = response.headers.get("content-disposition")
                if (contentDispo) {
                  const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^\r\n"']*)['"]?;?/)[1]
                  console.log(filename)
                  const blob = await response.blob()
                  saveAs(blob, filename)
                }
                else {
                  throw new SM.Error.SmError('No Content-Disposition header')
                }           
              }
            },
            '-',
            {
              text: 'Attachments Archive',
              iconCls: 'sm-export-icon',
              tooltip: 'Download all review attachments as a ZIP archive',
              handler: async function () {
                try {
                  document.body.style.cursor = 'wait'
                  await exportArtifacts(leaf)
                  document.body.style.cursor = 'default'
                }
                catch (e) {
                  document.body.style.cursor = 'default'
                  SM.Error.handleError(e)
                }
              }
            }
          ]
        }
      },
      {
        text: 'Import Results...',
        ref: 'importItem',
        iconCls: 'sm-import-icon',
        handler: function () {
          showImportResultFile( {...leaf, revisionStr: groupGrid.sm_revisionStr, store: groupStore, fieldSettings: apiFieldSettings} );            
        }
      }
    ]
  });

  /******************************************************/
  // Export Artifacts function
  /******************************************************/
  async function exportArtifacts(leaf) {
    try {
      // Fetch all reviews for this asset with metadata projection
      await window.oidcProvider.updateToken(10)
      const url = `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews/${leaf.assetId}?benchmarkId=${leaf.benchmarkId}&projection=metadata`
      const response = await fetch(url, {
        method: 'GET',
        headers: new Headers({
          'Authorization': `Bearer ${window.oidcProvider.token}`
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.statusText}`)
      }
      
      const reviews = await response.json()
      
      // Create a new ZIP file
      const zip = new JSZip()
      let hasArtifacts = false
      
      // Process each review that has artifacts
      for (const review of reviews) {
        if (review.metadata && review.metadata.artifacts) {
          let artifacts
          try {
            artifacts = JSON.parse(review.metadata.artifacts)
          } catch (e) {
            console.warn(`Failed to parse artifacts for rule ${review.ruleId}:`, e)
            continue
          }
          
          if (artifacts && artifacts.length > 0) {
            hasArtifacts = true
            // Create folder for this rule
            const ruleFolder = zip.folder(`Rule_${review.ruleId}`)
            
            // Add each artifact to the rule folder
            for (const artifact of artifacts) {
              try {
                // Get the artifact data from metadata using the digest as key
                const base64Data = review.metadata[artifact.digest]
                if (base64Data) {
                  // Add file to the rule folder
                  ruleFolder.file(artifact.name, base64Data, { base64: true })
                } else {
                  console.warn(`No data found for artifact ${artifact.name} (digest: ${artifact.digest}) in rule ${review.ruleId}`)
                }
              } catch (e) {
                console.warn(`Error processing artifact ${artifact.name} for rule ${review.ruleId}:`, e)
              }
            }
          }
        }
      }
      
      if (!hasArtifacts) {
        Ext.Msg.show({
          title: 'No Attachments',
          msg: 'No attachments found for this checklist.',
          buttons: Ext.Msg.OK,
        })
        return
      }
      
      // Generate and download the ZIP file
      const content = await zip.generateAsync({ type: 'blob' })
      const filename = `${leaf.assetName}-${leaf.benchmarkId}-attachments_${SM.Global.filenameComponentFromDate()}.zip`
      saveAs(content, filename)
      
    } catch (e) {
      throw new Error(`Failed to export artifacts: ${e.message}`)
    }
  }

  /******************************************************/
  // Group grid statistics string
  /******************************************************/
  function getStatsString(store) {
    const stats = store.data.items.reduce((a, c) => {
      switch (c.data.result) {
        case 'fail':
          a.fail++
          break
        case 'pass':
          a.pass++
          break
        case 'notapplicable':
          a.notapplicable++
          break
        default:
          a.other++
          break
      }
      if (c.data.engineResult) a[c.data.engineResult]++
      if (c.data.status) a[c.data.status]++
      return a
    }, {
      pass: 0,
      fail: 0,
      notapplicable: 0,
      other: 0,
      saved: 0,
      submitted: 0,
      rejected: 0,
      accepted: 0,
      override: 0,
      manual: 0,
      engine: 0
    })

    const spriteGroups = []
    spriteGroups.push(
      [
        `${stats.fail ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Open"><span class="sm-result-fail" style="font-weight:bolder;">O </span> ${stats.fail}</span>` : ''}`,
        `${stats.pass ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not a Finding"><span class="sm-result-pass" style="font-weight:bolder;">NF </span> ${stats.pass}</span>` : ''}`,
        `${stats.notapplicable ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Applicable"><span class="sm-result-na" style="font-weight:bolder;">NA</span> ${stats.notapplicable}</span>` : ''}`,
        `${stats.other ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Not Reviewed or has a non-compliance result such as informational"><span class="sm-result-nr" style="font-weight:bolder;">NR+</span> ${stats.other}</span>` : ''}`
      ].filter(Boolean).join(' '))

    spriteGroups.push(
      [
        `${stats.manual ? `<span class="sm-review-sprite sm-engine-manual-icon" ext:qtip="Manual"> ${stats.manual}</span>` : ''}`,
        `${stats.engine ? `<span class="sm-review-sprite sm-engine-result-icon" ext:qtip="Result engine"> ${stats.engine}</span>` : ''}`,
        `${stats.override ? `<span class="sm-review-sprite sm-engine-override-icon" ext:qtip="Overriden result engine"> ${stats.override}</span>` : ''}`
      ].filter(Boolean).join(' '))

    spriteGroups.push(
      [
        `${stats.saved ? `<span class="sm-review-sprite sm-review-sprite-stat-saved" ext:qtip="Saved"> ${stats.saved || '-'}</span>` : ''}`,
        `${stats.submitted ? `<span class="sm-review-sprite sm-review-sprite-stat-submitted" ext:qtip="Submitted"> ${stats.submitted}</span>` : ''}`,
        `${stats.rejected ? `<span class="sm-review-sprite sm-review-sprite-stat-rejected" ext:qtip="Rejected"> ${stats.rejected}</span>` : ''}`,
        `${stats.accepted ? `<span class="sm-review-sprite sm-review-sprite-stat-accepted" ext:qtip="Accepted"> ${stats.accepted}</span>` : ''}`
      ].filter(Boolean).join(' '))
    return spriteGroups.filter(Boolean).join('<span class="sm-xtb-sep"></span>')
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
    sm_revisionStr: leaf.revisionStr,
    width: '35%',
    minWidth: 340,
    hideMode: 'offsets',
    enableColumnMove: false,
    title: 'Checklist',
    split: true,
    store: groupStore,
    stripeRows: true,
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
      },
      {
        id: 'touchTs' + idAppend,
        header: '<div exportvalue="touchTs" class="sm-history-icon" ext:qtip="Last action"></div>',
        fixed: true,
        width: 44,
        align: 'center',
        dataIndex: 'touchTs',
        sortable: true,
        renderer: renderDurationToNow
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
      '->',
      {
        xtype: 'tbtext',
        ref: '../statSprites'
      },
      '-',
      new SM.RowCountTextItem({store:groupStore, noun:'rule', iconCls:'sm-stig-icon'})
    ]
  });

  var handleRevisionMenu = function (item, eventObject) {
    let store = groupGrid.getStore()
    store.proxy.setUrl(`${STIGMAN.Env.apiBase}/assets/${leaf.assetId}/checklists/${leaf.benchmarkId}/${item.revisionStr}?format=json-access`, true)
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
      groupGrid.setTitle(`${SM.he(revisionObject.activeRevisionLabel)} ${groupGrid.accessStr}`);
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
    'touchTs',
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
    idProperty: 'reviewId',
    listeners: {
      datachanged: function (store) {
        otherGrid.statSprites?.setText(getStatsString(store))
      }
    }
  });

  const otherExportBtn = new Ext.ux.ExportButton({
    hasMenu: false,
    exportType: 'grid',
    gridBasename: `Other-Reviews`,
    iconCls: 'sm-export-icon',
    text: 'CSV'
  })

  const otherGrid = new Ext.grid.GridPanel({
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
    bbar: [
      otherExportBtn,
      '->',
      {
        xtype: 'tbtext',
        ref: '../statSprites'
      },
      '-',
      new SM.RowCountTextItem({store:otherStore, noun:'asset', iconCls:'sm-asset-icon'})
    ],
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
            type: 'multi-value', 
            collectionId: apiCollection.collectionId,
            renderer: SM.ColumnFilters.Renderers.labels
        },
        renderer: function (value, metadata) {
            const labels = []
            for (const labelId of value) {
                const label = SM.Cache.getCollectionLabel(apiCollection.collectionId, labelId)
                if (label) labels.push(label)
            }
            labels.sort((a,b) => a.name.localeCompare(b.name))
            metadata.attr = 'style="white-space:nowrap;text-overflow:clip"'
            return SM.Manage.Collection.LabelArrayTpl.apply(labels)
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
				width: 44,
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
        id: 'touchTs' + idAppend,
        header: '<div exportvalue="touchTs" class="sm-history-icon" ext:qtip="Last action"></div>',
        fixed: true,
        width: 44,
        align: 'center',
        dataIndex: 'touchTs',
        sortable: true,
        renderer: renderDurationToNow
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
    '<tpl>',
      '<i style="color:#999;">Double-click row to view full review contents.</i>',
      '<tpl if="data.detail">',
        '<p><b>Detail:</b> {[SM.Truncate(values, "detail")]}</p>',
      '</tpl>',
      '<tpl if="data.comment">',
        '<p><b>Comment:</b> {[SM.Truncate(values, "comment")]}</p>',
      '</tpl>',
    '</tpl>'
  )


  otherGrid.on('rowdblclick', function (grid, rowIndex, e) {
    const record = grid.getStore().getAt(rowIndex)
    const data = record.json

    const resultMap = {
      pass: 'Not a Finding',
      notapplicable: 'Not Applicable',
      fail: 'Open',
      informational: 'Informational',
      notchecked: 'Not Reviewed'
    }

    const resultDisplay = resultMap[data.result]
    const formPanel = new Ext.FormPanel({
      bodyStyle: 'padding: 12px; font-size: 13px;',
      autoScroll: true,
      defaults: {
        labelWidth: 60,
      },
      items: [
        {
          xtype: 'fieldset',
          title: 'Evaluation',
          style: 'margin-bottom: 10px; padding: 10px; border-radius: 8px; border: 1px solid #3e4446;',
          items: [
            {
              xtype: 'displayfield',
              fieldLabel: 'Result',
              value: resultDisplay,
              style: 'margin-bottom: 12px;'
            },
            new SM.Review.Form.DetailTextArea({
              fieldLabel: 'Detail',
              value: data.detail,
              readOnly: true,
              style: 'margin-bottom: 12px; padding: 6px; height: 200px; overflow: auto; width: 570px;'
            }),
            new SM.Review.Form.CommentTextArea({
              fieldLabel: 'Comment',
              value: data.comment,
              readOnly: true,
              style: 'margin-bottom: 12px; padding: 6px; height: 200px; overflow: auto; width: 570px'
            })
          ]
        },
        {
          xtype: 'fieldset',
          title: 'Attributions',
          style: 'margin-bottom: 6px; padding: 10px; border-radius: 8px; border: 1px solid #3e4446;',
          items: [
            new SM.Review.Form.EvaluatedAttributions({
              value: {
                ts: data.ts,
                username: data.username,
                ruleId: data.ruleId,
                ruleIds: data.ruleIds
              },
              style: 'margin-bottom: 8px;'
            }),
            new SM.Review.Form.StatusedAttributions({
              value: {
                ts: data.touchTs,
                user: { username: data.username },
                label: data.status.label
              },
              style: 'margin-bottom: 8px;'
            })
          ]
        }
      ]
    })

    const win = new Ext.Window({
      title: `Review on ${data.assetName}`,
      modal: true,
      width: 700,
      height: 760,
      layout: 'fit',
      autoScroll: true,
      cls: 'sm-round-panel',
      bodyCssClass: 'sm-review-form',
      footerCssClass: 'sm-review-footer',
      items: [formPanel],
      buttons: [
        {
          text: 'Close',
          handler: function () {
            win.close()
          }
        }
      ]
    })
    win.show()
  })


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
  
  // Track whether a review exists in the database
  attachmentsGrid.reviewExists = false
  
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
      activeTab: ('undefined' !== typeof selectedResource ? selectedResource : 'history-tab' + idAppend),
      listeners: {
        tabchange: async function (tabs, tab) {
          if (tab.id === 'other-tab' + idAppend) {
            await loadOtherGridData()
          }
        }
      },
      items: [
        {
          title: 'History',
          layout: 'fit',
          id: 'history-tab' + idAppend,
          items: historyData.grid
        },
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
          autoScroll: true,
          bodyStyle: {
              'white-space': 'pre-wrap',
              'overflow-wrap': 'break-word'
          }
        }
      ]
    }]
  })


  async function loadOtherGridData() {
    const selected = groupGrid.getSelectionModel().getSelected()
    if (!selected) {
      otherGrid.getStore().removeAll()
      return
    }
    try {
      otherGrid.getEl().mask()
      const reviews = await Ext.Ajax.requestPromise({
        responseType: 'json',
        url: `${STIGMAN.Env.apiBase}/collections/${leaf.collectionId}/reviews`,
        method: 'GET',
        params: {
          rules: 'all',
          ruleId: selected.data.ruleId
        }
      })
      const otherReviews = reviews.filter(r => r.assetId != leaf.assetId)
      otherGrid.getStore().loadData(otherReviews)
    } catch (e) {
      otherGrid.getStore().removeAll()
      SM.Error.handleError(e)
    } finally {
      otherGrid.getEl().unmask()
    }
  }


  groupGrid.getSelectionModel().on('rowselect', async function () {
    const tabs = Ext.getCmp('resources-tabs' + idAppend)
    if (tabs.getActiveTab().id === 'other-tab' + idAppend) {
      await loadOtherGridData()
    }
  })

  /******************************************************/
  // END Resources panel
  /******************************************************/
  /******************************************************/
  // START Input form
  /******************************************************/
  let labelSpans
  if (leaf.assetLabels) {
    labelSpans = SM.Manage.Collection.LabelArrayTpl.apply(leaf.assetLabels)
  }
  else {
    const labels = []
    for (const labelId of leaf.assetLabelIds) {
        const label = SM.Cache.getCollectionLabel(apiCollection.collectionId, labelId)
        if (label) labels.push(label)
    }
    labels.sort((a,b) => a.name.localeCompare(b.name))
    labelSpans = SM.Manage.Collection.LabelArrayTpl.apply(labels)
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
          url: `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}/${groupGridRecord.data.ruleId}`,
          method: 'GET',
          params: { 
            projection: ['history']
          }
        })      
      ]

      const [content, reviewProjected] = await Promise.all(requests)

      // CONTENT
      reviewTab.contentPanel.update(content)
      reviewTab.contentPanel.setTitle('Rule for Group ' + SM.he(groupGridRecord.data.groupId))
  
      // REVIEW
  
      // load review
      let form = reviewForm.getForm()
      form.reset();
      reviewForm.isLoaded = false
        
      // Display the review
      reviewForm.groupGridRecord = groupGridRecord
      reviewForm.loadValues(reviewProjected)
      reviewForm.isLoaded = true
      
      // Check if review exists in database and update attachment button accordingly
      attachmentsGrid.reviewExists = !!reviewProjected
      attachmentsGrid.updateAttachmentButtonState(attachmentsGrid.reviewExists, reviewForm.defaultAccess === 'rw')
      
      reviewForm.setReviewFormItemStates()
  
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

  await groupGrid.getStore().loadPromise()
  loadRevisionMenu(leaf.benchmarkId, leaf.revisionStr, idAppend)

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

      const fvalues = fp.getForm().getFieldValues(false, true) // dirtyOnly=false, getDisabled=true
      
      let method, status
      switch (saveParams.type) {
        case 'accept':
        case 'submit':
        case 'unsubmit':
          status = saveParams.type == 'submit' ? 'submitted' : saveParams.type === 'accept' ? 'accepted' : 'saved'
          method = 'PATCH'
          break
        case 'save':
        case 'save and unsubmit':
          status = 'saved'
          method = 'PUT'
          break
        case 'save and submit':
          status = 'submitted'
          method = 'PUT'
          break
      }

      const jsonData = method === 'PUT' ? {
        result: fvalues.result,
        detail: fvalues.detail,
        comment: fvalues.comment,
        resultEngine: fp.resultChanged() ? null : fvalues.resultEngine,
        status
      } : { status }

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
      fp.groupGridRecord.data.status = reviewFromApi.status.label
      fp.groupGridRecord.data.touchTs = reviewFromApi.touchTs
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
      
      // After successful save, review now exists in database
      attachmentsGrid.reviewExists = true
      attachmentsGrid.updateAttachmentButtonState(true, reviewForm.defaultAccess === 'rw')
      
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
