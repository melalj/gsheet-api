const api = require('./api');

// Start Server
function start() {
  const port = process.env.PORT || 80;
  api.listen(port, () => {
    console.log(`gsheet-api listening at http://localhost:${port}`);
  });
}

module.exports = { start };
