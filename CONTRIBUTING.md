# Contributing to Areas

Thank you for your interest in contributing to Areas! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- pnpm 10.x

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/coveo/areas.git
   cd areas
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run tests to verify setup:
   ```bash
   pnpm test
   ```

## Development Workflow

### Available Scripts

See [`package.json`](./package.json).

### Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. The pre-commit hook automatically runs Biome on staged files.

- **Indentation:** Tabs
- **Quotes:** Double quotes
- **Imports:** Automatically organized

### Testing

Tests are written with [Vitest](https://vitest.dev/). We follow these conventions:

- **Unit tests:** Located next to source files (`src/*.test.ts`)
- **E2E tests:** Located in `tests/e2e/`

Run tests before submitting a PR:
```bash
pnpm test
```

### Project Structure

```
src/
├── action.ts           # Entry point
├── types.ts            # Shared TypeScript interfaces
├── commands/           # Action commands (label-pr, ruleset-sync)
├── *.ts                # Core modules (configuration, labels, rulesets, etc.)
└── *.test.ts           # Unit tests (co-located with source)
fixtures/               # Test fixtures (JSON data files)
tests/
└── e2e/                # End-to-end tests
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Your Changes

- Write tests for new functionality
- Ensure all tests pass: `pnpm test`
- Ensure linting passes: `pnpm lint`
- Build the action: `pnpm build`

### 3. Create a Changeset

We use [Changesets](https://github.com/changesets/changesets) to manage versioning. After making changes, create a changeset:

```bash
pnpm changeset
```

Follow the prompts to:
1. Select the type of change (major, minor, patch)
2. Write a summary of your changes

This creates a markdown file in `.changeset/` that should be committed with your PR.

### 4. Commit and Push

The pre-commit hook will automatically:
- Run Biome to lint and format staged files
- Build the action and stage `dist/`

```bash
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### 5. Open a Pull Request

Open a PR against the `main` branch. The CI will run tests and linting.

## Versioning

When PRs with changesets are merged to `main`, a "Release" PR is automatically created that:
- Bumps the version in `package.json`
- Updates the changelog
- Consolidates all changesets

Merging the Release PR publishes the new version.

## Git Hooks

This project uses [Husky](https://typicode.github.io/husky/) for Git hooks:

- **pre-commit:** Runs Biome on staged files and builds the action

## Questions?

If you have questions, feel free to open an issue or discussion.
