var ResponsePayload = function(code, payload) {
  this.code = code;
  this.payload = payload;
}

exports.respondWithCode = function(code, payload) {
  return new ResponsePayload(code, payload);
}

var writeJson = exports.writeJson = function(response, arg1, arg2) {
  var code;
  var payload;

  if(arg1 && arg1 instanceof ResponsePayload) {
    writeJson(response, arg1.payload, arg1.code);
    return;
  }

  if(arg2 && Number.isInteger(arg2)) {
    code = arg2;
  }
  else {
    if(arg1 && Number.isInteger(arg1)) {
      code = arg1;
    }
  }
  if(code && arg1) {
    payload = arg1;
  }
  else if(arg1) {
    payload = arg1;
  }

  if(!code) {
    // if no response code given, we default to 200
    code = 200;
  }
  if (typeof payload == 'undefined') {
    code = 204
  }
  if(typeof payload === 'object') {
    if (payload instanceof Error) {
      payload = JSON.stringify(payload, Object.getOwnPropertyNames(payload), 2);
    }
    else {
      // payload = JSON.stringify(payload, null, 2);
      payload = JSON.stringify(payload);
    }
  }
  response.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-control': 'no-store'
  });
  response.end(payload);
}

exports.writePdf = function(response, payload, filename) {
  response.writeHead(200, {
    'Content-Type': 'application/pdf', 
    'Content-Disposition': `inline; filename="${filename}"`,
    'Access-Control-Expose-Headers': 'Content-Disposition'
  })
  response.write(payload)
  response.end()
}
exports.writeCsv = function(response, payload, filename) {
  response.writeHead(200, {
    'Content-Type': 'text/csv',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Access-Control-Expose-Headers': 'Content-Disposition'
  })
  response.write(payload)
  response.end()
}
exports.writeXml = function(response, payload, filename) {
  response.writeHead(200, {
    'Content-Type': 'application/xml',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Access-Control-Expose-Headers': 'Content-Disposition'
  })
  response.write(payload)
  response.end()
}
exports.writeNoContent = function (response) {
  response.writeHead(204)
  response.end()
}

