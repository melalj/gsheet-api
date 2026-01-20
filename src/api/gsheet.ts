import express, { type Request, type Response, type NextFunction, type Router } from 'express';
import { google } from 'googleapis';

import * as utils from '../utils.js';

// Load the environment variable with our keys
const keysEnvVar = process.env.GOOGLE_CREDENTIALS;
if (!keysEnvVar) {
  throw new Error('The $GOOGLE_CREDENTIALS environment variable was not found!');
}
const keys = JSON.parse(Buffer.from(keysEnvVar, 'base64').toString('utf-8')) as {
  client_email: string;
  private_key: string;
};

const auth = new google.auth.JWT(
  keys.client_email,
  undefined,
  keys.private_key,
  ['https://www.googleapis.com/auth/drive'],
);

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Types
interface SheetParams {
  spreadsheetId: string;
  sheetName?: string;
  rowNumber?: string;
}

interface QueryParams {
  offset?: string;
  perPage?: string;
  columnCount?: string;
  returnColumn?: string;
  valueInputOption?: string;
  key?: string;
}

interface GoogleApiError {
  response?: {
    data: {
      error: {
        message: string;
        code: number;
      };
    };
  };
}

function handleGoogleApiError(e: unknown, next: NextFunction): void {
  const apiError = e as GoogleApiError;
  if (apiError.response) {
    const error = new Error(apiError.response.data.error.message) as utils.AppError;
    error.status = apiError.response.data.error.code;
    next(error);
  } else {
    next(e);
  }
}

// --------------
// Routes
// --------------

const router: Router = express.Router();

// --------------
// GET /gsheet/
// --------------
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const driveRes = await drive.files.list({
      q: "trashed = false and mimeType = 'application/vnd.google-apps.spreadsheet'",
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
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)', async (req: Request<SheetParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    const params = utils.getParams(req.params, ['spreadsheetId']);
    const { spreadsheetId } = params as { spreadsheetId: string };

    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const output = sheetRes.data.sheets?.map((d) => ({
      title: d.properties?.title,
      index: d.properties?.index,
      sheetId: d.properties?.sheetId,
      rowCount: d.properties?.gridProperties?.rowCount,
      columnCount: d.properties?.gridProperties?.columnCount,
    })) || [];

    return res.send(output);
  } catch (e) {
    handleGoogleApiError(e, next);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName
// --------------
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)/:sheetName', async (req: Request<SheetParams, unknown, unknown, QueryParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);
    const { spreadsheetId, sheetName } = params as { spreadsheetId: string; sheetName: string };

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

    const headerRow = sheetRes.data.valueRanges?.[0]?.values?.[0] as string[] || [];
    const totalItems = (sheetRes.data.valueRanges?.[1]?.values || []).length;
    const rows = sheetRes.data.valueRanges?.[2]?.values || [];

    const columns: Record<string, string> = {};
    headerRow.forEach((columnName: string, columnIndex: number) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    const data: (Record<string, unknown> | string | number | boolean | null)[] = [];
    for (let i = 0; i < rows.length; i += 1) {
      if (req.query.returnColumn !== undefined) {
        data.push(rows[i][parseInt(req.query.returnColumn, 10)]);
      } else {
        const row: Record<string, unknown> = {};
        let validValuesCount = 0;
        row.rowNumber = (firstRow + i);
        headerRow.forEach((columnName: string, columnIndex: number) => {
          row[columnName] = utils.detectValues(rows[i]?.[columnIndex]);
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
    handleGoogleApiError(e, next);
  }
});

// --------------
// GET /gsheet/:spreadsheetId/:sheetName/:rowNumber
// --------------
router.get('/:spreadsheetId([a-zA-Z0-9-_]+)/:sheetName/:rowNumber', async (req: Request<SheetParams, unknown, unknown, QueryParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName', 'rowNumber']);
    const { rowNumber } = req.params;

    const { spreadsheetId, sheetName } = params as { spreadsheetId: string; sheetName: string };

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
    const headerRow = sheetRes.data.valueRanges?.[0]?.values?.[0] as string[] || [];
    const rows = sheetRes.data.valueRanges?.[1]?.values || [];
    const row: Record<string, unknown> = { rowNumber: Number(rowNumber) };
    headerRow.forEach((columnName: string, columnIndex: number) => {
      row[columnName] = utils.detectValues(rows[0]?.[columnIndex]);
    });

    return res.send(row);
  } catch (e) {
    handleGoogleApiError(e, next);
  }
});

// --------------
// PUT /gsheet/:spreadsheetId/:sheetName
// --------------
router.put('/:spreadsheetId/:sheetName', async (req: Request<SheetParams, unknown, Record<string, Record<string, unknown>>, QueryParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);

    if (!req.body) return utils.throwError('Missing body');
    if (typeof req.body !== 'object') return utils.throwError('Body should be an object: { ROW_NUMBER: { DATA_TO_UPDATE },... }');

    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params as { spreadsheetId: string; sheetName: string };

    const maxColumn = req.query.columnCount
      ? utils.numberToLetter(Number(req.query.columnCount))
      : 'EE';

    const headerRange = `${sheetName}!A1:${maxColumn}1`;
    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });
    const headerRow = sheetRes.data.values?.[0] as string[] || [];

    const data: { range: string; values: unknown[][] }[] = [];

    // Existing columns
    const columns: Record<string, string> = {};
    headerRow.forEach((columnName: string, columnIndex: number) => {
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
      requestBody: {
        valueInputOption: req.query.valueInputOption || 'USER_ENTERED',
        data,
      },
    });

    return res.send(updatedSheet.data.responses);
  } catch (e) {
    handleGoogleApiError(e, next);
  }
});

// --------------
// DELETE /gsheet/:spreadsheetId/:sheetName
// --------------
router.delete('/:spreadsheetId/:sheetName', async (req: Request<SheetParams, unknown, number[], QueryParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    if (!req.body) return utils.throwError('Missing body');
    if (!Array.isArray(req.body)) return utils.throwError('Body should be an array: [ ROW_NUMBER... ]');
    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params as { spreadsheetId: string; sheetName: string };

    // Get sheetId
    const sheetRes = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetInfo = sheetRes.data.sheets?.find((d) => d.properties?.title === sheetName);
    if (!sheetInfo) return utils.throwError('Sheet not found', 404);

    const sheetId = sheetInfo.properties?.sheetId;

    // Build requests (we should delete from the bottom to top)
    const rowNumbers = req.body.map((d) => Number(d));
    rowNumbers.sort((a, b) => b - a);

    const requests = rowNumbers.map((endIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS' as const,
          startIndex: endIndex - 1,
          endIndex,
        },
      },
    }));

    // Batch Delete
    const updatedSheet = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests,
      },
    });

    return res.send({ deletedRows: updatedSheet.data.replies?.length || 0 });
  } catch (e) {
    handleGoogleApiError(e, next);
  }
});

// --------------
// POST /:spreadsheetId/:sheetName
// --------------
router.post('/:spreadsheetId/:sheetName', async (req: Request<SheetParams, unknown, Record<string, unknown>[], QueryParams>, res: Response, next: NextFunction) => {
  try {
    // Validations
    if (!req.params.spreadsheetId) return utils.throwError('Missing spreadsheetId', 400);
    if (!req.params.sheetName) return utils.throwError('Missing sheetName', 400);
    if (!req.body) return utils.throwError('Missing body');
    if (!Array.isArray(req.body)) return utils.throwError('Body should be an array: [ ROW... ]');

    const params = utils.getParams(req.params, ['spreadsheetId', 'sheetName']);

    const { spreadsheetId, sheetName } = params as { spreadsheetId: string; sheetName: string };

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
    const columns: Record<string, string> = {};
    const columnList: string[] = (rows ? rows[0] : []).slice() as string[];
    columnList.forEach((columnName: string, columnIndex: number) => {
      columns[columnName] = `${sheetName}!${utils.numberToLetter(columnIndex + 1)}`;
    });

    // Check if there's new columns
    let newColCount = 0;
    const data: { range: string; values: unknown[][] }[] = [];
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
        requestBody: {
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
      requestBody: {
        values,
      },
    });

    // Output
    const updatedRows = appendedSheet.data.updates?.updatedRows;
    return res.send({ insertedRow: updatedRows });
  } catch (e) {
    handleGoogleApiError(e, next);
  }
});

export default router;
