/*!
 * Based on original code from: Ext JS Library 3.4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * 
 * Modified for STIG Manager OSS
 * Caches pre-rendered rows in a document-fragment for quick assignment to the DOM
 */
Ext.ns('Ext.ux.grid');

/**
 * @class Ext.ux.grid.BufferView
 * @extends Ext.grid.GridView
 * A custom GridView which renders rows on an as-needed basis.
 */
Ext.ux.grid.BufferView = Ext.extend(Ext.grid.GridView, {
	/**
	 * @cfg {Number} rowHeight
	 * The height of a row in the grid.
	 */
	rowHeight: 21,

	/**
	 * @cfg {Number} borderHeight
	 * The combined height of border-top and border-bottom of a row.
	 */
	borderHeight: 2,

	/**
	 * @cfg {Boolean/Number} scrollDelay
	 * The number of milliseconds before rendering rows out of the visible
	 * viewing area. Defaults to 100. Rows will render immediately with a config
	 * of false.
	 */
	scrollDelay: false,

	/**
	 * @cfg {Number} cacheSize
	 * The number of rows to look forward and backwards from the currently viewable
	 * area.  The cache applies only to rows that have been rendered already.
	 */
	cacheSize: 0,

	/**
	 * @cfg {Number} cleanDelay
	 * The number of milliseconds to buffer cleaning of extra rows not in the
	 * cache.
	 */
	cleanDelay: 500,

	lineClamp: 1,

	initTemplates: function () {
		Ext.ux.grid.BufferView.superclass.initTemplates.call(this);
		var ts = this.templates;
		// empty div to act as a place holder for a row
		ts.rowHolder = new Ext.Template(
			'<div class="x-grid3-row {alt}" style="{tstyle}"></div>'
		);
		ts.rowHolder.disableFormats = true;
		ts.rowHolder.compile();

		const rowBodyText = [
			'<tr class="x-grid3-row-body-tr" style="{bodyStyle}">',
			'<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">',
			'<div class="x-grid3-row-body">{body}</div>',
			'</td></tr>'
		].join("")

		const innerText = [
			'<table class="x-grid3-row-table',
			'<tpl if="lineClamp &gt; 1"> sm-line-clamp-wrap</tpl>',
			'" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
			'<tbody><tr>{cells}</tr>',
			(this.enableRowBody ? rowBodyText : ''),
			'</tbody></table>'
		].join("")

		ts.row = new Ext.XTemplate('<div class="x-grid3-row {alt}" style="{tstyle}">' + innerText + '</div>')
		ts.row.disableFormats = true;
		ts.row.compile();

		ts.rowInner = new Ext.XTemplate(innerText)
		ts.rowInner.disableFormats = true;
		ts.rowInner.compile();
	},

	getStyleRowHeight: function () {
		return Ext.isBorderBox ? (this.rowHeight + this.borderHeight) : this.rowHeight;
	},

	getCalculatedRowHeight: function () {
		return this.scroller.dom.scrollHeight === this.scroller.dom.clientHeight ?
			this.rowHeight + this.borderHeight : this.scroller.dom.scrollHeight / this.ds.getCount();
	},

	getVisibleRowCount: function () {
		var rh = this.getCalculatedRowHeight(),
			visibleHeight = this.scroller.dom.clientHeight;
		return (visibleHeight < 1) ? 0 : Math.ceil(visibleHeight / rh);
	},

	getVisibleRows: function () {
		var count = this.getVisibleRowCount(),
			sc = this.scroller.dom.scrollTop,
			start = (sc === 0 ? 0 : Math.floor(sc / this.getCalculatedRowHeight()) - 1);
		return {
			first: Math.max(start, 0),
			last: Math.min(start + count + 2, this.ds.getCount() - 1)
		};
	},

	doRender: function (cs, rs, ds, startRow, colCount, stripe) {
		var ts = this.templates,
			ct = ts.cell,
			rt = ts.row,
			ri = ts.rowInner,
			last = colCount - 1,
			rh = this.getStyleRowHeight(),
			vr = this.getVisibleRows(),
			tstyle = 'width:' + this.getTotalWidth() + ';height:' + rh + 'px;',
			// buffers
			buf = [],
			cb,
			c,
			p = {},
			rp = { tstyle, lineClamp: this.lineClamp },
			r;
		const rowInnerMarkupBuffer = []
		for (var j = 0, len = rs.length; j < len; j++) {
			r = rs[j]; cb = [];
			var rowIndex = (j + startRow),
				visible = rowIndex >= vr.first && rowIndex <= vr.last;

			for (var i = 0; i < colCount; i++) {
				c = cs[i];
				p.id = c.id;
				p.css = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
				p.attr = p.cellAttr = "";
				if (this.lineClamp !== 'undefined') {
					p.attr += ` style="-webkit-line-clamp: ${this.lineClamp};"`
				}
				p.value = c.renderer.call(c.scope || c, typeof r.data[c.name] === 'string' ? SM.he(r.data[c.name]) : r.data[c.name], p, r, rowIndex, i, ds);
				p.style = c.style;
				if (p.value === undefined || p.value === "") {
					p.value = "&#160;";
				}
				if (r.dirty && typeof r.modified[c.name] !== 'undefined') {
					p.css += ' x-grid3-dirty-cell';
				}
				cb[cb.length] = ct.apply(p);
			}

			var alt = [];
			if (stripe && ((rowIndex + 1) % 2 === 0)) {
				alt[0] = "x-grid3-row-alt";
			}
			if (r.dirty) {
				alt[1] = " x-grid3-dirty-row";
			}
			rp.cols = colCount;
			if (this.getRowClass) {
				alt[2] = this.getRowClass(r, rowIndex, rp, ds);
			}
			rp.alt = alt.join(" ");
			rp.cells = cb.join("")
			// save the row inner markup 
			rowInnerMarkupBuffer[rowIndex] = ri.apply(rp)
			// add either [row div + nothing] or [row div + row inner] to the return buffer
			buf[buf.length] = !visible ? ts.rowHolder.apply(rp) : rt.apply(rp);
		}
		
		// set the content of a <template> to the row inner markups
		this.rowInnerTemplateEl = document.createElement('template')
		this.rowInnerTemplateEl.innerHTML = rowInnerMarkupBuffer.join('')
		
		return buf.join("");
	},
	
	refreshRow: function (record) {
		var store = this.ds,
			colCount = this.cm.getColumnCount(),
			columns = this.getColumnData(),
			last = colCount - 1,
			cls = ['x-grid3-row'],
			rh = this.getStyleRowHeight(),
			vr = this.getVisibleRows(),
			rowParams = {
				tstyle: 'width:' + this.getTotalWidth() + ';height:' + rh + 'px;',
				lineClamp: this.lineClamp
			},
			colBuffer = [],
			cellTpl = this.templates.cell,
			rowIndex, row, column, meta, css, i;

		if (Ext.isNumber(record)) {
			rowIndex = record;
			record = store.getAt(rowIndex);
		} else {
			rowIndex = store.indexOf(record);
		}

		const visible = rowIndex >= vr.first && rowIndex <= vr.last

		//the record could not be found
		if (!visible || !record || rowIndex < 0) {
			return;
		}

		//builds each column in this row
		for (i = 0; i < colCount; i++) {
			column = columns[i];

			if (i == 0) {
				css = 'x-grid3-cell-first';
			} else {
				css = (i == last) ? 'x-grid3-cell-last ' : '';
			}

			meta = {
				id: column.id,
				style: column.style,
				css: css,
				attr: `style="-webkit-line-clamp: ${this.lineClamp};"`,
				cellAttr: ""
			};
			// Need to set this after, because we pass meta to the renderer
			meta.value = column.renderer.call(column.scope, typeof record.data[column.name] === 'string' ? SM.he(record.data[column.name]) : record.data[column.name], meta, record, rowIndex, i, store);

			if (Ext.isEmpty(meta.value)) {
				meta.value = '&#160;';
			}

			if (this.markDirty && record.dirty && typeof record.modified[column.name] != 'undefined') {
				meta.css += ' x-grid3-dirty-cell';
			}

			colBuffer[i] = cellTpl.apply(meta);
		}

		row = this.getRow(rowIndex);
		row.className = '';

		if (this.grid.stripeRows && ((rowIndex + 1) % 2 === 0)) {
			cls.push('x-grid3-row-alt');
		}

		if (this.getRowClass) {
			rowParams.cols = colCount;
			cls.push(this.getRowClass(record, rowIndex, rowParams, store));
		}

		this.fly(row).addClass(cls).setStyle(rowParams.tstyle);
		rowParams.cells = colBuffer.join("");
		row.innerHTML = this.templates.rowInner.apply(rowParams);
		this.rowInnerTemplateEl.content.children[rowIndex].innerHTML = row.innerHTML

		this.fireEvent('rowupdated', this, rowIndex, record);
	},

	isRowRendered: function (index) {
		var row = this.getRow(index);
		return row && row.childNodes.length > 0;
	},

	syncScroll: function () {
		Ext.ux.grid.BufferView.superclass.syncScroll.apply(this, arguments);
		this.update();
	},

	update: function () {
		if (this.scrollDelay) {
			if (!this.renderTask) {
				this.renderTask = new Ext.util.DelayedTask(this.doUpdate, this);
			}
			this.renderTask.delay(this.scrollDelay);
		} else {
			this.doUpdate();
		}
	},

	onRemove: function (ds, record, index, isUpdate) {
		Ext.ux.grid.BufferView.superclass.onRemove.apply(this, arguments);
		if (isUpdate !== true) {
			this.update();
		}
	},

	doUpdate: function () {
		if (this.getVisibleRowCount() > 0) {
			let vr = this.getVisibleRows(), row;
			for (var i = vr.first; i <= vr.last; i++) {
				// if row is NOT rendered and is visible, render it
				if (!this.isRowRendered(i) && (row = this.getRow(i))) {
					row.innerHTML = this.rowInnerTemplateEl.content.children[i].outerHTML;
				}
			}
			this.clean();
		}
	},

	updateAllColumnWidths: function () {
		var totalWidth = this.getTotalWidth(),
			colCount = this.cm.getColumnCount(),
			rows = this.getRows(),
			rowCount = rows.length,
			widths = [],
			row, rowFirstChild, trow, i, j;

		const rowInnerCache = this.rowInnerTemplateEl?.content?.children

		for (i = 0; i < colCount; i++) {
			widths[i] = this.getColumnWidth(i);
			this.getHeaderCell(i).style.width = widths[i];
		}

		this.updateHeaderWidth();

		for (i = 0; i < rowCount; i++) {
			row = rows[i];
			row.style.width = totalWidth;
			rowFirstChild = row.firstChild;

			if (rowFirstChild) {
				rowFirstChild.style.width = totalWidth;
				trow = rowFirstChild.rows[0];

				for (j = 0; j < colCount; j++) {
					trow.childNodes[j].style.width = widths[j];
				}
			}

			// BufferView extends to update the cache's <template> element
			let rowInnerCached = rowInnerCache?.[i]
			if (rowInnerCached) {
				rowInnerCached.style.width = totalWidth
				trow = rowInnerCached.rows[0];
				for (j = 0; j < colCount; j++) {
					trow.childNodes[j].style.width = widths[j];
				}
			}
		}

		this.onAllColumnWidthsUpdated(widths, totalWidth);
	},

	updateColumnWidth: function (column, width) {
		var columnWidth = this.getColumnWidth(column),
			totalWidth = this.getTotalWidth(),
			headerCell = this.getHeaderCell(column),
			nodes = this.getRows(),
			nodeCount = nodes.length,
			row, i, firstChild;
		
		const rowInnerCache = this.rowInnerTemplateEl?.content?.children

		this.updateHeaderWidth();
		headerCell.style.width = columnWidth;

		for (i = 0; i < nodeCount; i++) {
			row = nodes[i];
			firstChild = row.firstChild;

			row.style.width = totalWidth;
			if (firstChild) {
				firstChild.style.width = totalWidth;
				firstChild.rows[0].childNodes[column].style.width = columnWidth;
			}

			// BufferView extends to update the cache's <template> element
			let rowInnerCached = rowInnerCache?.[i]
			if (rowInnerCached) {
				rowInnerCached.style.width = totalWidth
				rowInnerCached.rows[0].childNodes[column].style.width = columnWidth
			}
		}

		this.onColumnWidthUpdated(column, columnWidth, totalWidth);
	},

	updateColumnHidden: function (col, hidden) {
		var totalWidth = this.getTotalWidth(),
			display = hidden ? 'none' : '',
			headerCell = this.getHeaderCell(col),
			nodes = this.getRows(),
			nodeCount = nodes.length,
			row, rowFirstChild, i;

		const rowInnerCache = this.rowInnerTemplateEl?.content?.children

		this.updateHeaderWidth();
		headerCell.style.display = display;

		for (i = 0; i < nodeCount; i++) {
			row = nodes[i];
			row.style.width = totalWidth;
			rowFirstChild = row.firstChild;

			if (rowFirstChild) {
				rowFirstChild.style.width = totalWidth;
				rowFirstChild.rows[0].childNodes[col].style.display = display;
			}

			// BufferView extends to update the cache's <template> element
			let rowInnerCached = rowInnerCache?.[i]
			if (rowInnerCached) {
				rowInnerCached.style.width = totalWidth
				rowInnerCached.rows[0].childNodes[col].style.display = display
			}
		}

		this.onColumnHiddenUpdated(col, hidden, totalWidth);
		delete this.lastViewWidth; //recalc
		this.layout();
	},

	clean: function () {
		if (!this.cleanTask) {
			this.cleanTask = new Ext.util.DelayedTask(this.doClean, this);
		}
		this.cleanTask.delay(this.cleanDelay);
	},

	doClean: function () {
		if (this.getVisibleRowCount() > 0) {
			var vr = this.getVisibleRows();
			vr.first -= this.cacheSize;
			vr.last += this.cacheSize;

			var i = 0, rows = this.getRows();
			// if first is less than 0, all rows have been rendered
			// so lets clean the end...
			if (vr.first <= 0) {
				i = vr.last + 1;
			}
			for (var len = this.ds.getCount(); i < len; i++) {
				// if current row is outside of first and last and
				// has content, update the innerHTML to nothing
				if ((i < vr.first || i > vr.last) && rows[i].innerHTML) {
					rows[i].innerHTML = '';
				}
			}
		}
	},

	removeTask: function (name) {
		var task = this[name];
		if (task && task.cancel) {
			task.cancel();
			this[name] = null;
		}
	},

	destroy: function () {
		this.removeTask('cleanTask');
		this.removeTask('renderTask');
		Ext.ux.grid.BufferView.superclass.destroy.call(this);
	},

	layout: function () {
		Ext.ux.grid.BufferView.superclass.layout.call(this);
		this.update();
	},

	isBufferView: true,

	doUpdateRowHeight: function () {
		let	colCount = this.cm.getColumnCount(),
			rows = this.getRows(),
			rowCount = rows.length,
			rh = `${this.getStyleRowHeight()}px`,
			row, rowFirstChild, trow, i, j;

		const rowInnerCache = this.rowInnerTemplateEl?.content?.children

		for (i = 0; i < rowCount; i++) {
			row = rows[i]
			row.style.height = rh
			rowFirstChild = row.firstChild

			if (rowFirstChild) {
				rowFirstChild.style.height = rh
				trow = rowFirstChild.rows[0]
				for (j = 0; j < colCount; j++) {
					trow.childNodes[j].childNodes[0].style['-webkit-line-clamp'] = this.lineClamp
				}
			}

			// BufferView extends to update the cache's <template> element
			let rowInnerCached = rowInnerCache?.[i]
			if (rowInnerCached) {
				rowInnerCached.style.height = rh
				trow = rowInnerCached.rows[0]
				for (j = 0; j < colCount; j++) {
					trow.childNodes[j].childNodes[0].style['-webkit-line-clamp'] = this.lineClamp
				}
			}
		}
	},

	changeRowHeight: function (rowHeight, lineClamp) {
		this.rowHeight = rowHeight
		this.lineClamp = lineClamp ? lineClamp : this.lineClamp		
		const scrollTopPct = this.scroller.dom.scrollTop / this.scroller.dom.scrollHeight
		this.doUpdateRowHeight()
		this.doUpdate()
		this.scroller.dom.scrollTop = this.scroller.dom.scrollHeight * scrollTopPct
	}
});