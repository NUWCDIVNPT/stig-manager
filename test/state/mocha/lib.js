import { spawn, execSync } from 'node:child_process'
import EventEmitter from 'node:events'
import * as readline from 'node:readline'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))

// workaround PATH envvar not being honored by spawn within github actions
const nodeCmd = process.env.GITHUB_RUN_ID ? '/usr/local/bin/node':'node'
const pythonCmd = process.env.GITHUB_RUN_ID ? '/usr/bin/python3':'python3'
const dockerCmd = process.env.GITHUB_RUN_ID ? '/usr/bin/docker':'docker'
const iptablesCmd = process.env.GITHUB_RUN_ID ? '/usr/sbin/iptables':'iptables'

/**
 * Spawns the API as a node process.
 * Returns a promise that resolves when the API emits a log record 
 * of the specified type (default 'started') or when the API process closes.
 * @param {Object} options - Options for spawning the API.
 * @param {string} [options.resolveOnType='started'] - The log record type to resolve the promise.
 * @param {boolean} [options.resolveOnClose=true] - Whether to resolve the promise when the API process closes.
 * @param {string} [options.apiPath=`${__dirname}/../../../api/source/index.js`] - The path to the API script.
 * @param {Object} [options.env] - Environment variables for the API process.
 * @returns {Promise<Object>} A promise that resolves with the API process and log records.
 */
export function spawnApiPromise ({
  resolveOnType = 'started',
  resolveOnClose = true,
  apiPath = `${__dirname}/../../../api/source/index.js`,
  env
} = {}) {
  return new Promise((resolve, reject) => {
    const api = spawn(nodeCmd, [apiPath], {env})
    
    api.on('error', (err) => {
      reject(err)
    })

    const resolution = {
      process: api,
      logRecords: [],
      logEvents: new EventEmitter()
    }

    readline.createInterface({
      input: api.stdout,
      crlfDelay: Infinity
    }).on('line', (line) => {
      const json = JSON.parse(line)
      resolution.logRecords.push(json)
      resolution.logEvents.emit(json.type, json)
      if (json.type === resolveOnType) {
        resolve(resolution)
      }
    })

    api.on('close', () => {
      if (resolveOnClose) {
        resolve(resolution)
      }
    })
  })
}

/**
 * Spawns the API as a node process.
 * @param {Object} [options] - Options for spawning the API.
 * @param {string} [options.apiPath=`${__dirname}/../../../api/source/index.js`] - The path to the API script.
 * @param {Object} [options.env] - Environment variables for the API process.
 * @returns {Object|null} The API process and log records, or null if an error occurred.
 */
export function spawnApi ({
  apiPath = `${__dirname}/../../../api/source/index.js`,
  env
} = {}) {
  try {
    const api = spawn(nodeCmd, [apiPath], {env})

    const value = {
      process: api,
      logRecords: []
    }

    readline.createInterface({
      input: api.stdout,
      crlfDelay: Infinity
    }).on('line', (line) => {
      const json = JSON.parse(line)
      value.logRecords.push(json)
    })

    return value
  }
  catch (err) {
    console.error(err)
    return null
  }
}

/**
 * Waits for a child process to close.
 * @param {ChildProcess} child - The child process to wait for.
 * @returns {Promise<number>} A promise that resolves with the exit code of the child process.
 */
export function waitChildClose (child) {
  return new Promise((resolve, reject) => {
    if (child.exitCode) {
      resolve(child.exitCode)
    }
    child.on('close', (code) => {
      resolve(code)
    })
    child.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Makes a simple, non-authenticated request to a URL.
 * @param {string} url - The URL to request.
 * @param {string} method - The HTTP method to use.
 * @returns {Promise<Object>} A promise that resolves with the response status, headers, and body.
 */
export async function simpleRequest(url, method) {
  const options = {
    method
  }
  const response = await fetch(url, options)
  const headers = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  return {
    status: response.status,
    headers,
    body: await response.json().catch(() => ({}))
  }
}

/**
 * Spawns a MySQL container.
 * Returns a promise that resolves when the MySQL container is ready for connections.
 * @param {Object} options - Options for spawning the MySQL container.
 * @param {string} [options.tag='8.0.24'] - The MySQL image tag to use.
 * @param {string} [options.port='3306'] - The port to map to the MySQL container.
 * @param {number} [options.readyCount=2] - The number of "ready for connections" messages to wait for.
 * @returns {Promise<ChildProcess>} A promise that resolves with the MySQL container process.
 */
export function spawnMySQL ({
  tag = '8.0.24', 
  port = '3306',
  readyCount = 2
} = {}) {
  let readySeen = 0
  return new Promise((resolve, reject) => {
    let resolved = false
    const child = spawn(dockerCmd, [
      'run', '--rm',
      '-p', `${port}:3306`,
      '-e', 'MYSQL_ROOT_PASSWORD=rootpw',
      '-e', 'MYSQL_DATABASE=stigman',
      '-e', 'MYSQL_USER=stigman',
      '-e', 'MYSQL_PASSWORD=stigman',
      `mysql:${tag}`
    ])

    child.on('error', (err) => {
      console.error('ERROR', err)
      if (!resolved) reject(err)
    })

   readline.createInterface({
      input: child.stderr,
      crlfDelay: Infinity
    }).on('line', (line) => {
      if (line.includes('mysqld: ready for connections')) {
        readySeen++
        if (readySeen === readyCount) {
          resolved = true
          resolve(child)
        } 
      }
    })
  })
}

/**
 * Spawns a Python HTTP server, by default serving from the mock-keycloak directory.
 * @param {Object} options - Options for spawning the HTTP server.
 * @param {string} [options.port='8080'] - The port to serve the HTTP server on.
 * @param {string} [options.cwd=`${__dirname}/../../api/mock-keycloak`] - The working directory to serve files from.
 * @returns {ChildProcess} The HTTP server process.
 */
export function spawnHttpServer ({
  port = '8080',
  cwd = `${__dirname}/../../api/mock-keycloak`
} = {}) {
  const child =  spawn(pythonCmd, ['-m', 'http.server', port], {cwd})
  return child
}

export function execIpTables (args) {
  return execSync(`${iptablesCmd} ${args}`)
}