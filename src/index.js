const api = require('./api/index.js');

// Start Server
function start() {
  const port = Number(process.env.PORT || 80);
  const host = process.env.HOST || '0.0.0.0';
  api.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`gsheet-api listening at http://localhost:${port}`);
  });
}

module.exports = { start };
