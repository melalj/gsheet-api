const express = require('express');
const { google } = require('googleapis');

const utils = require('../utils');

// :oad the environment variable with our keys
const keysEnvVar = process.env.GOOGLE_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error('The $GOOGLE_CREDENTIALS environment variable was not found!');
}
const keys = JSON.parse(Buffer.from(keysEnvVar, 'base64'));

const auth = new google.auth.JWT(
  keys.client_email,
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
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    const params = utils.getParams(req.params, ['spreadsheetId']);
    const { spreadsheetId } = params;

    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const output = sheetRes.data.sheets.map((d) => ({
      title: d.properties.title,
      index: d.properties.index,
      sheetId: d.properties.sheetId,
      rowCount: d.properties.gridProperties.rowCount,
      columnCount: d.properties.gridProperties.columnCount,
    }));

    return res.send(output);
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName
// --------------
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);
    const { spreadsheetId, sheetName } = params;

    const offset = req.query.offset ? Number(req.query.offset) : 2;
    const perPage = req.query.perPage ? Number(req.query.perPage) : 1000;

    const firstRow = offset;
    const lastRow = offset + perPage - 1;

    const maxColumn = req.query.columnCount
      ? utils.numberToLetter(Number(req.query.columnCount))
      : 'EE';

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
    const totalItems = (sheetRes.data.valueRanges[1].values || []).length;
    const rows = sheetRes.data.valueRanges[2].values || [];

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
        let validValuesCount = 0;
        row.rowNumber = (firstRow + i);
        headerRow.forEach((columnName, columnIndex) => {
          row[columnName] = utils.detectValues(rows[i][columnIndex]);
          if (row[columnName]) validValuesCount += 1;
        });
        if (validValuesCount) data.push(row);
      }
    }

    const pagination = {
      perPage,
      range: paginatedRange,
      offset,
      nextOffset: offset + perPage,
      totalItems,
      haveNext: totalItems > offset + perPage,
    };

    return res.send({ columns, pagination, data });
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName/:rowNumber
// --------------
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)/:sheetName/:rowNumber', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName', 'rowNumber']);
    const { rowNumber } = req.params;

    const { spreadsheetId, sheetName } = params;

    const maxColumn = req.query.columnCount
      ? utils.numberToLetter(Number(req.query.columnCount))
      : 'EE';

    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const dataRange = `${sheetName}!A${rowNumber}:${maxColumn}${rowNumber}`;

    const sheetRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        headerRange,
        dataRange,
      ],
    });
    const headerRow = sheetRes.data.valueRanges[0].values[0];
    const rows = sheetRes.data.valueRanges[1].values;
    const row = { rowNumber: Number(rowNumber) };
    headerRow.forEach((columnName, columnIndex) => {
      row[columnName] = utils.detectValues(rows[0][columnIndex]);
    });

    return res.send(row);
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

// --------------
// PUT /gsheet/:spreadsheetId/:sheetName
// --------------
router.put('/:spreadsheetId/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);

    if (!req.body) return utils.throwError('Missing body');
    if (typeof req.body !== 'object') return utils.throwError('Body should be an object: { ROW_NUMBER: { DATA_TO_UPDATE },... }');

    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params;

    const maxColumn = req.query.columnCount
      ? utils.numberToLetter(Number(req.query.columnCount))
      : 'EE';

    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const headerRow = sheetRes.data.values[0];

    const data = [];

    // Existing columns
    const columns = {};
    headerRow.forEach((columnName, columnIndex) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    // Build data to update
    Object.keys(req.body).forEach((rowNumber) => {
      const body = req.body[rowNumber];

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
          range: `${columns[columnName]}${rowNumber}`,
          values: [[body[columnName]]],
        });
      });
    });

    // Batch Update
    const updatedSheet = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: req.query.valueInputOption || 'USER_ENTERED',
        data,
      },
    });

    return res.send(updatedSheet.data.responses);
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

// --------------
// DELETE /gsheet/:spreadsheetId/:sheetName
// --------------
router.delete('/:spreadsheetId/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    if (!req.body) return utils.throwError('Missing body');
    if (!Array.isArray(req.body)) return utils.throwError('Body should be an array: [ ROW_NUMBER... ]');
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params;

    // Get sheetId
    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetInfo = sheetRes.data.sheets.find((d) => d.properties.title === sheetName);
    if (!sheetInfo) return utils.throwError('Sheet not found', 404);

    const { sheetId } = sheetInfo.properties;

    // Build requests (we should delete from the bottom to top)
    const rowNumbers = req.body.map((d) => Number(d));
    rowNumbers.sort((a, b) => b - a);

    const requests = [];
    rowNumbers.forEach((endIndex) => {
      requests.push({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: endIndex - 1,
            endIndex,
          },
        },
      });
    });

    // Batch Delete
    const updatedSheet = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests,
      },
    });

    return res.send({ deletedRows: updatedSheet.data.replies.length });
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

// --------------
// POST /:spreadsheetId/:sheetName
// --------------
router.post('/:spreadsheetId/:sheetName', async (req, res, next) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    if (!req.body) return utils.throwError('Missing body');
    if (!Array.isArray(req.body)) return utils.throwError('Body should be an array: [ ROW... ]');

    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params;

    const maxColumn = req.query.columnCount
      ? utils.numberToLetter(Number(req.query.columnCount))
      : 'EE';
    const defaultRange = `${sheetName}!A:${maxColumn}`;

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: defaultRange,
    });
    const rows = sheetRes.data.values;

    // Existing columns
    const columns = {};
    const columnList = (rows ? rows[0] : []).slice();
    columnList.forEach((columnName, columnIndex) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    // Check if there's new columns
    let newColCount = 0;
    const data = [];
    req.body.forEach((body) => {
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
    });
    if (newColCount) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: req.query.valueInputOption || 'USER_ENTERED',
          data,
        },
      });
    }

    const values = req.body.map((r) => columnList.map((c) => r[c] || ''));

    // Append
    const appendedSheet = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: defaultRange,
      valueInputOption: req.query.valueInputOption || 'USER_ENTERED',
      includeValuesInResponse: true,
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values,
      },
    });

    // Output
    const { updatedRows } = appendedSheet.data.updates;
    return res.send({ insertedRow: updatedRows });
  } catch (e) {
    if (e.response) {
      const error = new Error(e.response.data.error.message);
      error.status = e.response.data.error.code;
      return next(error);
    }
    return next(e);
  }
});

module.exports = router;
