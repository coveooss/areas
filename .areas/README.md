# Areas Configuration

This directory contains configuration files for Repository Areas.

Each YAML file defines a "area" of the codebase and the review requirements for it.

**Example:**

```yaml
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

For full documentation on how this works and available options, see [`coveo/areas`](https://github.com/coveo/areas).
