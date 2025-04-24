
const EventEmitter = require('node:events')
const crypto = require('node:crypto')
const http = require('node:http')
const https = require('node:https')
const logger = require('./logger')

class JWKSCache extends EventEmitter {
  constructor({ jwksUri, cacheMaxAge = 60000 }) {
    super()
    this.cache = new Map()
    this.jwksUri = jwksUri
    this.cacheMaxAge = Math.min(cacheMaxAge, 2 ** 31 - 1)
    this.cacheRefreshAge = this.cacheMaxAge / 2
    this.staleTimeoutId = null
    this.refreshTimeoutId = null
    this.isCacheUpdating = false
  }

  getKey(kid) {
    if (this.cache.has(kid)) {
      return this.cache.get(kid)
    }
    return null
  }

  getKids() {
    return Array.from(this.cache.keys())
  }

  getKidTypes() {
    const keys = {}
    for (const [kid, key] of this.cache.entries()) {
      keys[kid] = key.type
    }
    return keys
  }

  setKey(kid, key) {
    this.cache.set(kid, key)
    this.emit('keyAdded', kid, key)
  }

  async refreshCache(retryOnFailure = true) {
    logger.writeInfo('jwksCache', 'refreshing cache', { uri: this.jwksUri })
    clearTimeout(this.refreshTimeoutId)
    const result = await this.updateCache()
    if (!result) {
      logger.writeError('jwksCache', 'refresh error', { message: 'updateCache returned false' })
      if (retryOnFailure) this.refreshTimeoutId = setTimeout(this.refreshCache.bind(this), 10000)
      return result
    }
    this.refreshTimeoutId = setTimeout(this.refreshCache.bind(this), this.cacheRefreshAge)
    return result
  }

  clearAllCache() {
    this.cache.clear()
  }

  clearCacheKeepUnknown() {
    for (const [kid, key] of this.cache.entries()) {
      if (key !== 'unknown') {
        this.cache.delete(kid)
      }
    }
  }

  onCacheStale() {
    this.clearCacheKeepUnknown()
    this.emit('cacheStale', this.cache)
  }

  request(url, options) {
    return new Promise((resolve, reject) => {
      const socketInfo = {
        localAddress: undefined,
        localPort: undefined,
        remoteAddress: undefined,
        remotePort: undefined
      }
      const requestOptions = {
        timeout: 10000,
        ...options
      }
  
      const httpRequestLib = url.protocol === 'https:' ? https : http;
      const httpRequest = httpRequestLib.request(url, requestOptions
        , (res) => {
          const socket = res.socket
          socketInfo.localAddress = socket.localAddress
          socketInfo.localPort = socket.localPort
          socketInfo.remoteAddress = socket.remoteAddress
          socketInfo.remotePort = socket.remotePort
    
          let rawData = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => rawData += chunk)
          res.on('end', () => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              const errorMsg = res.body && (res.body.message || res.body) || res.statusMessage || `Http Error ${res.statusCode}`
              reject({ errorMsg })
            }
            else {
              try {
                logger.writeInfo('jwksCache','response', {socket: formatSocket(socketInfo)})
                resolve(rawData && JSON.parse(rawData))
              }
              catch (error) {
                reject(error)
              }
            }
          })
        }
      )
  
      /**
       * Formats a Node.js socket object into a string representation.
       * 
       * @param {net.Socket} socket - The Node.js socket object.
       * @returns {string|undefined} A string representation of the socket's local and remote addresses and ports, or undefined if the socket is not connected.
       */
      function formatSocket(socket) {
        return socket.localAddress || socket.remoteAddress ? `${socket.localAddress}:${socket.localPort} -> ${socket.remoteAddress}:${socket.remotePort}` : undefined
      }
  
  
      function onSocket(socket) {
        socketInfo.localAddress = socket.localAddress
        socketInfo.localPort = socket.localPort
        socketInfo.remoteAddress = socket.remoteAddress
        socketInfo.remotePort = socket.remotePort
        socketInfo.socket = socket
  
        logger.writeDebug('jwksCache', 'requestEvent', {event: 'socket', socket: formatSocket(socketInfo)})
        socket.on('error', (error) => {
          const err = error.errors ? error.errors[0] : error
          socketInfo.remoteAddress = err.address
          socketInfo.remotePort = err.port
          logger.writeError('jwksCache', 'socketEvent', {event: 'error', socket: formatSocket(socketInfo), message: err.message})
        })
        socket.on('connectionAttempt', (ip, port, family) => {
          socketInfo.remoteAddress = ip
          socketInfo.remotePort = port
          logger.writeDebug('jwksCache', 'socketEvent', {event: 'connectionAttempt', ip, port, family})
  
        })
        socket.on('connectionAttemptFailed', (ip, port, family, error) => {
          socketInfo.remoteAddress = ip
          socketInfo.remotePort = port
          logger.writeDebug('jwksCache', 'socketEvent', {event: 'connectionAttemptFailed', ip, port, family, message: error.message})
  
        })
        socket.on('lookup', (error, address, family, host) => {
          socketInfo.remoteAddress = address
          logger.writeDebug('jwksCache', 'socketEvent', {event: 'lookup', address, family, host, message: error?.message })
        })
      }
  
      function onError(error) {
        // if (error.socket) {
        //   console.error(`req error, remote port: ${error.socket.remotePort}`);
        // } else {
        //   console.error("req error, but no socket information available.");
        // }
        reject(error)
      }
  
      function onTimeout() {
        console.log('Request timed out', formatSocket(socketInfo))
        httpRequest.destroy()
      }
  
      httpRequest
        .on('socket', onSocket)
        .on('timeout', onTimeout)
        .on('error', onError)
        .end()
    })
  }

  extractKeysFromJwks(jwks) {
    const results = []
  
    jwks = jwks
      .filter(({ use }) => use === 'sig' || use === undefined)
      .filter(({ kty }) => kty === 'RSA' || kty === 'EC' || kty === 'OKP')
  
    for (const jwk of jwks) {
      try {
        if (!jwk.kid) throw new Error('Missing kid')
        const publicKey = crypto.createPublicKey({ format: 'jwk', key: jwk })
  
        results.push({
          publicKey,
          publicKeyPem: publicKey.export({ format: 'pem', type: 'spki' }),
          kid: jwk.kid,
          alg: jwk.alg
        })
      }
      catch (err) {
        continue
      }
    }
  
    return results
  }

  updateCache() {
    return new Promise((resolve) => {
      if (!this.isCacheUpdating) {
        this.isCacheUpdating = true
        this.request(new URL(this.jwksUri), { method: 'GET' })
          .then(jwks => {
            clearTimeout(this.staleTimeoutId)
            this.staleTimeoutId = setTimeout(this.onCacheStale.bind(this), this.cacheMaxAge)
            this.clearCacheKeepUnknown()
            const keys = this.extractKeysFromJwks(jwks.keys)
            for (const key of keys) {
              this.setKey(key.kid, key.publicKey)
            }
            
            this.isCacheUpdating = false
            this.emit('cacheUpdate', this.cache)
            resolve(true)
          })
          .catch(error => {
            this.isCacheUpdating = false
            this.emit('cacheError', error)
            resolve(false)
          })
      }
      else { // an update is already in progress
        logger.writeDebug('jwksCache', 'updateCache', { message: 'update already in progress' })
        this.once('cacheUpdate', () => {
          logger.writeDebug('jwksCache', 'cacheUpdate', { message: 'concurrent update event' })
          resolve(true)
        })
        this.once('cacheError', () => {
          logger.writeDebug('jwksCache', 'cacheError', { message: 'concurrent update event' })
          resolve(false)
        })
      }
    })
  }
}

module.exports = JWKSCache