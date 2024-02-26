# Google Sheets API

A simple implementation for Google Spreadsheets to use a micro service with your stack.

This allow you to use Google Spreadsheets as a backend.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/melalj/gsheet-api)

[![dockeri.co](https://dockeri.co/image/melalj/gsheet-api)](https://hub.docker.com/r/melalj/gsheet-api)

## Get started

### Create a user and load credentials

- Open the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts) in the Cloud Console.
- Click Select a project, choose your project, and click Open.
- Click Create Service Account.
- Enter a service account name (friendly display name), an optional description, select a role you wish to grant to the service account, and then click Save.
- Download the JSON Key, rename it to `credentials.json`
- [Enable Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com/overview) for your project
- [Enable Sheets API](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview) for your project
- On terminal, run the following command to get the environment variable to use with gsheet-api:

```sh
GOOGLE_CREDENTIALS=`base64 credentials.json`
```

### Add service Account to your Drive folder/sheets

You can add the email that was generated with the service account as an editor to a folder on Google Drive or on a Google Sheet.

### Start API

- Follow instructions above to create the credentials json file
- Clone this repo

```sh
git clone git@github.com:melalj/gsheet-api.git
```

- Use docker to load the API

```sh
docker run -p 8080:80 -e GOOGLE_CREDENTIALS=$GOOGLE_CREDENTIALS melalj/gsheet-api
```

- You can also [deploy it on Heroku](https://heroku.com/deploy?template=https://github.com/melalj/gsheet-api) and set the config vars (GOOGLE_CREDENTIALS)

- start it locally

```sh
npm install
# You can add your environement variables in a .env file
npm start
# the api will be available on http://localhost:80/
# You can customize the port with the environmenet variable PORT
```

## API endpoints

### `GET /`

Lists all available Spreadsheets from your Google Drive

### Example

- Request: `GET /`
- Result:

```json
[
  {
    "id": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "name": "Leads",
    "modifiedTime": "2020-04-24T13:36:53.699Z"
  }
]
```

### `GET /:sheetId`

Lists all available Sheets from your spreadsheet.

### Example

- Request: `GET /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo`
- Result:

```json
[
  {
    "title": "Sheet1",
    "sheetId": 4543532,
    "rowNumber": 0,
    "rowCount": 2,
    "columnCount": 2,
  }
]
```

### `GET /:sheetId/:sheetName`

Query data from a sheet

### Example

- Query: `GET /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo/Sheet1`
- Result:

```json
  {
    "columns": {
      "name": "Sheet1!A",
      "email": "Sheet1!B"
    },
    "pagination": {
      "haveNext": false,
      "totalItems": 2,
      "range": "Sheet1!A2:DD1001"
    },
    "data": [
      {
        "name": "Simo",
        "email": "simo@appleseed.com"
      },
      {
        "name": "Jane",
        "email": "jane@appleseed.com"
      }
    ]
  }
```

#### Query Strings

| Name | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| perPage | integer | No | How many items per page (default: 1000) |
| offset | integer | No | Query data from a specific row (default: 2) |
| maxColumns | integer | No | Number of colums in the sheet (default: 109) |
| returnColumn | string | No | Returns only one specific |

### `POST /:sheetId/:sheetName`

Append rows to a sheet.
If a column doesn't exists, it will be added on the right of the table.
You can you the query string [valueInputOption=RAW](https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption) to determine how input data should be interpreted.

### Example

- Request: `POST /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo/Sheet1`
- Body: `[{ "name": "Jean", "email": "jean@appleseed.com" }, { "name": "Bunny", "email": "bunny@appleseed.com" }, ]`
- Result: `{"insertedRow": 2}`

### `GET /:sheetId/:sheetName/:rowNumber`

Query a specific row from a sheet

### Example

- Request: `GET /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo/Sheet1/3`
- Result: `{"rowNumber": 3, "name": "Jane", "email": "john@appleseed.com"}`

### `PUT /:sheetId/:sheetName`

Update rows in a sheet.
If a column doesn't exists, it will be added on the right of the table.

You can you the query string [valueInputOption=RAW](https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption) to determine how input data should be interpreted.

### Example

- Request: `PUT /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo/Sheet1`
- Body: `{ "4" : { "email": "john@appleseed.com" }, "1": { "phone": "415-500-7000" } }`
- Result:

```json
[
  {
    "spreadsheetId": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "updatedRange": "Sheet1!B4",
    "updatedRows": 1,
    "updatedColumns": 1,
    "updatedCells": 1
  },
  {
    "spreadsheetId": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "updatedRange": "Sheet1!C1",
    "updatedRows": 1,
    "updatedColumns": 1,
    "updatedCells": 1
  }
]
```

### `DELETE /:sheetId/:sheetName`

Delete rows from a sheet

### Example

- Request: `Delete /1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo/Sheet1`
- Body: `[4, 5]`
- Result: `{ "deletedRows": 2 }`

## Secure your endpoints

You can secure these endpoints with either:

- `X-Private-Api-Key` header: You need to set the environement variable `PRIVATE_API_KEY`
- `key` query string: You need to set the environement variable `PRIVATE_API_KEY_QUERY`

## Limitations and Quota

[Following Google Sheets API documentation](https://developers.google.com/sheets/api/limits). This version of the Google Sheets API has a limit of 500 requests per 100 seconds per project, and 100 requests per 100 seconds per user. Limits for reads and writes are tracked separately. There is no daily usage limit.

Be mindful about this limitation, if you want to use this api as a backend for your frontend!

## Contribute

You are welcomed to fork the project and make pull requests. Or just file an issue or suggestion 😊
