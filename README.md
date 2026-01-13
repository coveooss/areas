# Areas GitHub Action

This action manages "Areas" of your repository—logical portions of the codebase defined by file patterns (e.g., "Atomic", "Documentation"). 

It uses these areas to:

1.  **Enforce Review Rules:** Automatically configure GitHub Repository Rulesets to require team reviews.
2.  **Label Pull Requests:** Automatically apply `area:<name>` and `team:<slug>` labels to PRs based on changed files.

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
| `command` | The mode to run: `ruleset-sync` or `label-pr`. | `false` | `ruleset-sync` |
| `working-directory` | Path containing the `.areas` folder. | `false` | `.` |

## Usage

### 1. Sync Rulesets (on Push)

Keeps GitHub Rulesets in sync with your `.areas/*.yaml` configuration when pushed to `main`.

See [`.github/workflows/areas-ruleset-sync.yml`](/.github/workflows/areas-ruleset-sync.yml)

### 2. Auto-Label PRs

Labels PRs with affected areas and teams.

See [`.github/workflows/areas-label-pr.yml`](/.github/workflows/areas-label-pr.yml)

## Why rulesets?

*   **Granularity:** More flexible than `CODEOWNERS`.
*   **Request Only:** `minimum_approvals: 0` allows notifying teams without blocking merges.
*   **Additive:** Multiple rules can match the same file; all reviewers are added.

See this [discussion announcement](https://github.com/orgs/community/discussions/178776).

## Why Areas?

*   **Components first:** The semantics is first on the component, not the team.
*   **Co-ownerships:** Components can have multiple stewards.
*   **Long-lived:** Teams change over time, but components are more stable.
