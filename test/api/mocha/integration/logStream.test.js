
import MockOidc from '../../../utils/mockOidc.js'
import WebSocket from 'ws';
import { expect } from 'chai'

const oidc = new MockOidc({ keyCount: 0, includeInsecureKid: true })

describe('LogStream authorization', async function () {
  this.timeout(5000)

  it('should ask for a token on socket connection', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.close();
  });

  it('should close connection after timeout if no token is provided', async function () {
    this.timeout(40000);
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 15000)); // wait for timeout (10s + buffer)
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    expect(socket.messages[1]).to.have.property('type', 'close');
    expect(socket.ws.readyState).to.equal(WebSocket.CLOSED);
  });

  it('should accept a valid token', async function () {
    const socket = await openSocket();
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'] })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'authorized');
    socket.ws.close();
  });

  it('should reject an expired token', async function () {
    this.timeout(60000);
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'], expiresIn: -10 })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'unauthorized');
    expect(socket.messages[1].data).to.have.property('reason').that.includes('jwt expired');
    socket.ws.close();
  });

  it('should reject a token without admin role', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: [] })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'unauthorized');
    expect(socket.messages[1].data).to.have.property('reason').that.includes('Authorization failed');
    socket.ws.close();
  });

  it('should reject a malformed token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = 'malformed.token.value'
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'unauthorized');
    expect(socket.messages[1].data).to.have.property('reason').that.includes('Authorization failed');
    socket.ws.close();
  });
  
  it('should reject an empty token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token: '' } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'unauthorized');
    expect(socket.messages[1].data).to.have.property('reason').that.includes('Authorization failed');
    socket.ws.close();
  });

  it('should reject an invalid message without token', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'error');
    expect(socket.messages[1].data).to.have.property('message').to.match(/^Message validation failed/);
    socket.ws.close();
  });

  it('should error when token expires', async function () {
    const socket = await openSocket()
    await new Promise(r => setTimeout(r, 500)); // wait for socket to be ready
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'], expiresIn: 1 })
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'authorized');

    await new Promise(r => setTimeout(r, 2000)); // wait for token to expire
    expect(socket.messages).to.have.lengthOf(3);
    expect(socket.messages[2]).to.have.property('type', 'authorize');
    expect(socket.messages[2].data).to.have.property('state', 'unauthorized');
    expect(socket.messages[2].data).to.have.property('reason', 'jwt expired');
    socket.ws.close();
  });
  
  it('should stream log messages until token expires', async function () {
    this.timeout(10000);
    const socket = await openSocket();
    await new Promise(r => setTimeout(r, 500));
    expect(socket.messages).to.have.lengthOf(1);
    expect(socket.messages[0]).to.have.property('type', 'authorize');

    // Short-lived token (2s)
    const token = oidc.getToken({ sub: 'test-user', privileges: ['admin'], expiresIn: 5 });
    socket.ws.send(JSON.stringify({ type: 'authorize', data: { token } }));
    await new Promise(r => setTimeout(r, 300));
    expect(socket.messages).to.have.lengthOf(2);
    expect(socket.messages[1]).to.have.property('type', 'authorize');
    expect(socket.messages[1].data).to.have.property('state', 'authorized');

    // Start log stream
    socket.ws.send(JSON.stringify({ type: 'command', data: { command: 'stream-start' } }));
    await new Promise(r => setTimeout(r, 200));

    // Wait for log message to be received
    let logReceived = false;
    for (let i = 0; i < 10; i++) {
      if (socket.messages.some(m => m.type === 'log')) {
        logReceived = true;
        break;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    expect(logReceived, 'Log message should be received').to.be.true;

    // Wait for token to expire and unauthorized message
    let unauthorizedReceived = false;
    for (let i = 0; i < 20; i++) {
      if (socket.messages.some(m => m.type === 'authorize' && m.data && m.data.state === 'unauthorized')) {
        unauthorizedReceived = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    expect(unauthorizedReceived, 'Should receive unauthorized after token expires').to.be.true;

    // After unauthorized, further logs should not be received
    // const logCountBefore = socket.messages.filter(m => m.type === 'log').length;
    // await utils.executeRequest(`${config.baseUrl}/op/configuration`, 'GET', token);
    // await new Promise(r => setTimeout(r, 500));
    // const logCountAfter = socket.messages.filter(m => m.type === 'log').length;
    // expect(logCountAfter).to.equal(logCountBefore);

    socket.ws.close();
  });
});


async function openSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:64001/socket/log-socket')
    const resolution = {
      ws,
      messages: [],
    }
    ws.on('message', function incoming(data) {
      const msg = JSON.parse(data)
      resolution.messages.push(msg)
    });
    ws.on('error', function error(err) {
      reject(err instanceof Error ? err : new Error(err))
    });
    ws.on('open', function open() {
      resolve(resolution)
    });
  })
}

