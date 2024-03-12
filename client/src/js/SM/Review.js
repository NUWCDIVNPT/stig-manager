Ext.ns('SM.Review.Form')

SM.Review.Form.ResultCombo = Ext.extend(Ext.form.ComboBox, {
  initComponent: function () {
    const _this = this
    const config = {
      triggerClass: 'sm-review-trigger',
      disabledClass: 'sm-review-item-disabled',
      width: 100,
      lastSavedData: "",
      cls: 'sm-review-combo-input',
      changed: false,
      fieldLabel: 'Result<i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      emptyText: 'Your result...',
      name: 'result',
      hiddenName: 'result',
      mode: 'local',
      triggerAction: 'all',
      editable: false,
      store: new Ext.data.SimpleStore({
        fields: ['result', 'resultStr'],
        data: [
          ['pass', 'Not a Finding'],
          ['notapplicable', 'Not Applicable'],
          ['fail', 'Open'],
          ['informational', 'Informational'],
          ['notchecked', 'Not Reviewed']
        ]
      }),
      valueField: 'result',
      displayField: 'resultStr',
      listeners: {
        render: function (combo) {
          new Ext.ToolTip({
            target: combo.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            html: SM.ResultTipText
          }).getId() // for sonarcloud
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ResultCombo.superclass.initComponent.call(this)
  }
})

SM.Review.Form.DetailTextArea = Ext.extend(Ext.form.TextArea, {
  //onInput: handler for element's input event
  //infoTip: tooltip attached to question circle
  initComponent: function () {
    const _this = this
    const config = {
      cls: 'sm-review-result-textarea',
      lastSavedData: "",
      allowBlank: true,
      // emptyText: 'Please address the specific items in the review.',
      fieldLabel: 'Detail<i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      autoScroll: 'auto',
      name: 'detail',
      enableKeyEvents: true,
      listeners: {
        render: function (ta) {
          ta.el.dom.maxLength = 32767
          ta.mon( ta.el, 'input', _this.onInput)
          _this.infoTip = new Ext.ToolTip({
            target: ta.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            tpl: SM.DetailTipTpl,
            data: _this.fieldSettings.detail
          }) 
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.DetailTextArea.superclass.initComponent.call(this)
  }
})

SM.Review.Form.CommentTextArea = Ext.extend(Ext.form.TextArea, {
  initComponent: function () {
    const _this = this
    const config = {
      cls: 'sm-review-action-textarea',
      lastSavedData: "",
      allowBlank: true,
      fieldLabel: 'Comment<i class= "fa fa-question-circle sm-question-circle"></i>',
      labelSeparator: '',
      autoScroll: 'auto',
      name: 'comment',
      listeners: {
        'render': function (ta) {
          ta.el.dom.maxLength = 32767
          ta.mon( ta.el, 'input', _this.onInput)
          _this.infoTip = new Ext.ToolTip({
            target: ta.label.dom.getElementsByClassName('fa')[0],
            showDelay: 0,
            dismissDelay: 0,
            autoWidth: true,
            tpl: SM.CommentTipTpl,
            data: _this.fieldSettings.comment
          }) 
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.CommentTextArea.superclass.initComponent.call(this)
  }
})

SM.Review.Form.ResultEngineSprite = Ext.extend(Ext.form.DisplayField, {
  generateMarkup: function(resultEngine) {
    if (!resultEngine) return `<span class="sm-result-engine-sprite">Manual</span>`
    const productSpan = `<span class="sm-result-engine-sprite">${resultEngine.product}</span>`
    const overrideSpan = resultEngine.overrides?.length ? `<span class="sm-result-override-sprite">Override</span>` : ''
    return `${productSpan}${overrideSpan}`
  },
  setRawValue : function(v){
    this.value = v
    if (this.rendered) {
      const displayValue = this.generateMarkup(v)
      this.el.dom.innerHTML = displayValue
    }
    return this.value
  },
  getRawValue : function(){
    return this.value
  },
  initComponent: function () {
    const _this = this
    const config = {
      name: 'resultEngine',
      cls: 'sm-result-engine-span',
      hideLabel: true,
      listeners: {
        render: function (ta) {
            ta.sm_tooltip = new Ext.ToolTip({
                target: ta.el.dom,
                delegate: 'span', // target of the mouseover
                showDelay: 0,
                dismissDelay: 0,
                renderTo: document.body,
                tplResultEngine: new Ext.XTemplate(
                  '<span>',
                  '<tpl if="values.version">',
                    '<b>Version</b><br>{values.version}<br>',
                  '</tpl>',
                  '<tpl if="values.time">',
                    '<b>Time</b><br>{[Ext.util.Format.date(values.time, "Y-m-d H:i T")]}<br>',
                  '</tpl>',
                  '<tpl if="values.checkContent">',
                    '<b>Check content</b><br>{values.checkContent.location}',
                  '</tpl>',
                  '</span>'
                ),
                tplOverride: new Ext.XTemplate(
                  '<span>',
                    '<tpl for="overrides">',
                      '<tpl if="oldResult">',
                        '<b>Original result</b><br>',
                        '{[this.getResultSprite(values.oldResult)]}<br><br>',
                      '</tpl>',
                      '<tpl if="authority">',
                        '<b>Overridden by</b><br>{authority}<br><br>',
                      '</tpl>',
                      '<tpl if="remark">',
                        '<b>Remark</b><br>{remark}<br>',
                      '</tpl>',
                    '</tpl>',
                  '</span>',
                  {
                    getResultSprite: function(val) {
                      return `<span class="sm-tooltip-result-sprite ${SM.RenderResult[val]?.css}">${SM.RenderResult[val]?.textDisa}</span>`
                    }
                  }
                ),
                listeners: {
                  beforeshow: function updateTipBody(tip) {
                    const tpl = tip.triggerElement.className === 'sm-result-engine-sprite' ? tip.tplResultEngine : tip.tplOverride
                    if (_this.value) {
                      tip.update(tpl.apply(_this.value))
                      return true
                    }
                    else {
                      return false
                    }
                  }
                }
            })
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.ResultEngineSprite.superclass.initComponent.call(this)
  }
})

SM.Review.Form.Button = Ext.extend(Ext.Button, {
  initComponent: function () {
    const _this = this
    const config = {
      text: 'Loading...',
      disabled: true
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.Button.superclass.initComponent.call(this)
  }
})

SM.Review.Form.Panel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this
    const ack = new SM.Review.Form.ResultEngineSprite(
      {
        style: {
          marginLeft: '10px'
        }
      }
    )
    const rcb = new SM.Review.Form.ResultCombo({ 
      // hideLabel: true,
      listeners: {
        select: function () {
          if (ack.lastSavedData) {
            if (this.value !== this.lastSavedData) {
              ack.setValue(null)
            } else {
              ack.setValue(ack.lastSavedData)
            }
          }
          setReviewFormItemStates()
        }
      }
    })
    const dta = new SM.Review.Form.DetailTextArea({
      anchor: '100%, 50%',
      fieldSettings: _this.fieldSettings,
      onInput: function (e) {
        _this.setReviewFormItemStates()
      },
      listeners: {
        focus: function (field) {
          field.addClass('sm-field-focus')
        },
        blur: function (field) {
            field.removeClass('sm-field-focus')
        }
      }
    })
    const cta = new SM.Review.Form.CommentTextArea({ 
      anchor: '100%, 50%',
      fieldSettings: _this.fieldSettings,
      onInput: function (e) {
        _this.setReviewFormItemStates()
      },
      listeners: {
        focus: function (field) {
          field.addClass('sm-field-focus')
        },
        blur: function (field) {
            field.removeClass('sm-field-focus')
        }
      }
    })
    const mdf = new Ext.form.DisplayField({
      // anchor: '100% 2%',
      fieldLabel: 'Evaluated',
      hideLabel: false,
      allowBlank: true,
      name: 'editStr',
      formatValue: function (v) {
        const otherRules = v.ruleIds.filter(item => item !== v.ruleId).join('<br>')
        this.setValue(`<span class="sm-review-sprite sm-review-sprite-date">${new Date(v.ts).format('Y-m-d H:i T')}</span>
        <span class="sm-review-sprite sm-review-sprite-user">${v.username}</span>
        <span class="sm-review-sprite sm-review-sprite-rule" ${otherRules ? `ext:qtip="${otherRules}" ext:qdmdelay="60000" ext:qwidth="200" ext:qtitle="Also applies to:"` : ''}>${v.ruleId}</span>`)
      }
    })
    const sdf = new Ext.form.DisplayField({
      fieldLabel: 'Statused',
      hideLabel: false,
      allowBlank: true,
      name: 'status',
      formatValue: function (v) {
        this.setValue(`<span class="sm-review-sprite sm-review-sprite-date">${new Date(v.ts).format('Y-m-d H:i T')}</span>
        <span class="sm-review-sprite sm-review-sprite-user">${v.user.username}</span>
        <span class="sm-review-sprite sm-review-sprite-${v.label}"></span>`)
      }
    })
    const btn1 = new SM.Review.Form.Button({
      handler: _this.btnHandler
    })
    const btn2 = new SM.Review.Form.Button({
      handler: _this.btnHandler
    })

    let statusLabel = ''

    function reviewChanged () {
      return (
        rcb.lastSavedData != rcb.value) 
        || (ack.lastSavedData != ack.getValue()) 
        || (dta.lastSavedData != dta.getValue()) 
        || (cta.lastSavedData != cta.getValue()
      )
    }

    this.resultChanged = function () {
      return ack.lastSavedData != ack.getValue()
    }

    function loadValues (values) {
      const form = _this.getForm()
      form.setValues.call(form, values)
      statusLabel = values.status?.label ?? ''
      if (values.ts && values.username) {
        mdf.formatValue(values)
      }
      else {
        mdf.setValue('--')
      }
      if (values.status) {
        sdf.formatValue(values.status)
      }
      else {
        sdf.setValue('--')
      }
      initLastSavedData()
    }

    function initLastSavedData () {
      if ( rcb.value === null ) { rcb.value = '' }
      ack.lastSavedData = ack.getValue()
      rcb.lastSavedData = rcb.value
      dta.lastSavedData = dta.getValue()
      cta.lastSavedData = cta.getValue()
    }

    function isReviewSubmittable () {
      if (!rcb.value) return false
      if (rcb.value !== 'pass' && rcb.value !== 'fail' && rcb.value !== 'notapplicable') return false
      if (_this.fieldSettings.detail.required === 'always' && !dta.getValue()) return false
      if (_this.fieldSettings.detail.required === 'findings' 
        && rcb.value === 'fail'
        && !dta.getValue()) return false
      if (_this.fieldSettings.comment.required === 'always'
        && (!cta.getValue())) return false
      if (_this.fieldSettings.comment.required === 'findings'
        && rcb.value === 'fail'
        && (!cta.getValue())) return false
      return true
    }

    function setReviewFormTips () {
      const fields = [dta, cta]
      for (const f of fields) {
        f.fieldSettings = _this.fieldSettings
        if (f.infoTip.body) {
          f.infoTip.update(_this.fieldSettings)
        }
        else {
          f.infoTip.data = f.fieldSettings
        }
      }
    }
    
    function setReviewFormItemStates () {
      const resultCombo = rcb
      const detailTextArea = dta
      const commentTextArea = cta
      const autoResultField = ack
      const button1 = btn1 // left button
      const button2 = btn2 // right button
      const fp = _this
      const fieldSettings = _this.fieldSettings

      // Initial state: Enable the entry fields if the review status is 'In progress' or 'Rejected', disable them otherwise
      const editable = (statusLabel === '' || statusLabel === 'saved' || statusLabel === 'rejected')
      resultCombo.setDisabled(!editable) // disable if not editable
      resultCombo.setReadOnly(!editable) // disable if not editable
      detailTextArea.setDisabled(!editable)
      commentTextArea.setDisabled(!editable)
      btn1.setDisabled(!editable)
      btn2.setDisabled(!editable)

      if (editable) {
        if (fieldSettings.detail.enabled === 'always') {
          detailTextArea.enable()
        } 
        else if (fieldSettings.detail.enabled === 'findings') {
          if (resultCombo.value === 'fail') {
            detailTextArea.enable()
          }
          else {
            detailTextArea.disable()
          }
        } 
        
        if (fieldSettings.comment.enabled === 'always') {
          commentTextArea.enable()
        } 
        else if (fieldSettings.comment.enabled === 'findings') {
          if (resultCombo.value === 'fail') {
            commentTextArea.enable()
          }
          else {
            commentTextArea.disable()
          }
        } 
        
        if (resultCombo.value === '' || resultCombo.value === undefined || resultCombo.value === null) {
          detailTextArea.disable()
          commentTextArea.disable()
        }
      }

      if (isReviewSubmittable()) {
        if (fp.reviewChanged()) {
          // review has been changed (is dirty)
          switch (statusLabel) {
            case '':
            case 'saved':
              // button 1
              button1.enable();
              button1.setText('Save without submitting');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = 'save';
              button1.setTooltip('');
              // button 2
              button2.enable();
              button2.setText('Save and Submit');
              button2.setIconClass('sm-ready-icon');
              button2.actionType = 'save and submit';
              button2.setTooltip('');
              break;
            case 'submitted': // 'ready' (a.k.a 'submitted'), dirty review can't happen
              break;
            case 'rejected': // 'rejected'
              // button 1
              button1.enable();
              button1.setText('Save without submitting');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = 'save';
              button1.setTooltip('');
              // button 2
              button2.enable();
              button2.setText('Save and Resubmit');
              button2.setIconClass('sm-ready-icon');
              button2.actionType = 'save and submit';
              button2.setTooltip('');
              break;
            case 'accepted': // 'approved', dirty review can't happen
              break;
          }
        } 
        else {
          // review has not been changed (is in last saved state)
          switch (statusLabel) {
            case '':
            case 'saved': // in progress
              // button 1
              button1.disable();
              button1.setText('Save without submitting');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = '';
              button1.setTooltip('This button is disabled because the review has not been modified.');
              // button 2
              button2.enable();
              button2.setText('Submit');
              button2.setIconClass('sm-ready-icon');
              button2.actionType = 'submit';
              button2.setTooltip('');
              break;
            case 'submitted': // ready
              // button 1
              button1.enable();
              button1.setText('Unsubmit');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = 'unsubmit';
              button1.setTooltip('');
              // button 2
              if (_this.canAccept) {
                button2.enable();
                button2.setText('Accept');
                button2.setIconClass('sm-star-icon-16');
                button2.actionType = 'accept';
                button2.setTooltip('');
              }
              else {
                button2.disable();
                button2.setText('Submit');
                button2.setIconClass('sm-ready-icon');
                button2.actionType = '';
                button2.setTooltip('This button is disabled because the review has already been submitted.');
              }
              break;
            case 'accepted':
              // button 1
              button1.enable();
              button1.setText('Unsubmit');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = 'unsubmit';
              button1.setTooltip('');
              // button 2
              button2.disable();
              button2.setText('Accept');
              button2.setIconClass('sm-star-icon-16');
              button2.actionType = '';
              button2.setTooltip('This button is disabled because the review has already been accepted.');
              break;
            case 'rejected': // rejected
              // button 1
              button1.disable();
              button1.setText('Save without submitting');
              button1.setIconClass('sm-disk-icon');
              button1.actionType = '';
              button1.setTooltip('This button is disabled because the review has not been modified.');
              // button 2
              button2.disable();
              button2.setText('Save and Resubmit');
              button2.setIconClass('sm-ready-icon');
              button2.actionType = '';
              button2.setTooltip('This button is disabled because the review has not been modified.');
              break;
          }
        }
      } 
      else {
        // review is incomplete
        if (fp.reviewChanged()) {
          // review has been changed
          // button 1
          button1.enable();
          button1.setText('Save without submitting');
          button1.setIconClass('sm-disk-icon');
          button1.actionType = 'save and unsubmit';
          button1.setTooltip('');
          // button 2
          button2.disable();
          button2.setText('Save and Submit');
          button2.setIconClass('sm-ready-icon');
          button2.actionType = '';
          button2.setTooltip('This button is disabled because the review is not complete and cannot be submitted.');
        } 
        else {
          // review has not been changed (as loaded)
          // button 1
          if (statusLabel === 'submitted') {
            button1.enable();
            button1.setText('Unsubmit');
            button1.setIconClass('sm-disk-icon');
            button1.actionType = 'unsubmit';
            button1.setTooltip('');
          }
          else {
            button1.disable();
            button1.setText('Save without submitting');
            button1.setIconClass('sm-disk-icon');
            button1.actionType = '';
            button1.setTooltip('This button is disabled because the review has not been modified.');
          }
          // button 2
          button2.disable();
          button2.setText('Save and Submit');
          button2.setIconClass('sm-ready-icon');
          button2.actionType = '';
          button2.setTooltip('This button is disabled because the review is not complete and cannot be submitted.');
        }
      }      
    }
    
    let config = {
      cls: 'sm-round-panel',
      bodyCssClass: 'sm-review-form',
      footerCssClass: 'sm-review-footer',
      labelWidth: 65,
      border: false,
      isLoaded: false, // STIG Manager defined property
      groupGridRecord: {}, // STIG Manager defined property
      monitorValid: false,
      trackResetOnLoad: false,
      reviewChanged: reviewChanged,
      loadValues: loadValues,
      initLastSavedData: initLastSavedData,
      isReviewSubmittable: isReviewSubmittable,
      setReviewFormItemStates: setReviewFormItemStates,
      setReviewFormTips: setReviewFormTips,
      fieldSettings: this.fieldSettings || {
        detail: {
          enabled: 'always',
          required: 'always'
        },
        comment: {
          enabled: 'findings',
          required: 'findings'
        } 
      },
      items: [
        {
          xtype: 'fieldset',
          layout: 'form',
          layoutConfig: {
            getLayoutTargetSize : function() {
              var target = this.container.getLayoutTarget(), ret = {};
              if (target) {
                  ret = target.getViewSize();
      
                  // IE in strict mode will return a width of 0 on the 1st pass of getViewSize.
                  // Use getStyleSize to verify the 0 width, the adjustment pass will then work properly
                  // with getViewSize
                  if (Ext.isIE9m && Ext.isStrict && ret.width == 0){
                      ret =  target.getStyleSize();
                  }
                  ret.width -= target.getPadding('lr');
                  ret.height -= target.getPadding('tb');
                  // change in this override to account for space used by 
                  // the Result combo box and the 4px bottom-margin of each textarea
                  ret.height -= 34 
              }
              return ret;
            } 
          },
          anchor: '100%, -90',
          title: 'Evaluation',
          items: [
            {
              layout: 'column',
              baseCls: 'x-plain',
              items: [
                {
                  width: 170,
                  layout: 'form',
                  baseCls: 'x-plain',
                  items: [rcb]
                },
                ack
              ]
            },
            dta, cta
          ]
          // items: [rcb, ack, dta]
        },
        {
          xtype: 'fieldset',
          title: 'Attributions',
          items: [mdf, sdf]
        }
      ],
      buttons: [btn1, btn2],
      listeners: {
        render: function (formPanel) {
          formPanel.getForm().waitMsgTarget = formPanel.getEl()
          const reviewFormPanelDropTargetEl = formPanel.body.dom
          const reviewFormPanelDropTarget = new Ext.dd.DropTarget(reviewFormPanelDropTargetEl, {
            ddGroup: 'gridDDGroup',
            notifyEnter: function (ddSource, e, data) {
              const editableDest = (_this.groupGridRecord.data.status == 'saved' || _this.groupGridRecord.data.status == 'rejected' || _this.groupGridRecord.data.status === "");
              const copyableSrc = data.selections[0].data.engineResult === 'manual'
              if (editableDest && copyableSrc) { // accept drop of manual reviews
                // no action
              } else {
                return (reviewFormPanelDropTarget.dropNotAllowed);
              }
            },
            notifyOver: function (ddSource, e, data) {
              const editableDest = (_this.groupGridRecord.data.status == 'saved' || _this.groupGridRecord.data.status == 'rejected' || _this.groupGridRecord.data.status === "");
              const copyableSrc = data.selections[0].data.engineResult === 'manual'
              if (editableDest && copyableSrc) { // accept drop of manual reviews
                return (reviewFormPanelDropTarget.dropAllowed);
              } else {
                return (reviewFormPanelDropTarget.dropNotAllowed);
              }
            },
            notifyDrop: function (ddSource, e, data) {
              const editableDest = (_this.groupGridRecord.data.status == 'saved' || _this.groupGridRecord.data.status == 'rejected' || _this.groupGridRecord.data.status === "");
              const copyableSrc = data.selections[0].data.engineResult === 'manual'
              if (editableDest && copyableSrc) { // accept drop of manual reviews
                // Reference the record (single selection) for readability
                const selectedRecord = data.selections[0];
                // Load the record into the form
                if (!rcb.disabled) {
                  rcb.setValue(selectedRecord.data.result);
                }
                dta.setValue(selectedRecord.data.detail);
                if (rcb.getValue() === 'fail') {
                  cta.enable();
                } else {
                  cta.disable();
                }
                if (!cta.disabled) {
                  cta.setValue(selectedRecord.data.comment);
                }
                _this.setReviewFormItemStates()
              }
              return (true);
            }
          })
        }
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    SM.Review.Form.Panel.superclass.initComponent.call(this)
  }
})