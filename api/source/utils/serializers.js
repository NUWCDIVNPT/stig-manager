const {promises: fs} = require('fs')
const path = require('path')
const XlsxTemplate = require('xlsx-template')

module.exports.mccastPoamObjectFromFindings = function (findings, defaults = {}) {
    const vuln = findings.map( finding => ({
        authPackage: defaults.mccastAuthName,
        name: finding.rules[0].title,
        dateId:  finding.stigs[0].ruleCount === 0 ? finding.stigs[0].benchmarkDate : '',
        stigInfo: 'STIG Finding',
        status: defaults.status,
        packageId: defaults.mccastPackageId,
        date: defaults.date,
        startDate: '',
        endDate: '',
        securityChecks: finding.rules[0].ruleId || finding.groupId,
        control: finding.ccis.map( cci => `DoD RMF-${defaults.mccastPackageId}-${cci.apAcronym?.replace(/\./g,' ')}-CNSSI 1253`).join('\n'),
        resultingRisk: finding.severity === 'medium' ? 'Moderate' : `${finding.severity.charAt(0).toUpperCase()}${finding.severity.slice(1)}`,
        weakness: finding.rules[0].vulnDiscussion,
        mitigations: '',
        comments: finding.stigs[0].ruleCount === 0 ? '' : finding.ccis.map( cci => `CCI-${cci.cci}`).join('\n'),
        assets: finding.assets.map( asset => asset.name ).join('\n'),
        mav: '',
        mac: '',
        mpr: '',
        mui: '',
        ms: '',
        mi: '',
        ma: ''
    }))
    return {vuln}
}

module.exports.poamObjectFromFindings = function (findings, defaults = {}) {
    const vuln = findings.map( finding => ({
        desc: `Title:\n${finding.rules[0].title}\n\nDescription:\n${finding.rules[0].vulnDiscussion}`,
        control: finding.ccis.map( cci => cci.apAcronym).join('\n'),
        office: defaults.office,
        securityChecks: finding.ruleId || finding.groupId,
        resourcesRequired: '',
        date: defaults.date,
        milestone: `Resolve this finding. ${defaults.date}`,
        milestoneChanges: `Resolve this finding. ${defaults.date}`,
        stigInfo: finding.stigs.map( stig => 
            `${stig.benchmarkId}\n${stig.revisionStr}\nBenchmark Date: ${stig.benchmarkDate}` ).join('\n\n'),
        status: defaults.status,
        comments: finding.ccis.map( cci => `CCI-${cci.cci}`).join('\n'),
        rawSeverity: finding.severity === 'medium' ? 'II' : finding.severity === 'low' ? 'III' : finding.severity === 'high' ? 'I' : 'Mixed',
        assets: finding.assets.map( asset => asset.name ).join('\n'),
        mitigations: '',
        predisposingConditions: '',
        severity: finding.severity === 'medium' ? 'Moderate' : `${finding.severity.charAt(0).toUpperCase()}${finding.severity.slice(1)}`, // uppercase first letter
        threatRelevance: '',
        threatDescription: '',
        likelihood: '',
        impact: '',
        impactDescription: '',
        residualRiskLevel: finding.severity === 'medium' ? 'Moderate' : `${finding.severity.charAt(0).toUpperCase()}${finding.severity.slice(1)}`,
        recommendations: '',
        resultingRisk: finding.severity === 'medium' ? 'Moderate' : `${finding.severity.charAt(0).toUpperCase()}${finding.severity.slice(1)}`,
    }))
    return {vuln}
}


module.exports.xlsxFromPoamObject = async function (substitutions, format) {
    const templateFiles = {
        EMASS: 'poam-template.xlsx',
        MCCAST: 'poam-template-mccast.xlsx'
    }
    const templateData = await fs.readFile(path.join(__dirname, templateFiles[format]))
    const template = new XlsxTemplate()
    await template.loadTemplate(templateData)
    await template.substitute(1, substitutions)
    return await template.generate({type: 'nodebuffer'})
}