---
"areas": minor
---

Add support for multiple bypass actor types in `review_bypass` configuration.

- Support `team/`, `role/`, and `integration/` prefixes for bypass actors
- Default to team when no prefix is provided (e.g., `docs-admins` is equivalent to `team/docs-admins`)
