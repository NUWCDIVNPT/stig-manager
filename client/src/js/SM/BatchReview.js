Ext.ns('SM.BatchReview')

SM.BatchReview.FormPanel = Ext.extend(Ext.form.FormPanel, {
  initComponent: function () {
    const _this = this

    this.resultCombo = new SM.Review.Form.ResultCombo({
      fieldSettings: this.fieldSettings,
      listeners: {
        select: function () {
          _this.fireEvent('fieldschanged')
        }
      }
    })
    this.detailTextArea = new SM.Review.Form.DetailTextArea({
      emptyText: 'Existing Detail text will be preserved',
      anchor: '100%, 50%',
      fieldSettings: this.fieldSettings,
      onInput: () => {
        _this.fireEvent('fieldschanged')
      }
    })
    this.commentTextArea = new SM.Review.Form.CommentTextArea({
      emptyText: 'Existing Comment text will be preserved',
      anchor: '100%, 50%',
      fieldSettings: this.fieldSettings,
      onInput: () => {
        _this.fireEvent('fieldschanged')
      }
    })

    const config = {
      border: false,
      labelWidth: 65,
      items: [
        this.resultCombo,
        this.detailTextArea,
        this.commentTextArea
      ],
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
      }
    }
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.BatchReview.showDialog = function (fieldSettings, initialResult) {
  return new Promise ((resolve, reject) => {
    try {
      const actionBtn = new Ext.Button({
        text: "Apply Review",
        disabled: true,
        handler: function (btn) {
          const values = fp.getForm().getFieldValues()
          fpwindow.close()
          resolve({
            result: values.result,
            detail: values.detail === '' ? undefined : values.detail.trim(),
            comment: values.comment === '' ? undefined : values.comment.trim()
          })
        }
      })
      const fp = new SM.BatchReview.FormPanel({
        fieldSettings,
        actionBtn,
        listeners: {
            fieldschanged: function () {
            const values = fp.getForm().getFieldValues();

            const result = (values.result ?? '')
            const hasResult = result !== ''

            const resultDirty = hasResult && result !== (initialResult ?? '')
            const commentDetailDirty =
              (values.detail && (values.detail)!== '') ||
              (values.comment && (values.comment) !== '')

         
            const canSubmit = hasResult && (resultDirty || commentDetailDirty)

            actionBtn.setDisabled(!canSubmit)
          }
        }
      })
      if (initialResult) {
        fp.resultCombo.setValue(initialResult)
        actionBtn.disable()
      }
      const fpwindow = new Ext.Window({
        title: `Batch Edit`,
        modal: true,
        resizable: true,
        width: 520,
        height: 560,
        layout: 'fit',
        plain: true,
        bodyStyle: 'padding:10px;',
        buttonAlign: 'right',
        buttons: [
          actionBtn
        ],
        items: fp
      })
      fpwindow.show()
    }
    catch (e) {
      resolve(undefined)
    }
  })
}

SM.BatchReview.ResponsePanel = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const config = {}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.BatchReview.ResponseCounts = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const config = {}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})

SM.BatchReview.ResponseErrors = Ext.extend(Ext.Panel, {
  initComponent: function () {
    const _this = this
    const config = {}
    Ext.apply(this, Ext.apply(this.initialConfig, config))
    this.superclass().initComponent.call(this)
  }
})