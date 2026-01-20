# gsheet-api

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/melalj/gsheet-api)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-available-blue.svg)](https://hub.docker.com/r/melalj/gsheet-api)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> A lightweight REST API microservice that turns Google Sheets into a backend database with full CRUD operations.

Use Google Spreadsheets as a simple database for your applications. Perfect for prototypes, small projects, internal tools, and MVPs where you need a quick backend without setting up a full database.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/melalj/gsheet-api)

[![dockeri.co](https://dockeri.co/image/melalj/gsheet-api)](https://hub.docker.com/r/melalj/gsheet-api)

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker (Recommended)](#docker-recommended)
  - [Heroku](#heroku)
  - [Local Development](#local-development)
- [Configuration](#configuration)
  - [Google Cloud Setup](#google-cloud-setup)
  - [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
  - [List Spreadsheets](#list-spreadsheets)
  - [List Sheets](#list-sheets)
  - [Query Data](#query-data)
  - [Get Single Row](#get-single-row)
  - [Insert Rows](#insert-rows)
  - [Update Rows](#update-rows)
  - [Delete Rows](#delete-rows)
  - [Health Check](#health-check)
- [Security](#security)
- [Rate Limits & Quotas](#rate-limits--quotas)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Full CRUD Operations** - Create, Read, Update, and Delete data in Google Sheets via REST API
- **Pagination Support** - Built-in pagination for large datasets
- **Dynamic Columns** - Automatically adds new columns when inserting data with new fields
- **Smart Type Detection** - Automatically converts values to appropriate types (boolean, integer, float)
- **Multiple Deployment Options** - Deploy via Docker, Heroku, or run locally
- **API Key Protection** - Secure your endpoints with API key authentication
- **Health Checks** - Built-in health check endpoints for monitoring
- **Lightweight** - Minimal dependencies, fast startup time

---

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** >= 18.0.0 (for local development)
- **Docker** (for containerized deployment)
- **Google Cloud Platform Account** with:
  - Google Sheets API enabled
  - Google Drive API enabled
  - Service Account with JSON credentials

---

## Installation

### Docker (Recommended)

The fastest way to get started is using Docker:

```bash
# Pull and run the container
docker run -p 8080:80 -e GOOGLE_CREDENTIALS=$GOOGLE_CREDENTIALS melalj/gsheet-api

# With API key protection
docker run -p 8080:80 \
  -e GOOGLE_CREDENTIALS=$GOOGLE_CREDENTIALS \
  -e PRIVATE_API_KEY=your-secret-key \
  melalj/gsheet-api
```

### Heroku

Deploy instantly with one click:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/melalj/gsheet-api)

Set the `GOOGLE_CREDENTIALS` config var in your Heroku app settings.

### Local Development

```bash
# Clone the repository
git clone https://github.com/melalj/gsheet-api.git
cd gsheet-api

# Install dependencies
npm install

# Create .env file with your credentials (see Configuration section)
cp .env.example .env

# Start the server
npm start
```

The API will be available at `http://localhost:80/` (customize with `PORT` environment variable).

---

## Configuration

### Google Cloud Setup

1. **Create a Service Account**
   - Go to the [Service Accounts page](https://console.cloud.google.com/iam-admin/serviceaccounts) in Google Cloud Console
   - Select your project (or create a new one)
   - Click **Create Service Account**
   - Enter a name and description
   - Grant the role **Editor** (or appropriate permissions)
   - Click **Done**

2. **Generate JSON Key**
   - Click on the created service account
   - Go to the **Keys** tab
   - Click **Add Key** > **Create new key**
   - Select **JSON** format
   - Download and save as `credentials.json`

3. **Enable Required APIs**
   - [Enable Google Drive API](https://console.developers.google.com/apis/api/drive.googleapis.com/overview)
   - [Enable Google Sheets API](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview)

4. **Generate Base64 Credentials**
   ```bash
   # On Linux/macOS
   export GOOGLE_CREDENTIALS=$(base64 -w 0 credentials.json)

   # On macOS (alternative)
   export GOOGLE_CREDENTIALS=$(base64 credentials.json)

   # On Windows (PowerShell)
   $GOOGLE_CREDENTIALS = [Convert]::ToBase64String([IO.File]::ReadAllBytes("credentials.json"))
   ```

5. **Share Your Spreadsheet**
   - Open your Google Spreadsheet
   - Click **Share**
   - Add the service account email (found in `credentials.json` as `client_email`)
   - Grant **Editor** access

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CREDENTIALS` | Yes | - | Base64-encoded Google service account JSON credentials |
| `PORT` | No | `80` | Port number for the server |
| `HOST` | No | `0.0.0.0` | Host address to bind to |
| `PRIVATE_API_KEY` | No | - | API key for `X-Private-Api-Key` header authentication |
| `PRIVATE_API_KEY_QUERY` | No | - | API key for `?key=` query string authentication |
| `NODE_ENV` | No | - | Set to `production` for production mode |

#### Example `.env` file

```env
GOOGLE_CREDENTIALS=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
PORT=3000
PRIVATE_API_KEY=your-secret-api-key
NODE_ENV=production
```

---

## API Reference

### List Spreadsheets

Returns all spreadsheets accessible by the service account.

```http
GET /
```

#### Response

```json
[
  {
    "id": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "name": "My Spreadsheet",
    "modifiedTime": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### List Sheets

Returns all sheets within a spreadsheet.

```http
GET /:spreadsheetId
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet (from URL) |

#### Response

```json
[
  {
    "title": "Sheet1",
    "sheetId": 0,
    "rowCount": 1000,
    "columnCount": 26
  },
  {
    "title": "Sheet2",
    "sheetId": 123456789,
    "rowCount": 500,
    "columnCount": 10
  }
]
```

---

### Query Data

Retrieves data from a specific sheet with pagination support.

```http
GET /:spreadsheetId/:sheetName
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet |
| `sheetName` | string | The name of the sheet |

#### Query Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `perPage` | integer | `1000` | Number of rows per page |
| `offset` | integer | `2` | Starting row number (row 1 is headers) |
| `maxColumns` | integer | `109` | Maximum number of columns to read |
| `returnColumn` | string | - | Return only a specific column |

#### Response

```json
{
  "columns": {
    "name": "Sheet1!A",
    "email": "Sheet1!B",
    "age": "Sheet1!C"
  },
  "pagination": {
    "haveNext": true,
    "totalItems": 2500,
    "range": "Sheet1!A2:DD1001"
  },
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "age": 25
    }
  ]
}
```

---

### Get Single Row

Retrieves a specific row by row number.

```http
GET /:spreadsheetId/:sheetName/:rowNumber
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet |
| `sheetName` | string | The name of the sheet |
| `rowNumber` | integer | The row number to retrieve |

#### Response

```json
{
  "rowNumber": 3,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "age": 25
}
```

---

### Insert Rows

Appends new rows to a sheet. Automatically creates new columns if fields don't exist.

```http
POST /:spreadsheetId/:sheetName
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet |
| `sheetName` | string | The name of the sheet |

#### Query Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `valueInputOption` | string | `USER_ENTERED` | How input is interpreted: `RAW` or `USER_ENTERED` |

#### Request Body

```json
[
  { "name": "Alice", "email": "alice@example.com", "age": 28 },
  { "name": "Bob", "email": "bob@example.com", "age": 32 }
]
```

#### Response

```json
{
  "insertedRows": 2
}
```

---

### Update Rows

Updates specific rows in a sheet. Automatically creates new columns if fields don't exist.

```http
PUT /:spreadsheetId/:sheetName
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet |
| `sheetName` | string | The name of the sheet |

#### Query Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `valueInputOption` | string | `USER_ENTERED` | How input is interpreted: `RAW` or `USER_ENTERED` |

#### Request Body

Object where keys are row numbers and values are the fields to update:

```json
{
  "3": { "email": "newemail@example.com" },
  "5": { "name": "Updated Name", "age": 35 }
}
```

#### Response

```json
[
  {
    "spreadsheetId": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "updatedRange": "Sheet1!B3",
    "updatedRows": 1,
    "updatedColumns": 1,
    "updatedCells": 1
  },
  {
    "spreadsheetId": "1MNXlNRwbUo4-qbTCdBZGW3Q8sq7pUDov-2ElTFOA0wo",
    "updatedRange": "Sheet1!A5:C5",
    "updatedRows": 1,
    "updatedColumns": 2,
    "updatedCells": 2
  }
]
```

---

### Delete Rows

Deletes specific rows from a sheet.

```http
DELETE /:spreadsheetId/:sheetName
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| `spreadsheetId` | string | The ID of the spreadsheet |
| `sheetName` | string | The name of the sheet |

#### Request Body

Array of row numbers to delete:

```json
[3, 5, 7]
```

#### Response

```json
{
  "deletedRows": 3
}
```

---

### Health Check

Check if the API is running.

```http
GET /health
GET /~health
```

#### Response

```json
{
  "status": "ok"
}
```

---

## Security

### API Key Authentication

Protect your endpoints using one of the following methods:

#### Header-based Authentication

Set the `PRIVATE_API_KEY` environment variable and include the key in requests:

```bash
curl -H "X-Private-Api-Key: your-secret-key" http://localhost:8080/
```

#### Query String Authentication

Set the `PRIVATE_API_KEY_QUERY` environment variable and include the key in the URL:

```bash
curl "http://localhost:8080/?key=your-secret-key"
```

### Best Practices

1. **Always use HTTPS** in production
2. **Use strong, random API keys** (at least 32 characters)
3. **Limit service account permissions** to only necessary spreadsheets
4. **Regularly rotate credentials** and API keys
5. **Monitor API usage** for suspicious activity

---

## Rate Limits & Quotas

This API is subject to [Google Sheets API quotas](https://developers.google.com/sheets/api/limits):

| Limit | Value |
|-------|-------|
| Requests per project | 500 per 100 seconds |
| Requests per user | 100 per 100 seconds |
| Daily usage limit | None |

**Note:** Read and write operations have separate quotas.

### Recommendations

- Implement caching for frequently accessed data
- Use batch operations when possible
- Consider rate limiting on your end for high-traffic applications
- Monitor your Google Cloud Console for quota usage

---

## Examples

### JavaScript (fetch)

```javascript
// List all spreadsheets
const response = await fetch('http://localhost:8080/', {
  headers: {
    'X-Private-Api-Key': 'your-api-key'
  }
});
const spreadsheets = await response.json();

// Get data from a sheet
const data = await fetch(
  'http://localhost:8080/SPREADSHEET_ID/Sheet1?perPage=100'
).then(r => r.json());

// Insert new rows
await fetch('http://localhost:8080/SPREADSHEET_ID/Sheet1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Private-Api-Key': 'your-api-key'
  },
  body: JSON.stringify([
    { name: 'New User', email: 'user@example.com' }
  ])
});
```

### cURL

```bash
# List spreadsheets
curl -H "X-Private-Api-Key: your-key" http://localhost:8080/

# Get data with pagination
curl "http://localhost:8080/SPREADSHEET_ID/Sheet1?perPage=50&offset=2"

# Insert data
curl -X POST http://localhost:8080/SPREADSHEET_ID/Sheet1 \
  -H "Content-Type: application/json" \
  -d '[{"name": "Test", "email": "test@example.com"}]'

# Update data
curl -X PUT http://localhost:8080/SPREADSHEET_ID/Sheet1 \
  -H "Content-Type: application/json" \
  -d '{"3": {"name": "Updated Name"}}'

# Delete rows
curl -X DELETE http://localhost:8080/SPREADSHEET_ID/Sheet1 \
  -H "Content-Type: application/json" \
  -d '[3, 4, 5]'
```

### Python

```python
import requests

BASE_URL = 'http://localhost:8080'
HEADERS = {'X-Private-Api-Key': 'your-api-key'}

# Get all spreadsheets
spreadsheets = requests.get(BASE_URL, headers=HEADERS).json()

# Get data from sheet
data = requests.get(
    f'{BASE_URL}/SPREADSHEET_ID/Sheet1',
    params={'perPage': 100},
    headers=HEADERS
).json()

# Insert rows
requests.post(
    f'{BASE_URL}/SPREADSHEET_ID/Sheet1',
    json=[{'name': 'Alice', 'email': 'alice@example.com'}],
    headers=HEADERS
)
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [Google Sheets API](https://developers.google.com/sheets/api)
- Inspired by the need for simple, quick backends

---

Made with love by [melalj](https://github.com/melalj) and [contributors](https://github.com/melalj/gsheet-api/graphs/contributors)
