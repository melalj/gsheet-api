const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const morgan = require('morgan');

const { throwError } = require('../utils.js');

const gsheetEndpoint = require('./gsheet.js');

const logger = morgan('combined');

const endpoints = {
  '/': gsheetEndpoint,
};

// Bootstrap express server
const app = express();

// Add Middlewares
app.disable('x-powered-by');
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10000 }));

// Health check
app.get('/~health', (req, res) => res.send('ok'));
app.get('/health', (req, res) => res.send('ok'));

// Remove trailing slashes
app.use((req, res, next) => {
  if (req.path.substr(-1) === '/' && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

// Compression
app.use(compression());

// Logs
app.use(logger);

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

// Page not found
app.use((req, res) => {
  res.status(404);
  return res.send({ error: 'Not found' });
});

// Output Error page
app.use((err, req, res, next) => { // eslint-disable-line
  const status = err.status || 500;
  res.status(status);
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(`${err.message} (${err.stack.replace(/\n/g, ', ')})`);
  }
  if (process.env.NODE_ENV === 'production') {
    return res.send({ error: err.message });
  }
  res.send({
    error: err.message,
    status,
    trace: err,
    stack: err.stack,
  });
});

module.exports = app;
