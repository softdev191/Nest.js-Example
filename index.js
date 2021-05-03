const server = require('./build/server/server.lambda');

module.exports.handler = server.handler;
