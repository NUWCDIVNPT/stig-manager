'use strict'

Ext.ns('SM')

class Classification {
    constructor (apiClassification) {
        this.showBanner = true
        switch (apiClassification) {
            case 'U':
                this.classificationCls = 'unclassified'
                this.classificationText = 'UNCLASSIFIED (U)'
                break
            case 'CUI':
            case 'FOUO':
                this.classificationCls = 'cui'
                this.classificationText = 'CONTROLLED (CUI)'
                break
            case 'C':
                this.classificationCls = 'confidential'
                this.classificationText = 'CONFIDENTIAL (C)'
                break
            case 'S':
                this.classificationCls = 'secret'
                this.classificationText = 'SECRET (S)'
                break
            case 'TS':
                this.classificationCls = 'topsecret'
                this.classificationText = 'TOP SECRET (TS)'
                break
            case 'SCI':
                this.classificationCls = 'sci'
                this.classificationText = 'TOP SECRET / SCI (TS/SCI)'
                break
            case 'NONE':
            default:
                this.showBanner = false
                break
        }
    }
}