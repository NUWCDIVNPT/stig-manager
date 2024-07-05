/**
 * $Id: ExportButton.js 807 2017-07-27 13:04:19Z csmig $
 *
 * @class Ext.ExportButton
 * @extends Ext.Button
 * A button for downloading local data, which optionally contains a menu.
 * Original author: Carl Smigielski
 * @constructor
 * Creates a new ExportButton
 */ 
Ext.ux.ExportButton = Ext.extend(Ext.Button, {
	constructor: function(config) {
		
		if (config.hasMenu == true) {
			Ext.applyIf(config, {
				menu: new Ext.menu.Menu({
					items: [
					{
						text: "Grid data (.csv)"
						,iconCls: 'sm-table-icon'
						,exportType: 'grid'
						,exportFormat: 'csv'
						,href: "#"
					}
					,{
						text: "Store data (.csv)"
						,iconCls: 'sm-database-icon'
						,exportType: 'store'
						,exportFormat: 'csv'
						,href: "#"
					}]
				}),
			});
		}
		
		this.gridBasename = (config.gridBasename || 'grid_export'),
		this.gridSource = config.grid || undefined,
		this.storeBasename = (config.storeBasename || 'store_export'),
		this.storeSource = config.store || undefined,
		this.exportType = config.exportType || 'grid';
		this.exportFormat = config.exportFormat || 'csv';

		Ext.ux.ExportButton.superclass.constructor.call(this, config);
		
		if (this.menu) {
			this.menu.addListener('itemclick',this.menuItemClick,this);
			this.menu.addListener('beforeshow',this.menuBeforeShow,this);
		} else {
			this.addListener('click',this.buttonClick,this);
		}
	},
	
    onRender: function(ct, position){
		if (this.gridSource == undefined) {
			this.gridSource = this.findParentByType('grid');
		}
		if (this.storeSource == undefined && this.gridSource != undefined) {
			this.storeSource = this.gridSource.store;
		}
		Ext.ux.ExportButton.superclass.onRender.call(this,ct,position);
	},
	
	buttonClick: function (btn, e) {
		let csv = "\ufeff"; // UTF-8 BOM
		let filename = "";
		if (btn.exportFormat == 'csv'){
			if (btn.exportType == 'grid') {
				csv += this.gridToCsv(this.gridSource);
				filename = SM.Global.filenameEscaped(`${this.gridBasename}_${SM.Global.filenameComponentFromDate()}.csv`);
			} else if (btn.exportType == 'store') {
				csv += this.storeToCsv(this.storeSource);
				filename = SM.Global.filenameEscaped(`${this.storeBasename}_${SM.Global.filenameComponentFromDate()}.csv`);
			}
		}
		let blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
		if (window.navigator.msSaveOrOpenBlob){
			navigator.msSaveOrOpenBlob(blob,filename);
		} else {
			let a = window.document.createElement("a");
			a.style.display= "none";
			a.href = window.URL.createObjectURL(blob);
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	},
	
	menuBeforeShow: function (menu) {
		menu.items.each(function(item) {
			switch (item.exportType) {
				case 'grid':
					item.setDisabled(this.gridSource == undefined); 
					break;
				case 'store':
					item.setDisabled(this.storeSource == undefined); 
					break;
			}
		},this);
	},
	
	menuItemClick: function (item) {
		let csv = "\ufeff";
		let filename = "";
		if (item.exportFormat == 'csv'){
			if (item.exportType == 'grid') {
				csv += this.gridToCsv(this.gridSource);
				filename = this.gridBasename + '.csv';
			} else if (item.exportType == 'store') {
				csv += this.storeToCsv(this.storeSource);
				filename = this.storeBasename + '.csv';
			}
		}
		if (window.navigator.msSaveOrOpenBlob){
			let blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
			navigator.msSaveOrOpenBlob(blob,filename);
		} else {
			item.el.dom.setAttribute('download',filename);
			let href = encodeURI("data:text/csv;charset=utf-8," + csv)
			item.el.dom.setAttribute('href',href);
			item.el.dom.setAttribute('target','_self');
		}
	},
	
	gridToCsv: function (grid) {
		let csv = "";
		let view = grid.getView();
		let store = grid.store;
		
		// Get the array of all grid columns
		let columns = grid.getColumnModel().getColumnsBy(function(c) {return true} );
		
		// headerArray[] will hold data for the CSV header row
		let headerArray = ['Marking'];
		// ci[] will hold the column indexes for which we will later get row data
		let ci = [];
		for (let x=0; x < columns.length; x++){
			let c = columns[x];
			// Criteria for inclusion of the column
			if (c.dataIndex != "" && c.header != "" && !c.hidden){
				// Build an element to hold the column header's HTML
				let el = document.createElement('html');
				el.innerHTML = c.header;
				// Try to find the first child element with an 'exportvalue' attribute
				let ev = el.querySelector('[exportvalue]');
				if (ev != null) {
					// An element with an 'exportvalue' attribute was found. The CSV column header will be the value of 'exportvalue'
					headerArray.push('"' + ev.getAttribute('exportvalue') + '"');
				} else {
					// No element with an 'exportvalue' attribute was found was found. The CSV column header will be the quoted UI column header
					headerArray.push('"' + c.header + '"');
				}
				// Add this column index to ci[]
				ci.push(x);
			}
		}
		// Comma separate the header data and append to the CSV 
		csv += headerArray.join(',') + "\n";
		
		// Process all the records in the grid's store
		let recordCount = store.getCount();
		for (let rowIndex = 0; rowIndex < recordCount; rowIndex++){
			// rowArray[] will hold data for a single CSV row
			let rowArray = [`(${STIGMAN.apiConfig?.classification})`];

			if (view.isBufferView) {
				let r = store.data.items[rowIndex]
				// Iterate across the included column indexes 
				for (let x=0; x < ci.length; x++) {
					const c = columns[ci[x]]
					const p = {}
					const rendered = c.renderer.call(c.scope || c, r.data[c.dataIndex], p, r, rowIndex, x, store)
					const exportvalue = p.attr?.match(/exportvalue="(.*)"/)?.[1]
					if (exportvalue) {
						rowArray.push('"' + exportvalue + '"');
					}
					else {
						const templateEl = document.createElement('template')
						templateEl.innerHTML = rendered
						const value = '"' + templateEl.content.textContent.replace(/"/g,'""').trim() + '"'
						rowArray.push(value)
					}
				}	
			}
			else {
				// rowCells[] is an array of <td> children of the first <tr> element of a row
				let rowCells = view.getRow(rowIndex).getElementsByTagName('tr')[0].cells;
				// Iterate across the included column indexes 
				for (let x=0; x < ci.length; x++){
					// Try to find the first child element with an 'exportvalue' attribute
					let ev = rowCells[ci[x]].querySelector('[exportvalue]');
					if (ev != null) {
						// An element with an 'exportvalue' attribute was found was found. The CSV data will be the value of 'exportvalue'
						rowArray.push('"' + ev.getAttribute('exportvalue') + '"');
					} else {
						// No element with an 'exportvalue' attribute was found was found. The CSV data will be the quoted and escaped textContent of the <td>'s firstChild
						let value = '"' + rowCells[ci[x]].firstChild.textContent.replace(/"/g,'""').trim() + '"';
						rowArray.push(value);
					}
				}
			}
			// Comma separate the row data and append to the CSV 
			csv += rowArray.join(',') + "\n";
		}
		
		return csv;	
	},

	storeToCsv: function (store) {
		let csv = "";
		
		// headerArray[] will hold data for the CSV header row
		let headerArray = [];
		// fieldArray[] will hold data for later traversal of the Ext.data.Records
		let fieldArray = [];
		store.fields.each(function(item){
			headerArray.push('"' + item.name + '"');
			fieldArray.push(item.name);
		});
		// Comma separate the header data and append to the CSV 
		csv += headerArray.join(',') + "\n";

		store.each(function(record){
			let rowArray = [];
			for (let x = 0; x < fieldArray.length; x++){
				let field = fieldArray[x];
				let value = "";
				switch (Object.prototype.toString.call(record.data[field])) {
					case "[object String]":
						value = '"' + record.data[field] + '"';
						break;
					case "[object Number]":
						value = record.data[field];
						break;
					case "[object Date]":
						value = record.data[field].format("Y-m-d H:i:s");
						break;
					default:
						value = record.data[field];
						break;
				}
				rowArray.push(value);
			}
			csv += rowArray.join(',') + "\n";
		});
		
		return csv;	
	}


	
});
Ext.reg('exportbutton', Ext.ux.ExportButton);