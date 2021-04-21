const got = require('got')
const JSZip = require("jszip");
const parsers = require('./parsers')
const {promises: fs} = require('fs')
const config = require('./config')
const STIG = require(`../service/${config.database.type}/STIGService`)



const compilationURL = 'https://public.cyber.mil/stigs/compilations/'
const scapURL = 'https://public.cyber.mil/stigs/scap/'
const stigMatchString = '<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*'
const scapMatchString = '<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*enchmark.zip)" target=.*'

// let localCompilationFile = 'E:/STIGs/test.zip'


exports.fetchCompilation = async function fetchCompilation() {
  try {
    console.log("Retreiving list of Compilation files from public.cyber.mil...")
    let html = await got(compilationURL)
    html = html.body.toString()
    let matches = html.match(stigMatchString)
    if (matches[1]) {
      console.log(`Retreiving ${matches[1]}`)
      let lastProgress = 0
      let progressIncrement = 5
      const data = await got(matches[1]).on('downloadProgress', progress => {
          let currentProgress = Math.floor(100 * progress.percent)
          if ((lastProgress + progressIncrement) < currentProgress){
            console.log(`DOWNLOADED ${currentProgress}% of ${(progress.total / 1000000).toFixed(2)} MB`)
            lastProgress = currentProgress
          }
      });

      console.log('Processing ZIP...')
      await processZip(data.rawBody)
    }
  }
  catch (e) {
    console.log(e)
  }
}

exports.fetchScap = async function fetchScap() {
  try {
    console.log("Retreiving list of SCAP files from public.cyber.mil...")
    let html = await got(scapURL);
    html = html.body.toString()
    let matches = [ ...html.matchAll(scapMatchString)]
    for (const [index, match] of matches.entries()) {
      if (match[1]) {
        console.log()
        console.log (`[${index+1}/${matches.length}] -----------------------------`)
        console.log(`DOWNLOADING ${match[1]}`)
        const data = await got(match[1])
        console.log(`PROCESSING ${match[1]}...`)
        await processZip(data.rawBody)
      }
    }
  }
  catch (e) {
    console.log(e)
  }
}


// exports.readCompilation = async function readCompilation() {
//   try {
//     let localfile = localCompilationFile
//     let data = await fs.readFile(localfile)
//     await processZip(data)
//   }
//   catch (e) {
//     console.log(e)
//   }
// }

async function processZip (f) {
  try {
    let parentZip = new JSZip()

    let contents = await parentZip.loadAsync(f)
    let fns = Object.keys(contents.files)
    let xmlMembers = fns.filter( fn => fn.toLowerCase().endsWith('.xml'))
    let zipMembers = fns.filter( fn => fn.endsWith('.zip') )
    for (let x=0,l=xmlMembers.length; x<l; x++) {
      let xml = xmlMembers[x]
      console.log(`PARSING   : ${xml}`)
      let xmlData = await parentZip.files[xml].async("nodebuffer")
      let benchmark
      try {
        benchmark = await parsers.benchmarkFromXccdf(xmlData)
      }
      catch(err){
        console.log(`Error while parsing file ${xml}: ${err}`)
        continue
      }
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