const express = require('express');
const { google } = require('googleapis');

const utils = require('../utils');

// :oad the environment variable with our keys
const keysEnvVar = process.env.GOOGLE_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error('The $GOOGLE_CREDENTIALS environment variable was not found!');
}
const keys = JSON.parse(keysEnvVar);

const auth = new google.auth.JWT(
  keys.email,
  null,
  keys.private_key,
  [
    'https://www.googleapis.com/auth/drive',
  ],
);
const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// --------------
// Routes
// --------------

const router = express.Router();

// --------------
// GET /gsheet/
// --------------
router.get('/', async (req, res, next) => {
  try {
    const driveRes = await drive.files.list({
      q: 'trashed = false and mimeType = \'application/vnd.google-apps.spreadsheet\'',
      fields: 'files(id, name, modifiedTime)',
      spaces: 'drive',
      pageSize: 1000,
    });
    res.send(driveRes.data.files);
  } catch (e) {
    next(e);
  }
});

// --------------
// GET /gsheet/:spreadsheetId
// --------------
router.get('/:spreadsheetId', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 401);
    const params = utils.getParams(req.params, ['spreadsheetId']);
    const { spreadsheetId } = params;

    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const output = sheetRes.data.sheets.map((d) => ({
      title: d.properties.title,
      idx: d.properties.index,
      spreadsheetId: d.properties.spreadsheetId,
      rowCount: d.properties.gridProperties.rowCount,
      columnCount: d.properties.gridProperties.columnCount,
    }));

    return res.send(output);
  } catch (e) {
    return next(e);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName
// --------------
router.get('/:spreadsheetId/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 401);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 401);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);
    const { spreadsheetId, sheetName } = params;

    const offset = req.query.offset ? Number(req.query.offset) : 2;
    const perPage = req.query.perPage ? Number(req.query.perPage) : 1000;

    const firstRow = offset;
    const lastRow = offset + perPage - 1;

    const maxColumn = 'EE';

    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const countRange = `${sheetName}!A2:A`;
    const paginatedRange = `${sheetName}!A${firstRow}:${maxColumn}${lastRow}`;

    const sheetRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        headerRange,
        countRange,
        paginatedRange,
      ],
    });

    const headerRow = sheetRes.data.valueRanges[0].values[0];
    const totalItems = sheetRes.data.valueRanges[1].values.length;
    const rows = sheetRes.data.valueRanges[2].values;

    const columns = {};
    headerRow.forEach((columnName, columnIndex) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });
    const data = [];
    for (let i = 0; i < rows.length; i += 1) {
      if (req.query.returnColumn !== undefined) {
        data.push(rows[i][parseInt(req.query.returnColumn, 10)]);
      } else {
        const row = {};
        row.idx = (firstRow + i);
        headerRow.forEach((columnName, columnIndex) => {
          row[columnName] = utils.detectValues(rows[i][columnIndex]);
        });
        data.push(row);
      }
    }

    const pagination = {
      perPage,
      range: paginatedRange,
      offset,
      totalItems,
      haveNext: totalItems > offset + perPage,
    };

    return res.send({ columns, pagination, data });
  } catch (e) {
    if (e.trace && e.trace.response && e.trace.response.data.error) {
      const err = new Error(e.trace.response.data.error.message);
      err.status = 400;
      return next(err);
    }
    return next(e);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName/:idx
// --------------
router.get('/:spreadsheetId/:sheetName/:idx', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 401);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 401);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName', 'idx']);
    const { idx } = req.params;

    const { spreadsheetId, sheetName } = params;

    const maxColumn = 'EE';

    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const dataRange = `${sheetName}!A${idx}:${maxColumn}${idx}`;

    const sheetRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        headerRange,
        dataRange,
      ],
    });
    const headerRow = sheetRes.data.valueRanges[0].values[0];
    const rows = sheetRes.data.valueRanges[1].values;
    const row = { idx };
    headerRow.forEach((columnName, columnIndex) => {
      row[columnName] = rows[0][columnIndex];
    });

    return res.send(row);
  } catch (e) {
    if (e.trace && e.trace.response && e.trace.response.data.error) {
      const err = new Error(e.trace.response.data.error.message);
      err.status = 400;
      return next(err);
    }
    return next(e);
  }
});


// --------------
// PUT /gsheet/:spreadsheetId/:sheetName/:idx
// --------------
router.put('/:spreadsheetId/:sheetName/:idx', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 401);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 401);
    if (!req.params.idx) return utils.throwError('Missing idx').notEmpty().isInt({ min: 2 });
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName', 'idx']);

    const { spreadsheetId, sheetName } = params;

    const maxColumn = 'EE';
    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const headerRow = sheetRes.data.values[0];

    const { body } = req;

    const data = [];

    // Existing columns
    const columns = {};
    headerRow.forEach((columnName, columnIndex) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    // New columns
    let newColCount = 0;
    Object.keys(body).forEach((k) => {
      if (!columns[k]) {
        newColCount += 1;
        columns[k] = `${sheetName}!${utils.numberToLetter(headerRow.length + newColCount)}`;
        data.push({
          range: `${columns[k]}1`,
          values: [[k]],
        });
      }
    });

    // ValueRange
    Object.keys(body).forEach((columnName) => {
      data.push({
        range: `${columns[columnName]}${params.idx}`,
        values: [[body[columnName]]],
      });
    });

    // Update
    const updatedSheet = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data,
      },
    });

    return res.send(updatedSheet.data.responses);
  } catch (e) {
    return next(e);
  }
});

// --------------
// POST /:spreadsheetId/:sheetName
// --------------
router.post('/:spreadsheetId/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 401);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 401);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params;

    const maxColumn = 'EE';
    const defaultRange = `${sheetName}!A:${maxColumn}`;

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: defaultRange,
    });
    const rows = sheetRes.data.values;

    const { body } = req;

    // Existing columns
    const columns = {};
    const columnList = (rows ? rows[0] : []).slice();
    columnList.forEach((columnName, columnIndex) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    // New columns
    let newColCount = 0;
    const data = [];
    Object.keys(body).forEach((k) => {
      if (!columns[k]) {
        newColCount += 1;
        columns[k] = `${sheetName}!${utils.numberToLetter(columnList.length + 1)}`;
        columnList.push(k);
        data.push({
          range: `${columns[k]}1`,
          values: [[k]],
        });
      }
    });
    if (newColCount) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data,
        },
      });
    }

    const values = [columnList.map((c) => body[c] || '')];

    // Append
    const appendedSheet = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: defaultRange,
      valueInputOption: 'RAW',
      includeValuesInResponse: true,
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    });

    // Output
    const idx = appendedSheet.data.updates.updatedRange.split('!A')[1].split(':')[0];
    body.idx = Number(idx);
    return res.send(body);
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
