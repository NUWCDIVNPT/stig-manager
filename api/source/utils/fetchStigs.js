const JSZip = require("jszip");
const parsers = require('./parsers')
const {promises: fs} = require('fs')
const config = require('./config')
const logger = require('./logger')
const STIG = require(`../service/${config.database.type}/STIGService`)
const axios = require('axios')

const compilationURL = 'https://public.cyber.mil/stigs/compilations/'
const stigMatchString = '<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*'
const logComponent = 'initData'

let localCompilationFile = '/home/csmig/dev/STIG-samples/U_SRG-STIG_Library_2021_10v2.zip'


exports.fetchCompilation = async function fetchCompilation() {
  const logType = 'stig'
  try {
    logger.writeDebug(logComponent, logType, { message: 'Retrieving list of Compilation files from public.cyber.mil'})
    const {data} = await axios.get(compilationURL)
    let url = data.match(stigMatchString)[1]
    if (url) {
      logger.writeInfo(logComponent, logType, { message: "download", url })

      let lastProgress = 0
      let progressIncrement = 5

      const response = await axios({
        url,
        method: 'get',
        responseType: 'arraybuffer',
        onDownloadProgress: function ({loaded, progress, total}) {
          let currentProgress = Math.floor(100 * progress)
          if ((lastProgress + progressIncrement) < currentProgress){
            logger.writeInfo(logComponent, logType, { message: `download`, url, progressPct: currentProgress, totalMb: (total / 1000000).toFixed(2), loadedMb: (loaded / 1000000).toFixed(2)})
            lastProgress = currentProgress
          }
        }
      })
      logger.writeDebug(logComponent, logType, { message: `processing`})      
      await processZip(response.data)
    }
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: e.message, stack: e.stack})
    throw(e)          
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
    logger.writeDebug(logComponent, logType, { message: `zip contents`, xmlMemberCount: xmlMembers.length, zipMemberCount: zipMembers.length })      
    for (let x=0,l=xmlMembers.length; x<l; x++) {
      xml = xmlMembers[x]
      logger.writeDebug(logComponent, logType, { message: `parsing xml`, member: xml, seq: x+1 })      
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
        logger.writeWarning(logComponent, logType, { message: `Did not import SCAP benchmark`, member: xml })      
      }
      else {
        response = await STIG.insertManualBenchmark(benchmark)
      }
      logger.writeInfo(logComponent, logType, { message: `imported`, member: xml })      
    }
    for (let x=0, l=zipMembers.length; x<l; x++) {
      let zip = zipMembers[x]
      logger.writeDebug(logComponent, logType, { message: `recursing into zip`, member: zip, seq: x+1 })      
      let data = await parentZip.files[zip].async("nodebuffer")
      await processZip(data)
    }
  }
  catch (e) {
    logger.writeError(logComponent, logType, { message: err.message, member: xml, stack: err.stack })      
  }
}

// exports.fetchCompilation = exports.readCompilation