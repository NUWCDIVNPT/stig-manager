Ext.ns('SM.ReviewsImport')

SM.ReviewsImport.Grid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        const me = this
        const fields = [
            { 
                name: 'filename',
                mapping: 'file.name'
            },
            {
                name: 'fullPath',
                mapping: 'file.fullPath'
            },
            { 
                name: 'date',
                mapping: 'file.lastModifiedDate'
            },
            'file', 
            'assetId', 
            'assetName', 
            'ip', 
            'noncomputing', 
            'metadata', 
            'benchmarkId', 
            'stigAttached', 
            'notchecked', 
            'pass', 
            'fail', 
            'notapplicable',
            'reviews',
            'apiAsset'
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.GroupingStore({
            grid: this,
            root: '',
            reader: new Ext.data.JsonReader({
                fields: fields,
                idProperty: (v) => `${v.filename}-${v.assetName}-${v.benchmarkId}`
            }),
            sortInfo: {
                field: 'assetName',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store,records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store,record,index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const columns = [
            { 	
				header: "Asset",
				width: 100,
                dataIndex: 'assetName',
                sortable: true,
                renderer: (v, m, r) => {
                    if (r.data.assetId) {
                        return v
                    }
                    else {
                        return `${v} (+)`
                    }
                }
            },
            { 	
				header: "IP",
				width: 100,
                dataIndex: 'ip',
                sortable: true,
                renderer: SM.styledEmptyRenderer
            },
            { 
                xtype: 'booleancolumn',
                trueText: '&#x2714;',
				falseText: '',
				header: "Non-computing",
				width: 75,
                dataIndex: 'noncomputing',
				align: "center",
                sortable: true,
                hidden: true
            },
            { 	
				header: "STIG",
				width: 150,
                dataIndex: 'benchmarkId',
                sortable: true,
                renderer: (v, m, r) => {
                    if (r.data.stigAttached) {
                        return v
                    }
                    else {
                        return `${v} (+)`
                    }
                }
            },
            { 	
				header: '<div class="sm-grid-result-sprite sm-result-na">NR</div></div>',
				width: 50,
                align: 'center',
                dataIndex: 'notchecked',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            { 	
				header: '<div class="sm-grid-result-sprite sm-result-na">NA</div></div>',
				width: 50,
                align: 'center',
                dataIndex: 'notapplicable',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            { 	
				header: '<div class="sm-grid-result-sprite sm-result-pass">NF</div></div>',
				width: 50,
                align: 'center',
                dataIndex: 'pass',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            { 	
				header: '<div class="sm-grid-result-sprite sm-result-fail">O</div></div>',
                width: 50,
                align: 'center',
                dataIndex: 'fail',
                sortable: true,
                renderer: (v) => me.importReviews ? v : '--'
            },
            { 	
				header: "File",
				width: 150,
                dataIndex: 'filename',
                sortable: true,
                renderer: (v, m, r) => {
                    m.attr = `ext:qtip="${r.data.fullPath}"`
                    return v
                }
            },
            { 	
                xtype: 'datecolumn',
                format:	'Y-m-d H:i:s',
                header: "Date",
				width: 150,
                dataIndex: 'date',
                sortable: true
            }
        ]
        const config = {
            //title: this.title || 'Parent',
            isFormField: true,
            name: 'imports',
            allowBlank: false,
            layout: 'fit',
            store: store,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new Ext.grid.GroupingView({
                enableGrouping:true,
                hideGroupedColumn: true,
                forceFit:true,
                emptyText: 'No records to display',
                groupTextTpl: '{text} ({[values.rs.length]} {[values.text.split(":")[0] == "Asset" ? "checklist" : "asset"]}{[values.rs.length > 1 ? "s assigned" : " assigned"]})',
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    },
                    {
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            listeners: {
            },
            getValue: function() {
                return true
            },
            setValue: function(v) {
                store.loadData(v)
            },
            validator: function (v) {
                let one = 1
            },
            markInvalid: function() {
                let one = 1
            },
            clearInvalid: function() {
                let one = 1
            },
            isValid: function () {
                return true
            },
            getName: () => this.name,
            validate: function () {
                let one = 1
            },
            newAssetStig: true,
            importReviews: true,
            enableNewAssetStig: ( enabled = true ) => {
                me.newAssetStig = enabled
                if (enabled) {
                    me.store.clearFilter()
                }
                else {
                    const filter = ( record ) => record.data.assetId && record.data.stigAttached
                    me.store.filterBy( filter )
                }
            },
            enableImportReviews: ( enabled = true ) => {
                me.importReviews = enabled
                me.getView().refresh()
            }
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.Grid.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ParseErrorsGrid = Ext.extend(Ext.grid.GridPanel, {
    initComponent: function() {
        const me = this
        const fields = [
            {
                name: 'file'
            },
            { 
                name: 'filename',
                mapping: 'file.name'
            },
            {
                name: 'error'
            }
        ]
        const totalTextCmp = new Ext.Toolbar.TextItem ({
            text: '0 records',
            width: 80
        })
        const store = new Ext.data.GroupingStore({
            grid: this,
            root: '',
            reader: new Ext.data.JsonReader({
                fields: fields,
                idProperty: 'filename'
            }),
            sortInfo: {
                field: 'filename',
                direction: 'ASC' // or 'DESC' (case sensitive for local sorting)
            },
            listeners: {
                load: function (store,records) {
                    totalTextCmp.setText(records.length + ' records');
                },
                remove: function (store,record,index) {
                    totalTextCmp.setText(store.getCount() + ' records');
                }
            }
        })
        const columns = [
            { 	
				header: "File",
				width: 100,
                dataIndex: 'filename',
                sortable: true
            },
            { 	
				header: "Error",
				width: 150,
                dataIndex: 'error',
                sortable: true
            }
        ]
        const config = {
            //title: this.title || 'Parent',
            isFormField: true,
            name: 'imports',
            allowBlank: false,
            layout: 'fit',
            store: store,
            cm: new Ext.grid.ColumnModel ({
                columns: columns   
            }),
            sm: new Ext.grid.RowSelectionModel({
                singleSelect: true
            }),
            view: new Ext.grid.GridView({
                forceFit:true,
                emptyText: 'No records to display'
            }),
            bbar: new Ext.Toolbar({
                items: [
                    {
                        xtype: 'tbfill'
                    },
                    {
                        xtype: 'tbseparator'
                    },
                    totalTextCmp
                ]
            }),
            listeners: {
            },
            getValue: function() {
                return true
            },
            setValue: function(v) {
                store.loadData(v)
            },
            validator: function (v) {
                let one = 1
            },
            markInvalid: function() {
                let one = 1
            },
            clearInvalid: function() {
                let one = 1
            },
            isValid: function () {
                return true
            },
            getName: () => this.name,
            validate: function () {
                let one = 1
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseErrorsGrid.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.SelectFilesPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {

        let me = this
     
        function handleDragover(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            // e.target.style.border = "2px dashed red"
            this.style.border = "2px dashed red"
        }
        
        function handleDragleave(e) {
            e.stopPropagation()
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            // e.target.style.border = ""
            this.style.border = ""
        }
    
        let config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20'
            },
            items: [
                {
                    html: '<div class="sm-dialog-panel-title">Select or drop files</div>',
                    width: 500,
                    border: false
                },
                {
                    html: '<div id="droptarget">Drop one or more CKL/XCCDF result files here</div>',
                    // border: false,
                    baseCls: 'sm-drop',
                    flex: 1,
                    listeners: {
                        render: (panel) => {
                            const panelEl = panel.getEl().dom
                            panelEl.addEventListener('dragenter', handleDragover, false)
                            panelEl.addEventListener('dragover', handleDragover, false)
                            panelEl.addEventListener('dragleave', handleDragleave, false)
                            panelEl.addEventListener('drop', me.onFileDropped, false)            
                        }        
                    }
                },
                {
                    xtype: 'displayfield',
                    html: "<p>&nbsp;</p>",
                },
                {
                    xtype: 'fileuploadfield',
                    buttonOnly: true,
                    name: 'importFile',
                    accept: '.xml,.ckl',
                    webkitdirectory: false,
                    multiple: true,
                    style: 'width: 95px;',
                    buttonText: 'Select files...',
                    buttonCfg: {
                        icon: "img/disc_drive.png"
                    },
                    listeners: {
                        fileselected: this.onFileSelected
                    }
                }
            ],
            listeners: {
            }
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.SelectFilesPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ParseErrorsPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        let me = this
        me.errorsGrid = new SM.ReviewsImport.ParseErrorsGrid({
            flex: 1
        })
        me.duplicatesGrid = new SM.ReviewsImport.Grid({
            flex: 1,
            newIndicator: false
        })
        let items = []
        if (me.errors) {
            items.push(
                {
                    html: '<div class="sm-dialog-panel-title">Errors and warnings</div>',
                    width: 500,
                    border: false
                },
                me.errorsGrid
            )
            me.errorsGrid.store.loadData( me.errors )
        }
        if (me.duplicates) {
            items.push (
                {
                    html: '<div class="sm-dialog-panel-title">Duplicates excluded</div>',
                    width: 500,
                    border: false
                },
                me.duplicatesGrid
            )
            me.duplicatesGrid.store.loadData( me.duplicates )
        }
        let config = {
            border: false,
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            items: items,
            buttons: [{
                xtype: 'button',
                text: 'Continue',
                handler: me.continueHandler   
            }],
            buttonAlign: 'right'
        }
        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ParseErrorsPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.OptionsPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        const grid = new SM.ReviewsImport.Grid({
            // cls: 'sm-round-panel',
            // margins: { top: SM.Margin.adjacent, right: SM.Margin.edge, bottom: SM.Margin.adjacent, left: SM.Margin.edge },
            border: true,                 
            // region: 'center',
            flex: 1,
			panel: this
        })
        grid.store.loadData( me.gridData )
        const controls = new Ext.Panel({
            region: 'south',
            border: false,
            height: 40,
            layout: 'hbox',
            layoutConfig: {
                align: 'middle',
                defaultMargins: '0 5',
                pack: 'start'
            },
            items: [
                {
                    xtype: 'checkbox',
                    checked: true,
                    boxLabel: 'Create or update Assets and STIG associations',
                    margins: '0 15 -2 0',
                    listeners: {
                        check: function ( cb, checked ) {
                            grid.enableNewAssetStig( checked )
                        }
                    }
                },
                {
                    xtype: 'checkbox',
                    checked: true,
                    boxLabel: 'Import reviews',
                    margins: '0 0 -2 0',
                    listeners: {
                        check: function ( cb, checked ) {
                            grid.enableImportReviews( checked )
                        }
                    }
                }                  
            ]
        })
        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            border: false,
            items: [
                {
                    html: '<div class="sm-dialog-panel-title">Choose options</div>',
                    width: 500,
                    border: false
                },
                controls,
                grid
            ],
            buttons: [
                {
                    xtype: 'button',
                    iconCls: 'sm-import-icon',
                    text: 'Add to Collection...',
                    margins: '0 25',
                    grid: grid,
                    handler: async () => {
                        await me.addHandler(grid.store.getRange(), grid.newAssetStig, grid.importReviews)
                    }
                }
            ],
            buttonAlign: 'right',
            grid: grid
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.OptionsPanel.superclass.initComponent.call(this)
    }
})

SM.ReviewsImport.ImportProgressPanel = Ext.extend(Ext.Panel, {
    initComponent: function () {
        const me = this
        const pb = new Ext.ProgressBar({
            text: '',
            border: false
        })
        const st = new Ext.form.TextArea({
            cls: 'sm-progress-textarea'
            ,readOnly: true
            ,flex: 3
            ,margins: {
                top: 10
                ,bottom: 0
                ,left: 0
                ,right: 0
            }
        })
    
        const config = {
            layout: 'vbox',
            layoutConfig: {
                align: 'stretch',
                pack: 'start',
                padding: '0 20 20 20',
            },
            border: false,
            items: [
                {
                    html: '<div class="sm-dialog-panel-title">Importing data</div>',
                    width: 500,
                    border: false
                },
                pb,
                st
            ],
            buttons: [
                {
                    xtype: 'button',
                    text: 'Done',
                    margins: '0 25',
                    handler: me.doneHandler
                }
            ],
            buttonAlign: 'right',
            pb: pb,
            st: st
        }

        Ext.apply(this, Ext.apply(this.initialConfig, config))
        SM.ReviewsImport.ImportProgressPanel.superclass.initComponent.call(this)
    }
})

async function showImportResultFiles( collectionId, el ) {
    try {
        const fp = new SM.ReviewsImport.SelectFilesPanel({
            border: false,
            autoScroll: true,
            onFileSelected: onFileSelected,
            onFileDropped: onFileDropped
        })

        const vpSize = Ext.getBody().getViewSize()
        let height = vpSize.height * 0.75
        let width = vpSize.width * 0.75 <= 1024 ? vpSize.width * 0.75 : 1024

        const fpwindow = new Ext.Window({
            title: 'Import results from CKL or XCCDF files',
            modal: true,
            resizable: true,
            // renderTo: el,
            autoScroll: true,
            width: width,
            height:height,
            layout: 'fit',
            plain: true,
            bodyStyle:'padding:5px;',
            buttonAlign:'center',
            items: fp
        })
    
        fpwindow.show()

        async function onFileDropped(e) {
            e.stopPropagation()
            e.preventDefault()
            this.style.border = ""
            let entries = []
            let files = []
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                entries.push( e.dataTransfer.items[i].webkitGetAsEntry() )
            }

            for (const entry of entries ) {
                const entryContent = await readEntryContentAsync( entry )
                files.push(...entryContent)
            }
            files.sort( (a, b) => a.lastModified - b.lastModified)
            showParseFiles(files)

            function readEntryContentAsync ( entry ) {
                return new Promise( (resolve, reject) => {
                    let reading = 0
                    const files = []
                    readEntry(entry)
                    function readEntry(entry) {
                        if (entry.isFile) {
                            reading++
                            let fullPath = entry.fullPath
                            entry.file(file => {
                                reading--
                                file.fullPath = fullPath
                                files.push(file);      
                                if (reading === 0) {
                                    resolve(files);
                                }
                            })
                        } else if (entry.isDirectory) {
                            readReaderContent(entry.createReader())
                        }
                    }
                    function readReaderContent(reader) {
                        reading++
                        reader.readEntries(function (entries) {
                            reading--
                            for (const entry of entries) {
                                readEntry(entry)
                            }
                            if (reading === 0) {
                                resolve(files);
                            }
                        })
                    }
                })
            }
        }

        async function onFileSelected (uploadField) {
            try {
                let input = uploadField.fileInput.dom
                const files = [...input.files]
                // Sort files oldest to newest
                files.sort( (a, b) => a.lastModified - b.lastModified)
                showParseFiles(files)
            }
            catch (e) {
                throw e
            }
        }
        
        async function showParseFiles( files ) {
            try {
                const pb = new Ext.ProgressBar({
                    text: '',
                    // margins: '0 30',
                    border: false
                })
                const pbPanel = new Ext.Panel({
                    layout: 'vbox',
                    layoutConfig: {
                        align: 'stretch',
                        pack: 'start',
                        padding: '0 20 20 20'
                    },
                    border: false,
                    items: [
                        {
                            html: '<div class="sm-dialog-panel-title">Parsing your files</div>',
                            width: 500,
                            margins: '0 0',
                            border: false
                        },
                        pb
                    ]
                })

                const task = new Ext.util.DelayedTask(function(){
                    fpwindow.removeAll()
                    fpwindow.add(pbPanel)
                    fpwindow.doLayout()
                })
                task.delay(250)

                const results = await parseFiles ( files, pb )
                task.cancel()

                let dupedRows

                // TEMPORARY: keep only the latest member of each duplicate set from parseResults.rows
                // Permananet solution should invoke a UI for duplicate handling
                if (results.hasDuplicates) {
                    let indexes = []
                    for (const i of Object.values(results.pairs)) {
                        if (i.length > 1) {
                            // Don't incude the last item (the latest file timestamp)
                            // Assumes the items of results.rows are sorted by file timestamp ascending
                            indexes.push( i.slice( 0, -1 ) )
                        }
                    }
                    // Use a Set because .has is O(1)
                    let indexSet = new Set(indexes.flat())
                    let dedupedRows = results.rows.filter( (v, i) => !indexSet.has(i))
                    results.dupedRows = results.rows.filter( (v, i) => indexSet.has(i))
                    results.rows = dedupedRows
                }

                if (results.errors.length > 0 || results.hasDuplicates) {
                    showErrors( results )
                } else {
                    showOptions( results )
                }
            }
            catch (e) {
                alert(e)
            }
        }

        async function parseFiles ( files, pb ) {
            try {
                // Get collection assets for matching
                let apiAssetsResult = Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/assets`,
                    params: {
                        collectionId: collectionId,
                        projection: 'stigs'
                    },
                    method: 'GET'
                })

                // Get installed STIGs for matching
                let apiStigsResult = Ext.Ajax.requestPromise({
                    url: `${STIGMAN.Env.apiBase}/stigs`,
                    method: 'GET'
                })

                let filesHandled = 0
                const parseResults = {
                    success: [],
                    fail: []
                }

                // Raw parsing of each file
                for (const file of files) {
                    pb.updateText(file.name)
                    let extension = file.name.substring(file.name.lastIndexOf(".")+1)
                    let data = await readTextFileAsync(file)
                    if (extension === 'ckl') {
                        try {
                            const r = reviewsFromCkl(data)
                            r.file = file
                            parseResults.success.push(r)
                        }
                        catch (e) {
                            parseResults.fail.push({
                                file: file,
                                error: e.message
                            })
                        }				
                    }
                    if (extension === 'xml') {					
                        try {
                            const r = reviewsFromScc(data)
                            r.file = file
                            parseResults.success.push(r)
                        }
                        catch (e) {
                            parseResults.fail.push({
                                file: file,
                                error: e.message
                            })
                        }				
                    }
                    filesHandled++
                    pb.updateProgress(filesHandled/files.length)
                }

                apiAssetsResult = await apiAssetsResult
                const apiAssets = JSON.parse(apiAssetsResult.response.responseText)
                
                apiStigsResult = await apiStigsResult
                const apiStigs = JSON.parse(apiStigsResult.response.responseText)
                const apiBenchmarkIds = new Set( apiStigs.map( stig => stig.benchmarkId ) )

                // Transform into data for SM.ReviewsImport.Grid
                const gridData = { 
                    rows: [],
                    errors: parseResults.fail
                }
                for (const parseResult of parseResults.success) {
                    // Try to find this asset by name
                    let apiAsset = apiAssets.find( apiAsset => apiAsset.name.toUpperCase() === parseResult.target.name.toUpperCase())
                    let assetId, name, assetBenchmarkIds = []
                    if (apiAsset) {
                        assetId = apiAsset.assetId
                        name = apiAsset.name
                        assetBenchmarkIds = apiAsset.stigs.map( stig => stig.benchmarkId )
                    }
                    for (const checklist of parseResult.checklists) {
                        if ( apiBenchmarkIds.has( checklist.benchmarkId ) ) {
                            // Try to find this STIG by benchmarkId
                            let stigAttached = false
                            if (assetBenchmarkIds.length > 0) {
                                stigAttached = assetBenchmarkIds.includes( checklist.benchmarkId )
                            }
                            const data = {
                                file: parseResult.file,
                                assetId: assetId,
                                assetName: name || parseResult.target.name,
                                apiAsset: apiAsset,
                                ip: parseResult.target.ip,
                                noncomputing: parseResult.target.noncomputing,
                                metadata: parseResult.target.metadata,
                                benchmarkId: checklist.benchmarkId,
                                stigAttached: stigAttached,
                                pass: checklist.stats.pass,
                                fail: checklist.stats.fail,
                                notchecked: checklist.stats.notchecked,
                                notapplicable: checklist.stats.notapplicable,
                                reviews: checklist.reviews
                            }
                            gridData.rows.push(data)
                        }
                        else {
                            gridData.errors.push({
                                file: parseResult.file,
                                error: `Ignoring ${checklist.benchmarkId}, which is not installed`
                            })
                        }
                    }  
                }
                let assetStigPairs = gridData.rows.reduce( (a, v, i) => {
                    const key = `${v.assetName.toUpperCase()}-${v.benchmarkId}`
                    if (a[key]) {
                        a[key].push(i)
                    }
                    else {
                        a[key] = [i]
                    }
                    return a
                }, {})
                gridData.hasDuplicates = Object.keys(assetStigPairs).some( key => assetStigPairs[key].length > 1)
                gridData.pairs = assetStigPairs
                return gridData    
            }
            catch (e) {
                throw (e)
            }
        }

        function showErrors ( results ) {
            let pePanel = new SM.ReviewsImport.ParseErrorsPanel( {
                errors: results.errors.length > 0 ? results.errors : null,
                duplicates: results.hasDuplicates ? results.dupedRows : null,
                continueHandler: onContinue,
                backHandler: onBack
            } )
            fpwindow.removeAll()
            fpwindow.setAutoScroll(true)
            fpwindow.add(pePanel)
            fpwindow.doLayout()

            function onContinue () {
                showOptions( results )
            }

            function onBack () {

            }
        }

        function showOptions ( results ) {
            let optionsPanel = new SM.ReviewsImport.OptionsPanel({
                gridData: results.rows,
                addHandler: showImportProgress
            })
            fpwindow.removeAll()
            fpwindow.add(optionsPanel)
            fpwindow.doLayout()
        }

        async function showImportProgress( records, modifyAssets, importReviews ) {
            let statusText = ''
            let progressPanel
            try {
                progressPanel = new SM.ReviewsImport.ImportProgressPanel({
                    doneHandler: () => {
                        fpwindow.close()
                    }
                })
                fpwindow.removeAll()
                fpwindow.add(progressPanel)
                fpwindow.doLayout()

                let assets = recordsToAssets(records)
                let entries = Object.entries( assets )
                let processedCount = 0
                for (const [name, assetObj] of entries) {
                    updateProgress(processedCount/entries.length, assetObj.name)
                    if (modifyAssets) {
                        let apiAsset = await importAsset( collectionId, assetObj )
                        assetObj.assetId = apiAsset.assetId
                        updateStatusText(JSON.stringify(apiAsset, null, 2))
                    }
                    if (importReviews) {
                        for (const reviewArray of assetObj.reviews) {
                            let apiReviews = await importReviewArray( collectionId, assetObj.assetId, reviewArray )
                            updateStatusText(JSON.stringify(apiReviews, null, 2))
                        }
                    }
                    processedCount++
                    updateProgress(processedCount/entries.length, assetObj.name)
                }
                updateProgress(0, 'Finished')

            }
            catch (e) {
                alert (e.message)
            }

            function updateProgress (value,text) {
                progressPanel.pb.updateProgress(value,Ext.util.Format.htmlEncode(text));
            }

            function updateStatusText (text, noNL, replace) {
                var noNL = noNL || false
                if (noNL) {
                    statusText += text
                } else {
                    statusText += text + "\n"
                }
                progressPanel.st.setRawValue(statusText)
                progressPanel.st.getEl().dom.scrollTop = 99999; // scroll to bottom
            }
            
            function recordsToAssets ( records ) {
                let data = records.map( r => r.data )
                data.sort( (a,b) => a.file.lastModified - b.file.lastModified ) // ascending date
                let assets = {}
                for (const r of data) {
                    if (! assets[r.assetName] ) {
                        if (r.apiAsset) {
                            assets[r.assetName] = {
                                assetId: r.apiAsset.assetId,
                                name: r.assetName,
                                description: r.apiAsset.description || '',
                                ip: r.apiAsset.ip,
                                noncomputing: r.apiAsset.noncomputing,
                                metadata: r.apiAsset.metadata,
                                stigs: r.apiAsset.stigs.map( s => s.benchmarkId ),
                                reviews: []
                            }                       
                        }
                        else {
                            assets[r.assetName] = {
                                assetId: null,
                                name: r.assetName,
                                description: '',
                                ip: null,
                                noncomputing: null,
                                metadata: null,
                                stigs: [],
                                reviews: []
                            }
                        }
                    }
                    if (r.ip) { assets[r.assetName].ip = r.ip }
                    assets[r.assetName].noncomputing = r.noncomputing
                    assets[r.assetName].metadata = { ...assets[r.assetName].metadata, ...r.metadata }
                    if (!r.stigAttached) { assets[r.assetName].stigs.push( r.benchmarkId ) }
                    if ( r.reviews.length ) { assets[r.assetName].reviews.push( r.reviews ) }                
                }
                return assets
            }
    
            async function importAsset ( collectionId, assetObj ) {
                try {
                    const { reviews, ...assetData } = assetObj
                    const { assetId, ...values } = assetData
                    values.collectionId = collectionId
                    let url, method
                    if (assetId) {
                        url = `${STIGMAN.Env.apiBase}/assets/${assetId}`
                        method = 'PUT'
                    }
                    else {
                        url = `${STIGMAN.Env.apiBase}/assets`
                        method = 'POST'
                    }
                    updateStatusText(`${method} ${url}`)

                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: method,
                        params: {
                            projection: ['stigs', 'adminStats']
                        },
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: values
                    })
                    const apiAsset = JSON.parse(result.response.responseText)
                    let event = method === 'POST' ? 'assetcreated' : 'assetchanged'
                    SM.Dispatcher.fireEvent(event, apiAsset)

                    return apiAsset
                }
                catch (e) {
                    throw (e)
                }
            }
      
            async function importReviewArray ( collectionId, assetId, reviewArray ) {
                try {
                    let url = `${STIGMAN.Env.apiBase}/collections/${collectionId}/reviews/${assetId}`
                    updateStatusText(`POST ${url}`)
                    let result = await Ext.Ajax.requestPromise({
                        url: url,
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json;charset=utf-8' },
                        jsonData: reviewArray
                    })
                    apiReviews = JSON.parse(result.response.responseText)
                    return apiReviews
                }
                catch (e) {
                    throw (e)
                }
            }
    
        }

  
    }
    catch (e) {
        if (typeof e === 'object') {
            if (e instanceof Error) {
              e = JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
            }
            else {
              // payload = JSON.stringify(payload, null, 2);
              e = JSON.stringify(e);
            }
        }        
        alert(e)
        Ext.getBody().unmask()

    }
}
