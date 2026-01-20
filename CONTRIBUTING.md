# Contributing to gsheet-api

First off, thank you for considering contributing to gsheet-api! It's people like you that make this project better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gsheet-api.git
   cd gsheet-api
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/melalj/gsheet-api.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/melalj/gsheet-api/issues) to see if the problem has already been reported.

When creating a bug report, please include:

- **A clear and descriptive title**
- **Steps to reproduce the issue**
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Environment details**:
  - Node.js version (`node --version`)
  - Operating system
  - Docker version (if applicable)
- **Error messages** - Include full stack traces if available
- **Screenshots** - If applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **A clear and descriptive title**
- **Detailed description** of the proposed enhancement
- **Use case** - Explain why this enhancement would be useful
- **Possible implementation** - If you have ideas on how to implement it
- **Examples** - If applicable, provide examples of how the feature would work

### Pull Requests

1. **Ensure your code follows the style guidelines**
2. **Update documentation** if you're changing functionality
3. **Add tests** for new features when possible
4. **Ensure all tests pass**
5. **Keep pull requests focused** - One feature or fix per PR

#### Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md with a note describing your changes
3. The PR will be merged once you have the sign-off of a maintainer

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm
- A Google Cloud Platform account with Sheets and Drive APIs enabled

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Set up your Google credentials (see [README.md](README.md#google-cloud-setup) for details)

3. Start the development server:
   ```bash
   npm start
   ```

### Project Structure

```
gsheet-api/
├── index.js              # Entry point
├── src/
│   ├── index.js          # Server startup
│   ├── utils.js          # Utility functions
│   └── api/
│       ├── index.js      # Express app & middleware
│       └── gsheet.js     # Route handlers
├── package.json
├── Dockerfile
└── README.md
```

## Style Guidelines

### JavaScript Style Guide

This project uses ESLint with the Airbnb base configuration. Run the linter before submitting:

```bash
npm run lint
```

Key style points:

- **Use ES6+ features** - Arrow functions, template literals, destructuring, etc.
- **Use meaningful variable names** - Be descriptive
- **Keep functions small** - Each function should do one thing
- **Add comments for complex logic** - But prefer self-documenting code
- **No trailing whitespace**
- **Use single quotes** for strings
- **End files with a newline**

### Example

```javascript
// Good
const getUserData = async (userId) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Sheet1!A${userId}:Z${userId}`,
  });
  return response.data.values[0];
};

// Avoid
async function getUserData(userId) {
  var response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A" + userId + ":Z" + userId
  })
  return response.data.values[0]
}
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples

```
feat(api): add pagination support for list endpoints

fix(auth): handle expired credentials gracefully

docs: update API reference with new parameters

chore: upgrade googleapis to v133
```

## Testing

Currently, the project has minimal test coverage. We welcome contributions to improve testing!

### Running Tests

```bash
npm test
```

### Writing Tests

When adding new features, consider adding tests that cover:

- **Happy path** - The feature works as expected
- **Edge cases** - Empty inputs, large datasets, etc.
- **Error handling** - Invalid inputs, API failures, etc.

## Questions?

Feel free to open an issue with your question or reach out to the maintainers. We're happy to help!

---

Thank you for contributing!
