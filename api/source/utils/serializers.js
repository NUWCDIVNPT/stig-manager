const {promises: fs} = require('fs')
const path = require('path')
const XlsxTemplate = require('xlsx-template')

module.exports.poamObjectFromFindings = function ( findings, defaults = {} ) {
    const vuln = findings.map( finding => ({
        desc: `Title:\n${finding.rules[0].title}\n\nDescription:\n${finding.rules[0].vulnDiscussion}`,
        control: finding.ccis.map( cci => cci.apAcronym).join('\n'),
        office: defaults.office,
        securityChecks: finding.ruleId || finding.groupId,
        resourcesRequired: '',
        date: defaults.date,
        milestone: `Resolve this finding. ${defaults.date}`,
        milestoneChanges: `Resolve this finding. ${defaults.date}`,
        stigInfo: finding.stigsInfo.map( stig => 
            `${stig.benchmarkId}\nVersion: ${stig.version}\nRelease: ${stig.release}\nBenchmark Date: ${stig.benchmarkDate}` ).join('\n\n'),
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
    return {
        vuln: vuln
    }
}

module.exports.xlsxFromPoamObject = async function ( po ) {
    try {
        const templateData = await fs.readFile(path.join(__dirname,'poam-template.xlsx'))
        const template = new XlsxTemplate(templateData)
        template.substitute( 1, po )
        return template.generate({type: 'nodebuffer'})
    }
    catch (e) {
        throw (e)
    }
}