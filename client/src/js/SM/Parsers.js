(function (exports) {
  exports.reviewsFromCkl = function (
    {
      data, 
      fieldSettings,
      allowAccept,
      importOptions,
      valueProcessor,
      XMLParser
    }) {
      
    if (!XMLParser) {
      if (typeof require === 'function') {
        const { requireXMLParser } = require('fast-xml-parser')
        XMLParser = requireXMLParser
      }
      else if (typeof fxp === "object" && typeof fxp.XMLParser === 'function') {
          XMLParser = fxp.XMLParser
      }
      else {
        throw(new Error('XMLParser not found'))
      }
    }
  
    const normalizeKeys = function (input) {
      // lowercase and remove hyphens
      if (typeof input !== 'object') return input;
      if (Array.isArray(input)) return input.map(normalizeKeys);
      return Object.keys(input).reduce(function (newObj, key) {
          let val = input[key];
          let newVal = (typeof val === 'object') && val !== null ? normalizeKeys(val) : val;
          newObj[key.toLowerCase().replace('-','')] = newVal;
          return newObj;
      }, {});
    }
    const resultMap = {
      NotAFinding: 'pass',
      Open: 'fail',
      Not_Applicable: 'notapplicable',
      Not_Reviewed: 'notchecked'
    }
    const resultStats = {
      pass: 0,
      fail: 0,
      notapplicable: 0,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }  
    const parseOptions = {
      allowBooleanAttributes: false,
      attributeNamePrefix: "",
      cdataPropName: "__cdata", //default is 'false'
      ignoreAttributes: false,
      parseTagValue: false,
      parseAttributeValue: false,
      removeNSPrefix: true,
      trimValues: true,
      tagValueProcessor: valueProcessor,
      commentPropName: "__comment",
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === '__comment' || !isLeafNode
      }
    }
    const parser = new XMLParser(parseOptions)
    const parsed = parser.parse(data)
  
    if (!parsed.CHECKLIST) throw (new Error("No CHECKLIST element"))
    if (!parsed.CHECKLIST[0].ASSET) throw (new Error("No ASSET element"))
    if (!parsed.CHECKLIST[0].STIGS) throw (new Error("No STIGS element"))
  
    const comments = parsed['__comment']
    const resultEngineCommon = comments.length ? processRootXmlComments(comments) : null
  
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
      if (assetElement.WEB_OR_DATABASE === 'true') {
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
  
      let vulnArray = []
      vulnElements?.forEach(vuln => {
        const review = generateReview(vuln, resultEngineCommon)
        if (review) {
          vulnArray.push(review)
          resultStats[review.result]++
        }
      })
  
      return {
        reviews: vulnArray,
        stats: resultStats
      }
    }
  
    function generateReview(vuln, resultEngineCommon) {
      let result = resultMap[vuln.STATUS]
      if (!result) return
      const ruleId = getRuleIdFromVuln(vuln)
      if (!ruleId) return
  
      const hasComments = !!vuln.FINDING_DETAILS || !!vuln.COMMENTS
  
      if (result === 'notchecked') { // unreviewed business rules
        switch (importOptions.unreviewed) {
          case 'never':
            return undefined
          case 'commented':
            result = hasComments ? importOptions.unreviewedCommented : undefined
            if (!result) return
            break
          case 'always':
            result = hasComments ? importOptions.unreviewedCommented : 'notchecked'
            break
        }
      }
  
      let detail = vuln.FINDING_DETAILS
      if (!vuln.FINDING_DETAILS) {
        switch (importOptions.emptyDetail) {
          case 'ignore':
            detail= null
            break
          case 'import':
            detail = vuln.FINDING_DETAILS
            break
          case 'replace':
            detail = 'There is no detail provided for the assessment'
            break
        }
      }
  
      let comment = vuln.COMMENTS
      if (!vuln.COMMENTS) {
        switch (importOptions.emptyComment) {
          case 'ignore':
            comment = null
            break
          case 'import':
            comment = vuln.COMMENTS
            break
          case 'replace':
            comment = 'There is no comment provided for the assessment'
            break
        }
      }
  
      const review = {
        ruleId,
        result,
        detail,
        comment
      }
  
      if (resultEngineCommon) {
        review.resultEngine = {...resultEngineCommon}
        if (vuln['__comment']) {
          const overrides = []
          for (const comment of vuln['__comment']) {
            if (comment.toString().startsWith('<Evaluate-STIG>')) {
              let override
              try {
                override = parser.parse(comment)['Evaluate-STIG'][0]
              }
              catch(e) {
                console.log(`Failed to parse Evaluate-STIG VULN XML comment for ${ruleId}`)
              }
              override = normalizeKeys(override)
              if (override.afmod?.toLowerCase() === 'true') {
                overrides.push({
                  authority: override.answerfile,
                  oldResult: resultMap[override.oldstatus] ?? 'unknown',
                  newResult: result,
                  remark: 'Evaluate-STIG Answer File'
                })
              }
            } 
          }
          if (overrides.length) {
            review.resultEngine.overrides = overrides
          }  
        }
      }
      else {
        review.resultEngine = null
      }
  
      const status = bestStatusForReview(review)
      if (status) {
        review.status = status
      }
    
      return review
    }
  
    function getRuleIdFromVuln(vuln) {
      let ruleId
      vuln.STIG_DATA.some(stigDatum => {
        if (stigDatum.VULN_ATTRIBUTE == "Rule_ID") {
          ruleId = stigDatum.ATTRIBUTE_DATA
          return true
        }
      })
      return ruleId
    }
  
    function bestStatusForReview(review) {
      if (importOptions.autoStatus === 'null') return null
      if (importOptions.autoStatus === 'saved') return 'saved'
  
      let detailSubmittable = false
      switch (fieldSettings.detail.required) {
        case 'optional':
          detailSubmittable = true
          break
        case 'findings':
          if ((review.result !== 'fail') || (review.result === 'fail' && review.detail)) {
            detailSubmittable = true
          }
          break
        case 'always':
          if (review.detail) {
            detailSubmittable = true
          }
          break
      } 
  
      let commentSubmittable = false
      switch (fieldSettings.comment.required) {
        case 'optional':
          commentSubmittable = true
          break
        case 'findings':
          if ((review.result !== 'fail') || (review.result === 'fail' && review.comment)) {
            commentSubmittable = true
          }
          break
        case 'always':
          if (review.comment) {
            commentSubmittable = true
          }
          break
      }
  
      const resultSubmittable = review.result === 'pass' || review.result === 'fail' || review.result === 'notapplicable'
      
      let status = undefined
      if (detailSubmittable && commentSubmittable && resultSubmittable) {
        switch (importOptions.autoStatus) {
          case 'submitted':
            status = 'submitted'
            break
          case 'accepted':
            status = allowAccept ? 'accepted' : 'submitted'
            break
        }
      } 
      else {
        status = 'saved'
      }
      return status
    }
  
    function processRootXmlComments(comments) {
      let resultEngineRoot
      for (const comment of comments) {
        if (comment.toString().startsWith('<Evaluate-STIG>')) {
          let esRootComment
          try {
            esRootComment = parser.parse(comment)['Evaluate-STIG'][0]
          }
          catch(e) {
            console.log('Failed to parse Evaluate-STIG root XML comment')
          }
          esRootComment = normalizeKeys(esRootComment)
          resultEngineRoot = {
            type: 'script',
            product: 'Evaluate-STIG',
            version: esRootComment?.global?.[0]?.version,
            time: esRootComment?.global?.[0]?.time,
            checkContent: {
              location: esRootComment?.module?.[0]?.name ?? ''
            }
          }
        }
      }
      return resultEngineRoot || null
    }
  }
  
  exports.reviewsFromScc = function (
    {
      data, 
      fieldSettings,
      allowAccept,
      importOptions,
      valueProcessor,
      scapBenchmarkMap,
      XMLParser
    }) {

    // Parse the XML
    const parseOptions = {
      allowBooleanAttributes: false,
      attributeNamePrefix: "",
      cdataPropName: "__cdata", //default is 'false'
      ignoreAttributes: false,
      parseTagValue: true,
      removeNSPrefix: true,
      trimValues: true,
      tagValueProcessor: valueProcessor,
      commentPropName: "__comment",
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        return name === 'override'
      }
    }
    const parser = new XMLParser(parseOptions)  
    let parsed = parser.parse(data)

    // Baic sanity checks
    if (!parsed.Benchmark) throw (new Error("No Benchmark element"))
    if (!parsed.Benchmark.TestResult) throw (new Error("No TestResult element"))
    if (!parsed.Benchmark.TestResult['target-facts']) throw (new Error("No target-facts element"))
    if (!parsed.Benchmark.TestResult['rule-result']) throw (new Error("No rule-result element"))

    // Process parsed data
    let benchmarkId = parsed.Benchmark.id.replace('xccdf_mil.disa.stig_benchmark_', '')
    if (scapBenchmarkMap && scapBenchmarkMap.has(benchmarkId)) {
      benchmarkId = scapBenchmarkMap.get(benchmarkId)
    }
    let target = processTargetFacts(parsed.Benchmark.TestResult['target-facts'].fact)
    if (!target.name) {
      throw (new Error('No host_name fact'))
    }

    // resultEngine info
    const testSystem = parsed.Benchmark.TestResult['test-system']
    // SCC injects a CPE WFN bound to a URN
    const m = testSystem.match(/[c][pP][eE]:\/[AHOaho]?:(.*)/)
    let vendor, product, version
    if (m?.[1]) {
      ;[vendor, product, version] = m[1].split(':')
    }
    const resultEngineTpl = {
      type: 'scap',
      product,
      version
    }
    const r = processRuleResults(parsed.Benchmark.TestResult['rule-result'], resultEngineTpl)

    // Return object
    return ({
      target: target,
      checklists: [{
        benchmarkId: benchmarkId,
        revisionStr: null,
        reviews: r.reviews,
        stats: r.stats
      }]
    })
  
    function processRuleResults(ruleResults, resultEngineTpl) {
      const stats = {
        pass: 0,
        fail: 0,
        notapplicable: 0,
        notchecked: 0,
        notselected: 0,
        informational: 0,
        error: 0,
        fixed: 0,
        unknown: 0
      }
      const reviews = []
      for (const ruleResult of ruleResults) {
        const review = generateReview(ruleResult, resultEngineTpl)
        if (review) {
          reviews.push(review)
          stats[review.result]++
        }
      }
      return { reviews, stats }
    }

    function generateReview(ruleResult, resultEngineCommon) {
      let result = ruleResult.result
      if (!result) return
      const ruleId = ruleResult.idref.replace('xccdf_mil.disa.stig_rule_', '')
      if (!ruleId) return

      const hasComments = false // or look for <remark>

      if (result !== 'pass' && result !== 'fail' && result !== 'notapplicable') { // unreviewed business rules
        switch (importOptions.unreviewed) {
          case 'never':
            return undefined
          case 'commented':
            result = hasComments ? importOptions.unreviewedCommented : undefined
            if (!result) return
            break
          case 'always':
              result = hasComments ? importOptions.unreviewedCommented : 'notchecked'
              break
        }
      }

      let resultEngine
      if (resultEngineCommon) {
        // build the resultEngine value
        resultEngine = {
          time: new Date(ruleResult.time), 
          ...resultEngineCommon
        }
        // handle check-content-ref, if it exists
        const checkContentHref = ruleResult?.check?.['check-content-ref']?.href?.replace('#scap_mil.disa.stig_comp_','')
        const checkContentName = ruleResult?.check?.['check-content-ref']?.name?.replace('oval:mil.disa.stig.','')
        if (checkContentHref || checkContentName) {
          resultEngine.checkContent = {
            location: checkContentHref,
            component: checkContentName
          }
        }
        
        if (ruleResult.override?.length) { //overrides
          const overrides = []
          for (const override of ruleResult.override) {
            overrides.push({
              authority: override.authority,
              oldResult: override['old-result'],
              newResult: override['new-result'],
              remark: override['remark']
            })
          }
          if (overrides.length) {
            resultEngine.overrides = overrides
          }  
        }
      }

      const replacementText = `Result was reported by product "${resultEngine?.product}" version ${resultEngine?.version} at ${resultEngine?.time?.toISOString()} using check content "${resultEngine?.checkContent?.location}"`

      let detail
      switch (importOptions.emptyDetail) {
        case 'ignore':
          detail= null
          break
        case 'import':
          detail = ''
          break
        case 'replace':
          detail = replacementText
          break
      }

      let comment
      switch (importOptions.emptyComment) {
        case 'ignore':
          comment = null
          break
        case 'import':
          comment = ''
          break
        case 'replace':
          comment = replacementText
          break
      }

      const review = {
        ruleId,
        result,
        resultEngine,
        detail,
        comment
      }

      const status = bestStatusForReview(review)
      if (status) {
        review.status = status
      }
      
      return review
    }
  
    function bestStatusForReview(review) {
      if (importOptions.autoStatus === 'null') return undefined
      if (importOptions.autoStatus === 'saved') return 'saved'
  
      const fields = ['detail', 'comment']
      let commentsSubmittable
      for (const field of fields) {
        switch (fieldSettings[field].required) {
          case 'optional':
            commentsSubmittable = true
            break
          case 'findings':
            commentsSubmittable = ((review.result !== 'fail') || (review.result === 'fail' && review[field]))
            break
          case 'always':
            commentsSubmittable = !!review[field]
            break
          }
        if (!commentsSubmittable) break // can end loop if commentsSubmittable becomes false
      }
  
      const resultSubmittable = review.result === 'pass' || review.result === 'fail' || review.result === 'notapplicable'
      
      let status = undefined
      if (commentsSubmittable && resultSubmittable) {
        switch (importOptions.autoStatus) {
          case 'submitted':
            status = 'submitted'
            break
          case 'accepted':
            status = allowAccept ? 'accepted' : 'submitted'
            break
        }
      } 
      else {
        status = 'saved'
      }
      return status
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
  
}) (typeof exports === 'undefined'? this['ReviewParser'] = {} : exports)