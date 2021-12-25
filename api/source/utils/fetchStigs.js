const got = require('got')
const JSZip = require("jszip");
const parsers = require('./parsers')
const {promises: fs} = require('fs')
const config = require('./config')
const logger = require('./logger')
const STIG = require(`../service/${config.database.type}/STIGService`)



const compilationURL = 'https://public.cyber.mil/stigs/compilations/'
const scapURL = 'https://public.cyber.mil/stigs/scap/'
const stigMatchString = '<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*'
const scapMatchString = '<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*enchmark.zip)" target=.*'
const logComponent = 'initData'

let localCompilationFile = '/home/csmig/dev/STIG-samples/U_SRG-STIG_Library_2021_10v2.zip'


exports.fetchCompilation = async function fetchCompilation() {
  try {
    const logType = 'stig'
    logger.writeInfo(logComponent, logType, { message: 'Retreiving list of Compilation files from public.cyber.mil'})
    let html = await got(compilationURL)
    html = html.body.toString()
    let matches = html.match(stigMatchString)
    if (matches[1]) {
      logger.writeInfo(logComponent, logType, { message: `Retreiving ${matches[1]}`})

      let lastProgress = 0
      let progressIncrement = 5
      const data = await got(matches[1]).on('downloadProgress', progress => {
          let currentProgress = Math.floor(100 * progress.percent)
          if ((lastProgress + progressIncrement) < currentProgress){
            logger.writeInfo(logComponent, logType, { message: `downloading`, progressPct: currentProgress, totalMb: (progress.total / 1000000).toFixed(2)})
            lastProgress = currentProgress
          }
      })
      logger.writeInfo(logComponent, logType, { message: `processing`})      
      await processZip(data.rawBody)
    }
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: e.message, stack: e.stack})      
  }
}

exports.fetchScap = async function fetchScap() {
  try {
    const logType = 'scap'
    logger.writeInfo(logComponent, logType, { message: `Retreiving list of available SCAP Benchmarks`, url: scapURL})      
    let html = await got(scapURL);
    html = html.body.toString()
    let matches = [ ...html.matchAll(scapMatchString)]
    logger.writeInfo(logComponent, logType, { message: `Parsed list of SCAP Benchmarks`, total: matches?.length })      
    for (const [index, match] of matches.entries()) {
      if (match[1]) {
        logger.writeInfo(logComponent, logType, { message: `Downloading ${match[1]}`, seq: index+1 })      
        const data = await got(match[1])
        logger.writeInfo(logComponent, logType, { message: `Processing ${match[1]}`, seq: index+1 })      
        await processZip(data.rawBody)
      }
    }
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: e.message, stack: e.stack})      
  }
}

exports.readCompilation = async function readCompilation() {
  const logType = 'stigs'
  try {
    let localfile = localCompilationFile
    let data = await fs.readFile(localfile)
    await processZip(data)
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: e.message, stack: e.stack})      
  }
}

async function processZip (f) {
  let xml
  try {
    const logType = 'processZip'
    let parentZip = new JSZip()

    let contents = await parentZip.loadAsync(f)
    let fns = Object.keys(contents.files)
    let xmlMembers = fns.filter( fn => fn.toLowerCase().endsWith('.xml'))
    let zipMembers = fns.filter( fn => fn.endsWith('.zip') )
    logger.writeInfo(logComponent, logType, { message: `zip contents`, xmlMemberCount: xmlMembers.length, zipMemberCount: zipMembers.length })      
    for (let x=0,l=xmlMembers.length; x<l; x++) {
      xml = xmlMembers[x]
      logger.writeInfo(logComponent, logType, { message: `parsing xml`, member: xml, seq: x+1 })      
      let xmlData = await parentZip.files[xml].async("nodebuffer")
      let benchmark
      try {
        benchmark = await parsers.benchmarkFromXccdf(xmlData)
      }
      catch(err){
        logger.writeError(logComponent, logType, { message: err.message, member: xml, stack: err.stack })      
        continue
      }
      let response
      if (benchmark.scap) {
        response = await STIG.insertScapBenchmark(benchmark, xmlData)
      }
      else {
        response = await STIG.insertManualBenchmark(benchmark, xmlData)
      }
      logger.writeInfo(logComponent, logType, { message: `imported`, member: xml })      
    }
    for (let x=0, l=zipMembers.length; x<l; x++) {
      let zip = zipMembers[x]
      logger.writeInfo(logComponent, logType, { message: `recursing into zip`, member: zip, seq: x+1 })      
      let data = await parentZip.files[zip].async("nodebuffer")
      await processZip(data)
    }
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: err.message, member: xml, stack: err.stack })      
  }
}

exports.fetchCompilation = exports.readCompilation