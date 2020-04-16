const oracledb = require('oracledb')
const config = require('../../utils/config')

module.exports.initializeDatabase = function () {
  return new Promise((resolve, reject) => {
    // Try to create the connection pool
    oracledb.createPool({
      user: config.database.username,
      password: config.database.password,
      connectString: `${config.database.host}:${config.database.port}/${config.database.service}`
    }, (error, pool) => {
      if (error) {
        // Could not create pool, invoke reject cb
        reject(error)
      }
      // Pool was created
      console.log('Oracle connection pool created')

      // Call the pool destruction methods on SIGTERM and SEGINT
      process.on('SIGTERM', closePoolAndExit)
      process.on('SIGINT', closePoolAndExit)

      // Check if we can make a connection. Will recurse until success.
      testConnection()

      function testConnection() {
        console.log(`Testing Oracle connection to ${config.database.host}:${config.database.port}/${config.database.service}`)
        oracledb.getConnection((error, connection) => {
          if (error) {
            console.log(`Oracle connection failed. Retry in 5 seconds...`)
            setTimeout(testConnection, 5000)
            return
          }
          console.log(`Oracle connection succeeded.`)
          connection.close()
          resolve()
        })
      }
    })
  })
}

async function closePoolAndExit() {
  console.log('\nTerminating');
  try {
    // Get the pool from the pool cache and close it when no
    // connections are in use, or force it closed after 10 seconds
    // If this hangs, you may need DISABLE_OOB=ON in a sqlnet.ora file
    await oracledb.getPool().close(10);
    console.log('Pool closed');
    process.exit(0);
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}   


module.exports.getUserObject = async function (username) {
  let connection, sql, binds, options, result
  try {
    connection = await oracledb.getConnection()
    sql = `
      SELECT
        ud.id as "id",
        ud.cn as "cn",
        ud.name as "name",
        ud.dept as "dept",
        r.role as "role",
        ud.canAdmin as "canAdmin"
      from 
        user_data ud
        left join roles r on r.id=ud.roleId
      where
        UPPER(cn)=UPPER(:0)
      `
    binds = [username]
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT   // query result format
    }
    result = await connection.execute(sql, binds, options)
    await connection.close()
    result.rows[0].canAdmin = result.rows[0].canAdmin == 1
    return (result.rows[0])
  }
  catch (err) {
      throw err
  }     
}

module.exports.objectBind = function (object, binds) {
  let sqlStubs = []
  for (const property in object) {
    sqlStubs.push(`${property} = :${property}`)
    binds.push(object[property])
  }
  return sqlStubs.join(',')
}

module.exports.objectBindObject = function (object, binds) {
  let sqlStubs = []
  for (const property in object) {
    sqlStubs.push(`${property} = :${property}`)
    binds[property] = (object[property])
  }
  return sqlStubs.join(',')
}

module.exports.parseRevisionStr = function (revisionStr) {
  let ro = {}
  if (revisionStr !== 'latest') {
    let results = /V(\d+)R(\d+(\.\d+)?)/.exec(revisionStr)
    ro.version = results[1]
    ro.release = results[2]
    ro.table = 'stigs.revisions'
    ro.table_alias = 'r'
    ro.predicates = ' and r.version = :version and r.release = :release '
  } else {
    ro.version = null
    ro.release = null
    ro.table = 'stigs.current_revs'
    ro.table_alias = 'cr'
    ro.predicates = ''
  }
  return ro
}

module.exports.CONTEXT_ALL = 'all'
module.exports.CONTEXT_DEPT = 'department'
module.exports.CONTEXT_USER = 'user'
module.exports.REVIEW_STATE_ID = { 
  1: {state: 'In Progress', abbr: 'IP'},
  2: {state: 'Not Applicable', abbr: 'NA'},
  3: {state: 'Not a Finding', abbr: 'NF'},
  4: {state: 'Open', abbr: 'O'}
}
module.exports.REVIEW_STATE_ABBR = { 
  'IP': {state: 'In Progress', id: 1},
  'NA': {state: 'Not Applicable', id: 2},
  'NF': {state: 'Not a Finding', id: 3},
  'O': {state: 'Open', id: 4}
}
module.exports.REVIEW_ACTION_ID = { 
  1: 'Remediate',
  2: 'Mitigate',
  3: 'Exception'
}
module.exports.REVIEW_ACTION_STR = { 
  'Remediate': 1,
  'Mitigate': 2,
  'Exception': 3
}

// Returns Boolean
module.exports.userAllowedAssetRule = async function (assetId, ruleId, elevate, userObject) {
  try {
    let context, sql
    if (userObject.role == 'Staff' || (userObject.canAdmin && elevate)) {
      return true
    } else if (userObject.role == "IAO") {
      context = dbUtils.CONTEXT_DEPT
      sql = `
        SELECT
          a.assetId
        FROM
          stigman.assets a
        WHERE
          a.assetId = :assetId and a.dept = :dept
      `
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [assetId, userObject.dept])
      await connection.close()
      return result.rows.length > 0   
    } else {
      sql = `
        SELECT
          sa.assetId,
          rgr.ruleId
        FROM
          stigman.user_stig_asset_map usa
          inner join stigman.stig_asset_map sa on usa.saId = sa.saId
          inner join stigs.revisions rev on sa.stigId = rev.stigId
          inner join stigs.rev_group_map rg on rev.revId = rg.revId
          inner join stigs.rev_group_rule_map rgr on rg.rgId = rgr.rgId
        WHERE
          usa.userId = :userId and assetId = :assetId and ruleId = :ruleId`
      let connection = await oracledb.getConnection()
      let result = await connection.execute(sql, [userObject.id, assetId, ruleId])
      await connection.close()
      return result.rows.length > 0   
    }
  }
  catch (e) {
    throw (e)
  }
}

module.exports.parseCkl = async function (cklData) {
  const xml2js = require('xml2js')

  function processAsset(assetElement) {
    return {
      hostname: assetElement.HOST_NAME[0],
      hostFqdn: assetElement.HOST_FQDN[0],
      ip: assetElement.HOST_IP[0],
      mac: assetElement.HOST_MAC[0],
    }
  }

  function processIStig(iStigElement) {
    let stigArray = []
    iStigElement.forEach(iStig => {
      let stigObj = Object.assign({}, processSiData(iStig.STIG_INFO[0].SI_DATA))
      stigObj.vulns = processVuln(iStig.VULN)
      stigArray.push(stigObj)
    })
    return stigArray
  }

  function processSiData(siDataElements) {
    let stigInfo = {}
    siDataElements.forEach(siData => {
      if (siData.SID_NAME[0] == 'stigid') {
        stigInfo.stigId = siData.SID_DATA[0]
      }
      if (siData.SID_NAME[0] == 'releaseinfo') {
        stigInfo.release = siData.SID_DATA[0]
      }
    })
    return stigInfo
  }

  function processVuln(vulnElements) {
    // elVuln is an array of this object, all property values are arrays:
    // {
    //     COMMENTS [1]
    //     FINDING_DETAILS [1]
    //     SEVERITY_JUSTIFICATION [1]
    //     SEVERITY_OVERRIDE [1]
    //     STATUS [1]
    //     STIG_DATA [26]
    // }
    let vulnArray = []
    vulnElements.forEach(vuln => {
      let finding = {}
      finding.status = vuln.STATUS[0]
      // Array.some() stops once a true value is returned
      vuln.STIG_DATA.some(stigDatum => {
        if (stigDatum.VULN_ATTRIBUTE[0] == "Rule_ID") {
          finding.ruleId = stigDatum.ATTRIBUTE_DATA[0]
          return true
        }
      })
      vulnArray.push(finding)
    })
    return vulnArray
  }

  try {
    var parser = new xml2js.Parser()
    let parsed = await parser.parseStringPromise(cklData)
    if (!parsed.CHECKLIST) throw (new Error("No CHECKLIST element"))
    if (!parsed.CHECKLIST.ASSET) throw (new Error("No ASSET element"))
    if (!parsed.CHECKLIST.STIGS) throw (new Error("No STIGS element"))
    let asset = processAsset(parsed.CHECKLIST.ASSET[0])
    asset.results = processIStig(parsed.CHECKLIST.STIGS[0].iSTIG)

    return (asset)
  }
  catch (e) {
    throw (e)
  }
}

module.exports.parseScc = function (sccFileContent) {
  const parser = require('fast-xml-parser')
  try {
    // Parse the XML
    var parseOptions = {
      attributeNamePrefix: "",
      // attrNodeName: "attr", //default is 'false'
      // textNodeName : "#text",
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
      arrayMode: false, //"strict"
      // attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
      // tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
      // stopNodes: ["parse-me-as-string"]
    }
    let parsed = parser.parse(sccFileContent, parseOptions)

    // Baic sanity checks
    if (!parsed.Benchmark) throw (new Error("No <Benchmark> element"))
    if (!parsed.Benchmark.TestResult) throw (new Error("No <TestResult> element"))
    if (!parsed.Benchmark.TestResult['target-facts']) throw (new Error("No <target-facts> element"))
    if (!parsed.Benchmark.TestResult['rule-result']) throw (new Error("No <rule-result> element"))

    // Process parsed data
    let target = processTargetFacts(parsed.Benchmark.TestResult['target-facts'].fact)
    let results = processRuleResults(parsed.Benchmark.TestResult['rule-result'])

    // Return object
    return ({
      target: target,
      results: results
    })
  }
  catch (e) {
    throw (e)
  }

  function processRuleResults(ruleResults) {
    let results = []
    ruleResults.forEach(ruleResult => {
      results.push({
        ruleId: ruleResult.idref.replace('xccdf_mil.disa.stig_rule_', ''),
        result: ruleResult.result,
        time: ruleResult.time,
        checkRef: ruleResult.check['check-content-ref'].href.replace('#scap_mil.disa.stig_comp_', '')
      })
    })
    return results
  }

  function processTargetFacts(facts) {
    let target = {}
    facts.forEach(fact => {
      let name = fact.name.replace('urn:scap:fact:asset:identifier:', '')
      target[name] = fact['#text']
    })
    return target
  }
}

// Returns integer jobId
module.exports.insertJobRecord = async function (record) {
	let sql = `
	insert into imported_jobs (
    startTime ,userId	,source	,assetId ,stigId
    ,packageId ,filename ,filesize
	)
	VALUES
		(SYSDATE, :userId, :sourceStr, :assetId, :benchmarkId, :packageId, :filenameStr, :filesize)
	RETURNING
		jobId into :jobId
`
  try {
    let  options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true
    }
    record.jobId = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
    let connection = await oracledb.getConnection()
    let result = await connection.execute(sql, record, options)
    jobId = result.outBinds.jobId[0]
    await connection.close()
    return jobId
  }
  catch (e) {
    throw (e)
  }
}
