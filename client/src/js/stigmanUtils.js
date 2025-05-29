var statusText;

function renderPct ( v, m, r ) {
	const pct = v > 0 && v <= 0.5 ? 1 : v >= 99.5 && v < 100 ? 99 : Math.round(v)
	const symbol = v > 0 && v < 1 ? '<' : v > 99 && v < 100 ? '>' : ''
	const mercuryCls = pct >= 100 ? 'sm-cell-mercury-low' : pct >= 50 ? 'sm-cell-mercury-medium' : 'sm-cell-mercury-high'
	let markup = `
	<div class="sm-cell-thermometer-text">
		${symbol}${pct}%
	</div>
	<div class="sm-cell-thermometer-bg">
		<div class="${mercuryCls}" style="width: ${pct}%;">&nbsp;</div>
	</div>`
	return markup
}

function renderPctAllHigh ( v, m, r, ri, ci, s ) {
	const pct = v > 0 && v <= 0.5 ? 1 : v >= 99.5 && v < 100 ? 99 : Math.round(v)
	const symbol = v > 0 && v < 1 ? '<' : v > 99 && v < 100 ? '>' : ''
	const mercuryCls = 'sm-cell-mercury-high'
	let markup = `
	<div class="sm-cell-thermometer-text">
		${symbol}${pct}%
	</div>
	<div class="sm-cell-thermometer-bg">
		<div class="${mercuryCls}" style="width: ${pct}%;">&nbsp;</div>
	</div>`
	return markup
}

function durationToNow(date, ago = false) {
	if (!(date instanceof Date)) {
		date = new Date(date)
	}
	let d = Math.abs(date - new Date()) / 1000 // delta
	const r = {} // result
	const s = { // structure
			// year: 31536000,
			// month: 2592000,
			// week: 604800, // uncomment row to ignore
			day: 86400,   // feel free to add your own row
			hour: 3600,
			minute: 60,
			second: 1
	};
	
	Object.keys(s).forEach(function(key){
			r[key] = Math.floor(d / s[key]);
			d -= r[key] * s[key];
	})
	let durationStr = r.day > 0 ? `${r.day} d` : r.hour > 0 ? `${r.hour} h` : r.minute > 0 ? `${r.minute} m` : `now`
	if (ago && durationStr !== 'now') {
		durationStr += ' ago'
	}
	return durationStr
}

function renderDurationToNow(date, md = {}) {
	if (!date) {
		return '-'
	}
	if (!(date instanceof Date)) {
		date = new Date(date)
	}
	const durationStr = durationToNow(date)
	let dateFormatted = Ext.util.Format.date(date,'Y-m-d H:i T')
	md.attr = ` ext:qwidth=130 ext:qtip="${dateFormatted}"`;
	return durationStr 
}

function initProgress (title,text,storeId,iframe) {
	var pb = new Ext.ProgressBar({
		text: text
		,id: 'pbar1'
		,flex: 0
		,textLog: ''
		,listeners: {
			destroy: function () {
				var one = 1;
			}
		}
	});
	
	var st = new Ext.form.TextArea({
		id: 'statusText1'
		,cls: 'sm-progress-textarea'
		,readOnly: true
		,flex: 3
		,margins: {
			top: 10
			,bottom: 0
			,left: 0
			,right: 0
		}
	});
	//	pb.reset();

	var pbWindow = new Ext.Window({
		title: title,
		modal: true,
		closable: true, // 'false' for production
		width: '50%',
		height: 600,
		id: 'uploadWindow',
		layout: {
			type: 'vbox',
			align: 'stretch'
		},
		plain:true,
		bodyStyle:'padding:5px;',
		listeners: {
			close: function () {
				if (storeId != undefined) {
					reloadStore(storeId);
				}
			}
		},
		buttons: [{
			xtype: 'tbbutton'
			,text: 'Save log...'
			,download: 'log.txt'
			,disabled: false
			,handler: function(btn,e) {
				let logtext = Ext.getCmp("statusText1").getRawValue();
				let blob = new Blob([logtext],{type:"text/plain;charset=utf-8"});
				if (window.navigator.msSaveOrOpenBlob){
					navigator.msSaveOrOpenBlob(blob,btn.download);
				} else {
					let a = window.document.createElement("a");
					a.style.display="none";
					a.href = window.URL.createObjectURL(blob);
					a.download = btn.download;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					//let href = encodeURI("data:text/plain;charset=utf-8," + logtext)
					//btn.setHref(href);
				}
			}
		},{
			text: 'Close'
			,disabled: false
			,handler: function(btn,e){
				pbWindow.close();
			}
		}],
		buttonAlign:'center',
		items: [pb,st]
	});
	statusText = '';
	pbWindow.show(Ext.getBody());

}

function updateProgress (value,text) {
	var pb = Ext.getCmp("pbar1");
	pb.updateProgress(value,SM.he(text));
}

function updateStatusText (text, noNL, replace) {
	var noNL = noNL || false;
	var st = Ext.getCmp("statusText1");
	if (noNL) {
		statusText += text;
	} else {
		statusText += text + "\n";
	}
	st.setRawValue(statusText);
	st.getEl().dom.scrollTop = 99999; // scroll to bottom
}

function resetProgress () {
	var pb = Ext.getCmp("pbar1");
	pb.updateProgress(0,"");
}

function closeProgress () {
	var uw = Ext.getCmp("uploadWindow");
	uw.close();
}

function reloadStore (id) {
	var store = Ext.StoreMgr.lookup(id);
	store.reload();
}

function Sm_HistoryData (idAppend) {
	const _this = this
	function engineResultConverter (v,r) {
    return r.resultEngine ? 
      (r.resultEngine.overrides?.length ? 'override' : 'engine') : 
      (r.result ? 'manual' : '')
  }

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
      if (c.data.statusLabel) a[c.data.statusLabel]++
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

	this.fields = Ext.data.Record.create([
		{
			name:'ruleId',
			type: 'string'
		},
		{
			name:'result',
			type: 'string'
		},
		{
			name:'detail',
			type:'string'
		},
		{
			name:'comment',
			type:'string'
		},
    'resultEngine',
    {
      name: 'engineResult',
      convert: engineResultConverter
    },
		{
			name:'userId',
			type:'string'
		},{
			name:'username',
			type:'string'
		},
		{
			name:'touchTs',
			type:'date',
			dateFormat: 'c'
		},
		{
			name:'statusLabel',
			type:'string',
			mapping: 'status.label'
		},
		'status'
	]);

	this.store = new Ext.data.JsonStore({
		root: '',
		storeId: 'historyStore' + idAppend,
		fields: this.fields,
		sortInfo: {
			field: 'touchTs',
			direction: 'DESC' // or 'DESC' (case sensitive for local sorting)
		},
		listeners: {
      datachanged: function (store) {
        _this.grid?.statSprites?.setText(getStatsString(store))
      }
    },
		idProperty: (v) => {
			return v.touchTs
		}
	});

	expander = new Ext.ux.grid.RowExpander2({
		tpl: new Ext.XTemplate(
			'<tpl if="data.detail">',
		  '<p><b>Detail:</b> {[SM.TruncateRecordProperty(values, "detail")]}</p>',
		  '</tpl>',
		  '<tpl if="data.comment">',
		  '<p><b>Comment:</b> {[SM.TruncateRecordProperty(values, "comment")]}</p>',
		  '</tpl>',
		  '<tpl if="data.status">',
		  '<p><b>Status user:</b> {[SM.he(values.data.status.user.username)]}</p>',
		  '</tpl>',
		  '<tpl if="data.status">',
		  '<p><b>Status text:</b> {[SM.he(values.data.status.text)]}</p>',
		  '</tpl>'
		)
	})

	const historyTotalTextCmp = new SM.RowCountTextItem ({
    store: this.store,
		noun: 'review',
		iconCls: 'sm-stig-icon'
  })

	const historyExportBtn = new Ext.ux.ExportButton({
		hasMenu: false,
		exportType: 'grid',
		gridBasename: `Log`,
		iconCls: 'sm-export-icon',
		text: 'CSV'
	})
		
	this.grid = new Ext.grid.GridPanel({
		layout: 'fit',
    enableDragDrop: true,
    ddGroup: 'gridDDGroup',
		plugins: expander,
		border: true,
		id: 'historyGrid' + idAppend,
		store: this.store,
		stripeRows:true,
		view: new SM.ColumnFilters.GridView({
			forceFit:true,
			emptyText: 'No log to display.',
			deferEmptyText:false,
			listeners: {
				filterschanged: function (view, item, value) {
				  _this.store.filter(view.getFilterFns())  
				}
			}		
		}),
    bbar: [
			historyExportBtn,
			'->',
			{
				xtype: 'tbtext',
				ref: '../statSprites'
			},
			'-',	
			historyTotalTextCmp
		],
		columns: [
			expander,
			{ 	
				header: "Timestamp",
				width: 120,
				resizeable: false,
				dataIndex: 'touchTs',
				sortable: true,
				align: 'left',
				xtype: 'datecolumn',
				format:	'Y-m-d H:i:s T'
			},
			{ 
				id:'ruleId' + idAppend,
				header: "Rule",
				width: 140,
				fixed: true,
				dataIndex: 'ruleId',
				// renderer: renderResult,
				sortable: true,
				filter: {type:'values', renderer: SM.ColumnFilters.Renderers.result}
			},
			{ 
				id:'result' + idAppend,
				header: "Result",
				width: 50,
				fixed: true,
				dataIndex: 'result',
				renderer: renderResult,
				sortable: true,
				filter: {type:'values', renderer: SM.ColumnFilters.Renderers.result}
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
				dataIndex: 'statusLabel',
				sortable: true,
				renderer: renderStatuses,
				filter: {type:'values', renderer: SM.ColumnFilters.Renderers.status}
			},
			{ 	
				header: "User", 
				width: 50,
				dataIndex: 'username',
				sortable: true,
				filter: {type:'values'}
			}
		]
	});
}

function sortGroupId (groupId) {
	function padZero(a,b){
		return(1e15+a+"").slice(-b)
	};
	var vNum = groupId.match(/^V-(\d+)/);
	if (vNum == null) {
		return groupId;
	} else {
		return padZero(vNum[1],8);
	}
}

function sortRuleId (ruleId) {
	function padZero(a,b){
		return(1e15+a+"").slice(-b)
	};
	var vNum = ruleId.match(/^SV-(\d+)r*/);
	if (vNum == null) {
		return ruleId;
	} else {
		return padZero(vNum[1],8);
	}
}

function sortSeverity (severity) {
	switch (severity) {
		case 'mixed':
			return 0
		case 'low':
			return 1
		case 'medium':
			return 2
		case 'high':
			return 3
	}
}

function getFileIcon (filename) {
	var extension = filename.substr((~-filename.lastIndexOf(".") >>> 0) + 2).toLowerCase(); //http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/1203361#1203361
	switch (extension) {
		case 'doc':
		case 'docx':
			return 'img/page_word.png';
		case 'pdf':
			return 'img/page_white_acrobat.png';
		case 'jpg':
		case 'png':
		case 'gif':
		case 'bmp':
			return 'img/page_white_camera.png';
		case 'xls':
		case 'xlsx':
			return 'img/page_excel.png';
		case 'ppt':
		case 'pptx':
			return 'img/page_white_powerpoint.png';
		case 'zip':
			return 'img/page_white_compressed.png';
		default:
			return 'img/page.png';
	}
}

// encodeSm(): String
// returns JSON encoded array
function encodeSm (sm,field) {
	var myArray = new Array;
	var selArray = sm.getSelections();
	for (var i=0; i < selArray.length; i++) {
		myArray.push(selArray[i].data[field]);
	}
	return JSON.stringify(myArray);
}

function renderResult(val, metaData, record, rowIndex, colIndex, store) {
	if (!val) return ''
	return `<div class="sm-grid-result-sprite ${SM.RenderResult[val]?.css}" ext:qtip="${val}">${SM.RenderResult[val]?.textDisa}</div>`
}

function renderEngineResult(val, metadata) {
	if (!val) return ''
	let iconCls, tipText
	switch (val) {
		case 'engine':
			metadata.attr = 'exportvalue="engine"'
			tipText = 'Engine result',
			iconCls = 'sm-engine-result-icon'
			break
		case 'override':
			metadata.attr = 'exportvalue="override"'
			tipText = 'Engine override',
			iconCls = 'sm-engine-override-icon'
			break
		case 'manual':
			metadata.attr = 'exportvalue="manual"'
			tipText = 'Manual result',
			iconCls = 'sm-engine-manual-icon'
			break
			
	}
	return `<div class="${iconCls}" ext:qtip="${tipText}"></div>`
}

function renderStatuses(val, metaData, record, rowIndex, colIndex, store) {
	var statusIcons = '';
	const exportvalues = [] 
	switch (val) {
		case 'saved':
			exportvalues.push('Saved')
			statusIcons += '<img src="img/save-icon.svg" width=12 height=12 ext:qtip="Saved" style="padding-top: 1px;">';
			break;
		case 'submitted':
			exportvalues.push('Submitted')
			statusIcons += '<img src="img/ready-16.png" width=12 height=12 ext:qtip="Submitted" style="padding-top: 1px;">';
			break;
		case 'rejected':
			exportvalues.push('Rejected')
			statusIcons += '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Rejected" style="padding-top: 1px;">';
			break;
		case 'accepted':
			exportvalues.push('Accepted')
			statusIcons += '<img src="img/star.svg" width=12 height=12 ext:qtip="Accepted" style="padding-top: 1px;">';
			break;
		default:
			statusIcons += '<img src="img/pixel.gif" width=12 height=12>';
			break;
	}
	// statusIcons += '<img src="img/pixel.gif" width=4 height=12>';
	// if (record.data.resultEngine && !record.data.resultEngine.overrides?.length) {
	// 	exportvalues.push('ResultEngine')
	// 	statusIcons += '<img src="img/bot.svg" width=12 height=12 ext:qtip="Automated evaluation" style="padding-top: 1px;">';
	// } else {
	// 	statusIcons += '<img src="img/pixel.gif" width=12 height=12>';
	// }
	metaData.attr = `exportvalue="${exportvalues.join(',')}"`
	return statusIcons;
}

function renderStatus(val) {
	switch (val) {
		case 'submitted':
			return '<img src="img/ready-16.png" width=12 height=12 ext:qtip="Submitted">';
		case 'rejected':
			return '<img src="img/rejected-16.png" width=12 height=12 ext:qtip="Rejected">';
		case 'accepted':
			return '<img src="img/star.svg" width=12 height=12 ext:qtip="Accepted">';
		default:
			return '<img src="img/pixel.gif" width=12 height=12>';
	}
}

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


function columnWrap(val, meta){
	meta.css = 'sm-col-wrap'
	return val
}

// quick access to css classes by risk rating
function getRiskClass(riskRating) {
  switch (riskRating) {
    case 'Very High': return 'sm-cora-risk-very-high';
    case 'High': return 'sm-cora-risk-high';
    case 'Moderate': return 'sm-cora-risk-moderate';
    case 'Low': return 'sm-cora-risk-low';
    case 'Very Low': return 'sm-cora-risk-very-low';
  }
}


function calculateCoraRiskRating(metrics) {
  const weights = {
    catI: 10,
    catII: 4,
    catIII: 1
  }

  const assessments = metrics.assessmentsBySeverity
  const assessed = metrics.assessedBySeverity
  const findings = metrics.findings 

  // CAT I (High)
  const assignedHigh = assessments.high
  const assessedHigh = assessed.high
  const findingsHigh = findings.high
  const rawCatI = assignedHigh > 0 ? ((assignedHigh - assessedHigh) + findingsHigh) / assignedHigh: 0

  // CAT II (Medium)
  const assignedMed = assessments.medium
  const assessedMed = assessed.medium
  const findingsMed = findings.medium
  const rawCatII = assignedMed > 0 ? ((assignedMed - assessedMed) + findingsMed) / assignedMed: 0

  // CAT III (Low)
  const assignedLow = assessments.low
  const assessedLow = assessed.low
  const findingsLow = findings.low
  const rawCatIII = assignedLow > 0 ? ((assignedLow - assessedLow) + findingsLow) / assignedLow : 0

  let totalWeight = 0
  let totalWeightedRisk = 0

  if (assignedHigh > 0) {
    totalWeightedRisk += rawCatI * weights.catI
    totalWeight += weights.catI
  }

  if (assignedMed > 0) {
    totalWeightedRisk += rawCatII * weights.catII
    totalWeight += weights.catII
  }

  if (assignedLow > 0) {
    totalWeightedRisk += rawCatIII * weights.catIII
    totalWeight += weights.catIII
  }

  const weightedAvg = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0

  const weightedCatI = totalWeight > 0 && assignedHigh > 0 ? (rawCatI * weights.catI) / totalWeight : 0;
  const weightedCatII = totalWeight > 0 && assignedMed > 0 ? (rawCatII * weights.catII) / totalWeight : 0;
  const weightedCatIII = totalWeight > 0 && assignedLow > 0 ? (rawCatIII * weights.catIII) / totalWeight : 0;

  let riskRating = ''
  const isVeryLowRisk = rawCatI === 0 && rawCatII === 0 && rawCatIII === 0
  const isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05

  if (isVeryLowRisk) {
    riskRating = 'Very Low'
  } else if (isLowRisk) {
    riskRating = 'Low'
  } else if (weightedAvg >= 0.2) {
    riskRating = 'Very High'
  } else if (weightedAvg >= 0.1) {
    riskRating = 'High'
  } else if (weightedAvg > 0) {
    riskRating = 'Moderate'
  }

  return {
    weightedAvg,
    riskRating,
    percentages: {
      catI: rawCatI,
      catII: rawCatII,
      catIII: rawCatIII
    },
    weightedContributions: {
      catI: weightedCatI,
      catII: weightedCatII,
      catIII: weightedCatIII
    }
  }
}