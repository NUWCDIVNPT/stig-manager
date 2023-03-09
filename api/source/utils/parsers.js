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
//          pass: 0,
//          fail: 0,
//          notapplicable: 0,
//          notchecked: 0,
//          notselected: 0,
//          informational: 0,
//          error: 0,
//          fixed: 0,
//          unknown: 0
//       }
//     }
//   ]
// }

const parser = require('fast-xml-parser')
const tagValueProcessor = require('he').decode

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
      alwaysCreateTextNode: true, //"strict"
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
        let checks = rule.check ? rule.check.map(check => ({
            system: check.system,
            content: isScap? check['check-content-ref']?.[0]?._ : check['check-content']?.[0]?._
          })) : []
        let fixes = rule.fixtext ? rule.fixtext.map(fix => ({
          fixref: fix.fixref,
          text: fix._
        })) : []
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

        let desc = parseRuleDescription(rule.description?.[0]?._)

        return {
          ruleId: rule.id,
          version: rule.version?.[0]._ || null,
          title: rule.title?.[0]._ || null,
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

      // let desc
      // if (group.description?.[0]?._) {
      //   desc = Parser.parse(group.description[0]._, fastparseOptions)
      // }

      return {
        groupId: group.id,
        title: group.title[0]._ || null,
        // description: desc?.GroupDescription || null,
        rules: rules
      }
    })
    let [releaseInfo, release, benchmarkDate] = /Release:\s+(\S+)\s+Benchmark Date:\s+(.*)/g.exec(bIn['plain-text'][0]._)
    let hrend = process.hrtime(hrstart)
    // console.info(bIn.id + ' execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)

    return {
      benchmarkId: bIn.id,
      title: bIn.title?.[0]._,
      scap: isScap,
      revision: {
        revisionStr: `V${bIn.version?.[0]._}R${release}`,
        version: bIn.version?.[0]._,
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
      'Sept': '09',
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

  