const petitservice = require('petitservice');

// Start Server
function start() {
  return petitservice.serviceLoader()
    .express(() => require('./api'))
    .done();
}

module.exports = { start };
