
const express = require('express');
const { expressMiddleware } = require('petitservice');
const { throwError } = require('petitservice/lib/utils');

const gsheetEndpoint = require('./gsheet');

const endpoints = {
  '/': gsheetEndpoint,
};

// Bootstrap express server
const app = express();

expressMiddleware.addStandard(app);
expressMiddleware.addCompression(app);
expressMiddleware.addLogs(app);

// Check privateKey
app.use((req, res, next) => {
  if (
    (
      process.env.PRIVATE_API_KEY
      && process.env.PRIVATE_API_KEY !== req.get('X-Private-Api-Key')
    )
    || (
      process.env.PRIVATE_API_KEY_QUERY
      && process.env.PRIVATE_API_KEY_QUERY !== req.query.key
    )
  ) {
    throwError('Unauthorized', 403);
  }
  return next();
});

// API Endpoints
Object.keys(endpoints).forEach((endpoint) => {
  app.use(endpoint, endpoints[endpoint]);
});

expressMiddleware.addErrorHandlers(app);

module.exports = app;
