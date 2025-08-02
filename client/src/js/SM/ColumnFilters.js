Ext.ns('SM.ColumnFilters')

SM.ColumnFilters.extend = function extend (extended, ex) {
  return Ext.extend(extended, {
    constructor: function (config) {
      // Ext.apply(this, config);
      this.extends = ex
      this.addEvents(
        'filterschanged',
        'columnfiltered',
        'columnunfiltered'
      ) 
      SM.ColumnFilters[ex].superclass.constructor.call(this, config);
    },
    handleHdDown: function (e, target) {
      // Modifies superclass method to support lastHide
  
      // to support headers with tooltip in <span>, check parent node for the hd-inner class
      if (target.classList[0] !== 'x-grid3-hd-inner' && target.parentElement.classList[0] !== 'x-grid3-hd-inner') {
        return
      }
      e.stopEvent()
      if (!this.lastHide || this.lastHide.getElapsed() > 100) {
        var colModel  = this.cm,
        header    = this.findHeaderCell(target),
        index     = this.getCellIndex(header),
        sortable  = colModel?.isSortable(index),
        menu      = this.hmenu,
        menuItems = menu.items,
        menuCls   = this.headerMenuOpenCls,
        sep;
    
        this.hdCtxIndex = index;
        
        Ext.fly(header).addClass(menuCls);
        if (this.hideSortIcons) {
            menuItems.get('asc').setVisible(sortable);
            menuItems.get('desc').setVisible(sortable);
            sep = menuItems.get('sortSep');
            if (sep) {
                sep.setVisible(sortable);    
            }
        } else {
            menuItems.get('asc').setDisabled(!sortable);
            menuItems.get('desc').setDisabled(!sortable);
        }
        
        menu.on('hide', function() {
            Ext.fly(header).removeClass(menuCls);
            this.lastHide = new Date()
        }, this, {single:true});
        
        // menu.show(target, 'tl-bl?');    
        menu.showAt(e.xy);    
      }
    },
    onDataChange : function(){
      SM.ColumnFilters.GridView.superclass.onDataChange.call(this)
      this.setColumnFilteredStyle()
    },
    setColumnFilteredStyle: function () {
      const colCount = this.cm.getColumnCount()
      for (let i = 0; i < colCount; i++) {
        const td = this.getHeaderCell(i)
        td.getElementsByTagName("a")[0].style.height = td.classList.contains('x-grid3-td-checker') ? 0 : (td.firstChild.offsetHeight - 1) + 'px'
        if (this.cm.config[i].filter) {
          td.classList.add('sm-grid3-col-filterable')
        } else {
          td.classList.remove('sm-grid3-col-filterable')
        }
        if (this.cm.config[i].filtered) {
          td.classList.add('sm-grid3-col-filtered')
        } else {
          td.classList.remove('sm-grid3-col-filtered')
        }  
      }
    },
    getFilterFns: function () {
      const hmenu = this.hmenu
      const stringItems = hmenu.filterItems.stringItems
      const valuesItems = hmenu.filterItems.valuesItems
      const multiValueItems = hmenu.filterItems.multiValueItems
      const conditions = {}
      const filterFns = []
  
      // // iterate the menu items and set the condition(s) for each dataIndex
      for (const stringItem of stringItems) {
        const value = stringItem.getValue()
        if (value.value) {
          conditions[stringItem.filter.dataIndex] = value
        }
      }
      for (const selectAllItem of valuesItems) {
        if (!selectAllItem.checked) {
          const dataIndex = selectAllItem.filter.dataIndex
          conditions[dataIndex] = []
          for (const valueItem of selectAllItem.valueItems) {
            if (valueItem.checked === true) {
              conditions[dataIndex].push(valueItem.filter.value)
            }
          }
        }
      }
      for (const multiValueItem of multiValueItems) {
        const value = multiValueItem.getValue()
        if (value.isAllSelected && value.condition && value.match === 'any') continue // skip empty multi-value filters
        conditions[multiValueItem.filter.dataIndex] = multiValueItem.getValue()
      }

      // create a function for each dataIndex
      for (const dataIndex of Object.keys(conditions)) {
          filterFns.push({
            fn: function (record) {
              const cellValue = record.data[dataIndex]
              const condition = conditions[dataIndex]

              if (Array.isArray(cellValue)) { 
              // the record data is an Array of values
                if (Array.isArray(condition)) {
                  if (condition.includes('') && cellValue.length === 0) return true
                  return cellValue.some( v => condition.includes(v))
                }
                if (condition.value) { // multi-value condition
                  let matchResult
                  if (condition.match === 'all') {
                    // ALL logic: cellValue must contain ALL values in condition
                    matchResult = condition.value.every(v => v ? cellValue.includes(v) : cellValue.length === 0)
                  } else if (condition.match === 'exact') {
                    // EXACT logic: cellValue must contain the exact values in condition
                    if (condition.value.length === 1 && condition.value.includes('') && cellValue.length === 0) {
                      matchResult = true
                    } else {
                      matchResult = condition.value.length === cellValue.length && condition.value.every(v => cellValue.includes(v))
                    }
                  } else {
                    // ANY logic: cellValue must contain ANY value in condition (default)
                    if (condition.value.includes('') && cellValue.length === 0) {
                      matchResult = true
                    } else {
                      matchResult = cellValue.some(v => condition.value.includes(v))
                    }
                  }
                  
                  // Apply include/exclude filter
                  return condition.condition ? matchResult : !matchResult
                }
              }
  
              // the record data is a scalar value (we're missing object handling?)
              if (Array.isArray(condition)) {
                return condition.includes(cellValue) 
              }
              else {
                // string matches
                const a = condition.matchCase ? cellValue : cellValue.toLowerCase()
                const b = condition.matchCase ? condition.value : condition.value.toLowerCase()
                let found
                if (condition.matchWord) {
                  found = a.search(new RegExp(`\\b${b}\\b`))
                }
                else {
                  found = a.indexOf(b)
                }
                return condition.condition ? found > -1 : found === -1
              }
            }
          })  
      }
      return filterFns.length ? filterFns : null
    },
    onFilterChange: function (item, value) {
      switch (item.filter.type) {
        case 'string':
          item.column.filtered = !!(item.getValue()?.value)
          break
        case 'values':
          {
            const hmenuItems = this.hmenu.items.items
            const hmenuPeers = hmenuItems.filter( i => i.filter?.type === 'values' && i.filter?.dataIndex === item.filter.dataIndex)
            const hmenuPeersChecked = hmenuPeers.map( i => i.checked)
            item.column.filtered = hmenuPeersChecked.includes(false)
            break
          }
        case 'selectall':
          item.column.filtered = !(!!value)
          break
        case 'multi-value':
          {
            const itemValue = item.getValue()
            let filtered = true
            if (itemValue.condition && itemValue.match === 'any' && itemValue.isAllSelected) {
              filtered = false
            } else if (!itemValue.condition && itemValue.match === 'any' && itemValue.value.length === 0) {
              filtered = false
            }
            item.column.filtered = filtered
            break
          }
      }
      this.fireEvent('filterschanged', this, item, value)
    },
    afterRenderUI: function () {
      const _this = this
      const valuesColumns = []
      const multiValueColumns = []
  
      SM.ColumnFilters[this.extends].superclass.afterRenderUI.call(this)
  
      const hmenu = this.hmenu
      hmenu.filterItems = {
        stringItems: [],
        valuesItems: [],
        multiValueItems: []
      }
      // disables keyboard navigation, needed to support left-right arrow in search input
      hmenu.keyNav = new Ext.KeyNav(document.body, {disabled: true})
      const itemSeparator = hmenu.addItem('-')
  
      const itemLabel = hmenu.addItem({
        hideOnClick : false,
        activeClass: '',
        text: 'FILTER',
        iconCls: 'sm-menuitem-filter-icon',
        cls: 'sm-menuitem-filter-label'
      })
  
      // (Re)build the values items
      function buildValues (records, isLoading) {
        // iterate the values menu items, save their current values if not loading, and remove them
        const cVals = {}
        for (const selectAllItem of hmenu.filterItems.valuesItems) {
          const dataIndex = selectAllItem.filter.dataIndex
          ;(cVals[dataIndex] = cVals[dataIndex] || []).selectAllChecked = selectAllItem.checked
          for (const valueItem of selectAllItem.valueItems) {
            if (valueItem.checked && !isLoading) {
              cVals[dataIndex].push(valueItem.filter.value)
            }      
            hmenu.remove(valueItem)
          }
          hmenu.remove(selectAllItem)
        }
        for (const multiValueItem of hmenu.filterItems.multiValueItems) {
          hmenu.remove(multiValueItem)
        }
        hmenu.filterItems.valuesItems = []
        hmenu.filterItems.multiValueItems = []
        
        // iterate the values columns and create menu items, restoring saved values if not loading
        for (const col of valuesColumns) {
          if (isLoading) col.filtered = false
          const itemConfigs = []
          // get unique values for this column from the record set
          const uniqueSet = new Set(records.flatMap( r => r.data[col.dataIndex] ? (r.data[col.dataIndex].length ? r.data[col.dataIndex] : '') : r.data[col.dataIndex] ))
          const uniqueArray = [...uniqueSet].sort(col.filter.comparer)
          const cValue = cVals[col.dataIndex]
          for ( const value of uniqueArray ) {
            itemConfigs.push({
              text: col.filter.renderer ? col.filter.renderer(value, col.filter.collectionId) : value ,
              xtype: 'menucheckitem',
              column: col,
              hideOnClick: false,
              // checked: isLoading ? true : cVals[col.dataIndex] ? cVals[col.dataIndex].includes(value) : false,
              checked: isLoading ? true : cValue ? cValue.selectAllChecked || cValue.includes(value) : false,
              filter: {
                dataIndex: col.dataIndex,
                type: 'values',
                value
              },
              listeners: {
                checkchange: function (item, value) {
                  item.selectAllItem.onValueItemChanged()
                  _this.onFilterChange(item, value)
                }
              }
            })
          }
          // add the Select All item
          const selectAllItem = hmenu.addItem({
            text: '<i>(Select All)</i>',
            xtype: 'menucheckitem',
            column: col,
            hideOnClick: false,
            checked: isLoading ? true : cValue.selectAllChecked,
            filter: {
              dataIndex: col.dataIndex,
              type: 'selectall'
            },
            valueItems: [],
            onValueItemChanged: function () {
              const state = this.valueItems.every( i => i.checked )
              this.setChecked(state, true)
            },
            listeners: {
              checkchange: function (item, checked) {
                for (const valueItem of item.valueItems) {
                  valueItem.setChecked(checked, true)
                }
                _this.onFilterChange(item, checked)
              }
            }
          })
          // add the child items
          for (const itemConfig of itemConfigs) {
            itemConfig.selectAllItem = selectAllItem
            const valueItem = hmenu.addItem(itemConfig)
            selectAllItem.valueItems.push(valueItem)
          }
          hmenu.filterItems.valuesItems.push(selectAllItem)
        }

        // add the multi-value items
        for (const col of multiValueColumns) {
          if (isLoading) col.filtered = false
          // get unique values for this column from the record set
          const uniqueSet = new Set(records.flatMap( r => r.data[col.dataIndex] ? (r.data[col.dataIndex].length ? r.data[col.dataIndex] : '') : r.data[col.dataIndex] ))
          const uniqueArray = [...uniqueSet].sort(col.filter.comparer)
          const multiValueData = uniqueArray.map( value => [value] )

          const multiValuePanel = new SM.ColumnFilters.MultiValuePanel({
            collectionId: col.filter.collectionId,
            renderer: col.filter.renderer,
            listeners: {
              filterchanged: function () {
                _this.onFilterChange(multiValuePanel, multiValuePanel.getValue())
              },
            }
          })
          multiValuePanel.loadData(multiValueData)
          multiValuePanel.column = col
          multiValuePanel.filter = {
            dataIndex: col.dataIndex,
            type: 'multi-value'
          }
          if (!isLoading){
            hmenu.add(multiValuePanel)
            hmenu.filterItems.multiValueItems.push(multiValuePanel)
          }
        }
      }
  
      this.grid.store.on('load', function (store, records, opt) {
        buildValues(store.data.items, false)
        _this.setColumnFilteredStyle()
        _this.fireEvent('filterschanged', _this)

      })
      this.grid.store.on('update', function (store, record) {
        buildValues(store.snapshot ? store.snapshot.items : store.data.items, false)
      })
  
  
      // Hide menuitems not associated with the clicked column
      hmenu.on('beforeshow', function (menu) {
        const dataIndex = _this.cm.config[_this.hdCtxIndex].dataIndex
        let showSep = false
        for (const menuitem of menu.items.items) {
          if (menuitem.filter) {
            const isVisible = menuitem.filter.dataIndex === dataIndex
            if (isVisible) showSep = true
            menuitem.setVisible(isVisible)
          }
        }
        itemSeparator.setVisible(showSep)    
        itemLabel.setVisible(showSep)    
      })
  
      for (const col of this.cm.config) {
        switch (col.filter?.type) {
          case 'string': {
            if (col.renderer) {
              col.configRenderer = col.renderer
              col.renderer = SM.ColumnFilters.Renderers.highlighterShim
            }
            const stringItem = hmenu.add(new SM.ColumnFilters.StringPanel({
              hideOnClick: false,
              column: col,
              filter: { dataIndex: col.dataIndex, type: 'string'},
              listeners: {
                filterchanged: function (panel) {
                  _this.onFilterChange(panel, panel.getValue())
                },
                enterkey: function () {
                  hmenu.hide(true)
                }
              }
            }))
            hmenu.filterItems.stringItems.push(stringItem)
            break
          }
          case 'values':
            valuesColumns.push(col)
            break
          case 'multi-value':
            multiValueColumns.push(col)
        }
      }
      
      buildValues(this.grid.store.data.items, true)
      _this.setColumnFilteredStyle()

    }
  })
}

SM.ColumnFilters.GridView = SM.ColumnFilters.extend(Ext.grid.GridView, 'GridView')
SM.ColumnFilters.GridViewBuffered = SM.ColumnFilters.extend(Ext.ux.grid.BufferView, 'GridViewBuffered')
SM.ColumnFilters.GridViewLocking = SM.ColumnFilters.extend(Ext.ux.grid.LockingGridView, 'GridViewLocking')

SM.ColumnFilters.StringMatchTextField = Ext.extend(Ext.form.TextField, {
  initComponent: function () {
    const config = {
      autoCreate: {tag: 'input', type: 'search', size: '20', autocomplete: 'off', spellcheck: 'false'},
      enableKeyEvents: true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.addEvents( 'input' )
  },
  initEvents: function () {
    this.superclass().initEvents.call(this)
    this.mon(this.el, {
      scope: this,
      input: this.onInput
    })
  },
  onInput: function (e) {
    this.fireEvent('input', this, e);
  }
})

SM.ColumnFilters.StringMatchConditionComboBox = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const store = new Ext.data.ArrayStore({
      fields: ['display', 'value'],
      data: [['Includes', true], ['Excludes', false]]
    })
    const config = {
      listClass: 'x-menu',
      store,
      triggerAction: 'all',
      mode: 'local',
      editable: false,
      valueField: 'value',
      displayField: 'display'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
    this.setValue(true)
  }
})

SM.ColumnFilters.StringMatchCaseButton = Ext.extend(Ext.Button, {
  initComponent:  function () {
    const config = {
      enableToggle: true,
      border: false,
      iconCls: 'sm-match-case-icon',
      tooltip: 'Match case'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.StringMatchWordButton = Ext.extend(Ext.Button, {
  initComponent:  function () {
    const config = {
      enableToggle: true,
      border: false,
      iconCls: 'sm-match-word-icon',
      tooltip: 'Match word'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.StringPanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    const onFilterChange = function () {
      _this.column.filter.value = getValue()
      _this.fireEvent('filterchanged', _this)
    }

    const conditionComboBox = new SM.ColumnFilters.StringMatchConditionComboBox({
      flex: 1,
      listeners: {
        select: onFilterChange
      }
    })
    const matchCaseButton = new SM.ColumnFilters.StringMatchCaseButton({
      width: 24,
      listeners: {
        toggle: onFilterChange
      }
    })
    const matchWordButton = new SM.ColumnFilters.StringMatchWordButton({
      width: 24,
      listeners: {
        toggle: onFilterChange
      }
    })
    const textfield = new SM.ColumnFilters.StringMatchTextField({
      height: 24,
      listeners: {
        input: onFilterChange,
        keyup: function (item, e) {
          const k = e.getKey()
          if (k == e.RETURN) {
              e.stopEvent()
              _this.fireEvent('enterkey')
          }
        }
      }
    })

    function getValue () {
      return {
        value: textfield.getValue() ?? '',
        condition: conditionComboBox.getValue(),
        matchCase: matchCaseButton.pressed,
        matchWord: matchWordButton.pressed,
      }
    }
    const config = {
      getValue,
      items: [
        {
          layout: 'hbox',
          items: [
            conditionComboBox,
            matchCaseButton,
            matchWordButton
          ]
        },
        textfield
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.MultiValueMatchAnyButton = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      enableToggle: true,
      border: false,
      text: '|',
      tooltip: 'Match any selected labels',
      toggleGroup: 'valuesMatch'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.MultiValueMatchAllButton = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      enableToggle: true,
      border: false,
      text: '&',
      tooltip: 'Match all selected labels',
      toggleGroup: 'valuesMatch'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.MultiValueMatchExactButton = Ext.extend(Ext.Button, {
  initComponent: function () {
    const config = {
      enableToggle: true,
      border: false,
      text: '=',
      tooltip: 'Match exactly the selected labels',
      toggleGroup: 'valuesMatch'
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.MultiValueGridPanel = Ext.extend(Ext.grid.GridPanel, {
  initComponent: function () {
    const _this = this
    
    const collectionId = this.collectionId
    const renderer = this.renderer

    const store = new Ext.data.ArrayStore({
      fields: ['value'],
      data: []
    })
    const sm = new Ext.grid.CheckboxSelectionModel({
      singleSelect: false,
      checkOnly: false,
      grid: _this,
      listeners: {
        selectionchange: function (sm) {
          SM.SetCheckboxSelModelHeaderState(sm)
          _this.fireEvent('selectionchange', sm, sm.getSelections())
        }
      }
    })

    function getValue() {
      const selections = sm.getSelections()
      if (selections.length === 0) return []
      return selections.map( s => s.data.value )
    }

    function isAllSelected () {
      return store.getCount() === sm.getSelections().length
    }

    const view = new Ext.grid.GridView({
      hasRows : function() {
          let fc = this.mainBody?.dom.firstChild;
          return fc && fc.nodeType == 1 && fc.className != 'x-grid-empty';
      }
    })

    const config = {
      getValue,
      isAllSelected,
      store,
      sm,
      view,
      columns: [
        sm,
        {
          header: this.header ?? 'Label',
          dataIndex: 'value',
          renderer: function (v) {
            if (renderer) {
              return renderer(v, collectionId)
            }
          }
        }
      ],
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})          

SM.ColumnFilters.MultiValuePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this

    const onFilterChange = function () {
      _this.column.filter.value = getValue()
      _this.fireEvent('filterchanged', _this)
    }

    const conditionComboBox = new SM.ColumnFilters.StringMatchConditionComboBox({
      flex: 3,
      listeners: {
        select: onFilterChange
      }
    })
    // conditionComboBox.setValue(false) // default to Excludes
    const matchAllButton = new SM.ColumnFilters.MultiValueMatchAllButton({
      flex: 1,
      toggleGroup: 'valuesMatch',
      listeners: {
        click: onFilterChange
      }
    })
    const matchExactButton = new SM.ColumnFilters.MultiValueMatchExactButton({
      flex: 1,
      toggleGroup: 'valuesMatch',
      listeners: {
        click: onFilterChange
      }
    })
    const grid = new SM.ColumnFilters.MultiValueGridPanel({
      collectionId: this.collectionId,
      cls: 'sm-multi-value-grid',
      renderer: this.renderer,
      height: 250,
      listeners: {
        selectionchange: onFilterChange,
        viewready: function (grid) {
          const sm = grid.getSelectionModel()
          sm.silent = true
          sm.selectAll()
          sm.silent = false
          SM.SetCheckboxSelModelHeaderState(sm)
          // onFilterChange()
        }
      }
    })

    function getValue () {
      return {
        value: grid.getValue() ?? [],
        isAllSelected: grid.isAllSelected(),
        condition: conditionComboBox.getValue(),
        match: matchAllButton.pressed ? 'all' : matchExactButton.pressed ? 'exact' : 'any',
      }
    }

    function loadData (data) {
      grid.store.loadData(data)
      const sm = grid.getSelectionModel()
      sm.silent = true
      sm.selectAll()
      sm.silent = false
    }
    
    const config = {
      getValue,
      grid,
      loadData,
      items: [
        {
          layout: 'hbox',
          items: [
            conditionComboBox,
            matchAllButton,
            matchExactButton
          ]
        },
        grid
      ]
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.ColumnFilters.Scorers = {
  severity: {
    low: 2,
    medium: 1,
    high: 0
  }
}

SM.ColumnFilters.CompareFns = {
  severity: (a, b) => {
    return SM.ColumnFilters.Scorers.severity[a] - SM.ColumnFilters.Scorers.severity[b]
  },
  labelIds: (a, b, collectionId) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return SM.Cache.getCollectionLabel(collectionId, a).name.localeCompare(SM.Cache.getCollectionLabel(collectionId, b).name)
  }       
}

SM.ColumnFilters.Renderers = {
  result: function (v) {
    if (!v) return '<i>(No value)</i>'
    return `<div class="sm-grid-result-sprite ${SM.RenderResult[v]?.css}">${SM.RenderResult[v]?.textDisa}</div>`
  },
  engineResult: function (v) {
    if (!v) return '<i>(No value)</i>'
    switch (v) {
      case 'engine':
        return '<div class="sm-engine-result-icon sm-menuitem-div-icon">Engine result</div>'
      case 'override':
        return '<div class="sm-engine-override-icon sm-menuitem-div-icon">Engine override</div>'
      case 'manual':
        return '<div class="sm-engine-manual-icon sm-menuitem-div-icon">Manual result</div>'
      }
    
  },
  status: function (v) {
    switch (v) {
      case 'saved':
        return '<img src="img/save-icon.svg" width=12 height=12 class="sm-menuitem-status-icon">Saved'
      case 'submitted':
        return '<img src="img/ready-16.png" width=12 height=12 class="sm-menuitem-status-icon">Submitted'
      case 'rejected':
        return '<img src="img/rejected-16.png" width=12 height=12 class="sm-menuitem-status-icon">Rejected'
      case 'accepted':
        return '<img src="img/star.svg" width=12 height=12 class="sm-menuitem-status-icon">Accepted'
      default:
        return '<i>(No value)</i>'
    }
  },
  severity: function (v) {
    switch (v) {
      case 'high':
        return '<span class="sm-grid-sprite sm-severity-high">CAT 1</span>'
      case 'medium':
        return '<span class="sm-grid-sprite sm-severity-medium">CAT 2</span>'
      case 'low':
        return '<span class="sm-grid-sprite sm-severity-low">CAT 3</span>'
      case 'mixed':
        return '<span class="sm-grid-sprite sm-severity-low">Mixed</span>'
      default:
        return '<span class="sm-grid-sprite sm-severity-low">U</span>'
    }  
  },
  highlighterShim: function (v, m, r, ri, ci, s) {
    if (this.filter?.type === 'string' && this.filter.value?.value && this.filter.value.condition) {
      let searchStr = SM.he(this.filter.value.value)
      const flags = `g${this.filter.value.matchCase ? '' : 'i'}`
      if (this.filter.value.matchWord) {
        searchStr = `\\b${searchStr}\\b`
      }
      v = v.replace(new RegExp(searchStr, flags),'<span class="sm-text-highlight">$&</span>')
    }
    return this.configRenderer ? this.configRenderer(v, m, r, ri, ci, s) : v
  },
  labels: function (labelId, collectionId) {
    if (!labelId) return '<i>(No value)</i>'
    const labelObj = SM.Cache.getCollectionLabel(collectionId, labelId)
    return SM.Manage.Collection.LabelTpl.apply(labelObj)
  },
  groups: function (v) {
    if (!v) return '<i>(No value)</i>'
    return SM.User.GroupTpl.apply(v)
  }
}
