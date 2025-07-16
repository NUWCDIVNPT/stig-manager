Ext.ns('SM.Findings')

SM.Findings.AggregatorCombo = Ext.extend(Ext.form.ComboBox, {
	initComponent: function () {
		let config = {
			width: 70,
			forceSelection: true,
			editable: false,
			mode: 'local',
			triggerAction: 'all',
			displayField: 'display',
			valueField: 'aggregator',
			store: new Ext.data.SimpleStore({
				fields: ['display', 'aggregator'],
				data: [['Group', 'groupId'], ['Rule', 'ruleId'], ['CCI', 'cci']]
			})
		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)
	}
})
Ext.reg('sm-aggregator-combo', SM.Findings.AggregatorCombo)

SM.Findings.ParentGrid = Ext.extend(Ext.grid.GridPanel, {
	initComponent: function () {
		let me = this
		this.aggValue = this.aggValue || 'groupId'
		this.stigAllValue = '--- All Collection STIGs ---'
		this.stigValue = this.stigValue || this.stigAllValue
		const store = new Ext.data.JsonStore({
			proxy: new Ext.data.HttpProxy({
				url: `${STIGMAN.Env.apiBase}/collections/${this.panel.collectionId}/findings`,
				method: 'GET'
			}),
			baseParams: {
				projection: 'stigs'
			},
			sortInfo: {
				field: 'assetCount',
				direction: 'DESC'
			},
			root: '',
			fields: [
				{ name: 'severity', type: 'string', sortType: sortSeverity },
				{ name: 'assetCount', type: 'int' },
				{ name: 'stigs' },
				{ name: 'groupId', type: 'string', sortType: sortGroupId },
				{ name: 'ruleId', type: 'string' },
				{ name: 'title', type: 'string' },
				{ name: 'cci', type: 'string' },
				{ name: 'definition', type: 'string' },
				{ name: 'apAcronym', type: 'string' },
				{ name: 'labels' },
			],
			listeners: {
				load: function (store, records) {
					setColumnStates(me.aggValue)
					me.statSprites?.setText(getStatSprites(store))
				},
				clear: function(){
					me.statSprites?.setText(getStatSprites(store))
				},
				update: function(store) {
					me.statSprites?.setText(getStatSprites(store))
				},
				datachanged: function(store) {
					me.statSprites?.setText(getStatSprites(store))
				}
			}
		})
		const totalTextCmp = new SM.RowCountTextItem({ store: store, noun: 'finding' })
		const renderSeverity = (val) => {
			switch (val) {
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
		}
		const colModel = new Ext.grid.ColumnModel([
			{
				header: "CAT",
				hidden: false,
				align: 'center',
				width: 60,
				dataIndex: 'severity',
				sortable: true,
				renderer: renderSeverity,
				filter: {
					type: 'values',
					comparer: SM.ColumnFilters.CompareFns.severity,
					renderer: SM.ColumnFilters.Renderers.severity
				}
			},
			{
				header: "Group",
				hidden: false,
				width: 80,
				dataIndex: 'groupId',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Rule",
				hidden: true,
				width: 80,
				dataIndex: 'ruleId',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Labels",
				hidden: true,
				width: 120,
				dataIndex: 'labels',
				renderer: function (v) {
					if (!v || v.length === 0) return ''
					return v.map(label => 
						`<span style="background-color: #${label.color}; color: white; padding: 2px 6px; border-radius: 3px; margin: 1px; display: inline-block; font-size: 10px;">${Ext.util.Format.htmlEncode(label.name)}</span>`
					).join(' ')
				},
				sortable: true,
				filter: { 
					type: 'values',
					comparer: function (v1, v2) {
						const labelNames1 = v1 && v1.length > 0 ? v1.map(l => l.name).sort() : []
						const labelNames2 = v2 && v2.length > 0 ? v2.map(l => l.name).sort() : []
						return JSON.stringify(labelNames1) === JSON.stringify(labelNames2)
					}
				}
			},
			{
				header: "CCI",
				hidden: true,
				width: 80,
				dataIndex: 'cci',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "AP Acronym",
				hidden: true,
				width: 80,
				dataIndex: 'apAcronym',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Title",
				hidden: false,
				width: 270,
				dataIndex: 'title',
				renderer: columnWrap,
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Definition",
				hidden: true,
				width: 135,
				dataIndex: 'definition',
				renderer: columnWrap,
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Assets",
				hidden: false,
				width: 75,
				align: 'center',
				dataIndex: 'assetCount',
				sortable: true
			},
			{
				header: "STIGs",
				hidden: false,
				width: 120,
				dataIndex: 'stigs',
				renderer: function (v) {
					v = v.map(i=>i.benchmarkId).join('\n')
					return columnWrap.apply(this, arguments)
				},
				sortable: true,
			}
		])
		const view = new SM.ColumnFilters.GridView({
			forceFit: true,
			emptyText: 'No records found.',
			listeners: {
				filterschanged: function (view) {
					store.filter(view.getFilterFns())
				}
			},
		})
		const sm = new Ext.grid.RowSelectionModel({
			singleSelect: true,
			listeners: {
				rowselect: (sm, index, record) => {
					me.panel.fireEvent('parentrowselect', sm, index, record)
				}
			}
		})
		const tbar = new Ext.Toolbar({
			items: [
				{
					xtype: 'tbtext',
					text: 'Aggregator:'
				},
				' ', ' ', ' ',
				{
					xtype: 'sm-aggregator-combo',
					value: this.aggValue,
					listeners: {
						select: function (f, r, i) {
							me.aggValue = f.getValue()
							me.fireEvent('aggregatorchanged', me.aggValue)
						}
					}
				},
				' ', ' ', ' ',
				{
					xtype: 'tbtext',
					text: 'STIG:  '
				},
				' ', ' ', ' ',
				new SM.Manage.Stig.SelectionComboBox({
					url: `${STIGMAN.Env.apiBase}/collections/${this.panel.collectionId}/stigs`,
					autoLoad: true,
					includeAllItem: this.stigAllValue,
					width: 250,
					triggerAction: 'all',
					allowBlank: true,
					editable: false,
					forceSelection: true,
					value: this.stigValue,
					listeners: {
						select: function (f, r, i) {
							me.stigValue = f.getValue()
							me.fireEvent('stigchanged', me.stigValue)
						}
					}
				})
			]
		})
		const generatePoamBtn = new Ext.Button({
			parentGrid: me,
			iconCls: 'icon-excel',
			text: 'Generate POA&M...',
			handler: this.genPoamBtnHandler
		})
		function getStatSprites (store) {
			const stats = store.data.items.reduce((accumulator, currentValue) => {
				for (const prop in accumulator) {
					accumulator[prop] += currentValue.data[prop]
				}
				return accumulator
			}, {
				assetCount: 0
			})
			const spriteGroups = []
			spriteGroups.push(`${stats.assetCount ? `<span class="sm-review-sprite sm-review-sprite-stat-result" ext:qtip="Total number of finding occurences"><span style="color:grey;font-weight:bolder;">Occurences </span>${stats.assetCount}</span>` : ''}`)

			return spriteGroups.join('<span class="sm-xtb-sep"></span>')
		}

		const bbar = [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function (btn) {
					store.reload()
				}
			},
			'-',
			{
				xtype: 'exportbutton',
				hasMenu: false,
				gridBasename: 'Findings',
				gridSource: me,
				iconCls: 'sm-export-icon',
				text: 'CSV'
			},
			'-',
			generatePoamBtn,
			'->',
			{
				xtype: 'tbtext',
				ref: '../statSprites'
			},
			'-',
			totalTextCmp
		]
		
		const setColumnStates = (aggregator) => {
			const colIndex = {}
			for (const [i, v] of colModel.config.entries()) {
				colIndex[v.dataIndex] = i
			}
			// colModel.suspendEvents(false)
			switch (aggregator) {
				case 'ruleId':
					colModel.setHidden(colIndex.severity, false)
					colModel.setHidden(colIndex.groupId, true)
					colModel.setHidden(colIndex.ruleId, false)
					colModel.setHidden(colIndex.labels, false)
					colModel.setHidden(colIndex.cci, true)
					colModel.setHidden(colIndex.apAcronym, true)
					colModel.setHidden(colIndex.title, false)
					colModel.setHidden(colIndex.definition, true)
					break
				case 'groupId':
					colModel.setHidden(colIndex.severity, false)
					colModel.setHidden(colIndex.groupId, false)
					colModel.setHidden(colIndex.ruleId, true)
					colModel.setHidden(colIndex.labels, true)
					colModel.setHidden(colIndex.cci, true)
					colModel.setHidden(colIndex.apAcronym, true)
					colModel.setHidden(colIndex.title, false)
					colModel.setHidden(colIndex.definition, true)
					break
				case 'cci':
					colModel.setHidden(colIndex.severity, true)
					colModel.setHidden(colIndex.groupId, true)
					colModel.setHidden(colIndex.ruleId, true)
					colModel.setHidden(colIndex.labels, true)
					colModel.setHidden(colIndex.cci, false)
					colModel.setHidden(colIndex.apAcronym, false)
					colModel.setHidden(colIndex.title, true)
					colModel.setHidden(colIndex.definition, false)
					break
			}
			// colModel.resumeEvents()
			// view.layout(true)
		}
		const onAggregatorChanged = (aggregator) => {
			const params = {
				aggregator: aggregator
			}
			if (me.stigValue != me.stigAllValue) {
				params.benchmarkId = me.stigValue
			}
			store.load({
				params: params
			})
			generatePoamBtn.setDisabled(aggregator === 'cci')
		}
		const onStigChanged = (benchmarkId) => {
			const params = {
				aggregator: me.aggValue
			}
			if (benchmarkId != me.stigAllValue) {
				params.benchmarkId = benchmarkId
			}
			store.load({
				params: params
			})
		}

		const config = {
			loadMask: {msg: ''},
			stripeRows: true,
			store,
			colModel,
			view,
			sm,
			tbar,
			bbar,
			listeners: {
				aggregatorchanged: onAggregatorChanged,
				stigchanged: onStigChanged
			},

		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)
	}
})

SM.Findings.ChildGrid = Ext.extend(Ext.grid.GridPanel, {
	initComponent: function () {
		const me = this
		function engineResultConverter (v,r) {
			return r.resultEngine ? 
				(r.resultEngine.overrides?.length ? 'override' : 'engine') : 
				(r.result ? 'manual' : '')
		}
		const store = new Ext.data.JsonStore({
			proxy: new Ext.data.HttpProxy({
				url: `${STIGMAN.Env.apiBase}/collections/${this.panel.collectionId}/reviews`,
				method: 'GET'
			}),
			baseParams: {
				result: 'fail',
				projection: 'stigs'
			},
			sortInfo: {
				field: 'assetName',
				direction: 'ASC'
			},
			root: '',
			storeId: Ext.id(),
			fields: [
				{ name: 'assetId', type: 'string' },
				{ name: 'assetName', type: 'string' },
				{ name: 'assetLabelIds' },
				{ name: 'stigs' },
				{ name: 'ruleId', type: 'string' },
				{ name: 'severity', type: 'string' },
				{ name: 'result', type: 'string' },
				{ name: 'detail', type: 'string' },
				{ name: 'comment', type: 'string' },
				'resultEngine',
				{
					name: 'engineResult',
					convert: engineResultConverter
				},
				{
					name: 'status',
					type: 'string',
					mapping: 'status.label'
				},
				{ name: 'userId', type: 'string' },
				{ name: 'username', type: 'string' },
				{ name: 'ts', type: 'string' },
				{ name: 'reviewComplete', type: 'boolean' }
			],
			listeners: {
				datachanged: function(store) {
					me.statSprites?.setText(getStatSprites(store))
				}
			}
		})
		function getStatSprites (store) {
			const stats = store.data.items.reduce((accumulator, currentValue) => {
				if (currentValue.data.engineResult) accumulator[currentValue.data.engineResult]++
				if (currentValue.data.status) accumulator[currentValue.data.status]++
				return accumulator
			},{
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
			}

		const totalTextCmp = new SM.RowCountTextItem({ store: store, noun: 'occurrence' })
		const expander = new Ext.ux.grid.RowExpander2({
			lazyRender: true,
			tpl: new Ext.XTemplate(
				'<b>Reviewer:</b> {[values.data.username]}</p>',
				'<tpl if="data.detail">',
				'<p><b>Detail:</b> {[SM.TruncateRecordProperty(values, "detail")]}</p>',
				'</tpl>',
				'<tpl if="data.comment">',
				'<p><b>Comment:</b> {[SM.TruncateRecordProperty(values, "comment")]}</p>',
				'</tpl>'
				)
		})
		const columns = [
			expander,
			{
				header: "Asset",
				width: 80,
				dataIndex: 'assetName',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Labels",
				width: 120,
				dataIndex: 'assetLabelIds',
				sortable: false,
				filter: {
					type: 'values',
					collectionId: me.panel.collectionId,
					comparer: function (a, b) {
						return SM.ColumnFilters.CompareFns.labelIds(a, b, me.panel.collectionId)
						},      					
					renderer: SM.ColumnFilters.Renderers.labels
				},
				renderer: function (value, metadata) {
					const labels = []
					for (const labelId of value) {
						const label = SM.Cache.getCollectionLabel(me.panel.collectionId, labelId)
						if (label) labels.push(label)
					}
					labels.sort((a, b) => a.name.localeCompare(b.name))
					metadata.attr = 'style="white-space:normal;"'
					return SM.Manage.Collection.LabelArrayTpl.apply(labels)
				}
			},
			{
				header: "Rule",
				width: 80,
				dataIndex: 'ruleId',
				sortable: true,
				filter: { type: 'string' }
			},
			{
				header: "Last changed",
				width: 80,
				dataIndex: 'ts',
				sortable: true,
			},
			{
				header: "STIGs",
				width: 130,
				dataIndex: 'stigs',
				renderer: function (v) {
					v = v.map(i=>i.benchmarkId).join('\n')
					return columnWrap.apply(this, arguments)
				},
				sortable: true,
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
		]
		const view = new SM.ColumnFilters.GridView({
			forceFit: true,
			emptyText: 'Select a finding from the grid to the left.',
			deferEmptyText: false,
			listeners: {
				filterschanged: function (view, item, value) {
					store.filter(view.getFilterFns())
				}
			}
		})
		const sm = new Ext.grid.RowSelectionModel({
			singleSelect: true
		})
		const bbar = [
			{
				xtype: 'tbbutton',
				iconCls: 'icon-refresh',
				tooltip: 'Reload this grid',
				width: 20,
				handler: function (btn) {
					store.reload()
				}
			},
			'-',
			{
				xtype: 'exportbutton',
				hasMenu: false,
				gridBasename: 'Finding Details',
				gridSource: me,
				iconCls: 'sm-export-icon',
				text: 'CSV'
			},
			'->',
			{
				xtype: 'tbtext',
				ref: '../statSprites'
			},
			'-',
			totalTextCmp
		]


		const config = {
			loadMask: {msg: ''},
			stripeRows: true,
			plugins: expander,
			store,
			columns,
			view,
			sm,
			bbar
		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)
	}
})

SM.Findings.PoamStatusComboBox = Ext.extend(Ext.form.ComboBox, {
	initComponent: function () {
		let config = {
			displayField: 'display',
			valueField: 'value',
			triggerAction: 'all',
			mode: 'local',
			editable: false
		}
		let me = this
		let data = [
			['Ongoing', 'Ongoing'],
			['Completed', 'Completed']
		]
		this.store = new Ext.data.SimpleStore({
			fields: ['value', 'display']
		})
		this.store.on('load', function (store) {
			me.setValue(store.getAt(0).get('value'))
		})

		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)

		this.store.loadData(data)
	}
})

SM.Findings.PoamFormatComboBox = Ext.extend(Ext.form.ComboBox, {
	initComponent: function () {
		let config = {
			displayField: 'display',
			valueField: 'value',
			triggerAction: 'all',
			mode: 'local',
			editable: false
		}
		let me = this
		let data = [
			['EMASS', 'EMASS'],
			['MCCAST', 'MCCAST']
		]
		this.store = new Ext.data.SimpleStore({
			fields: ['value', 'display']
		})
		this.store.on('load', function (store) {
			me.setValue(store.getAt(0).get('value'))
		})

		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)

		this.store.loadData(data)
	}
})

SM.Findings.PoamOptionsPanel = Ext.extend(Ext.FormPanel, {
	initComponent: function () {
		const me = this
		// Set default date 30 days from now
		const defaultDate = new Date()
		defaultDate.setDate(defaultDate.getDate() + 30)

		const dateField = new Ext.form.DateField({
			name: 'date',
			anchor: '100%',
			hideLabel: true,
			value: defaultDate
		})

		const statusCombo = new SM.Findings.PoamStatusComboBox({
			anchor: '100%',
			hideLabel: true,
			name: 'status',
			ref: 'statusCombo'
		})

		const setFormatDisplay = function (format) {
			// Toggle visibility of FieldSets based on selection
			const generatePoamWindow = me.ownerCt
			formatCombo.setValue(format)

			if (format === 'MCCAST') {
				generatePoamWindow.setHeight(460)
				statusCombo.store.loadData([
					['Started','Started'],
					['Not Started','Not Started'],
					['Request Risk Acceptance','Request Risk Acceptance']
				])
				officeFieldSet.setVisible(false)
				mccastPackageIdFieldSet.setVisible(true)
				mccastAuthNameFieldSet.setVisible(true)
		}
		//EMASS or OTHER MODE
		else {
				generatePoamWindow.setHeight(390)
				statusCombo.store.loadData([
					['Ongoing','Ongoing'],
					['Completed','Completed']
				])
				officeFieldSet.setVisible(true)
				mccastPackageIdFieldSet.setVisible(false)
				mccastAuthNameFieldSet.setVisible(false)
			}
		}

		const formatCombo = new SM.Findings.PoamFormatComboBox(					{
			anchor: '100%',
			hideLabel: true,
			name: 'format',
			value: 'EMASS',
			listeners: {
				select:  (combo, record) => {
					setFormatDisplay(record.data.value)
				}
			}
		})

		const officeFieldSet = new Ext.form.FieldSet({
			title: 'Office/Org',
			items: [{
				xtype: 'textfield',
				anchor: '100%',
				hideLabel: true,
				name: 'office',
				value: 'My Office Info'
			}]
		})

		const mccastPackageIdFieldSet = new Ext.form.FieldSet({
			title: 'Package ID',
			hidden:true,
			items: [{
				name: 'mccastPackageId',
				xtype: 'textfield',
				anchor: '100%',
				hideLabel: true,
				value: 'Package ID',
			}]
		})

		const mccastAuthNameFieldSet = new Ext.form.FieldSet({
			title: 'Authorization Package Name',
			hidden:true,
			items: [{
					name: 'mccastAuthName',
					xtype: 'textfield',
					anchor: '100%',
					hideLabel: true,
					value: 'Authorization Package Name'
			}]
		})

		const items = [
			{
				xtype: 'fieldset',
				title: 'Format',
				items: [formatCombo]
			},
			{
				xtype: 'fieldset',
				title: 'Scheduled Completion Date',
				items: [dateField]
			},
			officeFieldSet,
			{
				xtype: 'fieldset',
				title: 'Status',
				items: [statusCombo]
			},
			mccastPackageIdFieldSet,
			mccastAuthNameFieldSet
		]

		const config = {
			baseCls: 'x-plain',
			labelWidth: 70,
			monitorValid: true,
			trackResetOnLoad: true,
			items,
			buttons: [{
				anchor:'100%',
				text: this.btnText || 'Generate',
				iconCls: 'icon-excel',
				height: 30,
				width: 120,
				parentPanel: me,
				formBind: true,
				handler: this.btnHandler || function () { }
			}],
			setFormatDisplay
		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)
	}
})

SM.Findings.RequestAndServePoam = async function (collectionId, params) {
	let mb
	try {
		mb = Ext.MessageBox.wait('Generating POA&M')
		Object.keys(params).forEach((k) => params[k] == "" && delete params[k])
		if (params.format === "EMASS") {
			delete params.mccastPackageId
			delete params.mccastAuthName
		}
		if (params.format === "MCCAST") {
			delete params.office
		}
		const search = new URLSearchParams(params).toString()
		let url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/poam?${search}`

		
		let response = await fetch(
			url,
			{
				method: 'GET',
				headers: new Headers({
					'Authorization': `Bearer ${window.oidcWorker.token}`
				})
			}
		)
		const contentDispo = response.headers.get("content-disposition")
		//https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
		const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
		const blob = await response.blob()
		mb.hide()
		downloadBlob(blob, filename)

		function downloadBlob(blob, filename) {
			let a = document.createElement('a')
			a.style.display = "none"
			let url = window.URL.createObjectURL(blob)
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		}
	}
	catch (e) {
		mb.hide()
		SM.Error.handleError(e)
	}
}

SM.Findings.FindingsPanel = Ext.extend(Ext.Panel, {
	initComponent: function () {
		const me = this
		const parent = new SM.Findings.ParentGrid({
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
			border: false,
			region: 'center',
			panel: this,
			aggValue: me.aggregator || 'groupId',
			title: 'Aggregated Findings',
			genPoamBtnHandler
		})
		const child = new SM.Findings.ChildGrid({
			cls: 'sm-round-panel',
			margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
			border: false,
			region: 'east',
			width: '60%',
			split: true,
			panel: this,
			title: 'Individual Findings',
			listeners: {
				rowdblclick: onChildRowDblClick
			}
		})
		parent.child = child
		child.parent = parent
		this.parent = parent
		this.child = child

		const onParentRowSelect = (sm, index, record) => {
			const params = {}
			params[parent.aggValue] = record.data[parent.aggValue]
			if (parent.stigValue !== parent.stigAllValue) {
				params.benchmarkId = parent.stigValue
			}
			child.store.load({
				params: params
			})
		}
		function onChildRowDblClick (grid, rowIndex) {
			const r = grid.getStore().getAt(rowIndex)
			const leaf = {
				collectionId: grid.panel.collectionId, 
				assetId: r.data.assetId,
				assetName: r.data.assetName,
				assetLabelIds: r.data.assetLabelIds,
				benchmarkId: r.data.stigs[0]?.benchmarkId,
				revisionStr: r.data.stigs[0]?.revisionStr,
				stigName: r.data.stigs[0]?.benchmarkId,
			}
			addReview({
				leaf,
				selectedRule: r.data.ruleId
			})
		}

		function genPoamBtnHandler() {
			const poamOptionsPanel = new SM.Findings.PoamOptionsPanel({
				btnText: 'Generate POA&M',
				padding: 10,
				btnHandler: function () {
					const params = poamOptionsPanel.getForm().getFieldValues()
					if (params.date && params.date instanceof Date) {
						params.date = Ext.util.Format.date(params.date, 'm/d/Y')
					}
					params.aggregator = parent.aggValue
					if (parent.stigValue && parent.stigValue !== parent.stigAllValue) {
						params.benchmarkId = parent.stigValue
					}
					appwindow.close()
					localStorage.setItem('poam-format', params.format ?? 'EMASS')
					SM.Findings.RequestAndServePoam(parent.panel.collectionId, params)
				}
			})

			const appwindow = new Ext.Window({
				title: 'POA&M Defaults',
				cls: 'sm-dialog-window sm-round-panel',
				modal: true,
				hidden: true,
				width: 230,
				height: 390,
				layout: 'fit',
				plain: true,
				bodyStyle: 'padding:5px;',
				buttonAlign: 'right',
				items: poamOptionsPanel
			})
			appwindow.show(document.body)
			poamOptionsPanel.setFormatDisplay(localStorage.getItem('poam-format') ?? 'EMASS')
		}

		const config = {
			layout: 'border',
			border: false,
			items: [
				parent,
				child
			],
			listeners: {
				parentrowselect: onParentRowSelect
			}
		}

		Ext.apply(this, Ext.apply(this.initialConfig, config))
		this.superclass().initComponent.call(this)

	}
})


