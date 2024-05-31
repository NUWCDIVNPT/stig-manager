const {XMLParser} = require('fast-xml-parser')
const he = require('he')

module.exports.benchmarkFromXccdf = function (xccdfData) {
  
  try {  
    const parser = new XMLParser({
      allowBooleanAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "_",
      ignoreAttributes: false,
      removeNSPrefix: true,
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true,
      isArray: (name, jpath, isLeafNode, isAttribute) => !isAttribute,
      alwaysCreateTextNode: true,
      tagValueProcessor: (name, value) => he.decode(value)
    })
    const j = parser.parse(xccdfData.toString())

    let bIn, isScap=false
    if (j['data-stream-collection']?.[0]) {
      // SCAP
      const components =  j['data-stream-collection'][0].component
      const candidate = components?.find(component => 'Benchmark' in component)
      if (candidate?.Benchmark?.[0]) {
        bIn = candidate.Benchmark[0]
        isScap = true
      }
      else {
        throw new Error("Cannot parse as a DISA SCAP benchmark. No Benchmark element found.")
      }
    }
    else if (j.Benchmark?.[0]) { 
      // Manual STIG
      bIn = j.Benchmark[0]
    }
    else {
      throw new Error("Cannot parse XML document as STIG or SCAP.") 
    }

    const groups = bIn.Group.map(group => {
      const rules = group.Rule.map(rule => {
        const checks = rule.check ? rule.check.map(check => ({
            system: check.system,
            content: isScap? check['check-content-ref']?.[0]?._ : check['check-content']?.[0]?._
          })) : []
          const fixes = rule.fixtext ? rule.fixtext.map(fix => ({
          fixref: fix.fixref,
          text: fix._
        })) : []
        const idents = rule.ident ? rule.ident.map(ident => ({
          ident: ident._,
          system: ident.system
        })) : []
        // The description element's value is often not well-formed XML, so we fallback on extracting content between expected tags
        function parseRuleDescription (d) {
          const parsed = {}
          const propMap = {
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
            const re = new RegExp(`<${propMap[prop]}>([\\s\\S]*)</${propMap[prop]}>`)
            const result = re.exec(d)
            parsed[propMap[prop]] = result && result.length > 1 ? result[1] : null
          }
          
          if (parsed.Responsibility) {
            parsed.Responsibility = parsed.Responsibility.replace(/<\/Responsibility><Responsibility>/g, ', ')
          }
          return parsed
        }

        const desc = parseRuleDescription(rule.description?.[0]?._)

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
          checks,
          fixes,
          idents
        }
      })

      return {
        groupId: group.id,
        title: group.title[0]._ || null,
        rules: rules
      }
    })
    const [releaseInfo, release, benchmarkDate] = /Release:\s+(\S+)\s+Benchmark Date:\s+(.*)/g.exec(bIn['plain-text'][0]._)

    return {
      benchmarkId: bIn.id,
      title: bIn.title?.[0]._,
      scap: isScap,
      revision: {
        revisionStr: `V${bIn.version?.[0]._}R${release}`,
        version: bIn.version?.[0]._,
        release,
        releaseInfo,
        benchmarkDate,
        benchmarkDate8601: benchmarkDateTo8601(benchmarkDate),
        status: bIn.status?.[0]._ || null,
        statusDate: bIn.status?.[0].date || null,
        description: bIn.description?.[0]._ || null,
        groups
      }
    }
  }
  catch (e) {
    throw (e)
  }

  function benchmarkDateTo8601(benchmarkDate) {
    const monthToNum = {
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
    return `${year}-${monthToNum[monStr]}-${day}`
  }
}

  