// const parseResult = {
//   type: 'CKL' || 'XCCDF',
//   target: {
//     name: 'string',
//     description: 'string',
//     ip: 'string',
//     noncomputing: 'string',
//     fqdn: 'string',
//     mac: 'string',
//     metadata: {}
//   },
//   checklists: [
//     {
//       benchmrkId: 'string',
//       revisionStr: 'string',
//       reviews: [
//         {
//           ruleId: '',
//           result: '',
//           resultComment: '',
//           action: '' || null,
//           actionComment: '' || null,
//           autoResult: false,
//           status: ''
//         }
//       ],
//       stats: {
//         pass: 0,
//         fail: 0,
//         notapplicable: 0,
//         notchecked: 0
//       }
//     }
//   ]
// }

const parser = require('fast-xml-parser')
const tagValueProcessor = require('he').decode

module.exports.reviewsFromCkl = async function (cklData, options = {}) {  
  try {
    options.ignoreNr = !!options.ignoreNr
    const fastparseOptions = {
      attributeNamePrefix: "",
      ignoreAttributes: false,
      ignoreNameSpace: true,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataTagName: "__cdata", //default is 'false'
      cdataPositionChar: "\\c",
      localeRange: "", //To support non english character in tag/attribute values.
      parseTrueNumberOnly: false,
      arrayMode: true, //"strict"
      tagValueProcessor: val => tagValueProcessor(val)
    }
    let parsed = parser.parse(cklData, fastparseOptions)

    if (!parsed.CHECKLIST) throw (new Error("No CHECKLIST element"))
    if (!parsed.CHECKLIST[0].ASSET) throw (new Error("No ASSET element"))
    if (!parsed.CHECKLIST[0].STIGS) throw (new Error("No STIGS element"))

    let returnObj = {}
    returnObj.target = processAsset(parsed.CHECKLIST[0].ASSET[0])
    if (!returnObj.target.name) {
      throw (new Error("No host_name in ASSET"))
    }
    returnObj.checklists = processIStig(parsed.CHECKLIST[0].STIGS[0].iSTIG)
    if (returnObj.checklists.length === 0) {
      throw (new Error("STIG_INFO element has no SI_DATA for SID_NAME == stigId"))
    }
    return (returnObj)

    function processAsset(assetElement) {
      let obj =  {
        name: assetElement.HOST_NAME,
        description: null,
        ip: assetElement.HOST_IP || null,
        fqdn: assetElement.HOST_FQDN || null,
        mac: assetElement.HOST_MAC || null,
        noncomputing: assetElement.ASSET_TYPE === 'Non-Computing'
      }
      const metadata = {}
      if (assetElement.ROLE) {
        metadata.cklRole = assetElement.ROLE
      }
      if (assetElement.TECH_AREA) {
        metadata.cklTechArea = assetElement.TECH_AREA
      }
      if (assetElement.WEB_OR_DATABASE) {
        metadata.cklWebOrDatabase = 'true'
        metadata.cklHostName = assetElement.HOST_NAME
        if (assetElement.WEB_DB_SITE) {
          metadata.cklWebDbSite = assetElement.WEB_DB_SITE
        }
        if (assetElement.WEB_DB_INSTANCE) {
          metadata.cklWebDbInstance = assetElement.WEB_DB_INSTANCE
        }
      }
      obj.metadata = metadata
      return obj
    }
      
    function processIStig(iStigElement) {
      let checklistArray = []
      iStigElement.forEach(iStig => {
        let checklist = {}
        // get benchmarkId
        let stigIdElement = iStig.STIG_INFO[0].SI_DATA.filter( d => d.SID_NAME === 'stigid' )[0]
        checklist.benchmarkId = stigIdElement.SID_DATA.replace('xccdf_mil.disa.stig_benchmark_', '')
        // get revision
        const stigVersion = iStig.STIG_INFO[0].SI_DATA.filter( d => d.SID_NAME === 'version' )[0].SID_DATA
        let stigReleaseInfo = iStig.STIG_INFO[0].SI_DATA.filter( d => d.SID_NAME === 'releaseinfo' )[0].SID_DATA
        const stigRelease = stigReleaseInfo.match(/Release:\s*(.+?)\s/)[1]
        const stigRevisionStr = `V${stigVersion}R${stigRelease}`
        checklist.revisionStr = stigRevisionStr

        if (checklist.benchmarkId) {
          let x = processVuln(iStig.VULN)
          checklist.reviews = x.reviews
          checklist.stats = x.stats
          checklistArray.push(checklist)
        }
      })
      return checklistArray
    }
  
    function processVuln(vulnElements) {
      // vulnElements is an array of this object:
      // {
      //     COMMENTS
      //     FINDING_DETAILS
      //     SEVERITY_JUSTIFICATION
      //     SEVERITY_OVERRIDE
      //     STATUS
      //     STIG_DATA [26]
      // }
  
      const results = {
        NotAFinding: 'pass',
        Open: 'fail',
        Not_Applicable: 'notapplicable',
        Not_Reviewed: 'notchecked'
      }
      let vulnArray = []
      let nf = na = nr = o = 0
      vulnElements?.forEach(vuln => {
        const result = results[vuln.STATUS]
        if (result) {
          switch (result) {
            case 'pass':
                nf++
                break
            case 'fail':
                o++
                break
            case 'notapplicable':
                na++
                break
            case 'notchecked':
                nr++
                break
          }

          let ruleId
          vuln.STIG_DATA.some(stigDatum => {
            if (stigDatum.VULN_ATTRIBUTE == "Rule_ID") {
              ruleId = stigDatum.ATTRIBUTE_DATA
              return true
            }
          })
          let action = null
          if (result === 'fail') {
            if (vuln.COMMENTS.startsWith("Mitigate:")) {
              action = "mitigate"
            } 
            else if (vuln.COMMENTS.startsWith("Exception:")) {
              action = "exception"
            } 
            else if (vuln.COMMENTS.startsWith("Remediate:")) {
              action = "remediate"
            } 
          }
          let status = 'saved'
          if (result && vuln.FINDING_DETAILS && result !== 'fail') {
            status = 'submitted'
          }
          if (result && vuln.FINDING_DETAILS && result === 'fail' && action && vuln.COMMENTS) {
            status = 'submitted'
          }
          if (result === 'notchecked' && options.ignoreNr) return
          vulnArray.push({
            ruleId: ruleId,
            result: result,
            resultComment: vuln.FINDING_DETAILS,
            action: action,
            actionComment: vuln.COMMENTS == "" ? null : vuln.COMMENTS,
            autoResult: false,
            status: status
          })    
        }
      })
  
      return {
        reviews: vulnArray,
        stats: {
          notchecked: nr,
          notapplicable: na,
          pass: nf,
          fail: o
        }
      }
    }  
  }
  finally {}}

module.exports.benchmarkFromXccdf = function (xccdfData) {
  const Parser = require('fast-xml-parser')
  const he = require('he')
  try {
    let hrstart = process.hrtime() 
  
    let fastparseOptions = {
      attributeNamePrefix: "",
      textNodeName: "_",
      ignoreAttributes: false,
      ignoreNameSpace: true,
      allowBooleanAttributes: false,
      parseNodeValue: false,
      parseAttributeValue: false,
      trimValues: true,
      cdataTagName: "__cdata", //default is 'false'
      cdataPositionChar: "\\c",
      localeRange: "", //To support non english character in tag/attribute values.
      parseTrueNumberOnly: false,
      arrayMode: true, //"strict"
      attrValueProcessor: (val) => tagValueProcessor(val, {isAttributeValue: true}),
      tagValueProcessor: (val) => tagValueProcessor(val)
    }

    let j = parser.parse(xccdfData.toString(), fastparseOptions)
    let bIn, isScap=false

    if (j['data-stream-collection'] && j['data-stream-collection'][0]) {
      // SCAP
      let components =  j['data-stream-collection'][0].component
      let candidate = components.find(component => 'Benchmark' in component)
      if (candidate.Benchmark[0]) {
        bIn = candidate.Benchmark[0]
        isScap = true
      }
      else {
        throw new Error("Cannot parse SCAP document. No Benchmark element found.")
      }
    }
    else if (j.Benchmark && j.Benchmark[0]) { 
      // Manual STIG
      bIn = j.Benchmark[0]
    }
    else {
      throw new Error("Cannot parse XML document as STIG or SCAP.") 
    }

    let groups = bIn.Group.map(group => {
      let rules = group.Rule.map(rule => {
        let checks
        // Traditional STIG has no checks, so check for checks
        if (rule.check) {
          checks = rule.check.map(check => ({
            checkId: check.system,
            content: isScap? check['check-content-ref'][0] : check['check-content']
          }))
        }

        let fixes = rule.fixtext.map(fix => ({
          fixId: fix.fixref,
          text: fix._
        }))
        let idents = rule.ident ? rule.ident.map(ident => ({
          ident: ident._,
          system: ident.system
        })) : []

        // The description element is often not well-formed XML, so we fallback on extracting content between expected tags
        function parseRuleDescription (d) {
          let parsed = {}
          let propMap = {
            vulnDiscussion: 'VulnDiscussion',
            falsePositives: 'FalsePositives',
            falseNegatives: 'FalseNegatives',
            documentable: 'Documentable',
            mitigations: 'Mitigations',
            severityOverrideGuidance: 'SeverityOverrideGuidance',
            potentialImpacts: 'PotentialImpacts',
            thirdPartyTools: 'ThirdPartyTools',
            mitigationControl: 'MitigationControl',
            responsibility: 'Responsibility',
            iacontrols: 'IAControls'
          }

          for (const prop in propMap) {
            let re = new RegExp(`<${propMap[prop]}>([\\s\\S]*)</${propMap[prop]}>`)
            let result = re.exec(d)
            parsed[propMap[prop]] = result && result.length > 1 ? result[1] : null
          }
          
          if (parsed.Responsibility) {
            parsed.Responsibility = parsed.Responsibility.replace(/<\/Responsibility><Responsibility>/g, ', ')
          }
          return parsed
        }

        let desc = parseRuleDescription(rule.description)

        return {
          ruleId: rule.id,
          version: rule.version || null,
          title: rule.title || null,
          severity: rule.severity || null,
          weight: rule.weight || null,
          vulnDiscussion: desc.VulnDiscussion || null,
          falsePositives: desc.FalsePositives || null,
          falseNegatives: desc.FalseNegatives || null,
          documentable: desc.Documentable || null,
          mitigations: desc.Mitigations || null,
          severityOverrideGuidance: desc.SeverityOverrideGuidance || null,
          potentialImpacts: desc.PotentialImpacts || null,
          thirdPartyTools: desc.ThirdPartyTools || null,
          mitigationControl: desc.MitigationControl || null,
          responsibility: desc.Responsibility || null,
          iacontrols: desc.IAControls || null,
          checks: checks,
          fixes: fixes,
          idents: idents
        }
      })
      let desc = Parser.parse(group.description, fastparseOptions)



      return {
        groupId: group.id,
        title: group.title || null,
        description: desc.GroupDescription || null,
        rules: rules
      }
    })
    let [releaseInfo, release, benchmarkDate] = /Release:\s+(\S+)\s+Benchmark Date:\s+(.*)/g.exec(bIn['plain-text'][0]._)
    let hrend = process.hrtime(hrstart)
    // console.info(bIn.id + ' execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)

    return {
      benchmarkId: bIn.id,
      title: bIn.title,
      scap: isScap,
      revision: {
        revisionStr: `V${bIn.version}R${release}`,
        version: isScap ? bIn.version[0]._ : bIn.version,
        release: release,
        releaseInfo: releaseInfo,
        benchmarkDate: benchmarkDate,
        benchmarkDate8601: benchmarkDateTo8601(benchmarkDate),
        status: bIn.status[0]._ || null,
        statusDate: bIn.status[0].date || null,
        description: bIn.description || null,
        // profiles: bIn.Profile,
        groups: groups
      }
    }
  }
  catch (e) {
    throw (e)
  }

  function benchmarkDateTo8601(benchmarkDate) {
    monthToNum = {
      'Jan': '01',
      'January': '01',
      'Feb': '02',
      'February': '02',
      'Mar': '03',
      'March': '03',
      'Apr': '04',
      'April': '04',
      'May': '05',
      'Jun': '06',
      'June': '06',
      'Jul': '07',
      'July': '07',
      'Aug': '08',
      'August': '08',
      'Sep': '09',
      'September': '09',
      'Oct': '10',
      'October': '10',
      'Nov': '11',
      'November': '11',
      'Dec': '12',
      'December': '12'
    };
    let [day, monStr, year] = benchmarkDate.split(/\s+/);
    // return sprintf("%04d-%02d-%02d",year,monthToNum[monStr],day);
    return `${year}-${monthToNum[monStr]}-${day}`
  }
}

module.exports.reviewsFromScc = function (sccFileContent, options = {}) {
  try {
    options.ignoreNotChecked = !!options.ignoreNotChecked
    // Parse the XML
    const parseOptions = {
      attributeNamePrefix: "",
      ignoreAttributes: false,
      ignoreNameSpace: true,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataTagName: "__cdata", //default is 'false'
      cdataPositionChar: "\\c",
      localeRange: "", //To support non english character in tag/attribute values.
      parseTrueNumberOnly: false,
      arrayMode: false //"strict"
    }
    let parsed = parser.parse(sccFileContent, parseOptions)

    // Baic sanity checks
    if (!parsed.Benchmark) throw (new Error("No Benchmark element"))
    if (!parsed.Benchmark.TestResult) throw (new Error("No TestResult element"))
    if (!parsed.Benchmark.TestResult['target-facts']) throw (new Error("No target-facts element"))
    if (!parsed.Benchmark.TestResult['rule-result']) throw (new Error("No rule-result element"))

    // Process parsed data
    let benchmarkId = parsed.Benchmark.id.replace('xccdf_mil.disa.stig_benchmark_', '')
    let target = processTargetFacts(parsed.Benchmark.TestResult['target-facts'].fact)
    if (!target.name) {
      throw (new Error('No host_name fact'))
    }
    let x = processRuleResults(parsed.Benchmark.TestResult['rule-result'])

    // Return object
    return ({
      target: target,
      checklists: [{
        benchmarkId: benchmarkId,
        revisionStr: null,
        reviews: x.reviews,
        stats: x.stats
      }]
    })
  }
  finally {}

  function processRuleResults(ruleResults) {
    const results = {
      pass: 'pass',
      fail: 'fail',
      notapplicable: 'notapplicable',
      notchecked: 'notchecked'
    }
    let reviews = []
    let nf = na = nr = o = 0   
    ruleResults.forEach(ruleResult => {
      result = results[ruleResult.result]
      if (result) {
        switch (result) {
          case 'pass':
              nf++
              break
          case 'fail':
              o++
              break
          case 'notapplicable':
              na++
              break
          case 'notchecked':
              nr++
              break
        }
        if ( result === 'notchecked' && options.ignoreNotChecked ) return
        reviews.push({
          ruleId: ruleResult.idref.replace('xccdf_mil.disa.stig_rule_', ''),
          result: result,
          resultComment: `SCC Reviewed at ${ruleResult.time}`,
          autoResult: true,
          status: result != 'fail' ? 'accepted' : 'saved'
        })  
      }
    })
    return {
      reviews: reviews,
      stats: {
        notchecked: nr,
        notapplicable: na,
        pass: nf,
        fail: o
      }  
    }
  }

  function processTargetFacts(facts) {
    let target = {}
    facts.forEach(fact => {
      if (fact['#text']) {
        let name = fact.name.replace('urn:scap:fact:asset:identifier:', '')
        name = name === 'ipv4' ? 'ip' : name
        target[name] = fact['#text'] 
      }
    })
    const {ip, host_name, fqdn, mac, ...metadata} = target
    return {
      name: host_name,
      description: '',
      ip: ip,
      mac: mac,
      fqdn: fqdn,
      noncomputing: false,
      metadata: metadata
    }
  }
}
  