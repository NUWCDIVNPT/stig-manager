const logger = require('./logger')
const WebSocket = require('ws')
const component = 'logSocket'
const auth = require('./auth')
const uuid = require('uuid')
const SmError = require('./error')
const AsyncApiValidator = require('asyncapi-validator')

const socketPath = '/socket/log-socket'
const unauthorizedTimeoutMs = 10000

class LogSession {
  constructor(ws, validator) {
    this.ws = ws;
    this.validator = validator;
    this.authorized = false;
    this.tokenExp = null;
    this.logForwarding = false;
    this.sessionId = uuid.v1();
    this.filter = null;
    this.pingIntervalId = null
    this.unauthorizedTimerId = null
  }

  start = () => {
    logger.writeInfo(component, 'session-start', { sessionId: this.sessionId, message: 'Session started' });
    this.ws.on('message', this.onSocketMessage);
    this.ws.on('close', this.stop);
    this.ws.on('pong', this.onSocketPong);
    this.startHeartbeat();
    this.sendUnauthorized();
  }

  stop = () => {
    this.sendClose('Session ending');
    this.disableLogForwarding();
    this.stopHeartbeat();

    this.ws.off('message', this.onSocketMessage);
    this.ws.off('close', this.stop);
    this.ws.off('pong', this.onSocketPong);

    if (this.tokenTimer) clearTimeout(this.tokenTimer);
    if (this.unauthorizedTimerId) {
      clearTimeout(this.unauthorizedTimerId);
      this.unauthorizedTimerId = null;
    }

    this.ws.close();
    logger.writeInfo(component, 'session-stop', { sessionId: this.sessionId, message: 'Session stopped' });
  }

  enableLogForwarding = () => {
    if (!this.logForwarding) {
      logger.loggerEvents.on('log', this.loggerEventHandler);
      this.logForwarding = true;
    }
  }

  disableLogForwarding = () => {
    if (this.logForwarding) {
      logger.loggerEvents.off('log', this.loggerEventHandler);
      this.logForwarding = false;
    }
  }

  includeLogRecord = (logObj) => {
    if (!this.filter) return true;
    return Object.entries(this.filter).every(([key, value]) => {
      return logObj[key] && value.includes(logObj[key]);
    });
  }

  loggerEventHandler = (logObj) => {
    if (this.authorized && this.includeLogRecord(logObj)) {
      this.sendLog(logObj);
    }
  }
  startHeartbeat = () => {
    this.stopHeartbeat();
    this.pingIntervalId = setInterval(this.sendPing, 30000);
  }

  stopHeartbeat = () => {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  sendPing = () => {
    try {
      this.ws.ping();
      logger.writeInfo(component, 'ping-sent', { sessionId: this.sessionId });
    } catch {
      // Ignore ping errors
    }
  }

  onSocketPong = () => {
    // Pong received, connection is alive
    logger.writeInfo(component, 'pong-received', { sessionId: this.sessionId });
  }

  onSocketMessage = (message) => {
    let msgObj;
    try {
      msgObj = JSON.parse(message);
    } catch {
      this.sendError('Invalid JSON message');
      return;
    }
    try {
      this.validator.validate(msgObj.type, msgObj, 'logStream', 'receive');
    }
    catch (e) {
      this.sendError('Message validation failed: ' + e.message);
      return;
    }
      if (msgObj.type === 'authorize' && (typeof msgObj.data?.token === 'string')) {
        const loggedMessage = this.deepClone(msgObj);
        loggedMessage.data.token = this.decodeToken(msgObj.data.token) || loggedMessage.data.token;
        logger.writeInfo(component, 'message-receive', { sessionId: this.sessionId, ...loggedMessage });
      } else {
        logger.writeInfo(component, 'message-receive', { sessionId: this.sessionId, ...msgObj });
      }
    switch (msgObj.type) {
      case 'authorize':
        this.onAuthorize(msgObj.data);
        break;
      case 'command':
        if (this.authorized) {
          this.onCommand(msgObj.data);
        }
        break;
      default:
        this.sendError('Unexpected message type');
    }
  }

  deepClone = (msg) => {
    return JSON.parse(JSON.stringify(msg));
  }


  onCommand = (commandData) => {
    switch (commandData.command) {
      case 'stream-start':
        this.filter = commandData.filter;
        this.enableLogForwarding();
        break;
      case 'stream-stop':
        this.disableLogForwarding();
        break;
      default:
        this.sendError('Unknown command');
    }
    this.sendInfo({ success: true, command: commandData });
  }

  onAuthorize = async (authData) => {
    // Validate token (format and expiration)
    try {
      // Accept JWTs: decode and check exp
      const decoded = auth.decodeToken(authData.token);
      
      // Mock a bad token for testing
      // decoded.header.kid = 'xxx-bad-kid-xxx';

      auth.checkInsecureKid(decoded);
      const signingKey = await auth.getSigningKey(decoded);
      auth.verifyToken(authData.token, signingKey);
      const privileges = auth.getClaimByPath(decoded.payload);
      if (!privileges.includes('admin')) {
        throw new SmError.PrivilegeError();
      }

      // successful authorization
      clearTimeout(this.unauthorizedTimerId);
      this.unauthorizedTimerId = null;

      this.tokenExp = decoded.payload.exp;
      this.startTokenTimer();

      this.authorized = true;
      this.sendAuthorized();
    } catch (e) {
      this.authorized = false;
      this.disableLogForwarding();
      logger.writeWarn(component, 'authorize-failed', { sessionId: this.sessionId, message: e.message });
      this.sendUnauthorized('Authorization failed: ' + e.detail || e.message);
      return;
    }
  }

  startTokenTimer = () => {
    if (this.tokenTimer) clearTimeout(this.tokenTimer);
    if (!this.tokenExp) return;
    const now = Math.floor(Date.now() / 1000);
    const ms = Math.max(0, (this.tokenExp - now) * 1000);
    this.tokenTimer = setTimeout(() => {
      this.authorized = false;
      this.disableLogForwarding();
      this.sendUnauthorized('jwt expired');
    }, ms);
  }

  decodeToken = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return decoded;
    } 
    catch {
      return null;
    }
  }
  
  sendUnauthorized = (reason) => {
    this.send({ type: 'authorize', data: { state: 'unauthorized', reason } });
    if (!this.unauthorizedTimerId) {
      this.unauthorizedTimerId = setTimeout(() => {
        this.stop();
      }, unauthorizedTimeoutMs); // Set a maximum time to be unauthorized
    }
  }

  sendAuthorized = () => {
    this.send({ type: 'authorize', data: { state: 'authorized' } });
  }

  sendClose = (message = 'Closing connection') => {
    this.send({ type: 'close', data: message});
  }

  sendInfo = (info) => {
    this.send({ type: 'info', data: info });
  }

  sendError = (error) => {
    this.send({ type: 'error', data: { message: error } }); 
  }

  sendLog = (logObj) => {
    this.send({ type: 'log', data: logObj });
  }

  send = (msg) => {
    try {
      this.validator.validate(msg.type, msg, 'logStream', 'send');
    } catch (e) {
      logger.writeError(component, 'message-validation-failed', { sessionId: this.sessionId, message: msg, error: e.message });
    }
    this.ws.send(JSON.stringify(msg));
    if (msg.type !== 'log') {
      const loggerFn = msg.type === 'error' ? logger.writeError : logger.writeInfo;
      loggerFn(component, 'message-send', { sessionId: this.sessionId, ...msg });
    }
  }

}

async function setupLogSocket (server, schemaPath) {
  const validator = await AsyncApiValidator.fromSource(schemaPath, {msgIdentifier: 'name'})
  const wss = new WebSocket.Server({ server, path: socketPath })
  wss.on('connection', (ws) => onConnection(ws, validator))
}


function onConnection (ws, validator) {
  const clientAddr = `${ws._socket.remoteAddress}:${ws._socket.remotePort}`;
  const logSession = new LogSession(ws, validator);
  logger.writeInfo(component, 'connection', {source: clientAddr, sessionId: logSession.sessionId, message: 'New log socket connection'});
  logSession.start();
}


module.exports = { setupLogSocket }