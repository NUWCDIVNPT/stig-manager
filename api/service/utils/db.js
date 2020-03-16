let config = require('./config');
const mysql = require( 'promise-mysql' );
var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : config.mysql.host,
    port            : config.mysql.port,
    user            : config.mysql.username,
    password        : config.mysql.password,
    typeCast: function (field, next) {
      if (field.type == 'JSON') {
        return (JSON.parse(field.string())); 
      }
      return next();
    } 
  });
  
module.exports = pool;