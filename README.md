# Areas GitHub Action

[![CI](https://github.com/coveooss/areas/actions/workflows/ci-build.yml/badge.svg)](https://github.com/coveooss/areas/actions/workflows/ci-build.yml)

Declare "Areas" of your repository: logical portions of the codebase defined by file patterns.

Use those areas to:

1.  **Enforce Review Rules:** Automatically configure [GitHub Repository Rulesets to require team reviews](https://github.com/orgs/community/discussions/178776).
2.  **Label Pull Requests:** Automatically apply `area:<name>` and `team:<slug>` labels to PRs based on changed files.

## Why

- Supports **blocking** and **request-only** reviewers per area, and supports bypass rules for specific teams.
- **Additive:** Multiple rules can match the same file; all reviewers are added.
- **Components first:** The semantics is first on the component, not the team. Teams change over time, but components are more stable.
- **Co-ownership:** Components can have multiple stewards.
- **Transparency & discoverability:** Components, reviewers, and bypass rules are visible to every team, increasing trust and speeding reviewer discovery.
- **Reusability:** Shared open tool and `.areas` patterns encourage consistent ownership semantics across repos & teams.

## Quick Start

1. Create a `.areas/` directory in your repository
2. Add area configuration files (see [Configuration](#configuration))
3. Set up the GitHub workflows (see [Usage](#usage))

## Configuration

Areas are defined as YAML files in the `.areas/` directory.

**Example:**

```yaml
# .areas/documentation.yaml

file_patterns:
  - "docs/**"
  - "**/.md"

reviewers:
  doc-writer:
    minimum_approvals: 1  # Blocking
  qa-team:
    minimum_approvals: 0  # Request Only (Non-blocking)

review_bypass:
  docs-admins: always  # Can bypass these rules (always, pull_request, or exempt)
```

### File patterns

`file_patterns` is based on Ruby's [`File.fnmatch`](https://apidock.com/ruby/v2_4_6/File/fnmatch/class) with the `File::FNM_PATHNAME | File::FNM_DOTMATCH` flags, but no other.

See [GitHub's documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#using-fnmatch-syntax) and [this test for examples](./test/file_patterns.test.rb)


## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `token` | GitHub Token (PAT with `administration:write`, `members:read`, `contents:read`, `pull_requests:write`, `issues:write`). | `true` | N/A |
| `command` | The mode to run: `ruleset-sync` or `label-pr`. | `true` | N/A |
| `working-directory` | Path containing the `.areas` folder. | `false` | `.` |

## Usage

### 1. Sync Rulesets (on Push)

Keeps GitHub Rulesets in sync with your `.areas/*.yaml` configuration when pushed to `main`.

```yaml
# .github/workflows/areas-ruleset-sync.yml
name: Sync Area Rulesets

on:
  push:
    branches: [main]
    paths: ['.areas/**']

permissions:
  contents: read # minimum permission to checkout the repo such that .areas can be parsed.

jobs:
  label-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6
        with:
          sparse-checkout: .areas # Only needs access to the configuration

      - uses: coveooss/areas@v0 # REPLACE ME
        with:
          token: ${{ secrets.TOKEN }}
          command: ruleset-sync
```

Required permissions:
- Repository: Admin write

Under the hood, it uses the [update ruleset API](https://docs.github.com/en/rest/repos/rules?apiVersion=2022-11-28#update-a-repository-ruleset), hence the admin permission.

### 2. Auto-Label PRs

Labels PRs with affected areas and teams.

This is completely optional and is only meant to be helpful to the users.

```yaml
# .github/workflows/areas-label-pr.yml

name: Label PR with Areas

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read # minimum permission to checkout the repo such that .areas can be parsed.

jobs:
  label-pr:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@8e8c483db84b4bee98b60c0593521ed34d9990e8 # v6
        with:
          sparse-checkout: .areas # Only needs access to the configuration

      - uses: coveooss/areas@v0 # REPLACE ME
        with:
          token: ${{ secrets.TOKEN }}
          command: label-pr
```

Required permissions of the `TOKEN`:
- Repository: Pull Requests: `write`
- Organization: Members: `read`

Under the hood, it needs to convert the team name to a team ID, hence the Organization Members permission.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

For AI coding assistants, see [AGENTS.md](AGENTS.md) for codebase context.

## License

[Apache License 2.0](LICENSE)
