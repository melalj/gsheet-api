# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-01-15

### Changed
- Updated Node.js to version 20.11 in Docker image
- Updated googleapis to version 133.0.0
- Updated all dependencies to latest versions

### Fixed
- Fixed tag name for Docker builds
- Using multi-arch build for Docker images

## [1.1.0] - Previous Release

### Added
- Health check endpoints (`/health` and `/~health`)
- API key authentication via header and query string
- Pagination support for data queries
- Dynamic column creation on insert/update

### Changed
- Improved error handling
- Better type detection for values

## [1.0.0] - Initial Release

### Added
- Initial release of gsheet-api
- Full CRUD operations for Google Sheets
- Docker support
- Heroku deployment support
- Express.js based REST API
- Google Sheets API v4 integration
- Google Drive API v3 integration for listing spreadsheets
