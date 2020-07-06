const http = require('http')
const https = require('https')
const JSZip = require("jszip");
const parsers = require('./parsers')
const {promises: fs} = require('fs')
const config = require('./config')
const STIG = require(`../service/${config.database.type}/STIGService`)


const request = async (url, method = 'GET', postData) => {
  const lib = url.startsWith('https://') ? https : http

  const uri = url.split('://')[1]
  const result = uri.split('/')
  const [h,...p] = result
  const [host, port] = h.split(':')

  const params = {
    method,
    host,
    port: port || url.startsWith('https://') ? 443 : 80,
    path: `/${p.join('/')}` || '/'
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(params, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`))
      }

      var len = parseInt(res.headers['content-length'], 10)
      var cur = 0
      var total = len / 1048576 //1048576 - bytes in  1Megabyte

      const data = []
      const logInterval = 10000000
      let intervalSize = 0

      res.on('data', chunk => {
        data.push(chunk)
        cur += chunk.length
        intervalSize += chunk.length
        if (intervalSize >= logInterval || cur === len) {
          console.log(`DOWNLOADED ${(100.0 * cur / len).toFixed(2)}% of ${total.toFixed(2)} mb`)
          intervalSize = 0
        }    
      })

      res.on('end', () => {
        // let string = Buffer.concat(data).toString()
        resolve(Buffer.concat(data))
      })
    })

    // req.on('error', reject)
    req.on('error', (e) => {
      console.error(e)
      reject(e)
    })
    
    if (postData) {
      req.write(postData)
    }

    // IMPORTANT
    req.end()
  })
}

exports.fetchCompilation = async function fetchCompilation() {
  try {
    console.log("Retreiving list of Compilation files from public.cyber.mil...")
    let html = await request('https://public.cyber.mil/stigs/compilations/')
    html = html.toString()
    let matches = html.match('<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*')
    if (matches[1]) {
      console.log(`Retreiving ${matches[1]}`)
      const data = await request(matches[1])
      console.log('Processing ZIP...')
      await processZip(data)
    }
  }
  catch (e) {
    console.log(e)
  }
}

exports.fetchScap = async function fetchScap() {
  try {
    console.log("Retreiving list of SCAP files from public.cyber.mil...")
    let html = await request('https://public.cyber.mil/stigs/scap/')
    html = html.toString()
    let matches = [ ...html.matchAll('<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*')]
    for (const [index, match] of matches.entries()) {
      if (match[1]) {
        console.log()
        console.log (`[${index+1}/${matches.length}] -----------------------------`)
        console.log(`DOWNLOADING ${match[1]}`)
        const data = await request(match[1])
        console.log(`PROCESSING ${match[1]}...`)
        await processZip(data)
      }
    }
  }
  catch (e) {
    console.log(e)
  }
}


exports.readCompilation = async function readCompilation() {
  try {
    let localfile = '/home/csmig/dev/STIG-samples/U_SRG-STIG_Library_2020_04v1.zip'
    let data = await fs.readFile(localfile)
    await processZip(data)
  }
  catch (e) {
    throw (e)
  }
}

async function processZip (f) {
  try {
    let parentZip = new JSZip()

    let contents = await parentZip.loadAsync(f)
    let fns = Object.keys(contents.files)
    let xmlMembers = fns.filter( fn => fn.endsWith('xccdf.xml') || fn.endsWith('Benchmark.xml') )
    let zipMembers = fns.filter( fn => fn.endsWith('.zip') )
    for (let x=0,l=xmlMembers.length; x<l; x++) {
      let xml = xmlMembers[x]
      console.log(`PARSING   : ${xml}`)
      let xmlData = await parentZip.files[xml].async("nodebuffer")
      let benchmark = parsers.benchmarkFromXccdf(xmlData)
      let response
      if (benchmark.scap) {
        response = await STIG.insertScapBenchmark(benchmark, xmlData)
      }
      else {
        response = await STIG.insertManualBenchmark(benchmark, xmlData)
      }
      // console.log(JSON.stringify(response, null, 2))
      console.log (`IMPORTED  : ${xml}`)
  
    }
    for (let x=0, l=zipMembers.length; x<l; x++) {
      let zip = zipMembers[x]
      console.log()
      console.log(`[${x+1}/${l}] -----------------------------`)
      console.log(`EXTRACTING: ${zip}`)
      let data = await parentZip.files[zip].async("nodebuffer")
      console.log (`PROCESSING: ${zip}`)
      await processZip(data)
    }
  }
  catch (e) {
    throw (e)
  }
  
}