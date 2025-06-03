// override top-ancestor initComponent to normalize the 'stateful' property
// since other framework code checks 'if (this.stateful !== false)'
Ext.Component.prototype.initComponent = function(){
    if(this.listeners){
        this.on(this.listeners);
        delete this.listeners;
    }
    this.enableBubble(this.bubbleEvents);
    // an absent property is explicitly set to false
    this.stateful = !!this.stateful
};

Ext.override(Ext.grid.EditorGridPanel, {
    initEvents : function(){
        Ext.grid.EditorGridPanel.superclass.initEvents.call(this);
        // do not want the framework's handling of mousewheel
        // this.getGridEl().on('mousewheel', this.stopEditing.createDelegate(this, [true]), this);
        this.on('columnresize', this.stopEditing, this, [true]);

        if(this.clicksToEdit == 1){
            this.on("cellclick", this.onCellDblClick, this);
        }else {
            var view = this.getView();
            if(this.clicksToEdit == 'auto' && view.mainBody){
                view.mainBody.on('mousedown', this.onAutoEditClick, this);
            }
            this.on('celldblclick', this.onCellDblClick, this);
        }
    }
})
Ext.override(Ext.grid.CheckboxSelectionModel, {
    onMouseDown : function(e, t){
        if(e.button === 0 && t.className == 'x-grid3-row-checker'){ // Only fire if left-click
            e.stopEvent();
            var row = e.getTarget('.x-grid3-row');
            if(row){
                var index = row.rowIndex;
                if(this.isSelected(index)){
                    this.deselectRow(index);
                }else{
                    this.selectRow(index, true);
                    this.grid.getView().focusRow(index);
                }
            }
            const hd = this.grid.view.innerHd.querySelector('.x-grid3-hd-row .x-grid3-td-checker .x-grid3-hd-checker')

            if (hd) {
                const hdState = this.selections.length === 0 ? null : this.grid.store.getCount() === this.selections.length ? 'on' : 'ind'
                hd.classList.remove('x-grid3-hd-checker-on')
                hd.classList.remove('x-grid3-hd-checker-ind')
                if (hdState) {
                    hd.classList.add(`x-grid3-hd-checker-${hdState}`)
                }
            }
        }
    },
    onHdMouseDown : function(e, t) {
        if(t.className == 'x-grid3-hd-checker'){
            e.stopEvent()
            var hd = Ext.fly(t.parentNode);
            var isChecked = hd.hasClass('x-grid3-hd-checker-on')
            var isIndeterminate = hd.hasClass('x-grid3-hd-checker-ind')
            if (isChecked ) {
                hd.removeClass('x-grid3-hd-checker-on')
                this.suspendEvents(false)
                this.deselectRange(0, this.grid.store.getCount() - 1)
                this.resumeEvents()
                this.fireEvent('selectionchange', this)

            }
            else {
                if (isIndeterminate) hd.removeClass('x-grid3-hd-checker-ind')
                hd.addClass('x-grid3-hd-checker-on')
                this.suspendEvents(false)
                this.selectRange(0, this.grid.store.getCount() - 1)
                this.resumeEvents()
                this.fireEvent('selectionchange', this)
        
            }
        }
    }
})


// Replace Ext.getBody() to return the Ext.Element below the
// classification banner, if one is present
const origGetBody = Ext.getBody
Ext.getBody = function () {
    return SM.contentEl || origGetBody()
}
Ext.LoadMask.prototype.onBeforeLoad = function() {
    if(!this.disabled){
        if (this.store.smMaskDelay) {
            if (this.smTask) {
                clearTimeout(this.smTask)
            }
            this.smTask = setTimeout(this.el.mask.bind(this.el), this.store.smMaskDelay, this.msg, this.msgCls)
        }
        else {
            this.el.mask(this.msg, this.msgCls)
        }
    }
}
Ext.LoadMask.prototype.onLoad = function() {
    if (this.smTask) {
        clearTimeout(this.smTask)
    }
    this.el.unmask(this.removeMask);
}

// patch DragDropMgr to prevent a "hung" drop with cursor stuck
// Source: carl.a.smigielski@saic.com
Ext.dd.DragDropMgr.getZIndex = function(element) {
    var body = document.body,
        z,
        zIndex = -1;

    element = Ext.getDom(element);
    // patch to ensure element is not null
    while (element && element !== body) {
        if (!isNaN(z = Number(Ext.fly(element).getStyle('zIndex')))) {
            zIndex = z;
        }
        element = element.parentNode;
    }
    return zIndex;
}

// replace 'window' with 'node' as scope: this.directFn.apply(node, args);
// Source: carl.a.smigielski@saic.com
Ext.override(Ext.tree.TreeLoader, {
    requestData : function(node, callback, scope){
        if(this.fireEvent("beforeload", this, node, callback) !== false){
            if(this.directFn){
                var args = this.getParams(node);
                args.push(this.processDirectResponse.createDelegate(this, [{callback: callback, node: node, scope: scope}], true));
                // replace 'window' with 'node' as scope
                this.directFn.apply(node, args);
            }else{
                this.transId = Ext.Ajax.request({
                    method:this.requestMethod,
                    url: this.dataUrl||this.url,
                    success: this.handleResponse,
                    failure: this.handleFailure,
                    scope: this,
                    argument: {callback: callback, node: node, scope: scope},
                    params: this.getParams(node)
                });
            }
        }else{
            // if the load is cancelled, make sure we notify
            // the node that we are done
            this.runCallback(callback, scope || node, []);
        }
    }
})

// // Lower default z-index value from 11000 to 9000
// // Source: carl.a.smigielski@saic.com
// Ext.override(Ext.Layer, {
//     getZIndex: function(){
//         return this.zindex || parseInt((this.getShim() || this).getStyle('z-index'), 10) || 9000;
//     }
// });

// Prevent changing readOnly checkboxes
// Source: https://forum.sencha.com/forum/showthread.php?90531-Readonly-Checkbox-Override
Ext.override(Ext.form.Checkbox, {
    onClick: function (e,o) {
     if (this.readOnly === true){
          e.preventDefault();
     } else {
        if(this.el.dom.checked != this.checked){
        this.setValue(this.el.dom.checked);
        }
     }
    }
});

// ext-base.js adds a 'remove' method to Array.prototype
// By default, that property is enumerated by for ... in
// This breaks fast-xml-parser 3.14.3 (among others?) so we make the property not enumerable
// Source: carl.a.smigielski@saic.com
Object.defineProperty(Array.prototype, 'remove', { enumerable: false })

// Column xtype for UNIX timestamps
// Source: carl.a.smigielski@saic.com
Ext.grid.Column.types.timestampcolumn = Ext.extend(Ext.grid.Column, {
    /**
     * @cfg {String} format
     * A formatting string as used by {@link Date#format} to format a Date for this Column
     * (defaults to <tt>'m/d/Y'</tt>).
     */
    format : 'Y-m-d H:i:s',
    constructor: function(cfg){
        Ext.grid.Column.types.timestampcolumn.superclass.constructor.call(this, cfg);
        this.renderer = (v) => v ? Ext.util.Format.date(new Date(v * 1000), this.format) : "None"
    }
});


// Flat style Windows by default
// Source: carl.a.smigielski@saic.com
Ext.override(Ext.Window, {
    cls: 'sm-round-panel',
    frame: false,
    resizable: false,
    shadow: false,
    // private
    onRender : function(ct, position){
        Ext.Window.superclass.onRender.call(this, ct, position);

        if(this.plain){
            this.el.addClass('x-window-plain');
        }

        // this element allows the Window to be focused for keyboard events
        this.focusEl = this.el.createChild({
                    tag: 'a', href:'#', cls:'x-dlg-focus',
                    tabIndex:'-1', html: '&#160;'});
        this.focusEl.swallowEvent('click', true);

        this.proxy = this.el.createProxy('x-window-proxy');
        this.proxy.enableDisplayMode('block');

        if(this.modal){
            this.mask = this.container.createChild({cls:'ext-el-mask-modal'}, this.el.dom);
            this.mask.enableDisplayMode('block');
            this.mask.hide();
            this.mon(this.mask, 'click', this.focus, this);
        }
        if(this.maximizable){
            this.mon(this.header, 'dblclick', this.toggleMaximize, this);
        }
    },

})

// Form.getFieldValues
// Add boolean parameter to return disabled fields
// Source: carl.a.smigielski@saic.com
Ext.override(Ext.form.BasicForm, {
    getFieldValues: function(dirtyOnly, getDisabled){
        var o = {},
            n,
            key,
            val;
        this.items.each(function(f) {
            if ((!f.disabled || getDisabled) && (dirtyOnly !== true || f.isDirty())) {
                n = f.getName();
                key = o[n];
                val = f.getValue();

                if(Ext.isDefined(key)){
                    if(Ext.isArray(key)){
                        o[n].push(val);
                    }else{
                        o[n] = [key, val];
                    }
                }else{
                    o[n] = val;
                }
            }
        });
        return o;
    }
})

// Promisfied Ajax.request() method
// Source: Carl Smigielski
Ext.override(Ext.Ajax, {
    requestPromise : async function (optionsIn) {
        const _this = this
        function requestPromisfied (options) {
            return new Promise ( (resolve, reject) => {
                _this.request({
                    ...options,        
                    success: function (response, options) {
                        resolve ({
                            response: response,
                            options: options
                        })
                    },
                    failure: function (response, options) {
                        reject ({
                            message: `${options.method} ${options.url}\n${response.responseText}`,
                            response: response,
                            options: options
                        })
                    },
                })
            })
        }
        let response, options
        try {
            ;({response, options} = await requestPromisfied(optionsIn))
        }
        catch (e) {
            throw new SM.Error.ExtRequestError(e)
        }
        if (optionsIn.responseType !== 'json') {
            return {response, options}   
        }
        try {
            return JSON.parse(response.responseText || '""')
        }
        catch (e) {
            throw new SM.Error.NonJsonResponse({response, options, parseError: e})
        }
    }
})

// Promisfied Ext.MessageBox.confirm method
// Source: Carl Smigielski
SM.confirmPromise = function (title, msg) {
    return new Promise ( (resolve, reject) => {
        callback = function (id) {
            if (id !== undefined) {
                resolve (id)
            }
            else {
                reject (id)
            }
        }
        Ext.Msg.confirm( title, msg, callback )
    })
}

// custom Vtype for vtype:'IPAddress'
Ext.apply(Ext.form.VTypes, {
    IPAddress:  function(v) {
        //return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
		return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test(v);
    },
    IPAddressText: 'Must be an IP address (n.n.n.n)',
    IPAddressMask: /[\d\.]/i
});

// Asterisk for required form fields
Ext.override(Ext.layout.FormLayout, {
    getTemplateArgs: function(field) {
        var noLabelSep = !field.fieldLabel || field.hideLabel;
        var labelSep = (typeof field.labelSeparator == 'undefined' ? this.labelSeparator : field.labelSeparator);
        if (field.allowBlank === false) labelSep += '<span style="color: #808080; padding-left: 2px;">*</span>';
        return {
            id: field.id,
            label: field.fieldLabel,
            labelStyle: field.labelStyle||this.labelStyle||'',
            elementStyle: this.elementStyle||'',
            labelSeparator: noLabelSep ? '' : labelSep,
            itemCls: (field.itemCls||this.container.itemCls||'') + (field.hideLabel ? ' x-hide-label' : ''),
            clearCls: field.clearCls || 'x-form-clear-left'
        };
    }
});

Ext.override(Ext.TabPanel, {
	idDelimiter: "!!"
});

// Grid hold position
Ext.override(Ext.grid.GridView, {
   // holdPosition: false,
    onLoad : function(){
        if (!this.holdPosition) this.scrollToTop();
        //this.holdPosition = false
    }
});

// Force fit Min & Max
Ext.override(Ext.grid.GridView, {
    initElements : function() {
        var Element  = Ext.Element,
            el       = Ext.get(this.grid.getGridEl().dom.firstChild),
            mainWrap = new Element(el.child('div.x-grid3-viewport')),
            mainHd   = new Element(mainWrap.child('div.x-grid3-header')),
            scroller = new Element(mainWrap.child('div.x-grid3-scroller'));
        
        if (this.grid.hideHeaders) {
            mainHd.setDisplayed(false);
        }
        
        // Removed setting overflow-x to 'hidden' in scroller
        
        Ext.apply(this, {
            el      : el,
            mainWrap: mainWrap,
            scroller: scroller,
            mainHd  : mainHd,
            innerHd : mainHd.child('div.x-grid3-header-inner').dom,
            mainBody: new Element(Element.fly(scroller).child('div.x-grid3-body')),
            focusEl : new Element(Element.fly(scroller).child('a')),
            
            resizeMarker: new Element(el.child('div.x-grid3-resize-marker')),
            resizeProxy : new Element(el.child('div.x-grid3-resize-proxy'))
        });
        
        this.focusEl.swallowEvent('click', true);
    },
    layout : function(initial) {
        if (!this.mainBody) {
            return; // not rendered
        }

        var grid       = this.grid,
            gridEl     = grid.getGridEl(),
            gridSize   = gridEl.getSize(true),
            gridWidth  = gridSize.width,
            gridHeight = gridSize.height,
            scroller   = this.scroller,
            scrollStyle, headerHeight, scrollHeight,
            // added support for forceFitMin and forceFitMax
            forceFitMin = this.forceFitMin || 0,
            forceFitMax = this.forceFitMax || Infinity;
        
        if (gridWidth < 20 || gridHeight < 20) {
            return;
        }
        
        if (grid.autoHeight) {
            scrollStyle = scroller.dom.style;
            scrollStyle.overflow = 'visible';
            
            if (Ext.isWebKit) {
                scrollStyle.position = 'static';
            }
        } else {
            this.el.setSize(gridWidth, gridHeight);
            
            headerHeight = this.mainHd.getHeight();
            scrollHeight = gridHeight - headerHeight;
            
            scroller.setSize(gridWidth, scrollHeight);
            
            if (this.innerHd) {
                this.innerHd.style.width = (gridWidth) + "px";
            }
        }
        
        // added support for forceFitMin and forceFitMax
        if (this.forceFit && (gridWidth > forceFitMin  && gridWidth < forceFitMax )|| (initial === true && this.autoFill)) {
            if (this.lastViewWidth != gridWidth) {
                this.fitColumns(false, false);
                this.lastViewWidth = gridWidth;
            }
        } else {
            this.autoExpand();
            this.syncHeaderScroll();
        }
        
        this.onLayout(gridWidth, scrollHeight);
    },

})

// Two overrides below keep the backscape in a readOnly text field from causing the browser to go back in history
Ext.override(Ext.form.TextField, {
	enableKeyEvents : true,
	onKeyDown: function(e) {
		if ((this.readOnly == true || this.editable == false) && e.getCharCode() == e.BACKSPACE) {
			e.preventDefault();
		}
		this.fireEvent('keydown', this, e);
	}
});
Ext.override(Ext.form.TextArea, {
	enableKeyEvents : true,
	onKeyDown: function(e) {
		if ((this.readOnly == true || this.editable == false) && e.getCharCode() == e.BACKSPACE) {
			e.preventDefault();
		}
		this.fireEvent('keydown', this, e);
	}
});

// Useful override for clearing the dirty flag for all form fields
Ext.override(Ext.form.BasicForm, {
    clearDirty: function() {
        var i, it = this.items.items, l = it.length, c;
        for (i = 0; i < l; i++) {
            c = it[i];
            c.originalValue = String(c.getValue());
            if(c.xtype == "compositefield") {
                var j, jt = c.items.items, ljt = jt.length, d;
                for (j = 0; j < ljt; j++) {
                    d = jt[j];
                    d.originalValue = String(d.getValue());
                }            	
            }
        }
    }
});

// START WEBKIT FIX
if (!Ext.isDefined(Ext.webKitVersion)) {
    Ext.webKitVersion = Ext.isWebKit ? parseFloat(/AppleWebKit\/([\d.]+)/.exec(navigator.userAgent)[1], 10) : NaN;
}
/*
 * Box-sizing was changed beginning with Chrome v19.  For background information, see:
 * http://code.google.com/p/chromium/issues/detail?id=124816
 * https://bugs.webkit.org/show_bug.cgi?id=78412
 * https://bugs.webkit.org/show_bug.cgi?id=87536
 * http://www.sencha.com/forum/showthread.php?198124-Grids-are-rendered-differently-in-upcoming-versions-of-Google-Chrome&p=824367
 *
 * */
if (Ext.isWebKit && Ext.webKitVersion >= 535.2) { // probably not the exact version, but the issues started appearing in chromium 19
    Ext.override(Ext.grid.ColumnModel, {
        getTotalWidth: function (includeHidden) {
            if (!this.totalWidth) {
                var boxsizeadj = 2;
                this.totalWidth = 0;
                for (var i = 0, len = this.config.length; i < len; i++) {
                    if (includeHidden || !this.isHidden(i)) {
                        this.totalWidth += (this.getColumnWidth(i) + boxsizeadj);
                    }
                }
            }
            return this.totalWidth;
        }
    });


    Ext.onReady(function() {
        Ext.get(document.body).addClass('ext-chrome-fixes');
        Ext.util.CSS.createStyleSheet('@media screen and (-webkit-min-device-pixel-ratio:0) {.x-grid3-cell{box-sizing: border-box !important;}}', 'chrome-fixes-box-sizing');
    });
}
// END WEB KIT FIX

// START Border layout with percentages
Ext.override(Ext.layout.BorderLayout, {
 onLayout : function(ct, target){
  var collapsed;
  var size = target.getViewSize(), w = size.width, h = size.height;
  if(!this.rendered){
   target.position();
   target.addClass('x-border-layout-ct');
   collapsed = [];
   var items = ct.items.items;
   for(var i = 0, len = items.length; i < len; i++) {
    var c = items[i];
    var pos = c.region;
    if(c.collapsed){
     collapsed.push(c);
    }
    c.collapsed = false;
    var r = this[pos] = pos != 'center' && c.split ?
     new Ext.layout.BorderLayout.SplitRegion(this, c.initialConfig, pos) :
     new Ext.layout.BorderLayout.Region(this, c.initialConfig, pos);
    if(pos == 'north' || pos == 'south'){
     if(typeof c.height == 'string' && c.relHeight === undefined){
      var p = c.height.match(/(\d+)%/);
      if(p[1]){
       c.relHeight = parseInt(p[1], 10) * .01;
      }
     }
     if(c.relHeight !== undefined){
      if(typeof c.relHeight != 'number'){
       c.relHeight = parseFloat(c.relHeight);
      }
      c.height = h * c.relHeight;
     }
     r.minSize = r.minSize || r.minHeight;
     r.maxSize = r.maxSize || r.maxHeight;
    } else if(pos == 'east' || pos == 'west'){
     if(typeof c.width == 'string' && c.relWidth === undefined){
      var p = c.width.match(/(\d+)%/);
      if(p[1]){
       c.relWidth = parseInt(p[1], 10) * .01;
      }
     }
     if(c.relWidth !== undefined){
      if(typeof c.relWidth != 'number'){
       c.relWidth = parseFloat(c.relWidth);
      }
      c.width = w * c.relWidth;
     }
     r.minSize = r.minSize || r.minWidth;
     r.maxSize = r.maxSize || r.maxWidth;
    }
    if(!c.rendered){
     c.cls = c.cls ? c.cls +' x-border-panel' : 'x-border-panel';
     c.render(target, i);
    }
    r.render(target, c);
   }
   this.rendered = true;
  }
  if(w < 20 || h < 20){
   if(collapsed){
    this.restoreCollapsed = collapsed;
   }
   return;
  }else if(this.restoreCollapsed){
   collapsed = this.restoreCollapsed;
   delete this.restoreCollapsed;
  }
  var centerW = w, centerH = h, centerY = 0, centerX = 0;
  var n = this.north, s = this.south, west = this.west, e = this.east, c = this.center;
  if(!c && Ext.layout.BorderLayout.WARN !== false){
   throw 'No center region defined in BorderLayout ' + ct.id;
  }
  if(n && n.isVisible()){
   var b = n.getSize();
   var m = n.getMargins();
   b.width = w - (m.left+m.right);
   if(n.panel.relHeight !== undefined){
    n.height = Math.round(h * n.panel.relHeight);
    b.height = n.minSize && n.height < n.minSize ? n.minSize :
     (n.maxSize && n.height > n.maxSize ? n.maxSize : n.height);
   }
   b.x = m.left;
   b.y = m.top;
   centerY = b.height + b.y + m.bottom;
   centerH -= centerY;
   n.applyLayout(b);
  }
  if(s && s.isVisible()){
   var b = s.getSize();
   var m = s.getMargins();
   b.width = w - (m.left+m.right);
   if(s.panel.relHeight !== undefined){
    s.height = Math.round(h * s.panel.relHeight);
    b.height = s.minSize && s.height < s.minSize ? s.minSize :
     (s.maxSize && s.height > s.maxSize ? s.maxSize : s.height);
   }
   b.x = m.left;
   var totalHeight = (b.height + m.top + m.bottom);
   b.y = h - totalHeight + m.top;
   centerH -= totalHeight;
   s.applyLayout(b);
  }
  if(west && west.isVisible()){
   var b = west.getSize();
   var m = west.getMargins();
   b.height = centerH - (m.top+m.bottom);
   if(west.panel.relWidth !== undefined){
    west.width = Math.round(w * west.panel.relWidth);
    b.width = west.minSize && west.width < west.minSize ? west.minSize :
     (west.maxSize && west.width > west.maxSize ? west.maxSize : west.width);
   }
   b.x = m.left;
   b.y = centerY + m.top;
   var totalWidth = (b.width + m.left + m.right);
   centerX += totalWidth;
   centerW -= totalWidth;
   west.applyLayout(b);
  }
  if(e && e.isVisible()){
   var b = e.getSize();
   var m = e.getMargins();
   b.height = centerH - (m.top+m.bottom);
   if(e.panel.relWidth !== undefined){
    e.width = Math.round(w * e.panel.relWidth);
    b.width = e.minSize && e.width < e.minSize ? e.minSize :
     (e.maxSize && e.width > e.maxSize ? e.maxSize : e.width);
   }
   var totalWidth = (b.width + m.left + m.right);
   b.x = w - totalWidth + m.left;
   b.y = centerY + m.top;
   centerW -= totalWidth;
   e.applyLayout(b);
  }
  if(c){
   var m = c.getMargins();
   var centerBox = {
    x: centerX + m.left,
    y: centerY + m.top,
    width: centerW - (m.left+m.right),
    height: centerH - (m.top+m.bottom)
   };
   c.applyLayout(centerBox);
  }
  if(collapsed){
   for(var i = 0, len = collapsed.length; i < len; i++){
    collapsed[i].collapse(false);
   }
  }
  if(Ext.isIE && Ext.isStrict){
   target.repaint();
  }
 }
});
Ext.override(Ext.layout.BorderLayout.SplitRegion, {
 onSplitMove : function(split, newSize){
  var s = this.panel.getSize();
  this.lastSplitSize = newSize;
  if(this.position == 'north' || this.position == 'south'){
   this.panel.setSize(s.width, newSize);
   if(this.panel.relHeight !== undefined){
    this.state.relHeight = this.panel.relHeight *= newSize / this.height;
   }else{
    this.state.height = newSize;
   }
  }else{
   this.panel.setSize(newSize, s.height);
   if(this.panel.relWidth !== undefined){
    this.state.relWidth = this.panel.relWidth *= newSize / this.width;
   }else{
    this.state.width = newSize;
   }
  }
  this.layout.layout();
  this.panel.saveState();
  return false;
 }
}); 
// END Border layout with percentages


// START enable comboBox setValue() to fire the select event
Ext.override(Ext.form.ComboBox, {
    setValue : function(v, fireSelect){
        var text = v;
        if(this.valueField){
            var r = this.findRecord(this.valueField, v);
            if(r){
                text = r.data[this.displayField];
                if (fireSelect || this.fireSelectOnSetValue) {
					var index = this.store.indexOf(r);
					this.selectedIndex = index;
                    this.fireEvent('select', this, r, index);
                }
            }else if(Ext.isDefined(this.valueNotFoundText)){
                text = this.valueNotFoundText;
            }
        }
        this.lastSelectionText = text;
        if(this.hiddenField){
            this.hiddenField.value = v;
        }
        Ext.form.ComboBox.superclass.setValue.call(this, text);
        this.value = v;
        return this;
    },
    onSelect : function(record, index){
        if(this.fireEvent('beforeselect', this, record, index) !== false){
            this.setValue(record.data[this.valueField || this.displayField]);
            this.collapse();
            if (!this.fireSelectOnSetValue) {
                this.fireEvent('select', this, record, index);
            }
        }
    },

});
// END enable comboBox setValue() to fire the select event

Ext.override(Ext.grid.RowSelectionModel, {
    handleMouseDown : function(g, rowIndex, e){
        if(e.button !== 0 || this.isLocked()){
            return;
        }
        var view = this.grid.getView();
        if(e.shiftKey && !this.singleSelect && this.last !== false){
            var last = this.last;
            this.selectRange(last, rowIndex, e.ctrlKey || e.shiftKey); //csmig added || e.shiftKey 
            this.last = last; // reset the last
            view.focusRow(rowIndex);
        }else{
            var isSelected = this.isSelected(rowIndex);
            if(e.ctrlKey && isSelected){
                this.deselectRow(rowIndex);
            }else if(!isSelected || this.getCount() > 1){
                this.selectRow(rowIndex, e.ctrlKey || e.shiftKey);
                view.focusRow(rowIndex);
            }
        }
    }
});

// Add support for dismissDelay in QuickTip markup
Ext.override(Ext.QuickTip, {
	dismissDelay: 0,
    tagConfig : {
        namespace : "ext",
        attribute : "qtip",
        width : "qwidth",
        target : "target",
        title : "qtitle",
        hide : "hide",
        cls : "qclass",
        align : "qalign",
        anchor : "anchor",
        dismissDelay : "qdmdelay",
   },
    onTargetOver : function(e){
        if(this.disabled){
            return;
        }
        this.targetXY = e.getXY();
        var t = e.getTarget();
        if(!t || t.nodeType !== 1 || t == document || t == document.body){
            return;
        }
        if(this.activeTarget && ((t == this.activeTarget.el) || Ext.fly(this.activeTarget.el).contains(t))){
            this.clearTimer('hide');
            this.show();
            return;
        }
        if(t && this.targets[t.id]){
            this.activeTarget = this.targets[t.id];
            this.activeTarget.el = t;
            this.anchor = this.activeTarget.anchor;
            if(this.anchor){
                this.anchorTarget = t;
            }
            this.delayShow();
            return;
        }
        var ttp, et = Ext.fly(t), cfg = this.tagConfig, ns = cfg.namespace;
        if(ttp = this.getTipCfg(e)){
            var autoHide = et.getAttribute(cfg.hide, ns);
            this.activeTarget = {
                el: t,
                text: ttp,
                width: et.getAttribute(cfg.width, ns),
                autoHide: autoHide != "user" && autoHide !== 'false',
                title: et.getAttribute(cfg.title, ns),
                cls: et.getAttribute(cfg.cls, ns),
                align: et.getAttribute(cfg.align, ns)
                ,dismissDelay: parseInt(et.getAttribute(cfg.dismissDelay, ns),10) 
            };
            this.anchor = et.getAttribute(cfg.anchor, ns);
            if(this.anchor){
                this.anchorTarget = t;
            }
            this.delayShow();
        }
    }
});

// Plugin to TabPanel that allows tabs 
// - to be closed with middle-click (mouse wheel)
// - to be made non-ephemeral when double-clicked
// - to expand the navigation tree to the source node 
// In TabPanel configuration, set "plugins: new SM.TabEnhancements()"
// Modified from Daniel Jagszent's example at: 
// https://forum.sencha.com/forum/showthread.php?36414-Closing-a-tab-with-the-mouse-wheel...-how&p=172321&viewfull=1#post172321
// Source: carl.a.smigielski@saic.com
SM.TabEnhancements = function(){
    let tabs;
    function onMouseDown(e){
        e.preventDefault()
        const t = tabs.findTargets(e)
        const b = e.browserEvent.button
        const w = e.browserEvent.which
        const clickCount = e.browserEvent.detail
        const isMiddleButtonPressed = (w === null || w === undefined) ? b==1 : w==2; // browser dependent: http://unixpapa.com/js/mouse.html
        const isLeftButtonPressed = (w === null || w === undefined) ? b==0 : w==1;

        if (t.item) {
            // expand the navigation tree to the source node
            if (!t.close && t.item.sm_treePath) {
                Ext.getCmp('app-nav-tree').selectPath(t.item.sm_treePath)
            }
            // make tab non-ephemeral
            if (isLeftButtonPressed && clickCount === 2  && t.item.sm_tabMode === 'ephemeral') {
                t.item.makePermanent()
            }         
            // close tab on middle-click
            if (isMiddleButtonPressed) {
                if (t.item.closable) {
                    if (t.item.fireEvent('beforeclose', t.item) !== false) {
                        t.item.fireEvent('close', t.item)
                        tabs.remove(t.item)
                    }
                } else {
                    e.stopPropagation()
                }
            }
        }
    } 
    function onRender() {
        tabs.strip.on('mousedown', onMouseDown)
    }
    this.init = function(tp) {
        tabs = tp
        tabs.on('render', onRender)
    }
}

// GridView masterTpl: rendered without href="#", which suppresses Chrome status bar
// doRender, refreshRow: htmlEncode of record.data
// Source: Carl Smigielski
Ext.override(Ext.grid.GridView,{
    masterTpl: new Ext.Template(
        '<div class="x-grid3" hidefocus="true">',
            '<div class="x-grid3-viewport">',
                '<div class="x-grid3-header">',
                    '<div class="x-grid3-header-inner">',
                        '<div class="x-grid3-header-offset" style="{ostyle}">{header}</div>',
                    '</div>',
                    '<div class="x-clear"></div>',
                '</div>',
                '<div class="x-grid3-scroller">',
                    '<div class="x-grid3-body" style="{bstyle}">{body}</div>',
                    '<a class="x-grid3-focus" tabIndex="-1"></a>',
                '</div>',
            '</div>',
            '<div class="x-grid3-resize-marker">&#160;</div>',
            '<div class="x-grid3-resize-proxy">&#160;</div>',
        '</div>'
    ),
    doRender : function(columns, records, store, startRow, colCount, stripe) {
        var templates = this.templates,
            cellTemplate = templates.cell,
            rowTemplate = templates.row,
            last = colCount - 1,
            tstyle = 'width:' + this.getTotalWidth() + ';',
            // buffers
            rowBuffer = [],
            colBuffer = [],
            rowParams = {tstyle: tstyle},
            meta = {},
            len  = records.length,
            alt,
            column,
            record, i, j, rowIndex;
    
        //build up each row's HTML
        for (j = 0; j < len; j++) {
            record    = records[j];
            colBuffer = [];
    
            rowIndex = j + startRow;
    
            //build up each column's HTML
            for (i = 0; i < colCount; i++) {
                column = columns[i];
                
                meta.id    = column.id;
                meta.css   = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
                meta.attr  = meta.cellAttr = '';
                meta.style = column.style;
                meta.value = column.renderer.call(column.scope, typeof record.data[column.name] === 'string' ? SM.he(record.data[column.name]) : record.data[column.name], meta, record, rowIndex, i, store);
    
                if (Ext.isEmpty(meta.value)) {
                    meta.value = '&#160;';
                }
    
                if (this.markDirty && record.dirty && typeof record.modified[column.name] != 'undefined') {
                    meta.css += ' x-grid3-dirty-cell';
                }
    
                colBuffer[colBuffer.length] = cellTemplate.apply(meta);
            }
    
            alt = [];
            //set up row striping and row dirtiness CSS classes
            if (stripe && ((rowIndex + 1) % 2 === 0)) {
                alt[0] = 'x-grid3-row-alt';
            }
    
            if (record.dirty) {
                alt[1] = ' x-grid3-dirty-row';
            }
    
            rowParams.cols = colCount;
    
            if (this.getRowClass) {
                alt[2] = this.getRowClass(record, rowIndex, rowParams, store);
            }
    
            rowParams.alt   = alt.join(' ');
            rowParams.cells = colBuffer.join('');
    
            rowBuffer[rowBuffer.length] = rowTemplate.apply(rowParams);
        }
    
        return rowBuffer.join('');
    },
    refreshRow: function(record) {
        var store     = this.ds,
            colCount  = this.cm.getColumnCount(),
            columns   = this.getColumnData(),
            last      = colCount - 1,
            cls       = ['x-grid3-row'],
            rowParams = {
                tstyle: String.format("width: {0};", this.getTotalWidth())
            },
            colBuffer = [],
            cellTpl   = this.templates.cell,
            rowIndex, row, column, meta, css, i;
        
        if (Ext.isNumber(record)) {
            rowIndex = record;
            record   = store.getAt(rowIndex);
        } else {
            rowIndex = store.indexOf(record);
        }
        
        //the record could not be found
        if (!record || rowIndex < 0) {
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
                id      : column.id,
                style   : column.style,
                css     : css,
                attr    : "",
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
        
        this.fireEvent('rowupdated', this, rowIndex, record);
    },
    renderHeaders : function() {
      let colModel   = this.cm,
          templates  = this.templates,
          headerTpl  = templates.hcell,
          properties = {},
          colCount   = colModel.getColumnCount(),
          last       = colCount - 1,
          cells      = [],
          i, cssCls;
      
      for (i = 0; i < colCount; i++) {
          if (i == 0) {
              cssCls = 'x-grid3-cell-first ';
          } else {
              cssCls = i == last ? 'x-grid3-cell-last ' : '';
          }
          
          properties = {
              id     : colModel.getColumnId(i),
              value  : colModel.getColumnHeader(i) || '',
              style  : this.getColumnStyle(i, true),
              css    : cssCls,
              tooltip: this.getColumnTooltip(i)
          };
          
          if (colModel.config[i].align == 'right') {
              // changed from framework default of 16px
              properties.istyle = 'padding-right: 4px;';
          } else {
              delete properties.istyle;
          }
          
          cells[i] = headerTpl.apply(properties);
      }
      
      return templates.header.apply({
          cells : cells.join(""),
          tstyle: String.format("width: {0};", this.getTotalWidth())
      });
    }
})

// TreeNodeUI rendered without href="#", which supresses Chrome status bar
// Move checkbox before icon
// Support radio buttons if TreePanel has property "radio" set to true
// Source: Carl Smigielski
Ext.override(Ext.tree.TreeNodeUI,{
    renderElements : function(n, a, targetNode, bulkRender){
        // add some indent caching, this helps performance when rendering a large tree
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        let cb = Ext.isBoolean(a.checked),
            nel,
            cbType = n.ownerTree.radio ? '"radio" name="rg"' : '"checkbox"',
            buf = [
                '<li class="x-tree-node"><div ext:tree-node-id="',
                n.id,
                '" class="x-tree-node-el x-tree-node-leaf x-unselectable ',
                 a.cls,
                 '" unselectable="on">',
                '<span class="x-tree-node-indent">',
                this.indentMarkup,
                "</span>",
                '<img alt="" src="', 
                this.emptyIcon, 
                '" class="x-tree-ec-icon x-tree-elbow" />',
                cb ? ('<input class="x-tree-node-cb" type=' + cbType + ' ' + (a.checked ? 'checked="checked" />' : '/>')) : '',
                '<img alt="" src="',
                a.icon || this.emptyIcon, 
                '" class="x-tree-node-icon',
                (a.icon ? " x-tree-node-inline-icon" : ""),
                (a.iconCls ? " "+a.iconCls : ""),
                '" unselectable="on" />',
                '<a hidefocus="on" class="x-tree-node-anchor" tabIndex="1" ',
                a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", 
                '><span unselectable="on">',
                n.text,
                "</span></a></div>",
                '<ul class="x-tree-node-ct" style="display:none;"></ul>',
                "</li>"
            ].join('');

        if(bulkRender !== true && n.nextSibling && (nel = n.nextSibling.ui.getEl())){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin", nel, buf);
        }else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf);
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        let cs = this.elNode.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        let index = 3;
        if(cb){
            this.iconNode = cs[3];
            this.checkbox = cs[2];
            // fix for IE6
            this.checkbox.defaultChecked = this.checkbox.checked;
            index++;
        }
        else {
            this.iconNode = cs[2];
        }
        this.anchor = cs[index];
        this.textNode = cs[index].firstChild;
    }
})

// TabPanel rendered without href="#", which supresses Chrome status bar
// Source: Carl Smigielski
Ext.override(Ext.TabPanel, {
    itemTpl: new Ext.Template(
        '<li class="{cls}" id="{id}"><a class="x-tab-strip-close"></a>',
        '<a class="x-tab-right"><em class="x-tab-left">',
        '<span class="x-tab-strip-inner"><span class="x-tab-strip-text {iconCls}">{text}</span></span>',
        '</em></a></li>'
   )
})

// Send query parameters even when there is JSON data for the body
// Allows PUT and POST requests to have query parameters
// Source: Carl Smigielski
Ext.override(Ext.data.HttpProxy, {
    /**
 * HttpProxy implementation of DataProxy#doRequest
 * @param {String} action The crud action type (create, read, update, destroy)
 * @param {Ext.data.Record/Ext.data.Record[]} rs If action is load, rs will be null
 * @param {Object} params An object containing properties which are to be used as HTTP parameters
 * for the request to the remote server.
 * @param {Ext.data.DataReader} reader The Reader object which converts the data
 * object into a block of Ext.data.Records.
 * @param {Function} callback
 * <div class="sub-desc"><p>A function to be called after the request.
 * The <tt>callback</tt> is passed the following arguments:<ul>
 * <li><tt>r</tt> : Ext.data.Record[] The block of Ext.data.Records.</li>
 * <li><tt>options</tt>: Options object from the action request</li>
 * <li><tt>success</tt>: Boolean success indicator</li></ul></p></div>
 * @param {Object} scope The scope (<code>this</code> reference) in which the callback function is executed. Defaults to the browser window.
 * @param {Object} arg An optional argument which is passed to the callback as its second parameter.
 * @protected
 */
doRequest : function(action, rs, params, reader, cb, scope, arg) {
    var  o = {
        method: (this.api[action]) ? this.api[action]['method'] : undefined,
        request: {
            callback : cb,
            scope : scope,
            arg : arg
        },
        reader: reader,
        callback : this.createCallback(action, rs),
        scope: this
    };

    // If possible, transmit data using jsonData || xmlData on Ext.Ajax.request (An installed DataWriter would have written it there.).
    // Use std HTTP params otherwise.
    if (params.jsonData) {
        // csmig modification start
        let {jsonData, ...notJsonData } = params
        o.jsonData = jsonData;
        o.params = notJsonData || {}
        // csmig modification stop
    } else if (params.xmlData) {
        o.xmlData = params.xmlData;
    } else {
        o.params = params || {};
    }
    // Set the connection url.  If this.conn.url is not null here,
    // the user must have overridden the url during a beforewrite/beforeload event-handler.
    // this.conn.url is nullified after each request.
    this.conn.url = this.buildUrl(action, rs);

    if(this.useAjax){

        Ext.applyIf(o, this.conn);

        // If a currently running read request is found, abort it
        if (action == Ext.data.Api.actions.read && this.activeRequest[action]) {
            Ext.Ajax.abort(this.activeRequest[action]);
        }
        this.activeRequest[action] = Ext.Ajax.request(o);
    }else{
        this.conn.request(o);
    }
    // request is sent, nullify the connection url in preparation for the next request
    this.conn.url = null;
}
})

// Promisified JsonStore.load() method
// Source: Carl Smigielski
Ext.override(Ext.data.JsonStore, {
    loadPromise : function (params) {
        return new Promise ( (resolve, reject) => {
            this.load({
                params: params,
                callback: function (records, options, success) {
                    if (success) {
                        resolve ({
                            records: records,
                            options: options
                        })
                    } else {
                        reject ('Load failed')
                    }
                }
            })
        })
    },
    reloadPromise : function (params) {
        return new Promise ( (resolve, reject) => {
            this.reload({
                params: params,
                callback: function (records, options, success) {
                    if (success) {
                        resolve ({
                            records: records,
                            options: options
                        })
                    } else {
                        reject ('Reload failed')
                    }
                }
            })
        })
    }

})

// replace the Ext.Element.mask() method
Ext.Element.addMethods({
        /**
     * Puts a mask over this element to disable user interaction. Requires core.css.
     * This method can only be applied to elements which accept child nodes.
     * @param {String} msg (optional) A message to display in the mask
     * @param {String} msgCls (optional) A css class to apply to the msg element
     * @return {Element} The mask element
     */
    mask : function(msg, msgCls) {
        var me  = this,
            dom = me.dom,
            dh  = Ext.DomHelper,
            EXTELMASKMSG = "ext-el-mask-msg",
            XMASKED = "x-masked",
            XMASKEDRELATIVE = "x-masked-relative",
            el,
            mask,
            data = Ext.Element.data;

        if (el = data(dom, 'maskMsgDiv')) {
            el.innerHTML = msg
            return
        }

        if (!/^body/i.test(dom.tagName) && me.getStyle('position') == 'static') {
            me.addClass(XMASKEDRELATIVE);
        }
        if (el = data(dom, 'maskMsg')) {
            el.remove();
        }
        if (el = data(dom, 'mask')) {
            el.remove();
        }

        mask = dh.append(dom, {cls : "ext-el-mask"}, true);
        data(dom, 'mask', mask);

        me.addClass(XMASKED);
        mask.setDisplayed(true);
        
        if (typeof msg == 'string') {
            // change the tag to <span> instead of <div>, to support CSS-only spinner
            const cn = msg ? [{tag:'div'},{tag:'span'}] : {tag:'span'}
            var mm = dh.append(dom, {cls : EXTELMASKMSG, cn}, true);
            data(dom, 'maskMsg', mm);
            mm.dom.className = msgCls ? EXTELMASKMSG + " " + msgCls : EXTELMASKMSG;
            if (msg) {
                mm.dom.firstChild.innerHTML = msg;
                data(dom, 'maskMsgDiv', mm.dom.firstChild);
            }
            mm.setDisplayed(true);
            // Don't calculate centering, let CSS take care of it
            // mm.center(me);
        }
        
        // ie will not expand full height automatically
        if (Ext.isIE && !(Ext.isIE7 && Ext.isStrict) && me.getStyle('height') == 'auto') {
            mask.setSize(undefined, me.getHeight());
        }
        
        return mask;
    },
    /**
     * Removes a previously applied mask.
     */
    unmask : function() {
        const data = Ext.Element.data
        const me = this,
        dom = me.dom,
        mask = data(dom, 'mask'),
        maskMsg = data(dom, 'maskMsg'),
        maskMsgDiv = data(dom, 'maskMsgDiv'),
        XMASKED = "x-masked",
        XMASKEDRELATIVE = "x-masked-relative";

        if (mask) {
            if (maskMsg) {
                maskMsg.remove();
                data(dom, 'maskMsg', undefined);
                if (maskMsgDiv) {
                    data(dom, 'maskMsgDiv', undefined);
                }
            }
            
            mask.remove();
            data(dom, 'mask', undefined);
            me.removeClass([XMASKED, XMASKEDRELATIVE]);
        }
    }
})
// fix addStyles to account for fractional scaling
Ext.Element.prototype.addStyles = function(sides, styles){
    let ttlSize = 0,
        sidesArr = sides.match(/\w/g),
        side,
        size,
        i,
        len = sidesArr.length;
    for (i = 0; i < len; i++) {
        side = sidesArr[i];
        // replace parseInt call with parseFloat to account for fractional scaling
        size = side && Math.round(parseFloat(this.getStyle(styles[side])));
        if (size) {
            ttlSize += Math.abs(size);
        }
    }
    return ttlSize;
}
