const http = require('http')
const https = require('https')
const JSZip = require("jszip");


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

      var len = parseInt(res.headers['content-length'], 10);
      var cur = 0;
      var total = len / 1048576; //1048576 - bytes in  1Megabyte

      const data = []

      res.on('data', chunk => {
        data.push(chunk)
        cur += chunk.length;
        console.log("Downloading " + (100.0 * cur / len).toFixed(2) + "% " + (cur / 1048576).toFixed(2) + " mb\r" + ".<br/> Total size: " + total.toFixed(2) + " mb")
        // process.stdout.write(".")
      });

      res.on('end', () => {
        // let string = Buffer.concat(data).toString()
        resolve(Buffer.concat(data))
      })
    });

    // req.on('error', reject)
    req.on('error', (e) => {
      console.error(e);
      reject(e)
    });
    
    if (postData) {
      req.write(postData)
    }

    // IMPORTANT
    req.end()
  });
}

async function fetchStigs() {
  try {
    console.log("Retreiving list of Compilation files from public.cyber.mil...")
    let html = await request('https://public.cyber.mil/stigs/compilations/')
    html = html.toString()
    console.log(html)

    let matches = html.match('<a href="(https://dl.dod.cyber.mil/wp-content/uploads/stigs/zip/.*)" target=.*')
    if (matches[1]) {
      console.log(`Retreiving ${matches[1]}`)
      const data = await request(matches[1])
      let zipIn = new JSZip()
      let contents = await zipIn.loadAsync(data)
      let fns = Object.keys(contents.files)

      return fns
    }
  }
  catch (e) {
    console.log(e)
  }
}

module.exports = fetchStigs