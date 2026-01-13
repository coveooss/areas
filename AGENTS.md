# AI Agents Guide

This document provides context for AI coding assistants (GitHub Copilot, Cursor, Claude, etc.) working on this codebase.

## Project Overview

**Areas** is a GitHub Action that manages code ownership and review requirements based on "areas" - logical portions of a codebase defined by file patterns.

### What it Does

1. **Ruleset Sync:** Creates/updates GitHub Repository Rulesets to enforce team review requirements
2. **Label PRs:** Automatically labels pull requests with `area:<name>` and `team:<slug>` based on changed files

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 20 |
| Language | TypeScript 5.x (strict mode) |
| Package Manager | pnpm 10.x |
| Build | @vercel/ncc (bundles to single file) |
| Testing | Vitest |
| Linting/Formatting | Biome |
| Git Hooks | Husky |
| Versioning | Changesets |
| GitHub | @actions/core, @actions/github |

## Architecture

```
src/
├── action.ts              # Entry point - reads inputs, dispatches commands
├── types.ts               # Shared TypeScript interfaces (Octokit, AreaConfig, etc.)
├── commands/
│   ├── label-pr.ts        # Labels PRs based on file changes
│   └── ruleset-sync.ts    # Syncs rulesets with .areas/ config
├── configuration-reader.ts # Parses .areas/*.yml files
├── label-manager.ts       # Creates/updates PR labels
├── path-matcher.ts        # Matches files against patterns (fnmatch-style)
├── payload-generator.ts   # Generates GitHub Ruleset API payloads
├── ruleset-manager.ts     # CRUD operations for GitHub Rulesets
└── team-resolver.ts       # Resolves team slugs to numeric IDs
```

## Key Types (src/types.ts)

```typescript
interface AreaConfig {
  name: string;
  file_patterns: string[];
  reviewers?: ReviewerConfig;
  review_bypass?: BypassConfig;
}

interface ReviewerConfig {
  [teamSlug: string]: { team_id: number; minimum_approvals: number };
}

interface BypassConfig {
  [teamSlug: string]: { team_id: number; mode: "always" | "pull_request" };
}
```

## Testing Conventions

- **Unit tests:** Co-located with source files (`*.test.ts` next to `*.ts`)
- **E2E tests:** Located in `tests/e2e/`
- **Mocking:** Use `vi.mock()` for module mocks, `vi.fn()` for function mocks
- **Run:** `pnpm test` or `pnpm test:watch`

## Common Tasks

### Adding a New Feature

1. Update types in `src/types.ts` if needed
2. Implement in appropriate module
3. Add unit tests next to the source file
4. Update `payload-generator.ts` if it affects rulesets
5. Run `pnpm test && pnpm build`

### Modifying Configuration Parsing

- Edit `src/configuration-reader.ts`
- Configuration files are YAML in `.areas/` directory
- Update `RawConfig` interface for new fields

### Changing Ruleset Behavior

- Edit `src/payload-generator.ts` for payload structure
- Edit `src/ruleset-manager.ts` for API calls
- GitHub API requires specific literal types (see `RulesetPayload` in types.ts)

### Adding a New Command

1. Create `src/commands/new-command.ts`
2. Add to switch in `src/action.ts`
3. Update `action.yml` input documentation

## Important Patterns

### GitHub API Types

The GitHub API expects specific literal types, not generic strings:
```typescript
// ✅ Correct
target: "branch" as const
enforcement: "active" as const
type: "pull_request" as const

// ❌ Wrong - TypeScript will error
target: "branch"  // inferred as string
```

### Error Handling

```typescript
try {
  // ...
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : String(error));
}
```

### File Pattern Matching

Uses fnmatch-style patterns with `minimatch`:
- `**/*.ts` - All TypeScript files
- `src/**` - Everything under src/
- `docs/*.md` - Markdown files directly in docs/

## Build & Release

- **Build:** `pnpm build` → outputs `dist/index.js`
- **Pre-commit hook:** Runs Biome + build, stages `dist/`
- **Versioning:** Use `pnpm changeset` for changes
- **CI:** Tests run on every PR

## Files to Know

| File | Purpose |
|------|---------|
| `action.yml` | GitHub Action manifest |
| `biome.json` | Linting/formatting config |
| `.changeset/config.json` | Changesets config |
| `vitest.config.ts` | Unit test config |
| `vitest.e2e.config.ts` | E2E test config |
| `.husky/pre-commit` | Pre-commit hook script |
