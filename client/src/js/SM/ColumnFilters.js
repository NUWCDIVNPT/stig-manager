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
  
      if (target.classList[0] !== 'x-grid3-hd-inner') {
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
        if (this.cm.config[i].filtered) {
          td.classList.add('sm-grid3-col-filtered')
        }
        else {
          td.classList.remove('sm-grid3-col-filtered')
        }  
      }
    },
    getFilterFns: function () {
      const hmenu = this.hmenu
      const stringItems = hmenu.filterItems.stringItems
      const selectItems = hmenu.filterItems.selectItems
      const conditions = {}
      const filterFns = []
  
      // // iterate the menu items and set the condition(s) for each dataIndex
      for (const stringItem of stringItems) {
        const value = stringItem.getValue()
        if (value.value) {
          conditions[stringItem.filter.dataIndex] = value
        }
      }
      for (const selectItem of selectItems) {
        if (!selectItem.checked) {
          const dataIndex = selectItem.filter.dataIndex
          conditions[dataIndex] = []
          for (const valueItem of selectItem.valueItems) {
            if (valueItem.checked === true) {
              conditions[dataIndex].push(valueItem.filter.value)
            }
          }
        }
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
      }
      this.fireEvent('filterschanged', this, item, value)
    },
    afterRenderUI: function () {
      const _this = this
      const dynamicColumns = []
  
      SM.ColumnFilters[this.extends].superclass.afterRenderUI.call(this)
  
      const hmenu = this.hmenu
      hmenu.filterItems = {
        stringItems: [],
        selectItems: []
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
  
      // (Re)build the dynamic value items
      function buildDynamicValues (records, isLoading) {
        // iterate the dynamic menu items, save their current values if not loading, and remove them
        const cVals = {}
        for (const selectAllItem of hmenu.filterItems.selectItems) {
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
        hmenu.filterItems.selectItems = []
        
        // iterate the dynamic columns and create menu items, restoring saved values if not loading
        for (const col of dynamicColumns) {
          if (isLoading) col.filtered = false
          const itemConfigs = []
          // get unique values for this column from the record set
          // const uniqueSet = new Set(records.flatMap( r => Array.isArray(r.data[col.dataIndex] ? ).flat())
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
          hmenu.filterItems.selectItems.push(selectAllItem)
        }
      }
  
      this.grid.store.on('load', function (store, records, opt) {
        buildDynamicValues(store.data.items, false)
        _this.setColumnFilteredStyle()
        _this.fireEvent('filterschanged', _this)

      })
      this.grid.store.on('update', function (store, record) {
        buildDynamicValues(store.snapshot ? store.snapshot.items : store.data.items, false)
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
            dynamicColumns.push(col)
            break
        }
      }
      
      buildDynamicValues(this.grid.store.data.items, true)
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
