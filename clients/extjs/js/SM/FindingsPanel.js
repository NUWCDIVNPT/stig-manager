Ext.ns('SM')

SM.AggregatorCombo = Ext.extend(Ext.form.ComboBox, {
    initComponent: function () {
        let me = this
        let config = {
            width: 70,
            forceSelection: true,
            editable: false,
            mode: 'local',
            triggerAction: 'all',
            displayField:'display',
            valueField: 'aggregator',
            store: new Ext.data.SimpleStore({
                fields: ['display', 'aggregator'],
                data : [['Group', 'groupId'],['Rule', 'ruleId'],['CCI', 'cci']]
            })
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.AggregatorCombo.superclass.initComponent.call(this)
    }
})
Ext.reg('sm-aggregator-combo', SM.AggregatorCombo)

SM.FindingsParentGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        let me = this
        this.aggValue = this.aggValue || 'groupId'
        this.stigAllValue = '--- All Collection STIGs ---'
        this.stigValue = this.stigValue || this.stigAllValue
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
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
			],
			listeners: {
				load: function (store, records) {
					setColumnStates(me.aggValue)
					totalTextCmp.setText(records.length + ' records');
				}
			}
        })
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
				renderer: renderSeverity
			},
			{ 
				header: "Group", 
				hidden: false,
				width: 80, 
				dataIndex: 'groupId', 
				sortable: true, 
			},
			{ 
				header: "Rule", 
				hidden: true,
				width: 80, 
				dataIndex: 'ruleId', 
				sortable: true, 
			},
			{ 
				header: "CCI", 
				hidden: true,
				width: 80, 
				dataIndex: 'cci', 
				sortable: true, 
			},
			{ 
				header: "AP Acronym", 
				hidden: true,
				width: 80, 
				dataIndex: 'apAcronym', 
				sortable: true, 
			},
			{ 
				header: "Title", 
				hidden: false,
				width: 270, 
				dataIndex: 'title', 
				renderer: columnWrap, 
				sortable: true, 
			},
			{ 
				header: "Definition", 
				hidden: true,
				width: 135, 
				dataIndex: 'definition', 
				renderer: columnWrap, 
				sortable: true, 
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
				renderer: v => {
					return columnWrap(v.join('\n'))
				}, 
				sortable: true, 
			}
        ])
        const view = new Ext.grid.GridView({
			forceFit: true,
			emptyText: 'No records found.',
			// getRowClass: function (record, rowIndex, rp, ds) { // rp = rowParams
			// 	if (record.data.severity == 'high') {
			// 		return 'sm-grid3-row-red';
			// 	} else if (record.data.severity == 'medium') {
			// 		return 'sm-grid3-row-orange';
			// 	} else {
			// 		return 'sm-grid3-row-green';
			// 	}
			// }
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
                ' ',' ',' ',
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
                ' ',' ',' ',
				{
					xtype: 'tbtext',
					text: 'STIG:  '
				},
                ' ',' ',' ',
				{
					xtype: 'sm-stig-selection-field',
					url: `${STIGMAN.Env.apiBase}/collections/${this.panel.collectionId}?projection=stigs`,
					autoLoad: true,
					includeAllItem: this.stigAllValue,
					root: 'stigs',
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
				}
			]
		})
		const generatePoamBtn = new SM.GeneratePoamButton({
			parentGrid: me,
			iconCls: 'icon-excel',
			text: 'Generate POA&M...'
		})
        const bbar = new Ext.Toolbar({
			items: [
				{
					xtype: 'tbbutton',
					iconCls: 'icon-refresh',
					tooltip: 'Reload this grid',
					width: 20,
					handler: function (btn) {
						store.reload();
					}
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'exportbutton',
					hasMenu: false,
					gridBasename: 'Findings',
					gridSource: me,
					iconCls: 'sm-export-icon',
					text: 'Export'
				},
				{
					xtype: 'tbseparator'
				},
				generatePoamBtn,
				{
					xtype: 'tbfill'
				},
				{
					xtype: 'tbseparator'
				},
				totalTextCmp
			]
		})
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
					colModel.setHidden(colIndex.cci, true)
					colModel.setHidden(colIndex.apAcronym, true)
					colModel.setHidden(colIndex.title, false)
					colModel.setHidden(colIndex.definition, true)
					break
				case 'groupId':
					colModel.setHidden(colIndex.severity, false)
					colModel.setHidden(colIndex.groupId, false)
					colModel.setHidden(colIndex.ruleId, true)
					colModel.setHidden(colIndex.cci, true)
					colModel.setHidden(colIndex.apAcronym, true)
					colModel.setHidden(colIndex.title, false)
					colModel.setHidden(colIndex.definition, true)
					break
				case 'cci':
					colModel.setHidden(colIndex.severity, true)
					colModel.setHidden(colIndex.groupId, true)
					colModel.setHidden(colIndex.ruleId, true)
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
			loadMask: true,
			stripeRows: true,
            store: store,
            colModel: colModel,
            view: view,
            sm: sm,
            tbar: tbar,
            bbar: bbar,
            listeners: {
                aggregatorchanged: onAggregatorChanged,
                stigchanged: onStigChanged
            },

        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.FindingsParentGrid.superclass.initComponent.call(this)
    }
})

SM.FindingsChildGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        const me = this
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
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
			fields: [
				{ name: 'assetId', type: 'string' },
				{ name: 'assetName', type: 'string' },
				{ name: 'stigs' },
				{ name: 'ruleId', type: 'string' },
				{ name: 'severity', type: 'string' },
				{ name: 'result', type: 'string' },
				{ name: 'resultComment', type: 'string' },
				{ name: 'action', type: 'string' },
				{ name: 'actionComment', type: 'string' },
				{ name: 'autoResult', type: 'boolean' },
				{ name: 'status', type: 'string' },
				{ name: 'userId', type: 'string' },
				{ name: 'username', type: 'string' },
				{ name: 'ts', type: 'string' },
				{ name: 'reviewComplete', type: 'boolean' }
			],
			listeners: {
				load: function (store, records) {
					totalTextCmp.setText(records.length + ' records');
				}
			}
        })
		const expander = new Ext.ux.grid.RowExpander({
			tpl: new Ext.XTemplate(
			  '<b>Reviewer:</b> {username}</p>',
			  '<p><b>Result Comment:</b> {resultComment}</p>',
			  '<tpl if="action">',
			  '<p><b>Action:</b> {action}</p>',
			  '</tpl>',
			  '<tpl if="actionComment">',
			  '<p><b>Action Comment:</b> {actionComment}</p>',
			  '</tpl>'
			)
		  })
        const columns = [
			expander,
			{ 
				header: "Asset", 
				width: 80, 
				dataIndex: 'assetName', 
				sortable: true
			 },
			 { 
				header: "Rule", 
				width: 80, 
				dataIndex: 'ruleId', 
				sortable: true, 
			},
			// { 
			// 	header: "Severity", 
			// 	width: 40, 
			// 	dataIndex: 'severity', 
			// 	sortable: true,
			// 	hidden: true
			// },
            { 
				header: "Action", 
				width: 60, 
				dataIndex: 'action', 
				sortable: true, 
			},
			// { 
			// 	header: "Status", 
			// 	width: 50, 
			// 	dataIndex: 'status', 
			// 	sortable: true,
			// 	hidden: true
			// },
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
				renderer: v => {
					return columnWrap(v.join('\n'))
				}, 
				sortable: true, 
			}
        ]
        const view = new Ext.grid.GridView({
			forceFit: true,
			emptyText: 'Select a finding to the left.'

        })
        const sm = new Ext.grid.RowSelectionModel({
			singleSelect: true
        })
        const bbar = new Ext.Toolbar({
			items: [
				{
					xtype: 'tbbutton',
					iconCls: 'icon-refresh',
					tooltip: 'Reload this grid',
					width: 20,
					handler: function (btn) {
						store.reload();
					}
				},
				{
					xtype: 'tbseparator'
				},
				{
					xtype: 'exportbutton',
					hasMenu: false,
					gridBasename: 'Finding Details',
					gridSource: me,
					iconCls: 'sm-export-icon',
					text: 'Export'
				},
				{
					xtype: 'tbfill'
				},
				{
					xtype: 'tbseparator'
				},
				totalTextCmp
			]
		})
		
        const config = {
            loadMask: true,
			stripeRows: true,
			plugins: expander,
			store: store,
            columns: columns,
            view: view,
            sm: sm,
            bbar: bbar
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.FindingsChildGrid.superclass.initComponent.call(this)
    }
})

SM.PoamStatusComboBox = Ext.extend(Ext.form.ComboBox, {
    initComponent: function() {
        let config = {
            displayField: 'display',
            valueField: 'value',
            triggerAction: 'all',
            mode: 'local',
            editable: false      
        }
        let me = this
        let data = [
            ['Ongoing','Ongoing'],
            ['Completed', 'Completed']
        ]
        this.store = new Ext.data.SimpleStore({
            fields: ['value','display']
        })
        this.store.on('load',function(store){
            me.setValue(store.getAt(0).get('value'))
        })

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PoamStatusComboBox.superclass.initComponent.call(this)

        this.store.loadData(data)
    }
})
Ext.reg('sm-poam-status-combo', SM.PoamStatusComboBox);


SM.PoamOptionsPanel = Ext.extend(Ext.FormPanel, {
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
		const items = [
			{
				xtype: 'fieldset',
				title: 'Scheduled Completion Date',
				items: [dateField]
			},
			{
				xtype: 'fieldset',
				title: 'Office/Org',
				items: [{
					xtype: 'textfield',
					anchor: '100%',
					hideLabel: true,
					name: 'office',
					value: 'My office info'
				}]
			},
			{
				xtype: 'fieldset',
				title: 'Status',
				items: [{
					xtype: 'sm-poam-status-combo',
					anchor: '100%',
					hideLabel: true,
					name: 'status',
					value: 'Ongoing'
				}]
			}
			
		]
		const config = {
            baseCls: 'x-plain',
            labelWidth: 70,
            monitorValid: true,
			trackResetOnLoad: true,
			items: items,
            buttons: [{
				text: this.btnText || 'Generate',
				iconCls: 'icon-excel',
				height: 30,
				width: 120,
				parentPanel: me,
                formBind: true,
                handler: this.btnHandler || function () {}
            }]
		}
		Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.PoamOptionsPanel.superclass.initComponent.call(this)
	}
})

SM.RequestAndServePoam = async function ( collectionId, params ) {
	let mb
	try {
		mb = Ext.MessageBox.wait('Generating POA&M')
		const search = new URLSearchParams(params).toString()
		let url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/poam?${search}`
	
		await window.keycloak.updateToken(10)
		let response = await fetch(
			url,
			{
				method: 'GET',
				headers: new Headers({
					  'Authorization': `Bearer ${window.keycloak.token}`
				})
			}
		)
		const contentDispo = response.headers.get("content-disposition")
		//https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header/39800436
		const filename = contentDispo.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)[1]
		const blob = await response.blob()
		mb.hide()
		downloadBlob (blob, filename)
	
		function downloadBlob (blob, filename) {
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
	}
	catch (e) {
		mb.hide()
		alert (e.message)
	}
}

SM.GeneratePoamButton = Ext.extend(Ext.Button, {
	initComponent: function () {
		const me = this
		const onClick = function (btn, e) {
			const poamOptionsPanel = new SM.PoamOptionsPanel({
				btnText: 'Generate POA&M',
				padding: 10,
				btnHandler: (btn, e) => {
					const params = poamOptionsPanel.getForm().getFieldValues()
					if (params.date && params.date instanceof Date) {
						params.date = Ext.util.Format.date(params.date,'m/d/Y')
					}
					params.aggregator = me.parentGrid.aggValue
					if (me.parentGrid.stigValue && me.parentGrid.stigValue !== me.parentGrid.stigAllValue) {
						params.benchmarkId = me.parentGrid.stigValue
					}
					appwindow.close()
					SM.RequestAndServePoam( me.parentGrid.panel.collectionId, params )
				}
			})
			/******************************************************/
			// Form window
			/******************************************************/
			const appwindow = new Ext.Window({
				title: 'POA&M Defaults',
				modal: true,
				hidden: true,
				width: 230,
				height:310,
				layout: 'fit',
				plain:true,
				bodyStyle:'padding:5px;',
				buttonAlign:'right',
				items: poamOptionsPanel
			})
			appwindow.show(document.body);
		}

		const config = {
			listeners: {
				click: onClick
			}
		}

		Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.GeneratePoamButton.superclass.initComponent.call(this)
	}
})
Ext.reg('sm-generate-poam-button', SM.GeneratePoamButton);

// config: {collectionId}
SM.FindingsPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
		const me = this
        const parent = new SM.FindingsParentGrid({
            cls: 'sm-round-panel',
            margins: { top: SM.Margin.top, right: SM.Margin.adjacent, bottom: SM.Margin.bottom, left: SM.Margin.edge },
            border: false,                 
            region: 'center',
			panel: this,
			aggValue: me.aggregator || 'groupId',
            title: 'Aggregated Findings'
        })
        const child = new SM.FindingsChildGrid({
            cls: 'sm-round-panel',
            margins: { top: SM.Margin.top, right: SM.Margin.edge, bottom: SM.Margin.bottom, left: SM.Margin.adjacent },
            border: false,                 
            region: 'east',
            width: '50%',
            split: true,
            panel: this,
            title: 'Individual Findings'
        })
        parent.child = child
        child.parent = parent
        this.parent = parent
        this.child = child

        onParentRowSelect = (sm, index, record) => {
            const params = {}
            params[parent.aggValue] = record.data[parent.aggValue]
            if (parent.stigValue !== parent.stigAllValue) {
                params.benchmarkId = parent.stigValue
            }
            child.store.load({
                params: params
            })
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
        SM.FindingsPanel.superclass.initComponent.call(this)

        // parent.store.load({
        //     params: {
        //         aggregator: parent.aggValue
        //     }
        // })

    }
})


